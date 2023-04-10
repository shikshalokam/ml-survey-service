const { capitalize, isEmpty, get } = require("lodash");
const { ObjectId } = require("mongodb");
const { createQuestions, publishQuestion } = require("../../api-list/question");
const { CONFIG } = require("./../../constant/config");
const { updateById, findAll } = require("../../db");
const logger = require("../../logger");
const {
  getDateTemplate,
  getSliderTemplate,
  getMSMCQTemplate,
  getMCQTemplate,
  getTextTemplate,
} = require("../generate/gQuestion");

const setQuestionSetTemplate = (solution, programId, contributor) => {

  const languages = {
    "English": "English",
    "हिन्दी": "Hindi",
  }

  let templateData = {
    name: solution?.name,
    description: solution?.description,
    code: solution?.externalId,
    mimeType: "application/vnd.sunbird.questionset",
    primaryCategory: solution?.type,
    entityType: capitalize(solution?.entityType),
    language: solution?.language?.length > 0 ? solution?.language.map(lan => languages[lan]) : solution?.language,
    keywords: solution?.keywords,
    startDate: solution?.startDate,
    endDate: solution?.endDate,
    createdBy:
      solution?.author || process.env.DEFAULT_CONTRIBUTOR_USER_ID,
    organisationId:
      contributor?.org_id || process.env.DEFAULT_SRC_ORG_ADMIN_ORG_ID,
    creator: contributor?.userName || process.env.DEFAULT_CONTRIBUTOR_USER_NAME,
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

  let isPublished = question?.migrationReference?.isPublished;

  if (type) {
    if (type.toLowerCase() === "date") {
      questionToMigrate = getDateTemplate(question);
    }
    if (type.toLowerCase() === "slider") {
      questionToMigrate = getSliderTemplate(question);
    }
    if (type.toLowerCase() === "multiselect") {
      questionToMigrate = getMSMCQTemplate(question);
    }
    if (type.toLowerCase() === "radio") {
      questionToMigrate = getMCQTemplate(question);
    }
    if (type.toLowerCase() === "text" || type.toLowerCase() === "number") {
      questionToMigrate = getTextTemplate(question, type);
    }

    if (!isEmpty(questionToMigrate) && !referenceQuestionId) {
      referenceQuestionId = await createQuestions(
        questionToMigrate,
        question._id
      );
      question.referenceQuestionId = referenceQuestionId;
    }
  }

  if (referenceQuestionId && !isPublished) {
    const res = await publishQuestion(referenceQuestionId).catch((err) => {
      if (!migratedCount.failed.question.ids.includes(referenceQuestionId)) {
        migratedCount.failed.question.count++;
        migratedCount.failed.question.ids.push(referenceQuestionId);
      }

      logger.error(`Error while publishing the question for referenceQuestionId: ${referenceQuestionId} Error:
      ${JSON.stringify(err.response.data)}`);
    });

    logger.info(
      `createQuestion Template publish response: ${res} , "referenceQuestionId" ${referenceQuestionId} questionId, ${question?._id}`
    );

    if (res) {
      question = {
        ...question,
        migrationReference: { isPublished: true },
      };
      isPublished = true;
      logger.info(`createQuestion Template published: ${referenceQuestionId}`);
    }
  }

  if (referenceQuestionId) {
    question.referenceQuestionId = referenceQuestionId;

    query = {
      referenceQuestionId,
      "migrationReference.isPublished": isPublished,
    };
  } else {
    query = {
      ...query,
      "migrationReference.isPublished": isPublished,
    };
  }

  if (!isEmpty(query) && question) {
    await updateById(CONFIG.DB.TABLES.questions, question._id, {
      ...query,
    });
  }

  questionToMigrate = {
    ...questionToMigrate,
    referenceQuestionId
  }
  return questionToMigrate;
};

const updateSolutionById = async ({ id, query }) => {
  return await updateById(CONFIG.DB.TABLES.solutions, id, query);
};

const getQuestionFromDB = async (questionId) => {
  const readQuestion = await findAll(CONFIG.DB.TABLES.questions, {
    _id: ObjectId(questionId),
  });
  return readQuestion[0];
};

const isVisibleIfPresent = (question) => {
  return !isEmpty(get(question, "visibleIf"));
};

const isChildrenPresent = (question) => {
  return !isEmpty(get(question, "children"));
};

const isInstanceQuestionsPresent = (question) => {
  return !isEmpty(get(question, "instanceQuestions"));
};

module.exports = {
  setQuestionSetTemplate,
  createQuestionTemplate,
  updateSolutionById,
  getQuestionFromDB,
  isVisibleIfPresent,
  isChildrenPresent,
  isInstanceQuestionsPresent,
};
