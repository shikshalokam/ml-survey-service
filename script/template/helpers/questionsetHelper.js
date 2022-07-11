const { capitalize, isEmpty, get } = require("lodash");
const { ObjectId } = require("mongodb");
const { createQuestions, publishQuestion } = require("../../api-list/question");
const { CONFIG } = require("../../constant/config");
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
  const type = question.responseType;
  let migratedId = question.migratedId;
  let query = {};
  let questionToMigrate = {};

  if (!migratedId) {
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
      migratedId = await createQuestions(questionToMigrate, question._id);
      query = {
        ...query,
        migratedId,
      };
    }
  }

  if (!!migratedId && !question.isPublished) {
    const res = await publishQuestion(migratedId).catch((err) => {
      migratedCount.failed.question.count++;
      if (!migratedCount.failed.question.ids.includes(migratedId)) {
        migratedCount.failed.question.ids.push(migratedId);
      }
      console.log(`Error while publishing the question for questionid: ${migratedId} questionId: ${question?._id} Error:
      ${err.response.data}`);
      logger.error(`Error while publishing the question for migratedId: ${migratedId} Error:
      ${JSON.stringify(err.response.data)}`);
    });

    console.log("createQuestion Template publish response",res , "migratedId", migratedId, "questionId", question?._id)
    logger.info(`createQuestion Template publish response: ${res} , "migratedId" ${migratedId} questionId, ${question?._id}`);

    if (!res) {
      return migratedId;
    }

    console.log("createQuestion Template published", migratedId)
  logger.info(`createQuestion Template published: ${migratedId}`);
    query = {
      ...query,
      isPublished: true,
    };
  }

  if (!isEmpty(query)) {
    await updateById(CONFIG.DB.TABLES.questions, question._id, {
      ...query,
    });
  }
  return migratedId;
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
