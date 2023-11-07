const usersHelper = require(MODULES_BASE_PATH + "/users/helper");

var messageReceived = function (message) {
  return new Promise(async function (resolve, reject) {
    try {
      let parsedMessage = JSON.parse(message.value);
      if (parsedMessage.edata.action === "delete-user") {
        await usersHelper.userDelete(parsedMessage);
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
