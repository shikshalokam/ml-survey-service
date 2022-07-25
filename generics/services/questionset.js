
const request = require('request');
const CREATION_PORTAL_URL = process.env.CREATION_PORTAL_URL


const copyQuestionSet = function (copyReq, questionSetId) {
  const copyQuestionSetUrl = CREATION_PORTAL_URL + messageConstants.endpoints.COPY_QUESTION_SET + "/" + questionSetId;
  const headers = {
    "content-type": "application/json",
    "Authorization": "Bearer " + process.env.CREATION_PORTAL_AUTHORIZATION_KEY
  }
  const options = {
    headers,
    json: true,
    json: { request: { questionset: copyReq } }
  };
  console.log("")


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
      const headers = {
        "content-type": "application/json",
        "Authorization": "Bearer " + process.env.CREATION_PORTAL_AUTHORIZATION_KEY
      }
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
      console.log("errt", error)
      return reject(error);
    }
  })

}

const updateQuestionSetHierarchy = function (req) {
  return new Promise((resolve, reject) => {
    try {

      let updateUrl = CREATION_PORTAL_URL + messageConstants.endpoints.UPDATE_QUESTION_SET_HIERARCHY;
      const headers = {
        "content-type": "application/json",
        "Authorization": "Bearer " + process.env.CREATION_PORTAL_AUTHORIZATION_KEY
      }
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
      const headers = {
        "content-type": "application/json",
        "Authorization": "Bearer " + process.env.CREATION_PORTAL_AUTHORIZATION_KEY
      }
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

const updateQuestionSet = function (updateReq, migratedId) {
  return new Promise((resolve, reject) => {
    try {
      const headers = {
        "content-type": "application/json",
        "Authorization": "Bearer " + process.env.CREATION_PORTAL_AUTHORIZATION_KEY
      }
      let updateUrl = CREATION_PORTAL_URL + messageConstants.endpoints.UPDATE_QUESTION_SET + "/" + migratedId;
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

module.exports = {
  copyQuestionSet: copyQuestionSet,
  readQuestionSet: readQuestionSet,
  updateQuestionSetHierarchy: updateQuestionSetHierarchy,
  publishQuestionSet: publishQuestionSet,
  updateQuestionSet: updateQuestionSet
};