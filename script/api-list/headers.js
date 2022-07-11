const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const querystring = require("querystring");
const jwt = require("jsonwebtoken");
const logger = require("../logger");

const genToken = async (url, body, type) => {
  const isValid = await validateToken(type);

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (!isValid) {
    const res = await axios.post(url, body, headers).catch((err) => {
      logger.error(`Error while generateToken Error: ${JSON.stringify(err?.response?.data)}`)
      return err;
    });
    return res ? res.data.access_token : "";
  } else {
    const token = type === "sunbird" ? this.sunbird_token : this.vdn_token;

    return token;
  }
};

const validateToken = (type) => {
  const token = type === "sunbird" ? this.sunbird_token : this.vdn_token;

  try {
    jwt.verify(token, "shhhhh");
    return true;
  } catch (err) {
    return false;
  }
};

const generateToken = async (type) => {
  let url = "";
  let body = {};

  switch (type) {
    case "sunbird":
      url = CONFIG.SUNBIRD.HOST.sunbird + CONFIG.SUNBIRD.APIS.token;
      body = querystring.stringify({ ...CONFIG.SUNBIRD.config.sunbird.query });
      this.sunbird_token = await genToken(url, body, "sunbird");
      return this.sunbird_token;
    case "vdn":
      url = CONFIG.SUNBIRD.HOST.vdn + CONFIG.SUNBIRD.APIS.token;
      body = querystring.stringify({ ...CONFIG.SUNBIRD.config.vdn.query });
      this.vdn_token = await genToken(url, body, "vdn");
      return this.vdn_token;
  }
};

const getHeaders = async (isTokenReq, type) => {
  let headers = {};

  switch (type) {
    case "sunbird":
      headers = {
        "Content-Type": "application/json",
        Authorization: CONFIG.SUNBIRD.config.sunbird.authorization,
      };
      if (isTokenReq) {
        headers["x-authenticated-user-token"] = await generateToken("sunbird");
      }
      break;

    case "vdn":
      headers = {
        "Content-Type": "application/json",
        Authorization: CONFIG.SUNBIRD.config.vdn.authorization,
      };
      if (isTokenReq) {
        headers["x-authenticated-user-token"] = await generateToken("vdn");
      }
      break;
  }

  return headers;
};

module.exports = {
  getHeaders,
};
