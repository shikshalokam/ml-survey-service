const { isEmpty, has } = require("lodash");
const {
  createProgram,
  updateProgram,
  publishProgram,
  nominateProgram,
  updateContributorToProgram,
} = require("../../api-list/program");
const logger = require("../../logger");
const {
  getContributorAndSrcAdminData,
  updateCsvFile,
} = require("../helpers/csvHelper");
const { updateSolutionById } = require("../helpers/questionsetHelper");

const getDate = (increment) => {
  const d = new Date(
    new Date().setDate(new Date().getDate() + increment)
  ).toISOString();

  return d;
};

const createProgramTemplate = async (solution, program_id, migratedCount) => {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUNE", "JULY", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const month = months[new Date().getMonth()];
  const day = new Date().getDate();
  const year = new Date().getFullYear();
  let userData = await getContributorAndSrcAdminData(solution, program_id);

  userData = {
    ...userData,
    srcOrgAdmin: {
      ...userData?.srcOrgAdmin,
      solutionId: solution?._id.toString(),
      solutionName: solution?.name
    }
  }

  if (!userData?.srcOrgAdmin) {
    return;
  }
  if (has(solution, 'migrationReference')) {
    solution.migrationReference.sourcingProgramId = !isEmpty(userData?.srcOrgAdmin?.programId) ? userData?.srcOrgAdmin?.programId.trim() : solution?.migrationReference?.sourcingProgramId;
  } else {
    const programId = userData?.srcOrgAdmin?.programId  ? userData?.srcOrgAdmin?.programId.trim() : solution?.migrationReference?.sourcingProgramId;
    solution = {
      ...solution,
      migrationReference:{
        sourcingProgramId: programId
      }
    }
  }

  const id = `${solution._id}`;
  const userId = userData?.srcOrgAdmin
    ? userData?.srcOrgAdmin?.srcOrgAdminId
    : process.env.DEFAULT_SRC_ORG_ADMIN_TO_CREATE_PROGRAM;
  const rootOrgId = userData?.srcOrgAdmin
    ? userData?.srcOrgAdmin?.rootOrgId
    : process.env.DEFAULT_SRC_ORG_ADMIN_ROOT_ORG_ID;

  const template = {
    name: `MIGRATED ${month} ${day} ${year} ${solution?.name} sourcing project`,
    description: `${solution?.name} sourcing project description`,
    nomination_enddate: `${getDate(1)}`,
    rewards: null,
    shortlisting_enddate: `${getDate(1)}`,
    enddate: `${getDate(2)}`,
    content_submission_enddate: `${getDate(1)}`,
    type: "public",
    target_type: "searchCriteria",
    content_types: [],
    target_collection_category: [],
    sourcing_org_name:
      userData?.srcOrgAdmin?.rootOrgName ||
      process.env.DEFAULT_USER_SRC_ORG_NAME_TO_CREATE_PROGRAM,
    rootorg_id: rootOrgId,
    createdby: userId,
    createdOn: `${getDate(0)}`,
    startdate: `${getDate(1)}`,
    slug: process.env.DEFAULT_SLUG,
    status: "Draft",
    program_id: "",
    rolemapping: [],
    config: {
      defaultContributeOrgReview: false,
      roles: [
        {
          id: 1,
          name: "CONTRIBUTOR",
          tabs: [1],
          default: true,
          defaultTab: 1,
        },
        {
          id: 2,
          name: "REVIEWER",
          tabs: [2],
          defaultTab: 2,
        },
      ],
    },
  };

  let programId = solution?.migrationReference?.sourcingProgramId;

  let query = {};

  if (!program_id) {
    if (isEmpty(programId)) {
      programId = await createProgram(template).catch((err) => {
        logger.error(`Error while creating program for solution_id: ${
          solution?._id
        } Error:
       ${JSON.stringify(err?.response?.data)}`);
        migratedCount.failed.program.migrated.count++;
        if (!migratedCount.failed.program.migrated.ids.includes(id)) {
          migratedCount.failed.program.migrated.ids.push(id);
        }
      });
      programName = ``
      programId &&
        (await updateCsvFile(
          userData.csvData,
          userData.srcOrgAdmin,
          programId,
          template?.name
        ));
    } else {
      migratedCount.success.program.existing.migrated++;
    }
    if (isEmpty(programId)) {
      return;
    }
    logger.info(
      `Sourcing Program created for solution_id: ${solution?._id} === ${programId}`
    );
    query = { ...query, "migrationReference.sourcingProgramId": programId };
  } else {
    migratedCount.success.program.existing.migrated++;
  }

  if (!solution?.migrationReference?.isSrcProgramUpdated) {
    const update_res = await updateProgramTemplate(programId, solution);
    if (!update_res) {
      migratedCount.failed.program.updated.count++;
      if (!migratedCount.failed.program.updated.ids.includes(id)) {
        migratedCount.failed.program.updated.ids.push(id);
      }
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }
    logger.info(
      `Sourcing Program updated for solution_id: ${solution?._id} === ${programId}`
    );

    query = {
      ...query,
      "migrationReference.isSrcProgramUpdated": true,
    };
  } else {
    migratedCount.success.program.existing.updated++;
  }

  if (!solution?.migrationReference?.isSrcProgramPublished) {
    const pub_res = await publishProgramTemplate(programId, solution?._id, userData.srcOrgAdmin);

    if (!pub_res) {
      migratedCount.failed.program.published.count++;
      if (!migratedCount.failed.program.published.ids.includes(id)) {
        migratedCount.failed.program.published.ids.push(id);
      }
      // updateFailedCount(migratedCount, "published",  solution?._id);
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }
    logger.info(
      `Sourcing Program published for solution_id: ${solution?._id} === ${programId}`
    );

    query = {
      ...query,
      "migrationReference.isSrcProgramPublished": true,
    };
  } else {
    migratedCount.success.program.existing.published++;
  }

  if (!solution?.migrationReference?.isNominated) {
    console.log();
    const res =  await nominateProgram(programId, userData?.srcOrgAdmin).catch(
      (err) => {
        // updateFailedCount(migratedCount, "nominated",  solution?._id);
        migratedCount.failed.program.nominated.count++;
        if (!migratedCount.failed.program.nominated.ids.includes(id)) {
          migratedCount.failed.program.nominated.ids.push(id);
        }
        logger.error(`Error while nominating program for solution_id: ${
          solution?._id
        } Error:
      ${JSON.stringify(err?.response?.data)}`);
      }
    );
    if (!res) {
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }
    logger.info(
      `Sourcing Program nominated for solution_id: ${solution?._id} === ${programId}`
    );

    query = { ...query, "migrationReference.isNominated": true };
  } else {
    migratedCount.success.program.existing.nominated++;
  }

  if (!solution?.migrationReference?.isContributorAdded) {
    const add_contri = {
      program_id: programId,
      user_id:
        userData?.srcOrgAdmin?.contributorOrgAdminId ||
        process.env.DEFAULT_CONTRIBUTOR_ORG_ADMIN_ID,
      rolemapping: {
        CONTRIBUTOR: [
          userData?.mappedUserId ||
            process.env.DEFAULT_CONTRIBUTOR_USER_ID,
        ],
      },
    };

    const update_nom = await updateContributorToProgram(add_contri).catch(
      (err) => {
        migratedCount.failed.program.contributor.count++;
        if (!migratedCount.failed.program.contributor.ids.includes(id)) {
          migratedCount.failed.program.contributor.ids.push(id);
        }
        // updateFailedCount(migratedCount, "contributor",  solution?._id);
        logger.error(`Error while adding contributor program for solution_id: ${
          solution?._id
        } Error:
        ${JSON.stringify(err?.response?.data)}`);
      }
    );

    if (!update_nom) {
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }
    logger.info(
      `Sourcing Program added contributor for solution_id: ${solution?._id} === ${programId}`
    );

    query = { ...query, "migrationReference.isContributorAdded": true };
  } else {
    migratedCount.success.program.existing.contributor++;
  }

  if (!solution?.migrationReference?.isContributorAccepted) {
    const accept_contri = {
      program_id: programId,
      user_id:
        userData?.srcOrgAdmin?.mappedUserId ||
        process.env.DEFAULT_CONTRIBUTOR_ORG_ADMIN_ID,
      status: "Approved",
      updatedby: userId,
    };
    const update_nom =  await updateContributorToProgram(accept_contri).catch(
      (err) => {
        logger.error(`Error while accepting nomination to the program for solution_id: ${
          solution?._id
        } Error:
        ${JSON.stringify(err?.response?.data)}`);
        migratedCount.failed.program.accepted.count++;
        if (!migratedCount.failed.program.accepted.ids.includes(id)) {
          migratedCount.failed.program.accepted.ids.push(id);
        }
        // updateFailedCount(migratedCount, "accepted",  solution?._id);
      }
    );

    if (!update_nom) {
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }
    logger.info(
      `Sourcing Program accepted nomination for solution_id: ${solution?._id} === ${programId}`
    );

    query = { ...query, "migrationReference.isContributorAccepted": true };
  } else {
    migratedCount.success.program.existing.accepted++;
  }

  if (!isEmpty(query)) {
    await updateSolutionDb(query, solution, migratedCount);
  }
  return { programId, contributor: userData?.srcOrgAdmin };
};

const updateSolutionDb = async (query, solution, migratedCount) => {
  const res = await updateSolutionById({
    id: solution._id.toString(),
    query: { ...query },
  }).catch((err) => {
    logger.error(
      `Error while updating program in solutions collection: ${solution?._id} Error: ${err}`
    );
  });

  if (query.hasOwnProperty("migrationReference.sourcingProgramId")) {
    migratedCount.success.program.current.migrated++;
  }
  if (query.hasOwnProperty("migrationReference.isSrcProgramUpdated")) {
    migratedCount.success.program.current.updated++;
  }
  if (query.hasOwnProperty("migrationReference.isSrcProgramPublished")) {
    migratedCount.success.program.current.published++;
  }
  if (query.hasOwnProperty("migrationReference.isNominated")) {
    migratedCount.success.program.current.nominated++;
  }
  if (query.hasOwnProperty("migrationReference.isContributorAdded")) {
    migratedCount.success.program.current.contributor++;
  }
  if (query.hasOwnProperty("migrationReference.isContributorAccepted")) {
    migratedCount.success.program.current.accepted++;
  }
};

const updateProgramTemplate = async (program_id, solution) => {
  const template = {
    config: {
      defaultContributeOrgReview: false,
      roles: [
        {
          id: 1,
          name: "CONTRIBUTOR",
          tabs: [1],
          default: true,
          defaultTab: 1,
        },
        {
          id: 2,
          name: "REVIEWER",
          tabs: [2],
          defaultTab: 2,
        },
      ],
      framework: [process.env.DEFAULT_FRAMEWORK_ID],
      frameworkObj: {
        code: process.env.DEFAULT_FRAMEWORK_ID,
        name: process.env.DEFAULT_FRAMEWORK_NAME,
        type: process.env.DEFAULT_FRAMEWORK_TYPE,
        identifier: process.env.DEFAULT_FRAMEWORK_ID,
      },
      sharedContext: [],
    },
    targetprimarycategories: [
      {
        identifier: "obj-cat:observation_questionset_all",
        name: "Observation",
        targetObjectType: "QuestionSet",
      },
      {
        identifier: "obj-cat:survey_questionset_all",
        name: "Survey",
        targetObjectType: "QuestionSet",
      },
    ],
    targetprimarycategorynames: ["Observation", "Survey"],
    program_id: program_id,
  };

  const upd_res = await updateProgram(template).catch((err) => {
    logger.error(`Error while updating program for solution_id: ${
      solution?._id
    } Error:
      ${JSON.stringify(err?.response?.data)}`);
  });
  return upd_res;
};

const publishProgramTemplate = async (program_id, id, contributor) => {
  const template = {
    channel: process.env.DEFAULT_SLUG,
    program_id: program_id,
  };
  return await publishProgram(template).catch((err) => {
    logger.error(`Error while publishing program for solution_id: ${id} Error:
    ${JSON.stringify(err?.response?.data)}`);
  });
};

module.exports = {
  createProgramTemplate,
  publishProgramTemplate,
};
