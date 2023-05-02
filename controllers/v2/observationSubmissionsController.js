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
const transFormationHelper = require(MODULES_BASE_PATH + "/questions/transformationHelper");

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

          console.log("observationDocument", observationDocument)
  
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
            "criteriaLevelReport",
            "referenceQuestionSetId",
            "type",
          ]);
  
          if (!solutionDocument[0]) {
            return resolve({ 
              status: httpStatusCode.bad_request.status, 
              message: messageConstants.apiResponses.SOLUTION_NOT_FOUND
            });
          }
  
          solutionDocument = solutionDocument[0];
          const referenceQuestionSetId = solutionDocument?.referenceQuestionSetId;

          if (!referenceQuestionSetId) {
            let responseMessage = messageConstants.apiResponses.SOLUTION_IS_NOT_MIGRATED;
              return resolve({
                status: httpStatusCode.bad_request.status,
                message: responseMessage,
            });
          }

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
  
        let evidences = {};
        if (referenceQuestionSetId) {
          evidences = await transFormationHelper.getQuestionSetHierarchy(
              submissionDocumentCriterias,
              solutionDocument,
              false
            );
        }
  
        submissionDocument.evidences = submissionDocumentEvidences;
        submissionDocument.evidencesStatus = Object.values(submissionDocumentEvidences);
        submissionDocument.criteria = evidences.submissionDocumentCriterias || {};
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
};
