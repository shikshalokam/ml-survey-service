const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const logger = require("../logger");
const { getHeaders } = require("./headers");

const readUser = async (userId) => {
  const params = "organisations,roles,locations,declarations,externalIds";
  const url =
    CONFIG.HOST.base +
    CONFIG.APIS.read_user +
    userId +
    "?fields=" +
    params;

  const res = await axios
    .get(url, await getHeaders(true, "base"))
    .catch((err) => {
      logger.error(`Error while reading User: ${JSON.stringify(err?.response?.data)}`)
    });
};

const searchUser = async (userId) => {
  const url = CONFIG.HOST.base + CONFIG.APIS.search_user;
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "base"),
    data: {
      request: { filters: { id: userId } },
    },
  };

  const res = await axios(config).catch((err) => {
    logger.error(`Error while searching User: ${JSON.stringify(err?.response?.data)}`)
  });
  return res.data?.result?.response?.content;
};

module.exports = {
  readUser,
  searchUser,
};
