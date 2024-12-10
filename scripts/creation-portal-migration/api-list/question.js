const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const logger = require("../logger");
const { getHeaders } = require("./headers");
const constants = require("../constant");

const creation_portal_url = CONFIG.HOST.creation_portal;

// Questionset
/**
* To create the question set in creation portal
* @method
* @name createQuestionSet
* @param {Object} templateData - {
    {
    "request": {
        "questionset": {
            "name": "Enrollment challenges in DIKSHA Courses-1616141178859",
            "description": "Enrollment challenges in DIKSHA Courses-1616141178859",
            "code": "99199aec-66b8-11eb-b81d-a08cfd79f8b7-OBSERVATION-TEMPLATE-1616141179374",
            "mimeType": "application/vnd.sunbird.questionset",
            "primaryCategory": "observation",
            "entityType": "District",
            "language": [
                "English"
            ],
            "keywords": [
                "Framework",
                "Observation",
                "Challenges",
                " Enrollment",
                " Parents",
                " Courses "
            ],
            "startDate": "2023-03-20T08:06:19.374Z",
            "endDate": "2023-03-22T08:06:19.374Z",
            "createdBy": "356e1543-a8ea-4bf0-8639-fee164e8d245",
            "organisationId": "01329314824202649627",
            "creator": "aradhana1_62r2",
            "createdFor": [
                "01329314824202649627"
            ],
            "channel": "01329314824202649627",
            "programId": "e07c7131-4577-11ed-bcf5-df48f63ad78b",
            "author": "aradhana1_62r2",
            "framework": "ekstep_ncert_k-12"
        }
    }
}
* @returns {Object} - return Questionset Object with unique identifier Id ( do_113208291312132096114 ) - {
    id: 'api.questionset.create',
    ver: '3.0',
    ts: '2021-02-03T08:17:28ZZ',
    params: {
      resmsgid: '4c45a5e2-c3b4-47c1-95a2-3a31f7e7c1ca',
      msgid: null,
      err: null,
      status: 'successful',
      errmsg: null
    },
    responseCode: 'OK',
    result: {
      identifier: 'do_113208291312132096114',
      versionKey: '1612340248069'
    }
}
*/

const createQuestionSet = function (templateData) {
  const url = creation_portal_url + CONFIG.APIS.create_questionset;
  const data = {
    request: {
      questionset: { ...templateData },
    },
  };

  const config = {
    method: constants.METHOD.PATCH,
    url: url,
    headers: null,
    data: data,
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(true, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          resolve(res?.data);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while creating the Questionset: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          reject(errorResponse);
        });
    } catch (error) {
      reject(error);
    }
  });
};

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
* @returns {QuestionSetHierarchyObject} - Object - {
        "id": "api.questionset.hierarchy.update",
        "ver": "3.0",
        "ts": "2021-02-03T13:06:12ZZ",
        "params": {
          "resmsgid": "221f9cdb-c220-4d3f-a579-4e7b82facf89",
          "msgid": null,
          "err": null,
          "status": "successful",
          "errmsg": null
        },
        "responseCode": "OK",
        "result": {
          "identifier": "do_113208431570984960123",
          "identifiers": {
            "section-1": "do_113208433229889536126",
            "question-1": "do_113208433229873152124"
          }
        }
      }
*/

const updateQuestionSetHierarchy = function (templateData) {
  const url = creation_portal_url + CONFIG.APIS.update_hierarchy;

  const config = {
    method: constants.METHOD.PATCH,
    url: url,
    headers: null,
    data: templateData,
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(true, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          resolve(res?.data);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while updating QuestionSetHierarchy: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          reject(errorResponse);
        });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * To publish the question set in creation portal
 * @method
 * @name publishQuestionSet
 * @param {String} questionsetId - do_21376461469939302415285
 * @returns {Object} - responseObject with Question identifier (ex. "do_21376461469939302415285" ) - {
        "id": "api.questionset.publish",
        "ver": "3.0",
        "ts": "2021-02-03T09:39:14ZZ",
        "params": {
          "resmsgid": "62f7e310-39e1-4287-bc9f-f8e6ac5f5bd3",
          "msgid": null,
          "err": null,
          "status": "successful",
          "errmsg": null
        },
        "responseCode": "OK",
        "result": {
          "message": "Question is successfully sent for Publish",
          "identifier": "do_113208323801554944120"
        }
      }
 */
const publishQuestionSet = function (questionsetId) {
  const url =
    creation_portal_url + CONFIG.APIS.publish_questionset + "/" + questionsetId;

  const config = {
    method: constants.METHOD.POST,
    url: url,
    headers: null,
    data: {},
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(true, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          resolve(res?.data);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while publishing question set for questionsetId ${questionsetId}: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          reject(errorResponse);
        });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * To read the questionset from creation portal
 * @method
 * @name readQuestionSetHierarchy
 * @param {String} questionsetId - do_21376461469939302415285
 * @returns {JSON} - returns questionset with hierarchy -
 * {
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
 */

const readQuestionSetHierarchy = function (questionSetId) {
  const url =
    creation_portal_url +
    CONFIG.APIS.read_questionset +
    questionSetId +
    "?mode=edit";

  const config = {
    method: constants.METHOD.GET,
    url: url,
    headers: null,
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(true, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          resolve(res?.data);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error in readQuestionSetHierarchy: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          reject(errorResponse);
        });
    } catch (error) {
      reject(error);
    }
  });
};

// Questions
/**
 * To create the questions in creation portal
 * @method
 * @name createQuestions
 * @param {String} questionId - do_213771658975903744111423
 * @param {Object} templateData - {"name":"What medium of instruction would you prefer for trainings?","code":"PS25_1597311656239","description":"","showRemarks":"Yes","mimeType":"application/vnd.sunbird.question","primaryCategory":"Multiselect Multiple Choice Question","interactionTypes":["choice"],"body":"<div class='question-body'><div class='mcq-title'><p>What medium of instruction would you prefer for trainings?&nbsp</p></div><div data-choice-interaction='response1' class='mcq-vertical'></div><div class='mcq-title'><p>&nbsp</p></div><div data-choice-interaction='response1' class='mcq-vertical'></div></div>","interactions":{"validation":{"required":"Yes"},"response1":{"type":"choice","options":[{"value":"R1","label":"English"},{"value":"R2","label":"Hindi"},{"value":"R3","label":"Bi-lingual"}]}},"editorState":{"question":"<div class='question-body'><div class='mcq-title'><p>What medium of instruction would you prefer for trainings?&nbsp</p></div><div data-choice-interaction='response1' class='mcq-vertical'></div><div class='mcq-title'><p>&nbsp</p></div><div data-choice-interaction='response1' class='mcq-vertical'></div></div>","options":[{"answer":false,"value":{"body":"<p>English</p>","value":0}},{"answer":false,"value":{"body":"<p>Hindi</p>","value":1}},{"answer":false,"value":{"body":"<p>Bi-lingual</p>","value":2}}]},"responseDeclaration":{"response1":{"maxScore":0,"cardinality":"single","type":"integer","correctResponse":{"outcomes":{"SCORE":0}}}},"instructions":{"default":""},"hints":"","evidence":{"mimeType":[]}}
 * @returns {Object} -  return QuestionObject with unique identifier Id -
 * {
        "id": "api.question.create",
        "ver": "3.0",
        "ts": "2021-02-02T19:28:24ZZ",
        "params": {
          "resmsgid": "8b75d237-1028-4e38-a94a-9ff4ca784d76",
          "msgid": null,
          "err": null,
          "status": "successful",
          "errmsg": null
        },
        "responseCode": "OK",
        "result": {
          "identifier": "do_11320791330308096015",
          "versionKey": "1612294104382"
        }
    }
 */
const createQuestions = function (templateData, questionId) {
  const url = creation_portal_url + CONFIG.APIS.create_question;
  const data = {
    request: {
      question: { ...templateData },
    },
  };

  const config = {
    method: constants.METHOD.POST,
    url: url,
    headers: null,
    data: data,
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(true, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          resolve(res?.data);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while creating the question for questionId ${questionId}: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          reject(errorResponse);
        });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * To publish the question in creation portal
 * @method
 * @name publishQuestion
 * @param {String} questionId - do_21376461469939302415285
 * @returns {JSON} - return question responseObject with unique identifierID -
 * {
        "id": "api.question.publish",
        "ver": "3.0",
        "ts": "2021-02-02T20:15:02ZZ",
        "params": {
          "resmsgid": "9c64cc9c-bed5-44c7-85bf-4918c3a42f58",
          "msgid": null,
          "err": null,
          "status": "successful",
          "errmsg": null
        },
        "responseCode": "OK",
        "result": {
          "message": "Question is successfully sent for Publish",
          "identifier": "do_113207931921555456111"
        }
    }
 */
const publishQuestion = function (questionId) {
  const url =
    creation_portal_url + CONFIG.APIS.publish_question + "/" + questionId;
  const config = {
    method: constants.METHOD.POST,
    url: url,
    headers: null,
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(true, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          resolve(res?.data);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while publishing question for questionId ${questionId}: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          reject(errorResponse);
        });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  createQuestionSet,
  updateQuestionSetHierarchy,
  publishQuestionSet,
  createQuestions,
  publishQuestion,
  readQuestionSetHierarchy,
};
