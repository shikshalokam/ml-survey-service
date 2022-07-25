const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const { getHeaders } = require("./headers");



const createProgram = async (templateData) => {
  const url = CONFIG.HOST.vdn + CONFIG.APIS.create_program;
  const data = {
    request: {
      ...templateData,
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(false, "vdn"),
    data: data,
  };

  const res = await axios(config);
  return res?.data?.result?.program_id;
};

const updateProgram = async (templateData) => {
  const url = CONFIG.HOST.vdn + CONFIG.APIS.update_program;
  const data = {
    request: {
      ...templateData,
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(false, "vdn"),
    data: data,
  };
  const res = await axios(config);
  return res.data;
};

const publishProgram = async (templateData) => {
  const url = CONFIG.HOST.vdn + CONFIG.APIS.publish_program;
  const data = {
    request: {
      ...templateData,
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(false, "vdn"),
    data: data,
  };

  const res = await axios(config);
  return res.data;
};
const nominateProgram = async (program_id, author) => {
  const url =
    CONFIG.HOST.vdn + CONFIG.APIS.add_program_nomination;
  const data = {
    request: {
      program_id: program_id,
      status: "Pending",
      collection_ids: [],
      targetprimarycategories: [
        {
          name: "Observation",
          identifier: "obj-cat:observation_questionset_all",
          targetObjectType: "QuestionSet",
        },
        {
          name: "Survey",
          identifier: "obj-cat:survey_questionset_all",
          targetObjectType: "QuestionSet",
        },
      ],
      content_types: [],
      organisation_id: "937dd865-b256-4c1a-9830-a9b5b89f0913",
      user_id: "bb551fff-121e-4a18-b969-984ac62bd572",
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "vdn"),
    data: data,
  };

  const res = await axios(config);
  return res.data;
};

const updateContributorToProgram = async (reqData) => {
  const url =
    CONFIG.HOST.vdn + CONFIG.APIS.update_program_nomination;
  const data = {
    request: {
      ...reqData,
    },
  };

  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "vdn"),
    data: data,
  };

  const res = await axios(config);
  return res.data;
};

module.exports = {
  createProgram,
  updateProgram,
  publishProgram,
  nominateProgram,
  updateContributorToProgram,
};
