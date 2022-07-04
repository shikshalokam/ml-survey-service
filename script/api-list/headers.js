const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const querystring = require("querystring");
const jwt = require("jsonwebtoken");

const genToken = async (url, body, type) => {
  const isValid = await validateToken(type);

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (!isValid) {
    const res = await axios.post(url, body, headers).catch((err) => {
      console.log("Error while generateToken", err.response.data);
      return err;
    });
    return res ? res.data.access_token : "";
  } else {
    const token = type === "dev" ? this.dev_token : this.dock_token;

    return token;
  }
};

const validateToken = (type) => {
  const token = type === "dev" ? this.dev_token : this.dock_token;

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
    case "dev":
      url = CONFIG.SUNBIRD.HOST.dev + CONFIG.SUNBIRD.APIS.token;
      body = querystring.stringify({ ...CONFIG.SUNBIRD.config.dev.query });
      this.dev_token = await genToken(url, body, "dev");
      return this.dev_token;
    case "dock":
      url = CONFIG.SUNBIRD.HOST.dock + CONFIG.SUNBIRD.APIS.token;
      body = querystring.stringify({ ...CONFIG.SUNBIRD.config.dock.query });
      this.dock_token = await genToken(url, body, "dock");
      return this.dock_token;
  }
};

const getHeaders = async (isTokenReq, type) => {
  let headers = {};

  switch (type) {
    case "dev":
      headers = {
        "Content-Type": "application/json",
        Authorization: CONFIG.SUNBIRD.config.dev.authorization,
      };
      if (isTokenReq) {
        headers["x-authenticated-user-token"] = await generateToken("dev");
      }
      break;

    case "dock":
      headers = {
        "Content-Type": "application/json",
        Authorization: CONFIG.SUNBIRD.config.dock.authorization,
      };
      if (isTokenReq) {
        headers["x-authenticated-user-token"] = await generateToken("dock");
      }
      break;
  }

  return headers;
};

module.exports = {
  getHeaders,
};
