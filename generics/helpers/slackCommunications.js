const Request = require('./httpRequest');
const slackCommunicationsOnOff = process.env.SLACK_COMMUNICATIONS_ON_OFF
const sendRubricErrorMessagesToSlack = process.env.RUBRIC_ERROR_MESSAGES_TO_SLACK
const slackToken = process.env.SLACK_TOKEN
const exceptionLogPostUrl = process.env.SLACK_EXCEPTION_LOG_URL;
const sendKafkaErrorMessagesToSlack = (!process.env.KAFKA_ERROR_MESSAGES_TO_SLACK || !process.env.KAFKA_ERROR_MESSAGES_TO_SLACK != "OFF") ? "ON" : "OFF"

const headers = { "Content-Type": "application/json", token: slackToken }

const sendExceptionLogMessage = function (errorObject) {

  if (slackCommunicationsOnOff === "ON" && slackToken != "" && gen.utils.checkIfStringIsUrl(exceptionLogPostUrl)) {
    const reqObj = new Request()
    let attachmentData = new Array
    let fieldsData = new Array
    Object.keys(_.pick(errorObject, ["method", "url", "errorStack"])).forEach(objProperty => {
      fieldsData.push({
        title: objProperty,
        value: errorObject[objProperty],
        short: false
      })
    })

    Object.keys(_.pick(errorObject.headers, ["x-channel-id", "gpslocation", "x-authenticated-userid"])).forEach(objProperty => {
      fieldsData.push({
        title: objProperty,
        value: errorObject.headers[objProperty],
        short: false
      })
    })

    Object.keys(errorObject.customFields).forEach(customField => {
      fieldsData.push({
        title: customField,
        value: errorObject.customFields[customField],
        short: false
      })
    })

    fieldsData.push({
      title: "Environment",
      value: process.env.NODE_ENV,
      short: false
    })

    let attachment = {
      color: "#36a64f",
      pretext: errorObject.errorMsg,
      text: "More information below",
      fields: fieldsData
    }
    attachmentData.push(attachment)
    var options = {
      json: {
        text: "Exception Logs",
        attachments: attachmentData
      }
    }

    options.headers = headers

    let returnResponse = {}

    new Promise((resolve, reject) => {
      return resolve(reqObj.post(
        exceptionLogPostUrl,
        options
      ));
    }).then(result => {
      if (result.data === "ok") {
        returnResponse = {
          success: true,
          message: "Slack message posted."
        }
      } else {
        throw Error("Slack message was not posted")
      }
      return returnResponse
    }).catch((err) => {
      returnResponse = {
        success: false,
        message: "Slack message was not posted"
      }
      return returnResponse
    })

  } else {
    return {
      success: false,
      message: "Slack configuration is not done"
    }
  }

}

const rubricErrorLogs = function (errorMessage) {
  if (slackCommunicationsOnOff === "ON" && sendRubricErrorMessagesToSlack === "ON" && slackToken != "" && gen.utils.checkIfStringIsUrl(exceptionLogPostUrl)) {
    const reqObj = new Request()
    let attachmentData = new Array
    let fieldsData = new Array

    Object.keys(errorMessage).forEach(objValue => {
      fieldsData.push({
        title: objValue,
        value: errorMessage[objValue],
        short: false
      })
    })

    fieldsData.push({
      title: "Environment",
      value: process.env.NODE_ENV,
      short: false
    })

    let attachment = {
      color: "#e00f2b",
      pretext: errorMessage,
      text: "More information below",
      fields: fieldsData
    }
    attachmentData.push(attachment)

    var options = {
      json: {
        text: "Rubric Error Logs",
        attachments: attachmentData
      }
    }

    options.headers = headers

    let returnResponse = {}

    new Promise((resolve, reject) => {
      return resolve(reqObj.post(
        exceptionLogPostUrl,
        options
      ));
    }).then(result => {
      if (result.data === "ok") {
        returnResponse = {
          success: true,
          message: "Slack message posted."
        }
      } else {
        throw Error("Slack message was not posted")
      }
      return returnResponse
    }).catch((err) => {
      returnResponse = {
        success: false,
        message: "Slack message was not posted"
      }
      return returnResponse
    })

  } else {
    return {
      success: false,
      message: "Slack configuration is not done"
    }
  }
}

const badSharedLinkAccessAttemptAlert = function (errorMessage) {
  if (slackCommunicationsOnOff === "ON" && slackToken != "" && gen.utils.checkIfStringIsUrl(exceptionLogPostUrl)) {
    const reqObj = new Request()
    let attachmentData = new Array
    let fieldsData = new Array

    Object.keys(_.pick(errorMessage, ["method", "url", "errorStack"])).forEach(objProperty => {
      fieldsData.push({
        title: objProperty,
        value: errorMessage[objProperty],
        short: false
      })
    })

    Object.keys(_.pick(errorMessage.headers, ["x-channel-id", "gpslocation", "x-authenticated-userid"])).forEach(objProperty => {
      fieldsData.push({
        title: objProperty,
        value: errorMessage.headers[objProperty],
        short: false
      })
    })

    errorMessage.customFields && Object.keys(errorMessage.customFields).forEach(customField => {
      fieldsData.push({
        title: customField,
        value: errorMessage.customFields[customField],
        short: false
      })
    })


    fieldsData.push({
      title: "App Details",
      value: errorMessage.headers["user-agent"],
      short: false
    })

    fieldsData.push({
      title: "User Details",
      value: "NON_LOGGED_IN_USER",
      short: false
    })

    fieldsData.push({
      title: "User IP",
      value: errorMessage.userIP || "",
      short: false
    })

    fieldsData.push({
      title: "Environment",
      value: process.env.NODE_ENV,
      short: false
    })

    let attachment = {
      color: "#3cad08",
      pretext: errorMessage.errorMsg,
      text: "More information below",
      fields: fieldsData
    }
    attachmentData.push(attachment)

    var options = {
      json: {
        text: "Non Logged In User Error Logs",
        attachments: attachmentData
      }
    }

    options.headers = headers

    let returnResponse = {}

    new Promise((resolve, reject) => {
      return resolve(reqObj.post(
        exceptionLogPostUrl,
        options
      ));
    }).then(result => {
      if (result.data === "ok") {
        returnResponse = {
          success: true,
          message: "Slack message posted."
        }
      } else {
        throw Error("Slack message was not posted")
      }
      return returnResponse
    }).catch((err) => {
      returnResponse = {
        success: false,
        message: "Slack message was not posted"
      }
      return returnResponse
    })

  } else {
    return {
      success: false,
      message: "Slack configuration is not done"
    }
  }
}

const kafkaErrorAlert = function (errorMessage) {
  if (slackCommunicationsOnOff === "ON" && sendKafkaErrorMessagesToSlack === "ON" && slackToken != "") {

    const reqObj = new Request()
    let attachmentData = new Array
    let fieldsData = new Array

    Object.keys(errorMessage.formData).forEach(objValue => {
      fieldsData.push({
        title: objValue,
        value: errorMessage.formData[objValue],
        short: false
      })
    })

    fieldsData.push({
      title: "Environment",
      value: process.env.NODE_ENV,
      short: false
    })

    let attachment = {
      color: "#7296a1",
      pretext: errorMessage,
      text: "More information below",
      fields: fieldsData
    }
    attachmentData.push(attachment)

    var options = {
      json: {
        text: "Kafka Error Logs",
        attachments: attachmentData
      }
    }


    let returnResponse = {}

    new Promise((resolve, reject) => {
      return resolve(reqObj.post(
        exceptionLogPostUrl,
        options
      ));
    }).then(result => {
      if (result.data === "ok") {
        returnResponse = {
          success: true,
          message: "Slack message posted."
        }
      } else {
        throw Error("Slack message was not posted")
      }
      return returnResponse
    }).catch((err) => {
      returnResponse = {
        success: false,
        message: "Slack message was not posted"
      }
      return returnResponse
    })

  } else {
    return {
      success: false,
      message: "Slack configuration is not done"
    }
  }
}

module.exports = {
  sendExceptionLogMessage: sendExceptionLogMessage,
  rubricErrorLogs: rubricErrorLogs,
  badSharedLinkAccessAttemptAlert: badSharedLinkAccessAttemptAlert,
  kafkaErrorAlert:kafkaErrorAlert
};

