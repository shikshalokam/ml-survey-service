/**
 * name : observationSubmissionsController.js
 * author : Akash
 * created-date : 20-Jan-2019
 * Description : Observations Submissions related information.
 */

// Dependencies

const observationsHelper = require(MODULES_BASE_PATH + "/observations/helper")
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper")
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper")
const submissionsHelper = require(MODULES_BASE_PATH + "/submissions/helper")
const criteriaHelper = require(MODULES_BASE_PATH + "/criteria/helper")
const questionsHelper = require(MODULES_BASE_PATH + "/questions/helper")
const observationSubmissionsHelper = require(MODULES_BASE_PATH + "/observationSubmissions/helper")
const scoringHelper = require(MODULES_BASE_PATH + "/scoring/helper")


/**
    * ObservationSubmissions
    * @class
*/
module.exports = class ObservationSubmissions extends Abstract {

  constructor() {
    super(observationSubmissionsSchema);
  }

  static get name() {
    return "observationSubmissions";
  }

  /**
  * @api {post} /assessment/api/v1/observationSubmissions/create/:observationId?entityId=:entityId Create A New Observation Submission
  * @apiVersion 1.0.0
  * @apiName Create A New Observation Submission
  * @apiGroup Observation Submissions
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiParam {String} entityId Entity ID.
  * @apiSampleRequest /assessment/api/v1/observationSubmissions/create/5d2c1c57037306041ef0c7ea?entityId=5d2c1c57037306041ef0c8fa
  * @apiParamExample {json} Request:
  * {
  *   "role" : "HM,DEO",
   		"state" : "236f5cff-c9af-4366-b0b6-253a1789766a",
      "district" : "1dcbc362-ec4c-4559-9081-e0c2864c2931",
      "school" : "c5726207-4f9f-4f45-91f1-3e9e8e84d824"
    }
  * @apiParamExample {json} Response:
  * "result": [
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
   * create observation submissions.
   * @method
   * @name create
   * @param {Object} req -request data.
   * @param {String} req.params._id -observation solution id.
   * @param {String} req.query.entityId -entity id.
   * @param {String} req.userDetails.userId - logged in user id.
   * @param {String} req.userDetails.userToken - logged in user token.
   * @returns {JSON} - observation submissions creation.
   */

  async create(req) {
    return new Promise(async (resolve, reject) => {

      try {
        let observationDocument = await observationsHelper.observationDocuments({
          _id: req.params._id,
          createdBy: req.userDetails.userId,
          status: {$ne:"inactive"},
          entities: ObjectId(req.query.entityId)
        });

        if (!observationDocument[0]) {
          return resolve({ 
            status: httpStatusCode.bad_request.status, 
            message: messageConstants.apiResponses.OBSERVATION_NOT_FOUND
           });
        }

        observationDocument = observationDocument[0];

        let entityDocument = await entitiesHelper.entityDocuments({
          _id: req.query.entityId,
          entityType: observationDocument.entityType
        }, [
          "metaInformation",
          "entityTypeId",
          "entityType",
          "registryDetails"
        ]);

        if (!entityDocument[0]) {
          return resolve({ 
            status: httpStatusCode.bad_request.status, 
            message: messageConstants.apiResponses.ENTITY_NOT_FOUND
          });
        }
        
        entityDocument = entityDocument[0];

        if (entityDocument.registryDetails && Object.keys(entityDocument.registryDetails).length > 0) {
          entityDocument.metaInformation.registryDetails = entityDocument.registryDetails;
        }

        let solutionDocument = await solutionsHelper.solutionDocuments({
          _id: observationDocument.solutionId,
          status: "active",
        }, [
          "externalId",
          "themes",
          "frameworkId",
          "frameworkExternalId",
          "evidenceMethods",
          "entityTypeId",
          "entityType",
          "programId",
          "programExternalId",
          "isAPrivateProgram",
          "scoringSystem",
          "isRubricDriven",
          "project",
          "referenceFrom",
          "criteriaLevelReport"
        ]);

        if (!solutionDocument[0]) {
          return resolve({ 
            status: httpStatusCode.bad_request.status, 
            message: messageConstants.apiResponses.SOLUTION_NOT_FOUND
          });
        }

        solutionDocument = solutionDocument[0];

        let entityProfileForm = await database.models.entityTypes.findOne(
            solutionDocument.entityTypeId,
            {
                profileForm: 1
            }
        ).lean();

        if (!entityProfileForm) {
          return resolve({ 
            status: httpStatusCode.bad_request.status,
             message: messageConstants.apiResponses.ENTITY_PROFILE_FORM_NOT_FOUND });
        }

        let lastSubmissionNumber = 0;

        const lastSubmissionForObservationEntity = 
        await observationsHelper.findLastSubmissionForObservationEntity(req.params._id, req.query.entityId);
        
        if(!lastSubmissionForObservationEntity.success) {
          throw new Error(lastSubmissionForObservationEntity.message);
        }

        lastSubmissionNumber = lastSubmissionForObservationEntity.result + 1;
        

        let submissionDocument = {
          entityId: entityDocument._id,
          entityExternalId: (entityDocument.metaInformation.externalId) ? entityDocument.metaInformation.externalId : "",
          entityInformation: entityDocument.metaInformation,
          solutionId: solutionDocument._id,
          solutionExternalId: solutionDocument.externalId,
          programId : solutionDocument.programId,
          programExternalId : solutionDocument.programExternalId,
          isAPrivateProgram : solutionDocument.isAPrivateProgram,
          frameworkId: solutionDocument.frameworkId,
          frameworkExternalId: solutionDocument.frameworkExternalId,
          entityTypeId: solutionDocument.entityTypeId,
          entityType: solutionDocument.entityType,
          observationId: observationDocument._id,
          observationInformation: {
              ..._.omit(observationDocument, ["_id", "entities", "deleted", "__v"])
          },
          createdBy: observationDocument.createdBy,
          evidenceSubmissions: [],
          entityProfile: {},
          status: "started",
          scoringSystem: solutionDocument.scoringSystem,
          isRubricDriven: solutionDocument.isRubricDriven, 
          userProfile : observationDocument.userProfile 
      };


      if( solutionDocument.hasOwnProperty("criteriaLevelReport") ) {
        submissionDocument["criteriaLevelReport"] = solutionDocument["criteriaLevelReport"];
      }
      if( observationDocument.userRoleInformation && Object.keys(observationDocument.userRoleInformation).length > 0 ){
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

      let criteriaId = new Array;
      let criteriaObject = {};
      let criteriaIdArray = gen.utils.getCriteriaIdsAndWeightage(solutionDocument.themes);

      criteriaIdArray.forEach(eachCriteriaId => {
          criteriaId.push(eachCriteriaId.criteriaId);
          criteriaObject[eachCriteriaId.criteriaId.toString()] = {
              weightage: eachCriteriaId.weightage
          };
      })

      let criteriaDocuments = await database.models.criteria.find(
          { _id: { $in: criteriaId } },
          {
              evidences : 0,
              resourceType: 0,
              language: 0,
              keywords: 0,
              concepts: 0,
              updatedAt : 0,
              createdAt : 0,
              frameworkCriteriaId : 0,
              __v : 0
          }
      ).lean();

      let submissionDocumentEvidences = {};
      let submissionDocumentCriterias = [];
      Object.keys(solutionDocument.evidenceMethods).forEach(solutionEcm => {
        if(!(solutionDocument.evidenceMethods[solutionEcm].isActive === false)) {
          solutionDocument.evidenceMethods[solutionEcm].startTime = "";
          solutionDocument.evidenceMethods[solutionEcm].endTime = "";
          solutionDocument.evidenceMethods[solutionEcm].isSubmitted = false;
          solutionDocument.evidenceMethods[solutionEcm].submissions = new Array;
        } else {
          delete solutionDocument.evidenceMethods[solutionEcm];
        }
      })
      submissionDocumentEvidences = solutionDocument.evidenceMethods;

      criteriaDocuments.forEach(criteria => {

          criteria.weightage = criteriaObject[criteria._id.toString()].weightage;

          submissionDocumentCriterias.push(
              _.omit(criteria, [
                  "evidences"
              ])
          );

      });


      submissionDocument.evidences = submissionDocumentEvidences;
      submissionDocument.evidencesStatus = Object.values(submissionDocumentEvidences);
      submissionDocument.criteria = submissionDocumentCriterias;
      submissionDocument.submissionNumber = lastSubmissionNumber;

      submissionDocument["appInformation"] = {};
  
      if (req.headers["x-app-id"] || req.headers.appname) {
        submissionDocument["appInformation"]["appName"] = 
        req.headers["x-app-id"] ? req.headers["x-app-id"] :
        req.headers.appname;
      } 

      if (req.headers["x-app-ver"] || req.headers.appversion) {
        submissionDocument["appInformation"]["appVersion"] = 
        req.headers["x-app-ver"] ? req.headers["x-app-ver"] :
        req.headers.appversion;
      }

      let newObservationSubmissionDocument = await database.models.observationSubmissions.create(submissionDocument);

      if( newObservationSubmissionDocument.referenceFrom === messageConstants.common.PROJECT ) {
        await observationSubmissionsHelper.pushSubmissionToImprovementService(
          _.pick(newObservationSubmissionDocument,["project","status","_id"])
        );
      }
      
      // Push new observation submission to kafka for reporting/tracking.
      observationSubmissionsHelper.pushObservationSubmissionForReporting(newObservationSubmissionDocument._id);

      let observations = new Array;

      observations = await observationsHelper.listV2(req.userDetails.userId);
      
      let responseMessage = messageConstants.apiResponses.OBSERVATION_SUBMISSION_CREATED;

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

    })
  }

    /**
  * @api {post} /assessment/api/v1/observationSubmissions/make/{{submissionId}} Create Observation Submission
  * @apiVersion 1.0.0
  * @apiName Create Observation Submission
  * @apiGroup Observation Submissions
  * @apiParamExample {json} Request-Body:
  * {
  * 	"evidence": {
  *                   "externalId" : "",
  *                   "answers" : {
  *                       "5be442149a14ba4b5038dce4" : {
  *                           "qid" : "",
  *                           "responseType":"",
  *                           "value" : [ 
  *                               {
  *                                   "5be442dd9a14ba4b5038dce5" : {
  *                                       "qid" : "",
  *                                       "value" : "",
  *                                       "remarks" : "",
  *                                       "fileName" : [],
  *                                       "payload" : {
  *                                           "question" : [ 
  *                                               "", 
  *                                               ""
  *                                           ],
  *                                           "labels" : [ 
  *                                               ""
  *                                           ],
  *                                           "responseType" : ""
  *                                       },
  *                                       "criteriaId" : ""
  *                                   },
  *                                   "5be52f5d9a14ba4b5038dd0c" : {
  *                                       "qid" : "",
  *                                       "value" : [ 
  *                                           "String", 
  *                                           "String"
  *                                       ],
  *                                       "remarks" : "",
  *                                       "fileName" : [],
  *                                       "payload" : {
  *                                           "question" : [ 
  *                                               "", 
  *                                               ""
  *                                           ],
  *                                           "labels" : [ 
  *                                              "String", 
  *                                           "String"
  *                                           ],
  *                                           "responseType" : """
  *                                       },
  *                                       "criteriaId" : ""
  *                                   }
  *                               }
  *                           ],
  *                           "remarks" : "",
  *                           "fileName" : [],
  *                           "payload" : {
  *                               "question" : [ 
  *                                   "String"", 
  *                                   "Stgring"
  *                               ],
  *                              "labels" : [ 
  *                                   [ 
  *                                       [ 
  *                                           {
  *                                               "_id" : "",
  *                                               "question" : [ 
  *                                                   "String", 
  *                                                   "String"
  *                                               ],
  *                                               "options" : [ 
  *                                                   {
  *                                                       "value" : "",
  *                                                       "label" : ""
  *                                                   }
  *                                               ],
  *                                               "children" : [],
  *                                               "questionGroup" : [ 
  *                                                   ""
  *                                               ],
  *                                               "fileName" : [],
  *                                               "instanceQuestions" : [],
  *                                               "deleted" : Boolean,
  *                                               "tip" : "",
  *                                               "externalId" : "",
  *                                               "visibleIf" : "",
  *                                               "file" : "",
  *                                               "responseType" : "",
  *                                               "validation" : {
  *                                                   "required" : Boolean
  *                                               },
  *                                               "showRemarks" : Boolean,
  *                                               "isCompleted" : Boolean,
  *                                               "remarks" : "",
  *                                               "value" : "",
  *                                               "canBeNotApplicable" : "Boolean",
  *                                               "usedForScoring" : "",
  *                                               "modeOfCollection" : "",
  *                                               "questionType" : "",
  *                                               "accessibility" : "",
  *                                               "updatedAt" : "Date",
  *                                               "createdAt" : "Date",
  *                                               "__v" : 0,
  *                                               "payload" : {
  *                                                   "criteriaId" : ""
  *                                               }
  *                                           }, 
  *                                           {
  *                                               "_id" : "",
  *                                               "question" : [ 
  *                                                   "String", 
  *                                                   "String"
  *                                               ],
  *                                               "options" : [ 
  *                                                   {
  *                                                       "value" : "",
  *                                                       "label" : ""
  *                                                   }
  *                                               ],
  *                                               "children" : [],
  *                                               "questionGroup" : [ 
  *                                                   "String"
  *                                               ],
  *                                               "fileName" : [],
  *                                               "instanceQuestions" : [],
  *                                               "deleted" : Boolean,
  *                                               "tip" : "",
  *                                               "externalId" : "",
  *                                               "visibleIf" : "",
  *                                               "file" : "",
  *                                               "responseType" : "",
  *                                               "validation" : {
  *                                                   "required" : Boolean
  *                                               },
  *                                               "showRemarks" : Boolean,
  *                                               "isCompleted" : Boolean,
  *                                               "remarks" : "",
  *                                               "value" : "",
  *                                               "canBeNotApplicable" : "Boolean",
  *                                               "usedForScoring" : "",
  *                                               "modeOfCollection" : "",
  *                                               "questionType" : "",
  *                                               "accessibility" : "",
  *                                               "updatedAt" : "Date",
  *                                               "createdAt" : "Date",
  *                                               "__v" : 0,
  *                                               "payload" : {
  *                                                   "criteriaId" : ""
  *                                               }
  *                                           }
  *                                       ], 
  *                                   ]
  *                               ],
  *                               "responseType" : ""
  *                           },
  *                           "criteriaId" : ""
  *                       }
  *                   },
  *                   "startTime" : Date,
  *                   "endTime" : Date,
  *                   "gpsLocation" : "String,String",
  *                   "submittedBy" : """,
  *                   "isValid" : Boolean
  *               }
  * }
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * make observation submissions.
   * @method
   * @name make
   * @param {Object} req -request data.
   * @returns {JSON} - observation submissions creation.
   */

    async make(req) {
      return new Promise(async (resolve, reject) => {
  
        try {
  
          let isSubmissionAllowed = await observationSubmissionsHelper.isAllowed
          (
            req.params._id,
            req.body.evidence.externalId,
            req.userDetails.userId
          )
  
          if (isSubmissionAllowed.data.allowed && isSubmissionAllowed.data.allowed == false) {
             throw new Error(messageConstants.apiResponses.MULTIPLE_SUBMISSIONS_NOT_ALLOWED)
          }

          if( req.headers.deviceid ) {
            req.body.evidence["deviceId"] = req.headers.deviceid;
          }

          if( req.headers["user-agent"] ) {
            req.body.evidence["userAgent"] = req.headers["user-agent"];
          }
  
          let response = await submissionsHelper.createEvidencesInSubmission(req, "observationSubmissions", false);
  
          await observationSubmissionsHelper.pushObservationSubmissionForReporting(req.params._id);
       
           if(response.result.status && response.result.status === "ratingPending") {
            await observationSubmissionsHelper.pushObservationSubmissionToQueueForRating(req.params._id);
          }
  
          let appInformation = {};
  
          if( req.headers["x-app-id"] || req.headers.appname ) {
            appInformation["appName"] = 
            req.headers["x-app-id"] ? req.headers["x-app-id"] :
            req.headers.appname;
          } 
  
          if( req.headers["x-app-ver"] || req.headers.appversion ) {
            appInformation["appVersion"] = 
            req.headers["x-app-ver"] ? req.headers["x-app-ver"] :
            req.headers.appversion;
          }
  
          if( Object.keys(appInformation).length > 0 ) {
            await submissionsHelper.addAppInformation(
              req.params._id,
              appInformation,
              "observationSubmissions"
            );
          }
  
          return resolve(response);
  
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
  * @api {get} /assessment/api/v1/observationSubmissions/isAllowed:observationSubmissionId?evidenceId="LW" Check Submissions Status 
  * @apiVersion 1.0.0
  * @apiName Check Submissions Status 
  * @apiGroup Observation Submissions
  * @apiParam {String} evidenceId Evidence ID.
  * @apiSampleRequest /assessment/api/v1/observationSubmissions/isAllowed/5d2c1c57037306041ef0c7ea?evidenceId=SO
  * @apiParamExample {json} Response:
  * "result": {
      "allowed": true
    }
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Allowed Observation submissions to logged in user.
   * @method
   * @name isAllowed
   * @param {Object} req -request data.
   * @param {String} req.params._id -observation submissions id.
   * @param {String} req.query.evidenceId -evidence method id.
   * @param {String} req.userDetails.userId -logged in user id. 
   * @returns {JSON} - observation submissions allowed for the logged in user.
   */

  async isAllowed(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let isSubmissionAllowed = await observationSubmissionsHelper.isAllowed
        (
          req.params._id,
          req.query.evidenceId,
          req.userDetails.userId
        );

        return resolve({
          message: isSubmissionAllowed.message,
          result: isSubmissionAllowed.data
        })


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
  * @api {get} /assessment/api/v1/observationSubmissions/delete/:observationSubmissionId Delete Observation Submission
  * @apiVersion 1.0.0
  * @apiName Delete Observation Submission
  * @apiGroup Observation Submissions
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * Delete Observation submissions.
   * @method
   * @name delete
   * @param {String} req.params._id -observation submissions id.
   * @returns {JSON} - message that observation submission is deleted.
   */

    async delete(req) {
      return new Promise(async (resolve, reject) => {
  
        try {
  
          let result = await observationSubmissionsHelper.delete(
            req.params._id,
            req.userDetails.userId
          );

          return resolve(result);
  
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
    * @api {post} /assessment/api/v1/observationSubmissions/title/:observationSubmissionId Set Observation Submission Title
    * @apiVersion 1.0.0
    * @apiName Set Observation Submission Title
    * @apiGroup Observation Submissions
    * @apiSampleRequest /assessment/api/v1/observationSubmissions/title/5d2c1c57037306041ef0c7ea
    * @apiParamExample {json} Request-Body:
    * {
    *   "title" : "Observation Submission Title",
    * }
    * @apiParamExample {json} Response:
    * {
    *    "message": "Observation submission updated successfully",
    *    "status": 200
    *  }
    * @apiUse successBody
    * @apiUse errorBody
    */
  
     /**
     * Set Observation Submission Title.
     * @method
     * @name title
     * @param {String} req.params._id -observation submissions id.
     * @returns {JSON} - message that observation submission title is set.
     */
  
    async title(req) {
      return new Promise(async (resolve, reject) => {
  
        try {

          let result = await observationSubmissionsHelper.setTitle(
            req.params._id,
            req.userDetails.userId,
            req.body.title
          );
  
          return resolve(result);
  
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
  * @api {get} /assessment/api/v1/observationSubmissions/pushObservationSubmissionForReporting/:observationSubmissionId Push Observation Submission for Reporting
  * @apiVersion 1.0.0
  * @apiName Push Observation Submission to Kafka
  * @apiGroup Observation Submissions
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Push observation submissions to kafka for reporting.
   * @method
   * @name pushObservationSubmissionForReporting
   * @param {Object} req -request data. 
   * @param {String} req.params._id -observation submissions id.
   * @returns {JSON} - message that observation submission is pushed to kafka.
   */

  async pushObservationSubmissionForReporting(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let pushObservationSubmissionToKafka = await observationSubmissionsHelper.pushObservationSubmissionForReporting(req.params._id);

        if(pushObservationSubmissionToKafka.status != "success") {
          throw pushObservationSubmissionToKafka.message;
        }

        return resolve({
          message: pushObservationSubmissionToKafka.message
        });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
        });
      }
    })
  }

  /**
  * @api {get} /assessment/api/v1/observationSubmissions/rate/:entityExternalId?solutionId=:solutionExternalId&createdBy=:keycloakUserId&submissionNumber=:submissionInstanceNumber Rate a Single Entity of Observation
  * @apiVersion 1.0.0
  * @apiName Rate a Single Entity of Observation
  * @apiGroup Observation Submissions
  * @apiParam {String} solutionId Solution External ID.
  * @apiParam {String} createdBy Keycloak user ID.
  * @apiParam {String} submissionNumber Submission Number.
  * @apiSampleRequest /assessment/api/v1/observationSubmissions/rate/1002036?solutionId=EF-DCPCR-2018-001&createdBy=e97b5582-471c-4649-8401-3cc4249359bb&submissionNumber=2
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Rate observation
   * @method
   * @name rate
   * @param {Object} req -request data.  
   * @param {String} req.params._id -entity id.
   * @param {String} req.query.solutionId -solution id.
   * @param {String} req.query.createdBy -observation submission created user.  
   * @param {String} req.query.submissionNumber -observation submission number. 
   * @returns {JSON} 
   */

  async rate(req) {
    return new Promise(async (resolve, reject) => {

      try {

        req.body = req.body || {};
        let message = messageConstants.apiResponses.CRITERIA_RATING;

        let createdBy = req.query.createdBy;
        let solutionId = req.query.solutionId;
        let entityId = req.params._id;
        let submissionNumber = (req.query.submissionNumber) ? parseInt(req.query.submissionNumber) : 1;

        if (!createdBy) {
          throw messageConstants.apiResponses.CREATED_BY_NOT_FOUND;
        }

        if (!solutionId) {
          throw messageConstants.apiResponses.SOLUTION_ID_NOT_FOUND;
        }

        if (!entityId) {
          throw messageConstants.apiResponses.ENTITY_ID_NOT_FOUND;
        }


        let solutionDocument = await database.models.solutions.findOne({
          externalId: solutionId,
          type : "observation",
         // scoringSystem : "pointsBasedScoring"
        }, { themes: 1, levelToScoreMapping: 1, scoringSystem : 1, flattenedThemes : 1}).lean()
 
        if (!solutionDocument) {
          return resolve({
            status: httpStatusCode.bad_request.status,
            message: messageConstants.apiResponses.SOLUTION_NOT_FOUND
          });
        }

        let queryObject = {
          "createdBy": createdBy,
          "entityExternalId": entityId,
          "solutionExternalId": solutionId,
          "submissionNumber" : (submissionNumber) ? submissionNumber : 1
        }

        let submissionDocument = await database.models.observationSubmissions.findOne(
          queryObject,
          { "answers": 1, "criteria": 1, "evidencesStatus": 1, "entityInformation": 1, "entityProfile": 1, "solutionExternalId": 1 , "scoringSystem" : 1}
        ).lean();

        if (!submissionDocument._id) {
          throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND
        }

        submissionDocument.submissionCollection = "observationSubmissions"
        submissionDocument.scoringSystem = submissionDocument.scoringSystem;

        let allCriteriaInSolution = new Array
        let allQuestionIdInSolution = new Array
        let solutionQuestions = new Array

        allCriteriaInSolution = gen.utils.getCriteriaIds(solutionDocument.themes);

        if(allCriteriaInSolution.length > 0) {
          
          submissionDocument.themes = solutionDocument.flattenedThemes

          let allCriteriaDocument = await criteriaHelper.criteriaDocument({
            _id : {
              $in : allCriteriaInSolution
            }
          }, [
            "evidences"
          ])

          allQuestionIdInSolution = gen.utils.getAllQuestionId(allCriteriaDocument);
        }
        
        if (submissionDocument.scoringSystem == "pointsBasedScoring") {
          if (allQuestionIdInSolution.length > 0) {

            solutionQuestions = await questionsHelper.questionDocument({
              _id: {
                $in: allQuestionIdInSolution
              },
              responseType: {
                $in: [
                  "radio",
                  "multiselect",
                  "slider"
                ]
              }
            }, [
                "weightage",
                "options",
                "sliderOptions",
                "responseType"
              ])

          }

          if (solutionQuestions.length > 0) {
            submissionDocument.questionDocuments = {}
            solutionQuestions.forEach(question => {
              submissionDocument.questionDocuments[question._id.toString()] = {
                _id: question._id,
                weightage: question.weightage
              }
              let questionMaxScore = 0
              if (question.options && question.options.length > 0) {
                if (question.responseType != "multiselect") {
                  questionMaxScore = _.maxBy(question.options, 'score').score;
                }
                question.options.forEach(option => {
                  if (question.responseType == "multiselect") {
                    questionMaxScore += option.score
                  }
                  if ("score" in option) {
                    option.score >= 0 ?
                      submissionDocument.questionDocuments[question._id.toString()][`${option.value}-score`] =
                      option.score : "";
                  }
                })
              }
              if (question.sliderOptions && question.sliderOptions.length > 0) {
                questionMaxScore = _.maxBy(question.sliderOptions, 'score').score;
                submissionDocument.questionDocuments[question._id.toString()].sliderOptions = question.sliderOptions
              }
              submissionDocument.questionDocuments[question._id.toString()].maxScore = (typeof questionMaxScore === "number") ? questionMaxScore : 0;
            })
          }
        }


        let resultingArray = await scoringHelper.rateEntities([submissionDocument], "singleRateApi")
        if(resultingArray.result.runUpdateQuery) {
          await observationSubmissionsHelper.markCompleteAndPushForReporting(submissionDocument._id)
        }
        return resolve(resultingArray)

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
  * @api {get} /assessment/api/v1/observationSubmissions/multiRate?entityId=:entityExternalId1,:entityExternalId2&solutionId=:solutionExternalId&createdBy=:keycloakUserId&submissionNumber=:submissionInstanceNumber Rate Multiple Entities of Observation
  * @apiVersion 1.0.0
  * @apiName Rate Multiple Entities of Observation
  * @apiGroup Observation Submissions
  * @apiParam {String} entityId Entity ID.
  * @apiParam {String} solutionId Solution External ID.
  * @apiParam {String} createdBy Keycloak user ID.
  * @apiParam {String} submissionNumber Submission Number.
  * @apiSampleRequest /assessment/api/v1/observationSubmissions/multiRate?entityId=1556397,1310274&solutionId=EF-DCPCR-2018-001&createdBy=e97b5582-471c-4649-8401-3cc4249359bb&submissionNumber=all
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Multi Rate observation
   * @method
   * @name multiRate
   * @param {Object} req -request data.  
   * @param {String} req.query.entityId -list of entity ids.
   * @param {String} req.query.solutionId -solution id.
   * @param {String} req.query.createdBy -observation submission created user.  
   * @param {String} req.query.submissionNumber -observation submission number. 
   * @returns {JSON} 
   */

  async multiRate(req) {
    return new Promise(async (resolve, reject) => {

      try {

        req.body = req.body || {};
        let message = messageConstants.apiResponses.CRITERIA_RATING;

        let createdBy = req.query.createdBy;
        let solutionId = req.query.solutionId;
        let submissionNumber = (req.query.submissionNumber) ? req.query.submissionNumber : "all";
        let entityId = req.query.entityId.split(",");

        if (!createdBy) {
          throw messageConstants.apiResponses.CREATED_BY_NOT_FOUND;
        }

        if (!solutionId) {
          throw messageConstants.apiResponses.SOLUTION_ID_NOT_FOUND;
        }

        if (!req.query.entityId || !(req.query.entityId.length >= 1)) {
          throw messageConstants.apiResponses.ENTITY_ID_NOT_FOUND;
        }

        let solutionDocument = await database.models.solutions.findOne({
          externalId: solutionId,
          type : "observation",
          // scoringSystem : "pointsBasedScoring"
        }, { themes: 1, levelToScoreMapping: 1, scoringSystem : 1, flattenedThemes : 1, type : 1 }).lean();

        if (!solutionDocument) {
          return resolve({
            status: httpStatusCode.bad_request.status,
            message: messageConstants.apiResponses.SOLUTION_NOT_FOUND
          });
        }

        let queryObject = {
          "createdBy": createdBy,
          "solutionExternalId": solutionId,
          "entityExternalId": { $in: entityId }
        };

        if(submissionNumber != "all" && parseInt(submissionNumber)) {
          queryObject["submissionNumber"] = parseInt(submissionNumber);
        }

        let submissionDocuments = await database.models.observationSubmissions.find(
          queryObject,
          { answers: 1, criteria: 1, evidencesStatus: 1, entityProfile: 1, entityInformation: 1, solutionExternalId: 1, entityExternalId: 1, scoringSystem: 1 }
        ).lean();

        if (!submissionDocuments) {
          throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;
        }

        let commonSolutionDocumentParameters = {
          submissionCollection : "observationSubmissions",
          scoringSystem : submissionDocuments[0].scoringSystem
        };

        let allCriteriaInSolution = new Array;
        let allQuestionIdInSolution = new Array;
        let solutionQuestions = new Array;

        allCriteriaInSolution = gen.utils.getCriteriaIds(solutionDocument.themes);

        if(allCriteriaInSolution.length > 0) {
          
          commonSolutionDocumentParameters.themes = solutionDocument.flattenedThemes;

          let allCriteriaDocument = await criteriaHelper.criteriaDocument({
            _id : {
              $in : allCriteriaInSolution
            }
          }, [
            "evidences"
          ]);

          allQuestionIdInSolution = gen.utils.getAllQuestionId(allCriteriaDocument);
        }
        
        if (submissionDocuments[0].scoringSystem == "pointsBasedScoring") {
          if (allQuestionIdInSolution.length > 0) {

            solutionQuestions = await questionsHelper.questionDocument({
              _id: {
                $in: allQuestionIdInSolution
              },
              responseType: {
                $in: [
                  "radio",
                  "multiselect",
                  "slider"
                ]
              }
            }, [
                "weightage",
                "options",
                "sliderOptions",
                "responseType"
              ]);

          }

          if (solutionQuestions.length > 0) {
            commonSolutionDocumentParameters.questionDocuments = {};
            solutionQuestions.forEach(question => {
              commonSolutionDocumentParameters.questionDocuments[question._id.toString()] = {
                _id: question._id,
                weightage: question.weightage
              };
              let questionMaxScore = 0;
              if (question.options && question.options.length > 0) {
                if (question.responseType != "multiselect") {
                  questionMaxScore = _.maxBy(question.options, 'score').score;
                }
                question.options.forEach(option => {
                  if (question.responseType == "multiselect") {
                    questionMaxScore += option.score;
                  }
                  if ("score" in option) {

                    option.score >= 0 ?
                      commonSolutionDocumentParameters.questionDocuments[question._id.toString()][`${option.value}-score`] =
                      option.score
                      : "";
                  }
                })
              }
              if (question.sliderOptions && question.sliderOptions.length > 0) {
                questionMaxScore = _.maxBy(question.sliderOptions, 'score').score;
                commonSolutionDocumentParameters.questionDocuments[question._id.toString()].sliderOptions = question.sliderOptions;
              }
              commonSolutionDocumentParameters.questionDocuments[question._id.toString()].maxScore = (typeof questionMaxScore === "number") ? questionMaxScore : 0;
            })
          }
        }

        if(commonSolutionDocumentParameters && Object.keys(commonSolutionDocumentParameters).length > 0) {
          submissionDocuments.forEach(eachsubmissionDocument => {
            _.merge(eachsubmissionDocument,commonSolutionDocumentParameters);
          })
        }

        let resultingArray = await scoringHelper.rateEntities(submissionDocuments, "multiRateApi");

        for (let pointerToResultingArray = 0; pointerToResultingArray < resultingArray.length; pointerToResultingArray++) {
          const submission = resultingArray[pointerToResultingArray];
          if(submission.runUpdateQuery) {
            await observationSubmissionsHelper.markCompleteAndPushForReporting(submission.submissionId)
          }
        }
        
        return resolve({ result: resultingArray });

      } catch (error) {
        return reject({
          status: 500,
          message: error,
          errorObject: error
        });
      }

    })
  }

  /**
  * @api {get} /assessment/api/v1/observationSubmissions/list/:observationId?entityId:entityId List Observation Submissions
  * @apiVersion 1.0.0
  * @apiName List Observation Submissions
  * @apiGroup Observation Submissions
  * @apiSampleRequest /assessment/api/v1/observationSubmissions/list/5d1a002d2dfd8135bc8e1615?entityId=5cee7d1390013936552f6a8d
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
    "message": "Successfully fetched observation submissions",
    "status": 200,
    "result": [
        {
             "_id": "5d8de379bccbfb51d4450d05",
            "entityId": "5bfe53ea1d0c350d61b78d0f",
            "entityExternalId": "1208138",
            "entityType": "school",
            "status": "started",
            "submissionNumber": 1,
            "updatedAt": "2019-09-27T10:24:57.182Z",
            "createdAt": "2019-09-27T10:24:57.182Z"
        }
    ]
  }
  */
   /**
   * List observation submissions
   * @method
   * @name list
   * @param {Object} req - requested data.
   * @param {String} req.query.entityId - entity id.
   * @param {String} req.params._id - observation id. 
   * @returns {JSON} consists of list of observation submissions.
   */
  async list(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let submissionDocument =
         await observationSubmissionsHelper.list
          (
          req.query.entityId,
          req.params._id
          );
        return resolve(submissionDocument);
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
  * @api {get} /assessment/api/v1/observationSubmissions/status/:submissionId
  * @apiVersion 1.0.0
  * @apiName Get Observation Submission Status
  * @apiGroup Observation Submissions
  * @apiSampleRequest /assessment/api/v1/observationSubmissions/status/5d1a002d2dfd8135bc8e1615
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
    "message": "Observation submission status fetched successfuly",
    "status": 200,
    "result": {
          "status": "completed"
        }
  }
  */
   /**
   * Get observation submission status
   * @method
   * @name status
   * @param {Object} req - requested data.
   * @param {String} req.params._id - observation submission id. 
   * @returns {JSON} consists of status of the observation submission.
   */
  async status(req) {
    return new Promise(async (resolve, reject) => {
      try {
        
        let submissionDocument =
         await observationSubmissionsHelper.status
          (
            req.params._id
          );

        return resolve({
           message: submissionDocument.message,
           result: submissionDocument.data
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
  * @api {post} /assessment/api/v1/observationSubmissions/disable/:solutionId
  * @apiVersion 1.0.0
  * @apiName Disable Observation Submission Based on Solution Id 
  * @apiGroup Observation Submissions
  * @apiSampleRequest /assessment/api/v1/observationSubmissions/disable/5d1a002d2dfd8135bc8e1615
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
    "message": "Observation submission disabled successfuly",
    "status": 200,
    "result": false
  }
  */
   /**
   * Disable Observation Submission Based on Solution Id
   * @method
   * @name disable
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution id. 
   * @returns {JSON} consists of ids of the observation submission disabled.
   */
  async disable(req) {
    return new Promise(async (resolve, reject) => {
      try {
        
        let submissionDocument =
         await observationSubmissionsHelper.disable(req.params._id);

        return resolve({
           message: submissionDocument.message,
           result: submissionDocument.data
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
  * @api {post} /assessment/api/v1/observationSubmissions/update/:observationSubmissionId Update Observation Submission
  * @apiVersion 1.0.0
  * @apiName Update Observation Submission
  * @apiGroup Observation Submissions
  * @apiParamExample {json} Request-Body:
  * {
  *   "title" : "Observation Submission Title",
  * }
  * @apiSampleRequest /assessment/api/v1/observationSubmissions/update/5d2c1c57037306041ef0c7ea
  * @apiParamExample {json} Response:
  * {
  *    "message": "Observation submission updated successfully",
  *    "status": 200
  *  }
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * make observation submissions.
   * @method
   * @name make
   * @param {Object} req -request data.
   * @returns {JSON} - observation submissions creation.
   */

    async update(req) {
      return new Promise(async (resolve, reject) => {
  
        try {

          let response = {};
          if( req.method === "POST" ) {

            if( req.body.title ) {
              response = await observationSubmissionsHelper.setTitle(
                req.params._id,
                req.userDetails.userId,
                req.body.title
              );

            }else if( req.body.evidence ) {
              
              let isSubmissionAllowed = await observationSubmissionsHelper.isAllowed
              (
                req.params._id,
                req.body.evidence.externalId,
                req.userDetails.userId
              );

              if (
                isSubmissionAllowed.data.allowed && 
                isSubmissionAllowed.data.allowed == false
              ) {
                throw new Error(messageConstants.apiResponses.MULTIPLE_SUBMISSIONS_NOT_ALLOWED);
              }

              if(req.body.evidence.notApplicable && req.body.evidence.answers == undefined){

                let formattedEvidence = await observationSubmissionsHelper.addAnswersMarkedAsNA(
                  req.params._id,
                  req.userDetails.userId,
                  req.body.evidence.externalId,
                  req.body.evidence.remarks ? req.body.evidence.remarks : ""
                );

                if(!formattedEvidence || !formattedEvidence.result.evidences){
                  return resolve(formattedEvidence);
                }

                req.body.evidence = formattedEvidence.result.evidences;
                
              }
              
              if(req.body.evidence.notApplicable && req.body.evidence.answers == undefined){

                let formattedEvidence = await observationSubmissionsHelper.addAnswersMarkedAsNA(
                  req.params._id,
                  req.userDetails.userId,
                  req.body.evidence.externalId,
                  req.body.evidence.remarks ? req.body.evidence.remarks : ""
                );

                if(!formattedEvidence || !formattedEvidence.result.evidences){
                  return resolve(formattedEvidence);
                }

                req.body.evidence = formattedEvidence.result.evidences;
                
              }
              
                response = await submissionsHelper.createEvidencesInSubmission(req, "observationSubmissions", false);
                observationSubmissionsHelper.pushObservationSubmissionForReporting(req.params._id);
              
                if(response.result.status && response.result.status === "ratingPending") {
                observationSubmissionsHelper.pushObservationSubmissionToQueueForRating(req.params._id);
              }

              let appInformation = {};

              if( req.headers["x-app-id"] || req.headers.appname ) {
                appInformation["appName"] = 
                req.headers["x-app-id"] ? req.headers["x-app-id"] :
                req.headers.appname;
              } 

              if( req.headers["x-app-ver"] || req.headers.appversion ) {
                appInformation["appVersion"] = 
                req.headers["x-app-ver"] ? req.headers["x-app-ver"] :
                req.headers.appversion;
              }
              
              if( Object.keys(appInformation).length > 0 ) {
                await submissionsHelper.addAppInformation(
                  req.params._id,
                  appInformation,
                  "observationSubmissions"
                );
              }
            }

          } else if( req.method === "DELETE" ) {
            
            response = await observationSubmissionsHelper.delete(
              req.params._id,
              req.userDetails.userId
            );
          }

          return resolve(response);
  
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
  * @api {post} /assessment/api/v1/observationSubmissions/solutionList
  * @apiVersion 1.0.0
  * @apiName Get Observation Submission solutions
  * @apiGroup Observation Submissions
  * @apiSampleRequest /assessment/api/v1/observationSubmissions/solutionList
  * @apiParamExample {json} Request:
  * {
  *   "role" : "HM,DEO",
   		"state" : "236f5cff-c9af-4366-b0b6-253a1789766a",
      "district" : "1dcbc362-ec4c-4559-9081-e0c2864c2931",
      "school" : "c5726207-4f9f-4f45-91f1-3e9e8e84d824"
    }
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
    "message": "Solutions fetched successfully",
    "status": 200,
    "result": {
        "data": [
            {
                "solutionId": "600b21c57ea68a7ed9278873",
                "programId": "600ab53cc7de076e6f993724",
                "observationId": "60113bcf2d0bbd2f0c3229dc",
                "scoringSystem": null,
                "isRubricDriven": false,
                "entityType": "district",
                "entities": [
                    {
                        "_id": "5fd098e2e049735a86b748b7",
                        "externalId": "D_AP-D012",
                        "name": "ANANTAPUR"
                    },
                    {
                        "_id": "5fd098e2e049735a86b748b2",
                        "externalId": "D_AP-D007",
                        "name": "GUNTUR"
                    }
                ],
                "programName": "AP-TEST-PROGRAM-3.6.5",
                "name": "AP-TEST-PROGRAM-3.6.5-OBS-IMP-PROJECT-2-DEO"
            }
        ],
        "entityType": [
            "district"
        ],
        "count": 1
    }
}
  */
   /**
   * Get observation submission solutions
   * @method
   * @name solutionList
   * @returns {JSON} consists of solutions, count and entityTypes.
   */
  async solutionList(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let entityType =  req.query.entityType ? req.query.entityType : "";
        
        let solutions = await observationSubmissionsHelper.solutionList
        (
          req.body,
          req.userDetails.userId,
          entityType,
          req.pageSize,
          req.pageNo
        );

        return resolve({
           message: solutions.message,
           result: solutions.data
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

};