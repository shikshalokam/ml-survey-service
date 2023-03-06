const { default: axios } = require("axios");
const { request } = require("chai");
const { CONFIG } = require("../constant/config");
const { getHeaders } = require("./headers");



const createProgram = async (templateData) => {
  const url = CONFIG.HOST.creation_portal + CONFIG.APIS.create_program;
  const data = {
    request: {
      ...templateData,
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(false, "creation_portal"),
    data: data,
  };

  const res = await axios(config).catch(err => {});

  return res?.data?.result?.program_id;
};

const updateProgram = async (templateData) => {
  const url = CONFIG.HOST.creation_portal + CONFIG.APIS.update_program;
  const data = {
    request: {
      ...templateData,
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(false, "creation_portal"),
    data: data,
  };
  const res = await axios(config);
  return res.data;
};

const publishProgram = async (templateData) => {
  const url = CONFIG.HOST.creation_portal + CONFIG.APIS.publish_program;
  const data = {
    request: {
      ...templateData,
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(false, "creation_portal"),
    data: data,
  };

  const res = await axios(config);
  return res.data;
};
const nominateProgram = async (program_id, orgAdmin) => {
  const url =
    CONFIG.HOST.creation_portal + CONFIG.APIS.add_program_nomination;
  const data = {
    request: {
      program_id: program_id,
      status: "Pending",
      collection_ids: [],
      createdby: orgAdmin?.srcOrgAdminId,
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
      organisation_id: orgAdmin?.org_id,
      user_id: orgAdmin?.mappedUserId||  process.env.DEFAULT_CONTRIBUTOR_ORG_ADMIN_ID,
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "creation_portal"),
    data: data,
  };

  const res = await axios(config);
  return res.data;
};

const updateContributorToProgram = async (reqData) => {
  const url =
    CONFIG.HOST.creation_portal + CONFIG.APIS.update_program_nomination;
  const data = {
    request: {
      ...reqData,
    },
  };

  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "creation_portal"),
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
