/**
 * name : submissionsController.js
 * author : Akash
 * created-date : 01-feb-2019
 * Description : Static links related helper functionality.
 */

// Dependencies
const FileStream = require(ROOT_PATH + "/generics/fileStream");
const csv = require("csvtojson");
const submissionsHelper = require(MODULES_BASE_PATH + "/submissions/helper")
const criteriaHelper = require(MODULES_BASE_PATH + "/criteria/helper")
const questionsHelper = require(MODULES_BASE_PATH + "/questions/helper")
const scoringHelper = require(MODULES_BASE_PATH + "/scoring/helper")

/**
    * Submission
    * @class
*/
module.exports = class Submission extends Abstract {

  constructor() {
    super(submissionsSchema);
  }

  static get name() {
    return "submissions";
  }

  /**
  * @api {post} /assessment/api/v1/submissions/make/{{submissionId}} 
  * @apiVersion 1.0.0
  * @apiName submissions added successfully
  * @apiGroup Submissions
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
   * Make submissions.
   * @method
   * @name make
   * @param {Object} req -request data.
   * @param {String} req.params._id -Submission id.
   * @returns {JSON} Created submission data. 
   */

  async make(req) {
    return new Promise(async (resolve, reject) => {

      try {

        if( req.headers.deviceid ) {
          req.body.evidence["deviceId"] = req.headers.deviceid;
        }

        if( req.headers["user-agent"] ) {
          req.body.evidence["userAgent"] = req.headers["user-agent"];
        }
        
        let response = await submissionsHelper.createEvidencesInSubmission(req, "submissions", false);

        if (response.result.status && response.result.status === "completed") {
          await submissionsHelper.pushCompletedSubmissionForReporting(req.params._id);
        } else if(response.result.status && response.result.status === "ratingPending") {
          await submissionsHelper.pushSubmissionToQueueForRating(req.params._id);
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
            "submissions"
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
  * @api {post} /assessment/api/v1/submissions/completeParentInterview/:submissionId Complete parent interview
  * @apiVersion 1.0.0
  * @apiName Complete Parent Interview
  * @apiSampleRequest /assessment/api/v1/submissions/completeParentInterview/5c5147ae95743c5718445eff
  * @apiGroup Submissions
  * @apiUse successBody
  * @apiUse errorBody
  */

    /**
   * Complete parent interview.
   * @method
   * @name completeParentInterview
   * @param {Object} req -request data.
   * @param {String} req.params._id -Submission id.
   * @returns {JSON} complete parent interview. 
   */

  async completeParentInterview(req) {
    return new Promise(async (resolve, reject) => {

      try {

        req.body = req.body || {};
        let message = messageConstants.apiResponses.PARENT_INTERVIEW_COMPLETED;
        const parentInterviewEvidenceMethod = "PAI";
        let runUpdateQuery = false;

        let queryObject = {
          _id: ObjectId(req.params._id)
        };

        let queryOptions = {
          new: true
        };

        let submissionDocument = await database.models.submissions.findOne(
          queryObject
        );

        let updateObject = {};
        updateObject.$set = {};


        let entityQueryObject = {
          _id: ObjectId(submissionDocument.entityId)
        };

        let entityUpdatedDocument = {};

        let updateEntityObject = {};

        updateEntityObject.$set = {};

        let evidencesStatusToBeChanged = submissionDocument.evidencesStatus.find(singleEvidenceStatus => singleEvidenceStatus.externalId == parentInterviewEvidenceMethod);

        if (submissionDocument && (submissionDocument.evidences[parentInterviewEvidenceMethod].isSubmitted != true)) {
          let evidenceSubmission = {};
          evidenceSubmission.externalId = parentInterviewEvidenceMethod;
          evidenceSubmission.submittedBy = req.userDetails.userId;
          evidenceSubmission.submittedByName = req.userDetails.firstName + " " + req.userDetails.lastName;
          evidenceSubmission.submittedByEmail = req.userDetails.email;
          evidenceSubmission.submissionDate = new Date();
          evidenceSubmission.gpsLocation = "web";
          evidenceSubmission.isValid = true;
          evidenceSubmission.endTime = new Date();

          let evidenceSubmissionAnswerArray = {};


          Object.entries(submissionDocument.parentInterviewResponses).forEach(parentInterviewResponse => {
            if (parentInterviewResponse[1].status === "completed") {
              Object.entries(parentInterviewResponse[1].answers).forEach(answer => {
                if (evidenceSubmissionAnswerArray[answer[0]]) {
                  let tempValue = {};
                  answer[1].value.forEach(individualValue => {
                    tempValue[Object.values(individualValue)[0].qid] = Object.values(individualValue)[0];
                  })
                  evidenceSubmissionAnswerArray[answer[0]].value.push(tempValue)
                  if (answer[1].payload && answer[1].payload.labels && answer[1].payload.labels.length > 0) {
                    answer[1].payload.labels[0].forEach(instanceResponsePayload => {
                      evidenceSubmissionAnswerArray[answer[0]].payload.labels[0].push(instanceResponsePayload);
                    })
                  }
                  evidenceSubmissionAnswerArray[answer[0]].countOfInstances = evidenceSubmissionAnswerArray[answer[0]].value.length;
                } else {
                  evidenceSubmissionAnswerArray[answer[0]] = _.omit(answer[1], "value");
                  evidenceSubmissionAnswerArray[answer[0]].value = new Array;
                  let tempValue = {}
                  answer[1].value.forEach(individualValue => {
                    tempValue[Object.values(individualValue)[0].qid] = Object.values(individualValue)[0];
                  })
                  evidenceSubmissionAnswerArray[answer[0]].value.push(tempValue);
                }
              })
            }
          });

          evidenceSubmission.answers = evidenceSubmissionAnswerArray;

          if (Object.keys(evidenceSubmission.answers).length > 0) {
            runUpdateQuery = true;
          }

          let answerArray = {};
          Object.entries(evidenceSubmission.answers).forEach(answer => {
            if (answer[1].responseType === "matrix") {

              for (let countOfInstances = 0; countOfInstances < answer[1].value.length; countOfInstances++) {

                _.valuesIn(answer[1].value[countOfInstances]).forEach(question => {

                  if (answerArray[question.qid]) {
                    answerArray[question.qid].instanceResponses.push(question.value);
                    answerArray[question.qid].instanceRemarks.push(question.remarks);
                    answerArray[question.qid].instanceFileName.push(question.fileName);
                  } else {
                    let clonedQuestion = { ...question };
                    clonedQuestion.instanceResponses = new Array;
                    clonedQuestion.instanceRemarks = new Array;
                    clonedQuestion.instanceFileName = new Array;
                    clonedQuestion.instanceResponses.push(question.value);
                    clonedQuestion.instanceRemarks.push(question.remarks);
                    clonedQuestion.instanceFileName.push(question.fileName);
                    delete clonedQuestion.value;
                    delete clonedQuestion.remarks;
                    delete clonedQuestion.fileName;
                    delete clonedQuestion.payload;
                    answerArray[question.qid] = clonedQuestion;
                  }

                })
              }
              answer[1].countOfInstances = answer[1].value.length;
            }
            answerArray[answer[0]] = answer[1];
          });

          evidencesStatusToBeChanged['isSubmitted'] = true;
          evidencesStatusToBeChanged['notApplicable'] = false;
          evidencesStatusToBeChanged['startTime'] = "";
          evidencesStatusToBeChanged['endTime'] = new Date;
          evidencesStatusToBeChanged['hasConflicts'] = false;
          evidencesStatusToBeChanged['submissions'].push(_.omit(evidenceSubmission, "answers"));

          updateObject.$push = {
            ["evidences." + parentInterviewEvidenceMethod + ".submissions"]: evidenceSubmission
          };
          updateObject.$set = {
            answers: _.assignIn(submissionDocument.answers, answerArray),
            ["evidences." + parentInterviewEvidenceMethod + ".isSubmitted"]: true,
            ["evidences." + parentInterviewEvidenceMethod + ".notApplicable"]: false,
            ["evidences." + parentInterviewEvidenceMethod + ".startTime"]: "",
            ["evidences." + parentInterviewEvidenceMethod + ".endTime"]: new Date,
            ["evidences." + parentInterviewEvidenceMethod + ".hasConflicts"]: false,
            evidencesStatus: submissionDocument.evidencesStatus,
            status: (submissionDocument.status === "started") ? "inprogress" : submissionDocument.status
          };


        } else {


          updateEntityObject.$set = {
            "metaInformation.isParentInterviewCompleted": true
          };

          entityUpdatedDocument = await database.models.entities.findOneAndUpdate(
            entityQueryObject,
            updateEntityObject,
            {}
          );



          //isParentInterviewCompleted

          let response = {
            message: messageConstants.apiResponses.ALREADY_COMPLETED
          };

          return resolve(response);
        }

        if (runUpdateQuery) {
          let updatedSubmissionDocument = await database.models.submissions.findOneAndUpdate(
            queryObject,
            updateObject,
            queryOptions
          );

          let canRatingsBeEnabled = await submissionsHelper.canEnableRatingQuestionsOfSubmission(updatedSubmissionDocument);
          let { ratingsEnabled } = canRatingsBeEnabled;

          if (ratingsEnabled) {
            let updateStatusObject = {};
            updateStatusObject.$set = {};
            updateStatusObject.$set = {
              status: "completed",
              completedDate: new Date()
            };
            updatedSubmissionDocument = await database.models.submissions.findOneAndUpdate(
              queryObject,
              updateStatusObject,
              queryOptions
            );
          }

          updateEntityObject.$set = {
            "metaInformation.isParentInterviewCompleted": true
          };

          entityUpdatedDocument = await database.models.entities.findOneAndUpdate(
            entityQueryObject,
            updateEntityObject,
            {}
          );


          let response = {
            message: message
          };

          return resolve(response);

        } else {

          let response = {
            message: messageConstants.apiResponses.PARENT_INTERVIEW_FAILED
          };

          return resolve(response);
        }

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
  * @api {post} /assessment/api/v1/submissions/generalQuestions/:submissionId General Question Submission
  * @apiVersion 1.0.0
  * @apiName General Question Submission
  * @apiSampleRequest /assessment/api/v1/submissions/generalQuestions/5c5147ae95743c5718445eff
  * @apiGroup Submissions
  * @apiParam {String} submissionId Submission ID.
  * @apiUse successBody
  * @apiUse errorBody
  */
 
  /**
   * General Questions.
   * @method
   * @name generalQuestions
   * @param {Object} req -request data.
   * @param {String} req.params._id -Submission id.
   * @returns {JSON} General questions response message.
   */

  async generalQuestions(req) {
    return new Promise(async (resolve, reject) => {

      try {

        req.body = req.body || {};
        let message = messageConstants.apiResponses.GENERAL_QUESTION_SUBMITTED;
        let runUpdateQuery = false;

        let queryObject = {
          _id: ObjectId(req.params._id)
        };

        let queryOptions = {
          new: true
        };

        let submissionDocument = await database.models.submissions.findOne(
          queryObject
        );

        let updateObject = {};
        updateObject.$set = {};

        if (req.body.answers) {
          let gpsLocation = req.headers.gpslocation;
          let submittedBy = req.userDetails.userId;
          let submissionDate = new Date();

          Object.entries(req.body.answers).forEach(answer => {
            if (answer[1].isAGeneralQuestion == true && answer[1].responseType === "matrix" && answer[1].evidenceMethod != "") {
              runUpdateQuery = true;
              answer[1].gpslocation = gpsLocation;
              answer[1].submittedBy = submittedBy;
              answer[1].submissionDate = submissionDate;
              if (submissionDocument.generalQuestions && submissionDocument.generalQuestions[answer[0]]) {
                submissionDocument.generalQuestions[answer[0]].submissions.push(answer[1]);
              } else {
                submissionDocument.generalQuestions = {
                  [answer[0]]: {
                    submissions: [answer[1]]
                  }
                };
              }
              if (submissionDocument.evidences[answer[1].evidenceMethod].isSubmitted === true) {
                submissionDocument.evidences[answer[1].evidenceMethod].submissions.forEach((evidenceMethodSubmission, indexOfEvidenceMethodSubmission) => {
                  if (evidenceMethodSubmission.answers[answer[0]] && evidenceMethodSubmission.answers[answer[0]].notApplicable != true) {
                    answer[1].value.forEach(incomingGeneralQuestionInstance => {
                      incomingGeneralQuestionInstance.isAGeneralQuestionResponse = true;
                      evidenceMethodSubmission.answers[answer[0]].value.push(incomingGeneralQuestionInstance);
                    })
                    answer[1].payload.labels[0].forEach(incomingGeneralQuestionInstancePayload => {
                      evidenceMethodSubmission.answers[answer[0]].payload.labels[0].push(incomingGeneralQuestionInstancePayload);
                    })
                    evidenceMethodSubmission.answers[answer[0]].countOfInstances = evidenceMethodSubmission.answers[answer[0]].value.length;
                  }
                  if (evidenceMethodSubmission.isValid === true) {

                    for (let countOfInstances = 0; countOfInstances < answer[1].value.length; countOfInstances++) {

                      _.valuesIn(answer[1].value[countOfInstances]).forEach(question => {

                        if (submissionDocument.answers[question.qid]) {
                          submissionDocument.answers[question.qid].instanceResponses.push(question.value);
                          submissionDocument.answers[question.qid].instanceRemarks.push(question.remarks);
                          submissionDocument.answers[question.qid].instanceFileName.push(question.fileName);
                        } else {
                          let clonedQuestion = { ...question };
                          clonedQuestion.instanceResponses = new Array;
                          clonedQuestion.instanceRemarks = new Array;
                          clonedQuestion.instanceFileName = new Array;
                          clonedQuestion.instanceResponses.push(question.value);
                          clonedQuestion.instanceRemarks.push(question.remarks);
                          clonedQuestion.instanceFileName.push(question.fileName);
                          delete clonedQuestion.value;
                          delete clonedQuestion.remarks;
                          delete clonedQuestion.fileName;
                          delete clonedQuestion.payload;
                          submissionDocument.answers[question.qid] = clonedQuestion;
                        }

                      })
                    }
                  }

                })
              }

            }
          });

          updateObject.$set.generalQuestions = submissionDocument.generalQuestions;
          updateObject.$set.evidences = submissionDocument.evidences;
          updateObject.$set.answers = submissionDocument.answers;

        }

        if (runUpdateQuery) {
          let updatedSubmissionDocument = await database.models.submissions.findOneAndUpdate(
            queryObject,
            updateObject,
            queryOptions
          );

          let response = {
            message: message
          };

          return resolve(response);

        } else {

          let response = {
            message: messageConstants.apiResponses.GENERAL_QUESTION_FAILED
          };

          return resolve(response);
        }

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
  * @api {post} /assessment/api/v1/submissions/parentInterview/:submissionId Compete Parent Interview
  * @apiVersion 1.0.0
  * @apiName Compete Parent Interview
  * @apiSampleRequest /assessment/api/v1/submissions/parentInterview/5c5147ae95743c5718445eff
  * @apiGroup Submissions
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * General Questions.
   * @method
   * @name parentInterview
   * @param {Object} req -request data.
   * @param {String} req.params._id - Submission id.
   * @returns {JSON} Parent interview response message.
   */

  async parentInterview(req) {

    return new Promise(async (resolve, reject) => {

      try {

        req.body = req.body || {};
        let message = messageConstants.apiResponses.PARENT_INTERVIEW_SUBMITTED;

        let queryObject = {
          _id: ObjectId(req.params._id)
        };

        let queryOptions = {
          new: true
        };

        let submissionDocument = await database.models.submissions.findOne(
          queryObject
        );

        if (req.body.parentId && req.body.status && submissionDocument) {

          let parentInformation = await database.models.entities.findOne(
            { _id: ObjectId(req.body.parentId) },
            { metaInformation: 1 }
          ).lean();

          if (parentInformation) {
            let parentInterview = {};
            parentInterview.parentInformation = parentInformation.metaInformation;
            parentInterview.status = req.body.status;
            parentInterview.answers = req.body.answers;
            if (req.body.status == "completed") {
              parentInterview.completedAt = new Date();
              parentInterview.startedAt = (!submissionDocument.parentInterviewResponses || !submissionDocument.parentInterviewResponses[req.body.parentId] || !submissionDocument.parentInterviewResponses[req.body.parentId].startedAt) ? new Date() : submissionDocument.parentInterviewResponses[req.body.parentId].startedAt;
            } else if (req.body.status == "started") {
              parentInterview.startedAt = (submissionDocument.parentInterviewResponses && submissionDocument.parentInterviewResponses[req.body.parentId] && submissionDocument.parentInterviewResponses[req.body.parentId].startedAt) ? submissionDocument.parentInterviewResponses[req.body.parentId].startedAt : new Date();
            }
            if (submissionDocument.parentInterviewResponses) {
              submissionDocument.parentInterviewResponses[req.body.parentId] = _.merge(submissionDocument.parentInterviewResponses[req.body.parentId], parentInterview);
            } else {
              submissionDocument.parentInterviewResponses = {};
              submissionDocument.parentInterviewResponses[req.body.parentId] = parentInterview;
            }

            let parentInterviewResponseStatus = _.omit(submissionDocument.parentInterviewResponses[req.body.parentId], ["parentInformation", "answers"]);
            parentInterviewResponseStatus.parentId = parentInformation._id;
            parentInterviewResponseStatus.parentType = parentInterview.parentInformation.type;

            if (submissionDocument.parentInterviewResponsesStatus) {
              let parentInterviewReponseStatusElementIndex = submissionDocument.parentInterviewResponsesStatus.findIndex(parentInterviewStatus => parentInterviewStatus.parentId.toString() === parentInterviewResponseStatus.parentId.toString());
              if (parentInterviewReponseStatusElementIndex >= 0) {
                submissionDocument.parentInterviewResponsesStatus[parentInterviewReponseStatusElementIndex] = parentInterviewResponseStatus;
              } else {
                submissionDocument.parentInterviewResponsesStatus.push(parentInterviewResponseStatus);
              }
            } else {
              submissionDocument.parentInterviewResponsesStatus = new Array;
              submissionDocument.parentInterviewResponsesStatus.push(parentInterviewResponseStatus);
            }

            let updateObject = {};
            updateObject.$set = {};
            updateObject.$set.parentInterviewResponses = {};
            updateObject.$set.parentInterviewResponses = submissionDocument.parentInterviewResponses;
            updateObject.$set.parentInterviewResponsesStatus = submissionDocument.parentInterviewResponsesStatus;

            let updatedSubmissionDocument = await database.models.submissions.findOneAndUpdate(
              { _id: ObjectId(submissionDocument._id) },
              updateObject,
              queryOptions
            );

          } else {
            throw messageConstants.apiResponses.PARENT_INFORMATION_NOT_FOUND;
          }

        } else {
          throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;
        }


        let response = {
          message: message
        };

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
  * @api {get} /assessment/api/v1/submissions/getParentInterviewResponse/:submissionId Get Parent Interview Response
  * @apiVersion 1.0.0
  * @apiName Get Parent Interview Response
  * @apiGroup Submissions
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Parent interview response.
   * @method
   * @name getParentInterviewResponse
   * @param {Object} req -request data.
   * @param {String} req.params._id - Submission id.
   * @returns {JSON} Parent interview response message.
   */

  async getParentInterviewResponse(req) {
    return new Promise(async (resolve, reject) => {

      try {

        req.body = req.body || {};
        let message = messageConstants.apiResponses.PARENT_INTERVIEW_FETCHED;
        let result = {};

        let queryObject = {
          _id: ObjectId(req.params._id)
        };

        let queryOptions = {
          new: true
        };

        let submissionDocument = await database.models.submissions.findOne(
          queryObject
        );

        if (req.query.parentId && submissionDocument) {

          let parentInformation = await database.models.entities.findOne(
            { _id: ObjectId(req.query.parentId) },
            { metaInformation: 1 }
          );

          if (parentInformation) {
            result.parentInformation = parentInformation.metaInformation;
            result.parentId = req.query.parentId;
          }

          if ((submissionDocument.parentInterviewResponses) && submissionDocument.parentInterviewResponses[req.query.parentId]) {
            result.status = submissionDocument.parentInterviewResponses[req.query.parentId].status;
            result.answers = submissionDocument.parentInterviewResponses[req.query.parentId].answers;
          }
          else {
            let noSubmissionResponse = {
              result: [],
              message: messageConstants.apiResponses.SUBMISSION_NOT_FOUND +"for parent interview"
            };

            return resolve(noSubmissionResponse);

          }

        } else {

          let noSubmissionResponse = {
            result: [],
            message: messageConstants.apiResponses.SUBMISSION_NOT_FOUND
          };

          return resolve(noSubmissionResponse);
        }


        let response = {
          result: result,
          message: message
        };

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
  * @api {get} /assessment/api/v1/submissions/rate/:entityExternalId?programId=:programExternalId&solutionId=:solutionExternalId&submissionNumber=:submissionInstanceNumber Rate an Entity
  * @apiVersion 1.0.0
  * @apiName Rate an Entity
  * @apiGroup Submissions
  * @apiParam {String} programId Program External ID.
  * @apiParam {String} solutionId Solution External ID.
  * @apiSampleRequest /assessment/api/v1/submissions/rate/1002036?programId=PROGID01&solutionId=EF-DCPCR-2018-001&submissionNumber=1
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Rate entity.
   * @method
   * @name rate
   * @param {Object} req -request data.
   * @param {String} req.params._id - entity external id.
   * @param {String} req.query.solutionId - solution external id.
   * @param {String} req.query.programId - program external id.
   * @param {String} req.query.submissionNumber - submission number.
   * @returns {JSON} consists of criteria name,expressionVariablesDefined,
   * expressionVariables,score,expressionResult,submissionAnswers,criteriaExternalId
   */

  async rate(req) {
    return new Promise(async (resolve, reject) => {

      try {

        req.body = req.body || {};
        let message = messageConstants.apiResponses.CRITERIA_RATING;

        let programId = req.query.programId;
        let solutionId = req.query.solutionId;
        let entityId = req.params._id;

        if (!programId) {
          throw messageConstants.apiResponses.PROGRAM_NOT_FOUND;
        }

        if (!solutionId) {
          throw messageConstants.apiResponses.SOLUTION_NOT_FOUND;
        }

        if (!entityId) {
          throw messageConstants.apiResponses.ENTITY_NOT_FOUND;
        }


        let solutionDocument = await database.models.solutions.findOne({
          externalId: solutionId,
        }, { themes: 1, levelToScoreMapping: 1, scoringSystem : 1, flattenedThemes : 1 }).lean()

        if (!solutionDocument) {
          return resolve({
            status: httpStatusCode.bad_request.status,
            message: messageConstants.apiResponses.SOLUTION_NOT_FOUND
          });
        }

        let submissionNumber = req.query.submissionNumber ? parseInt(req.query.submissionNumber) : 1;

        let queryObject = {
          "entityExternalId": entityId,
          "programExternalId": programId,
          "solutionExternalId": solutionId,
          "submissionNumber" : submissionNumber
        }

        let submissionDocument = await database.models.submissions.findOne(
          queryObject,
          { "answers": 1, "criteria": 1, "evidencesStatus": 1, "entityInformation": 1, "entityProfile": 1, "programExternalId": 1 }
        ).lean();

        if (!submissionDocument._id) {
          throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;
        }

        if(solutionDocument.scoringSystem == "pointsBasedScoring") {

          submissionDocument.scoringSystem = "pointsBasedScoring";

          let allCriteriaInSolution = new Array;
          let allQuestionIdInSolution = new Array;
          let solutionQuestions = new Array;

          allCriteriaInSolution = gen.utils.getCriteriaIds(solutionDocument.themes);

          if(allCriteriaInSolution.length > 0) {
            
            submissionDocument.themes = solutionDocument.flattenedThemes;

            let allCriteriaDocument = await criteriaHelper.criteriaDocument({
              _id : {
                $in : allCriteriaInSolution
              }
            }, [
              "evidences"
            ]);

            allQuestionIdInSolution = gen.utils.getAllQuestionId(allCriteriaDocument);
          }

          if(allQuestionIdInSolution.length > 0) {

            solutionQuestions = await questionsHelper.questionDocument({
              _id : {
                $in : allQuestionIdInSolution
              },
              responseType : {
                $in : [
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

          if(solutionQuestions.length > 0) {
            submissionDocument.questionDocuments = {};
            solutionQuestions.forEach(question => {
              submissionDocument.questionDocuments[question._id.toString()] = {
                _id : question._id,
                weightage : question.weightage
              };
              let questionMaxScore = 0;
              if(question.options && question.options.length > 0) {
                if(question.responseType != "multiselect") {
                  questionMaxScore = _.maxBy(question.options, 'score').score;
                }
                question.options.forEach(option => {
                  if(question.responseType == "multiselect") {
                    questionMaxScore += option.score;
                  }

                  if("score" in option) {
                    option.score >= 0 ? submissionDocument.questionDocuments[question._id.toString()][`${option.value}-score`] = option.score : "";
                  }
                })
              }
              if(question.sliderOptions && question.sliderOptions.length > 0) {
                  questionMaxScore = _.maxBy(question.sliderOptions, 'score').score;
                  submissionDocument.questionDocuments[question._id.toString()].sliderOptions = question.sliderOptions;
              }
              submissionDocument.questionDocuments[question._id.toString()].maxScore =  (typeof questionMaxScore === "number") ? questionMaxScore : 0;
            })
          }

        }

        let resultingArray = await scoringHelper.rateEntities([submissionDocument], "singleRateApi");
        if(resultingArray.result.runUpdateQuery) {
          await submissionsHelper.markCompleteAndPushForReporting(submissionDocument._id)
        }
        return resolve(resultingArray);

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error,
          errorObject: error
        });
      }

    })
  }

  /**
  * @api {get} /assessment/api/v1/submissions/multiRate?entityId=:entityId1,:entityId2&programId=:programExternalId&solutionId=:solutionExternalId&submissionNumber=:submissionInstanceNumber Rate Multiple Entities
  * @apiVersion 1.0.0
  * @apiName Rate Multiple Entities
  * @apiGroup Submissions
  * @apiParam {String} programId Program External ID.
  * @apiParam {String} solutionId Solution External ID.
  * @apiParam {String} entityId Entity ID.
  * @apiSampleRequest /assessment/api/v1/submissions/multiRate?entityId=1556397,1310274&programId=PROGID01&solutionId=EF-DCPCR-2018-001&submissionNumber=all
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Rate multiple entity.
   * @method
   * @name multiRate
   * @param {Object} req -request data.
   * @param {Array} req.params.entityId - entity external ids.
   * @param {String} req.query.solutionId - solution external id.
   * @param {String} req.query.programId - program external id.
   * @param {String} req.query.submissionNumber - submission number.
   * @returns {JSON} consists of criteria name,expressionVariablesDefined,
   * expressionVariables,score,expressionResult,submissionAnswers,criteriaExternalId
   */

  async multiRate(req) {
    return new Promise(async (resolve, reject) => {

      try {

        req.body = req.body || {};
        let message = messageConstants.apiResponses.CRITERIA_RATING;

        let programId = req.query.programId;
        let solutionId = req.query.solutionId;
        let entityId = req.query.entityId.split(",");
        let submissionNumber = 
        req.query.submissionNumber ? 
        req.query.submissionNumber : 
        "all";

        if (!programId) {
          throw messageConstants.apiResponses.PROGRAM_NOT_FOUND;
        }

        if (!solutionId) {
          throw messageConstants.apiResponses.SOLUTION_NOT_FOUND;
        }

        if (!req.query.entityId || !(req.query.entityId.length >= 1)) {
          throw messageConstants.apiResponses.ENTITY_NOT_FOUND;
        }

        let solutionDocument = await database.models.solutions.findOne({
          externalId: solutionId,
        }, { themes: 1, levelToScoreMapping: 1, scoringSystem : 1, flattenedThemes : 1 }).lean();

        if (!solutionDocument) {
          return resolve({
            status: httpStatusCode.bad_request.status,
            message: messageConstants.apiResponses.SOLUTION_NOT_FOUND
          });
        }

        let queryObject = {
          "entityExternalId": { $in: entityId },
          "programExternalId": programId,
          "solutionExternalId": solutionId
        };

        if(submissionNumber != "all" && parseInt(submissionNumber)) {
          queryObject["submissionNumber"] = parseInt(submissionNumber);
        }

        let submissionDocuments = await database.models.submissions.find(
          queryObject,
          { answers: 1, criteria: 1, evidencesStatus: 1, entityProfile: 1, entityInformation: 1, "programExternalId": 1, entityExternalId: 1 }
        ).lean();

        if (!submissionDocuments) {
          throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;
        }

        let commonSolutionDocumentParameters = {};

        if(solutionDocument.scoringSystem == "pointsBasedScoring") {

          commonSolutionDocumentParameters.scoringSystem = "pointsBasedScoring";

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

          if(allQuestionIdInSolution.length > 0) {

            solutionQuestions = await questionsHelper.questionDocument({
              _id : {
                $in : allQuestionIdInSolution
              },
              responseType : {
                $in : [
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

          if(solutionQuestions.length > 0) {
            commonSolutionDocumentParameters.questionDocuments = {};
            solutionQuestions.forEach(question => {
              commonSolutionDocumentParameters.questionDocuments[question._id.toString()] = {
                _id : question._id,
                weightage : question.weightage
              };
              let questionMaxScore = 0;
              if(question.options && question.options.length > 0) {
                if(question.responseType != "multiselect") {
                  questionMaxScore = _.maxBy(question.options, 'score').score;
                }
                question.options.forEach(option => {
                  if(question.responseType == "multiselect") {
                    questionMaxScore += option.score;
                  }

                  if("score" in option) {
                    option.score >= 0 ? 
                    commonSolutionDocumentParameters.questionDocuments[question._id.toString()][`${option.value}-score`] = option.score
                    : "";
                  }
                })
              }
              if(question.sliderOptions && question.sliderOptions.length > 0) {
                questionMaxScore = _.maxBy(question.sliderOptions, 'score').score;
                commonSolutionDocumentParameters.questionDocuments[question._id.toString()].sliderOptions = question.sliderOptions;
              }
              commonSolutionDocumentParameters.questionDocuments[question._id.toString()].maxScore =  (typeof questionMaxScore === "number") ? questionMaxScore : 0;
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
            await submissionsHelper.markCompleteAndPushForReporting(submission.submissionId)
          }
        }

        return resolve({ result: resultingArray });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error,
          errorObject: error
        });
      }

    })
  }

  /**
   * Dummy rate entity.
   * @method
   * @name dummyRate
   * @param {Object} req -request data.
   * @param {String} req.params._id - entity external id.
   * @returns {JSON}
   */

  async dummyRate(req) {
    return new Promise(async (resolve, reject) => {

      try {

        req.body = req.body || {};
        let message = messageConstants.apiResponses.DUMMY_RATE;

        let queryObject = {
          "entityExternalId": req.params._id
        };

        let submissionDocument = await database.models.submissions.findOne(
          queryObject,
          { criteria: 1 }
        ).lean();

        if (!submissionDocument._id) {
          throw customElements.SUBMISSION_NOT_FOUND;
        }

        let result = {};
        result.runUpdateQuery = true;
        let rubricLevels = ["L1", "L2", "L3", "L4"];

        if (true) {
          let criteriaData = await Promise.all(submissionDocument.criteria.map(async (criteria) => {

            if (!criteria.score || criteria.score != "" || criteria.score == "No Level Matched" || criteria.score == "NA") {
              criteria.score = rubricLevels[Math.floor(Math.random() * rubricLevels.length)];
            }

            return criteria;

          }));

          if (criteriaData.findIndex(criteria => criteria === undefined) >= 0) {
            result.runUpdateQuery = false;
          }

          if (result.runUpdateQuery) {
            let updateObject = {};

            updateObject.$set = {
              criteria: criteriaData,
              ratingCompletedAt: new Date()
            };

            let updatedSubmissionDocument = await database.models.submissions.findOneAndUpdate(
              queryObject,
              updateObject
            );

            let insightsController = new insightsBaseController;
            insightsController.generate(updatedSubmissionDocument._id);

          }

          let response = {
            message: message,
            result: result
          };


          return resolve(response);

        }

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error,
          errorObject: error
        });
      }

    })
  }

  /**
  * @api {get} /assessment/api/v1/submissions/isAllowed/:submissionId?evidenceId=:ecm Fetch submissions
  * @apiVersion 1.0.0
  * @apiName Fetch submissions
  * @apiGroup Submissions
  * @apiParam {String} evidenceId Evidence ID.
  * @apiSampleRequest /assessment/api/v1/submissions/isAllowed/5d31651fdc83304d4cfdac0c?evidenceId=BL
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * "result": {
    "allowed": true
   }
  */


  /**
   * Check whether the submissions is allowed for the particular ecm.
   * @method
   * @name isAllowed
   * @param {Object} req -request data.
   * @param {String} req.params._id - submission id.
   * @param {String} req.query.evidenceId - evidenceId. 
   * @returns {JSON} consists of allowed having true or false value.
   * If the evidence method is submitted and is submitted by the same logged in user
   * then he is not allowed to submit again.
   */

  async isAllowed(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = {
          allowed: true
        };
        req.body = req.body || {};
        let message = messageConstants.apiResponses.SUBMISSION_CHECK;

        let queryObject = {
          "_id": req.params._id,
          "evidencesStatus": {"$elemMatch": {externalId: req.query.evidenceId}}
        };

        let submissionDocument = await database.models.submissions.findOne(
          queryObject,
          {
            "evidencesStatus.$" : 1
          }
        );

        if (!submissionDocument || !submissionDocument._id) {
          throw new Error(messageConstants.apiResponses.SUBMISSION_NOT_FOUND);
        } else {
          if (submissionDocument.evidencesStatus[0].isSubmitted && submissionDocument.evidencesStatus[0].isSubmitted == true) {
            submissionDocument.evidencesStatus[0].submissions.forEach(submission => {
              if (submission.submittedBy == req.userDetails.userId) {
                result.allowed = false;
              }
            })
          }
        }

        let response = {
          message: message,
          result: result
        };

        return resolve(response);

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error,
          errorObject: error
        });
      }

    })
  }

  // Commented out the rating flow
  // async fetchRatingQuestions(req) {
  //   return new Promise(async (resolve, reject) => {
  //     req.body = req.body || {};

  //     let result = {}
  //     let responseMessage

  //     let queryObject = {
  //       _id: ObjectId(req.params._id)
  //     }

  //     let submissionDocument = await database.models.submissions.findOne(
  //       queryObject
  //     );

  //     if(submissionDocument.ratingOfManualCriteriaEnabled === true) {

  //       result._id = submissionDocument._id
  //       result.status = submissionDocument.status

  //       let {isEditable, criterias} = await this.extractCriteriaQuestionsOfSubmission(submissionDocument, req.userDetails.allRoles)
  //       result.isEditable = isEditable
  //       result.criterias = criterias
  //       result.allManualCriteriaRatingSubmitted = (submissionDocument.allManualCriteriaRatingSubmitted) ? submissionDocument.allManualCriteriaRatingSubmitted : false
  //       responseMessage = "Rating questions fetched successfully."

  //     } else {
  //       responseMessage = "Rating questions not yet enabled for this submission."
  //     }

  //     let response = { message: responseMessage, result: result };
  //     return resolve(response);

  //   }).catch(error => {
  //     reject(error);
  //   });
  // }

  // Commented out the rating flow
  // async submitRatingQuestions(req) {
  //   return new Promise(async (resolve, reject) => {
  //     req.body = req.body || {};
  //     let responseMessage = "Rating questions submission completed successfully"
  //     let runUpdateQuery = false

  //     let queryObject = {
  //       _id: ObjectId(req.params._id)
  //     }

  //     let submissionDocument = await database.models.submissions.findOne(
  //       queryObject
  //     );

  //     let updateObject = {}
  //     let result = {}

  //     if(req.body.ratings) {
  //       if(submissionDocument.ratingOfManualCriteriaEnabled === true && submissionDocument.allManualCriteriaRatingSubmitted != true) {
  //         runUpdateQuery = true
  //         Object.entries(req.body.ratings).forEach(rating => {
  //           let criteriaElm = _.find(submissionDocument.criterias, {_id:ObjectId(rating[1].criteriaId)});
  //           criteriaElm.score = rating[1].score
  //           criteriaElm.remarks = rating[1].remarks
  //           criteriaElm.ratingSubmittedBy = req.userDetails.userId
  //           criteriaElm.ratingSubmissionDate = new Date()
  //           criteriaElm.ratingSubmissionGpsLocation = req.headers.gpslocation
  //         });
  //         updateObject.$set = { 
  //           criterias : submissionDocument.criterias,
  //           allManualCriteriaRatingSubmitted: true
  //         }
  //       } else {
  //         responseMessage = "Cannot submit ratings for this submission."
  //       }
  //     } else {
  //       responseMessage = "Invalid request"
  //     }

  //     if(runUpdateQuery) {

  //       result = await database.models.submissions.findOneAndUpdate(
  //         queryObject,
  //         updateObject
  //       );

  //       let response = {
  //         message: responseMessage
  //       };

  //       return resolve(response);

  //     } else {

  //       let response = {
  //         message: responseMessage
  //       };

  //       return resolve(response);
  //     }


  //   }).catch(error => {
  //     reject(error);
  //   });
  // }


  // Commented out the rating flow
  // async fetchCriteriaRatings(req) {
  //   return new Promise(async (resolve, reject) => {
  //     req.body = req.body || {};
  //     let result = {}
  //     let responseMessage = ""

  //     let queryObject = {
  //       _id: ObjectId(req.params._id)
  //     }

  //     let submissionDocument = await database.models.submissions.findOne(
  //       queryObject
  //     );

  //     if(submissionDocument.allManualCriteriaRatingSubmitted === true) {
  //       let criteriaResponses = {}
  //       submissionDocument.criterias.forEach(criteria => {
  //         if (criteria.criteriaType === 'manual') {
  //           criteriaResponses[criteria._id] = _.pick(criteria, ['_id', 'name', 'externalId', 'description', 'score', 'remarks', 'flag'])

  //           if(criteria.flagRaised && criteria.flagRaised[req.userDetails.userId]) {
  //             criteriaResponses[criteria._id].flagRaised = _.pick(criteria.flagRaised[req.userDetails.userId], ['value', 'remarks', 'submissionDate'])
  //           }

  //         }
  //       })

  //       result._id = submissionDocument._id
  //       result.status = submissionDocument.status
  //       result.isEditable = (_.includes(req.userDetails.allRoles,"ASSESSOR")) ? true : false
  //       result.criterias = _.values(criteriaResponses)
  //       responseMessage = "Criteria ratings fetched successfully."
  //     } else {
  //       responseMessage = "No Criteria ratings found for this assessment."
  //     }

  //     let response = {
  //       message: responseMessage,
  //       result: result
  //     };
  //     return resolve(response);
  //   }).catch(error => {
  //     reject(error);
  //   });
  // }


  // Commented out the rating flow
  // async flagCriteriaRatings(req) {
  //   return new Promise(async (resolve, reject) => {
  //     req.body = req.body || {};
  //     let responseMessage
  //     let runUpdateQuery = false

  //     let queryObject = {
  //       _id: ObjectId(req.params._id)
  //     }

  //     let submissionDocument = await database.models.submissions.findOne(
  //       queryObject
  //     );

  //     let updateObject = {}
  //     let result = {}

  //     if(req.body.flag) {
  //       if(submissionDocument.allManualCriteriaRatingSubmitted === true) {
  //         Object.entries(req.body.flag).forEach(flag => {
  //           let criteriaElm = _.find(submissionDocument.criterias, {_id:ObjectId(flag[1].criteriaId)});

  //           flag[1].userId = req.userDetails.userId
  //           flag[1].submissionDate = new Date()
  //           flag[1].submissionGpsLocation = req.headers.gpslocation

  //           if(criteriaElm.flagRaised && criteriaElm.flagRaised[req.userDetails.userId]) {
  //             responseMessage = "You cannot update an already flagged criteria."
  //           } else if(criteriaElm.flagRaised) {
  //             runUpdateQuery = true
  //             criteriaElm.flagRaised[req.userDetails.userId] = flag[1]
  //           } else {
  //             runUpdateQuery = true
  //             criteriaElm.flagRaised = {}
  //             criteriaElm.flagRaised[req.userDetails.userId] = flag[1]
  //           }

  //         });
  //         updateObject.$set = { criterias : submissionDocument.criterias }
  //       } else {
  //         responseMessage = "Cannot flag ratings for this assessment."
  //       }
  //     } else {
  //       responseMessage = "Invalid request"
  //     }

  //     if(runUpdateQuery) {
  //       result = await database.models.submissions.findOneAndUpdate(
  //         queryObject,
  //         updateObject
  //       );

  //       responseMessage = "Criterias flagged successfully."

  //     }

  //     let response = {
  //       message: responseMessage
  //     };

  //     return resolve(response);

  //   }).catch(error => {
  //     reject(error);
  //   });
  // }

  /**
   * @api {post} {{url}}/assessment/api/v1/submissions/feedback/:submissionId Submission feedback added
   * @apiVersion 1.0.0
   * @apiName Submission Feedback 
   * @apiGroup Submissions
   * @apiParamExample {json} Request-Body:
   * {
	 *    "feedback": {
	 *       "q1" : "",
	 *       "q2" : "",
	 *       "q3" : ""     
	 *    }
   *  }
   * @apiSampleRequest /assessment/api/v1/submissions/feedback/5d31651fdc83304d4cfdac0c
   * @apiUse successBody
   * @apiUse errorBody
   */

    /**
   * Add feedback in submissions.
   * @method
   * @name feedback
   * @param {Object} req -request data.
   * @param {String} req.params._id - submission id.
   * @returns {JSON} feedback response message. Atleast one evidence should be 
   * submitted to provide the feedback.
   */

  async feedback(req) {
    return new Promise(async (resolve, reject) => {
      req.body = req.body || {};
      let responseMessage;
      let runUpdateQuery = false;

      let queryObject = {
        _id: ObjectId(req.params._id)
      }

      let submissionDocument = await database.models.submissions.findOne(
        queryObject
      );

      let updateObject = {};

      if (req.body.feedback && submissionDocument.status != "started") {

        req.body.feedback.userId = req.userDetails.userId;
        req.body.feedback.submissionDate = new Date();
        req.body.feedback.submissionGpsLocation = req.headers.gpslocation;

        runUpdateQuery = true;

        updateObject.$push = {
          ["feedback"]: req.body.feedback
        };

      } else {
        responseMessage = messageConstants.apiResponses.FEEDBACK_ERROR;
      }

      if (runUpdateQuery) {
        let result = await database.models.submissions.findOneAndUpdate(
          queryObject,
          updateObject
        );

        responseMessage = messageConstants.apiResponses.FEEDBACK_SUBMITTED;

      }

      let response = {
        message: responseMessage
      };

      return resolve(response);

    }).catch(error => {
      reject(error);
    });
  }

  /**
  * @api {get} /assessment/api/v1/submissions/status/:submissionId Fetch submission status
  * @apiVersion 1.0.0
  * @apiName Fetch submission status
  * @apiGroup Submissions
  * @apiSampleRequest /assessment/api/v1/submissions/status/5c5147ae95743c5718445eff
  * @apiParam {String} submissionId Submission ID.
  * @apiUse successBody
  * @apiUse errorBody
  */

    /**
   * Submissions status.
   * @method
   * @name status
   * @param {Object} req -request data.
   * @param {String} req.params._id - submission id.
   * @returns {JSON} consists of - status,submission id and evidences.
   */

  async status(req) {
    return new Promise(async (resolve, reject) => {
      req.body = req.body || {};
      let result = {};

      let queryObject = {
        _id: ObjectId(req.params._id)
      };

      let submissionDocument = await database.models.submissions.findOne(
        queryObject
      );

      if (submissionDocument) {
        result._id = submissionDocument._id;
        result.status = submissionDocument.status;
        result.evidences = submissionDocument.evidences;
      }

      let response = { message: messageConstants.apiResponses.SUBMISSION_STATUS_FETCHED, result: result };

      return resolve(response);
    }).catch(error => {
      reject(error);
    });
  }

  /**
   * @api {get} {{url}}/assessment/api/v1/submissions/mergeEcmSubmissionToAnswer?solutionId=:solutionExternalId&entityId=:entityExternalId&ecm=:ecm Merging answer in Submissions 
   * @apiVersion 1.0.0
   * @apiName Merge Answers in submissions 
   * @apiGroup Submissions
   * @apiParam {String} solutionId Solution external Id.
   * @apiParam {String} entityId Entity external Id.
   * @apiParam {String} ecm Evidence collection method.
   * @apiSampleRequest /assessment/api/v1/submissions/mergeEcmSubmissionToAnswer?solutionId=EF-DCPCR-2018-001&entityId=1959076&ecm=BL
   * @apiUse successBody
   * @apiUse errorBody
   */

    /**
   * Merge Ecm submissions into answers.
   * @method
   * @name mergeEcmSubmissionToAnswer
   * @param {Object} req -request data.
   * @param {String} req.query.solutionId - solution id.
   * @param {String} req.query.entityId - entity id.
   * @param {String} req.query.ecm - ecm.   
   * @returns {JSON} ecmSubmissionToAnswer response message
   */

  async mergeEcmSubmissionToAnswer(req) {

    return new Promise(async (resolve, reject) => {

      try {

        if (!req.query.solutionId) {
          throw messageConstants.apiResponses.SOLUTION_ID_NOT_FOUND;
        }

        if (!req.query.entityId) {
          throw messageConstants.apiResponses.ENTITY_ID_NOT_FOUND;
        }

        if (!req.query.ecm) {
          throw messageConstants.apiResponses.ECM_REQUIRED;
        }

        let ecmMethod = "evidences." + req.query.ecm;

        let submissionDocuments = await database.models.submissions.findOne({
          solutionExternalId: req.query.solutionId,
          entityExternalId: req.query.entityId
        }, { answers: 1, [ecmMethod]: 1 }).lean();

        if (!submissionDocuments) {
          throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;
        }

        let ecmData = submissionDocuments.evidences[req.query.ecm];

        let messageData;

        if (ecmData.isSubmitted == true) {

          for (let pointerToSubmissions = 0; pointerToSubmissions < ecmData.submissions.length; pointerToSubmissions++) {

            let answerArray = {};

            let currentEcmSubmissions = ecmData.submissions[pointerToSubmissions];

            if (currentEcmSubmissions.isValid === true) {

              Object.entries(currentEcmSubmissions.answers).forEach(answer => {

                if (answer[1].responseType === "matrix" && answer[1].notApplicable != true) {

                  for (let countOfInstances = 0; countOfInstances < answer[1].value.length; countOfInstances++) {

                    answer[1].value[countOfInstances] && _.valuesIn(answer[1].value[countOfInstances]).forEach(question => {

                      if (question.qid && answerArray[question.qid]) {

                        answerArray[question.qid].instanceResponses && answerArray[question.qid].instanceResponses.push(question.value);
                        answerArray[question.qid].instanceRemarks && answerArray[question.qid].instanceRemarks.push(question.remarks);
                        answerArray[question.qid].instanceFileName && answerArray[question.qid].instanceFileName.push(question.fileName);

                      } else {
                        let clonedQuestion = { ...question };
                        clonedQuestion.instanceResponses = [];
                        clonedQuestion.instanceRemarks = [];
                        clonedQuestion.instanceFileName = [];
                        clonedQuestion.instanceResponses.push(question.value);
                        clonedQuestion.instanceRemarks.push(question.remarks);
                        clonedQuestion.instanceFileName.push(question.fileName);
                        delete clonedQuestion.value;
                        delete clonedQuestion.remarks;
                        delete clonedQuestion.fileName;
                        delete clonedQuestion.payload;
                        answerArray[question.qid] = clonedQuestion;
                      }

                    })
                  }
                  answer[1].countOfInstances = answer[1].value.length;
                }

                answerArray[answer[0]] = answer[1];
              });

              _.merge(submissionDocuments.answers, answerArray);

            }

          }

          await database.models.submissions.findOneAndUpdate(
            {
              _id: submissionDocuments._id
            },
            {
              $set: {
                answers: submissionDocuments.answers
              }
            }
          );

          messageData = messageConstants.apiResponses.ANSWER_MERGED;

        } else {
          messageData = messageConstants.apiResponses.INSUBMITTED_FALSE;
        }

        return resolve({
          message: messageData
        })

      } catch (error) {
        return reject({
          message: error
        })
      }
    })
  }


   /**
   * Submission status
   * @method
   * @name extractStatusOfSubmission
   * @param {Object} submissionDocument -Submission data. 
   * @returns {JSON} consists of - submission id,status and evidences.
   */

  extractStatusOfSubmission(submissionDocument) {

    let result = {};
    result._id = submissionDocument._id;
    result.status = submissionDocument.status;
    result.evidences = submissionDocument.evidences;

    return result;

  }

  // Commented out the rating flow
  // extractCriteriaQuestionsOfSubmission(submissionDocument, requestingUserRoles) {

  //   let result = {}
  //   let criteriaResponses = {}
  //   submissionDocument.criterias.forEach(criteria => {
  //     if (criteria.criteriaType === 'manual') {
  //       criteriaResponses[criteria._id] = _.pick(criteria, ['_id', 'name', 'externalId', 'description', 'score', 'rubric', 'remarks'])
  //       criteriaResponses[criteria._id].questions = []
  //     }
  //   })

  //   if(submissionDocument.answers) {
  //     Object.entries(submissionDocument.answers).forEach(answer => {
  //       if(criteriaResponses[answer[1].criteriaId] != undefined) {
  //         criteriaResponses[answer[1].criteriaId].questions.push(answer[1])
  //       }
  //     });
  //   }

  //   result.isEditable = (_.includes(requestingUserRoles,"ASSESSOR")) ? false : true
  //   result.criterias = _.values(criteriaResponses)

  //   return result;

  // }


  /**
  * @api {post} /assessment/api/v1/submissions/modifyByCsvUpload/ Update submission answers.
  * @apiVersion 1.0.0
  * @apiName Update submission answers.
  * @apiGroup Submissions
  * @apiParam {File} questions Mandatory questions file of type CSV.
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Modify submission value.
   * @method
   * @name modifyByCsvUpload
   * @param {Object} req -request data.
   * @param {Object} req.files.questions -submission update sheet.   
   * @returns {CSV} consists of - status of the modification of the submissions.
   * Once the modification is successfully done then previous value will be set to oldValue 
   * and modification value will become value. 
   */

  async modifyByCsvUpload(req) {

    return new Promise(async (resolve, reject) => {

      try {
        const submissionUpdateData = await csv().fromString(req.files.questions.data.toString());

        let questionCodeIds = [];

        submissionUpdateData.forEach(eachsubmissionUpdateData => {
          questionCodeIds.push(eachsubmissionUpdateData.questionCode);
        })

        let solutionData = await database.models.solutions.findOne({
          externalId: submissionUpdateData[0].solutionId
        }, { themes: 1 }).lean();

        let criteriaIds = gen.utils.getCriteriaIds(solutionData.themes);

        let allCriteriaDocument = await database.models.criteria.find({ _id: { $in: criteriaIds } }, { evidences: 1 }).lean();
        let questionIds = gen.utils.getAllQuestionId(allCriteriaDocument);

        let questionDocument = await database.models.questions.find({
          _id: { $in: questionIds },
          externalId: { $in: questionCodeIds }
        }, { _id: 1, externalId: 1, responseType: 1, options: 1 }).lean();

        let questionExternalId = {};
        questionDocument.forEach(eachQuestionData => {
          questionExternalId[eachQuestionData.externalId] = {
            id: eachQuestionData._id.toString(),
            responseType: eachQuestionData.responseType,
            options: eachQuestionData.options
          };
        })

        const fileName = `Modify-Submission-Result`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        }());

        const chunkOfsubmissionUpdateData = _.chunk(submissionUpdateData, 10);

        const skipQuestionTypes = ["matrix"];
        let entityHistoryUpdatedArray = [];

        for (let pointerTosubmissionUpdateData = 0; pointerTosubmissionUpdateData < chunkOfsubmissionUpdateData.length; pointerTosubmissionUpdateData++) {

          await Promise.all(chunkOfsubmissionUpdateData[pointerTosubmissionUpdateData].map(async (eachQuestionRow) => {

            eachQuestionRow["questionType"] = (questionExternalId[eachQuestionRow.questionCode] && questionExternalId[eachQuestionRow.questionCode].responseType != "") ? questionExternalId[eachQuestionRow.questionCode].responseType : "Question Not Found";

            eachQuestionRow["optionValues"] = "";
            if (questionExternalId[eachQuestionRow.questionCode] && questionExternalId[eachQuestionRow.questionCode].options && questionExternalId[eachQuestionRow.questionCode].options.length > 0) {
              questionExternalId[eachQuestionRow.questionCode].options.forEach(option => {
                eachQuestionRow["optionValues"] += option.label + ", ";
              })
            }

            if (!questionExternalId[eachQuestionRow.questionCode]) {
              eachQuestionRow["status"] = "Invalid question id";

            } else if (skipQuestionTypes.includes(questionExternalId[eachQuestionRow.questionCode].responseType)) {
              eachQuestionRow["status"] = "Invalid question type";

            } else {

              let csvUpdateHistory = [];
              let ecmByCsv = "evidences." + eachQuestionRow.ECM + ".submissions.0.answers." + questionExternalId[eachQuestionRow.questionCode].id;
              let submissionDate = "evidences." + eachQuestionRow.ECM + ".submissions.0.submissionDate";
              let answers = "answers." + questionExternalId[eachQuestionRow.questionCode].id;

              let findQuery = {
                entityExternalId: eachQuestionRow.schoolId,
                programExternalId: eachQuestionRow.programId,
                [ecmByCsv]: { $exists: true },
                [answers]: { $exists: true },
                "evidencesStatus.externalId": eachQuestionRow.ECM
              };

              let questionValueConversion = await submissionsHelper.questionValueConversion(questionExternalId[eachQuestionRow.questionCode], eachQuestionRow.oldResponse, eachQuestionRow.newResponse);

              if (!questionValueConversion.oldValue || !questionValueConversion.newValue || questionValueConversion.oldValue == "" || questionValueConversion.newValue == "") {
                eachQuestionRow["status"] = messageConstants.apiResponses.VALID_INVALID_RESPONSE;
              }

              else {
                let updateQuery = {
                  $set: {
                    [answers + ".oldValue"]: questionValueConversion.oldValue,
                    [answers + ".value"]: questionValueConversion.newValue,
                    [answers + ".submittedBy"]: eachQuestionRow.assessorID,
                    [ecmByCsv + ".oldValue"]: questionValueConversion.oldValue,
                    [ecmByCsv + ".value"]: questionValueConversion.newValue,
                    [ecmByCsv + ".submittedBy"]: eachQuestionRow.assessorID,
                    [submissionDate]: new Date(),
                    "evidencesStatus.$.submissions.0.submissionDate": new Date()
                  }
                };
                if (!entityHistoryUpdatedArray.includes(eachQuestionRow.entityId)) {
                  entityHistoryUpdatedArray.push(eachQuestionRow.entityId);
                  csvUpdateHistory.push({ userId: req.userDetails.id, date: new Date() });
                  updateQuery["$addToSet"] = { "submissionsUpdatedHistory": csvUpdateHistory };
                }

                let submissionCheck = await database.models.submissions.findOneAndUpdate(findQuery, updateQuery).lean();

                eachQuestionRow["status"] = messageConstants.apiResponses.DONE;
                if (submissionCheck == null) {
                  eachQuestionRow["status"] = messageConstants.apiResponses.NOT_DONE;
                }

              }
            }

            input.push(eachQuestionRow);
          }))
        }
        input.push(null);
      }
      catch (error) {
        reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message          
        });
      }
    })
  }

  /**
  * @api {get} /assessment/api/v1/submissions/resetEcm/:programExternalId?entityId=:entityExternalId&ecm=BL Reset Submission ECM
  * @apiVersion 1.0.0
  * @apiName Reset ECM of Submission.
  * @apiGroup Submissions
  * @apiParam {String} evidenceId Evidence ID.
  * @apiParam {String} entityId Entity ID.
  * @apiParam {String} ecmToBeReset ECM Code.
  * @apiSampleRequest /assessment/api/v1/submissions/resetEcm/PROGID01?entityId=1556397&ecm=LW
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Modify submission value.
   * @method
   * @name resetEcm
   * @param {Object} req -request data.
   * @param {String} req.params._id -program external id.
   * @param {String} req.query.entityId -entity external id.
   * @param {String} req.query.ecm -ecm to reset. 
   * @returns {JSON} ecm reset message. Once ecm is successfully reset all the 
   * submissions in particular ecm is removed.
   */

  async resetEcm(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let programId = req.params._id;

        if (!programId) {
          throw messageConstants.apiResponses.PROGRAM_ID_REQUIRED;
        }

        let entityId = req.query.entityId;
        let ecmToBeReset = req.query.ecm;
        let evidencesToBeReset = "evidences." + ecmToBeReset;
        let submissionUpdated = new Array;

        if (!entityId) {
          throw messageConstants.apiResponses.ENTITY_ID_NOT_FOUND;
        }

        let findQuery = {
          programExternalId: programId,
          entityExternalId: entityId,
          [evidencesToBeReset]: { $ne: null },
          "evidencesStatus.externalId": req.query.ecm
        };

        let updateQuery = {
          $set: {
            [evidencesToBeReset + ".submissions"]: [],
            [evidencesToBeReset + ".isSubmitted"]: false,
            [evidencesToBeReset + ".endTime"]: "", [evidencesToBeReset + ".startTime"]: "",
            [evidencesToBeReset + ".hasConflicts"]: false, "evidencesStatus.$.submissions": [],
            "evidencesStatus.$.isSubmitted": false, "evidencesStatus.$.hasConflicts": false,
            "evidencesStatus.$.startTime": "", "evidencesStatus.$.endTime": ""
          }
        };

        submissionUpdated.push({ userId: req.userDetails.id, date: new Date(), message: "Updated ECM " + req.query.ecm });
        updateQuery["$addToSet"] = { "submissionsUpdatedHistory": submissionUpdated };

        let updatedQuery = await database.models.submissions.findOneAndUpdate(findQuery, updateQuery).lean();

        if (updatedQuery == null) {
          throw messageConstants.apiResponses.ECM_NOT_EXIST;
        }

        return resolve({
          message: messageConstants.apiResponses.ECM_RESET
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
  * @api {get} /assessment/api/v1/submissions/pushCompletedSubmissionForReporting/:submissionId Push Completed Submission for Reporting
  * @apiVersion 1.0.0
  * @apiName Push Completed Submission for Reporting
  * @apiGroup Submissions
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Push completed submission in kafka for reporting.
   * @method
   * @name pushCompletedSubmissionForReporting
   * @param {String} req.params._id -submission id.
   * @returns {JSON} response message.
   */

  async pushCompletedSubmissionForReporting(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let pushSubmissionToKafka = await submissionsHelper.pushCompletedSubmissionForReporting(req.params._id);

        if(pushSubmissionToKafka.status != "success") {
          throw pushSubmissionToKafka.message
        }

        return resolve({
          message: pushSubmissionToKafka.message
        });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message        
        });
      }
    })
  }

  /**
  * @api {get} /assessment/api/v1/submissions/pushIncompleteSubmissionForReporting/:submissionId Push incomplete Submission for Reporting
  * @apiVersion 1.0.0
  * @apiName Push incomplete Submission for Reporting
  * @apiGroup Submissions
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Push incomplete submission in kafka for reporting.
   * @method
   * @name pushIncompleteSubmissionForReporting
   * @param {String} req.params._id -submission id.
   * @returns {JSON} response message.
   */

  async pushIncompleteSubmissionForReporting(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let pushSubmissionToKafka = await submissionsHelper.pushInCompleteSubmissionForReporting(req.params._id);

        if(pushSubmissionToKafka.status != "success") {
          throw pushSubmissionToKafka.message
        }

        return resolve({
          message: pushSubmissionToKafka.message
        });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message        
        });
      }
    })
  }

    /**
  * @api {get} /assessment/api/v1/submissions/delete/:submissionId Delete Submission.
  * @apiVersion 1.0.0
  * @apiName Delete Submission
  * @apiGroup Submissions
  * @apiSampleRequest /assessment/api/v1/submissions/delete/5c6a352f77c8d249d68ec6d0
  * @apiParamExample {json} Response:
  * {
  *    "message": "Submission deleted successfully",
  *    "status": 200
  *  }
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * Delete submission.
   * @method
   * @name delete
   * @param {String} req.params._id - submission id.
   * @returns {JSON} - status and deleted message.
   */

  async delete(req) {
    return new Promise(async (resolve, reject) => {

      try {
            
          let submissionData = await submissionsHelper.delete(
            req.params._id,
            req.userDetails.userId
          );
          
          return resolve(submissionData);

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
  * @api {post} /assessment/api/v1/submissions/setTitle/:submissionId Set Submission Title
  * @apiVersion 1.0.0
  * @apiName Set Submission Title
  * @apiGroup Submissions
  * @apiSampleRequest /assessment/api/v1/submissions/setTitle/5c6a352f77c8d249d68ec6d0
  * @apiParamExample {json} Request-Body:
  * {
  *   "title" : "Assessment Submission Title",
  * }
  * @apiParamExample {json} Response:
  * {
  *    "message": "Submission updated successfully",
  *    "status": 200
  *  }
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * Set Submission Title.
   * @method
   * @name setTitle
   * @param {String} req.params._id - submission id.
   * @param {String} req.body.title - submission title to update.
   * @returns {JSON} - status and delete message.
   */

  async setTitle(req) {
    return new Promise(async (resolve, reject) => {

      try {

          let editedSubmissionTitle = 
          await submissionsHelper.setTitle(
            req.params._id,
            req.body.title,
            req.userDetails.userId
          );

          return resolve(editedSubmissionTitle);

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
  * @api {get} /assessment/api/v1/submissions/create/:solutionId?entityId=:entityId Create submissions
  * @apiVersion 1.0.0
  * @apiName Submissions created successfully
  * @apiGroup Submissions
  * @apiSampleRequest /assessment/api/v1/submissions/create/5b98fa069f664f7e1ae7498c?entityId=5bfe53ea1d0c350d61b78d0a
  * @apiParamExample {json} Response:
  * {
    "message": "Submission created successfully",
    "status": 200,
    "result": {
        "_id": "5eea03f9170c8c5f22069abd",
        "title": "Assessment 3",
        "submissionNumber": 3
    }
  }
  * @apiUse successBody
  * @apiUse errorBody
  */

    /**
   * Create submissions.
   * @method
   * @name create
   * @param {Object} req -request data.
   * @param {String} req.params._id - solution id.
   * @param {String} req.query.entityId - entity id.
   * @returns {JSON} Created submission data. 
   */

  async create(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let response = 
        await submissionsHelper.create(
          req.params._id,
          req.query.entityId,
          req.headers['user-agent'],
          req.userDetails.userId
        );

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
   * List improvement project suggestions by criteria
   * @method
   * @name listImprovementProjectSuggestions
   * @param {String} req.params._id -submission id.
   * @returns {JSON} response message.
   */

  async listImprovementProjectSuggestions(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let submissionCriteria = await submissionsHelper.getCriteria(req.params._id);

        if(!submissionCriteria.success) {
          throw submissionCriteria.message
        }

        let result = new Array;

        if(submissionCriteria.data && submissionCriteria.data.length > 0) {
          for (let pointerToSubmissionCriteria = 0; pointerToSubmissionCriteria < submissionCriteria.data.length; pointerToSubmissionCriteria++) {
            const criteria = submissionCriteria.data[pointerToSubmissionCriteria];
            result.push(_.pick(criteria,[
              "name",
              "description",
              "externalId",
              "score",
              "improvement-projects"
            ]))
          }
        }

        return resolve({
          message: submissionCriteria.message,
          result : result
        });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message        
        });
      }
    })
  }

  /**
  * @api {get} /assessment/api/v1/submissions/listImprovementProjectSuggestions/:submissionId List improvement project suggestions by criteria
  * @apiVersion 1.0.0
  * @apiName List improvement project suggestions by criteria
  * @apiGroup Submissions
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * List improvement project suggestions by criteria
   * @method
   * @name listImprovementProjectSuggestions
   * @param {String} req.params._id -submission id.
   * @returns {JSON} response message.
   */

  async listImprovementProjectSuggestions(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let submissionCriteria = await submissionsHelper.getCriteria(req.params._id);

        if(!submissionCriteria.success) {
          throw submissionCriteria.message
        }

        let result = new Array;

        if(submissionCriteria.data && submissionCriteria.data.length > 0) {
          for (let pointerToSubmissionCriteria = 0; pointerToSubmissionCriteria < submissionCriteria.data.length; pointerToSubmissionCriteria++) {
            const criteria = submissionCriteria.data[pointerToSubmissionCriteria];
            result.push(_.pick(criteria,[
              "name",
              "description",
              "externalId",
              "score",
              "improvement-projects"
            ]))
          }
        }

        return resolve({
          message: submissionCriteria.message,
          result : result
        });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message        
        });
      }
    })
  }

   /**
  * @api {get} /assessment/api/v1/submissions/list/:solutionId?entityId:entityId List Submissions
  * @apiVersion 1.0.0
  * @apiName List Submissions
  * @apiGroup Submissions
  * @apiSampleRequest /assessment/api/v1/submissions/list/5b98fa069f664f7e1ae7498c?entityId=5bfe53ea1d0c350d61b78d0a
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
    "message": "Submission list fetched successfully",
    "status": 200,
    "result": [
        {
            "_id": "5c6a352f77c8d249d68ec6d0",
            "status": "inprogress",
            "updatedAt": "2019-09-03T05:01:40.587Z",
            "createdAt": "2019-02-18T04:31:43.974Z",
            "entityId": "5bfe53ea1d0c350d61b78d0a",
            "entityExternalId": "1207229",
            "entityType": "school",
            "submissionNumber": 1,
            "title": "Assessment 1"
        }
    ]
}

  */
   /**
   * List submissions
   * @method
   * @name list
   * @param {Object} req - requested data.
   * @param {String} req.query.entityId - entity id.
   * @param {String} req.params._id - solution id. 
   * @returns {JSON} consists of list of submissions.
   */

  async list(req) {
    return new Promise(async (resolve, reject) => {
      try {
        
        let submissionDocument =
        await submissionsHelper.list( req.query.entityId,req.params._id);

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
  * @api {get} /assessment/api/v1/submissions/getCriteriaQuestions/:submissionId
  * @apiVersion 1.0.0
  * @apiName Get Criteria Questions
  * @apiGroup Submissions
  * @apiSampleRequest /assessment/api/v1/submissions/getCriteriaQuestions/5b98fa069f664f7e1ae7498c
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
    "status": 200,
    "message": "Criteria questions fetched successfully",
    "result": {
        "criteriaQuestions": [{
            "id": "5de4a2811bbd650c9861a7b8",
            "name": "प्रधान अध्यापक/ अध्यापक (कोची) के लिए आई डी पी का निर्माण करना",
            "score": "",
            "questions": [{
                "question": [
                    "आपको प्रधान अध्यापक/ अध्यापक (कोची) के व्यक्तिगत विकास (आई डी पी) को लेकर काम करने की जरुरत क्यों है?"
                ],
                "questionId": "5de4ac761f6a980ca737c735",
                "responseType": "radio",
                "value": [
                    "yes" 
                ],
                "evidences": {
                   "images": [],
                   "videos": [],
                   "documents": [],
                   "remarks":[]
                }
            }]
        }]
        "criteria": [{
            "id": "5de4a2811bbd650c9861a7b8",
            "name": "प्रधान अध्यापक/ अध्यापक (कोची) के लिए आई डी पी का निर्माण करना"
        }],
        "levelToScoreMapping": [{
                "level":"L1",
                "points": 25,
                "label": "Not Good"
            }
        ]
      }
    }
  
  */
   /**
   * Get criteria quetions
   * @method
   * @name getCriteriaQuestions
   * @param {Object} req - requested data.
   * @param {String} req.params._id - submission id. 
   * @returns {JSON} Criteia questions and answers.
   */

  async getCriteriaQuestions(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let criteriaQuestions =
          await submissionsHelper.getCriteriaQuestions(req.params._id);

          return resolve({
            message :criteriaQuestions.message,
            result : criteriaQuestions.data
          });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          success: false,
          message: error.message || httpStatusCode.internal_server_error.message,
          result: false
        });
      }
    })
  }


  /**
  * @api {post} /assessment/api/v1/submissions/manualRating/:submissionId
  * @apiVersion 1.0.0
  * @apiName Manual rating
  * @apiGroup Submissions
  * @apiSampleRequest /assessment/api/v1/submissions/manualRating/5b98fa069f664f7e1ae7498c
  * @apiParamExample {json} Request-Body:
  * {
  *  "5698fa069f664f7e1ae7499d" : "L1",
  *  "58673e7b9f664f7e1ae7388e" : "L2"
  * }
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
     "status": 200,
     "message": "Manual rating submitted successfully"
    }
  
  */
  /**
  * Manual rating
  * @method
  * @name  manualRating
  * @param {Object} req - requested data.
  * @param {String} req.params._id - submission id.
  * @param {Object} req.body - CriteriaId and level
  * @returns {String}  Success message
  */

  async manualRating(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let response =
          await submissionsHelper.manualRating(req.params._id, req.body, req.userDetails.userId);

        return resolve(response);
        
      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          success: false,
          message: error.message || httpStatusCode.internal_server_error.message,
          result: false
        });
      }
    })
  }
};