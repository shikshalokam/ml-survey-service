const { capitalize, isEmpty, get } = require("lodash");
const { ObjectId } = require("mongodb");
const { createQuestions, publishQuestion } = require("../../api-list/question");
const { CONFIG } = require("./../../constant/config");
const { updateById, findAll } = require("../../db");
const logger = require("../../logger");
const {
  questionSetTemplate,
  questionSetTemplateStatic,
} = require("../config/questionSet");
const {
  getDateTemplate,
  getSliderTemplate,
  getMSMCQTemplate,
  getMCQTemplate,
  getTextTemplate,
} = require("../generate/gQuestion");

const setQuestionSetTemplate = (solution, programId) => {
  let templateData = {};
  for (let key in questionSetTemplate) {
    if (key === "programId") {
      templateData[key] = programId;
    } else if (questionSetTemplateStatic.includes(key)) {
      templateData[key] = questionSetTemplate[key];
    } else if (key === "organisationId") {
      if (
        solution[questionSetTemplate[key]] &&
        solution[questionSetTemplate[key]].length >= 1
      ) {
        templateData[key] = solution[questionSetTemplate[key]][0];
      } else {
        templateData[key] = solution[questionSetTemplate[key]];
      }
    } else if (key.toLowerCase() === "entitytype") {
      templateData[key] = capitalize(solution[questionSetTemplate[key]]) || "";
    } else {
      templateData[key] = solution[questionSetTemplate[key]] || "";
    }
  }
  return templateData;
};

const createQuestionTemplate = async (question, migratedCount) => {

  const type = question?.responseType;
  let referenceQuestionId = question?.referenceQuestionId;
  let query = {};
  let questionToMigrate = {};

  let published = question?.isPublished;

  if (type && !referenceQuestionId) {
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

    if (!isEmpty(questionToMigrate)) {

      referenceQuestionId = await createQuestions(questionToMigrate, question._id);
      question.referenceQuestionId = referenceQuestionId;

    }
  }

  if (referenceQuestionId && !published) {
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
      question.isPublished = true;
      published = true;
      logger.info(`createQuestion Template published: ${referenceQuestionId}`);
    }
  }


  if (referenceQuestionId) {
    question.referenceQuestionId = referenceQuestionId;

    query = {
      referenceQuestionId,
      published: published,
    };
  } else {
    query = {
      ...query,
      published
    }
  }

  if (!isEmpty(query) && question) {
    await updateById(CONFIG.DB.TABLES.questions, question._id, {
      ...query,
    });
  }
  return question;
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
