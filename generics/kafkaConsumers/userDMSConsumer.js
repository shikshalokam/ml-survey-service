/**
 * name : userDMSConsumer.js
 * author : Ankit Shahu
 * created-date : 10-Nov-2023
 * Description : User delete consumer.
 */
const usersHelper = require(MODULES_BASE_PATH + "/users/helper");

/**
 * user delete consumer message received.
 * @function
 * @name messageReceived
 * @param {Object} message - consumer data
 * {
 *   highWaterOffset:63
 *   key:null
 *   offset:62
 *   partition:0
 *   topic:'deleteuser'
 *   value:'{"eid":"BE_JOB_REQUEST","ets":1619527882745,"mid":"LP.1619527882745.32dc378a-430f-49f6-83b5-bd73b767ad36","actor":{"id":"delete-user","type":"System"},"context":{"channel":"01309282781705830427","pdata":{"id":"org.sunbird.platform","ver":"1.0"},"env":"dev"},"object":{"id":"<deleted-userId>","type":"User"},"edata":{"organisationId":"0126796199493140480","userId":"a102c136-c6da-4c6c-b6b7-0f0681e1aab9","suggested_users":[{"role":"ORG_ADMIN","users":["<orgAdminUserId>"]},{"role":"CONTENT_CREATOR","users":["<contentCreatorUserId>"]},{"role":"COURSE_MENTOR","users":["<courseMentorUserId>"]}],"action":"delete-user","iteration":1}}'
 * }
 * @returns {Promise} return a Promise.
 */
var messageReceived = function (message) {
  return new Promise(async function (resolve, reject) {
    try {
      let parsedMessage = JSON.parse(message.value);
      if (parsedMessage.edata.action === "delete-user") {
        let userDataUpdateSatus = await usersHelper.userDelete(parsedMessage);
        if (userDataUpdateSatus.success === true) {
          return resolve("Message Processed.");
        } else {
          return resolve("Message Processed.");
        }
      }
    } catch (error) {
      return reject(error);
    }
  });
};

var errorTriggered = function (error) {
  return new Promise(function (resolve, reject) {
    try {
      return resolve("Error Processed");
    } catch (error) {
      return reject(error);
    }
  });
};

module.exports = {
  messageReceived: messageReceived,
  errorTriggered: errorTriggered,
};
