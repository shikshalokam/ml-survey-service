/**
 * name : observationSubmissions/helper.js
 * author : Akash
 * created-date : 20-Jan-2019
 * Description : Observations Submissions helper functionality.
 */

// Dependencies

let kafkaClient = require(ROOT_PATH + "/generics/helpers/kafkaCommunications");
const emailClient = require(ROOT_PATH + "/generics/helpers/emailCommunications");
const scoringHelper = require(MODULES_BASE_PATH + "/scoring/helper")
const criteriaHelper = require(MODULES_BASE_PATH + "/criteria/helper")
const questionsHelper = require(MODULES_BASE_PATH + "/questions/helper")
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper")
const solutionHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const criteriaQuestionHelper = require(MODULES_BASE_PATH + "/criteriaQuestions/helper");
const programsHelper = require(MODULES_BASE_PATH + "/programs/helper");

/**
    * ObservationSubmissionsHelper
    * @class
*/
module.exports = class ObservationSubmissionsHelper {

      /**
   * List of observation submissions
   * @method
   * @name observationSubmissionsDocument
   * @param {Object} [findQuery = "all"] - filtered data.
   * @param {Array} [fields = "all"] - projected data.
   * @param {Array} [sortedData = "all"] - sorted field.
   * @param {Array} [skipFields = "none"] - fields to skip.
   * @returns {Array} - List of observation submissions data.
   */

  static observationSubmissionsDocument(
      findQuery = "all", 
      fields = "all",
      sortedData = "all",
      skipFields = "none"
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

            if ( sortedData !== "all" ) {
                
                submissionDocuments = 
                await database.models.observationSubmissions.find(
                    queryObject, 
                    projection
                ).sort(sortedData).lean();

            } else {
                
                submissionDocuments = 
                await database.models.observationSubmissions.find(
                    queryObject, 
                    projection
                ).lean();
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
   * Push observation submission in kafka for reporting.
   * @method
   * @name pushObservationSubmissionForReporting
   * @param {String} observationSubmissionId - observation submission id.
   * @returns {JSON} - message that observation submission is pushed to kafka.
   */

    static pushObservationSubmissionForReporting(observationSubmissionId) {
        return new Promise(async (resolve, reject) => {
            try {

                if (observationSubmissionId == "") {
                    throw "No observation submission id found";
                }

                if( typeof observationSubmissionId == "string" ) {
                    observationSubmissionId = ObjectId(observationSubmissionId);
                }

                const observationSubmissionsDocument = await this.details(observationSubmissionId);

                if(observationSubmissionsDocument.status == "completed" && observationSubmissionsDocument.referenceFrom === messageConstants.common.PROJECT ) {
                    
                    await this.pushSubmissionToImprovementService(
                        _.pick(
                            observationSubmissionsDocument,["project","status","_id","completedDate"]
                        )
                    );
                }

               
                console.log("--- logs starts here -----");
                const kafkaMessage = await kafkaClient.pushObservationSubmissionToKafka(observationSubmissionsDocument);
               
                if(kafkaMessage.status != "success") {
                    let errorObject = {
                        formData: {
                            observationSubmissionId:observationSubmissionsDocument._id.toString(),
                            message:kafkaMessage.message
                        }
                    };
                    console.log(errorObject);
                }

                console.log("--logs ends here---")

                return resolve(kafkaMessage);

            } catch (error) {
                return reject({
                    success: false,
                    message: error.message,
                    data: {}
                    
                });
            }
        })
    }


     /**
   * Push observation submission to queue for rating.
   * @method
   * @name pushObservationSubmissionToQueueForRating
   * @param {String} [observationSubmissionId = ""] -observation submission id.
   * @returns {JSON} - message
   */

    static pushObservationSubmissionToQueueForRating(observationSubmissionId = "") {
        return new Promise(async (resolve, reject) => {
            try {

                if (observationSubmissionId == "") {
                    throw messageConstants.apiResponses.OBSERVATION_SUBMISSION_ID_NOT_FOUND;
                }


                if(typeof observationSubmissionId !== "string") {
                    observationSubmissionId = observationSubmissionId.toString();
                }

                const kafkaMessage = await kafkaClient.pushObservationSubmissionToKafkaQueueForRating({submissionModel : "observationSubmissions",submissionId : observationSubmissionId});

                if(kafkaMessage.status != "success") {
                    let errorObject = {
                        formData: {
                            submissionId:observationSubmissionId,
                            submissionModel:"observationSubmissions",
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
     * @param {String} [submissionId = ""] -submission id.
     * @returns {JSON} - message
     */

    static rateSubmissionById(submissionId = "") {
        return new Promise(async (resolve, reject) => {

            let emailRecipients = (process.env.SUBMISSION_RATING_DEFAULT_EMAIL_RECIPIENTS && process.env.SUBMISSION_RATING_DEFAULT_EMAIL_RECIPIENTS != "") ? process.env.SUBMISSION_RATING_DEFAULT_EMAIL_RECIPIENTS : "";

            try {
               
                if (submissionId == "") {
                    throw new Error(messageConstants.apiResponses.OBSERVATION_SUBMISSION_ID_NOT_FOUND);
                }

                let submissionDocument = await database.models.observationSubmissions.findOne(
                    {_id : ObjectId(submissionId)},
                    { "answers": 1, "criteria": 1, "evidencesStatus": 1, "entityInformation": 1, "entityProfile": 1, "solutionExternalId": 1, "programExternalId": 1, "scoringSystem": 1 }
                ).lean();
        
                if (!submissionDocument._id) {
                    throw new Error(messageConstants.apiResponses.OBSERVATION_SUBMISSSION_NOT_FOUND);
                }

               
                let solutionDocument = await solutionHelper.solutionDocuments({
                    externalId: submissionDocument.solutionExternalId,
                    type : "observation"
                }, [ "themes","levelToScoreMapping","scoringSystem","flattenedThemes","sendSubmissionRatingEmailsTo"]);
    
                if (!solutionDocument.length) {
                    throw new Error(messageConstants.apiResponses.SOLUTION_NOT_FOUND);
                }
                solutionDocument = solutionDocument[0];
              
                if(solutionDocument.sendSubmissionRatingEmailsTo && solutionDocument.sendSubmissionRatingEmailsTo != "") {
                    emailRecipients = solutionDocument.sendSubmissionRatingEmailsTo;
                }

                submissionDocument.submissionCollection = "observationSubmissions";
                // submissionDocument.scoringSystem = "pointsBasedScoring";

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
                            ]);

                    }

                    if (solutionQuestions.length > 0) {
                        submissionDocument.questionDocuments = {};
                        solutionQuestions.forEach(question => {
                            submissionDocument.questionDocuments[question._id.toString()] = {
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
                                        submissionDocument.questionDocuments[question._id.toString()][`${option.value}-score`] =
                                        option.score : "";
                                    }
                                    // (option.score && option.score >= 0) ? submissionDocument.questionDocuments[question._id.toString()][`${option.value}-score`] = option.score : "";
                                })
                            }
                            if (question.sliderOptions && question.sliderOptions.length > 0) {
                                questionMaxScore = _.maxBy(question.sliderOptions, 'score').score;
                                submissionDocument.questionDocuments[question._id.toString()].sliderOptions = question.sliderOptions;
                            }
                            submissionDocument.questionDocuments[question._id.toString()].maxScore = (typeof questionMaxScore === "number") ? questionMaxScore : 0;
                        })
                    }
                }

                let resultingArray = await scoringHelper.rateEntities([submissionDocument], "singleRateApi");

                if(resultingArray.result.runUpdateQuery) {
                    await database.models.observationSubmissions.updateOne(
                        {
                            _id: ObjectId(submissionId)
                        },
                        {
                            status: "completed",
                            completedDate: new Date()
                        }
                    );
                    await this.pushObservationSubmissionForReporting(submissionId);
                    // emailClient.pushMailToEmailService(emailRecipients,messageConstants.apiResponses.OBSERVATION_AUTO_RATING_SUCCESS+" - "+submissionId,JSON.stringify(resultingArray));
                    return resolve(messageConstants.apiResponses.OBSERVATION_RATING);
                } else {
                    // emailClient.pushMailToEmailService(emailRecipients,messageConstants.apiResponses.OBSERVATION_AUTO_RATING_FAILED+" - "+submissionId,JSON.stringify(resultingArray));
                    return resolve(messageConstants.apiResponses.OBSERVATION_RATING);
                }

            } catch (error) {

                // emailClient.pushMailToEmailService(emailRecipients,messageConstants.apiResponses.OBSERVATION_AUTO_RATING_FAILED+" - "+submissionId,error.message);
                return reject(error);
            }
        })
    }

    /**
     * Mark observation submission complete and push to Kafka.
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
                    throw new Error(messageConstants.apiResponses.OBSERVATION_SUBMISSION_ID_NOT_FOUND);
                } else if (typeof submissionId !== "string") {
                    submissionId = submissionId.toString()
                }

                let submissionDocument = await database.models.observationSubmissions.findOne(
                    {_id : ObjectId(submissionId)},
                    { "_id": 1}
                ).lean();
        
                if (!submissionDocument._id) {
                    throw new Error(messageConstants.apiResponses.OBSERVATION_SUBMISSSION_NOT_FOUND);
                }

                let observationSubmissionUpdated = await database.models.observationSubmissions.updateOne(
                    {
                        _id: ObjectId(submissionId)
                    },
                    {
                        status: "completed",
                        completedDate: new Date()
                    }
                );
                
                await this.pushObservationSubmissionForReporting(submissionId);
                
                // emailClient.pushMailToEmailService(emailRecipients,"Successfully marked submission " + submissionId + "complete and pushed for reporting","NO TEXT AVAILABLE");
                return resolve(messageConstants.apiResponses.OBSERVATION_RATING);

            } catch (error) {
                // emailClient.pushMailToEmailService(emailRecipients,messageConstants.apiResponses.OBSERVATION_AUTO_RATING_FAILED+" - "+submissionId,error.message);
                return reject(error);
            }
        })
    }

    /**
    * List observation submissions
    * @method
    * @name list
    * @param {String} - entityId
    * @param {String} - solutionId
    * @param {String} - observationId
    * @returns {Object} - list of submissions
    */

   static list(entityId,observationId) {
    return new Promise(async (resolve, reject) => {
        try {
            
            let queryObject = {
                entityId: entityId,
                observationId: observationId
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
                "completedDate",
                "ratingCompletedAt",
                "observationInformation.name",
                "observationId",
                "scoringSystem",
                "isRubricDriven",
                "criteriaLevelReport",
                "evidencesStatus.name", 
                "evidencesStatus.externalId", 
                "evidencesStatus.isSubmitted", 
                "evidencesStatus.submissions",
                "evidencesStatus.canBeNotApplicable",
                "evidencesStatus.canBeNotAllowed",
                "evidencesStatus.notApplicable",
            ];
            let result = await this.observationSubmissionsDocument
            (
                 queryObject,
                 projection,
                 {
                     "createdAt" : -1 
                }
            );
            
            if( !result.length > 0 ) {
                return resolve({
                    status : httpStatusCode.ok.status,
                    message : messageConstants.apiResponses.SUBMISSION_NOT_FOUND,
                    result : []
                })
            }

            result = result.map(resultedData => {
                resultedData.observationName =  
                resultedData.observationInformation && resultedData.observationInformation.name ? 
                resultedData.observationInformation.name : "";

                resultedData.submissionDate = resultedData.completedDate ? resultedData.completedDate : "";
                resultedData.ratingCompletedAt = resultedData.ratingCompletedAt ? resultedData.ratingCompletedAt : "";

                resultedData.evidencesStatus = 
                resultedData.evidencesStatus.map(evidence=>{ 
                        
                    let evidenceStatus = {
                        name : evidence.name,
                        code : evidence.externalId,
                        status : messageConstants.common.SUBMISSION_STATUS_COMPLETED,
                        canBeNotApplicable : evidence.canBeNotApplicable,
                        canBeNotAllowed : evidence.canBeNotAllowed,
                        notApplicable : evidence.notApplicable
                    };

                    if( !evidence.isSubmitted ){ 
                        evidenceStatus["status"] = 
                        evidence.submissions.length > 0 ? 
                        messageConstants.common.DRAFT :
                        messageConstants.common.SUBMISSION_STATUS_NOT_STARTED;
                    }

                    return evidenceStatus;
                }); 

                delete resultedData.observationInformation;
                return _.omit(resultedData,["completedDate"]);
            })

            return resolve({
                message : messageConstants.apiResponses.OBSERVATION_SUBMISSIONS_LIST_FETCHED,
                result : result
            })
        } catch (error) {
            return reject(error);
        }
    });
   }


    /**
    * Check if observation submission is allowed.
    * @method
    * @name isAllowed
    * @param {String} submissionId - observation submissionId
    * @param {String} evidenceId - evidence id
    * @param {String} userId - logged in userId
    * @returns {Json} - submission allowed or not.
    */

   static isAllowed(submissionId = "", evidenceId = "", userId = "") {
    return new Promise(async (resolve, reject) => {
        try {

            if (submissionId == "") {
                throw new Error(messageConstants.apiResponses.OBSERVATION_SUBMISSION_ID_REQUIRED)
            }

            if (evidenceId == "") {
                throw new Error(messageConstants.apiResponses.EVIDENCE_ID_REQUIRED)
            }

            if (userId == "") {
                throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK)
            }

            let result = {
                allowed: true
            };

            let submissionDocument = await this.observationSubmissionsDocument
            (
                { "_id": submissionId,
                  "evidencesStatus": {"$elemMatch": {externalId: evidenceId}}
                },
                [
                    "evidencesStatus.$"
                ]
            );
            
            if (!submissionDocument.length) {
                throw new Error(messageConstants.apiResponses.SUBMISSION_NOT_FOUND)
            }

            if (submissionDocument[0].evidencesStatus[0].isSubmitted && submissionDocument[0].evidencesStatus[0].isSubmitted == true) {
                submissionDocument[0].evidencesStatus[0].submissions.forEach(submission => {
                    if (submission.submittedBy == userId) {
                        result.allowed = false;
                    }
                })
            }

            return resolve({
                success: true,
                message: messageConstants.apiResponses.OBSERVATION_SUBMISSION_CHECK,
                data: result
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


    /**
    * Get observation submission status.
    * @method
    * @name status
    * @param {String} submissionId - observation submissionId
    * @returns {Json} - submission status.
    */

   static status(submissionId = "") {
    return new Promise(async (resolve, reject) => {
        try {

            if (submissionId == "") {
                throw new Error(messageConstants.apiResponses.OBSERVATION_SUBMISSION_ID_REQUIRED)
            }

            let submissionDocument = await this.observationSubmissionsDocument
            (
                { "_id": submissionId,
                },
                [
                  "status"
                ]
            );
            
            if (!submissionDocument.length) {
                throw new Error(messageConstants.apiResponses.SUBMISSION_NOT_FOUND)
            }

            return resolve({
                success: true,
                message: messageConstants.apiResponses.OBSERVATION_SUBMISSION_STATUS_FETCHED,
                data: {
                    status: submissionDocument[0].status
                }
            });
        }
  
        catch (error) {
            return resolve({
                success: false,
                message: error,
                data: false
            })
        }
    })
}   
       /**
   * Push observation submission to improvement service.
   * @method
   * @name pushSubmissionToImprovementService
   * @param {String} observationSubmissionDocument - observation submission document.
   * @returns {JSON} consists of kafka message whether it is pushed for reporting
   * or not.
   */

  static pushSubmissionToImprovementService(observationSubmissionDocument) {
    return new Promise(async (resolve, reject) => {
        try {

            let observationSubmissionData = {
                taskId : observationSubmissionDocument.project.taskId,
                projectId : observationSubmissionDocument.project._id,
                _id : observationSubmissionDocument._id,
                status : observationSubmissionDocument.status
            }

            if( observationSubmissionDocument.completedDate ) {
                observationSubmissionData["submissionDate"] = 
                observationSubmissionDocument.completedDate;
            }

            const kafkaMessage = 
            await kafkaClient.pushSubmissionToImprovementService(observationSubmissionData);

            if(kafkaMessage.status != "success") {
                let errorObject = {
                    formData: {
                        submissionId:observationSubmissionDocument._id.toString(),
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
    * Disable Observation Submission Based on Solution Id
    * @method
    * @name disable
    * @param {String} submissionId - observation submissionId
    * @returns {Json} - submission status.
    */

   static disable(solutionId = "") {
        return new Promise(async (resolve, reject) => {
            try {

                if (solutionId == "") {
                    throw new Error(messageConstants.apiResponses.SOLUTION_ID_REQUIRED)
                }

                let submissionDocument = await this.observationSubmissionsDocument({
                    "solutionId" : ObjectId(solutionId) 
                },["observationId"]);

                if(!submissionDocument.length > 0){
                    throw new Error(messageConstants.apiResponses.SUBMISSION_NOT_FOUND)
                }

                let observationId = [];
                observationId = submissionDocument.map(submission => submission.observationId);

                if(observationId && observationId.length > 0){

                    let removeObservation = await database.models.observations.updateMany({
                        _id : {$in : observationId}
                    },
                    {
                        $set : { status : messageConstants.common.INACTIVE_STATUS}
                    }).lean();

                }


                let updateSubmissionDocument = await database.models.observationSubmissions.updateMany({
                    "solutionId" : ObjectId(solutionId) 
                },
                {
                    $set : { status : messageConstants.common.INACTIVE_STATUS}
                }).lean();


                if (!updateSubmissionDocument || updateSubmissionDocument.nModified < 1 ) {
                    throw new Error(messageConstants.apiResponses.SUBMISSION_NOT_FOUND)
                }

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.OBSERVATION_SUBMISSION_DiSABLED,
                    data: false
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
    
    /**
   * Delete Observation submissions.
   * @method
   * @name delete
   * @param {String} submissionId -observation submissions id.
   * @param {String} userId - logged in user id.
   * @returns {JSON} - message that observation submission is deleted.
   */

  static delete(submissionId,userId) {
    return new Promise(async (resolve, reject) => {

      try {

        let message = messageConstants.apiResponses.OBSERVATION_SUBMISSION_DELETED;

        let submissionDocument = await database.models.observationSubmissions.deleteOne(
          {
            "_id": submissionId,
            status: {$in: ["started","draft"]},
            createdBy: userId
          }
        );

        if (!submissionDocument.n) {
          throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;;
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
   * Set Observation Submission Title.
   * @method
   * @name title
   * @param {String} submissionId -observation submissions id.
   * @param {String} userId - logged in user id.
   * @param {String} title - submission title.
   * @returns {JSON} - message that observation submission title is set.
   */

    static setTitle(submissionId,userId,title) {
        return new Promise(async (resolve, reject) => {
    
          try {
    
            let message = messageConstants.apiResponses.OBSERVATION_SUBMISSION_UPDATED;
    
            let submissionDocument = await database.models.observationSubmissions.findOneAndUpdate(
              {
                _id: submissionId,
                createdBy: userId
              },
              {
                $set : {
                  title : title
                }
              }, {
                projection : {
                  _id : 1
                }
              }
            );
    
            if (!submissionDocument || !submissionDocument._id) {
              throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;;
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
    * Get observation submission solutions.
    * @method
    * @name solutionList
    * @param {String} userId - logged in userId
    * @param {String} pageSize - page size
    * @param {String} pageNo - page number
    * @param {String} search - search key
    * @returns {Json} - returns solutions, entityTypes.
    */

   static solutionList(bodyData, userId = "", entityType = "", pageSize, pageNo) {
    return new Promise(async (resolve, reject) => {
        try {

            if (userId == "") {
                throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK)
            }
            let result = {};
            
            // Search for user roles
            let userRoleFilterArray = new Array;
            bodyData.role.split(",").forEach((eachRole) => {
                userRoleFilterArray.push(new RegExp(eachRole))
            })
            
            let query = {
                createdBy: userId,
                deleted: false,
                status: messageConstants.common.SUBMISSION_STATUS_COMPLETED,
                "userRoleInformation.role" : {
                    $in : userRoleFilterArray
                }
            }

            if (pageNo == 1) {

                let submissions = await this.observationSubmissionsDocument
                (
                   query,
                   [
                    "entityType"
                   ]
                )
                
                if (submissions.length == 0) {
                    return resolve({
                        success: true,
                        message: messageConstants.apiResponses.SOLUTION_NOT_FOUND,
                        data: {
                            entityType: [],
                            data: [],
                            count: 0
                        }
                    });
                }

                let entityTypes = [];
                submissions.forEach(submission => {
                    if (!entityTypes.includes(submission.entityType)) {
                        entityTypes.push(submission.entityType);
                    }
                })
                
                result.entityType = entityTypes;
            }

            if (entityType !== "") {
                query["entityType"] = entityType;
            }

            let matchQuery = {
                $match: query
            };
           
            let aggregateData = [];
            aggregateData.push(matchQuery);

            aggregateData.push(
                {
                  $group : {
                    _id: "$solutionId"
                }},
                { $sort: { createdAt: -1, _id: -1}},
                {
                    $facet: {
                        "totalCount": [
                            { "$count": "count" }
                        ],
                        "data": [
                            { $skip: pageSize * (pageNo - 1) },
                            { $limit: pageSize }
                        ],
                    }
                }, {
                    $project: {
                        "data": 1,
                        "count": {
                            $arrayElemAt: ["$totalCount.count", 0]
                        }
                    }
                }
            );

            let observationSubmissions = await database.models.observationSubmissions.aggregate(aggregateData);
           
            if (observationSubmissions.length == 0 || observationSubmissions[0].data.length == 0) {
                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.SOLUTION_NOT_FOUND,
                    data: {
                        data: observationSubmissions[0].data,
                        count: observationSubmissions[0].count ? observationSubmissions[0].count : 0
                    }
                });
            }
           
            let solutionIds = [];

            observationSubmissions[0].data.forEach( submission => {
                solutionIds.push(submission._id);
            })
            
            query["solutionId"] = { $in : solutionIds};
            
            let submissions = await this.observationSubmissionsDocument
            (
               _.omit(query,["userRoleInformation.role"]),
               [
                "solutionId",
                "programId",
                "observationId",
                "entityId",
                "scoringSystem",
                "isRubricDriven",
                "entityType",
                "criteriaLevelReport",
                "completedDate"
               ],
               { completedDate: -1 }
            );

            let submissionDocuments = _.groupBy(submissions, "solutionId");
            let entityIds = [];
            result.count = observationSubmissions[0].count;

            submissions.forEach( submission => {
               entityIds.push(submission.entityId);
            })

            let entitiesData = await entitiesHelper.entityDocuments({
                _id: { $in: entityIds }
            }, ["metaInformation.externalId", "metaInformation.name"]);

            if (!entitiesData.length > 0) {
                throw {
                    message: messageConstants.apiResponses.ENTITIES_NOT_FOUND
                }
            }

            let entities = {};

            for ( 
                let pointerToEntities = 0; 
                pointerToEntities < entitiesData.length;
                pointerToEntities++
            ) {

                let currentEntities = entitiesData[pointerToEntities];
                
                let entity = {
                    _id : currentEntities._id,
                    externalId : currentEntities.metaInformation.externalId,
                    name : currentEntities.metaInformation.name
                };

                entities[currentEntities._id] = entity;
            }

            let solutionDocuments = await solutionHelper.solutionDocuments
            ({
                 _id: { $in: solutionIds }
            },
                ["name",
                 "programName",
                 "allowMultipleAssessemts"
                ]
            )

            let solutionMap = {};
            solutionDocuments.forEach(solution => {
                solutionMap[solution._id] = solution;
            })

            result.data = [];
           
            Object.keys(submissionDocuments).forEach(solution => {
                let solutionObject = submissionDocuments[solution][0];
               
                solutionObject.entities = [];
               
                submissionDocuments[solution].forEach( singleSubmission => {
                    let findEntities = solutionObject.entities.findIndex(entity => entity._id.toString() === singleSubmission.entityId.toString());

                    if (findEntities < 0) {
                        if (entities[singleSubmission.entityId]) {
                            solutionObject.entities.push(entities[singleSubmission.entityId]);
                        }
                    }

                    if (new Date(singleSubmission.completedDate) > new Date(solutionObject.completedDate)) {
                        solutionObject.completedDate = singleSubmission.completedDate;
                    }

                    if (solutionMap[singleSubmission.solutionId]) {
                        solutionObject.programName = solutionMap[singleSubmission.solutionId]["programName"];
                        solutionObject.name = solutionMap[singleSubmission.solutionId]["name"];
                        solutionObject.allowMultipleAssessemts = solutionMap[singleSubmission.solutionId]["allowMultipleAssessemts"];
                    }
                })
                delete solutionObject.entityId;
                delete solutionObject._id;
                result.data.push(solutionObject);
            })

            
            return resolve({
                success: true,
                message: messageConstants.apiResponses.SOLUTION_FETCHED,
                data: result
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

    /**
   * Mark Observation Submission NotApplicable.
   * @method
   * @name addAnswersMarkedAsNA
   * @param {String} submissionId -observation submissions id.
   * @param {String} userId - logged in user id.
   * @param {Object} evidence - Body Data
   * @returns {JSON} - message that observation submission are set as NotApplicable.
   */

    static addAnswersMarkedAsNA(submissionId,userId, evidenceId, remarks = "") {
        return new Promise(async (resolve, reject) => {
    
          try {

            let formattedEvidence = {};

            let submissionDocument = await this.observationSubmissionsDocument
            (
                { "_id": submissionId,
                  "evidencesStatus": {"$elemMatch": {externalId: evidenceId, 
                                                    canBeNotApplicable: true}}
                },
                [
                    "evidencesStatus.$",
                    "solutionId"
                ]
            );
            
            if (!submissionDocument.length) {
                throw new Error(messageConstants.apiResponses.SUBMISSION_NOT_FOUND)
            }

            submissionDocument = submissionDocument[0];

            if(submissionDocument.evidencesStatus[0].notApplicable){
                throw new Error(evidenceId + messageConstants.apiResponses.EVIDENCE_ALREADY_MARKED_AS_NOT_APPLICABLE)
            }

            let projectionFields = [
              "themes",
              "evidenceMethods"
            ];

            let solutionDocument = await solutionHelper.solutionDocuments({
                _id: submissionDocument.solutionId
            }, projectionFields);

            if(!solutionDocument.length){
                throw new Error(messageConstants.apiResponses.SOLUTION_NOT_FOUND);
            }
            
            solutionDocument = solutionDocument[0];
            let criteriasIdArray = gen.utils.getCriteriaIds(solutionDocument.themes);
            if(!criteriasIdArray){
                throw new Error(messageConstants.apiResponses.CRITERIA_QUESTIONS_COULD_NOT_BE_FOUND);
            }

            let questionsArray = await criteriaQuestionHelper.getCriteriaQuestions(criteriasIdArray,evidenceId);

            let answersArray = {};
            if(questionsArray && questionsArray.length > 0){

                await Promise.all(questionsArray.map( async eachQuestion => {
                    let answer  = await this.convertToECMNAQuestionFormat(evidenceId, eachQuestion);
                    answersArray = Object.assign(answersArray, answer);
                }))
            }

            if(!answersArray){
                throw new Error(messageConstants.apiResponses.CRITERIA_QUESTIONS_COULD_NOT_BE_FOUND);
            }

            formattedEvidence.evidences = {
                externalId : evidenceId,
                answers : answersArray,
                startTime : Date.now(),
                endTime : Date.now(),
                notApplicable : true,
                remarks : remarks
            }

            let response = {
                success: true,
                message: messageConstants.apiResponses.OBSERVATION_SUBMISSION_CHECK,
                result: formattedEvidence
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
   * Convert Questions To Answer format.
   * @method
   * @name convertToECMNAQuestionFormat
   * @param {Object} question - Question Data
   * @returns {JSON} - formatted answer array.
   */

    static convertToECMNAQuestionFormat(evidenceMethod, questionData) {
        return new Promise(async (resolve, reject) => {
    
          try {

            if(!questionData){
                throw new Error(messageConstants.apiResponses.CRITERIA_QUESTIONS_COULD_NOT_BE_FOUND);
            }

            let formatQuestion = {};
            let qId = questionData._id;

            formatQuestion[ qId ] = {
                qid : qId,
                remarks : "",
                fileName : [],
                notApplicable: true,
                startTime : Date.now(),
                endTime : Date.now(),
                payload : {
                    question : questionData.question,
                    labels : [],
                    responseType : questionData.responseType
                },
                criteriaId : questionData.criteriaId,
                responseType : questionData.responseType,
                evidenceMethod : evidenceMethod,
                rubricLevel : questionData.rubricLevel
            };

            if(questionData.responseType != "matrix"){
                formatQuestion[ qId ].value =  "";
            }else{
                formatQuestion[ qId ].value = [];
            }

            return resolve(formatQuestion);
    
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
   * Get observation submission details
   * @method
   * @name details
   * @param {String} observationSubmissionId - observation submission id.
   * @returns {JSON} - observation submission details
   */

    static details(observationSubmissionId) {
        return new Promise(async (resolve, reject) => {
            try {

                let observationSubmissionsDocument = await database.models.observationSubmissions.findOne({
                    _id: observationSubmissionId,
                }).lean();

                if (!observationSubmissionsDocument) {
                    throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;
                }

                let solutionDocument = await solutionHelper.solutionDocuments({
                    _id: observationSubmissionsDocument.solutionId
                }, [ "name","scoringSystem","description","questionSequenceByEcm"]);
    
                if(!solutionDocument.length){
                    throw messageConstants.apiResponses.SOLUTION_NOT_FOUND;
                }
                
                solutionDocument = solutionDocument[0];
                observationSubmissionsDocument['solutionInfo'] = solutionDocument;

                let programDocument = 
                await programsHelper.list(
                    {
                        _id: observationSubmissionsDocument.programId,
                    },
                    ["name","description"],
                );
    
                if( !programDocument[0] ) {
                    throw  messageConstants.apiResponses.PROGRAM_NOT_FOUND
                }
                observationSubmissionsDocument['programInfo'] = programDocument[0];

                return resolve(observationSubmissionsDocument);

            } catch (error) {
                return reject({
                    success: false,
                    message: error,
                    data: {}
                });
            }
        })
    }


};


