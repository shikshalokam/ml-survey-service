const request = require("request");
const hostUrl = process.env.CREATION_PORTAL_URL;


const readQuestion = function (questionId = "") {
  return new Promise(async (resolve, reject) => {
    try {
      let url = hostUrl + messageConstants.endpoints.READ_QUESTION;

      if (questionId !== "") {
        url =
          url +
          "/" +
          questionId +
          "?" +
          "fields=body,question,primaryCategory,mimeType,qType,answer,templateId,responseDeclaration,interactionTypes,interactions,name,solutions,editorState,media,remarks,evidence,hints,instructions,name,numberOnly,characterLimit,showEvidence,evidenceMimeType,showRemarks,remarksLimit,markAsNotMandatory";
      }

      const options = {
        headers: {
          "content-type": "application/json",
          Authorization: process.env.CREATION_PORTAL_AUTHORIZATION_KEY,
        },
      };

      request.get(url, options, questionReadCallback);
      let result = {
        success: true,
      };
      function questionReadCallback(err, data) {

        if (err) {
          result.success = false;
        } else {
          let response = JSON.parse(data.body);
          if (response.responseCode === httpStatusCode["ok"].code) {
            result["data"] = response?.result?.question;
          } else {
            result.success = false;
          }
        }

        return resolve(result);
      }
      setTimeout(function () {
        return resolve(
          (result = {
            success: false,
          })
        );
      }, messageConstants.common.SERVER_TIME_OUT);
    } catch (error) {
      return reject(error);
    }
  });
};

module.exports = {
  readQuestion: readQuestion,
};
