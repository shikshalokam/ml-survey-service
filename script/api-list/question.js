const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const { getHeaders } = require("./headers");


// Questionset

const createQuestionSet = async (templateData) => {
  const url = CONFIG.SUNBIRD.HOST.dock + CONFIG.SUNBIRD.APIS.create_questionset;
  const data = {
    request: {
      questionset: { ...templateData },
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "dock"),
    data: data,
  };
  const res = await axios(config).catch((err) => {
    console.log("Error while creating Questionset", err.response.data);
  });
  return res.data.result.identifier;
};

const updateQuestionSetHierarchy = async (templateData) => {
  const url = CONFIG.SUNBIRD.HOST.dock + CONFIG.SUNBIRD.APIS.update_hierarchy;

  const config = {
    method: "patch",
    url: url,
    headers: await getHeaders(true, "dock"),
    data: templateData,
  };

  const res = await axios(config).catch((err) => {
    console.log("Error while updating the questionset", err.response.data);
  });
  return res.data.result.identifiers;
};

const publishQuestionSet = async (questionsetId) => {
  const url =
    CONFIG.SUNBIRD.HOST.dock +
    CONFIG.SUNBIRD.APIS.publish_questionset +
    "/" +
    questionsetId;
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "dock"),
    data: {},
  };

  const res = await axios(config).catch((err) => {
    console.log("Error while publishing the questionset", err.response.data);
  });
};

// Questions
const createQuestions = async (templateData) => {
  const url = CONFIG.SUNBIRD.HOST.dock + CONFIG.SUNBIRD.APIS.create_question;
  const data = {
    request: {
      question: { ...templateData },
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "dock"),
    data: data,
  };
  const res = await axios(config).catch((err) => {
    console.log("Error while creating the question", err.response.data);
  });
  return res.data.result.identifier;
};

const publishQuestion = async (questionId) => {
  const url =
    CONFIG.SUNBIRD.HOST.dock +
    CONFIG.SUNBIRD.APIS.publish_question +
    "/" +
    questionId;
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "dock"),
    data: {},
  };

  const res = await axios(config).catch((err) => {
    console.log(
      "Error while publishing the question",
      questionId,
      err.response.data
    );
  });
  return res.data.result.identifier;
};

module.exports = {
    createQuestionSet,
    updateQuestionSetHierarchy,
    publishQuestionSet,
    createQuestions,
    publishQuestion
};
