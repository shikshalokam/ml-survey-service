const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const querystring = require("query-string");
const jwt = require("jsonwebtoken");
const logger = require("../logger");
const constants = require('../constant')

/**
* To generate the user token
* @method
* @name genToken
* @param {String} url - url 
* @param {querystring} body - body 
* @param {String} type - type
* 
  * @returns {string} - Generates the user token
*/
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
    return res ? res?.data?.access_token : "";
  } else {
    const token = this.ed_token;
    // type === constants.ED ? this.ed_token : this.ed_token
    // this.creation_portal_token;

    return token;
  }
};

/**
* To validate the user token
* @method
* @name validateToken
* @param {String} type - type
* 
  * @returns {Boolean} - Returns the boolean response  
*/

const validateToken = (type) => {
  const token = type === constants.ED ? this.ed_token : this.ed_token;
  // creation_portal_token;

  try {
    if (token) {
      const decoded = jwt.decode(token, { header: true });
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

/**
* prepare the reqbody and calls the generate token  
* @method
* @name generateToken
* @param {String} type - type
* 
  * @returns {string} - Returns the user token
*/

const generateToken = async (type) => {
  let url = "";
  let body = {};
  url = CONFIG.HOST.ed + CONFIG.APIS.token;
  switch (type) {
    case constants.ED:
      // url = CONFIG.HOST.ed + CONFIG.APIS.token;
      body = querystring.stringify({ ...CONFIG.KEYS.ED.QUERY });
      this.ed_token = await genToken(url, body, constants.ED);
      return this.ed_token;
    case constants.CREATION_PORTAL:
      // url = CONFIG.HOST.creation_portal + CONFIG.APIS.token;
      body = querystring.stringify({ ...CONFIG.KEYS.CREATION_PORTAL.QUERY });
      this.creation_portal_token = await genToken(url, body, constants.CREATION_PORTAL);
      return this.creation_portal_token;
  }
};

/**
* get headers based on the environment
* @method
* @name getHeaders
* @param {String} type - type
* @param {Boolean} isTokenReq - isTokenReq
* 
  * @returns {Object} - Returns the headers
*/

const getHeaders = async (isTokenReq, type) => {
  let headers = {};

  switch (type) {
    case constants.ED:
      headers = {
        "Content-Type": "application/json",
        Authorization: CONFIG.KEYS.ED.AUTHORIZATION,
      };
      if (isTokenReq) {
        headers["x-authenticated-user-token"] = await generateToken(constants.ED);
      }
      break;

    case constants.CREATION_PORTAL:
      headers = {
        "Content-Type": "application/json",
        Authorization: CONFIG.KEYS.CREATION_PORTAL.AUTHORIZATION,
      };
      if (isTokenReq) {
        headers["x-authenticated-user-token"] = await generateToken(constants.CREATION_PORTAL);
      }
      break;
  }

  return headers;
};

module.exports = {
  getHeaders,
};
