const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const querystring = require("query-string");
const jwt = require("jsonwebtoken");
const logger = require("../logger");
const constants = require("../constant");

/**
 * To generate the user token
 * @method
 * @name genToken
 * @param {String} url - url
 * @param {querystring} body - body
 * @param {String} type - type of token ( ED || Creation-portal )
 * @returns {string} - Generates the user token
 */
const generateToken = async (url, body, type) => {
  const isValid = await isAValidToken(type);

  const headers = {
    "Content-Type": constants.APPLICATION_URL_ENCODED,
  };

  if (!isValid) {
    try {
      const res = await axios.post(url, body, { headers });
      return res?.data?.access_token || "";
    } catch (err) {
      logger.error(
        `Error while generating token for type ${type}: ${JSON.stringify(err?.response?.data)}`
      );
      return "";
    }
  } else {
    return this[type === constants.ED ? 'ed_token' : 'creation_portal_token'];
  }
};

/**
 * To validate the user token
 * @method
 * @name isAValidToken
 * @param {String} type - type of token ( ED || Creation-portal )
 * @returns {Boolean} - Returns the boolean
 */

const isAValidToken = (type) => {
  const token = type === constants.ED ? this.ed_token : this.creation_portal_token;

  try {
    if (token) {
      const decoded = jwt.decode(token, { header: true });
      return Date.now() < (decoded?.exp * 1000);
    }
    return false;
  } catch (err) {
    logger.error(`Error while validating token for type ${type}: ${err.message}`);
    return false;
  }
};


/**
 * prepare the req-body and calls the generate token
 * @method
 * @name generateUserToken
 * @param {String} type - type
 * @returns {string} - Returns the user token
 */

const generateUserToken = async (type) => {
  let url = "";
  let body = {};

  switch (type) {
    case constants.ED:
      url = CONFIG.HOST.ed + CONFIG.APIS.token;
      body = querystring.stringify({ ...CONFIG.KEYS.ED.QUERY });
      this.ed_token = await generateToken(url, body, constants.ED);
      return this.ed_token;
    case constants.CREATION_PORTAL:
      url = CONFIG.HOST.creation_portal + CONFIG.APIS.token;
      body = querystring.stringify({ ...CONFIG.KEYS.CREATION_PORTAL.QUERY });
      this.creation_portal_token = await generateToken(
        url,
        body,
        constants.CREATION_PORTAL
      );
      return this.creation_portal_token;
    default:
      logger.error(`Invalid token type requested: ${type}`);
      return "";
  }
};

/**
 * get headers based on the environment
 * @method
 * @name getHeaders
 * @param {String} type - type
 * @param {Boolean} isTokenRequired - isTokenReq
 * @returns {Object} - Returns the headers
 */

const getHeaders = async (isTokenRequired, type) => {
  const commonHeaders = {
    "Content-Type": constants.APPLICATION_JSON,
    Authorization: CONFIG.KEYS[type]?.AUTHORIZATION,
  };

  if (isTokenRequired) {
    const token = await generateUserToken(type);
    if (token) {
      commonHeaders["x-authenticated-user-token"] = token;
    } else {
      logger.error(`Failed to retrieve token for type ${type}`);
    }
  }

  return commonHeaders;
};

module.exports = {
  getHeaders,
};
