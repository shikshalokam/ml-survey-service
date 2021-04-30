/**
 * name : surveySubmissionsController.js
 * author : Deepa
 * created-date : 06-Sep-2020
 * Description : Survey submissions information.
 */

// Dependencies
const surveySubmissionsHelper = require(MODULES_BASE_PATH + "/surveySubmissions/helper");
const submissionsHelper = require(MODULES_BASE_PATH + "/submissions/helper");

/**
    * SurveySubmissions
    * @class
*/
module.exports = class SurveySubmissions extends Abstract {

    constructor() {
        super(surveySubmissionsSchema);
    }

    static get name() {
        return "surveySubmissions";
    }


  /**
  * @api {post} /assessment/api/v1/surveySubmissions/make/{{submissionId}} Create Survey Submission
  * @apiVersion 1.0.0
  * @apiName Create Survey Submission
  * @apiGroup Survey Submissions
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
  * @apiParamExample {json} Response:
  * {
  *   "status": 200,
  *   "message": "Survey submission created successfully"
  * }
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * make survey submissions.
   * @method
   * @name make
   * @param {Object} req -request data.
   * @returns {JSON} - survey submissions creation.
   */

  async make(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let isSubmissionAllowed = await surveySubmissionsHelper.isAllowed
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
          
        let response = await submissionsHelper.createEvidencesInSubmission
        (  
          req,
          messageConstants.common.SURVEY_SUBMISSIONS, 
          false
        );

        if (response.result.status && response.result.status === messageConstants.common.SUBMISSION_STATUS_COMPLETED) {
            await surveySubmissionsHelper.pushCompletedSurveySubmissionForReporting(req.params._id);
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
            messageConstants.common.SURVEY_SUBMISSIONS
          );
        }
        
        return resolve(response)

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
  * @api {get} /assessment/api/v1/surveySubmissions/isAllowed/:surveySubmissionId?evidenceId=SF Check Submissions Status 
  * @apiVersion 1.0.0
  * @apiName Check Submissions Status 
  * @apiGroup Survey Submissions
  * @apiParam {String} evidenceId Evidence ID.
  * @apiSampleRequest /assessment/api/v1/surveySubmissions/isAllowed/5d2c1c57037306041ef0c7ea?evidenceId=SF
  * @apiParamExample {json} Response:
  * "result": {
      "allowed": true
    }
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Allowed Survey submissions to logged in user.
   * @method
   * @name isAllowed
   * @param {Object} req -request data.
   * @param {String} req.params._id -survey submission id.
   * @param {String} req.query.evidenceId -evidence method id.
   * @param {String} req.userDetails.userId -logged in user id. 
   * @returns {JSON} - survey submission allowed for the logged in user.
   */

  async isAllowed(req) {
    return new Promise(async (resolve, reject) => {

      try {

         let validateSubmission = await surveySubmissionsHelper.isAllowed
         (
           req.params._id,
           req.query.evidenceId,
           req.userDetails.userId
         );

         return resolve({
           message: validateSubmission.message,
           result: validateSubmission.data
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
  * @api {get} /assessment/api/v1/surveySubmissions/list List surveys
  * @apiVersion 1.0.0
  * @apiName List surveys
  * @apiGroup Survey Submissions
  * @apiParamExample {json} Response:
  * {
  *   "status": 200,
  *   "message": "Survey list fetched successfully",
      "result": [
         {
           "solutionId": "5f58b0b8894a0928fc8aa9b3",
           "surveyId": "5f5a27174493ef5355fdd4ee",
           "status": "started",
           "name": "test survey",
           "submissionId": "5f5a6eb812241403a02069c0"
         }
      ]
  * }
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * List created and submitted surveys.
   * @method
   * @name list
   * @param {Object} req -request data.
   * @returns {JSON} - survey list.
   */

  async list(req) {
    return new Promise(async (resolve, reject) => {

      try {
          
        let surveyList = await surveySubmissionsHelper.list
        (
          req.userDetails.userId
        );

        return resolve({
            message: surveyList.message,
            result: surveyList.data
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
  * @api {get} /assessment/api/v1/surveySubmissions/getStatus/:surveySubmissionId
  * @apiVersion 1.0.0
  * @apiName Get Submissions Status 
  * @apiGroup Survey Submissions
  * @apiSampleRequest /assessment/api/v1/surveySubmissions/getStatus/5d2c1c57037306041ef0c7ea
  * @apiParamExample {json} Response:
  * { 
     "status": 200,
     "message": "Submission status fetched successfully",
     "result": {
        "status": "completed"
     }
    }
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Get status of Survey submission.
   * @method
   * @name getStatus
   * @param {Object} req -request data.
   * @param {String} req.params._id -survey submission id.
   * @returns {JSON} - status of survey submission.
   */

  async getStatus(req) {
    return new Promise(async (resolve, reject) => {

      try {

         let getStatusOfSubmission = await surveySubmissionsHelper.getStatus
         (
           req.params._id
         );

         return resolve({
           message: getStatusOfSubmission.message,
           result: getStatusOfSubmission.data
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

}