const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const logger = require("../logger");
const { getHeaders } = require("./headers");
const constants = require("../constant");

/**
 * To search the users
 * @method
 * @name searchUser
 * @param {String[]} userId - ["c5bd1056-d7c7-4f62-ae18-a121490cdd7f"]
 * @returns {JSON} - returns the users list
 **/


const searchUser = function (userId) {
  const url = CONFIG.HOST.ed + CONFIG.APIS.search_user;
  const config = {
    method: constants.METHOD.POST,
    url: url,
    headers: null,
    data: {
      request: { filters: { id: userId } },
    },
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(true, constants.ED);

      axios(config)
        .then((res) => {
          resolve(res?.data?.result?.response?.content);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while searching User: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          reject(errorResponse);
        });
    } catch (error) {
      reject(error);
    }
  });
};


/**
* To search the user org in open saber reg
* @method
* @name getOpenSaberUserOrgId
* @returns {JSON} - returns
"User_Org": [
  {
      "osUpdatedAt": "2021-05-11T06:07:45.534Z",
      "osCreatedAt": "2021-05-11T06:07:45.534Z",
      "@type": "User_Org",
      "roles": [
          "user",
          "sourcing_reviewer"
        ],
      "osid": "0933fa92-729f-4a77-b5d7-cba40f68b4eb",
      "userId": "d59873a0-40ea-461b-9402-ab090932f92d",
      "orgId": "7c5a96ca-bef8-4027-8736-4fa1ae6f9180"
    }
  ]
**/

const getOpenSaberUserOrgId = function (userIds) {
  const query = {
    id: "open-saber.registry.search",
    ver: "1.0",
    ets: "11234",
    params: {
      did: "",
      key: "",
      msgid: "",
    },
    request: {
      entityType: ["User_Org"],
      filters: {
        userId: {
          or: [userIds],
        },
      },
    },
  };

  const url = CONFIG.HOST.creation_portal + CONFIG.APIS.open_saber_user_org_search;
  const config = {
    method: constants.METHOD.POST,
    url: url,
    headers: null,
    data: query,
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(true, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          resolve(res?.data?.result?.Org || []);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while searching User: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          reject(errorResponse);
        });
    } catch (error) {
      reject(error);
    }
  });
};


module.exports = {
  searchUser,
  getOpenSaberUserOrgId,
};
