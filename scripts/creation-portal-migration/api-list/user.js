const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const logger = require("../logger");
const { getHeaders } = require("./headers");

const readUser = async (userId) => {
  const params = "organisations,roles,locations,declarations,externalIds";
  const url =
    CONFIG.HOST.ed + CONFIG.APIS.read_user + userId + "?fields=" + params;

  const config = {
    method: "get",
    url: url.trim(),
    headers: await getHeaders(true, "ed"),
  };

  const res = await axios(config).catch((err) => {
    logger.error(`Error while reading User: ${JSON.stringify(err)}`);
  });
  return res.data?.result?.response;
};

const searchUser = async (userId) => {
  const url = CONFIG.HOST.ed + CONFIG.APIS.search_user;
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "ed"),
    data: {
      request: { filters: { id: userId } },
    },
  };

  const res = await axios(config).catch((err) => {
    logger.error(
      `Error while searching User: ${JSON.stringify(err?.response?.data)}`
    );
  });
  return res?.data?.result?.response?.content;
};

const getOpenSaberUserOrgId = async () => {
  const query = {
    id: "open-saber.registry.search",
    ver: "1.0",
    ets: "11234",
    params: {
      did: "",
      key: "",
      msgid: "",
    },
    request: {
      entityType: ["User_Org"],
      filters: {},
      limit: 10000,
      offset: 0,
    },
  };
  const url = CONFIG.HOST.creation_portal + CONFIG.APIS.open_saber_user_org_search;
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "creation_portal"),
    data: query
  };

  const res = await axios(config).catch((err) => {
    logger.error(
      `Error while searching User: ${JSON.stringify(err?.response?.data)}`
    );
  });
  return res?.data?.result?.Org || []
}

module.exports = {
  readUser,
  searchUser,
  getOpenSaberUserOrgId
};
