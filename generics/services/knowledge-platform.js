
const request = require('request');
const CREATION_PORTAL_URL = process.env.CREATION_PORTAL_URL

const headers = {
  "content-type": "application/json",
  "Authorization": process.env.CREATION_PORTAL_AUTHORIZATION_KEY
}

const copyQuestionSet = function (copyReq, questionSetId) {
  const copyQuestionSetUrl = CREATION_PORTAL_URL + messageConstants.endpoints.COPY_QUESTION_SET + "/" + questionSetId;
  const options = {
    headers,
    json: { request: { questionset: copyReq } }
  };


  return new Promise((resolve, reject) => {
    try {

      const copyQuestionSetCallback = function (err, data) {
        if (err || data.statusCode != 200) {
          return reject({
            message: messageConstants.apiResponses.QUESTIONSET_NOT_FOUND,
            status: httpStatusCode.bad_request.status,
          })
        } else if (data.statusCode == 200) {
          let response = data.body
          return resolve(response);

        }
      }
      request.post(copyQuestionSetUrl, options, copyQuestionSetCallback)

    } catch (error) {
      return reject(error);
    }
  })

}

const readQuestionSet = function (copiedQuestionsetId) {
  return new Promise((resolve, reject) => {
    try {

      let url = CREATION_PORTAL_URL + messageConstants.endpoints.READ_QUESTION_SET + "/" + copiedQuestionsetId + "?mode=edit";
      const readQuestionSetCallBack = function (err, data) {


        if (err || data.statusCode != 200) {
          return reject({
            message: messageConstants.apiResponses.QUESTIONSET_NOT_FOUND,
            status: httpStatusCode.bad_request.status,
          })
        } else if (data.statusCode == 200) {
          let readRes = JSON.parse(data.body)
          return resolve(readRes)
        }
      }
      request.get(url, { headers: headers }, readQuestionSetCallBack)

    } catch (error) {
      return reject(error);
    }
  })

}

const updateQuestionSetHierarchy = function (req) {
  return new Promise((resolve, reject) => {
    try {

      let updateUrl = CREATION_PORTAL_URL + messageConstants.endpoints.UPDATE_QUESTION_SET_HIERARCHY;
      function updateQuestionSetHierarchyCallBack(err, data) {
        if (err || data.statusCode != 200) {
          return reject({
            message: messageConstants.apiResponses.QUESTIONSET_NOT_FOUND,
            status: httpStatusCode.bad_request.status,
          })
        } else if (data.statusCode == 200) {
          return resolve({
            status: data.statusCode
          })
        }
      }
      request.patch(updateUrl, { headers: headers, json: true, json: req }, updateQuestionSetHierarchyCallBack)

    } catch (error) {
      return reject(error);
    }
  })

}

const publishQuestionSet = function (questionsetId) {
  return new Promise((resolve, reject) => {
    try {

      let publishUrl = `${CREATION_PORTAL_URL}${messageConstants.endpoints.PUBLISH_QUESTION_SET}/${questionsetId}`;
      async function publishQuestionSetCallBack(err, data) {
        if (err || data.statusCode != 200) {
          const errmsg = JSON.parse(data.body)
          return reject({
            message: errmsg.errmsg || messageConstants.apiResponses.QUESTIONSET_NOT_FOUND,
            status: httpStatusCode.bad_request.status,
          })
        } else if (data.statusCode == 200) {
          return resolve({
            status: data.statusCode

          })
        }
      }
      request.post(publishUrl, { headers: headers }, publishQuestionSetCallBack)

    } catch (error) {
      return reject(error);
    }
  })

}

const updateQuestionSet = function (updateReq, referenceQuestionSetId) {
  return new Promise((resolve, reject) => {
    try {
      let updateUrl = CREATION_PORTAL_URL + messageConstants.endpoints.UPDATE_QUESTION_SET + "/" + referenceQuestionSetId;
      const options = {
        headers,
        json: true,
        json: { request: { questionset: updateReq } }
      };
      function updateQuestionSetCallBack(err, data) {
        if (err || data.statusCode != 200) {
          return reject({
            message: messageConstants.apiResponses.QUESTIONSET_NOT_FOUND,
            status: httpStatusCode.bad_request.status,
          })
        } else if(data.statusCode == 200) {
            return resolve({
              status: data.statusCode
            })
        }
      }
      request.patch(updateUrl, options, updateQuestionSetCallBack)

    } catch (error) {
      return reject(error);
    }
  })
}

const readQuestion = function (questionId = "") {
  return new Promise(async (resolve, reject) => {
    try {
      let url = CREATION_PORTAL_URL + messageConstants.endpoints.READ_QUESTION;
      const fields = ["body","question","primaryCategory","mimeType","qType","answer","templateId","responseDeclaration","interactionTypes","interactions","name","solutions","editorState","media","remarks","evidence","hints","instructions","numberOnly","characterLimit","showEvidence","evidenceMimeType","showRemarks","remarksLimit","markAsNotMandatory"]
      if (questionId !== "") {
        url =
          url +
          "/" +
          questionId +
          "?" +
          `fields=${fields.join(",")}`;
      }


      const options = {
        headers: headers,
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
  copyQuestionSet: copyQuestionSet,
  readQuestionSet: readQuestionSet,
  updateQuestionSetHierarchy: updateQuestionSetHierarchy,
  publishQuestionSet: publishQuestionSet,
  updateQuestionSet: updateQuestionSet,
  readQuestion: readQuestion,
};