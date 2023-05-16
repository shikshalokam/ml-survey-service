/**
 * name : observationsController.js
 * author : Aman
 * created-date : 22-Nov-2018
 * Description : Updated Observations related information .
 */

// Dependencies
const userExtensionHelper = require(MODULES_BASE_PATH + "/userExtension/helper");
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");
const observationsHelper = require(MODULES_BASE_PATH + "/observations/helper");
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const v1Observation = require(ROOT_PATH + "/controllers/v1/observationsController");
const assessmentsHelper = require(MODULES_BASE_PATH + "/assessments/helper");
const programsHelper = require(MODULES_BASE_PATH + "/programs/helper");
const userRolesHelper = require(MODULES_BASE_PATH + "/userRoles/helper");
const transFormationHelper = require(MODULES_BASE_PATH + "/questions/transformationHelper");

/**
    * Observations
    * @class
*/

module.exports = class Observations extends v1Observation {


    // TODO :: url string is too long.

    /**
     * @api {get} /assessment/api/v2/observations/list Observations list
     * @apiVersion 2.0.0
     * @apiName Observations list
     * @apiGroup Observations
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/observations/list
     * @apiParamExample {json} Response:
        "result": [
            {
                "_id": "5d09c34d1f7fd5a2391f7251",
                "entities": [],
                "name": "Observation 1",
                "description": "Observation Description",
                "status": "published",
                "solutionId": "5b98fa069f664f7e1ae7498c"
            },
            {
                "_id": "5d1070326f6ed50bc34aec2c",
                "entities": [
                    {
                        "_id": "5cebbefe5943912f56cf8e16",
                        "submissionStatus": "pending",
                        "submissions": [],
                        "name": "asd"
                    },
                    {
                        "_id": "5cebbf275943912f56cf8e18",
                        "submissionStatus": "pending",
                        "submissions": [],
                        "name": "asd"
                    }
                ],
                "status": "published",
                "endDate": "2019-06-24T00:00:00.000Z",
                "name": "asdasd",
                "description": "asdasdasd",
                "solutionId": "5c6bd309af0065f0e0d4223b"
            }
        ]
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
    * List Observation.
    * @method
    * @name list
    * @param {Object} req -request Data.
    * @returns {JSON} - List observation data.
    */

   async list(req) {

        return new Promise(async (resolve, reject) => {

            try {

                let observations = new Array;

                observations = await observationsHelper.listV2(req.userDetails.userId);
                
                let responseMessage = messageConstants.apiResponses.OBSERVATION_LIST;

                return resolve({
                    message: responseMessage,
                    result: observations
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
     * @api {post} /assessment/api/v2/observation/create?solutionId=:solutionId Create observation
     * @apiVersion 2.0.0
     * @apiName Create observation
     * @apiGroup Observations
     * @apiParamExample {json} Request-Body:
     *  {
     * "name" : "My Solution",
     * "description" : "My Solution Description",
     * "program" : {
     * "_id" : "",
     * "name" : "My program"
     * },
     * "entities" : ["5bfe53ea1d0c350d61b78d0a"],
     * "status" : "Published" 
     * }
     * @apiSampleRequest /assessment/api/v2/observation/create?solutionId=5ed5ec4dd2afa80d0f616460
     * @apiUse successBody
     * @apiUse errorBody
     * @apiParamExample {json} Response:
     * {
    "message": "Successfully created solution",
    "status": 200,
    "result": {
        "_id": "5edf880baf0d3261e4af7f7e",
        "externalId": "AFRICA-ME-TEST-FRAMEWORK-TEMPLATE-1591707659674",
        "frameworkExternalId": "AFRICA-ME-TEST-FRAMEWORK",
        "frameworkId": "5d15adc5fad01368a494cbd7",
        "programExternalId": "My program-1591707659613",
        "programId": "5edf880baf0d3261e4af7f7d",
        "entityTypeId": "5d15a959e9185967a6d5e8a6",
        "entityType": "school",
        "isAPrivateProgram": true,
        "observationName": "My Solution",
        "observationId": "5edf880caf0d3261e4af7f7f"
    }
    }
     */
     
    /**
    * Create observation
    * @method
    * @name create
    * @param {Object} req -request Data.
    * @returns {Object} - created solution,programs and observation from given solution id. 
    */

   async create(req) {
    return new Promise(async (resolve, reject) => {

        try {

            let solutionData = 
            await observationsHelper.createV2(
              req.query.solutionId,
              req.userDetails.userId,
              req.body,
              req.userDetails.userToken 
            );

            return resolve(solutionData);

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
     * @api {post} /assessment/api/v2/observations/assessment/:observationId?entityId=:entityId&submissionNumber=submissionNumber&ecmMethod=ecmMethod Assessments 
     * @apiVersion 2.0.0
     * @apiName Assessments
     * @apiGroup Observations
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiParam {String} entityId Entity ID.
     * @apiParam {Int} submissionNumber Submission Number.
     * @apiSampleRequest /assessment/api/v2/observations/assessment/5d286eace3cee10152de9efa?entityId=5d286b05eb569501488516c4&submissionNumber=1&ecmMethod=OB
     * @apiParamExample {json} Request:
     * {
     *  "role" : "HM,DEO",
        "state" : "236f5cff-c9af-4366-b0b6-253a1789766a",
        "district" : "1dcbc362-ec4c-4559-9081-e0c2864c2931",
        "school" : "c5726207-4f9f-4f45-91f1-3e9e8e84d824"
     }
    * @apiParamExample {json} Response:
     * {
        "evidences": [
            {
                "code": "BL",
                "sections": [
                    {
                        "code": "SQ",
                        "questions": [
                            {
                                "_id": "",
                                "question": "",
                                "options": "",
                                "children": "",
                                "questionGroup": "",
                                "fileName": "",
                                "instanceQuestions": "",
                                "deleted": "",
                                "tip": "",
                                "externalId": "",
                                "visibleIf": "",
                                "file": "",
                                "responseType": "pageQuestions",
                                "validation": "",
                                "page": "p1",
                                "showRemarks": "",
                                "isCompleted": "",
                                "remarks": "",
                                "value": "",
                                "canBeNotApplicable": "",
                                "usedForScoring": "",
                                "modeOfCollection": "",
                                "questionType": "",
                                "accessibility": "",
                                "updatedAt": "",
                                "createdAt": "",
                                "__v": "",
                                "evidenceMethod": "",
                                "payload": "",
                                "startTime": "",
                                "endTime": "",
                                "pageQuestions": [
                                    {
                                        "_id": "5be4e40e9a14ba4b5038dcfb",
                                        "question": [
                                            "Are all empty rooms and terrace areas locked securely? ",
                                            ""
                                        ],
                                        "options": [
                                            {
                                                "value": "R1",
                                                "label": "None"
                                            },
                                            {
                                                "value": "R2",
                                                "label": "Some"
                                            },
                                            {
                                                "value": "R3",
                                                "label": "Most"
                                            },
                                            {
                                                "value": "R4",
                                                "label": "All"
                                            }
                                        ],
                                        "children": [],
                                        "questionGroup": [
                                            "A1"
                                        ],
                                        "fileName": [],
                                        "instanceQuestions": [],
                                        "deleted": false,
                                        "tip": "",
                                        "externalId": "LW/SS/22",
                                        "visibleIf": "",
                                        "file": "",
                                        "responseType": "radio",
                                        "validation": {
                                            "required": true
                                        },
                                        "page": "p1",
                                        "showRemarks": false,
                                        "isCompleted": false,
                                        "remarks": "",
                                        "value": "",
                                        "canBeNotApplicable": "false",
                                        "usedForScoring": "",
                                        "modeOfCollection": "onfield",
                                        "questionType": "auto",
                                        "accessibility": "local",
                                        "updatedAt": "2018-11-09T01:34:06.839Z",
                                        "createdAt": "2018-11-09T01:34:06.839Z",
                                        "__v": 0,
                                        "evidenceMethod": "LW",
                                        "payload": {
                                            "criteriaId": "5be1616549e0121f01b2180c",
                                            "responseType": "radio",
                                            "evidenceMethod": "LW",
                                            "rubricLevel": ""
                                        },
                                        "startTime": "",
                                        "endTime": ""
                                    },
                                    {
                                        "_id": "5be445459a14ba4b5038dce8",
                                        "question": [
                                            "Is the list of important phone numbers displayed? ",
                                            ""
                                        ],
                                        "options": [
                                            {
                                                "value": "R1",
                                                "label": "Yes"
                                            },
                                            {
                                                "value": "R2",
                                                "label": "No"
                                            }
                                        ],
                                        "children": [],
                                        "questionGroup": [
                                            "A1"
                                        ],
                                        "fileName": [],
                                        "instanceQuestions": [],
                                        "deleted": false,
                                        "tip": "Look for Fire, Ambulance, Childline, Police, Child Welfare Committee, Hospital/ Doctor  ",
                                        "externalId": "LW/SS/17",
                                        "visibleIf": "",
                                        "file": {
                                            "required": true,
                                            "type": [
                                                "image/jpeg"
                                            ],
                                            "minCount": 1,
                                            "maxCount": 0,
                                            "caption": false
                                        },
                                        "responseType": "radio",
                                        "validation": {
                                            "required": true
                                        },
                                        "showRemarks": false,
                                        "isCompleted": false,
                                        "remarks": "",
                                        "value": "",
                                        "page": "p1",
                                        "canBeNotApplicable": "false",
                                        "usedForScoring": "",
                                        "modeOfCollection": "onfield",
                                        "questionType": "auto",
                                        "accessibility": "local",
                                        "updatedAt": "2018-11-08T14:16:37.565Z",
                                        "createdAt": "2018-11-08T14:16:37.565Z",
                                        "__v": 0,
                                        "evidenceMethod": "LW",
                                        "payload": {
                                            "criteriaId": "5be15e0749e0121f01b21809",
                                            "responseType": "radio",
                                            "evidenceMethod": "LW",
                                            "rubricLevel": ""
                                        },
                                        "startTime": "",
                                        "endTime": ""
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
    * @apiUse successBody
    * @apiUse errorBody
    */

    /**
    * Assessment for observation.
    * @method
    * @name assessment
    * @param {Object} req -request Data.
    * @param {String} req.params._id -observation id. 
    * @param {String} req.query.entityId - entity id.
    * @param {String} req.query.submissionNumber - submission number
    * @param {String} req.userDetails.allRoles -user roles.
    * @returns {JSON} - Observation Assessment details.
    */

    async assessment(req) {

        return new Promise(async (resolve, reject) => {

            try {
              let response = {
                message: messageConstants.apiResponses.ASSESSMENT_FETCHED,
                result: {},
              };

                let observationDocument = await database.models.observations.findOne({ 
                    _id: req.params._id, 
                     createdBy: req.userDetails.userId,
                     status: {$ne:"inactive"}, 
                     entities: ObjectId(req.query.entityId) }).lean();

                    //  console.log("observationDocument", req.params)
                if (!observationDocument) {
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: messageConstants.apiResponses.OBSERVATION_NOT_FOUND
                    });
                }
               
                let entityQueryObject = { _id: req.query.entityId, entityType: observationDocument.entityType };
                let entityDocument = await database.models.entities.findOne(
                    entityQueryObject,
                    {
                        metaInformation: 1,
                        entityTypeId: 1,
                        entityType: 1,
                        registryDetails: 1
                    }
                ).lean();

                if (!entityDocument) {
                    let responseMessage = messageConstants.apiResponses.ENTITY_NOT_FOUND;
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: responseMessage 
                    });
                }

                if (entityDocument.registryDetails && Object.keys(entityDocument.registryDetails).length > 0) {
                    entityDocument.metaInformation.registryDetails = entityDocument.registryDetails;
                }

                const submissionNumber = req.query.submissionNumber && req.query.submissionNumber > 1 ? parseInt(req.query.submissionNumber) : 1;

                let solutionQueryObject = {
                    _id: observationDocument.solutionId,
                    status: "active",
                };

                let solutionDocumentProjectionFields = await observationsHelper.solutionDocumentProjectionFieldsForDetailsAPI()

                let solutionDocument = await database.models.solutions.findOne(
                    solutionQueryObject, {
                    ...solutionDocumentProjectionFields,
                    referenceQuestionSetId: 1,
                    type: 1
                }).lean();
    
                // console.log("solutionDocument", solutionDocument);

                if (!solutionDocument) {
                    let responseMessage = messageConstants.apiResponses.SOLUTION_NOT_FOUND;
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: responseMessage 
                    });
                }

              const referenceQuestionSetId = solutionDocument.referenceQuestionSetId;

              if (!referenceQuestionSetId) {
                let responseMessage =
                messageConstants.apiResponses.SOLUTION_IS_NOT_MIGRATED;
              return resolve({
                status: httpStatusCode.bad_request.status,
                message: responseMessage,
              });
              }
                
                if( req.query.ecmMethod && req.query.ecmMethod !== "" ) {
                    if(!solutionDocument.evidenceMethods[req.query.ecmMethod] ) {
                        return resolve({ 
                            status: httpStatusCode.bad_request.status, 
                            message: messageConstants.apiResponses.ECM_NOT_EXIST
                        });
                    }
                }

                let programQueryObject = {
                    _id: observationDocument.programId,
                    status: "active",
                    components: { $in: [ObjectId(observationDocument.solutionId)] }
                };

                let programDocument = await programsHelper.list(
                    programQueryObject,[
                        "externalId",
                        "name",
                        "description",
                        "imageCompression",
                        "isAPrivateProgram"
                    ]
                );

                if ( !programDocument[0]._id ) {
                    throw messageConstants.apiResponses.PROGRAM_NOT_FOUND;
                }

              let entityDocumentQuestionGroup = entityDocument.metaInformation
                .questionGroup
                ? entityDocument.metaInformation.questionGroup
                : ["A1"];
    
              response.result.entityProfile = {
                _id: entityDocument._id,
                entityTypeId: entityDocument.entityTypeId,
                entityType: entityDocument.entityType,
                // form: form
              };
    
                let solutionDocumentFieldList = await observationsHelper.solutionDocumentFieldListInResponse()

                response.result.solution = await _.pick(solutionDocument, solutionDocumentFieldList);
                response.result.program = programDocument[0];

                let submissionDocument = {
                    entityId: entityDocument._id,
                    entityExternalId: (entityDocument.metaInformation.externalId) ? entityDocument.metaInformation.externalId : "",
                    entityInformation: entityDocument.metaInformation,
                    solutionId: solutionDocument._id,
                    solutionExternalId: solutionDocument.externalId,
                    programId : programDocument[0]._id,
                    programExternalId : programDocument[0].externalId,
                    isAPrivateProgram : programDocument[0].isAPrivateProgram,
                    programInformation : {
                        ..._.omit(programDocument[0], ["_id", "components","isAPrivateProgram"])
                    },
                    frameworkId: solutionDocument.frameworkId,
                    frameworkExternalId: solutionDocument.frameworkExternalId,
                    entityTypeId: solutionDocument.entityTypeId,
                    entityType: solutionDocument.entityType,
                    scoringSystem: solutionDocument.scoringSystem,
                    isRubricDriven: solutionDocument.isRubricDriven,
                    observationId: observationDocument._id,
                    observationInformation: {
                        ..._.omit(observationDocument, ["_id", "entities", "deleted", "__v"])
                    },
                    createdBy: observationDocument.createdBy,
                    evidenceSubmissions: [],
                    entityProfile: {},
                    status: "started",
                    userProfile : observationDocument.userProfile
                };

                if( solutionDocument.hasOwnProperty("criteriaLevelReport") ) {
                    submissionDocument["criteriaLevelReport"] = solutionDocument["criteriaLevelReport"];
                }
                
                //if (req.body && req.body.role) {
                    //commented for mutiple role
                    // let roleDocument = await userRolesHelper.list
                    // ( { code : req.body.role },
                    //   [ "_id"]
                    // )

                    // if (roleDocument[0]._id) {
                    //     req.body.roleId = roleDocument[0]._id; 
                    // }

                    
                //}
                if( observationDocument.userRoleInformation && Object.keys(observationDocument.userRoleInformation).length > 0 ) {
                    submissionDocument.userRoleInformation = observationDocument.userRoleInformation;
                } else if( req.body && req.body.role && !observationDocument.userRoleInformation ){
                    submissionDocument.userRoleInformation = req.body;
                    let updateObservation = await observationsHelper.updateObservationDocument
                        (
                          { _id: req.params._id },
                          {
                              $set: { userRoleInformation : req.body }
                          }
                        )
                }

                if( solutionDocument.referenceFrom === messageConstants.common.PROJECT ) {
                    submissionDocument["referenceFrom"] = messageConstants.common.PROJECT;
                    submissionDocument["project"] = solutionDocument.project;
                }
                
                let assessment = {};

                assessment.name = solutionDocument.name;
                assessment.description = solutionDocument.description;
                assessment.externalId = solutionDocument.externalId;
                assessment.pageHeading = solutionDocument.pageHeading;

                let evidenceMethodArray = {};
                let submissionDocumentEvidences = {};
                let submissionDocumentCriterias = [];
                Object.keys(solutionDocument.evidenceMethods).forEach(solutionEcm => {
                    solutionDocument.evidenceMethods[solutionEcm].startTime = "";
                    solutionDocument.evidenceMethods[solutionEcm].endTime = "";
                    solutionDocument.evidenceMethods[solutionEcm].isSubmitted = false;
                    solutionDocument.evidenceMethods[solutionEcm].submissions = new Array;
                })
                submissionDocumentEvidences = solutionDocument.evidenceMethods;

            console.log("referenceQuestionSetIdreferenceQuestionSetId", referenceQuestionSetId);
              let evidences = {};
              if (referenceQuestionSetId) {
                response.result.solution._id = referenceQuestionSetId;
                evidences = await transFormationHelper.getQuestionSetHierarchy(
                  submissionDocumentCriterias,
                  solutionDocument
                );
                }

                // console.log("evidences", evidences);
                submissionDocument.evidences = submissionDocumentEvidences;
                submissionDocument.evidencesStatus = Object.values(submissionDocumentEvidences);
                submissionDocument.criteria = evidences.submissionDocumentCriterias || {};
                submissionDocument.submissionNumber = submissionNumber;

                submissionDocument["appInformation"] = {};
  
                if (req.headers["x-app-id"] || req.headers.appname ) {
                    submissionDocument["appInformation"]["appName"] = 
                    req.headers["x-app-id"] ? req.headers["x-app-id"] :
                    req.headers.appname;
                } 
  
                if (req.headers["x-app-ver"] || req.headers.appversion) {
                    submissionDocument["appInformation"]["appVersion"] = 
                    req.headers["x-app-ver"] ? req.headers["x-app-ver"] :
                    req.headers.appversion;
                }

                let submissionDoc = await observationsHelper.findSubmission(
                    submissionDocument
                );

                assessment.submissionId = submissionDoc.result._id;

                if( req.query.ecmMethod && req.query.ecmMethod !== "" ) {
                    if( evidenceMethodArray[req.query.ecmMethod] ) {
                        evidenceMethodArray = {
                            [req.query.ecmMethod] : evidenceMethodArray[req.query.ecmMethod]
                        };
                    }
                }

                const parsedAssessment = await assessmentsHelper.parseQuestionsV2(
                    Object.values(evidenceMethodArray),
                    entityDocumentQuestionGroup,
                    submissionDoc.result.evidences,
                    (solutionDocument && solutionDocument.questionSequenceByEcm) ? solutionDocument.questionSequenceByEcm : false,
                    entityDocument.metaInformation
                );

                assessment.evidences = evidences.evidences;
                assessment.submissions = parsedAssessment.submissions;
                if (parsedAssessment.generalQuestions && parsedAssessment.generalQuestions.length > 0) {
                    assessment.generalQuestions = parsedAssessment.generalQuestions;
                }

              response.result.assessment = assessment;
    

              return resolve(response);
            
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

