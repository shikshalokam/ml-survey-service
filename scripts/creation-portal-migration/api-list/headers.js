const queryString = require('query-string');
const { default: axios } = require("axios");
const { CONFIG } = require("../constants/config");
const jwt = require("jsonwebtoken");
const logger = require("../logger");

const ED = 'ed';
const CREATION_PORTAL = 'creation_portal'


// only check token was expired or not 
const validateToken = (type) => {

    const token = type === "ed" ? this.ed_token : this.creation_portal_token;

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


// Generate Token if invalid token
const genToken = async (url, body, type) => {
    const isValid = await validateToken(type);

    console.log(isValid);

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    };

    // if Not true 
    if (!isValid) {
        try {
            const result = await axios.post(url, body, headers);
            console.log(result);
            return result ? result?.data?.access_token : "";
        } catch (error) {
            logger.error(`Error while generateToken Error: ${JSON.stringify(error?.response?.data)}`)
            console.log(`Error while generateToken Error: ${JSON.stringify(error?.response?.data)}`);
            return "";
        }
    } else {
        const token = type === ED ? this.ed_token : this.creation_portal_token
        return token;
    }

}



// Generate token 
const generateToken = async (type) => {

    let url = "";
    let body = {};

    switch (type) {
        case ED:
            url = CONFIG.HOST.ed + CONFIG.APIS.token;
            body = queryString.stringify({ ...CONFIG.KEYS.ED.QUERY });
            console.log(body);
            this.ed_token = await genToken(url, body, ED);
            return this.ed_token;

        case CREATION_PORTAL:
            url = CONFIG.HOST.creation_portal + CONFIG.APIS.token;
            body = queryString.stringify({ ...CONFIG.KEYS.CREATION_PORTAL });
            this.creation_portal_token = await genToken(url, body, CREATION_PORTAL);
            return this.creation_portal_token;
        default:
            return null;
    }
}



// header for apis
const getHeaders = async (isTokenReq, type) => {

    let headers = {};

    switch (type) {

        case ED:
            headers = {
                "Content-Type": "application/json",
                Authorization: CONFIG.KEYS.ED.AUTHORIZATION,
            };
            if (isTokenReq) {
                headers["x-authenticated-user-token"] = await generateToken(ED);
            }
            break;

        case CREATION_PORTAL:
            headers = {
                "Content-Type": "application/json",
                Authorization: CONFIG.KEYS.CREATION_PORTAL.AUTHORIZATION,
            };
            if (isTokenReq) {
                headers["x-authenticated-user-token"] = await generateToken(CREATION_PORTAL);
            }
            break;

        default:
            break;
    }

    return headers;

}


module.exports = { getHeaders };
