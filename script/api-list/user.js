const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const { getHeaders } = require("./headers");

const readUser = async (userId) => {
  const params = "organisations,roles,locations,declarations,externalIds";
  const url =
    CONFIG.SUNBIRD.HOST.dev +
    CONFIG.SUNBIRD.APIS.read_user +
    userId +
    "?fields=" +
    params;

  const res = await axios
    .get(url, await getHeaders(true, "dev"))
    .catch((err) => {
      console.log("Error while reading User", err.response.data);
    });
};

const searchUser = async (userId) => {
  const url = CONFIG.SUNBIRD.HOST.dev + CONFIG.SUNBIRD.APIS.search_user;
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, "dev"),
    data: {
      request: { filters: { id: userId } },
    },
  };

  const res = await axios(config).catch((err) => {
    console.log("Error while searching User", err.response.data);
  });
  return res.data?.result?.response?.content;
};

module.exports = {
  readUser,
  searchUser,
};
