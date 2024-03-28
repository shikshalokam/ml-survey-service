/**
 * name : questionsController.js
 * author : Akash
 * created-date : 20-Jan-2019
 * Description : All questions related information.
 */

// Dependencies
const csv = require("csvtojson");
const questionsHelper = require(MODULES_BASE_PATH + "/questions/helper");
const FileStream = require(ROOT_PATH + "/generics/fileStream");
const criteriaQuestionsHelper = require(MODULES_BASE_PATH + "/criteriaQuestions/helper");

/**
    * Questions
    * @class
*/
module.exports = class Questions extends Abstract {
  constructor() {
    super(questionsSchema);
  }

  static get name() {
    return "questions";
  }

  /**
   * @api {post} /assessment/api/v1/questions/create Create Questions 
   * @apiVersion 1.0.0
   * @apiName Create Question
   * @apiGroup Questions
   * @apiUse successBody
   * @apiUse errorBody
   */

  /**
   * create questions.
   * @method
   * @name create
   * @param {Object} req - requested data.
   * @param {Object} req.body - requested question data. 
   * @returns {Object} 
   */

  create(req){
    return new Promise(async (resolve, reject) => {
      try {
        let questionDocuments = await questionsHelper.make(req.body);
        return resolve({
          result:questionDocuments
        });

      } catch (error) {
        reject({
          message: error
        });
      }
    });
  }


  /**
  * @api {post} /assessment/api/v1/questions/bulkCreate Upload questions CSV
  * @apiVersion 1.0.0
  * @apiName Upload questions via csv.
  * @apiGroup Questions
  * @apiParam {File} questions Mandatory questions file of type CSV.
  * @apiUse successBody
  * @apiUse errorBody
  */

  /**
   * Bulk create questions.
   * @method
   * @name bulkCreate
   * @param {Object} req - requested data.
   * @param {Object} req.files.questions - questions csv data. 
   * @returns {CSV} - Same existing csv with extra field _SYSTEM_ID to indicate 
   * whether the question is created or not . If created question id will be provided. 
   */

  bulkCreate(req){
    return new Promise(async (resolve, reject) => {
      try {
        
        if (!req.files || !req.files.questions) {

          return resolve({ 
            status : httpStatusCode.bad_request.status, 
            message : messageConstants.apiResponses.QUESTIONS_FILE_REQUIRED 
          });

        }

        let questionData = await csv().fromString(
          req.files.questions.data.toString()
        );

        let criteriaIds = new Array();
        let criteriaObject = {};

        let questionCollection = {};
        let questionIds = new Array();

        let solutionDocument = await database.models.solutions.findOne(
            { externalId: questionData[0]["solutionId"] },
            { evidenceMethods: 1, sections: 1, themes: 1, entityType: 1, externalId: 1, type: 1 }
        ).lean();
        
        if( !solutionDocument ) {
          return resolve({
            status : httpStatusCode.bad_request.status,
            message : messageConstants.apiResponses.SOLUTION_NOT_FOUND,
          })
        }

        let entityTypeDocument = await database.models.entityTypes.findOne({
          name : solutionDocument.entityType
        },{ profileFields : 1 }).lean();

        // Specific to survey type of solution
        let defaultSurveyEvidenceMethod;
        let defaultSurveySectionCode;
        let defaultSurveyCriteriaExternalId;
        if (solutionDocument.type == messageConstants.common.SURVEY) {
           
          defaultSurveyEvidenceMethod = solutionDocument.evidenceMethods[Object.keys(solutionDocument.evidenceMethods)[0]].externalId;
          defaultSurveyCriteriaExternalId = solutionDocument.externalId + "-SF"
          defaultSurveySectionCode = Object.keys(solutionDocument.sections)[0]
          
          if (!entityTypeDocument) {
           entityTypeDocument = {
             profileFields: []
           };
         }
 
       }

        let criteriasIdArray = gen.utils.getCriteriaIds(
          solutionDocument.themes
        );
        let criteriasArray = new Array();

        criteriasIdArray.forEach(eachCriteriaIdArray => {
          criteriasArray.push(eachCriteriaIdArray._id.toString());
        });

        // No changes required here.
        questionData.forEach(eachQuestionData => {
          let parsedQuestion = gen.utils.valueParser(eachQuestionData);
          
          if (solutionDocument.type == messageConstants.common.SURVEY) {
              parsedQuestion["criteriaExternalId"] = defaultSurveyCriteriaExternalId;
          }

          if (!criteriaIds.includes(parsedQuestion["criteriaExternalId"])) {
            criteriaIds.push(parsedQuestion["criteriaExternalId"]);
          }

          if (!questionIds.includes(parsedQuestion["externalId"]))
            questionIds.push(parsedQuestion["externalId"]);

          if (
            parsedQuestion["hasAParentQuestion"] !== "NO" &&
            !questionIds.includes(parsedQuestion["parentQuestionId"])
          ) {
            questionIds.push(parsedQuestion["parentQuestionId"]);
          }

          if (
            parsedQuestion["instanceParentQuestionId"] !== "NA" &&
            !questionIds.includes(parsedQuestion["instanceParentQuestionId"])
          ) {
            questionIds.push(parsedQuestion["instanceParentQuestionId"]);
          }
        });

        let criteriaDocument = await database.models.criteria.find({
            externalId: { $in: criteriaIds }
        }).lean();

        if (!(criteriaDocument.length > 0)) {
          throw messageConstants.apiResponses.CRITERIA_NOT_FOUND;
        }

        criteriaDocument.forEach(eachCriteriaDocument => {
          if (criteriasArray.includes(eachCriteriaDocument._id.toString())) {
            criteriaObject[
              eachCriteriaDocument.externalId
            ] = eachCriteriaDocument;
          }
        });

        let questionsFromDatabase = await database.models.questions
          .find({
            externalId: { $in: questionIds }
          })
          .lean();

        if (questionsFromDatabase.length > 0) {
          questionsFromDatabase.forEach(question => {
            questionCollection[question.externalId] = question;
          });
        }

        const fileName = `Question-Upload-Result`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        let pendingItems = new Array();

        // Question from csv
        function questionInCsv(parsedQuestionData) {
          let question = {};

          if (questionCollection[parsedQuestionData["externalId"]]) {
            question[parsedQuestionData["externalId"]] =
              questionCollection[parsedQuestionData["externalId"]];
          }

          if (
            parsedQuestionData["instanceParentQuestionId"] !== "NA" &&
            questionCollection[parsedQuestionData["instanceParentQuestionId"]]
          ) {
            question[parsedQuestionData["instanceParentQuestionId"]] =
              questionCollection[parsedQuestionData["instanceParentQuestionId"]];
          }

          if (
            parsedQuestionData["hasAParentQuestion"] == "YES" &&
            questionCollection[parsedQuestionData["parentQuestionId"]]
          ) {
            question[parsedQuestionData["parentQuestionId"]] =
              questionCollection[parsedQuestionData["parentQuestionId"]];
          }
          return question;
        }

        // Create question
        function createQuestion(
          parsedQuestion, 
          question, 
          criteria, 
          ecm, 
          section,
          profileFields
        ) {
          let resultFromCreateQuestions = questionsHelper.createQuestions(
            parsedQuestion,
            question,
            criteria,
            ecm,
            section,
            profileFields
          );

          return resultFromCreateQuestions;
        }

        for (
          let pointerToQuestionData = 0;
          pointerToQuestionData < questionData.length;
          pointerToQuestionData++
        ) {
          let parsedQuestion = gen.utils.valueParser(
            questionData[pointerToQuestionData]
          );

          let criteria = {};
          let ecm = {};
          
          if (solutionDocument.type == messageConstants.common.SURVEY) {
              parsedQuestion["evidenceMethod"] = defaultSurveyEvidenceMethod;
              parsedQuestion.criteriaExternalId = defaultSurveyCriteriaExternalId;
              parsedQuestion.section = defaultSurveySectionCode;
          }
          
          ecm[parsedQuestion["evidenceMethod"]] = {
            code:
              solutionDocument.evidenceMethods[parsedQuestion["evidenceMethod"]]
                .externalId
          };
           
          criteria[parsedQuestion.criteriaExternalId] =
            criteriaObject[parsedQuestion.criteriaExternalId];

          let section;
          
          if (solutionDocument.sections[parsedQuestion.section]) {
            section = parsedQuestion.section;
          } 
          if (
            (parsedQuestion["hasAParentQuestion"] == "YES" &&
              !questionCollection[parsedQuestion["parentQuestionId"]]) ||
            (parsedQuestion["instanceParentQuestionId"] !== "NA" &&
              !questionCollection[parsedQuestion["instanceParentQuestionId"]])
          ) {
            pendingItems.push({
              parsedQuestion: parsedQuestion,
              criteriaToBeSent: criteria,
              evaluationFrameworkMethod: ecm,
              section: section
            });
          } else {

            let question = questionInCsv(parsedQuestion);

            let resultFromCreateQuestions = await createQuestion(
              parsedQuestion,
              question, 
              criteria, 
              ecm, 
              section,
              entityTypeDocument.profileFields
            );

            if (resultFromCreateQuestions.result) {
              questionCollection[resultFromCreateQuestions.result.externalId] =
                resultFromCreateQuestions.result;
            }
            input.push(resultFromCreateQuestions.total[0]);
          }
        }

        if (pendingItems) {
          for (
            let pointerToPendingData = 0;
            pointerToPendingData < pendingItems.length;
            pointerToPendingData++
          ) {

            let eachPendingItem = pendingItems[pointerToPendingData];

            let question = questionInCsv(eachPendingItem);

            let csvQuestionData = await createQuestion(
              eachPendingItem.parsedQuestion, 
              question, 
              eachPendingItem.criteriaToBeSent, 
              eachPendingItem.evaluationFrameworkMethod, 
              eachPendingItem.section,
              entityTypeDocument.profileFields
            );

            input.push(csvQuestionData.total[0]);
          }
        }

        input.push(null);
      } catch (error) {
        reject({
          message: error
        });
      }
    });
  }

  /**
   * @api {post} /assessment/api/v1/questions/bulkUpdate Bulk Update Questions CSV
   * @apiVersion 1.0.0
   * @apiName Bulk Update Questions CSV
   * @apiGroup Questions
   * @apiParam {File} questions Mandatory questions file of type CSV.
   * @apiUse successBody
   * @apiUse errorBody
   */

  /**
   * Questions bulk update.
   * @method
   * @name bulkUpdate
   * @param {Object} req - requested data.
   * @param {Object} req.files.questions - bulk create questions csv 
   * consisting of SYSTEM_ID. 
   * @returns {CSV} - same csv with extra field UPDATE_STATUS to indicate 
   * whether the question is updated or not.  
   */

  bulkUpdate(req) {
    return new Promise(async (resolve, reject) => {
      try {

        if (!req.files || !req.files.questions) {

          return resolve({ 
            status: httpStatusCode.bad_request.status, 
            message: messageConstants.apiResponses.QUESTIONS_FILE_REQUIRED 
          });

        }

        let questionData = await csv().fromString(
          req.files.questions.data.toString()
        );

        let solutionDocument = await database.models.solutions
          .findOne(
            { externalId: questionData[0]["solutionId"] },
            { evidenceMethods: 1, sections: 1, themes: 1, entityType: 1, externalId: 1, type: 1 }
          )
          .lean();

        if( !solutionDocument ) {
          return resolve({
            status : httpStatusCode.bad_request.status,
            message : messageConstants.apiResponses.SOLUTION_NOT_FOUND
          })
        }

        let entityTypeDocument = await database.models.entityTypes.findOne({
          name : solutionDocument.entityType
        },{ profileFields : 1 }).lean();

         // Specific to survey type of solution
         let defaultSurveyEvidenceMethod;
         let defaultSurveySectionCode;
         let defaultSurveyCriteriaExternalId;
         if (solutionDocument.type == messageConstants.common.SURVEY) {
            
           defaultSurveyEvidenceMethod = solutionDocument.evidenceMethods[Object.keys(solutionDocument.evidenceMethods)[0]].externalId;
           defaultSurveyCriteriaExternalId = solutionDocument.externalId + "-SF"
           defaultSurveySectionCode = Object.keys(solutionDocument.sections)[0]
           
           if (!entityTypeDocument) {
            entityTypeDocument = {
              profileFields: []
            };
          }
  
        }
 

        let criteriasIdArray = gen.utils.getCriteriaIds(
          solutionDocument.themes
        );

        if (criteriasIdArray.length < 1) {
          throw messageConstants.apiResponses.CRITERIA_NOT_FOUND;
        }

        let allCriteriaDocument = await database.models.criteria
          .find({ _id: { $in: criteriasIdArray } }, { evidences: 1, externalId: 1 })
          .lean();

        if (allCriteriaDocument.length < 1) {
          throw messageConstants.apiResponses.CRITERIA_NOT_FOUND;
        }

        let currentQuestionMap = {};

        let criteriaMap = {};

        allCriteriaDocument.forEach(eachCriteria => {

          criteriaMap[eachCriteria.externalId] = eachCriteria._id.toString();

          eachCriteria.evidences.forEach(eachEvidence => {
            eachEvidence.sections.forEach(eachSection => {
              eachSection.questions.forEach(eachQuestion => {
                currentQuestionMap[eachQuestion.toString()] = {
                  qid: eachQuestion.toString(),
                  sectionCode: eachSection.code,
                  evidenceMethodCode: eachEvidence.code,
                  criteriaId: eachCriteria._id.toString(),
                  criteriaExternalId: eachCriteria.externalId
                };
              })
            })
          })
        })

        let allQuestionsDocument = await database.models.questions
          .find(
            { _id: { $in: Object.keys(currentQuestionMap) } },
            {
              externalId: 1,
              children: 1,
              instanceQuestions: 1
            }
          )
          .lean();

        if (allQuestionsDocument.length < 1) {
          throw messageConstants.apiResponses.QUESTION_NOT_FOUND;
        }

        let questionExternalToInternalIdMap = {};
        allQuestionsDocument.forEach(eachQuestion => {

          currentQuestionMap[eachQuestion._id.toString()].externalId = eachQuestion.externalId;
          questionExternalToInternalIdMap[eachQuestion.externalId] = eachQuestion._id.toString();

          if (eachQuestion.children && eachQuestion.children.length > 0) {
            eachQuestion.children.forEach(childQuestion => {
              if (currentQuestionMap[childQuestion.toString()]) {
                currentQuestionMap[childQuestion.toString()].parent = eachQuestion._id.toString();
              }
            })
          }

          if (eachQuestion.instanceQuestions && eachQuestion.instanceQuestions.length > 0) {
            eachQuestion.instanceQuestions.forEach(instanceChildQuestion => {
              if (currentQuestionMap[instanceChildQuestion.toString()]) {
                currentQuestionMap[instanceChildQuestion.toString()].instanceParent = eachQuestion._id.toString();
              }
            })
          }

        });

        const fileName = `Question-Upload-Result`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        let pendingItems = new Array();

        for (
          let pointerToQuestionData = 0;
          pointerToQuestionData < questionData.length;
          pointerToQuestionData++
        ) {

          let parsedQuestion = gen.utils.valueParser(
            questionData[pointerToQuestionData]
          );

          if (!parsedQuestion["_SYSTEM_ID"] || parsedQuestion["_SYSTEM_ID"] == "" || !currentQuestionMap[parsedQuestion["_SYSTEM_ID"]]) {
            parsedQuestion["UPDATE_STATUS"] = "Invalid Question Internal ID";
            input.push(_.omitBy(parsedQuestion, (value, key) => { return _.startsWith(key, "_") && key != "_SYSTEM_ID" }));
            continue;
          }

          if (solutionDocument.type == messageConstants.common.SURVEY) {
            parsedQuestion["criteriaExternalId"] = defaultSurveyCriteriaExternalId;
            parsedQuestion["evidenceMethod"] = defaultSurveyEvidenceMethod;
            parsedQuestion.section = defaultSurveySectionCode;
          }
          
          if (!parsedQuestion["criteriaExternalId"] || parsedQuestion["criteriaExternalId"] == "" || !criteriaMap[parsedQuestion["criteriaExternalId"]]) {
            parsedQuestion["UPDATE_STATUS"] = "Invalid Criteria External ID";
            input.push(_.omitBy(parsedQuestion, (value, key) => { return _.startsWith(key, "_") && key != "_SYSTEM_ID" }));
            continue;
          } else {
            parsedQuestion["_criteriaInternalId"] = criteriaMap[parsedQuestion["criteriaExternalId"]];
          }

          let ecm = (solutionDocument.evidenceMethods[parsedQuestion["evidenceMethod"]] && solutionDocument.evidenceMethods[parsedQuestion["evidenceMethod"]].externalId) ? solutionDocument.evidenceMethods[parsedQuestion["evidenceMethod"]].externalId : "";
          if (ecm == "") {
            parsedQuestion["UPDATE_STATUS"] = "Invalid Evidence Method Code";
            input.push(_.omitBy(parsedQuestion, (value, key) => { return _.startsWith(key, "_") && key != "_SYSTEM_ID" }));
            continue;
          } else {
            parsedQuestion["_evidenceMethodCode"] = solutionDocument.evidenceMethods[parsedQuestion["evidenceMethod"]].externalId;
          }
          
          let section = (solutionDocument.sections[parsedQuestion.section]) ? solutionDocument.sections[parsedQuestion.section] : "";
          if (section == "") {
            parsedQuestion["UPDATE_STATUS"] = "Invalid Section Method Code";
            input.push(_.omitBy(parsedQuestion, (value, key) => { return _.startsWith(key, "_") && key != "_SYSTEM_ID" }));
            continue;
          } else {
            parsedQuestion["_sectionCode"] = parsedQuestion.section;
          }

          // Parent question CSV data validation begins.
          parsedQuestion["hasAParentQuestion"] = parsedQuestion["hasAParentQuestion"].toUpperCase();

          if (parsedQuestion["hasAParentQuestion"] != "YES" && parsedQuestion["hasAParentQuestion"] != "NO") {

            parsedQuestion["UPDATE_STATUS"] = "Invalid value for column hasAParentQuestion";
            input.push(_.omitBy(parsedQuestion, (value, key) => { return _.startsWith(key, "_") && key != "_SYSTEM_ID" }));
            continue;

          } else if (parsedQuestion["hasAParentQuestion"] == "YES") {

            if (parsedQuestion["parentQuestionId"] == "" || !currentQuestionMap[questionExternalToInternalIdMap[parsedQuestion["parentQuestionId"]]]) {
              parsedQuestion["UPDATE_STATUS"] = "Invalid Parent Question ID";
              input.push(_.omitBy(parsedQuestion, (value, key) => { return _.startsWith(key, "_") && key != "_SYSTEM_ID" }));
              continue;
            } else {
              parsedQuestion["_parentQuestionId"] = questionExternalToInternalIdMap[parsedQuestion["parentQuestionId"]];
            }

          } else if (parsedQuestion["hasAParentQuestion"] == "NO") {
            parsedQuestion["_parentQuestionId"] = "";
          }
          // Parent question CSV data validation ends.


          // Instance Parent question CSV data validation begins.
          parsedQuestion["instanceParentQuestionId"] = parsedQuestion["instanceParentQuestionId"].toUpperCase()
          if (parsedQuestion["instanceParentQuestionId"] == "") {

            parsedQuestion["UPDATE_STATUS"] = "Invalid value for column instanceParentQuestionId";
            input.push(_.omitBy(parsedQuestion, (value, key) => { return _.startsWith(key, "_") && key != "_SYSTEM_ID" }));
            continue;

          } else if (parsedQuestion["instanceParentQuestionId"] == "NA") {

            parsedQuestion["_instanceParentQuestionId"] = "";

          } else {

            if (currentQuestionMap[questionExternalToInternalIdMap[parsedQuestion["instanceParentQuestionId"]]] && currentQuestionMap[questionExternalToInternalIdMap[parsedQuestion["instanceParentQuestionId"]]] != "") {
              parsedQuestion["_instanceParentQuestionId"] = questionExternalToInternalIdMap[parsedQuestion["instanceParentQuestionId"]];
            } else {
              parsedQuestion["UPDATE_STATUS"] = "Invalid Instance Parent Question ID";
              input.push(_.omitBy(parsedQuestion, (value, key) => { return _.startsWith(key, "_") && key != "_SYSTEM_ID" }));
              continue;
            }

          }
          // Instance Parent question CSV data validation ends.

          let currentQuestion = currentQuestionMap[parsedQuestion["_SYSTEM_ID"]];

          if (currentQuestion.criteriaId != parsedQuestion["_criteriaInternalId"] || currentQuestion.sectionCode != parsedQuestion["_sectionCode"] || currentQuestion.evidenceMethodCode != parsedQuestion["_evidenceMethodCode"]) {
            // remove question from criteria (qid,criteiaid, ecm, section)
            let criteriaToUpdate = await database.models.criteria.findOne(
              {
                _id: ObjectId(currentQuestion.criteriaId)
              },
              {
                evidences: 1
              }
            );

            criteriaToUpdate.evidences.forEach(eachEvidence => {
              if (eachEvidence.code == currentQuestion.evidenceMethodCode) {
                eachEvidence.sections.forEach(eachSection => {
                  if (eachSection.code == currentQuestion.sectionCode) {
                    let newSectionQuestions = new Array;
                    for (let questionObjectPointer = 0; questionObjectPointer < eachSection.questions.length; questionObjectPointer++) {
                      if (eachSection.questions[questionObjectPointer].toString() != currentQuestion.qid) {
                        newSectionQuestions.push(eachSection.questions[questionObjectPointer]);
                      }
                    }
                    eachSection.questions = newSectionQuestions;
                  }
                })
              }
            })

            let queryCriteriaObject = {
              _id: criteriaToUpdate._id
            };

            let updateCriteriaObject = {};
            updateCriteriaObject.$set = {
              ["evidences"]: criteriaToUpdate.evidences
            };

            await database.models.criteria.findOneAndUpdate(
              queryCriteriaObject,
              updateCriteriaObject
            );

            await criteriaQuestionsHelper.createOrUpdate(
              criteriaToUpdate._id,
              true
            );

            parsedQuestion["_setQuestionInCriteria"] = true;
          }

          if (currentQuestion.instanceParent && currentQuestion.instanceParent != "" && currentQuestion.instanceParent != parsedQuestion["_instanceParentQuestionId"]) {
            // remove instance child from instance parent (childQid,instanceParentQid)
            await database.models.questions.findOneAndUpdate(
              {
                _id: ObjectId(currentQuestion.instanceParent)
              },
              {
                $pull: { instanceQuestions: ObjectId(currentQuestion.qid) }
              }, {
                _id: 1
              }
            );
          }


          if (currentQuestion.parent && currentQuestion.parent != "" && currentQuestion.parent != parsedQuestion["_parentQuestionId"]) {
            // remove child from parent and , parent from child (childQid,parentQid)

            await database.models.questions.findOneAndUpdate(
              {
                _id: ObjectId(currentQuestion.qid)
              },
              {
                $pull: { visibleIf: { "_id": ObjectId(currentQuestion.parent) } }
              }, {
                _id: 1
              }
            );

            await database.models.questions.findOneAndUpdate(
              {
                _id: ObjectId(currentQuestion.parent)
              },
              {
                $pull: { children: ObjectId(currentQuestion.qid) }
              }, {
                _id: 1
              }
            );
          }

          let updateQuestion = await questionsHelper.updateQuestion(
            parsedQuestion,
            entityTypeDocument.profileFields
          );

          input.push(_.omitBy(updateQuestion, (value, key) => { return _.startsWith(key, "_") && key != "_SYSTEM_ID" }));
        }

        input.push(null);

      } catch (error) {
        reject({
          message: error
        });
      }
    });
  }

    /**
 * @api {post} /assessment/api/v1/questions/delete/:questionId delete Question
 * @apiVersion 1.0.0
 * @apiName delete Question
 * @apiGroup Questions
 * @apiHeader {String} internal-access-token Authenticity token
 * @apiSampleRequest /assessment/api/v1/questions/delete/5da829874c67d63cca1bd9d0
 * @apiHeader {String} X-authenticated-user-token Authenticity token  
 * @apiUse successBody
 * @apiUse errorBody
 */

  /**
   * Delete Question.
   * @method
   * @name delete
   * @param {Object} req -request Data.
   * @param {String} req.params._id- question Id
   * @returns {JSON} - message and status of question deleted.
   */

  async delete(req) {
    return new Promise(async (resolve, reject) => {

      try {

          let result = await questionsHelper.delete(req.params._id);

          return resolve({
            message: result.message
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

};
