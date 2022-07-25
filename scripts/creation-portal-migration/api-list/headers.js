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
    const token = type === "base" ? this.base_token : this.vdn_token;

    return token;
  }
};

const validateToken = (type) => {
  const token = type === "base" ? this.base_token : this.vdn_token;

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
    case "base":
      url = CONFIG.HOST.base + CONFIG.APIS.token;
      body = querystring.stringify({ ...CONFIG.KEYS.BASE.QUERY });
      this.base_token = await genToken(url, body, "base");
      return this.base_token;
    case "vdn":
      url = CONFIG.HOST.vdn + CONFIG.APIS.token;
      body = querystring.stringify({ ...CONFIG.KEYS.VDN.QUERY });
      this.vdn_token = await genToken(url, body, "vdn");
      return this.vdn_token;
  }
};

const getHeaders = async (isTokenReq, type) => {
  let headers = {};

  switch (type) {
    case "base":
      headers = {
        "Content-Type": "application/json",
        Authorization: CONFIG.KEYS.BASE.AUTHORIZATION,
      };
      if (isTokenReq) {
        headers["x-authenticated-user-token"] = await generateToken("base");
      }
      break;

    case "vdn":
      headers = {
        "Content-Type": "application/json",
        Authorization: CONFIG.KEYS.VDN.AUTHORIZATION,
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
