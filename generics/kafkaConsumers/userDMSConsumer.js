const usersHelper = require(MODULES_BASE_PATH + "/users/helper");
let kafkaClient = require(ROOT_PATH + "/generics/helpers/kafkaCommunications");
var messageReceived = function (message) {
  return new Promise(async function (resolve, reject) {
    try {
      let parsedMessage = JSON.parse(message.value);
      if (parsedMessage.edata.action === "delete-user") {
        let userDataUpdateSatus = await usersHelper.userDelete(parsedMessage);
        if (userDataUpdateSatus.success === true) {
          let msgData = await gen.utils.getTelemetryEvent(parsedMessage);
          let telemetryEvent = {
            timestamp: new Date(),
            msg: JSON.stringify(msgData),
            lname: "TelemetryEventLogger",
            tname: "",
            level: "INFO",
            HOSTNAME: "",
            "application.home": "",
          };
          await kafkaClient.pushTelemetryEventToKafka(telemetryEvent);
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
