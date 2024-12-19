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
const constants = require("../../constant");

/**
 * To increment the date
 * @method
 * @name getDate
 * @param {number} increment - increment
 * @returns {Date} - date
 */
const getDate = (increment) => {
  const date = new Date(
    new Date().setDate(new Date().getDate() + increment)
  ).toISOString();

  return date;
};

/**
* To create the program
* @method
* @name createProgramTemplate
* @param {Object} solution - solution Data.
* @param {Object} migratedCount - migratedCount to increment the count.
* @returns {JSON} - 
{
  programId: "d1b93850-df5e-11ed-87b4-9feca80ba862",
  contributor: {
    "authorId": "86d2d978-5b20-4453-8a76-82b5a4c728c9",
    "mappedUserId": "b8e3c5f2-07b3-49f3-964f-ef8e90897513",
    "userName": "karan121",
    "rootOrgId": "01338111579044249633",
    "rootOrgName": "dockstaging",
    "org_id": "d7da22f6-b737-4817-a194-6a205e535559",
    "srcOrgAdminId": "2730f876-735d-4935-ba52-849c524a53fe",
    "srcOrgAdminUserName": "dockstaging1@yopmail.com",
    "contributorOrgAdminId": "2730f876-735d-4935-ba52-849c524a53fe",
    "contributorOrgAdminUserName": "dockstaging1@yopmail.com",
    "programId": "d1b93850-df5e-11ed-87b4-9feca80ba862",
    "programName": "MH01-Mantra4Change-APSWREIS School Leader Feedback sourcing project",
    "solutionId": "5f362b78af0a4decfa9a1070",
    "solutionName": "Need Assessment Form_Teacher Training"
  }
}
*/

// to publish the program with programId

const createProgramTemplate = async (solution, migratedCount) => {
  // To get srcorgadmin and contributorOrgAdmin from csv
  let userData = await getContributorAndSrcAdminData(solution).catch((err) => {
    logger.error(
      `Error while fetching details of contributor and src admin from CSV for solution_id: ${solution?._id
      }. Error: ${JSON.stringify(err?.response?.data || err)}`
    );
  });

  userData = {
    ...userData,
    srcOrgAdmin: {
      ...userData?.srcOrgAdmin,
      solutionId: solution?._id.toString(),
      solutionName: solution?.name,
    },
  };

  // If srcOrgAdmin is not present in csv don't do any further actions and return
  if (!userData?.srcOrgAdmin) {
    logger.error("srcOrgAdmin is missing or undefined in user data.");
    return;
  }

  if (has(solution, constants.MIGRATION_REFERENCE.NAME)) {
    // update solution sourcingProgramId if the programId is already migrated for the same other but for other solution and present in csv then assign programId from if not will be same as solution sourcingProgramId
    solution.migrationReference.sourcingProgramId = !isEmpty(
      userData?.srcOrgAdmin?.programId
    )
      ? userData?.srcOrgAdmin?.programId.trim()
      : solution?.migrationReference?.sourcingProgramId;
  } else {
    const programId = userData?.srcOrgAdmin?.programId
      ? userData?.srcOrgAdmin?.programId.trim()
      : solution?.migrationReference?.sourcingProgramId;
    // else create a new object as migrationReference and assign the programId
    solution = {
      ...solution,
      migrationReference: {
        sourcingProgramId: programId,
      },
    };
  }

  const id = `${solution._id}`;
  const userId = userData?.srcOrgAdmin
    ? userData?.srcOrgAdmin?.srcOrgAdminId
    : process.env.DEFAULT_SRC_ORG_ADMIN_TO_CREATE_PROGRAM;
  const rootOrgId = userData?.srcOrgAdmin
    ? userData?.srcOrgAdmin?.rootOrgId
    : process.env.DEFAULT_SRC_ORG_ADMIN_ROOT_ORG_ID;

  // Template to create the program
  const template = {
    name: `${solution?.name} sourcing project`,
    description: `${solution?.name} sourcing project description`,
    nomination_enddate: `${getDate(1)}`,
    rewards: null,
    shortlisting_enddate: `${getDate(1)}`,
    enddate: `${getDate(2)}`,
    content_submission_enddate: `${getDate(1)}`,
    type: constants.PUBLIC,
    target_type: constants.SEARCH_CRITERIA,
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
    status: constants.DRAFT,
    program_id: "",
    rolemapping: [],
    config: {
      defaultContributeOrgReview: false,
      roles: [
        {
          id: 1,
          name: constants.USER_ROLES.CONTRIBUTOR,
          tabs: [1],
          default: true,
          defaultTab: 1,
        },
        {
          id: 2,
          name: constants.USER_ROLES.REVIEWER,
          tabs: [2],
          defaultTab: 2,
        },
      ],
    },
  };

  let programId = solution?.migrationReference?.sourcingProgramId;

  let query = {};

  // If sourcingProgramId is not created then create using above the formed template;
  if (isEmpty(programId)) {
    const res = await createProgram(template).catch((err) => {
      logger.error(`Error while creating program for solution_id: ${solution?._id
        } Error:
       ${JSON.stringify(err?.response?.data)}`);

      // increment program migrated failed count and store the id
      migratedCount.failed.program.migrated.count++;

      if (!migratedCount.failed.program.migrated.ids.includes(id)) {
        migratedCount.failed.program.migrated.ids.push(id);
      }
    });

    if (res.responseCode === httpStatusCode.ok.code) {
      programId = res.result?.program_id;
    }

    // Update csv file with programId,
    // so that if there is any solution which belongs to same org that can be migrated under the same program

    programName = "";
    if (programId) {
      await updateCsvFile(
        userData.csvData,
        userData.srcOrgAdmin,
        programId,
        template?.name
      );

      logger.info(
        `Sourcing Program created for solution_id: ${solution?._id} === ${programId}`
      );
    }

    // update the query with sourcingProgramId
    query = {
      ...query,
      [constants.MIGRATION_REFERENCE.SOURCING_PROGRAM_ID]: true,
    };
  } else {
    // increment program migrated success count
    migratedCount.success.program.existing.migrated++;
  }

  // If failed to create the program and programId is empty return
  if (isEmpty(programId)) {
    return;
  }

  // To update the solution with program
  if (!solution?.migrationReference?.isSourceProgramUpdated) {
    const updateRes = await updateProgramTemplate(programId, solution);

    // increment program update failed count and store the id
    if (!updateRes) {
      migratedCount.failed.program.updated.count++;
      if (!migratedCount.failed.program.updated.ids.includes(id)) {
        migratedCount.failed.program.updated.ids.push(id);
      }

      // Update the db with only migrationReference with sourcingProgramId if failed to update
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }
    logger.info(
      `Sourcing Program updated for solution_id: ${solution?._id} === ${programId}`
    );

    query = {
      ...query,
      [constants.MIGRATION_REFERENCE.IS_SRC_PROGRAM_UPDATED]: true,
    };
  } else {
    // increment program updated success count
    migratedCount.success.program.existing.updated++;
  }

  if (!solution?.migrationReference?.isSourceProgramPublished) {
    const publishResponse = await publishProgramTemplate(
      programId,
      solution?._id
    ).catch((err) => {
      // increment program publish failed count and store the id
      migratedCount.failed.program.published.count++;
      if (!migratedCount.failed.program.published.ids.includes(id)) {
        migratedCount.failed.program.published.ids.push(id);
      }
    });

    if (publishResponse.responseCode !== httpStatusCode.ok.code) {
      // Update the db with only migrationReference with sourcingProgramId, isSourceProgramUpdated if failed to publish
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }

    logger.info(
      `Sourcing Program published for solution_id: ${solution?._id} === ${programId}`
    );

    // update the query with isSourceProgramPublished
    query = {
      ...query,
      [constants.MIGRATION_REFERENCE.IS_SRC_PROGRAM_PUBLISHED]: true,
    };
  } else {
    // increment program published success count
    migratedCount.success.program.existing.published++;
  }

  if (!solution?.migrationReference?.isNominated) {
    // call the api to nominate program
    const res = await nominateProgram(programId, userData?.srcOrgAdmin).catch(
      (err) => {
        // increment program nominated failed count and store the id
        migratedCount.failed.program.nominated.count++;
        if (!migratedCount.failed.program.nominated.ids.includes(id)) {
          migratedCount.failed.program.nominated.ids.push(id);
        }
        logger.error(`Error while nominating program for solution_id: ${solution?._id
          } Error:
      ${JSON.stringify(err?.response?.data)}`);
      }
    );

    if (res.responseCode !== httpStatusCode.ok.code) {
      // Update the database with migration reference if nomination fails
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }

    logger.info(
      `Sourcing Program nominated for solution_id: ${solution?._id} === ${programId}`
    );

    // update the query with isNominated
    query = { ...query, [constants.MIGRATION_REFERENCE.IS_NOMINATED]: true };
  } else {
    // increment program nominated success count
    migratedCount.success.program.existing.nominated++;
  }

  if (!solution?.migrationReference?.isContributorAdded) {
    // Template to add the contributor
    const addContributor = {
      program_id: programId,
      user_id:
        userData?.srcOrgAdmin?.contributorOrgAdminId ||
        process.env.DEFAULT_CONTRIBUTOR_ORG_ADMIN_ID,
      rolemapping: {
        CONTRIBUTOR: [
          userData?.mappedUserId || process.env.DEFAULT_CONTRIBUTOR_USER_ID,
        ],
      },
    };

    // call the api to add contributor
    const updateNomination = await updateContributorToProgram(
      addContributor
    ).catch((err) => {
      // increment program contributor add failed count and store the id
      migratedCount.failed.program.contributor.count++;
      if (!migratedCount.failed.program.contributor.ids.includes(id)) {
        migratedCount.failed.program.contributor.ids.push(id);
      }

      logger.error(`Error while adding contributor program for solution_id: ${solution?._id
        } Error:
        ${JSON.stringify(err?.response?.data)}`);
    });

    if (updateNomination.responseCode !== httpStatusCode.ok.code) {
      // Update the database if contributor update fails
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }

    logger.info(
      `Sourcing Program added contributor for solution_id: ${solution?._id} === ${programId}`
    );

    // update the query with isContributorAdded
    query = {
      ...query,
      [constants.MIGRATION_REFERENCE.IS_CONTRIBUTOR_ADDED]: true,
    };
  } else {
    // increment program contributor added success count
    migratedCount.success.program.existing.contributor++;
  }

  if (!solution?.migrationReference?.isContributorAccepted) {
    const accept_contributor = {
      program_id: programId,
      user_id:
        userData?.srcOrgAdmin?.mappedUserId ||
        process.env.DEFAULT_CONTRIBUTOR_ORG_ADMIN_ID,
      status: constants.APPROVED,
      updatedby: userId,
    };
    // call the api to accept contributor
    const updateNomination = await updateContributorToProgram(
      accept_contributor
    ).catch((err) => {
      logger.error(`Error while accepting nomination to the program for solution_id: ${solution?._id
        } Error:
        ${JSON.stringify(err?.response?.data)}`);
      // increment program contributor accepted failed count and store the id
      migratedCount.failed.program.accepted.count++;
      if (!migratedCount.failed.program.accepted.ids.includes(id)) {
        migratedCount.failed.program.accepted.ids.push(id);
      }
    });

    if (!updateNomination) {
      // Update the db with only migrationReference with sourcingProgramId, isSourceProgramUpdated, isSourceProgramPublished, isNominated,
      // isContributorAdded, if failed to accept contributor
      await updateSolutionDb(query, solution, migratedCount);
      return;
    }
    logger.info(
      `Sourcing Program accepted nomination for solution_id: ${solution?._id} === ${programId}`
    );
    // update the query with isContributorAccepted
    query = {
      ...query,
      [constants.MIGRATION_REFERENCE.IS_CONTRIBUTOR_ACCEPTED]: true,
    };
  } else {
    // increment program contributor accepted success count
    migratedCount.success.program.existing.accepted++;
  }

  if (!isEmpty(query)) {
    // Update the db with only migrationReference with sourcingProgramId, isSourceProgramUpdated, isSourceProgramPublished, isNominated,
    // isContributorAdded, isContributorAccepted if there is no failure
    await updateSolutionDb(query, solution, migratedCount);
  }
  return { programId, contributor: userData?.srcOrgAdmin };
};

/**
 * To update the program migration details in mongodb
 * @method
 * @name updateSolutionDb
 * @param {Object} query - fields to update in mongodb.
 * @param {Object} solution - solution Data.
 * @param {Object} migratedCount - migratedCount to increment the count.
 */
const updateSolutionDb = async (query, solution, migratedCount) => {
  try {
    await updateSolutionById({
      id: solution._id.toString(),
      query: { ...query },
    });
  } catch (err) {
    logger.error(
      `Error while updating program in solutions collection: ${solution?._id} Error: ${err}`
    );
    return;
  }

  // Define a mapping of migration reference keys to their corresponding field names for incrementing counts.
  const migrationFields = {
    [constants.MIGRATION_REFERENCE.SOURCING_PROGRAM_ID]: constants.MIGRATED,
    [constants.MIGRATION_REFERENCE.IS_SRC_PROGRAM_UPDATED]: constants.UPDATED,
    [constants.MIGRATION_REFERENCE.IS_SRC_PROGRAM_PUBLISHED]: constants.PUBLISHED,
    [constants.MIGRATION_REFERENCE.IS_NOMINATED]: constants.NOMINATED,
    [constants.MIGRATION_REFERENCE.IS_CONTRIBUTOR_ADDED]: constants.CONTRIBUTOR,
    [constants.MIGRATION_REFERENCE.IS_CONTRIBUTOR_ACCEPTED]: constants.ACCEPTED,
  };

  // Iterate over each entry in the migrationFields mapping.
  for (const [key, field] of Object.entries(migrationFields)) {
    if (query.hasOwnProperty(key)) {
      migratedCount.success.program.current[field]++;
    }
  }
};

/**
 * To create the template and update the program with framework
 * @method
 * @name updateProgramTemplate
 * @param {String} program_id - program_id.
 * @param {Object} solution - solution Data.
 * @returns {JSON} - Updated the program
 */
const updateProgramTemplate = async (programId, solution) => {
  // Template to update the program
  const template = {
    config: {
      defaultContributeOrgReview: false,
      roles: [
        {
          id: 1,
          name: constants.USER_ROLES.CONTRIBUTOR,
          tabs: [1],
          default: true,
          defaultTab: 1,
        },
        {
          id: 2,
          name: constants.USER_ROLES.REVIEWER,
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
        identifier: constants.OBJ_CAT.OBSERVATION_QUESTIONSET_ALL,
        name: constants.OBSERVATION,
        targetObjectType: constants.QUESTION_SET,
      },
      {
        identifier: constants.OBJ_CAT.SURVEY_QUESTIONSET_ALL,
        name: constants.SURVEY,
        targetObjectType: constants.QUESTION_SET,
      },
    ],
    targetprimarycategorynames: [constants.OBSERVATION, constants.SURVEY],
    program_id: programId,
  };

  // call the api to update program with the above template
  const updateRes = await updateProgram(template).catch((err) => {
    logger.error(`Error while updating program for solution_id: ${solution?._id
      } Error:
      ${JSON.stringify(err?.response?.data)}`);
  });

  if (updateRes.responseCode !== httpStatusCode.ok.code) {
    return null;
  }

  return updateRes;
};

/**
 * To create the template and update the program with framework
 * @method
 * @name publishProgramTemplate
 * @param {String} program_id - programId.
 * @param {String} id - id.
 * @returns {JSON} - Publish the program
 */
const publishProgramTemplate = async (programId, id) => {
  const template = {
    channel: process.env.DEFAULT_SLUG,
    program_id: programId,
  };
  // call the api to publish program
  return await publishProgram(template).catch((err) => {
    logger.error(`Error while publishing program for solution_id: ${id} Error:
    ${JSON.stringify(err?.response?.data)}`);
  });
};

module.exports = {
  createProgramTemplate,
  publishProgramTemplate,
};
