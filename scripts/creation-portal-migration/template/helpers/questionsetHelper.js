const { capitalize, isEmpty } = require("lodash");
const { createQuestions } = require("../../api-list/question");
const { CONFIG } = require("./../../constant/config");
const { updateById, findAll } = require("../../db");

const {
  getDateTemplate,
  getSliderTemplate,
  getMultipleSelectMCQTemplate,
  getMCQTemplate,
  getTextTemplate,
} = require("../generate/gQuestion");
const constants = require("../../constant");

/**
 * Create the mapping for questionset to add in creation portal
 * @method
 * @name setQuestionSetTemplate
 * @param {Object} solution - solution
 * @param {String} programId - programId
 * @param {Object} contributor - contributor
 * @returns {JSON} - return the mapped template data
 **/
const setQuestionSetTemplate = (solution, programId, contributor) => {
  const languages = {
    English: "English",
    हिन्दी: "Hindi",
  };

  let templateData = {
    name: solution?.name,
    description: solution?.description,
    code: solution?.externalId,
    mimeType: "application/vnd.sunbird.questionset",
    primaryCategory: solution?.type,
    entityType: capitalize(solution?.entityType),
    language:
      solution?.language?.length > 0
        ? solution?.language.map((lan) => languages[lan])
        : solution?.language,
    keywords: solution?.keywords,
    startDate: solution?.startDate,
    createdOn: solution?.startDate,
    endDate: solution?.endDate,
    createdBy: solution?.author || process.env.DEFAULT_CONTRIBUTOR_USER_ID,
    organisationId:
      contributor?.org_id || process.env.DEFAULT_SRC_ORG_ADMIN_ORG_ID,
    creator: contributor?.userName || process.env.DEFAULT_CONTRIBUTOR_USER_NAME,
    publisher:
      contributor?.userName || process.env.DEFAULT_CONTRIBUTOR_USER_NAME,
    createdFor: [
      contributor?.rootOrgId || process.env.DEFAULT_SRC_ORG_ADMIN_ROOT_ORG_ID,
    ],
    channel:
      contributor?.rootOrgId || process.env.DEFAULT_SRC_ORG_ADMIN_ROOT_ORG_ID,
    programId: programId,
    author: contributor?.userName || process.env.DEFAULT_CONTRIBUTOR_USER_NAME,
    framework: process.env.DEFAULT_FRAMEWORK_ID,
  };

  return templateData;
};

/**
 * Based on question type create the question in creation portal
 * @method
 * @name createQuestionTemplate
 * @param {Object} question - question
 * @param {Object} migratedCount - migratedCount
 * @returns {JSON} - return the mapped migrated question
 **/
const createQuestionTemplate = async (question, migratedCount) => {
  // Fetch the existing question from the database based on its ID
  const migratedQuestion = await findAll(CONFIG.DB.TABLES.questions, {
    _id: question?._id,
  }).catch((err) => {});

  // If the question is already migrated, use it instead of the input question
  if (migratedQuestion?.length > 0) {
    question = migratedQuestion[0];
  }

  const type = question?.responseType;
  let referenceQuestionId = question?.referenceQuestionId;
  let query = {};
  let questionToMigrate = {};
  let typeInLowerCase = type?.toLowerCase();

  // Determine the template based on the question's response type
  if (type) {
    if (typeInLowerCase === constants.DATE) {
      questionToMigrate = getDateTemplate(question);
    }
    if (typeInLowerCase === constants.SLIDER) {
      questionToMigrate = getSliderTemplate(question);
    }
    if (typeInLowerCase === constants.MULTI_SELECT) {
      questionToMigrate = getMultipleSelectMCQTemplate(question);
    }
    if (typeInLowerCase === constants.RADIO) {
      questionToMigrate = getMCQTemplate(question);
    }
    if (
      typeInLowerCase === constants.TEXT ||
      typeInLowerCase === constants.NUMBER
    ) {
      questionToMigrate = getTextTemplate(question, type);
    }

    // If a template is created and the question doesn't have a reference ID, create the question via API
    if (!isEmpty(questionToMigrate) && !referenceQuestionId) {
      // call the api to create the question
      const response = await createQuestions(questionToMigrate, question._id);

      if (response?.responseCode !== httpStatusCode.ok.code) {
        return;
      }

      // Set the referenceQuestionId from the API response
      referenceQuestionId = response?.result?.identifier;
      question.referenceQuestionId = referenceQuestionId;
    }
  }

  // Prepare the query object to update the question in the database
  if (referenceQuestionId) {
    question.referenceQuestionId = referenceQuestionId;
    query = {
      referenceQuestionId,
    };
  } else {
    query = {
      ...query,
    };
  }

  // Update the question in the database with the new reference ID or other details
  if (!isEmpty(query) && question) {
    // update the questionId and published status in db
    await updateById(CONFIG.DB.TABLES.questions, question._id, {
      ...query,
    });
  }

  questionToMigrate = {
    ...questionToMigrate,
    referenceQuestionId,
  };
  return questionToMigrate;
};

/**
 * Update the solution db by solution id
 * @method
 * @name updateSolutionById
 * @param {Object} {id: String, query: Object} - {id, query}
 * @returns  - Updates the solution in mongo
 **/
const updateSolutionById = async ({ id, query }) => {
  return await updateById(CONFIG.DB.TABLES.solutions, id, query);
};

module.exports = {
  setQuestionSetTemplate,
  createQuestionTemplate,
  updateSolutionById,
};
