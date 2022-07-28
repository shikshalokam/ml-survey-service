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
    const token = type === "base" ? this.base_token : this.creation_portal_token;

    return token;
  }
};

const validateToken = (type) => {
  const token = type === "base" ? this.base_token : this.creation_portal_token;

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
    case "creation_portal":
      url = CONFIG.HOST.creation_portal + CONFIG.APIS.token;
      body = querystring.stringify({ ...CONFIG.KEYS.CREATION_PORTAL.QUERY });
      this.creation_portal_token = await genToken(url, body, "creation_portal");
      return this.creation_portal_token;
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

    case "creation_portal":
      headers = {
        "Content-Type": "application/json",
        Authorization: CONFIG.KEYS.CREATION_PORTAL.AUTHORIZATION,
      };
      if (isTokenReq) {
        headers["x-authenticated-user-token"] = await generateToken("creation_portal");
      }
      break;
  }

  return headers;
};

module.exports = {
  getHeaders,
};
