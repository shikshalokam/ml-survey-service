/**
 * name : surveysController.js
 * author : Deepa
 * created-date : 06-Sep-2020
 * Description : Surveys information.
 */

// Dependencies
const csv = require("csvtojson");
const FileStream = require(ROOT_PATH + "/generics/fileStream");
const surveysHelper = require(MODULES_BASE_PATH + "/surveys/helper");
const assessorsHelper = require(MODULES_BASE_PATH + "/entityAssessors/helper");
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");

/**
    * Surveys
    * @class
*/
module.exports = class Surveys extends Abstract {

    constructor() {
        super(surveysSchema);
    }

    static get name() {
        return "surveys";
    }
    
     /**
     * @api {post} /assessment/api/v1/surveys/createSolutionTemplate Create survey template solution.
     * @apiVersion 1.0.0
     * @apiName Create survey solution template.
     * @apiGroup Surveys
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/surveys/createSolutionTemplate
     * @apiParamExample {json} Request-Body:
     * {
     *   "name": "Test survey 1",
     *   "description": "Test survey 1"
     *   "externalId": "Test-survey",
     *   "startDate": "2020/10/10"
     *   "endDate": "2020/12/25",
     *   "linkTite": "Read more about the solution",
     *   "linkUrl": "http://www.africau.edu/images/default/sample.pdf"
     * }
     * @apiParamExample {json} Response:
     * {
         "status": 200,
         "message": "Survey solution template created successfully",
         "result": {
            "solutionId": "5f58b0b8894a0928fc8aa9b3"
         }
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
    * Create survey solution template.
    * @method
    * @name createSolutionTemplate
    * @param {Object} req -request Data.
    * @param {String} req.body- survey solution creation data.  
    * @returns {JSON} - solutionId
    */

    async createSolutionTemplate(req) {
      return new Promise(async (resolve, reject) => {
        try {
            
            let createSolutionTemplate = await surveysHelper.createSolutionTemplate
            (
                req.body,
                req.userDetails.userId
            )

            return resolve({
                message: createSolutionTemplate.message,
                result: createSolutionTemplate.data
            })

        } catch (error) {
            return reject({
                status: error.status || httpStatusCode.internal_server_error.status,
                message: error.message || httpStatusCode.internal_server_error.message,
                errorObject: error
            });
        }
    });
}


     /**
     * @api {get} /assessment/api/v1/surveys/importSurveryTemplateToSolution/:solutionId?appName=:appName Import template survey solution to solution.
     * @apiVersion 1.0.0
     * @apiName Import survey template to solution.
     * @apiGroup Surveys
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/surveys/importSurveryTemplateToSolution/5f58b0b8894a0928fc8aa9b3?appName=samiksha
     * @apiParamExample {json} Response:
     * {
         "status": 200,
         "message": "Survey solution imported successfully",
         "result": {
            "solutionId": "5f678f1344a7fb63999707d9"
            "link": "https://apps.shikshalokam.org/samiksha/take-survey/8e8902eb1e13ae9c38dec8f1b5a4bdff"
         }
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
    * Import survey template to solution.
    * @method
    * @name importSurveryTemplateToSolution
    * @param {Object} req -request Data.
    * @param {String} req.params._id - survey template solution id. 
    * @param {String} req.query.appName - Name of the app 
    * @returns {JSON} - sharable link
    */

   async importSurveryTemplateToSolution(req) {
    return new Promise(async (resolve, reject) => {
      try {
          
          let result = await surveysHelper.importSurveryTemplateToSolution
          (
              req.params._id,
              req.userDetails.userId,
              req.query.appName
          )

          return resolve({
              message: result.message,
              result: result.data
          })

      } catch (error) {
          return reject({
              status: error.status || httpStatusCode.internal_server_error.status,
              message: error.message || httpStatusCode.internal_server_error.message,
              errorObject: error
          });
      }
  });
}

    
    /**
     * @api {get} /assessment/api/v1/surveys/mapSurverySolutionToProgram/:solutionId?programId=:programId Map survey solution to program.
     * @apiVersion 1.0.0
     * @apiName Map survey solution to program.
     * @apiGroup Surveys
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/surveys/mapSurverySolutionToProgram/5f58b0b8894a0928fc8aa9b3?programId=test-survey-program
     * @apiParamExample {json} Response:
     * {
         "status": 200,
         "message": "Mapped survey solution to program successfully"
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
    * Map survey solution to program.
    * @method
    * @name mapSurverySolutionToProgram
    * @param {Object} req -request Data.
    * @param {String} req.params._id - survey solution id. 
    * @param {String} req.query.programId - program Id 
    * @returns {String} - message
    */

   async mapSurverySolutionToProgram(req) {
    return new Promise(async (resolve, reject) => {
      try {
          
          let result = await surveysHelper.mapSurverySolutionToProgram
          (
              req.params._id,
              req.query.programId
          )

          return resolve({
              message: result.message
          })

      } catch (error) {
          return reject({
              status: error.status || httpStatusCode.internal_server_error.status,
              message: error.message || httpStatusCode.internal_server_error.message,
              errorObject: error
          });
      }
  });
}


    /**
     * @api {post} /assessment/api/v1/surveys/bulkCreate Bulk Create surveys CSV
     * @apiVersion 1.0.0
     * @apiName Bulk Create Surveys CSV
     * @apiGroup Surveys
     * @apiParam {File} survey  Mandatory survey file of type CSV.
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
    * Upload bulk surveys via csv.
    * @method
    * @name bulkCreate
    * @param {Object} req -request Data.
    * @param {CSV} req.files.survey -Surveys csv data . 
    * @returns {CSV} - Same uploaded csv with extra field status indicating the particular
    * column is uploaded or not. 
    */

   async bulkCreate(req) {
    return new Promise(async (resolve, reject) => {
        try {
            
            if (!req.files || !req.files.survey) {
                let responseMessage = httpStatusCode.bad_request.message;
                return resolve({ 
                    status: httpStatusCode.bad_request.status, 
                    message: responseMessage 
                });
            }

            const fileName = `Survey-Upload-Result`;
            let fileStream = new FileStream(fileName);
            let input = fileStream.initStream();

            (async function () {
                await fileStream.getProcessorPromise();
                return resolve({
                    isResponseAStream: true,
                    fileNameWithPath: fileStream.fileNameWithPath()
                });
            })();

            let surveyData = 
            await csv().fromString(req.files.survey.data.toString());

            let users = [];
            let usersKeycloakIdMap = {};
            let solutionExternalIds = [];

            surveyData.forEach(eachSurveyData => {
                if (!eachSurveyData["keycloak-userId"] && eachSurveyData.user && !users.includes(eachSurveyData.user)) {
                    users.push(eachSurveyData.user);
                } else if (eachSurveyData["keycloak-userId"] && eachSurveyData["keycloak-userId"] != "") {
                    usersKeycloakIdMap[eachSurveyData["keycloak-userId"]] = true;
                }
                solutionExternalIds.push(eachSurveyData.solutionExternalId);
            })
           
            let userIdByExternalId;

            if (users.length > 0) {
                userIdByExternalId = await assessorsHelper.getInternalUserIdByExternalId(req.rspObj.userToken, users);
                if(Object.keys(userIdByExternalId).length > 0) {
                    Object.values(userIdByExternalId).forEach(userDetails => {
                        usersKeycloakIdMap[userDetails] = true;
                    })
                }
            }

            if(Object.keys(usersKeycloakIdMap).length > 0) {
                
                let userOrganisationDetails = await surveysHelper.getUserOrganisationDetails(
                    Object.keys(usersKeycloakIdMap), 
                    req.rspObj.userToken
                );

                usersKeycloakIdMap = userOrganisationDetails.data;
            }
            
            let solutionQuery = {
                externalId: {
                    $in: solutionExternalIds
                },
                status: messageConstants.common.ACTIVE_STATUS,
                isDeleted: false,
                type: messageConstants.common.SURVEY,
                isReusable: false
            };

            let solutionProjection = [
                "externalId",
                "name",
                "description",
                "type",
                "programId",
                "programExternalId",
                "endDate",
                "isAPrivateProgram"
            ];

            let solutionDocument = await solutionsHelper.solutionDocuments
            (
                solutionQuery,
                solutionProjection
            );

            if (!solutionDocument.length) {
                throw new Error(messageConstants.apiResponses.SOLUTION_NOT_FOUND)
            }

            let solutionObject = {};

            if (solutionDocument.length > 0) {
                solutionDocument.forEach(eachSolutionDocument => {
                    solutionObject[eachSolutionDocument.externalId] = eachSolutionDocument;
                })
            }
             
            for (let pointerToSurvey = 0; pointerToSurvey < surveyData.length; pointerToSurvey++) {
                
                let solution;
                let surveyHelperData;
                let currentData = surveyData[pointerToSurvey];
                let csvResult = {};
                let status;
                let userId;
                let userOrganisations;

                Object.keys(currentData).forEach(eachSurveyData => {
                    csvResult[eachSurveyData] = currentData[eachSurveyData];
                })
                 
                try {

                    if (currentData["keycloak-userId"] && currentData["keycloak-userId"] !== "") {
                        userId = currentData["keycloak-userId"];
                    } else {

                        if (userIdByExternalId[currentData.user] === "") {
                            throw new Error("Keycloak id for user is not present");
                        }

                        userId = userIdByExternalId[currentData.user];
                    }

                    if(!usersKeycloakIdMap[userId]  || !Array.isArray(usersKeycloakIdMap[userId].rootOrganisations) || usersKeycloakIdMap[userId].rootOrganisations.length < 1) {
                        throw new Error(messageConstants.apiResponses.USER_ORGANISATION_DETAILS_NOT_FOUND);
                    } else {
                        userOrganisations = usersKeycloakIdMap[userId];
                    }

                    if (solutionObject[currentData.solutionExternalId] !== undefined) {
                        solution = solutionObject[currentData.solutionExternalId];
                    } else {
                        throw new Error(messageConstants.apiResponses.SOLUTION_NOT_FOUND);
                    }

                    surveyHelperData = await surveysHelper.bulkCreate(
                        userId, 
                        solution, 
                        userOrganisations
                    );

                    status = surveyHelperData.status;

                } catch (error) {
                    status = error.message;
                }
                
                csvResult["status"] = status;
                input.push(csvResult);
            }

            input.push(null);

        } catch (error) {
            return resolve({
                success: false,
                message: error.message,
                data: false
            });
        }
    });
}

     /**
     * @api {post} /assessment/api/v1/surveys/getDetailsByLink/:link Get the survey details by link
     * @apiVersion 1.0.0
     * @apiName Get the survey details by link
     * @apiGroup Surveys
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/surveys/getDetailsByLink/392f95246771664a81335f1be7d109f3
     * @apiParamExample {json} Request:
     * {
     *  "role" : "HM",
      "state" : "236f5cff-c9af-4366-b0b6-253a1789766a",
        "district" : "1dcbc362-ec4c-4559-9081-e0c2864c2931",
        "school" : "c5726207-4f9f-4f45-91f1-3e9e8e84d824"
      }
     * @apiParamExample {json} Response:
     * {
     *  "status": 200,
     *  "message": "Survey details fetched successfully",
     *  "result":  {
           "solution": {
              "_id": "5f5b38ec45365677f64b2843",
              "externalId": "Test-survey-solution",
              "name": "test survey",
              "description": "Shikshalokam test Survey and feedback solution",
              "captureGpsLocationAtQuestionLevel": false,
              "enableQuestionReadOut": false
            },
            "program": {
              "_id": "5f5b1df69c70bd2973aee29e",
              "externalId": "Test-survey-program",
              "name": "new survey program",
              "description": "Shikshalokam new survey",
              "imageCompression": {
                "quality": 10
              }
            },
           "assessment": {
              "name": "test survey",
              "description": "Shikshalokam test Survey and feedback solution",
              "externalId": "Test-survey-solution",
              "submissionId": "5f5b657f9c3b881d2c711dc0",
              "evidences": [
                   {
                    "code": "SF",
                    "sections": [
                        {
                            "code": "SQ",
                            "questions": [
                                {
                                    "_id": "5f5b394045365677f64b2844",
                                    "question": [
                                        "Roles and responsibilities",
                                        ""
                                    ],
                                    "isCompleted": false,
                                    "showRemarks": true,
                                    "options": [
                                        {
                                            "value": "R1",
                                            "label": "Not aware of their roles and responsibilities."
                                        },
                                        {
                                            "value": "R2",
                                            "label": "Aware of their roles and responsibilities."
                                        },
                                        {
                                            "value": "R3",
                                            "label": "Play their roles as described in RTE and SSA with guidance and support."
                                        },
                                        {
                                            "value": "R4",
                                            "label": "Takes initiative to provide his/her services to school and makes plans for school improvement."
                                        }
                                    ],
                                    "sliderOptions": [],
                                    "children": [],
                                    "questionGroup": [
                                        "A1"
                                    ],
                                    "fileName": [],
                                    "instanceQuestions": [],
                                    "isAGeneralQuestion": false,
                                    "autoCapture": false,
                                    "allowAudioRecording": false,
                                    "prefillFromEntityProfile": false,
                                    "entityFieldName": "",
                                    "isEditable": true,
                                    "showQuestionInPreview": false,
                                    "deleted": false,
                                    "remarks": "",
                                    "value": "",
                                    "usedForScoring": "",
                                    "questionType": "auto",
                                    "canBeNotApplicable": "false",
                                    "visibleIf": "",
                                    "validation": {
                                        "required": true
                                    },
                                    "externalId": "SUR01",
                                    "tip": "",
                                    "hint": "Hint for question (Leave blank for no hint)",
                                    "responseType": "radio",
                                    "modeOfCollection": "onfield",
                                    "accessibility": "No",
                                    "rubricLevel": "",
                                    "sectionHeader": "",
                                    "page": "P1",
                                    "updatedAt": "2020-09-11T08:45:52.490Z",
                                    "createdAt": "2020-09-11T08:45:52.490Z",
                                    "__v": 0,
                                    "evidenceMethod": "SF",
                                    "payload": {
                                        "criteriaId": "5f5b38ec45365677f64b2842",
                                        "responseType": "radio",
                                        "evidenceMethod": "SF",
                                        "rubricLevel": ""
                                    },
                                    "startTime": "",
                                    "endTime": "",
                                    "gpsLocation": "",
                                    "file": ""
                                }
                                    "isAGeneralQuestion": false,
                                    "autoCapture": false,
                                    "allowAudioRecording": false,
                                    "prefillFromEntityProfile": false,
                                    "entityFieldName": "",
                                    "isEditable": true,
                                    "showQuestionInPreview": false,
                                    "deleted": false,
                                    "remarks": "",
                                    "value": "",
                                    "usedForScoring": "",
                                    "questionType": "auto",
                                    "canBeNotApplicable": "false",
                                    "visibleIf": "",
                                    "validation": {
                                        "required": true
                                    },
                                    "externalId": "SUR10",
                                    "tip": "",
                                    "hint": "",
                                    "responseType": "radio",
                                    "modeOfCollection": "onfield",
                                    "accessibility": "No",
                                    "rubricLevel": "",
                                    "sectionHeader": "",
                                    "page": "",
                                    "updatedAt": "2020-09-11T08:45:52.698Z",
                                    "createdAt": "2020-09-11T08:45:52.698Z",
                                    "__v": 0,
                                    "evidenceMethod": "SF",
                                    "payload": {
                                        "criteriaId": "5f5b38ec45365677f64b2842",
                                        "responseType": "radio",
                                        "evidenceMethod": "SF",
                                        "rubricLevel": ""
                                    },
                                    "startTime": "",
                                    "endTime": "",
                                    "gpsLocation": "",
                                    "file": ""
                                }
                            ],
                            "name": "Survey Questions"
                        }
                    ],
                    "externalId": "SF",
                    "name": "Surevy And Feedback",
                    "description": "Surevy And Feedback",
                    "modeOfCollection": "",
                    "canBeNotApplicable": false,
                    "notApplicable": false,
                    "canBeNotAllowed": true,
                    "remarks": "",
                    "isActive": true,
                    "startTime": "",
                    "endTime": "",
                    "isSubmitted": false,
                    "submissions": []
                }
            ],
            "submissions": {}
           }
         }
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */
     
    /**
    * Get the survey details by link
    * @method
    * @name getDetailsByLink
    * @param {Object} req -request Data.
    * @param {String} req.params._id - link.  
    * @returns {JSON} - Survey details
    */

    getDetailsByLink(req) {
      return new Promise(async (resolve, reject) => {

        try {

            let bodyData = req.body ? req.body : {};

            let surveyDetails = await surveysHelper.getDetailsByLink(
                req.params._id,
                req.userDetails.userId,
                req.rspObj.userToken,
                bodyData
            );

            return resolve({
                  message: surveyDetails.message,
                  result: surveyDetails.data
            });

        } catch (error) {

            return reject({
                status: error.status || httpStatusCode.internal_server_error.status,
                message: error.message || httpStatusCode.internal_server_error.message,
                errorObject: error
            });
        }
    })
}

    /**
    * @api {get} /assessment/api/v1/surveys/details/:surveyId 
    * Survey details.
    * @apiVersion 1.0.0
    * @apiGroup Surveys
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/surveys/details/5de8a220c210d4700813e695
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    {
    "message": "Survey details fetched successfully",
    "status": 200,
    "result": {
        "solution": {
            "_id": "5f5b38ec45365677f64b2843",
            "externalId": "Test-survey-solution",
            "name": "test survey",
            "description": "Shikshalokam test Survey and feedback solution",
            "captureGpsLocationAtQuestionLevel": false,
            "enableQuestionReadOut": false
        },
        "program": {
            "_id": "5f5b1df69c70bd2973aee29e",
            "externalId": "Test-survey-program",
            "name": "new survey program",
            "description": "Shikshalokam new survey",
            "imageCompression": {
                "quality": 10
            }
        },
        "assessment": {
            "name": "test survey",
            "description": "Shikshalokam test Survey and feedback solution",
            "externalId": "Test-survey-solution",
            "submissionId": "5f5b657f9c3b881d2c711dc0",
            "evidences": [
                {
                    "code": "SF",
                    "sections": [
                        {
                            "code": "SQ",
                            "questions": [
                                {
                                    "_id": "5f5b394045365677f64b2844",
                                    "question": [
                                        "Roles and responsibilities",
                                        ""
                                    ],
                                    "isCompleted": false,
                                    "showRemarks": true,
                                    "options": [
                                        {
                                            "value": "R1",
                                            "label": "Not aware of their roles and responsibilities."
                                        },
                                        {
                                            "value": "R2",
                                            "label": "Aware of their roles and responsibilities."
                                        },
                                        {
                                            "value": "R3",
                                            "label": "Play their roles as described in RTE and SSA with guidance and support."
                                        },
                                        {
                                            "value": "R4",
                                            "label": "Takes initiative to provide his/her services to school and makes plans for school improvement."
                                        }
                                    ],
                                    "sliderOptions": [],
                                    "children": [],
                                    "questionGroup": [
                                        "A1"
                                    ],
                                    "fileName": [],
                                    "instanceQuestions": [],
                                    "isAGeneralQuestion": false,
                                    "autoCapture": false,
                                    "allowAudioRecording": false,
                                    "prefillFromEntityProfile": false,
                                    "entityFieldName": "",
                                    "isEditable": true,
                                    "showQuestionInPreview": false,
                                    "deleted": false,
                                    "remarks": "",
                                    "value": "",
                                    "usedForScoring": "",
                                    "questionType": "auto",
                                    "canBeNotApplicable": "false",
                                    "visibleIf": "",
                                    "validation": {
                                        "required": true
                                    },
                                    "externalId": "SUR01",
                                    "tip": "",
                                    "hint": "Hint for question (Leave blank for no hint)",
                                    "responseType": "radio",
                                    "modeOfCollection": "onfield",
                                    "accessibility": "No",
                                    "rubricLevel": "",
                                    "sectionHeader": "",
                                    "page": "P1",
                                    "updatedAt": "2020-09-11T08:45:52.490Z",
                                    "createdAt": "2020-09-11T08:45:52.490Z",
                                    "__v": 0,
                                    "evidenceMethod": "SF",
                                    "payload": {
                                        "criteriaId": "5f5b38ec45365677f64b2842",
                                        "responseType": "radio",
                                        "evidenceMethod": "SF",
                                        "rubricLevel": ""
                                    },
                                    "startTime": "",
                                    "endTime": "",
                                    "gpsLocation": "",
                                    "file": ""
                                }
                                    "isAGeneralQuestion": false,
                                    "autoCapture": false,
                                    "allowAudioRecording": false,
                                    "prefillFromEntityProfile": false,
                                    "entityFieldName": "",
                                    "isEditable": true,
                                    "showQuestionInPreview": false,
                                    "deleted": false,
                                    "remarks": "",
                                    "value": "",
                                    "usedForScoring": "",
                                    "questionType": "auto",
                                    "canBeNotApplicable": "false",
                                    "visibleIf": "",
                                    "validation": {
                                        "required": true
                                    },
                                    "externalId": "SUR10",
                                    "tip": "",
                                    "hint": "",
                                    "responseType": "radio",
                                    "modeOfCollection": "onfield",
                                    "accessibility": "No",
                                    "rubricLevel": "",
                                    "sectionHeader": "",
                                    "page": "",
                                    "updatedAt": "2020-09-11T08:45:52.698Z",
                                    "createdAt": "2020-09-11T08:45:52.698Z",
                                    "__v": 0,
                                    "evidenceMethod": "SF",
                                    "payload": {
                                        "criteriaId": "5f5b38ec45365677f64b2842",
                                        "responseType": "radio",
                                        "evidenceMethod": "SF",
                                        "rubricLevel": ""
                                    },
                                    "startTime": "",
                                    "endTime": "",
                                    "gpsLocation": "",
                                    "file": ""
                                }
                            ],
                            "name": "Survey Questions"
                        }
                    ],
                    "externalId": "SF",
                    "name": "Surevy And Feedback",
                    "description": "Surevy And Feedback",
                    "modeOfCollection": "",
                    "canBeNotApplicable": false,
                    "notApplicable": false,
                    "canBeNotAllowed": true,
                    "remarks": "",
                    "isActive": true,
                    "startTime": "",
                    "endTime": "",
                    "isSubmitted": false,
                    "submissions": []
                }
            ],
            "submissions": {}
        }
    }
    }
    */
    /**
    * Survey details.
    * @method
    * @name details
    * @param  {Request} req request body.
    * @returns {JSON} Response consists of message,status and result.
    * Result will have the details of survey.
    */

   async details(req) {
    return new Promise(async (resolve, reject) => {
        try {

            let validateSurvey = await surveysHelper.validateSurvey
            (
                req.params._id,
                req.userDetails.userId
            )

            if (!validateSurvey.success) {
                return resolve({
                    message: validateSurvey.message,
                    result: validateSurvey.data
                })
            }

            let surveyDetails = await surveysHelper.details
            (
                req.params._id,
                req.userDetails.userId,
                validateSurvey.data.submissionId
            );

            return resolve({
                message: surveyDetails.message,
                result: surveyDetails.data
            });

        } catch (error) {
            return reject({
                status: error.status || httpStatusCode.internal_server_error.status,
                message: error.message || httpStatusCode.internal_server_error.message,
                errorObject: error
            });
        }
    });
}


    /**
    * @api {post} /assessment/api/v1/surveys/getSurvey?page=:page&limit=:limit&search=:search
    * List of surveys and targetted ones.
    * @apiVersion 1.0.0
    * @apiGroup Surveys
    * @apiSampleRequest /assessment/api/v1/surveys/getSurvey?page=1&limit=10
    * @apiParamExample {json}  Request-Body:
    * {
    *   "role" : "HM",
   		"state" : "236f5cff-c9af-4366-b0b6-253a1789766a",
        "district" : "1dcbc362-ec4c-4559-9081-e0c2864c2931",
        "school" : "c5726207-4f9f-4f45-91f1-3e9e8e84d824"
    }
    * @apiParamExample {json} Response:
    {
    "message": "Targeted surveys fetched successfully",
    "status": 200,
    "result": {
        "data": [
            {
                "_id": "5fe1f060d12d8c7c3d9ebe97",
                "solutionId": "5f92b5b79a530908731ac195",
                "name": "survey and feedback solution",
                "description": "test survey and feedback solution"
            }
        ],
        "count": 1
    }
}
    * @apiUse successBody
    * @apiUse errorBody
    */

    /**
      * List of surveys and targetted ones.
      * @method
      * @name getSurvey
      * @param {Object} req - request data.
      * @returns {JSON} List of surveys with targetted ones.
     */

    async getSurvey(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let surveys = await surveysHelper.getSurvey(
                    req.body,
                    req.userDetails.userId,
                    req.userDetails.userToken,
                    req.pageSize,
                    req.pageNo,
                    req.searchText
                );

                return resolve({
                    message: surveys.message,
                    result: surveys.data
                });

            } catch (error) {
                return reject({
                    status: error.status || httpStatusCode.internal_server_error.status,
                    message: error.message || httpStatusCode.internal_server_error.message,
                    errorObject: error
                });
            }
        })
    }

     /**
    * @api {get} /assessment/api/v1/surveys/userAssigned?page=:page&limit=:limit&search=:search&filter=:filter
    * User assigned list of surveys.
    * @apiVersion 1.0.0
    * @apiGroup Surveys
    * @apiSampleRequest /assessment/api/v1/surveys/userAssigned?page=1&limit=10&filter=assignedToMe
    * @apiParamExample {json} Response:
    {
    "message": "List of user assigned surveys",
    "status": 200,
    "result": {
        "data": [
            {
                "_id": "5fe1f060d12d8c7c3d9ebe97",
                "solutionId": "5f92b5b79a530908731ac195",
                "name": "survey and feedback solution",
                "description": "test survey and feedback solution"
            }
        ],
        "count": 1
    }
}
    * @apiUse successBody
    * @apiUse errorBody
    */

    /**
      * User assigned list of surveys.
      * @method
      * @name userAssigned
      * @param {Object} req - request data.
      * @returns {JSON} List of user assigned surveys.
     */

     async userAssigned(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let surveys = await surveysHelper.userAssigned(
                    req.userDetails.userId,
                    req.pageSize,
                    req.pageNo,
                    req.searchText,
                    req.query.filter,
                    req.query.surveyReportPage
                );

                return resolve({
                    message: surveys.message,
                    result: surveys.data
                });

            } catch (error) {
                return reject({
                    status: error.status || httpStatusCode.internal_server_error.status,
                    message: error.message || httpStatusCode.internal_server_error.message,
                    errorObject: error
                });
            }
        })
    }

    /**
    * @api {get} /assessment/api/v1/surveys/getLink/{{surveySolutionId}}?appName:appName 
    * @apiVersion 1.0.0
    * @apiName Get survey shareable link
    * @apiGroup Surveys
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiParam {String} surveySolutionId Survey Solution External ID.
    * @apiParam {String} appName Name of App.
    * @apiSampleRequest /assessment/api/v1/surveys/getLink/diksha-test-survey?appName=samiksha
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    {
      "message": "Survey solution Link generated successfully",
      "status": 200,
      "result": "https://apps.shikshalokam.org/samiksha/take-survey/8e8902eb1e13ae9c38dec8f1b5a4bdff"
    }
    */
    /**
   * Get survey Solution Sharing Link.
   * @method
   * @name getLink
   * @param {Object} req -request Data.
   * @param {String} req.params._id - survey solution externalId.
   * @param {String} req.query.appName - app Name.
   * @returns {JSON} 
   */

   async getLink(req) {

    return new Promise(async (resolve, reject) => {

        try {

            let surveySolutionDetails = await surveysHelper.getLink(req.params._id, req.query.appName);

            return resolve({
                message: surveySolutionDetails.message,
                result: surveySolutionDetails.data
            })

        } catch (error) {
    
            return reject({
                status: error.status || httpStatusCode.internal_server_error.status,
                message: error.message || httpStatusCode.internal_server_error.message,
                errorObject: error
            });
        }

    });

}

}