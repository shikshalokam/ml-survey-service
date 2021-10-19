/**
 * name : polls/helper.js
 * author : Deepa
 * created-date : 01-Aug-2020
 * Description : Polls helper functionality.
 */

// Dependencies
const formsHelper = require(MODULES_BASE_PATH + "/forms/helper");
const appsPortalBaseUrl = (process.env.APP_PORTAL_BASE_URL && process.env.APP_PORTAL_BASE_URL !== "") ? process.env.APP_PORTAL_BASE_URL + "/" : "https://apps.shikshalokam.org/";
const mediaFilesHelper = require(MODULES_BASE_PATH + "/mediaFiles/helper");
const pollSubmissionDocumentHelper = require(MODULES_BASE_PATH + "/pollSubmissions/documents");
const coreService = require(ROOT_PATH + "/generics/services/core");

/**
    * PollsHelper
    * @class
*/
module.exports = class PollsHelper {

   /**
   * find polls
   * @method
   * @name pollDocuments
   * @param {Array} [pollFilter = "all"] - poll ids.
   * @param {Array} [fieldsArray = "all"] - projected fields.
   * @param {Array} [skipFields = "none"] - field not to include
   * @returns {Array} List of polls. 
   */
  
  static pollDocuments(
    pollFilter = "all", 
    fieldsArray = "all",
    sortedData = "",
    skipFields = "none"
  ) {
    return new Promise(async (resolve, reject) => {
        try {
    
            let queryObject = (pollFilter != "all") ? pollFilter : {};
    
            let projection = {}
    
            if (fieldsArray != "all") {
                fieldsArray.forEach(field => {
                    projection[field] = 1;
                });
            }

            if( skipFields !== "none" ) {
              skipFields.forEach(field=>{
                projection[field] = 0;
              })
            }

            let pollDocuments;

            if (sortedData !== "") {

                pollDocuments = await database.models.polls
                .find(queryObject, fieldsArray)
                .sort(sortedData)
                .lean();
            } 
            else {
                pollDocuments = await database.models.polls
                .find(queryObject, projection)
                .lean();
            }

            return resolve(pollDocuments);
            
        } catch (error) {
            return reject(error);
        }
    });
 }

    /**
     * Poll Creation meta form
     * @method
     * @name metaForm
     * @returns {JSON} - Form details
     */

    static metaForm() {
        return new Promise(async (resolve, reject) => {
            try {

                let pollCreationForm = await formsHelper.formDocuments
                (
                    {
                      name : {
                               $in : [
                                  messageConstants.common.POLL_METAFORM,
                                  messageConstants.common.POLL_QUESTION_METAFORM
                                ]
                            }
                    },
                    [
                      "value"
                    ]
                )

                pollCreationForm = [...pollCreationForm[0].value,
                                    ...pollCreationForm[1].value]
                
                let unicodes = await mediaFilesHelper.mediaFileDocuments
                ( 
                    {
                        status: "active"
                    }
                )

                let emoticons = [];
                let gestures = [];

                if (unicodes.length > 0) {
                    unicodes.forEach( unicode => {
                         if (unicode.type == messageConstants.common.EMOJI) {
                            emoticons.push(unicode);
                         }
                         else if (unicode.type == messageConstants.common.GESTURE){
                             gestures.push(unicode);
                         }
                    });
                }

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.POLL_CREATION_FORM_FETCHED,
                    data: {
                          form: pollCreationForm,
                          emoticons: emoticons,
                          gestures: gestures
                    }
                });

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
     * Create poll
     * @method
     * @name create
     * @param {Object} pollData - poll creation data
     * @param {String} userId - userId
     * @param {String} appName - Name of the app
     * @returns {String} - Sharable link .
     */

    static create(pollData= {}, userId= "", appName= "") {
        return new Promise(async (resolve, reject) => {
            try {

                if (Object.keys(pollData).length == 0) {
                    throw new Error (messageConstants.apiResponses.POLL_DATA_REQUIRED);
                }

                if (userId == "") {
                    throw new Error (messageConstants.apiResponses.USER_ID_REQUIRED_CHECK);
                }

                if (appName == "") {
                    throw new Error (messageConstants.apiResponses.APP_NAME_FIELD_REQUIRED);
                }
                
                let pollsModel = Object.keys(pollsSchema.schema);
                
                let pollMetainformation = {};

                Object.keys(pollData).forEach( key => {
                    if(!pollsModel.includes(key)) {
                        pollMetainformation[key] = pollData[key];
                    }
                })
               
                let pollDocument = {
                    name: pollData.name,
                    creator: pollData.creator,
                    createdBy: userId,
                    startDate: new Date(),
                    endDate: new Date(new Date().setDate(new Date().getDate() + pollData.endDate)),
                    metaInformation: pollMetainformation,
                    isDeleted: false,
                    status: "active",
                    numberOfResponses: 0
                }
                
                let questionArray = [];
                let result = {};

                for(let question=0; question< pollData.questions.length; question++) {
   
                    let options = [];
                    pollData.questions[question].qid = gen.utils.generateUUId();;
                    result[pollData.questions[question].qid] = {}
               
                    if (pollData.questions[question].options.length > 0) {
               
                       for(let option=0; option < pollData.questions[question].options.length; option++) {
                           options.push(
                                          {
                                            value: "R" + (option + 1),
                                            label: pollData.questions[question].options[option].label,
                                            unicode: pollData.questions[question].options[option].value
                                          }
                                        )  

                            result[[pollData.questions[question].qid]]["R" + (option + 1)] = 0;
                       }
                    }
                    
                   pollData.questions[question].options = options;
                   questionArray.push(pollData.questions[question]);
               }
                
                pollDocument.questions = questionArray;
                pollDocument.result = result;
                
                let createPollResult = await database.models.polls.create(pollDocument)

                let link = await gen.utils.md5Hash(userId + "###" + createPollResult._id);

                await this.updatePollDocument
                (
                    { _id : createPollResult._id },
                    {
                        $set : { link : link}
                    }
                )
                
                let sharableLink = "";

                let getPollLink = await this.getPollLinkById(createPollResult._id, appName)
                
                if (getPollLink.success) {
                    sharableLink = getPollLink.data
                }

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.POLL_CREATED,
                    data: {
                        link : sharableLink
                    }
                });
                
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
    * List all the polls.
    * @method
    * @name list
    * @param {String} userId - userId
    * @returns {JSON} - Polls list.
    */

    static list(userId= "") {
        return new Promise(async (resolve, reject) => {
            try {

                if(userId == ""){
                    throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK);
                }

                let pollsList = await this.pollDocuments
                (
                    {
                        createdBy: userId,
                        isDeleted: false
                    },
                    [
                        "name"
                    ],
                    {createdAt: 1}
                )

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.POLLS_LIST_FETCHED,
                    data: pollsList
                });

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
     * Delete an poll.
     * @method
     * @name delete
     * @param {String} pollId - pollId 
     * @param {String} userId - userId
     * @returns {String} - message.
     */

    static delete(pollId= "",userId= "") {
        return new Promise(async (resolve, reject) => {
            try {

                if(pollId == ""){
                    throw new Error(messageConstants.apiResponses.POLL_ID_REQUIRED_CHECK)
                }

                if(userId == ""){
                    throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK)
                }

                let updateResponse= await this.updatePollDocument
                (
                    {
                       _id: pollId ,
                      createdBy: userId
                    },
                    { $set : {
                        isDeleted: true
                      }
                    }
                );
                
                if (!updateResponse.success && !updateResponse.data) {
                    throw new Error(messageConstants.apiResponses.POLL_COULD_NOT_BE_DELETED)
                }

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.POLL_DELETED,
                    data: true
                });


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
     * Get the poll questions.
     * @method
     * @name getPollQuestions
     * @param {String} pollId - pollId 
     * @param {String} appName - appName
     * @returns {JSON} - poll questions and options.
     */

    static getPollQuestions(pollId= "", appName= "") {
        return new Promise(async (resolve, reject) => {
            try {

                if (pollId == "") {
                    throw new Error(messageConstants.apiResponses.POLL_ID_REQUIRED_CHECK)
                }

                if (appName == "") {
                    throw new Error (messageConstants.apiResponses.APP_NAME_FIELD_REQUIRED);
                }

                let pollQuestions = await this.pollDocuments
                (
                    {
                      _id: pollId
                    },
                    [    
                        "questions"
                    ]
                )

                if (!pollQuestions.length) {
                    throw new Error(messageConstants.apiResponses.POLL_NOT_FOUND)
                }
                
                let result = {
                    questions : pollQuestions[0].questions,
                    pollLink : ""
                }

                let pollLink = await this.getPollLinkById
                (
                    pollId,
                    appName
                )
                
                if (pollLink.success) {
                   result.pollLink = pollLink.data
                }

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.POLL_QUESTIONS_FETCHED,
                    data: result
                });

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
     * Get the poll questions by link.
     * @method
     * @name getPollQuestionsByLink
     * @param {String} link - link 
     * @param {String} userId - userId
     * @returns {JSON} - poll questions and options.
     */

    static getPollQuestionsByLink(link= "", userId= "") {
        return new Promise(async (resolve, reject) => {
            try {

                if (link == "") {
                    throw new Error(messageConstants.apiResponses.LINK_REQUIRED_CHECK)
                }

                if (userId == "") {
                    throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK)
                }

                let pollQuestions = await this.pollDocuments
                (
                    {
                      link: link
                    },
                    [    
                        "questions",
                        "status",
                        "endDate"
                    ]
                )
                
                if (!pollQuestions.length) {
                    throw new Error(messageConstants.apiResponses.POLL_NOT_FOUND)
                }

                if (new Date() > new Date(pollQuestions[0].endDate)) {
                    
                    if (pollQuestions[0].status == messageConstants.common.ACTIVE_STATUS) {
                        await this.updatePollDocument
                        (
                            { link : link },
                            { $set : { status: messageConstants.common.INACTIVE_STATUS } }
                        )
                    }
                    
                    throw new Error(messageConstants.apiResponses.LINK_IS_EXPIRED)
                }
                else {
                
                let result = {
                    pollId: pollQuestions[0]._id,
                    questions: pollQuestions[0].questions,
                    submissionId: ""
                }
           
                let pollSubmissionDocument = await pollSubmissionDocumentHelper.pollSubmissionDocuments
                (
                    {
                       pollId: pollQuestions[0]._id,
                       userId: userId
                    },
                    ["_id"]
                )
                
                if (pollSubmissionDocument.length) {
                    result.submissionId =  pollSubmissionDocument[0]._id
                }

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.POLL_QUESTIONS_FETCHED,
                    data: result
                });

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
    * Poll report.
    * @method
    * @name report
    * @param {String} pollId - pollId 
    * @returns {Object} - Poll report data
    */

   static report(pollId = "") {
    return new Promise(async (resolve, reject) => {
        try {

            if (pollId == "") {
                throw new Error (messageConstants.apiResponses.POLL_ID_REQUIRED_CHECK)
            }

            let pollDocument = await this.pollDocuments
            (
                { _id : pollId },
                [
                    "result",
                    "questions",
                    "numberOfResponses"
                ]
            )

            if (!pollDocument.length) {
                throw new Error(messageConstants.apiResponses.POLL_NOT_FOUND)
            }

            if (pollDocument[0].numberOfResponses == 0) {
                throw new Error(messageConstants.apiResponses.POLL_SUBMISSIONS_NOT_FOUND)
            }
            
            let reports = [];
            let groupByQuestionId = _.keyBy(pollDocument[0].questions, 'qid');
            let result = pollDocument[0].result;
            
            Object.keys(result).forEach( singleQuestion => {

                let report = {
                    chart: {
                        type: 'bar'
                    },
                    title: {
                        text: ''
                    },
                    accessibility: {
                        announceNewData: {
                            enabled: false
                        }
                    },
                    xAxis: {
                        type: 'category'
                    },
                    legend: {
                        enabled: false
                    },
                    credits: {
                        enabled: false
                    },
                    plotOptions: {
                        series: {
                            borderWidth: 0,
                            dataLabels: {
                                enabled: true,
                                format: '{point.y:.1f}%'
                            }
                        }
                    },
                    series: [
                        {
                            colorByPoint: true,
                            data: []
                        }
                    ]
                }
                
                let groupOptionsByValue = _.keyBy(groupByQuestionId[singleQuestion].options,"value");
                report.title.text = groupByQuestionId[singleQuestion].question;
               
                for (let value in result[singleQuestion]) {
                    let label = groupOptionsByValue[value].label;
                    
                    if (groupOptionsByValue[value].unicode) {
                        label = groupOptionsByValue[value].unicode + " " + label;
                    }
                   
                    report.series[0].data.push ({
                        name: label,
                        y: (result[singleQuestion][value]/pollDocument[0].numberOfResponses) * 100
                    }) 
                }
              
                reports.push(report);
            })
           
            return resolve({
                success: true,
                message: messageConstants.apiResponses.POLL_REPORT_CREATED,
                data : reports
            });

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
    * Update poll document.
    * @method
    * @name updatePollDocument
    * @param {Object} query - query to find document
    * @param {Object} updateObject - fields to update
    * @returns {String} - message.
    */

   static updatePollDocument(query= {}, updateObject= {}) {
    return new Promise(async (resolve, reject) => {
        try {

            if (Object.keys(query).length == 0) {
                throw new Error(messageConstants.apiResponses.POLL_UPDATE_QUERY_REQUIRED)
            }

            if (Object.keys(updateObject).length == 0) {
                throw new Error (messageConstants.apiResponses.UPDATE_OBJECT_REQUIRED)
            }

            let updateResponse = await database.models.polls.updateOne
            (
                query,
                updateObject
            )
            
            if (updateResponse.nModified == 0) {
                throw new Error(messageConstants.apiResponses.POLL_COULD_NOT_BE_UPDATED)
            }

            return resolve({
                success: true,
                message: messageConstants.apiResponses.POLL_UPDATED,
                data: true
            });

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
    * Check if poll is open for submisson.
    * @method
    * @name isPollOpenForSubmission
    * @param {String} pollId - pollId
    * @returns {String} - message.
    */

   static isPollOpenForSubmission(pollId= "") {
    return new Promise(async (resolve, reject) => {
        try {

            if (pollId == "") {
                throw new Error(messageConstants.apiResponses.POLL_ID_REQUIRED_CHECK)
            }

            let pollDocument = await this.pollDocuments
            (
                { _id: pollId,
                  status: messageConstants.common.ACTIVE_STATUS,
                  isDeleted: false,
                  endDate: { $gt : new Date()}
                 }
            )
            
            if (!pollDocument.length) {
                throw new Error(messageConstants.apiResponses.POLL_NOT_FOUND)
            }

            return resolve({
                success: true,
                message: messageConstants.apiResponses.POLL_VALIDATED,
                data: true
            });

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
    * Get poll link by id.
    * @method
    * @name getPollLinkById
    * @param {String} pollId - pollId
    * @param {String} appName - appName
    * @returns {String} - poll link.
    */

   static getPollLinkById(pollId= "", appName) {
    return new Promise(async (resolve, reject) => {
        try {
            
            if (pollId == "") {
                throw new Error(messageConstants.apiResponses.POLL_ID_REQUIRED_CHECK)
            }

            if(appName == "") {
                throw new Error(messageConstants.apiResponses.APP_NAME_FIELD_REQUIRED)
            }

            let appDetails = await coreService.getAppDetails(appName);
                    
            if (appDetails.result == false) {
                throw new Error(messageConstants.apiResponses.APP_NOT_FOUND);
            }

            let pollLink = await this.pollDocuments
            (
               { _id: pollId,
                 endDate: { $gt : new Date() }},
               ["link"]
            )
            
            if (!pollLink.length) {
                throw new Error(messageConstants.apiResponses.LINK_NOT_FOUND)
            }
            
            return resolve({
                success: true,
                message: messageConstants.apiResponses.POLL_LINK_FETCHED,
                data: appsPortalBaseUrl + appName + messageConstants.common.TAKE_POLL + pollLink[0].link
            })
        }
        catch (error) {
            return resolve({
                success: false,
                message: error.message,
                data: false
            });
        }
    })
} 

}
