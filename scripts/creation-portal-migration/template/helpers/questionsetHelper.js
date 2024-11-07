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
    programId: programId, // Not needed in migration question but for our consumption side
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
  const migratedQuestion = await findAll(CONFIG.DB.TABLES.questions, {
    _id: question?._id,
  }).catch((err) => {});

  if (migratedQuestion?.length > 0) {
    question = migratedQuestion[0];
  }

  const type = question?.responseType;
  let referenceQuestionId = question?.referenceQuestionId;
  let query = {};
  let questionToMigrate = {};
  let typeInLowerCase = type.toLowerCase();

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

    if (!isEmpty(questionToMigrate) && !referenceQuestionId) {
      // call the api to create the question
      const response = await createQuestions(questionToMigrate, question._id);

      if (response?.responseCode !== httpStatusCode.ok.code) {
        return;
      }

      referenceQuestionId = response?.result?.identifier;
      question.referenceQuestionId = referenceQuestionId;
    }
  }

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
