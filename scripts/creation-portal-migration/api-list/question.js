const { default: axios } = require("axios");
const { CONFIG } = require("../constants/config");
const logger = require("../logger");
const { getHeaders } = require("./headers");


// @questionSet
const createQuestionSet = async (templateData) => {
  try {

    const url = CONFIG.HOST.creation_portal + CONFIG.APIS.create_questionset;
    console.log("createQuestionSet", url);
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
    if (res.status === 200) {
      return { status: res?.data?.params?.status, identifier: res?.data?.result?.identifier };
    } else {
      return { status: res?.data?.params?.status, errmsg: res?.data?.params?.errmsg };
    }

  } catch (error) {
    console.error('Error creating question set:', error);
  }
};

const publishQuestionSet = async (questionsetId) => {

  try {
    const url = CONFIG.HOST.creation_portal + CONFIG.APIS.publish_questionset + "/" + questionsetId;
    console.log("publishQuestionSet", url);
    const data = {
      request: {
        questionset: {},
      },
    };

    const config = {
      method: "post",
      url: url,
      headers: await getHeaders(true, "creation_portal"),
      data: data,
    };

    const res = await axios(config);

    if (res.status === 200) {

      return {
        status: res?.data?.params?.status,
        identifier: res?.data?.result?.identifier,
      };

    } else {

      return {
        status: res?.data?.params?.status,
        errmsg: res?.data?.params?.errmsg
      };

    }


  } catch (error) {
    console.error(`Error publishing question set ${questionsetId} :`, error);
  }

};

const updateQuestionSetHierarchy = async (templateData) => {
  try {
    const url = CONFIG.HOST.creation_portal + CONFIG.APIS.update_hierarchy;
    console.log("updateQuestionSetHierarchy", url);
    const data = {
      request: {
        data: { ...templateData },
      },
    };
    const config = {
      method: "patch",
      url: url,
      headers: await getHeaders(true, "creation_portal"),
      data: data,
    };
    const res = await axios(config);

    if (res.status === 200) {
      return { status: res?.data?.params?.status, identifier: res?.data?.result?.identifier, };
    } else {
      return { status: res?.data?.params?.status, errmsg: res?.data?.params?.errmsg };
    }
  } catch (error) {
    console.error(`Error updating question set ${questionsetId} :`, error);
  }

};


const readQuestionSetHierarchy = async (questionSetId) => {
  try {
    const url =
      CONFIG.HOST.creation_portal +
      CONFIG.APIS.read_questionset +
      questionSetId +
      "?mode=edit";

    console.log("readQuestionSetHierarchy", url);

    const config = {
      method: "get",
      url: url,
      headers: await getHeaders(true, "creation_portal"),
    };

    const res = await axios(config);

    if (res.status === 200) {
      return { status: res?.data?.params?.status, questionSet: res?.data?.result?.questionSet, };
    } else {
      return { status: res?.data?.params?.status, errmsg: res?.data?.params?.errmsg };
    }

  } catch (error) {
    console.error(`Error reading question set ${questionsetId} :`, error);
  }
};


// Questions
const createQuestions = async (templateData, questionId) => {
  try {
    const url = CONFIG.HOST.creation_portal + CONFIG.APIS.create_question;
    console.log("createQuestions", url);
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
      logger.error(`Error while creating the question for questionId: ${questionId} Error:
      ${JSON.stringify(err.response.data)}`);
    });

    if (res.status === 200) {
      return { status: res?.data?.params?.status, identifier: res?.data?.result?.identifier };
    } else {
      return { status: res?.data?.params?.status, errmsg: res?.data?.params?.errmsg };
    }

  } catch (error) {
    console.log(`Error while creating the question for questionid: ${questionId} Error:
      `, (error.response.data))
    logger.error(`Error while creating the question for questionid: ${questionId} Error:
      ${JSON.stringify(err.response.data)}`);
  }

};

const publishQuestion = async (questionId) => {
  try {
    const url =
      CONFIG.HOST.creation_portal +
      CONFIG.APIS.publish_question +
      "/" +
      questionId;
    console.log("publishQuestion", url);
    const config = {
      method: "post",
      url: url,
      headers: await getHeaders(true, "creation_portal")
    };

    const res = await axios(config)
    if (res.status === 200) {
      return { status: res?.data?.params?.status, identifier: res?.data?.result?.identifier, };
    } else {
      return { status: res?.data?.params?.status, errmsg: res?.data?.params?.errmsg };
    }
  } catch (error) {
    console.error(`Error publish question  with questionID ${questionsetId} :`, error);
  }

};


module.exports = {
  createQuestionSet,
  updateQuestionSetHierarchy,
  publishQuestionSet,
  readQuestionSetHierarchy,
  createQuestions,
  publishQuestion,
};