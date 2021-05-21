/**
 * name : submissions/helper.js
 * author : Akash
 * created-date : 01-feb-2019
 * Description : Submissions related helper functionality.
 */

// Dependencies
let kafkaClient = require(ROOT_PATH + "/generics/helpers/kafkaCommunications");
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const criteriaHelper = require(MODULES_BASE_PATH + "/criteria/helper");
const questionsHelper = require(MODULES_BASE_PATH + "/questions/helper");
const emailClient = require(ROOT_PATH + "/generics/helpers/emailCommunications");
const observationSubmissionsHelper = require(MODULES_BASE_PATH + "/observationSubmissions/helper");
const scoringHelper = require(MODULES_BASE_PATH + "/scoring/helper");
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");
const programsHelper = require(MODULES_BASE_PATH + "/programs/helper");
const entityAssessorsHelper = require(MODULES_BASE_PATH + "/entityAssessors/helper");
const criteriaQuestionsHelper = require(MODULES_BASE_PATH + "/criteriaQuestions/helper");
const kendraService = require(ROOT_PATH + "/generics/services/kendra");
const path = require("path");
const surveySubmissionsHelper = require(MODULES_BASE_PATH + "/surveySubmissions/helper");

/**
    * SubmissionsHelper
    * @class
*/

module.exports = class SubmissionsHelper {

     /**
   * List submissions.
   * @method
   * @name submissionDocuments
   * @param {Object} [findQuery = "all"] - filter query
   * @param {Array} [fields = "all"] - fields to include.
   * @param {Array} [skipFields = "none"] - field which can be skipped.
   * @param {Object} [sort = "none"] - sorted data.
   * @param {Number} [limitingValue = ""] - limitting value.
   * @param {Number} [skippingValue = ""] - skip fields value.
   * @returns {Array} list of submissions document. 
   */

  static submissionDocuments(
      findQuery = "all", 
      fields = "all",
      skipFields = "none",
      sort = "none",
      limitingValue = "", 
      skippingValue = "",
 ) {
    return new Promise(async (resolve, reject) => {
        try {
            let queryObject = {};

            if (findQuery != "all") {
                queryObject = findQuery;
            }

            let projection = {};

            if (fields != "all") {
                fields.forEach(element => {
                    projection[element] = 1;
                });
            }

            if (skipFields != "none") {
                skipFields.forEach(element => {
                    projection[element] = 0;
                });
            }

            let submissionDocuments;

            if( sort !== "none" ) {
                
                submissionDocuments = 
                await database.models.submissions.find(
                    queryObject, 
                    projection
                ).sort(sort).limit(limitingValue).skip(skippingValue).lean();

            } else {
                
                submissionDocuments = 
                await database.models.submissions.find(
                    queryObject, 
                    projection
                ).limit(limitingValue).skip(skippingValue).lean();
            }
          
            return resolve(submissionDocuments);
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
   * find submission by entity data.
   * @method
   * @name findSubmissionByEntityProgram
   * @param {Object} document
   * @param {String} document.entityId - entity id.
   * @param {String} document.solutionId - solution id.
   * @param {String} document.submissionNumber - submission number. Default to 1.   
   * @param {Object} userAgent - user Agent.
   * @param {Object} userId - logged in user id.
   * @returns {Object} submission document. 
   */

    static findSubmissionByEntityProgram(document, userAgent,userId) {

        return new Promise(async (resolve, reject) => {

            try {

                let queryObject = {
                    entityId : document.entityId,
                    solutionId : document.solutionId,
                    submissionNumber : document.submissionNumber
                };

                let submissionDocument = 
                await this.submissionDocuments(
                    queryObject,["assessors"]
                )

                if (!submissionDocument[0]) {

                    document.assessors = 
                    await this.assessors(
                        document.solutionId,
                        document.entityId,
                        userAgent,
                        userId
                    );

                    submissionDocument = await database.models.submissions.create(
                        document
                    );

                    // Push new submission to kafka for reporting/tracking.
                    this.pushInCompleteSubmissionForReporting(submissionDocument._id);

                    if( submissionDocument.referenceFrom === messageConstants.common.PROJECT ) {
                        this.pushSubmissionToImprovementService(_.pick(submissionDocument,["project","status","_id"]));
                    }
                    
                } else {

                    let assessorElement = submissionDocument[0].assessors.find(assessor => assessor.userId === userId)
                    if (assessorElement && assessorElement.externalId != "") {
                        assessorElement.assessmentStatus = "started";
                        assessorElement.userAgent = userAgent;
                        let updateObject = {};
                        updateObject.$set = {
                            assessors: submissionDocument[0].assessors
                        };
                        submissionDocument = 
                        await database.models.submissions.findOneAndUpdate(
                            queryObject,
                            updateObject
                        );
                    }
                }

                return resolve({
                    message: messageConstants.apiResponses.SUBMISSION_FOUND,
                    result: submissionDocument
                });


            } catch (error) {
                return reject(error);
            }

        })

    }

    /**
   * Extract submission status.
   * @method
   * @name extractStatusOfSubmission
   * @param {Object} submissionDocument - subimission data.
   * @param {String} submissionDocument._id - submission id.
   * @param {String} submissionDocument.status - submission status.
   * @param {Object} submissionDocument.evidencesStatus - evidence method status.
   * @returns {Object} submission status. 
   */

    static extractStatusOfSubmission(submissionDocument) {

        return new Promise(async (resolve, reject) => {

            try {

                let result = {};
                result._id = submissionDocument._id;
                result.status = submissionDocument.status;
                result.evidencesStatus = submissionDocument.evidencesStatus;

                return resolve(result);


            } catch (error) {
                return reject(error);
            }

        })
    }

     /**
   * Can Enable rating questions of submission.
   * @method
   * @name canEnableRatingQuestionsOfSubmission
   * @param {Object} submissionDocument - subimission data.
   * @param {Object} submissionDocument.evidencesStatus - all evidence method status.
   * @param {Object} submissionDocument.status - submission status. 
   * Should not be blocked. 
   * @returns {Object} consists of ratings enabled and response message. 
   */

    static canEnableRatingQuestionsOfSubmission(submissionDocument) {

        return new Promise(async (resolve, reject) => {

            try {

                let result = {};
                result.ratingsEnabled = true;
                result.responseMessage = "";

                if (submissionDocument.evidencesStatus && submissionDocument.status !== "blocked") {
                    const evidencesArray = submissionDocument.evidencesStatus;
                    for (let iterator = 0; iterator < evidencesArray.length; iterator++) {
                        if (!evidencesArray[iterator].isSubmitted || evidencesArray[iterator].hasConflicts === true) {
                            // If inactive methods are allowed in submission put this condition.
                            // if(!(evidencesArray[iterator].isActive === false)) {
                                result.ratingsEnabled = false;
                                result.responseMessage = messageConstants.apiResponses.ALL_ECM_NOT_COMPLETED;
                                break;
                            //}
                        }
                    }
                } else {
                    result.ratingsEnabled = false;
                    result.responseMessage = messageConstants.apiResponses.ASSESSMENT_BLOCK_FOR_RATING;
                }

                return resolve(result);


            } catch (error) {
                return reject(error);
            }

        })
    }

    /**
   * submissions auto rated.
   * @method
   * @name isSubmissionToBeAutoRated
   * @param {Object} submissionSolutionId - submission solution id.
   * @returns {Object} auto rated submission data. 
   */

    static isSubmissionToBeAutoRated(submissionSolutionId) {

        return new Promise(async (resolve, reject) => {

            try {

                let solutionDocument = await solutionsHelper.checkIfSolutionIsRubricDriven(submissionSolutionId);

                let submissionToBeAutoRated = (solutionDocument[0] && solutionDocument[0].scoringSystem && solutionDocument[0].scoringSystem != "") ? true : false;
                
                return resolve(submissionToBeAutoRated);


            } catch (error) {
                return reject(error);
            }

        })
    }

    /**
   * Question value conversion.
   * @method
   * @name questionValueConversion
   * @param {Object} question - question data.
   * @param {String} question.responseType - question upload response.
   * @param {Object} question.options - question options.
   * @param {String} oldResponse - existing response.   
   * @returns {Object} result- consists of oldValue and newValue. 
   */

    static questionValueConversion(question, oldResponse, newResponse) {

        return new Promise(async (resolve, reject) => {

            try {

                let result = {};

                if (question.responseType == "date") {

                    let oldResponseArray = oldResponse.split("/");

                    if (oldResponseArray.length > 2) {
                        [oldResponseArray[0], oldResponseArray[1]] = [oldResponseArray[1], oldResponseArray[0]];
                    }

                    let newResponseArray = newResponse.split("/");

                    if (newResponseArray.length > 2) {
                        [newResponseArray[0], newResponseArray[1]] = [newResponseArray[1], newResponseArray[0]];
                    }

                    result["oldValue"] = oldResponseArray.map(value => (value < 10) ? "0" + value : value).reverse().join("-");
                    result["newValue"] = newResponseArray.map(value => (value < 10) ? "0" + value : value).reverse().join("-");

                } else if (question.responseType == "radio") {

                    question.options.forEach(eachOption => {

                        if (eachOption.label.replace(/\s/g, '').toLowerCase() == oldResponse.replace(/\s/g, '').toLowerCase()) {
                            result["oldValue"] = eachOption.value;
                        }

                        if (eachOption.label.replace(/\s/g, '').toLowerCase() == newResponse.replace(/\s/g, '').toLowerCase()) {
                            result["newValue"] = eachOption.value;
                        }
                    })

                } else if (question.responseType == "multiselect") {

                    result["oldValue"] = result["newValue"] = new Array;
                    let oldResponseArray = oldResponse.split(",").map((value) => { return value.replace(/\s/g, '').toLowerCase() });
                    let newResponseArray = newResponse.split(",").map((value) => { return value.replace(/\s/g, '').toLowerCase() });

                    question.options.forEach(eachOption => {

                        if (oldResponseArray.includes(eachOption.label.replace(/\s/g, '').toLowerCase())) {
                            result["oldValue"].push(eachOption.value);
                        }

                        if (newResponseArray.includes(eachOption.label.replace(/\s/g, '').toLowerCase())) {
                            result["newValue"].push(eachOption.value);
                        }
                    })

                } else {

                    result["oldValue"] = oldResponse;
                    result["newValue"] = newResponse;
                }

                return resolve(result);


            } catch (error) {
                return reject(error);
            }

        })
    }

     /**
   * Submission status.
   * @method
   * @name mapSubmissionStatus
   * @param {String} status - submission status. 
   * @returns {String} mapped submission status value. 
   */

    static mapSubmissionStatus(status) {
        let submissionStatus = {
            inprogress: 'In Progress',
            completed: 'Complete',
            blocked: 'Blocked',
            started: 'Started',
            ratingPending: 'Rating Pending'
        };
        return submissionStatus[status] || "";
    }

    /**
   * Create evidence in submission.
   * @method
   * @name createEvidencesInSubmission
   * @param {Object} req - requested data.
   * @param {String} modelName - mongodb model name.   
   * @returns {Object} 
   */

    static createEvidencesInSubmission(req, modelName, isSubmission) {

        return new Promise(async (resolve, reject) => {

            try {

                req.body = req.body || {};
                let message = messageConstants.apiResponses.SUBMISSION_COMPLETED;
                let runUpdateQuery = false;

                let queryObject = {
                    _id: ObjectId(req.params._id)
                };

                let queryOptions = {
                    new : true,
                    projection: {
                        _id: 1,
                        solutionId: 1,
                        evidencesStatus: 1,
                        status: 1
                    }
                };

                let submissionDocument = await database.models[modelName].findOne(
                    queryObject
                ).lean();

                let updateObject = {};
                let result = {};

                if (req.body.entityProfile) {
                    updateObject.$set = { entityProfile: req.body.entityProfile };
                    runUpdateQuery = true;
                }

                if (req.body.evidence) {
                    req.body.evidence.gpsLocation = req.headers.gpslocation;
                    req.body.evidence.submittedBy = req.userDetails.userId;
                    req.body.evidence.submittedByName = req.userDetails.firstName + " " + req.userDetails.lastName;
                    req.body.evidence.submittedByEmail = req.userDetails.email;
                    req.body.evidence.submissionDate = new Date();

                    let evidencesStatusToBeChanged = submissionDocument.evidencesStatus.find(singleEvidenceStatus => singleEvidenceStatus.externalId == req.body.evidence.externalId);
                    if (submissionDocument.evidences[req.body.evidence.externalId].isSubmitted === false) {
                        runUpdateQuery = true;
                        req.body.evidence.isValid = true;
                        let answerArray = {};
                        Object.entries(req.body.evidence.answers).forEach(answer => {
                            if (answer[1].responseType === "matrix" && answer[1].notApplicable != true) {
                                answer = this.getAnswersFromGeneralQuestion(answer, submissionDocument);
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

                        if (answerArray.isAGeneralQuestionResponse) { delete answerArray.isAGeneralQuestionResponse; }


                        evidencesStatusToBeChanged['isSubmitted'] = true;
                        evidencesStatusToBeChanged['notApplicable'] = req.body.evidence.notApplicable;
                        evidencesStatusToBeChanged['startTime'] = req.body.evidence.startTime;
                        evidencesStatusToBeChanged['endTime'] = req.body.evidence.endTime;
                        evidencesStatusToBeChanged['hasConflicts'] = false;
                        evidencesStatusToBeChanged['submissions'].push(_.omit(req.body.evidence, ["answers","status"]));

                        updateObject.$push = {
                            ["evidences." + req.body.evidence.externalId + ".submissions"]: req.body.evidence
                        };
                        updateObject.$set = {
                            answers: _.assignIn(submissionDocument.answers, answerArray),
                            ["evidences." + req.body.evidence.externalId + ".isSubmitted"] : true,
                            ["evidences." + req.body.evidence.externalId + ".notApplicable"]: req.body.evidence.notApplicable,
                            ["evidences." + req.body.evidence.externalId + ".startTime"]: req.body.evidence.startTime,
                            ["evidences." + req.body.evidence.externalId + ".endTime"]: req.body.evidence.endTime,
                            ["evidences." + req.body.evidence.externalId + ".hasConflicts"]: false,
                            status: (submissionDocument.status === "started") ? "inprogress" : submissionDocument.status
                        };

                        if( 
                            req.body.evidence.status && 
                            req.body.evidence.status === messageConstants.common.DRAFT 
                        ) {
                            evidencesStatusToBeChanged['isSubmitted'] = false;
                            updateObject["$set"]["evidences." + req.body.evidence.externalId + ".isSubmitted"] = false;
                            delete req.body.evidence.status;
                        }

                        updateObject["$set"]["evidencesStatus"] = submissionDocument.evidencesStatus;

                    } else {

                        let submissionAllowed = await this.isAllowed(
                            req.params._id,
                            req.body.evidence.externalId,
                            modelName
                        );

                        return resolve(submissionAllowed);
                    }

                }

                if (runUpdateQuery) {
                    let updatedSubmissionDocument = await database.models[modelName].findOneAndUpdate(
                        queryObject,
                        updateObject,
                        queryOptions
                    );
                    
                    if(modelName == messageConstants.common.SUBMISSIONS) {
                        // Push update submission to kafka for reporting/tracking.
                        this.pushInCompleteSubmissionForReporting(updatedSubmissionDocument._id);
                    } else if (modelName == messageConstants.common.OBSERVATION_SUBMISSIONS) {
                        // Push updated submission to kafka for reporting/tracking.
                        observationSubmissionsHelper.pushInCompleteObservationSubmissionForReporting(updatedSubmissionDocument._id);
                    } else if (modelName == messageConstants.common.SURVEY_SUBMISSIONS) {
                        // Push updated submission to kafka for reporting/tracking.
                        surveySubmissionsHelper.pushInCompleteSurveySubmissionForReporting(updatedSubmissionDocument._id);
                    }

                    let canRatingsBeEnabled = await this.canEnableRatingQuestionsOfSubmission(updatedSubmissionDocument);
                    let { ratingsEnabled } = canRatingsBeEnabled;

                    if (ratingsEnabled) {

                        let updateStatusObject = {};
                        updateStatusObject.$set = {};

                        let isSubmissionToBeAutoRated = await this.isSubmissionToBeAutoRated(updatedSubmissionDocument.solutionId);
                        
                        if(!isSubmissionToBeAutoRated) {
                            updateStatusObject.$set = {
                                status: "completed",
                                completedDate: new Date()
                            };
                        } else {
                            updateStatusObject.$set = {
                                status: "ratingPending"
                            };
                        }
                        updatedSubmissionDocument = await database.models[modelName].findOneAndUpdate(
                            queryObject,
                            updateStatusObject,
                            queryOptions
                        );

                    }

                    let status = await this.extractStatusOfSubmission(updatedSubmissionDocument);

                    let response = {
                        message: message,
                        result: status
                    };

                    return resolve(response);

                } else {

                    let response = {
                        message: message
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
   * Get answers from general question.
   * @method
   * @name getAnswersFromGeneralQuestion
   * @param {Object} answer - answer data.
   * @param {Object} submissionDocument - submission data.   
   * @returns {Object} - answer.
   */

    static getAnswersFromGeneralQuestion(answer, submissionDocument) {
        if (answer[1].isAGeneralQuestion == true && submissionDocument.generalQuestions && submissionDocument.generalQuestions[answer[0]]) {
            submissionDocument.generalQuestions[answer[0]].submissions.forEach(generalQuestionSubmission => {
                generalQuestionSubmission.value.forEach(generalQuestionInstanceValue => {
                    generalQuestionInstanceValue.isAGeneralQuestionResponse = true;
                    answer[1].value.push(generalQuestionInstanceValue);
                })
                generalQuestionSubmission.payload.labels[0].forEach(generalQuestionInstancePayload => {
                    answer[1].payload.labels[0].push(generalQuestionInstancePayload);
                })
            })
        }
        return answer;
    }

    /**
   * Push completed submission for reporting.
   * @method
   * @name pushCompletedSubmissionForReporting
   * @param {String} submissionId - submission id.
   * @returns {JSON} consists of kafka message whether it is pushed for reporting
   * or not.
   */

    static pushCompletedSubmissionForReporting(submissionId) {
        return new Promise(async (resolve, reject) => {
            try {

                if (submissionId == "") {
                    throw messageConstants.apiResponses.SUBMISSION_ID_NOT_FOUND;
                }

                if(typeof submissionId == "string") {
                    submissionId = ObjectId(submissionId);
                }

                let submissionsDocument = await database.models.submissions.findOne({
                    _id: submissionId,
                    status: "completed"
                }).lean();

                if (!submissionsDocument) {
                    throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND + "or" +SUBMISSION_STATUS_NOT_COMPLETE;
                }

                if( submissionsDocument.referenceFrom === messageConstants.common.PROJECT ) {
                    
                    await this.pushSubmissionToImprovementService(
                        _.pick(submissionsDocument,["project","status","_id","completedDate"])
                    );
                }


                const kafkaMessage = await kafkaClient.pushCompletedSubmissionToKafka(submissionsDocument);

                if(kafkaMessage.status != "success") {
                    let errorObject = {
                        formData: {
                            submissionId:submissionsDocument._id.toString(),
                            message:kafkaMessage.message
                        }
                    };

                    console.log(errorObject);
                }

                return resolve(kafkaMessage);

            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
   * Push submission to queue for rating.
   * @method
   * @name pushSubmissionToQueueForRating
   * @param {String} [submissionId = ""] - submission id.
   * @returns {Object} consists of kafka message whether it is pushed in queue 
   * for rating or not.
   */

    static pushSubmissionToQueueForRating(submissionId = "") {
        return new Promise(async (resolve, reject) => {
            try {

                if (submissionId == "") {
                    throw messageConstants.apiResponses.SUBMISSION_ID_NOT_FOUND;
                }
                if(typeof submissionId !== "string") {
                    submissionId = submissionId.toString();
                }
                const kafkaMessage = await kafkaClient.pushSubmissionToKafkaQueueForRating({submissionModel : "submissions",submissionId : submissionId});

                if(kafkaMessage.status != "success") {
                    let errorObject = {
                        formData: {
                            submissionId:submissionId,
                            submissionModel:"submissions",
                            message:kafkaMessage.message
                        }
                    };

                    console.log(errorObject);
                }

                return resolve(kafkaMessage);

            } catch (error) {
                return reject(error);
            }
        })
    }

     /**
     * Rate submission by id.
     * @method
     * @name rateSubmissionById
     * @param {String} [submissionId = ""] - submission id.
     * @returns {Object} message regarding rating of submission. 
     */

    static rateSubmissionById(submissionId = "") {
        return new Promise(async (resolve, reject) => {

            let emailRecipients = (process.env.SUBMISSION_RATING_DEFAULT_EMAIL_RECIPIENTS && process.env.SUBMISSION_RATING_DEFAULT_EMAIL_RECIPIENTS != "") ? process.env.SUBMISSION_RATING_DEFAULT_EMAIL_RECIPIENTS : "";

            try {

                if (submissionId == "") {
                    throw new Error(messageConstants.apiResponses.SUBMISSION_ID_NOT_FOUND);
                }

                let submissionDocument = await database.models.submissions.findOne(
                    {_id : ObjectId(submissionId)},
                    { "answers": 1, "criteria": 1, "evidencesStatus": 1, "entityInformation": 1, "entityProfile": 1, "programExternalId": 1, "solutionExternalId" : 1 }
                ).lean();
        
                if (!submissionDocument._id) {
                    throw new Error(messageConstants.apiResponses.SOLUTION_NOT_FOUND);
                }
               
                let solutionDocument = await database.models.solutions.findOne({
                    externalId: submissionDocument.solutionExternalId,
                }, { themes: 1, levelToScoreMapping: 1, scoringSystem : 1, flattenedThemes : 1, sendSubmissionRatingEmailsTo : 1 }).lean();

                if (!solutionDocument) {
                    throw new Error(messageConstants.apiResponses.SOLUTION_NOT_FOUND);
                }

                if(solutionDocument.sendSubmissionRatingEmailsTo && solutionDocument.sendSubmissionRatingEmailsTo != "") {
                    emailRecipients = solutionDocument.sendSubmissionRatingEmailsTo;
                }

                if(solutionDocument.scoringSystem == messageConstants.common.POINTS_BASED_SCORING_SYSTEM) {

                    submissionDocument.scoringSystem = messageConstants.common.POINTS_BASED_SCORING_SYSTEM;

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
                            (option.score && option.score > 0) ? submissionDocument.questionDocuments[question._id.toString()][`${option.value}-score`] = option.score : "";
                            })
                        }
                        if(question.sliderOptions && question.sliderOptions.length > 0) {
                            questionMaxScore = _.maxBy(question.sliderOptions, 'score').score;
                            submissionDocument.questionDocuments[question._id.toString()].sliderOptions = question.sliderOptions;
                        }
                        submissionDocument.questionDocuments[question._id.toString()].maxScore =  (typeof questionMaxScore === "number") ? questionMaxScore : 0;
                        })
                    }

                } else if(solutionDocument.scoringSystem == messageConstants.common.MANUAL_RATING) {
                    return resolve(messageConstants.apiResponses.SUBMISSION_PROCESSED_FOR_MANUAL_RATING)
                }

                let resultingArray = await scoringHelper.rateEntities([submissionDocument], "singleRateApi");

                if(resultingArray.result.runUpdateQuery) {
                    await database.models.submissions.updateOne(
                        {
                            _id: ObjectId(submissionId)
                        },
                        {
                            status: "completed",
                            completedDate: new Date()
                        }
                    );
                    await this.pushCompletedSubmissionForReporting(submissionId);
                    emailClient.pushMailToEmailService(emailRecipients,messageConstants.apiResponses.SUBMISSION_AUTO_RATING_SUCCESS+" - "+submissionId,JSON.stringify(resultingArray));
                    return resolve(messageConstants.apiResponses.SUBMISSION_RATING_COMPLETED);
                } else {
                    emailClient.pushMailToEmailService(emailRecipients,messageConstants.apiResponses.SUBMISSION_AUTO_RATING_FAILED+" - "+submissionId,JSON.stringify(resultingArray));
                    return resolve(messageConstants.apiResponses.SUBMISSION_RATING_COMPLETED);
                }

            } catch (error) {
                emailClient.pushMailToEmailService(emailRecipients,messageConstants.apiResponses.SUBMISSION_AUTO_RATING_FAILED+" - "+submissionId,error.message);
                return reject(error);
            }
        })
    }


    /**
     * Mark submission complete and push to Kafka.
     * @method
     * @name markCompleteAndPushForReporting
     * @param {String} [submissionId = ""] -submission id.
     * @returns {JSON} - message
     */

    static markCompleteAndPushForReporting(submissionId = "") {
        return new Promise(async (resolve, reject) => {

            let emailRecipients = (process.env.SUBMISSION_RATING_DEFAULT_EMAIL_RECIPIENTS && process.env.SUBMISSION_RATING_DEFAULT_EMAIL_RECIPIENTS != "") ? process.env.SUBMISSION_RATING_DEFAULT_EMAIL_RECIPIENTS : "";

            try {

                if (submissionId == "") {
                    throw new Error(messageConstants.apiResponses.SUBMISSION_ID_NOT_FOUND);
                } else if (typeof submissionId !== "string") {
                    submissionId = submissionId.toString()
                }

                let submissionDocument = await database.models.submissions.findOne(
                    {_id : ObjectId(submissionId)},
                    { "_id": 1}
                ).lean();
        
                if (!submissionDocument._id) {
                    throw new Error(messageConstants.apiResponses.SOLUTION_NOT_FOUND);
                }

                await database.models.submissions.updateOne(
                    {
                        _id: ObjectId(submissionId)
                    },
                    {
                        status: "completed",
                        completedDate: new Date()
                    }
                );
                
                await this.pushCompletedSubmissionForReporting(submissionId);

                emailClient.pushMailToEmailService(emailRecipients,"Successfully marked submission " + submissionId + "complete and pushed for reporting","NO TEXT AVAILABLE");
                return resolve(messageConstants.apiResponses.SUBMISSION_RATING_COMPLETED);


            } catch (error) {
                emailClient.pushMailToEmailService(emailRecipients,messageConstants.apiResponses.SUBMISSION_AUTO_RATING_FAILED+" - "+submissionId,error.message);
                return reject(error);
            }
        })
    }

    /**
   * Push incomplete submission for reporting.
   * @method
   * @name pushInCompleteSubmissionForReporting
   * @param {String} submissionId - submission id.
   * @returns {JSON} consists of kafka message whether it is pushed for reporting
   * or not.
   */

    static pushInCompleteSubmissionForReporting(submissionId) {
        return new Promise(async (resolve, reject) => {
            try {

                if (submissionId == "") {
                    throw messageConstants.apiResponses.SUBMISSION_ID_NOT_FOUND;
                }

                if(typeof submissionId == "string") {
                    submissionId = ObjectId(submissionId);
                }

                let submissionsDocument = await database.models.submissions.findOne({
                    _id: submissionId,
                    status: {$ne: "completed"}
                }).lean();

                if (!submissionsDocument) {
                    throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND + "or" +SUBMISSION_STATUS_NOT_COMPLETE;
                }


                const kafkaMessage = await kafkaClient.pushInCompleteSubmissionToKafka(submissionsDocument);

                if(kafkaMessage.status != "success") {
                    let errorObject = {
                        formData: {
                            submissionId:submissionsDocument._id.toString(),
                            message:kafkaMessage.message
                        }
                    };

                    console.log(errorObject);
                }

                return resolve(kafkaMessage);

            } catch (error) {
                return reject(error);
            }
        })
    }

     /**
   * Delete submission.
   * @method
   * @name delete
   * @param {String} submissionId - submission id.
   * @param {String} userId - logged in user id.
   * @returns {Object} status and deleted message
   */

  static delete(submissionId,userId) {
    return new Promise(async (resolve, reject) => {
        try {
            
            let submissionDocument = 
            await database.models.submissions.deleteOne(
                {
                    "_id" : submissionId,
                    "assessors.userId" : userId,
                    "status" : messageConstants.common.STARTED
                }
            );

            if (!submissionDocument.n) {
                throw {
                    message : messageConstants.apiResponses.SUBMISSION_NOT_FOUND
                }
              }
            
            return resolve({
                message : messageConstants.apiResponses.SUBMISSION_DELETED
            });

        } catch (error) {
            return reject(error);
        }
    })
  }

    /**
   * Edit submission title.
   * @method
   * @name setTitle
   * @param {String} submissionId - submission id.
   * @param {String} updatedTitle - setTitle data to be updated.
   * @param {String} userId - logged in user id.
   * @returns {Object} status and updated message.
   */

  static setTitle(submissionId,updatedTitle,userId) {
    return new Promise(async (resolve, reject) => {
        try {
            
            let submissionDocument = 
            await database.models.submissions.findOneAndUpdate(
                {
                    "_id" : submissionId,
                    "assessors.userId" : userId
                },{
                    $set : {
                        title : updatedTitle
                    }
                }
            );

            if (!submissionDocument || !submissionDocument._id) {
                throw {
                    message : messageConstants.apiResponses.SUBMISSION_NOT_FOUND
                }
            }
            
            return resolve({
                message : messageConstants.apiResponses.SUBMISSION_UPDATED
            });

        } catch (error) {
            return reject(error);
        }
    })
  }

     /**
   * Create submission.
   * @method
   * @name create
   * @param {String} solutionId - solution id.
   * @param {String} entityId - entity id.
   * @param {String} userAgent - user agent.
   * @param {String} userId - Logged in userId.
   * @returns {Object} status and updated message.
   */

  static create(
      solutionId,
      entityId,
      userAgent,
      userId
  ) {
    return new Promise(async (resolve, reject) => {
        try {
            
            let solutionDocument = 
            await solutionsHelper.solutionDocuments(
                {
                    _id : solutionId
                },[
                    "externalId",
                    "frameworkId",
                    "frameworkExternalId",
                    "entityTypeId",
                    "entityType",
                    "programId",
                    "themes",
                    "evidenceMethods",
                    "scoringSystem",
                    "isRubricDriven",
                    "criteriaLevelReport"
                ]
            );

            if( !solutionDocument[0] ) {
                throw {
                    status : httpStatusCode.bad_request.status,
                    message : messageConstants.apiResponses.SOLUTION_NOT_FOUND
                };
            }

            let programDocument = 
            await programsHelper.list(
                {
                    _id : solutionDocument[0].programId
                },
                "all",
                ["_id", "components","isAPrivateProgram"]
            );

            if( !programDocument[0] ) {
                throw {
                    status : httpStatusCode.bad_request.status,
                    message : messageConstants.apiResponses.PROGRAM_NOT_FOUND
                }
            }

            let entityDocument = 
            await entitiesHelper.entityDocuments({
                _id : entityId
            },
            [
                "metaInformation",
                "entityTypeId",
                "entityType",
                "registryDetails"
            ]);

            if( !entityDocument[0] ) {
                throw {
                    status : httpStatusCode.bad_request.status,
                    message : messageConstants.apiResponses.ENTITY_NOT_FOUND
                }
            }

            if (entityDocument[0].registryDetails && Object.keys(entityDocument[0].registryDetails).length > 0) {
                entityDocument[0].metaInformation.registryDetails = entityDocument.registryDetails;
            }

            let submissionDocumentEvidences = 
            this.evidences(
                solutionDocument[0].evidenceMethods
            );

            let submissionDocumentCriterias = 
            await this.criterias(
                solutionDocument[0].themes
            );

            let submissionData = {
                entityId : entityDocument[0]._id,
                entityExternalId : 
                entityDocument[0].metaInformation.externalId ? 
                entityDocument[0].metaInformation.externalId : "",
                entityInformation : entityDocument[0].metaInformation,
                solutionId : solutionDocument[0]._id,
                solutionExternalId : solutionDocument[0].externalId,
                frameworkId : solutionDocument[0].frameworkId,
                frameworkExternalId : solutionDocument[0].frameworkExternalId,
                entityTypeId : solutionDocument[0].entityTypeId,
                entityType : solutionDocument[0].entityType,
                programId : solutionDocument[0].programId,
                scoringSystem : solutionDocument[0].scoringSystem,
                isRubricDriven : solutionDocument[0].isRubricDriven,
                programExternalId: programDocument[0].externalId,
                isAPrivateProgram : programDocument[0].isAPrivateProgram, 
                programInformation : programDocument[0],
                evidenceSubmissions : [],
                entityProfile : {},
                status: "started",
                evidences : submissionDocumentEvidences,
                criteria : submissionDocumentCriterias,
                evidencesStatus : Object.values(submissionDocumentEvidences)
            };

            if( solutionDocument.hasOwnProperty("criteriaLevelReport") ) {
                submissionData["criteriaLevelReport"] = solutionDocument["criteriaLevelReport"];
            }

            let submissionDoc = await this.createASubmission(
                submissionData,
                userAgent,
                userId
            );

            this.pushInCompleteSubmissionForReporting(submissionDoc._id);
            
            return resolve({
                message : messageConstants.apiResponses.SUBMISSION_CREATED,
                result : {
                    _id : submissionDoc._id,
                    title : submissionDoc.title,
                    submissionNumber : submissionDoc.submissionNumber
                }
            });

        } catch (error) {
            return reject(error);
        }
    })
  }

   /**
   * Create new submission.
   * @method
   * @name createASubmission
   * @param {Object} submissionData - submission data.
   * @param {String} userAgent - user agent.
   * @param {String} userId - user id.
   * @returns {Object} Create new submission.
   */

  static createASubmission( submissionData, userAgent,userId ) {
      return new Promise(async (resolve,reject)=>{
        try {
            
            const lastSubmission = 
            await this.findLastSubmission(
                submissionData.solutionId, 
                submissionData.entityId
            );

            submissionData.submissionNumber = lastSubmission + 1;
            submissionData.assessors = 
            await this.assessors(
                submissionData.solutionId, 
                submissionData.entityId,
                userAgent,
                userId
            );

            let submissionDocument = await database.models.submissions.create(
                submissionData
            );

            resolve(submissionDocument);

        } catch(error) {
            reject(error);
        }
      })
  }

   /**
   * Generate submission evidences.
   * @method
   * @name evidences
   * @param {Object} evidenceMethods - All evidences method.
   * @returns {Object} Generated submission evidences.
   */

  static evidences(evidenceMethods) {
    try {        
        Object.keys(evidenceMethods).forEach(solutionEcm => {
            if( evidenceMethods[solutionEcm].isActive ) {
                evidenceMethods[solutionEcm].startTime = "";
                evidenceMethods[solutionEcm].endTime = "";
                evidenceMethods[solutionEcm].isSubmitted = false;
                evidenceMethods[solutionEcm].submissions = new Array;
            } else {
                delete evidenceMethods[solutionEcm];
            }
        })
    
        return evidenceMethods;

    } catch(error) {
        
        return {
            message : error
        }
    }
  }

    /**
   * Generate submission criterias.
   * @method
   * @name criterias
   * @param {Object} themes - solution themes.
   * @returns {Object} Generated submission criterias.
   */

  static criterias( 
      themes
    ) {
      return new Promise( async (resolve,reject)=> {
          try {
            
            let criteriaIdArray = 
            gen.utils.getCriteriaIdsAndWeightage(
                themes
            );

            let criteriaId = new Array;
            let criteriaObject = {};

            criteriaIdArray.forEach(eachCriteriaId => {
                criteriaId.push(eachCriteriaId.criteriaId);
                criteriaObject[eachCriteriaId.criteriaId.toString()] = {
                    weightage: eachCriteriaId.weightage
                };
            });

            let criteriaQuestionDocument = 
            await criteriaQuestionsHelper.list(
                { _id: { $in: criteriaId } },
                "all",
                [
                    "resourceType",
                    "language",
                    "keywords",
                    "concepts",
                    "createdFor",
                    "evidences"
                ]
            );

            let submissionDocumentCriterias = 
            criteriaQuestionDocument.map(criteria => {

                criteria.weightage = 
                criteriaObject[criteria._id.toString()].weightage;

                return criteria;

            });

            return resolve(submissionDocumentCriterias)

          } catch(error) {
              reject(error);
          }
      })
  }

  /**
   * Generate assessors for submission.
   * @method
   * @name assessors
   * @param {String} solutionId - solution id.
   * @param {String} entityId - entity id.
   * @param {String} userAgent - user agent.
   * @param {String} userId - user id.
   * @returns {Object} Generate assessors for submission.
   */

  static assessors(solutionId,entityId,userAgent,userId) {
    return new Promise( async (resolve,reject)=> {
        try {

            let assessorDocument = 
            await entityAssessorsHelper.assessorsDocument({
                solutionId : solutionId,
                entities : entityId
            });

            let assessorElement = assessorDocument.find(
                assessor => assessor.userId === userId
            );
            
            if (assessorElement && assessorElement.externalId != "") {
                assessorElement.assessmentStatus = "started";
                assessorElement.userAgent = userAgent;
            }

            resolve(assessorDocument);

        } catch(error) {
            reject(error);
        }
    })
  }

    /**
   * Find last submission.
   * @method
   * @name findLastSubmission
   * @param {String} solutionId - solution id.
   * @param {String} entityId - entity id.
   * @returns {Object} last submission number
   */

  static findLastSubmission(solutionId,entityId) {
    return new Promise( async (resolve,reject)=> {
        try {
            
            let submissionDocument = 
            await this.submissionDocuments(
                {
                    solutionId : solutionId,
                    entityId : entityId
                },[
                    "submissionNumber"
                ],
                "none",
                { createdAt: -1 },
                1 
            );

            return resolve(
                submissionDocument[0] && submissionDocument[0].submissionNumber ?
                submissionDocument[0].submissionNumber : 0
            );

        } catch(error) {
            reject(error);
        }
    })
  }

    /**
   * Return criteria from submissions.
   * @method
   * @name getCriteria
   * @param {String} submissionId - submission id.
   * @returns {JSON} consists of criteria of submission
   */

    static getCriteria(submissionId) {
        return new Promise(async (resolve, reject) => {
            try {

                if (submissionId == "") {
                    throw messageConstants.apiResponses.SUBMISSION_ID_NOT_FOUND;
                }

                if(typeof submissionId == "string") {
                    submissionId = ObjectId(submissionId);
                }

                let submissionsDocument = await database.models.submissions.findOne({
                    _id: submissionId
                },{
                    criteria : 1
                }).lean();

                if (!submissionsDocument) {
                    throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;
                }

                return resolve({
                    success : true,
                    message : "Submission criteria fetched successfully.",
                    data : submissionsDocument.criteria
                });

            } catch (error) {
                return resolve({
                    success : false,
                    message : error.message
                });
            }
        })
    }

     /**
    * List submissions
    * @method
    * @name list
    * @param {String} entityId - entity id.
    * @param {String} solutionId - solution id.
    * @returns {Object} - list of submissions
    */

   static list(entityId,solutionId) {
    return new Promise(async (resolve, reject) => {
        try {
            
            let queryObject = {
                entityId: entityId,
                solutionId : solutionId
            };

            let projection = [
                "status",
                "submissionNumber",
                "entityId",
                "entityExternalId",
                "entityType",
                "createdAt",
                "updatedAt",
                "title",
                "completedDate"
            ];

            let result = await this.submissionDocuments
            (
                 queryObject,
                 projection,
                 "none",
                 {
                     "createdAt" : -1 
                }
            );

            if( !result.length > 0 ) {
                return resolve({
                    status : httpStatusCode.bad_request.status,
                    message : messageConstants.apiResponses.SUBMISSION_NOT_FOUND,
                    result : []
                });
            }

            result = result.map(resultedData=>{
                resultedData.submissionDate = 
                resultedData.completedDate ? 
                resultedData.completedDate : "";

                return _.omit(resultedData,["completedDate"]);
            })

            return resolve({
                message : messageConstants.apiResponses.SUBMISSION_LIST_FETCHED,
                result : result
            });

        } catch (error) {
            return reject(error);
        }
    });
   }


    /**
    * Get criteria questions 
    * @method
    * @name getCriteriaQuestions
    * @param {String} submissionId - submissionId.
    * @returns {Object} - Criteria questions and answers 
    */

    static getCriteriaQuestions(submissionId = "") {
        return new Promise(async (resolve, reject) => {
            try {

                if (submissionId == "") {
                    throw new Error(messageConstants.apiResponses.SUBMISSION_ID_IS_REQUIRED);
                }

                let result = {};

                let queryObject = {
                    _id: submissionId,
                    status: messageConstants.common.SUBMISSION_STATUS_RATING_PENDING,
                    scoringSystem: messageConstants.common.MANUAL_RATING,
                    isRubricDriven : true,
                    answers : {
                        $exists : true
                    }
                };

                let projection = [
                    "answers",
                    "criteria._id",
                    "criteria.name",
                    "solutionId"
                ];

                let submissionDocument = await this.submissionDocuments
                    (
                        queryObject,
                        projection
                    );
                
                if (!submissionDocument.length > 0) {
                    throw new Error(messageConstants.apiResponses.SUBMISSION_NOT_FOUND);
                }

                let criteriaIdMap = _.keyBy(submissionDocument[0].criteria, '_id');

                let criteriaQuestionObject = {};
                let questionIdArray = [];
                let fileSourcePath = [];

                if (submissionDocument[0]["answers"] && Object.keys(submissionDocument[0].answers).length > 0) {
                    Object.values(submissionDocument[0].answers).forEach(async answer => {
                        if (answer.qid) {
                            questionIdArray.push(answer.qid);
                            if (answer.fileName && answer.fileName.length > 0) {
                                answer.fileName.forEach(file => {
                                    fileSourcePath.push(file.sourcePath);
                                });
                            }
                        }
                    })
                }
                
                let questionDocuments = await questionsHelper.questionDocument
                    (
                        {
                            _id: { $in: questionIdArray }
                        },
                        [
                            "question",
                            "options"
                        ]
                    );

                let questionIdMap = _.keyBy(questionDocuments, '_id');
                
                let filePathToURLMap = {};
                if (fileSourcePath.length > 0) {
                    let evidenceUrls = await kendraService.getDownloadableUrl(
                        {
                            filePaths: fileSourcePath
                        }
                    );
                    if (evidenceUrls.status == httpStatusCode.ok.status) {
                        filePathToURLMap = _.keyBy(evidenceUrls.result, 'filePath');
                    }
                }

                result.criteria = [];

                if (Object.keys(submissionDocument[0].answers).length > 0) {

                    Object.values(submissionDocument[0].answers).forEach(async answer => {

                        if (answer.criteriaId && answer.qid && answer.responseType !== "matrix") {

                            if (!criteriaQuestionObject[answer.criteriaId]) {
                                criteriaQuestionObject[answer.criteriaId] = {};
                                criteriaQuestionObject[answer.criteriaId]["id"] = answer.criteriaId;
                                criteriaQuestionObject[answer.criteriaId]["name"] = criteriaIdMap[answer.criteriaId].name;
                                criteriaQuestionObject[answer.criteriaId]["score"] = "";
                                criteriaQuestionObject[answer.criteriaId]["questions"] = [];

                                result.criteria.push({
                                    id: answer.criteriaId,
                                    name: criteriaIdMap[answer.criteriaId].name
                                })
                            }

                            let questionAnswerObj = {};

                            questionAnswerObj.questionId = answer.qid;
                            questionAnswerObj.responseType = answer.responseType ? answer.responseType : "";
                            questionAnswerObj.question = questionIdMap[answer.qid]["question"];
                            questionAnswerObj.value = [];
                            questionAnswerObj.remarks = (answer.remarks) ? [answer.remarks] : [];
                            questionAnswerObj.evidences = {
                                images: [],
                                videos: [],
                                documents: []
                            };

                            if (answer.fileName && answer.fileName.length > 0) {
                                
                                answer.fileName.forEach(file => {

                                    let extension = path.extname(file.sourcePath).split('.').join("");

                                    if (messageConstants.common.IMAGE_FORMATS.includes(extension)) {
                                        questionAnswerObj.evidences.images.push({
                                            filePath: file.sourcePath,
                                            url: filePathToURLMap[file.sourcePath]["url"],
                                            extension: extension
                                        })
                                    } else if (messageConstants.common.VIDEO_FORMATS.includes(extension)) {
                                        questionAnswerObj.evidences.videos.push({
                                            filePath: file.sourcePath,
                                            url: filePathToURLMap[file.sourcePath]["url"],
                                            extension: extension
                                        })
                                    } else {
                                        questionAnswerObj.evidences.documents.push({
                                            filePath: file.sourcePath,
                                            url: filePathToURLMap[file.sourcePath]["url"],
                                            extension: extension
                                        })
                                    }
                                })
                            } else {
                                delete questionAnswerObj.evidences;
                            }

                            if (answer.responseType == "radio" || answer.responseType == "multiselect") {
                                if(Array.isArray(answer.instanceResponses) && answer.instanceResponses.length >0) {
                                    answer.value = answer.instanceResponses;
                                } else if (answer.responseType == "radio") {
                                    answer.value = [answer.value];
                                }
                                
                                if (questionIdMap[answer.qid]["options"].length > 0 && answer.value.length > 0) {
                                    answer.value.forEach(singleValue => {
                                        questionIdMap[answer.qid]["options"].forEach(option => {
                                            if (singleValue == option.value) {
                                                questionAnswerObj.value.push(option.label);
                                            }
                                        })
                                    })
                                }
                            } else {
                                questionAnswerObj.value.push(answer.value);
                            }

                            criteriaQuestionObject[answer.criteriaId].questions.push(questionAnswerObj);
                            
                        }

                    });

                    result.criteriaQuestions = Object.values(criteriaQuestionObject)
                    result.levelToScoreMapping = [];

                    let solutionDocument = await solutionsHelper.solutionDocuments
                        (
                            { _id: submissionDocument[0].solutionId },
                            [
                                "levelToScoreMapping"
                            ]
                        );

                    if (solutionDocument.length > 0 && Object.keys(solutionDocument[0].levelToScoreMapping).length > 0) {
                        Object.keys(solutionDocument[0].levelToScoreMapping).forEach(level => {
                            result.levelToScoreMapping.push({
                                level: level,
                                points: solutionDocument[0].levelToScoreMapping[level].points,
                                label: solutionDocument[0].levelToScoreMapping[level].label
                            })
                        });
                    }
                   
                    await database.models.submissions.update(
                        { _id: submissionId },
                        {
                            $set: {
                                "numberOfAnsweredCriterias" : Object.keys(criteriaQuestionObject).length
                            }
                        }
                    );
                    
                    return resolve({
                        message: messageConstants.apiResponses.CRITERIA_QUESTIONS_FETCHED_SUCCESSFULLY,
                        success: true,
                        data: result
                    })

                } else {
                    throw new Error(messageConstants.apiResponses.CRITERIA_QUESTIONS_COULD_NOT_BE_FOUND);
                }

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
    * manual rating 
    * @method
    * @name manualRating
    * @param {String} submissionId - submissionId
    * @param {Object} criteriaObject - An object of critieria id to level value
    * @param {String} userId - ID of the user who is submitting the manual rating
    * @returns {String} - success message
    */

    static manualRating(submissionId = "", criteriaObject = {}, userId = "") {
        return new Promise(async (resolve, reject) => {
            try {

                if (submissionId == "") {
                    throw new Error(messageConstants.apiResponses.SUBMISSION_ID_IS_REQUIRED);
                }

                if (Object.keys(criteriaObject).length === 0) {
                    throw new Error(messageConstants.apiResponses.CRITERIA_OBJECT_MISSING);
                }

                if (userId == "") {
                    throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK);
                }

                let queryObject = {
                    _id: submissionId,
                    scoringSystem: messageConstants.common.MANUAL_RATING,
                    status: messageConstants.common.SUBMISSION_STATUS_RATING_PENDING,
                    "assessors.userId": userId,
                    "assessors.role": messageConstants.common.LEAD_ASSESSOR,
                    numberOfAnsweredCriterias: Object.keys(criteriaObject).length
                };

                let projection = [
                    "criteria._id"
                ];

                let submissionDocument = await this.submissionDocuments
                    (
                        queryObject,
                        projection,
                    );

                if (!submissionDocument.length > 0) {
                    throw new Error(messageConstants.apiResponses.SUBMISSION_NOT_FOUND)
                }

                if (submissionDocument[0]["criteria"] && submissionDocument[0].criteria.length > 0) {

                    let submissionUpdateObject  = {};

                    for (let pointerToSubmissionCriteriaArray = 0; pointerToSubmissionCriteriaArray < submissionDocument[0].criteria.length; pointerToSubmissionCriteriaArray++) {
                        const criteria = submissionDocument[0].criteria[pointerToSubmissionCriteriaArray];
                        if(criteriaObject[criteria._id.toString()]) {
                            submissionUpdateObject[`criteria.${pointerToSubmissionCriteriaArray}.score`] = criteriaObject[criteria._id.toString()];
                        }
                    }
                    
                    submissionUpdateObject.status = messageConstants.common.SUBMISSION_STATUS_COMPLETED;
                    submissionUpdateObject.ratingCompletedAt = new Date();
                    submissionUpdateObject.completedDate = new Date();
                    
                    await database.models.submissions.updateOne(
                        { _id: submissionId },
                        {
                            $set: submissionUpdateObject
                        }
                    );

                    await this.pushCompletedSubmissionForReporting(submissionId);

                    return resolve({
                        success: true,
                        message: messageConstants.apiResponses.MANUAL_RATING_SUBMITTED_SUCCESSFULLY,
                        data: true
                    })

                } else {
                    throw new Error(messageConstants.apiResponses.SUBMISSION_CRITERIA_NOT_FOUND)
                }

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
   * Push submission to improvement service.
   * @method
   * @name pushSubmissionToImprovementService
   * @param {String} submissionDocument - submission document.
   * @returns {JSON} consists of kafka message whether it is pushed for reporting
   * or not.
   */

  static pushSubmissionToImprovementService(submissionDocument) {
    return new Promise(async (resolve, reject) => {
        try {

            let submissionData = {
                taskId : submissionDocument.project.taskId,
                projectId : submissionDocument.project._id,
                _id : submissionDocument._id,
                status : submissionDocument.status
            };

            if( submissionDocument.completedDate ) {
                submissionData["submissionDate"] = submissionDocument.completedDate;
            }
            const kafkaMessage = 
            await kafkaClient.pushSubmissionToImprovementService(submissionData);

            if(kafkaMessage.status != "success") {
                let errorObject = {
                    formData: {
                        submissionId:submissionDocument._id.toString(),
                        message:kafkaMessage.message
                    }
                };

                console.log(errorObject);
            }

            return resolve(kafkaMessage);

        } catch (error) {
            return reject(error);
        }
    })
  }

   /**
   * Add app information in submissions
   * @method
   * @name addAppInformation
   * @param {String} submissionId - submission id.
   * @param {Object} appInformation - App information
   * @param {String} modelName - submission model
   * @returns {JSON} Updated appInformation message
   */

  static addAppInformation( submissionId,appInformation,modelName ) {
    return new Promise(async (resolve, reject) => {
        try {

            let appDetails = {};

            if( appInformation.appName) {
                appDetails["appName"] = appInformation.appName;
            }

            if( appInformation.appVersion ) {
                appDetails["appVersion"] = appInformation.appVersion;
            }

            if( Object.keys(appDetails).length > 0 ) {

                await database.models[modelName].findOneAndUpdate(
                    {
                        _id : submissionId
                    },
                    {
                        $set : { appInformation : appDetails }
                    }
                );
            }
            return resolve({
                message : messageConstants.apiResponses.APP_INFORMATION_ADDED
            });

        } catch (error) {
            return reject(error);
        }
    })
  }

   /**
   * Check whether submission is allowed or not.
   * @method
   * @name isAllowed
   * @param {String} submissionId - submission id.
   * @param {String} evidenceId - evidence method id.
   * @param {String} modelName - submission model name.
   * @returns {JSON} Submissions allowed or not.
   */

    static isAllowed(submissionId, evidenceId,modelName) {
        return new Promise(async (resolve, reject) => {
            try {
    
                let result = {
                    allowed: true
                };

                let queryObject =  { 
                    "_id": submissionId,
                    "evidencesStatus": { "$elemMatch": { externalId: evidenceId }}
                };

                let projection =  ["evidencesStatus.$"];
                let submissionDocument = {};

                if( modelName === messageConstants.common.OBSERVATION_SUBMISSIONS ) {
                    submissionDocument = await observationSubmissionsHelper.observationSubmissionsDocument
                    (
                        queryObject,
                        projection 
                    );
                } else {
                    submissionDocument = await this.submissionDocuments
                    (
                        queryObject,
                        projection 
                    );
                }
                
                if (!submissionDocument.length) {
                    throw new Error(messageConstants.apiResponses.SUBMISSION_NOT_FOUND)
                }
    
                if ( submissionDocument[0].evidencesStatus[0].isSubmitted ) {
                    result.allowed = false;
                }
    
                return resolve({
                    success: true,
                    message: result.allowed ? 
                    messageConstants.apiResponses.SUBMISSION_ALLOWED : 
                    messageConstants.apiResponses.SUBMISSION_NOT_ALLOWED,
                    result: result
                });
            }
      
            catch (error) {
                return resolve({
                    success: false,
                    message: error.message,
                    data: false
                })
            }
        })
    }

};

