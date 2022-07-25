const request = require("request");
const hostUrl = process.env.VDN_HOST;


const genToken = async () => {
  return new Promise(async (resolve, reject) => {
    const query = {
      username: process.env.SUNBIRD_USER,
      password: process.env.SUNBIRD_PWD,
      grant_type: process.env.SUNBIRD_GRANT,
      client_id: process.env.SUNBIRD_CLIENT,
      client_secret: process.env.SUNBIRD_CLIENT_SECRET,
    };

    const url = hostUrl + "/auth/realms/sunbird/protocol/openid-connect/token";
    request.post(url, { form: { ...query } }, genTokenCallback);

    function genTokenCallback(err, res, body) {
      if (err) {
        return reject(err);
      } else {
        return resolve(res?.data?.access_token || "");
      }
    }
  });

  // return res ? res.data.access_token : "";
};

const questionset = function (questionsetId = "") {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await genToken();

      console.log("tokejekkeke", token);
      let url = hostUrl + messageConstants.endpoints.QUESTIONSET_READ;

      if (questionsetId !== "") {
        url = url + "/" + questionsetId + "?" + "mode=edit";
      }

      const options = {
        headers: {
          "content-type": "application/json",
          Authorization: process.env.VDN_AUTHORIZATION,
          "x-authenticated-user-token": token,
        },
      };

      request.get(url, options, questionSetReadCallback);
      let result = {
        success: true,
      };
      function questionSetReadCallback(err, data) {
        if (err) {
          console.log("errr", err);
          result.success = false;
        } else {
          let response = JSON.parse(data.body);
          if (response.responseCode === httpStatusCode["ok"].code) {
            result["data"] = response?.result?.questionSet;
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
      console.log("errrorr", error);
      return reject(error);
    }
  });
};

const question = function (questionId = "") {
  return new Promise(async (resolve, reject) => {
    try {
      console.log();
      const token = await genToken();
      let url = hostUrl + messageConstants.endpoints.QUESTION_READ;

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
          Authorization: process.env.VDN_AUTHORIZATION,
          "x-authenticated-user-token": token,
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
  questionset: questionset,
  question: question,
};
