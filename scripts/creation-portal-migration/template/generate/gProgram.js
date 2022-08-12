const { isEmpty } = require("lodash");
const {
  createProgram,
  updateProgram,
  publishProgram,
  nominateProgram,
  updateContributorToProgram,
} = require("../../api-list/program");
const { searchUser } = require("../../api-list/user");
const logger = require("../../logger");
const { updateSolutionById } = require("../helpers/questionsetHelper");

const getDate = (increment) => {
  const d = new Date(
    new Date().setDate(new Date().getDate() + increment)
  ).toISOString();

  return d;
};

const createProgramTemplate = async (solution, program_id, migratedCount) => {
  const userData = await searchUser(solution.author);

  const userId =
    userData?.length > 0
      ? solution.author
      : process.env.DEFAULT_USER_ID_TO_CREATE_PROGRAM;
  const rootOrgId =
    userData?.length > 0 ? userData[0]?.rootOrgId : process.env.DEFAULT_CONTRIBUTOR_USER_CHANNEL_ID;

  const template = {
    name: `Migrated ${solution?.name} sourcing project`,
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
    sourcing_org_name: process.env.DEFAULT_USER_SOURCING_ORG_NAME_TO_CREATE_PROGRAM,
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

  let programId = solution.sourcingProgramId;

  let query = {};

  if (!program_id) {
    programId = await createProgram(template).catch((err) => {
      logger.error(`Error while creating program for solution_id: ${
        solution?._id
      } Error:
     ${JSON.stringify(err.response.data)}`);
      migratedCount.failed.program.migrated.count++;
      if (!migratedCount.failed.program.migrated.ids.includes(id)) {
        migratedCount.failed.program.migrated.ids.push(id);
      }
      // updateFailedCount(migratedCount, "migrated", solution?._id);
    });
    if (!programId) {
      return;
    }
    logger.info(
      `Sourcing Program created for solution_id: ${solution?._id} === ${programId}`
    );
    query = { ...query, sourcingProgramId: programId };
  } else {
    migratedCount.success.program.existing.migrated++;
  }

  if (!solution.isSrcProgramUpdated) {
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
      isSrcProgramUpdated: true,
    };
  } else {
    migratedCount.success.program.existing.updated++;
  }

  if (!solution.isSrcProgramPublished) {
    const pub_res = await publishProgramTemplate(programId, solution?._id);

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
      isSrcProgramPublished: true,
    };
  } else {
    migratedCount.success.program.existing.published++;
  }

  if (!solution.isNominated) {
    const res = await nominateProgram(programId, userId).catch((err) => {
      // updateFailedCount(migratedCount, "nominated",  solution?._id);
      migratedCount.failed.program.nominated.count++;
      if (!migratedCount.failed.program.nominated.ids.includes(id)) {
        migratedCount.failed.program.nominated.ids.push(id);
      }
      logger.error(`Error while nominating program for solution_id: ${
        solution?._id
      } Error:
      ${JSON.stringify(err.response.data)}`);
    });
    if (!res) {
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }
    logger.info(
      `Sourcing Program nominated for solution_id: ${solution?._id} === ${programId}`
    );

    query = { ...query, isNominated: true };
  } else {
    migratedCount.success.program.existing.nominated++;
  }

  if (!solution.isContributorAdded) {
    const add_contri = {
      program_id: programId,
      user_id: process.env.DEFAULT_USER_ID_TO_ADD_CONTRIBUTOR,
      rolemapping: {
        CONTRIBUTOR: [process.env.DEFAULT_CONTRIBUTOR_USER_ID],
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
        ${JSON.stringify(err.response.data)}`);
      }
    );

    if (!update_nom) {
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }
    logger.info(
      `Sourcing Program added contributor for solution_id: ${solution?._id} === ${programId}`
    );

    query = { ...query, isContributorAdded: true };
  } else {
    migratedCount.success.program.existing.contributor++;
  }

  if (!solution.isContributorAccepted) {
    const accept_contri = {
      program_id: programId,
      user_id: process.env.DEFAULT_USER_ID_TO_ADD_CONTRIBUTOR,
      status: "Approved",
      updatedby: userId,
    };
    const update_nom = await updateContributorToProgram(accept_contri).catch(
      (err) => {
        logger.error(`Error while accepting nomination to the program for solution_id: ${
          solution?._id
        } Error:
        ${JSON.stringify(err.response.data)}`);
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

    query = { ...query, isContributorAccepted: true };
  } else {
    migratedCount.success.program.existing.accepted++;
  }

  if (!isEmpty(query)) {
    await updateSolutionDb(query, solution, migratedCount);
  }

  return programId;
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

  if (query.hasOwnProperty("sourcingProgramId")) {
    migratedCount.success.program.current.migrated++;
  }
  if (query.hasOwnProperty("isSrcProgramUpdated")) {
    migratedCount.success.program.current.updated++;
  }
  if (query.hasOwnProperty("isSrcProgramPublished")) {
    migratedCount.success.program.current.published++;
  }
  if (query.hasOwnProperty("isNominated")) {
    migratedCount.success.program.current.nominated++;
  }
  if (query.hasOwnProperty("isContributorAdded")) {
    migratedCount.success.program.current.contributor++;
  }
  if (query.hasOwnProperty("isContributorAccepted")) {
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
        name: process.env.DEFAULT_FRAMEWORK_ID,
        type: process.env.DEFAULT_FRAMEWORK_TYPE,
        identifier: process.env.DEFAULT_FRAMEWORK,
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
      ${JSON.stringify(err.response.data)}`);
  });
  return upd_res;
};

const publishProgramTemplate = async (program_id, id) => {
  const template = {
    channel: "sunbird",
    program_id: program_id,
  };

  return await publishProgram(template).catch((err) => {
    logger.error(`Error while publishing program for solution_id: ${id} Error:
    ${JSON.stringify(err.response.data)}`);
  });
};

module.exports = {
  createProgramTemplate,
  publishProgramTemplate,
};
