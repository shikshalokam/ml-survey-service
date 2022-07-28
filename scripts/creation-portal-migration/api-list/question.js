const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const logger = require("../logger");
const { getHeaders } = require("./headers");

// Questionset

const createQuestionSet = async (templateData) => {
  const url = CONFIG.HOST.creation_portal + CONFIG.APIS.create_questionset;
  const data = {
    request: {
      questionset: { ...templateData },
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "creation_portal"),
    data: data,
  };
  const res = await axios(config);

  return res?.data?.result?.identifier;
};

const updateQuestionSetHierarchy = async (templateData) => {
  const url = CONFIG.HOST.creation_portal + CONFIG.APIS.update_hierarchy;

  const config = {
    method: "patch",
    url: url,
    headers: await getHeaders(true, "creation_portal"),
    data: templateData,
  };

  const res = await axios(config);
  return res?.data?.result?.identifiers;
};

const publishQuestionSet = async (questionsetId) => {
  const url =
    CONFIG.HOST.creation_portal +
    CONFIG.APIS.publish_questionset +
    "/" +
    questionsetId;
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "creation_portal"),
    data: {},
  };

  const res = await axios(config);
  return res?.data?.result?.identifier;
};

const readQuestionSetHierarchy = async (questionSetId) => {
  const url =
    CONFIG.HOST.creation_portal +
    CONFIG.APIS.read_questionset +
    questionSetId +
    "?mode=edit";

  const config = {
    method: "get",
    url: url,
    headers: await getHeaders(true, "creation_portal"),
  };

  const res = await axios(config);
  return res?.data?.result?.questionSet;
};

// Questions
const createQuestions = async (templateData, questionId) => {
  const url = CONFIG.HOST.creation_portal + CONFIG.APIS.create_question;
  const data = {
    request: {
      question: { ...templateData },
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "creation_portal"),
    data: data,
  };
  const res = await axios(config).catch((err) => {
    console.log(`Error while creating the question for questionid: ${questionId} Error:`,err?.response?.data)
    logger.error(`Error while creating the question for questionid: ${questionId} Error:
    ${JSON.stringify(err.response.data)}`);
  });
  return res?.data?.result?.identifier;
};

const publishQuestion = async (questionId) => {
  const url =
    CONFIG.HOST.creation_portal +
    CONFIG.APIS.publish_question +
    "/" +
    questionId;
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "creation_portal")
  };

  const res = await axios(config)
  return res?.data?.result?.identifier;
};

module.exports = {
  createQuestionSet,
  updateQuestionSetHierarchy,
  publishQuestionSet,
  createQuestions,
  publishQuestion,
  readQuestionSetHierarchy,
};
