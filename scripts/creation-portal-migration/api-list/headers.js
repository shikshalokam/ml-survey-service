const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const querystring = require("query-string");
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
    const token = type === "ed" ? this.ed_token : this.creation_portal_token;

    return token;
  }
};

const validateToken = (type) => {
  const token = type === "ed" ? this.ed_token : this.creation_portal_token;

  try {
    if (token) {
      const decoded = jwt.decode(token, {header: true});
      if (Date.now() >= decoded?.exp * 1000) {
        return false;
      }
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

const generateToken = async (type) => {
  let url = "";
  let body = {};

  switch (type) {
    case "ed":
      url = CONFIG.HOST.ed + CONFIG.APIS.token;
      body = querystring.stringify({ ...CONFIG.KEYS.ED.QUERY });
      this.ed_token = await genToken(url, body, "ed");
      return this.ed_token;
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
    case "ed":
      headers = {
        "Content-Type": "application/json",
        Authorization: CONFIG.KEYS.ED.AUTHORIZATION,
      };
      if (isTokenReq) {
        headers["x-authenticated-user-token"] = await generateToken("ed");
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
