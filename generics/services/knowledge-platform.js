const request = require('request');
const CREATION_PORTAL_URL = process.env.CREATION_PORTAL_URL

const headers = {
    "content-type": "application/json",
    "Authorization": "Bearer " + process.env.CREATION_PORTAL_AUTHORIZATION_KEY
}

/**
 * To create a copy of a specified question set in the creation portal
 * @method
 * @name copyQuestionSet
 * @param {Object} copyReq - The copy request payload containing questionset details
 * @param {String} questionSetId - Unique identifier for the question set to be copied
 * @returns {JSON} - {
    "id": "api.questionset.copy",
    "ver": "3.0",
    "ts": "2023-06-23T06:41:31ZZ",
    "params": {
        "resmsgid": "8bba3dda-f81e-4659-8c05-55caed20d174",
        "msgid": null,
        "err": null,
        "status": "successful",
        "errmsg": null
    },
    "responseCode": "OK",
    "result": {
        "node_id": {
            "do_2138240203066900481600": "do_2138240204082216961601"
        },
        "versionKey": "1687502491400"
    }
}
 */
const copyQuestionSet = function (copyReq, questionSetId) {
    const options = {
        headers,
        json: { request: { questionset: copyReq } }
    };

    return new Promise((resolve, reject) => {
        try {
            const copyQuestionSetUrl = CREATION_PORTAL_URL + messageConstants.endpoints.COPY_QUESTION_SET + "/" + questionSetId;

            const copyQuestionSetCallback = function (err, data) {
                if (err || data.statusCode != httpStatusCode.ok.status) {
                    return reject({
                        message: messageConstants.apiResponses.QUESTIONSET_NOT_FOUND,
                        status: httpStatusCode.bad_request.status,
                    })
                } else if (data.statusCode == httpStatusCode.ok.status) {
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

/**
 * To retrieve details of a specific question set from  creation portal
 * @method
 * @name readQuestionSet
 * @param {String} copiedQuestionsetId - Unique identifier for the question set to be read
 * @returns {JSON} - {
  "id": "api.questionset.read",
  "ver": "3.0",
  "ts": "2021-02-03T09:23:51ZZ",
  "params": {
    "resmsgid": "e9e05900-793b-4231-af75-ffa1a7a0b4c6",
    "msgid": null,
    "err": null,
    "status": "successful",
    "errmsg": null
  },
  "responseCode": "OK",
  "result": {
    "questionset": {
      "code": "finemanfine",
      "allowSkip": "Yes",
      "containsUserData": "No",
      "description": "hey",
      "language": [
        "English"
      ],
      "mimeType": "application/vnd.sunbird.questionset",
      "showHints": "No",
      "createdOn": "2021-02-03T09:23:34.060+0000",
      "objectType": "QuestionSet",
      "primaryCategory": "Practice Question Set",
      "contentDisposition": "inline",
      "lastUpdatedOn": "2021-02-03T09:23:34.060+0000",
      "contentEncoding": "gzip",
      "showSolutions": "Yes",
      "allowAnonymousAccess": "Yes",
      "identifier": "do_113208323801554944120",
      "lastStatusChangedOn": "2021-02-03T09:23:34.060+0000",
      "requiresSubmit": "Yes",
      "visibility": "Default",
      "showTimer": "No",
      "summaryType": "Complete",
      "consumerId": "fa13b438-8a3d-41b1-8278-33b0c50210e4",
      "setType": "materialised",
      "languageCode": [
        "en"
      ],
      "version": 1,
      "versionKey": "1612344214060",
      "showFeedback": "Yes",
      "license": "CC BY 4.0",
      "compatibilityLevel": 4,
      "name": "Test Question Set",
      "navigationMode": "linear",
      "shuffle": "Yes",
      "status": "Draft"
    }
  }
}
 */
const readQuestionSet = function (copiedQuestionsetId) {
    return new Promise((resolve, reject) => {
        try {
            let readQuestionSeturl = CREATION_PORTAL_URL + messageConstants.endpoints.READ_QUESTION_SET + "/" + copiedQuestionsetId + "?mode=edit";

            const readQuestionSetCallBack = function (err, data) {
                if (err || data.statusCode != httpStatusCode.ok.status) {
                    return reject({
                        message: messageConstants.apiResponses.QUESTIONSET_NOT_FOUND,
                        status: httpStatusCode.bad_request.status,
                    })
                } else if (data.statusCode == httpStatusCode.ok.status) {
                    let readRes = JSON.parse(data.body)
                    return resolve(readRes)
                }
            }
            request.get(readQuestionSeturl, { headers: headers }, readQuestionSetCallBack)

        } catch (error) {
            return reject(error);
        }
    })
}

/**
* To update the question set with hierarchy and branchinglogic in creation portal
* @method
* @name updateQuestionSetHierarchy
* @param {Object} templateData - 
{
    "request": {
        "data": {
            "nodesModified": {
                "Comments and Reflection:": {
                    "metadata": {
                        "code": "Q1_1620904465409-1620904788217",
                        "name": "Comments and Reflection:",
                        "description": "Matrix description",
                        "mimeType": "application/vnd.sunbird.questionset",
                        "primaryCategory": "observation",
                        "allowMultipleInstances": "Yes",
                        "instances": {
                            "label": "Matrix"
                        }
                    },
                    "objectType": "QuestionSet",
                    "root": false,
                    "isNew": true
                },
                "Comments and Reflection: 2": {
                    "metadata": {
                        "code": "Q4_1620904465409-1620904788222",
                        "name": "Comments and Reflection: 2",
                        "description": "Matrix description",
                        "mimeType": "application/vnd.sunbird.questionset",
                        "primaryCategory": "observation",
                        "allowMultipleInstances": "Yes",
                        "instances": {
                            "label": "Matrix2"
                        }
                    },
                    "objectType": "QuestionSet",
                    "root": false,
                    "isNew": true
                }
            },
            "hierarchy": {
                "do_21377749714884198411469": {
                    "children": [
                        "Comments and Reflection:",
                        "Comments and Reflection: 2"
                    ],
                    "root": true
                },
                "Comments and Reflection:": {
                    "children": [
                        "do_2137646614572646401345",
                        "do_2137646614709207041346"
                    ],
                    "root": false
                },
                "Comments and Reflection: 2": {
                    "children": [
                        "do_2137646614898278401347",
                        "do_21376612087864524817429",
                        "do_21376612089008128017430"
                    ],
                    "root": false
                }
            }
        }
    }
} 
* @returns {QuestionSetHierarchy status} - statusCode - {
    status : 200
}
*/


const updateQuestionSetHierarchy = function (templateData) {
    return new Promise((resolve, reject) => {
        try {
            let updateQuestionSetHierarchyUrl = CREATION_PORTAL_URL + messageConstants.endpoints.UPDATE_QUESTION_SET_HIERARCHY;

            function updateQuestionSetHierarchyCallBack(err, res) {
                if (err || res.body.responseCode !== httpStatusCode.ok.code) {
                    return reject({
                        message: messageConstants.apiResponses.QUESTIONSET_NOT_FOUND,
                        status: httpStatusCode.bad_request.status,
                    })
                } else if (res.body.responseCode === httpStatusCode.ok.code) {
                    return resolve({
                        status: httpStatusCode.ok.status
                    })
                }
            }
            request.patch(updateQuestionSetHierarchyUrl, { headers: headers, json: true, json: templateData }, updateQuestionSetHierarchyCallBack)

        } catch (error) {
            return reject(error);
        }
    })
}


/**
 * To publish the question set in creation portal
 * @method
 * @name publishQuestionSet
 * @param {String} questionsetId - do_21376461469939302415285
 * @returns {Number} - return status code -{
    status : 200
}
 */
const publishQuestionSet = function (questionsetId) {
    return new Promise((resolve, reject) => {
        try {
            let publishUrl = `${CREATION_PORTAL_URL}${messageConstants.endpoints.PUBLISH_QUESTION_SET}/${questionsetId}`;

            async function publishQuestionSetCallBack(err, res) {
                if (err || res.body.responseCode !== httpStatusCode.ok.code) {
                    const errmsg = JSON.parse(res.body)
                    return reject({
                        message: errmsg.errmsg || messageConstants.apiResponses.QUESTIONSET_NOT_FOUND,
                        status: httpStatusCode.bad_request.status,
                    })
                } else if (res.body.responseCode === httpStatusCode.ok.code) {
                    return resolve({
                        status: httpStatusCode.ok.status
                    })
                }
            }
            request.post(publishUrl, { headers: headers }, publishQuestionSetCallBack)

        } catch (error) {
            return reject(error);
        }
    })

}

/**
 * To update a specific question set in the creation portal
 * @method
 * @name updateQuestionSet
 * @param {Object} updateReq - The request payload containing question set update details
 * @param {String} migratedId - Unique identifier for the question set to be updated
 * @returns {Number} - return status code -{
    status : 200
}
 */
const updateQuestionSet = function (updateReq, migratedId) {
    return new Promise((resolve, reject) => {
        try {
            let updateUrl = CREATION_PORTAL_URL + messageConstants.endpoints.UPDATE_QUESTION_SET + "/" + migratedId;

            const options = {
                headers,
                json: true,
                json: { request: { questionset: updateReq } }
            };
            function updateQuestionSetCallBack(err, data) {
                if (err || data.statusCode != httpStatusCode.ok.status) {
                    return reject({
                        message: messageConstants.apiResponses.QUESTIONSET_NOT_FOUND,
                        status: httpStatusCode.bad_request.status,
                    })
                } else if (data.statusCode == httpStatusCode.ok.status) {
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

/**
 * To retrieve details of a specific question in the creation portal
 * @method
 * @name readQuestion
 * @param {String} questionId - Unique identifier for the question to be read
 * @returns {JSON} - Question Object
 *  {
            "name": "Date of the Training",
            "code": "PS08_1597311656239",
            "mimeType": "application/vnd.sunbird.question",
            "primaryCategory": "date",
            "interactionTypes": [
              "date"
            ],
            "showRemarks": "No",
            "instructions": {
              "default": ""
            },
            "body": "<p>Date of the Training</p><p></p>",
            "editorState": {
              "question": "<p>Date of the Training</p><p></p>"
            },
            "responseDeclaration": {
              "response1": {
                "type": "string"
              }
            },
            "interactions": {
              "validation": {
                "required": "Yes"
              },
              "response1": {
                "validation": {
                  "pattern": "DD/MM/YYYY"
                },
                "autoCapture": false
              }
            },
            "hints": "",
            "evidence": {
              "mimeType": []
            }
    }
 */

const readQuestion = function (questionId) {
    return new Promise(async (resolve, reject) => {
        try {
            let readquestionurl = CREATION_PORTAL_URL + messageConstants.endpoints.READ_QUESTION;

            const fields = ["body", "question", "primaryCategory", "mimeType", "qType", "answer", "templateId", "responseDeclaration", "interactionTypes", "interactions", "name", "solutions", "editorState", "media", "remarks", "evidence", "hints", "instructions", "numberOnly", "characterLimit", "showEvidence", "evidenceMimeType", "showRemarks", "remarksLimit", "markAsNotMandatory"]
            if (questionId !== "") {
                url =
                    readquestionurl +
                    "/" +
                    questionId +
                    "?" +
                    `fields=${fields.join(",")}`;
            }

            const options = {
                headers: headers,
            };

            let result = {
                success: true,
            };

            function questionReadCallback(err, data) {

                if (err) {
                    result.success = false;
                } else {
                    let response = JSON.parse(data.body);
                    if (response.responseCode === httpStatusCode.ok.code) {
                        result["data"] = response?.result?.question;
                    } else {
                        result.success = false;
                    }
                }

                return resolve(result);
            }

            request.get(url, options, questionReadCallback);

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
    copyQuestionSet,
    readQuestionSet,
    updateQuestionSetHierarchy,
    publishQuestionSet,
    updateQuestionSet,
    readQuestion
}