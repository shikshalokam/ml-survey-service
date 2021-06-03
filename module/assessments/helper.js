/**
 * name : assessments/helper.js
 * author : Akash
 * created-date : 22-Nov-2018
 * Description : Assessment related helper functionality.
 */


// Dependencies. 
const entityAssessorsHelper = require(MODULES_BASE_PATH + "/entityAssessors/helper");
const formsHelper = require(MODULES_BASE_PATH + "/forms/helper");
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const criteriaQuestionsHelper = require(MODULES_BASE_PATH + "/criteriaQuestions/helper");
let entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");
const shikshalokamHelper = require(MODULES_BASE_PATH + "/shikshalokam/helper");
const kendraService = require(ROOT_PATH + "/generics/services/kendra");

/**
    * AssessmentsHelper
    * @class
*/
module.exports = class AssessmentsHelper {

    /**
      * getUserRole.
      * @method
      * @name getUserRole
      * @param {Array} roles - array of entityAssessor roles 
      * @returns {Promise} returns a promise.
     */

    static getUserRole(roles) {
        return new Promise(async (resolve, reject) => {
            try {
                let assessmentRoles = gen.utils.assessmentRoles();
                let role = _.intersection(roles, Object.keys(assessmentRoles))[0];
                return resolve(assessmentRoles[role]);

            } catch (error) {
                return reject(error);
            }
        })

    }

    /**
      * parseQuestions.
      * @method
      * @name parseQuestions
      * @param {Array} evidences - array of evidencesMethod.
      * @param {Array} questionGroup - array of questionGroup for particulat entity.
      * @param {Object} submissionDocEvidences - all the evidences of the submission.
      * @param {Boolean} [questionSequenceByEcm = false] 
      * - if true questions should be sequenced in an order format provided.
      * @param {Object} entityMetaInformation -  entity metaInformation
      * @returns {Promise} returns a promise.
     */

    static parseQuestions(
        evidences, 
        questionGroup, 
        submissionDocEvidences, 
        questionSequenceByEcm = false,
        entityMetaInformation
    ) {
        return new Promise(async (resolve, reject) => {
            try {

                let entityFilterQuestionArray = {};
                let sectionQuestionArray = {};
                let generalQuestions = [];
                let questionArray = {};
                let submissionsObjects = {};
                let pageQuestionsEnabled = {}

                let checkEcmSequenceExists = evidences.every(ecm => {
                    return ecm["sequenceNo"] != undefined;
                })

                if (checkEcmSequenceExists) {
                    evidences = _.sortBy(evidences, "sequenceNo");
                } else {
                    evidences.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
                }

                evidences.forEach(evidence => {

                    if (submissionDocEvidences[evidence.externalId]) {
                        evidence.startTime = submissionDocEvidences[evidence.externalId].startTime;
                        evidence.endTime = submissionDocEvidences[evidence.externalId].endTime;
                        evidence.isSubmitted = submissionDocEvidences[evidence.externalId].isSubmitted;

                        if (submissionDocEvidences[evidence.externalId].submissions) {
                            submissionDocEvidences[evidence.externalId].submissions.forEach(submission => {

                                if (submission.isValid) {
                                    submissionsObjects[evidence.externalId] = submission;                         
                                }
                            });
                        }
                    }

                    evidence.sections.forEach(section => {
                        let sectionCode = section.code;

                        section.questions.forEach((question, index, section) => {

                            question.evidenceMethod = evidence.externalId;

                            if (_.difference(question.questionGroup, questionGroup).length < question.questionGroup.length) {

                                sectionQuestionArray[question._id] = section;

                                if( question.prefillFromEntityProfile ) {
    
                                    question["value"] = 
                                    entityMetaInformation[question.entityFieldName] ?
                                    entityMetaInformation[question.entityFieldName] : 
                                    ""
                                }

                                questionArray[question._id] = question;

                                if (question.page && question.page != "") {

                                    if (!pageQuestionsEnabled[evidence.externalId]) {
                                        pageQuestionsEnabled[evidence.externalId] = {};
                                    }

                                    pageQuestionsEnabled[evidence.externalId][sectionCode] = true;

                                }
                            } else {
                                entityFilterQuestionArray[question._id] = section;
                            }
                        });
                    });

                });

                Object.entries(entityFilterQuestionArray).forEach(entityFilteredQuestion => {
                    entityFilteredQuestion[1].forEach((questionElm, questionIndexInSection) => {
                        if (questionElm._id.toString() === entityFilteredQuestion[0]) {
                            entityFilteredQuestion[1].splice(questionIndexInSection, 1);
                        }
                    });
                });

                let attachments = [];

                Object.entries(questionArray).forEach(questionArrayElm => {

                    questionArrayElm[1]["payload"] = {
                        criteriaId: questionArrayElm[1]["criteriaId"],
                        responseType: questionArrayElm[1]["responseType"],
                        evidenceMethod: questionArrayElm[1].evidenceMethod,
                        rubricLevel: (questionArrayElm[1]["rubricLevel"]) ? questionArrayElm[1]["rubricLevel"] : ""
                    };
                    questionArrayElm[1]["startTime"] = "";
                    questionArrayElm[1]["endTime"] = "";
                    questionArrayElm[1]["gpsLocation"] = "";
                    if(!questionArrayElm[1].file || !Object.keys(questionArrayElm[1].file).length) questionArrayElm[1]["file"] = "";
                    delete questionArrayElm[1]["criteriaId"];

                    // Remove weightage of each question from being sent to client.
                    if(questionArrayElm[1].weightage) {
                        delete questionArrayElm[1]["weightage"];
                    }

                    if (
                        submissionsObjects[questionArrayElm[1].evidenceMethod] &&  
                        submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]] &&
                        submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].fileName &&
                        submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].fileName.length > 0
                    ) {
                        submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].fileName.forEach(file=>{
                            attachments.push(file.sourcePath);
                        })
                    }

                    if (questionArrayElm[1].responseType === "matrix") {
                        let instanceQuestionArray = new Array();
                        questionArrayElm[1].instanceQuestions.forEach(instanceQuestionId => {
                            if (sectionQuestionArray[instanceQuestionId.toString()]) {
                                let instanceQuestion = questionArray[instanceQuestionId.toString()];
                                instanceQuestionArray.push(instanceQuestion);
                                let sectionReferenceOfInstanceQuestion =
                                    sectionQuestionArray[instanceQuestionId.toString()];
                                sectionReferenceOfInstanceQuestion.forEach((questionInSection, index) => {
                                    if (questionInSection._id.toString() === instanceQuestionId.toString()) {
                                        sectionReferenceOfInstanceQuestion.splice(index, 1);
                                    }
                                });
                            }

                            if (
                                submissionsObjects[questionArrayElm[1].evidenceMethod] &&  
                                submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]] &&
                                submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].value &&
                                submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].value.length > 0
                            ) {
                                submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].value.forEach(singleValue=>{
                                    if (singleValue[instanceQuestionId.toString()].fileName && singleValue[instanceQuestionId.toString()].fileName.length > 0) {
                                        singleValue[instanceQuestionId.toString()].fileName.forEach(file => {
                                            attachments.push(file.sourcePath);
                                        })
                                    }
                                })
                            }
                        });

                        questionArrayElm[1]["instanceQuestions"] = instanceQuestionArray;
                    }

                    // Remove score from each option from being sent to client.
                    if (questionArrayElm[1].options && questionArrayElm[1].options.length > 0) {
                        questionArrayElm[1].options.forEach(option => {
                            if (option.score) {
                                delete option.score;
                            }
                        });
                    }

                    if (questionArrayElm[1]["isAGeneralQuestion"] === true) {
                        questionArrayElm[1]["payload"].isAGeneralQuestion = true;
                        generalQuestions.push(questionArrayElm[1]);
                    }

                });

                if (questionSequenceByEcm) {

                    evidences.forEach(evidence => {
                        if (questionSequenceByEcm[evidence.externalId]) {

                            evidence.sections.forEach(section => {

                                if (questionSequenceByEcm[evidence.externalId][section.code] && questionSequenceByEcm[evidence.externalId][section.code].length > 0) {
                                    let questionSequenceByEcmSection = questionSequenceByEcm[evidence.externalId][section.code];
                                    let sectionQuestionByEcm = _.keyBy(section.questions, 'externalId');
                                    let sortedQuestionArray = new Array;

                                    questionSequenceByEcmSection.forEach(questionId => {
                                        if (sectionQuestionByEcm[questionId]) {
                                            sortedQuestionArray.push(sectionQuestionByEcm[questionId]);
                                            delete sectionQuestionByEcm[questionId];
                                        }
                                    })

                                    sortedQuestionArray = _.concat(sortedQuestionArray, Object.values(sectionQuestionByEcm));

                                    section.questions = sortedQuestionArray;
                                }

                            })
                        }
                    })
                }

                let attachmentsUrl = [];

                if ( attachments.length > 0 ) {
                    
                    attachmentsUrl = await kendraService.downloadableUrls({
                        filePaths: attachments
                    })

                    if (attachmentsUrl.status !== httpStatusCode.ok.status) {
                        throw {
                            status: httpStatusCode['bad_request'].status,
                            message: messageConstants.apiResponses.ATTACHMENTS_URL_NOT_FOUND
                        }
                    }

                    Object.entries(questionArray).forEach(questionArrayElm => {
                        if (
                            submissionsObjects[questionArrayElm[1].evidenceMethod] &&  
                            submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]] &&
                            submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].fileName &&
                            submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].fileName.length > 0
                        ) {
                            submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].fileName.forEach(file => {
                                let attachmentIndex = attachmentsUrl.result.findIndex(attachment=>attachment.filePath === file.sourcePath);
                                if (attachmentIndex > -1) {
                                    file["url"] = attachmentsUrl.result[attachmentIndex].url;
                                }
                            })
                        }

                        if (questionArrayElm[1].responseType === "matrix") {
                            if (
                                submissionsObjects[questionArrayElm[1].evidenceMethod] &&  
                                submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]] &&
                                submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].value &&
                                submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].value.length > 0
                            ) {
                                submissionsObjects[questionArrayElm[1].evidenceMethod].answers[questionArrayElm[0]].value.forEach(singleValue=>{
                                    questionArrayElm[1].instanceQuestions.forEach(instanceQuestion=>{
                                        let instanceQuestionId = instanceQuestion._id.toString();
                                        if (singleValue[instanceQuestionId].fileName && singleValue[instanceQuestionId].fileName.length > 0) {
                                            singleValue[instanceQuestionId].fileName.forEach(file => {
                                                let attachmentIndex = attachmentsUrl.result.findIndex(attachment=>attachment.filePath === file.sourcePath);
                                                if (attachmentIndex > -1) {
                                                    file["url"] = attachmentsUrl.result[attachmentIndex].url;
                                                }
                                            })
                                        }
                                    })
                                })
                            }
                        }
                    })
                }

                return resolve({
                    evidences: evidences,
                    submissions: submissionsObjects,
                    generalQuestions: generalQuestions,
                    pageQuestionsEnabled: pageQuestionsEnabled
                });


            } catch (error) {
                return reject(error);
            }

        })

    }

    /**
      * Latest question parser helper function which includes pageQuestions features
      *  which was not required for old samiksha app. 
      * @method
      * @name parseQuestionsV2
      * @param {Array} evidences - array of evidencesMethod.
      * @param {Array} questionGroup - array of questionGroup for particulat entity.
      * @param {Object} submissionDocEvidences - all the evidences of the submission.
      * @param {Boolean} [questionSequenceByEcm = false] 
      * - if true questions should be sequenced in an order format provided.
      * @param {Object} entityMetaInformation - entity metaInformation 
      * @returns {Promise} returns a promise.
     */

    static parseQuestionsV2(
        evidences, 
        questionGroup, 
        submissionDocEvidences, 
        questionSequenceByEcm = false,
        entityMetaInformation
    ) {
        return new Promise(async (resolve, reject) => {
            try {

                let parseQuestionV1 = await this.parseQuestions(
                    evidences, 
                    questionGroup, 
                    submissionDocEvidences, 
                    questionSequenceByEcm,
                    entityMetaInformation
                );


                let defaultQuestion = {};

                parseQuestionV1.evidences.forEach(eachEvidence => {

                    if (parseQuestionV1.pageQuestionsEnabled[eachEvidence.externalId]) {

                        eachEvidence.sections.forEach(eachSection => {

                            if (parseQuestionV1.pageQuestionsEnabled[eachEvidence.externalId][eachSection.code]) {
                                let pageQuestionsObj = {};

                                for (let pointerToEachSectionQuestion = 0; pointerToEachSectionQuestion < eachSection.questions.length; pointerToEachSectionQuestion++) {

                                    let eachQuestion = eachSection.questions[pointerToEachSectionQuestion];

                                    if (eachQuestion.page && eachQuestion.page !== "") {

                                        let pageName = eachQuestion.page.toLowerCase();

                                        if (!pageQuestionsObj[pageName]) {

                                            if (!(Object.keys(defaultQuestion).length > 0)) {
                                                Object.keys(eachQuestion).forEach(questionModelKey => {
                                                    if (questionModelKey === "updatedAt" || questionModelKey === "createdAt" || questionModelKey === "_id") {
                                                        defaultQuestion[questionModelKey] = "";
                                                    } else if (Array.isArray(defaultQuestion[questionModelKey])) {
                                                        defaultQuestion[questionModelKey] = [];
                                                    } else if (typeof defaultQuestion[questionModelKey] === 'boolean') {
                                                        defaultQuestion[questionModelKey] = false;
                                                    } else if (typeof defaultQuestion[questionModelKey] === 'object') {
                                                        defaultQuestion[questionModelKey] = {};
                                                    } else {
                                                        defaultQuestion[questionModelKey] = "";
                                                    }
                                                })
                                            }
                                            pageQuestionsObj[pageName] = {};
                                            pageQuestionsObj[pageName] = _.merge(pageQuestionsObj[pageName], defaultQuestion);

                                            pageQuestionsObj[pageName]["responseType"] = "pageQuestions";
                                            pageQuestionsObj[pageName]["page"] = pageName;
                                            pageQuestionsObj[pageName]["pageQuestions"] = [];
                                        }

                                        pageQuestionsObj[pageName].pageQuestions.push(eachQuestion);

                                        delete eachSection.questions[pointerToEachSectionQuestion];
                                    }

                                }

                                if (!_.isEmpty(pageQuestionsObj)) {

                                    let filteredQuestion = eachSection.questions.filter(eachQuestion => {
                                        return eachQuestion != null;
                                    })

                                    eachSection.questions = _.concat(filteredQuestion, Object.values(pageQuestionsObj));
                                }

                            }

                        })
                    }

                })

                return resolve({
                    evidences: parseQuestionV1.evidences,
                    submissions: parseQuestionV1.submissions,
                    generalQuestions: parseQuestionV1.generalQuestions
                });


            } catch (error) {
                return reject(error);
            }

        })

    }


     /**
      *  Helper function for list of fields to be selected from solution document.
      * @method
      * @name solutionDocumentProjectionFieldsForDetailsAPI
      * @returns {Promise} Returns a Promise.
     */

    static solutionDocumentProjectionFieldsForDetailsAPI() {
        
        return new Promise(async (resolve, reject) => {
            return resolve({
                name: 1,
                externalId: 1,
                description: 1,
                themes: 1,
                entityProfileFieldsPerEntityTypes: 1,
                registry: 1,
                questionSequenceByEcm: 1,
                frameworkId: 1,
                frameworkExternalId: 1,
                roles: 1,
                evidenceMethods: 1,
                sections: 1,
                entityTypeId: 1,
                entityType: 1,
                captureGpsLocationAtQuestionLevel : 1,
                enableQuestionReadOut : 1,
                allowMultipleAssessemts : 1,
                scoringSystem: 1,
                isRubricDriven: 1,
                project : 1,
                referenceFrom : 1,
                criteriaLevelReport : 1
            });
        })
    }

     /**
      *  Helper function for list of solution fields to be sent in response.
      * @method
      * @name solutionDocumentFieldListInResponse
      * @returns {Promise} Returns a Promise.
     */

    static solutionDocumentFieldListInResponse() {

        return new Promise(async (resolve, reject) => {
            return resolve([
                "_id",
                "externalId",
                "name",
                "description",
                "registry",
                "captureGpsLocationAtQuestionLevel",
                "enableQuestionReadOut",
                "allowMultipleAssessemts",
                "scoringSystem",
                "isRubricDriven",
                "pageHeading",
                "criteriaLevelReport"
            ]);
        })
    }


     /**
      *  Helper function for list of program fields to be sent in response.
      * @method
      * @name programDocumentFieldListInResponse
      * @returns {Promise} Returns a Promise.
     */

    static programDocumentFieldListInResponse() {

        return new Promise(async (resolve, reject) => {
            return resolve([
                "_id",
                "externalId",
                "name",
                "description",
                "imageCompression",
                "isAPrivateProgram"
            ]);
        })
    }

      /**
   * Assessment meta form.
   * @method
   * @name metaForm
   * @param {String} solutionId - Assessment solution id.
   * @returns {JSON} - Form details.
   */

  static metaForm(solutionId) {

    return new Promise(async (resolve, reject) => {

        try {

            let solutionsData = await solutionsHelper.solutionDocuments({
                _id : solutionId,
                isReusable: true
            }, [
              messageConstants.common["ASSESSMENT_META_FORM_KEY"],
              "subType"
            ]);

            if (!solutionsData[0]) {
                throw { 
                    status: httpStatusCode.bad_request.status, 
                    message: messageConstants.apiResponses.SOLUTION_NOT_FOUND
                };
            }

            let defaultForm;

            if( solutionsData[0].subType === messageConstants.common.INSTITUTIONAL) {
                defaultForm = messageConstants.common.INSTITUTIONAL_METAFORM;
            } else {
                defaultForm = messageConstants.common.INDIVIDUAL_METAFORM;
            }

            let filteredData = {
              "name" : 
              solutionsData[0].assessmentMetaFormKey &&
              solutionsData[0].assessmentMetaFormKey !== "" ? 
              solutionsData[0].assessmentMetaFormKey : defaultForm
            };

            let assessmentMetaForm = 
            await formsHelper.formDocuments(filteredData,["value"]);

            if( !assessmentMetaForm[0] ) {
              throw { 
                status: httpStatusCode.bad_request.status, 
                message: messageConstants.apiResponses.FORM_NOT_FOUND
              };
            }

            return resolve({
                message: messageConstants.apiResponses.OBSERVATION_META_FETCHED,
                result: assessmentMetaForm[0].value
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
     * Create solution and program from assessment template. 
     * @method
     * @name create
     * @param {String} templateId - assessment template id. 
     * @param {String} userDetails - Logged in user id.
     * @param {Object} requestedData - request body data.
     * @returns {Object} - Create solution from assessment template. 
     */

    static create( templateId,userDetails,requestedData ) {
        return new Promise(async (resolve, reject) => {
            try {

              let solutionData = 
              await solutionsHelper.solutionDocuments(
                  {
                      _id : templateId
                  },[
                      "subType",
                      "entityType",
                      "entityTypeId"
                    ]
              )

              if( solutionData[0].subType === messageConstants.common.INDIVIDUAL ) {

                    let entity = 
                    await entitiesHelper.entityDocuments({
                        "userId" :  userDetails.userId,
                        "entityType" : solutionData[0].entityType
                    },["_id"])

                    let entityId;

                    if( !entity[0] ) {

                        let individualEntity = 
                        await entitiesHelper.add(
                            {
                                type : solutionData[0].entityType
                            },
                            [{
                                externalId : userDetails.userId,
                                name : userDetails.firstName + userDetails.lastName,
                                userName : userDetails.userName,
                                email : userDetails.email,
                                rootOrgId : userDetails.rootOrgId
                            }],
                            userDetails
                        );

                        entityId = individualEntity._id;
                    } else {
                        entityId = entity[0]._id;
                    }

                    requestedData.entities = [entityId];
              }

              let solutionInformation =  {
                name : requestedData.name,
                description : requestedData.description,
                entities : requestedData.entities ? requestedData.entities: []
              };

              if( requestedData.project ) {
                  solutionInformation["project"] = requestedData.project;
                  solutionInformation["referenceFrom"] = messageConstants.common.PROJECT;
              }

              let organisationAndRootOrganisation = 
              await shikshalokamHelper.getOrganisationsAndRootOrganisations(
                userDetails.userToken,
                userDetails.userId
              );

              let createdFor =  organisationAndRootOrganisation.createdFor;
              let rootOrganisations = organisationAndRootOrganisation.rootOrganisations;
  
              let createdSolutionAndProgram = 
              await solutionsHelper.createProgramAndSolutionFromTemplate(
                templateId,
                requestedData.program,
                userDetails.userId,
                solutionInformation,
                true,
                createdFor,
                rootOrganisations
              );

              await entityAssessorsHelper.update(
                  createdSolutionAndProgram.programId,
                  createdSolutionAndProgram._id,
                  userDetails.userId,
                  {
                      userId : userDetails.userId,
                      email : userDetails.email,
                      name : userDetails.firstName + userDetails.lastName,
                      externalId : userDetails.userName,
                      programId : createdSolutionAndProgram.programId,
                      solutionId : createdSolutionAndProgram._id,
                      entityTypeId : createdSolutionAndProgram.entityTypeId,
                      entityType : createdSolutionAndProgram.entityType,
                      role : messageConstants.common.LEAD_ASSESSOR,
                      createdBy : userDetails.userId,
                      updatedBy : userDetails.userId,
                      entities : createdSolutionAndProgram.entities
                  }
              );

              await solutionsHelper.addDefaultACL(
                createdSolutionAndProgram._id,
                [messageConstants.common.LEAD_ASSESSOR]
              );
  
              return resolve({
                message: messageConstants.apiResponses.CREATED_SOLUTION,
                result : createdSolutionAndProgram
              });
  
            } catch (error) {
                return reject(error);
            }
        });
    }

      /**
      * Assessment templates details
      * @method
      * @name templateDetails
      * @param {String} templateId - Template id.
      * @param {Boolean} showEcmwiseQuestions - showEcmwiseQuestions
      * @param {Boolean} filterPreviewQuestions - filterPreviewQuestions
      * @returns {Object} returns creator,about and list of questions.
     */

    static templateDetails(templateId,showEcmwiseQuestions= true,filterPreviewQuestions = false) {
        return new Promise(async (resolve, reject) => {
            try {

                let solutionDetails = 
                    await solutionsHelper.details(
                        templateId
                    );

                let criteriaIds = gen.utils.getCriteriaIds(solutionDetails.themes);
                
                let applyPreviewQuestionsOnlyFilter = false;

                if (filterPreviewQuestions) {
                    applyPreviewQuestionsOnlyFilter = {"evidences.sections.questions.showQuestionInPreview" : true }
                }

                let questionDetails = 
                await criteriaQuestionsHelper.details(
                    criteriaIds,
                    {
                        $project : {
                            "ecm" : "$evidences.code",
                            "question" : "$evidences.sections.questions.question"
                            }
                    },
                    applyPreviewQuestionsOnlyFilter
                );
                

                let templateQuestions = [];
              
                if (showEcmwiseQuestions) {

                   if( questionDetails.length > 0 ) {

                        questionDetails.forEach(questionData=>{
                        
                        let ecmIndex = 
                        templateQuestions.findIndex(
                            ecmQuestion=> ecmQuestion.ecm === questionData.ecm
                        );
    
                        if( ecmIndex < 0 ) {
                            
                            let ecmQuestion = {
                                ecm : questionData.ecm,
                                name : solutionDetails.evidenceMethods[questionData.ecm].name,
                                questions : []
                            }
    
                            templateQuestions.push(ecmQuestion);
                            ecmIndex = templateQuestions.length - 1;
                        }
    
                        let questionIndex = 
                        templateQuestions[ecmIndex].questions.findIndex(
                            question=> question === questionData.question[0]
                        );
    
                        if( questionIndex < 0 ) {
                            templateQuestions[ecmIndex].questions.push(questionData.question[0]);
                        }
    
                        })

                    } else {
                        Object.keys(solutionDetails.evidenceMethods).forEach(evidenceMethodCode => {
                            templateQuestions.push({
                                ecm : solutionDetails.evidenceMethods[evidenceMethodCode].externalId,
                                name : solutionDetails.evidenceMethods[evidenceMethodCode].name,
                                questions : []
                            });
                        })
                    }
                   
                } else {

                    templateQuestions = questionDetails.map(questionData=>{
                        return questionData.question[0]
                      });
    
                    templateQuestions = [...new Set(templateQuestions)]
                }

               let result = {
                   name : solutionDetails.name,
                   creator : solutionDetails.creator ? solutionDetails.creator : "",
                   entityType : solutionDetails.entityType,
                   description : solutionDetails.description,
                   linkTitle : solutionDetails.linkTitle ? solutionDetails.linkTitle: "",
                   linkUrl : solutionDetails.linkUrl ? solutionDetails.linkUrl: "",
                   questions : templateQuestions
                };

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

}