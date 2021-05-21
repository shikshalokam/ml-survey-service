/**
 * name : reportsController.js
 * author : Aman
 * created-date : 22-Dec-2018
 * Description : Reports related information.
 */

// Dependencies
const moment = require("moment-timezone");
const FileStream = require(ROOT_PATH + "/generics/fileStream");
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const reportsHelper = require(MODULES_BASE_PATH + "/reports/helper");
let imageBaseUrl = ""
  // "https://storage.cloud.google.com/sl-" +
  // (process.env.NODE_ENV == "production" ? "prod" : "dev") +
  // "-storage/";

/**
    * Reports
    * @class
*/
module.exports = class Reports {

  constructor() { 
    reportsHelper.getFilePublicBaseUrl().then(data => {imageBaseUrl = data })
  }

  static get name() {
    return "submissions";
  }

  /**
   * @api {get} /assessment/api/v1/reports/status/:solutionExternalId Fetch submission reports for entity
   * @apiVersion 1.0.0
   * @apiName Fetch submission reports for entity
   * @apiGroup Report
   * @apiUse successBody
   * @apiUse errorBody
   */

   /**
   * submission status.
   * @method
   * @name status
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id .
   * @returns {CSV} - csv consist of entity id, entity name,programId,programName,
   * status,each evidence external id field(like BL,Lw,etc),
   * each evidence external id duplicate field if conflict is there(eg:BL-duplication),
   * each evidence external id gpsLocation
   */

  async status(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let submissionQueryObject = {
          solutionExternalId: req.params._id
        };

        let submissionsIds = await database.models.submissions
          .find(submissionQueryObject, {
            _id: 1
          })
          .lean();

        const fileName = `status`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        if (!submissionsIds.length) {
          return resolve({
            status: httpStatusCode.not_found.status,
            message: messageConstants.apiResponses.SUBMISSION_NOT_FOUND
          });
        } else {
          let chunkOfSubmissionsIdsDocument = _.chunk(submissionsIds, 10);
          let submissionId;
          let submissionDocumentsArray;

          for (
            let pointerTosubmissionIdDocument = 0;
            pointerTosubmissionIdDocument <
            chunkOfSubmissionsIdsDocument.length;
            pointerTosubmissionIdDocument++
          ) {
            submissionId = chunkOfSubmissionsIdsDocument[
              pointerTosubmissionIdDocument
            ].map(submissionModel => {
              return submissionModel._id;
            });

            submissionDocumentsArray = await database.models.submissions
              .find(
                {
                  _id: {
                    $in: submissionId
                  }
                },
                {
                  "entityInformation.externalId": 1,
                  "entityInformation.name": 1,
                  "programInformation.name": 1,
                  "programInformation.externalId": 1,
                  entityId: 1,
                  programId: 1,
                  status: 1,
                  "evidencesStatus.isSubmitted": 1,
                  "evidencesStatus.hasConflicts": 1,
                  "evidencesStatus.externalId": 1,
                  "evidencesStatus.notApplicable": 1,
                  "evidencesStatus.submissions": 1
                }
              )
              .lean();
            await Promise.all(
              submissionDocumentsArray.map(async eachSubmissionDocument => {
                let result = {};

                if (eachSubmissionDocument.entityInformation) {
                  result["Entity Id"] =
                    eachSubmissionDocument.entityInformation.externalId;
                  result["Entity Name"] =
                    eachSubmissionDocument.entityInformation.name;
                } else {
                  result["Entity Id"] = eachSubmissionDocument.entityId;
                }

                if (eachSubmissionDocument.programInformation) {
                  result["Program Id"] = eachSubmissionDocument.programId;
                  result["Program Name"] =
                    eachSubmissionDocument.programInformation.name;
                } else {
                  result["Program Id"] = eachSubmissionDocument.programId;
                }

                result["Status"] = eachSubmissionDocument.status;

                let totalEcmsSubmittedCount = 0;
                eachSubmissionDocument.evidencesStatus.forEach(
                  evidenceMethod => {
                    if (
                      evidenceMethod.isSubmitted &&
                      evidenceMethod.notApplicable != true
                    ) {
                      totalEcmsSubmittedCount += 1;
                    }
                    _.merge(result, {
                      [evidenceMethod.externalId]: evidenceMethod.isSubmitted
                        ? evidenceMethod.notApplicable != true
                          ? true
                          : "NA"
                        : false
                    });
                    _.merge(result, {
                      [evidenceMethod.externalId + "-gpsLocation"]:
                        evidenceMethod.submissions.length > 0
                          ? evidenceMethod.submissions[0].gpsLocation
                          : ""
                    });
                    _.merge(result, {
                      [evidenceMethod.externalId +
                        "-duplication"]: evidenceMethod.hasConflicts
                          ? evidenceMethod.hasConflicts
                          : false
                    });
                  }
                );

                result["Total ECMs Submitted"] = totalEcmsSubmittedCount;
                input.push(result);
              })
            );
          }
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message : error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/assessorEntities/:solutionExternalId Fetch assessors reports for entities
   * @apiVersion 1.0.0
   * @apiName Fetch assessors reports for entities
   * @apiGroup Report
   * @apiUse successBody
   * @apiUse errorBody
   */

   /**
   * Entities in assessor.
   * @method
   * @name assessorEntities
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id .
   * @returns {CSV} - csv consists of assessorId,assessorUserId,parentId,
   * assessorName,assessorEmail,assessorRole,solutionId,entityId,entityName
   */

  async assessorEntities(req) {
    return new Promise(async (resolve, reject) => {
      try {

        const solutionDocument = await database.models.solutions.findOne(
          { externalId: req.params._id },
          { _id: 1 }
        ).lean();

        const assessorDocument = await database.models.entityAssessors.find(
          { solutionId: solutionDocument._id },
          { _id: 1 }
        ).lean();

        const fileName = `assessorSchoolsfile`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();
        if (!assessorDocument.length) {
          return resolve({
            status: httpStatusCode.not_found.status,
            message: messageConstants.apiResponses.ASSESSOR_NOT_FOUND
          });
        } else {
          let chunkOfAssessorDocument = _.chunk(assessorDocument, 10);
          let assessorId;
          let assessorsDocuments;

          for (
            let pointerToAssessorIdDocument = 0;
            pointerToAssessorIdDocument < chunkOfAssessorDocument.length;
            pointerToAssessorIdDocument++
          ) {
            assessorId = chunkOfAssessorDocument[
              pointerToAssessorIdDocument
            ].map(assessorModel => {
              return assessorModel._id;
            });

            let assessorQueryObject = [
              {
                $match: {
                  _id: {
                    $in: assessorId
                  }
                }
              },
              { $addFields: { entityIdInObjectIdForm: "$entities" } },
              {
                $lookup: {
                  from: "entities",
                  localField: "entityIdInObjectIdForm",
                  foreignField: "_id",
                  as: "entityDocument"
                }
              },
              {
                $project: {
                  externalId: 1,
                  userId: 1,
                  parentId: 1,
                  email: 1,
                  role: 1,
                  name: 1,
                  "entityDocument.metaInformation": 1
                }
              }
            ];

            assessorsDocuments = await database.models.entityAssessors.aggregate(
              assessorQueryObject
            );

            await Promise.all(
              assessorsDocuments.map(async assessor => {
                assessor.entityDocument.forEach(eachAssessorentity => {
                  input.push({
                    "Assessor Id": assessor.externalId,
                    "Assessor UserId": assessor.userId,
                    "Parent Id": assessor.parentId ? assessor.parentId : "",
                    "Assessor Name": assessor.name ? assessor.name : "",
                    "Assessor Email": assessor.email ? assessor.email : "",
                    "Assessor Role": assessor.role,
                    "Solution Id": req.params._id,
                    "Entity Id": eachAssessorentity.metaInformation.externalId,
                    "Entity Name": eachAssessorentity.metaInformation.name
                  });
                });
              })
            );
          }
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message : error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/entityAssessors/:solutionExternalId Fetch entity wise assessor reports
   * @apiVersion 1.0.0
   * @apiName Fetch entity wise assessor reports
   * @apiGroup Report
   * @apiUse successBody
   * @apiUse errorBody
   */
     /**
   * Assessors in entity.
   * @method
   * @name entityAssessors
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id .
   * @returns {CSV} - csv consists of assessor entity id,assessor entity name,
   * assessor userId,assessorId,assessorName,assessorEmail,parentId,assessorRole,
   * solutionId
   */

  async entityAssessors(req) {
    return new Promise(async (resolve, reject) => {
      try {

        const solutionDocument = await database.models.solutions.findOne(
          { externalId: req.params._id },
          { _id: 1 }
        ).lean();

        const assessorDocument = await database.models.entityAssessors.find(
          { solutionId: solutionDocument._id },
          { _id: 1 }
        ).lean();

        const fileName = `entityAssessors`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();
        if (!assessorDocument.length) {
          return resolve({
            status: httpStatusCode.not_found.status,
            message: messageConstants.apiResponses.ASSESSOR_NOT_FOUND
          });
        } else {
          let chunkOfAssessorDocument = _.chunk(assessorDocument, 10);
          let assessorId;
          let assessorsDocuments;

          for (
            let pointerToAssessorIdDocument = 0;
            pointerToAssessorIdDocument < chunkOfAssessorDocument.length;
            pointerToAssessorIdDocument++
          ) {
            assessorId = chunkOfAssessorDocument[
              pointerToAssessorIdDocument
            ].map(assessorModel => {
              return assessorModel._id;
            });

            let assessorQueryObject = [
              {
                $match: {
                  _id: {
                    $in: assessorId
                  }
                }
              },
              { $addFields: { entityIdInObjectIdForm: "$entities" } },
              {
                $lookup: {
                  from: "entities",
                  localField: "entityIdInObjectIdForm",
                  foreignField: "_id",
                  as: "entityDocument"
                }
              },
              {
                $project: {
                  externalId: 1,
                  userId: 1,
                  name: 1,
                  email: 1,
                  parentId: 1,
                  role: 1,
                  "entityDocument.metaInformation": 1
                }
              }
            ];

            assessorsDocuments = await database.models.entityAssessors.aggregate(
              assessorQueryObject
            );

            await Promise.all(
              assessorsDocuments.map(async assessor => {
                assessor.entityDocument.forEach(eachAssessorEntity => {
                  input.push({
                    "Assessor entity Id":
                      eachAssessorEntity.metaInformation.externalId,
                    "Assessor entity Name":
                      eachAssessorEntity.metaInformation.name,
                    "Assessor User Id": assessor.userId,
                    "Assessor Id": assessor.externalId,
                    "Assessor Name": assessor.name ? assessor.name : "",
                    "Assessor Email": assessor.email ? assessor.email : "",
                    "Parent Id": assessor.parentId ? assessor.parentId : "",
                    "Assessor Role": assessor.role,
                    "Solution Id": req.params._id
                  });
                });
              })
            );
          }
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message : error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/solutionEntityStatus/:solutionExternalId Fetch entity status based on solution Id
   * @apiVersion 1.0.0
   * @apiName Fetch entity status based on solution Id
   * @apiGroup Report
   * @apiUse successBody
   * @apiUse errorBody
   */

    /**
   * All solution entities status.
   * @method
   * @name solutionEntityStatus
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id .
   * @returns {CSV} - csv consists of status,completedDate,submission count,
   * createdAt.
   */

  async solutionEntityStatus(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = {};
        req.body = req.body || {};

        result.entityId = new Array();

        let solutionDocument = await database.models.solutions
          .findOne(
            {
              externalId: req.params._id
            },
            { entities: 1 }
          )
          .lean();

        result.entityId.push(...solutionDocument.entities);

        let entityDocument = database.models.entities
          .find(
            {
              _id: { $in: result.entityId }
            },
            {
              "metaInformation.name": 1,
              "metaInformation.externalId": 1
            }
          )
          .exec();

        let submissionDataWithEvidencesCount = database.models.submissions.aggregate(
          [
            {
              $match: { solutionId: solutionDocument._id }
            },
            {
              $project: {
                entityId: 1,
                status: 1,
                completedDate: 1,
                createdAt: 1,
                solutionExternalId: 1,
                submissionCount: {
                  $reduce: {
                    input: "$evidencesStatus",
                    initialValue: 0,
                    in: {
                      $sum: [
                        "$$value",
                        { $cond: [{ $eq: ["$$this.isSubmitted", true] }, 1, 0] }
                      ]
                    }
                  }
                }
              }
            }
          ]
        );

        const fileName = `solutionsEntityStatusBySolutionId_${req.params._id}`;

        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        Promise.all([entityDocument, submissionDataWithEvidencesCount]).then(
          submissionWithEntityDocument => {
            let [
              entityDocument,
              submissionDataWithEvidencesCount
            ] = submissionWithEntityDocument;

            let entitySubmission = {};

            submissionDataWithEvidencesCount.forEach(submission => {
              entitySubmission[submission.entityId.toString()] = {
                status: submission.status,
                completedDate: submission.completedDate
                  ? reportsHelper.gmtToIst(submission.completedDate)
                  : "-",
                createdAt: submission.createdAt
                  ? reportsHelper.gmtToIst(submission.createdAt)
                  : "-",
                submissionCount: submission.submissionCount
              };
            });
            if (
              !entityDocument.length ||
              !submissionDataWithEvidencesCount.length
            ) {
              return resolve({
                status: httpStatusCode.not_found.status,
                message: messageConstants.apiResponses.NO_DATA_FOUND
              });
            } else {
              entityDocument.forEach(entity => {
                let solutionsEntityStatusObject = {
                  "solutions Id": req.params._id,
                  "Entity Name": entity.metaInformation.name,
                  "Entity Id": entity.metaInformation.externalId
                };

                if (entitySubmission[entity._id.toString()]) {
                  solutionsEntityStatusObject["Status"] =
                    entitySubmission[entity._id.toString()].status;
                  solutionsEntityStatusObject["Created At"] =
                    entitySubmission[entity._id.toString()].createdAt;
                  solutionsEntityStatusObject[
                    "Completed Date"
                  ] = entitySubmission[entity._id.toString()].completedDate
                      ? entitySubmission[entity._id.toString()].completedDate
                      : "-";
                  solutionsEntityStatusObject["Submission Count"] =
                    entitySubmission[entity._id.toString()].status == "started"
                      ? 0
                      : entitySubmission[entity._id.toString()].submissionCount;
                } else {
                  solutionsEntityStatusObject["Status"] = "pending";
                  solutionsEntityStatusObject["Created At"] = "-";
                  solutionsEntityStatusObject["Completed Date"] = "-";
                  solutionsEntityStatusObject["Submission Count"] = 0;
                }
                input.push(solutionsEntityStatusObject);
              });
            }
            input.push(null);
          }
        );
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/solutionsSubmissionStatus/:solutionExternalId?evidenceId=LW Fetch solution submission status
   * @apiVersion 1.0.0
   * @apiName Fetch solution submission status
   * @apiGroup Report
   * @apiParam {String} evidenceId Evidence ID.
   * @apiUse successBody
   * @apiUse errorBody
   */

    /**
   * Status of the solutions submission.
   * @method
   * @name solutionsSubmissionStatus
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id .
   * @returns {CSV} - csv consists of entity name,entity id,question,question id,
   * answers,remarks,start time,end time,files and submission date
   */

  async solutionsSubmissionStatus(req) {
    return new Promise(async (resolve, reject) => {
      try {
        const evidenceIdFromRequestParam = req.query.evidenceId;
        const evidenceQueryObject =
          "evidences." + evidenceIdFromRequestParam + ".isSubmitted";
        const fetchRequiredSubmissionDocumentIdQueryObj = {
          solutionExternalId: req.params._id,
          [evidenceQueryObject]: true,
          status: {
            $nin: ["started"]
          }
        };

        const submissionDocumentIdsToProcess = await database.models.submissions
          .find(fetchRequiredSubmissionDocumentIdQueryObj, { _id: 1 })
          .lean();

        const solutionDocuments = await database.models.solutions
          .findOne(
            {
              externalId: req.params._id
            },
            { themes: 1 }
          )
          .lean();

        const criteriasId = gen.utils.getCriteriaIds(solutionDocuments.themes);

        let allCriteriaDocument = await database.models.criteria
          .find({ _id: { $in: criteriasId } }, { evidences: 1 })
          .lean();
        let questionIds = gen.utils.getAllQuestionId(allCriteriaDocument);

        let questionIdObject = {};
        const questionDocument = await database.models.questions
          .find(
            { _id: { $in: questionIds } },
            { externalId: 1, options: 1, question: 1 }
          )
          .lean();

        questionDocument.forEach(eachQuestionId => {
          questionIdObject[eachQuestionId._id] = {
            questionExternalId: eachQuestionId.externalId,
            questionOptions: eachQuestionId.options,
            questionName: eachQuestionId.question
          };
        });

        const fileName = `solutionsSubmissionStatus_${evidenceIdFromRequestParam}`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        if (!submissionDocumentIdsToProcess.length) {
          return resolve({
            status: httpStatusCode.not_found.status,
            message: messageConstants.apiResponses.SUBMISSION_NOT_FOUND
          });
        } else {
          const chunkOfSubmissionIds = _.chunk(
            submissionDocumentIdsToProcess,
            10
          );

          const pathToSubmissionAnswers =
            "evidences." + evidenceIdFromRequestParam + ".submissions.answers";
          const pathToSubmissionSubmittedBy =
            "evidences." +
            evidenceIdFromRequestParam +
            ".submissions.submittedBy";
          const pathToSubmissionisValid =
            "evidences." + evidenceIdFromRequestParam + ".submissions.isValid";

          let submissionIds;
          let submissionDocuments;

          for (
            let pointerToSubmissionIdChunkArray = 0;
            pointerToSubmissionIdChunkArray < chunkOfSubmissionIds.length;
            pointerToSubmissionIdChunkArray++
          ) {
            submissionIds = chunkOfSubmissionIds[
              pointerToSubmissionIdChunkArray
            ].map(submissionModel => {
              return submissionModel._id;
            });

            submissionDocuments = await database.models.submissions
              .find(
                {
                  _id: {
                    $in: submissionIds
                  }
                },
                {
                  "assessors.userId": 1,
                  "assessors.externalId": 1,
                  "entityInformation.name": 1,
                  "entityInformation.externalId": 1,
                  status: 1,
                  [pathToSubmissionAnswers]: 1,
                  [pathToSubmissionSubmittedBy]: 1,
                  [pathToSubmissionisValid]: 1
                }
              )
              .lean();

            await Promise.all(
              submissionDocuments.map(async submission => {
                let assessors = {};

                submission.assessors.forEach(assessor => {
                  assessors[assessor.userId] = {
                    externalId: assessor.externalId
                  };
                });

                submission.evidences[
                  evidenceIdFromRequestParam
                ].submissions.forEach(evidenceSubmission => {
                  let asssessorId = assessors[
                    evidenceSubmission.submittedBy.toString()
                  ]
                    ? assessors[evidenceSubmission.submittedBy.toString()]
                      .externalId
                    : evidenceSubmission.submittedByName
                      ? evidenceSubmission.submittedByName.replace(" null", "")
                      : null;

                  if (evidenceSubmission.isValid === true) {
                    Object.values(evidenceSubmission.answers).forEach(
                      singleAnswer => {
                        if (singleAnswer.value !== "NA") {
                          let singleAnswerRecord = {
                            "Entity Name": submission.entityInformation.name,
                            "Entity Id":
                              submission.entityInformation.externalId,
                            Question: questionIdObject[singleAnswer.qid]
                              ? questionIdObject[singleAnswer.qid]
                                .questionName[0]
                              : "",
                            "Question Id": questionIdObject[singleAnswer.qid]
                              ? questionIdObject[singleAnswer.qid]
                                .questionExternalId
                              : "",
                            Answer: singleAnswer.notApplicable
                              ? "Not Applicable"
                              : "",
                            "Assessor Id": asssessorId,
                            Remarks: singleAnswer.remarks || "",
                            "Start Time": singleAnswer.startTime
                              ? reportsHelper.gmtToIst(singleAnswer.startTime)
                              : "-",
                            "End Time": singleAnswer.endTime
                              ? reportsHelper.gmtToIst(singleAnswer.endTime)
                              : "-",
                            Files: "",
                            "Submission Date": evidenceSubmission.submissionDate
                              ? reportsHelper.gmtToIst(
                                evidenceSubmission.submissionDate
                              )
                              : "-"
                          };

                          if (
                            singleAnswer.fileName &&
                            singleAnswer.fileName.length > 0
                          ) {
                            singleAnswer.fileName.forEach(file => {
                              singleAnswerRecord.Files +=
                                imageBaseUrl + file.sourcePath + ",";
                            });
                            singleAnswerRecord.Files = singleAnswerRecord.Files.replace(
                              /,\s*$/,
                              ""
                            );
                          }

                          if (!singleAnswer.notApplicable) {
                            if (singleAnswer.responseType != "matrix") {
                              let radioResponse = {};
                              let multiSelectResponse = {};
                              let multiSelectResponseArray = [];

                              if (singleAnswer.responseType == "radio") {
                                questionIdObject[singleAnswer.qid]
                                  .questionOptions.length > 0 &&
                                  questionIdObject[
                                    singleAnswer.qid
                                  ].questionOptions.forEach(option => {
                                    radioResponse[option.value] = option.label;
                                  });
                                singleAnswerRecord.Answer =
                                  radioResponse[singleAnswer.value];
                              } else if (
                                singleAnswer.responseType == "multiselect"
                              ) {
                                questionIdObject[singleAnswer.qid] && questionIdObject[singleAnswer.qid]
                                  .questionOptions && questionIdObject[
                                    singleAnswer.qid
                                  ].questionOptions.forEach(option => {
                                    multiSelectResponse[option.value] =
                                      option.label;
                                  });

                                if (
                                  typeof singleAnswer.value == "object" ||
                                  typeof singleAnswer.value == "array"
                                ) {
                                  if (singleAnswer.value) {
                                    singleAnswer.value.forEach(value => {
                                      multiSelectResponseArray.push(
                                        multiSelectResponse[value]
                                      );
                                    });
                                  }
                                }
                                singleAnswerRecord.Answer = multiSelectResponseArray.toString();
                              } else {
                                singleAnswerRecord.Answer = singleAnswer.value;
                              }
                              input.push(singleAnswerRecord);
                            } else {
                              singleAnswerRecord.Answer = "Instance Question";
                              input.push(singleAnswerRecord);

                              if (singleAnswer.value.length) {
                                for (
                                  let instance = 0;
                                  instance < singleAnswer.value.length;
                                  instance++
                                ) {
                                  singleAnswer.value[instance] &&
                                    Object.values(
                                      singleAnswer.value[instance]
                                    ).forEach(eachInstanceChildQuestion => {
                                      let eachInstanceChildRecord = {
                                        "Entity Name":
                                          submission.entityInformation.name,
                                        "Entity Id":
                                          submission.entityInformation
                                            .externalId,
                                        Question: questionIdObject[
                                          eachInstanceChildQuestion.qid
                                        ]
                                          ? questionIdObject[
                                            eachInstanceChildQuestion.qid
                                          ].questionName[0]
                                          : "",
                                        "Question Id": questionIdObject[
                                          eachInstanceChildQuestion.qid
                                        ]
                                          ? questionIdObject[
                                            eachInstanceChildQuestion.qid
                                          ].questionExternalId
                                          : "",
                                        "Submission Date": evidenceSubmission.submissionDate
                                          ? reportsHelper.gmtToIst(
                                            evidenceSubmission.submissionDate
                                          )
                                          : "-",
                                        Answer: "",
                                        "Assessor Id": asssessorId,
                                        Remarks:
                                          eachInstanceChildQuestion.remarks ||
                                          "",
                                        "Start Time": eachInstanceChildQuestion.startTime
                                          ? reportsHelper.gmtToIst(
                                            eachInstanceChildQuestion.startTime
                                          )
                                          : "-",
                                        "End Time": eachInstanceChildQuestion.endTime
                                          ? reportsHelper.gmtToIst(
                                            eachInstanceChildQuestion.endTime
                                          )
                                          : "-",
                                        Files: ""
                                      };

                                      if (
                                        eachInstanceChildQuestion.fileName &&
                                        eachInstanceChildQuestion.fileName
                                          .length > 0
                                      ) {
                                        eachInstanceChildQuestion.fileName.forEach(
                                          file => {
                                            if (
                                              file.sourcePath.split("/")
                                                .length == 1
                                            ) {
                                              file.sourcePath =
                                                submission._id.toString() +
                                                "/" +
                                                evidenceSubmission.submittedBy +
                                                "/" +
                                                file.name;
                                            }
                                            eachInstanceChildRecord.Files +=
                                              imageBaseUrl +
                                              file.sourcePath +
                                              ",";
                                          }
                                        );
                                        eachInstanceChildRecord.Files = eachInstanceChildRecord.Files.replace(
                                          /,\s*$/,
                                          ""
                                        );
                                      }

                                      let radioResponse = {};
                                      let multiSelectResponse = {};
                                      let multiSelectResponseArray = [];

                                      if (
                                        eachInstanceChildQuestion.responseType ==
                                        "radio"
                                      ) {
                                        questionIdObject[
                                          eachInstanceChildQuestion.qid
                                        ] && questionIdObject[
                                          eachInstanceChildQuestion.qid
                                        ].questionOptions && questionIdObject[
                                          eachInstanceChildQuestion.qid
                                        ].questionOptions.forEach(option => {
                                          radioResponse[option.value] =
                                            option.label;
                                        });
                                        eachInstanceChildRecord.Answer =
                                          radioResponse[
                                          eachInstanceChildQuestion.value
                                          ];
                                      } else if (
                                        eachInstanceChildQuestion.responseType ==
                                        "multiselect"
                                      ) {
                                        questionIdObject[
                                          eachInstanceChildQuestion.qid
                                        ] && questionIdObject[
                                          eachInstanceChildQuestion.qid
                                        ].questionOptions && questionIdObject[
                                          eachInstanceChildQuestion.qid
                                        ].questionOptions.forEach(option => {
                                          multiSelectResponse[option.value] =
                                            option.label;
                                        });

                                        if (
                                          typeof eachInstanceChildQuestion.value ==
                                          "object" ||
                                          typeof eachInstanceChildQuestion.value ==
                                          "array"
                                        ) {
                                          if (eachInstanceChildQuestion.value) {
                                            eachInstanceChildQuestion.value.forEach(
                                              value => {
                                                multiSelectResponseArray.push(
                                                  multiSelectResponse[value]
                                                );
                                              }
                                            );
                                          }

                                          eachInstanceChildRecord.Answer = multiSelectResponseArray.toString();
                                        } else {
                                          eachInstanceChildRecord.Answer =
                                            eachInstanceChildQuestion.value;
                                        }
                                      } else {
                                        eachInstanceChildRecord.Answer =
                                          eachInstanceChildQuestion.value;
                                      }

                                      input.push(eachInstanceChildRecord);
                                    });
                                }
                              }
                            }
                          }
                          input.push(singleAnswerRecord);
                        }
                      }
                    );
                  }
                });
              })
            );
          }
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/generateCriteriaByEntityId/:solutionExternalId Fetch criterias based on schoolId
   * @apiVersion 1.0.0
   * @apiName Fetch criteria based on entityId
   * @apiParam {String} entityId Comma separated entity ID.
   * @apiGroup Report
   * @apiUse successBody
   * @apiUse errorBody
   */

    /**
   * Entity submission criteria details reports.
   * @method
   * @name generateCriteriaByEntityId
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id .
   * @returns {CSV} - csv consists of entityId,pathToCriteria
   * (theme->subTheme->aoi->criteria),criteria name and score.
   */

  async generateCriteriaByEntityId(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let submissionQueryObject = {
          solutionExternalId: req.params._id,
          entityExternalId: { $in: req.query.entityId.split(",") }
        };

        let submissionDocument = await database.models.submissions
          .find(submissionQueryObject, {
            entityExternalId: 1,
            criteria: 1,
            solutionId: 1
          })
          .lean();

        if (!submissionDocument) {
          return resolve({
            status: httpStatusCode.not_found.status,
            message: messageConstants.apiResponses.SUBMISSION_NOT_FOUND
          });
        }

        let solutionDocuments = await database.models.solutions
          .findOne({ externalId: req.params._id }, { themes: 1 })
          .lean();

        let criteriaName = {};
        let criteriaIds = gen.utils.getCriteriaIds(solutionDocuments.themes);
        let allCriteriaDocument = await database.models.criteria.find(
          { _id: { $in: criteriaIds } },
          { name: 1 }
        );

        allCriteriaDocument.forEach(eachCriteria => {
          criteriaName[eachCriteria._id.toString()] = {
            name: eachCriteria.name
          };
        });

        let arr = {};

        let criteriasThatIsNotIncluded = [
          "CS/II/c1",
          "CS/II/c2",
          "CS/II/b1",
          "CS/I/b1",
          "TL/VI/b1",
          "TL/VI/b2",
          "TL/VI/b5",
          "TL/VI/b6",
          "TL/V/a1",
          "TL/V/b1",
          "TL/IV/b1",
          "TL/IV/b2",
          "TL/II/b2",
          "TL/II/a1",
          "TL/II/a2",
          "TL/II/a3",
          "TL/I/a4",
          "TL/I/a5",
          "SS/V/a3",
          "SS/III/c3",
          "SS/III/c1",
          "SS/III/b1",
          "SS/III/a1",
          "SS/I/c3",
          "SS/II/a1",
          "SS/I/c2"
        ];

        let getCriteriaPath = function (themes, parentData = []) {
          themes.forEach(theme => {
            if (theme.children) {
              let hierarchyTrackToUpdate = [...parentData];
              hierarchyTrackToUpdate.push(theme.name);

              getCriteriaPath(theme.children, hierarchyTrackToUpdate);
            } else {
              let data = {};

              let hierarchyTrackToUpdate = [...parentData];
              hierarchyTrackToUpdate.push(theme.name);

              theme.criteria.forEach(criteria => {
                data[criteria.criteriaId.toString()] = {
                  parentPath: hierarchyTrackToUpdate.join("->")
                };
              });

              _.merge(arr, data);
            }
          });
        };

        getCriteriaPath(solutionDocuments.themes);

        const fileName = `generateCriteriasByEntityId`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        submissionDocument.forEach(eachSubmissionDocument => {
          let entityId = eachSubmissionDocument.entityExternalId;
          eachSubmissionDocument.criteria &&
            eachSubmissionDocument.criteria.forEach(submissionCriterias => {
              if (
                submissionCriterias._id &&
                !criteriasThatIsNotIncluded.includes(
                  submissionCriterias.externalId
                )
              ) {
                let criteriaReportObject = {
                  "Entity Id": entityId,
                  "Path To Criteria": arr[submissionCriterias._id.toString()]
                    ? arr[submissionCriterias._id.toString()].parentPath
                    : "",
                  "Criteria Name": criteriaName[
                    submissionCriterias._id.toString()
                  ].name
                    ? criteriaName[submissionCriterias._id.toString()].name
                    : "",
                  Score: submissionCriterias.score
                    ? submissionCriterias.score
                    : "NA"
                };

                Object.values(submissionCriterias.rubric.levels).forEach(
                  eachRubricLevel => {
                    criteriaReportObject[eachRubricLevel.label] =
                      eachRubricLevel.description;
                  }
                );
                input.push(criteriaReportObject);
              }
            });
        });

        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/generateSubmissionReportsByEntityId/:solutionExternalId Fetch Entity submission status
   * @apiVersion 1.0.0
   * @apiName Fetch Entity submission status
   * @apiParam {String} entityId Comma separated entity ID.
   * @apiGroup Report
   * @apiUse successBody
   * @apiUse errorBody
   */

    /**
   * Level mapping reports.
   * @method
   * @name generateSubmissionReportsByEntityId
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id .
   * @param {Array} req.query.entityId - entity ids. 
   * @returns {CSV} - csv consists of entityId,criteriaId,criteriaName,
   * questionId,questionName,answers,question rubric levels,score,option values,
   * option,remarks,files
   */

  async generateSubmissionReportsByEntityId(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let submissionQueryObject = {
          solutionExternalId: req.params._id,
          entityExternalId: { $in: req.query.entityId.split(",") }
        };

        let solutionDocument = await database.models.solutions
          .findOne({ externalId: req.params._id }, { themes: 1 })
          .lean();

        let criteriaIdsByFramework = gen.utils.getCriteriaIds(
          solutionDocument.themes
        );

        let allCriterias = database.models.criteria
          .find(
            { _id: { $in: criteriaIdsByFramework } },
            { evidences: 1, name: 1 }
          )
          .lean()
          .exec();

        let entitySubmissionDocument = database.models.submissions
          .find(submissionQueryObject, {
            entityExternalId: 1,
            answers: 1,
            criteria: 1,
            evidencesStatus: 1
          })
          .lean()
          .exec();

        const fileName = `generateSubmissionReportsByEntityId`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        let criteriasThatIsNotIncluded = [
          "CS/II/c1",
          "CS/II/c2",
          "CS/II/b1",
          "CS/I/b1",
          "TL/VI/b1",
          "TL/VI/b2",
          "TL/VI/b5",
          "TL/VI/b6",
          "TL/V/a1",
          "TL/V/b1",
          "TL/IV/b1",
          "TL/IV/b2",
          "TL/II/b2",
          "TL/II/a1",
          "TL/II/a2",
          "TL/II/a3",
          "TL/I/a4",
          "TL/I/a5",
          "SS/V/a3",
          "SS/III/c3",
          "SS/III/c1",
          "SS/III/b1",
          "SS/III/a1",
          "SS/I/c3",
          "SS/II/a1",
          "SS/I/c2"
        ];

        Promise.all([allCriterias, entitySubmissionDocument]).then(
          async documents => {
            let [allCriterias, entitySubmissionDocument] = documents;

            let criteriaQuestionDetailsObject = {};
            let questionOptionObject = {};

            allCriterias.forEach(eachCriteria => {
              eachCriteria.evidences.forEach(eachEvidence => {
                eachEvidence.sections.forEach(eachSection => {
                  eachSection.questions.forEach(eachquestion => {
                    criteriaQuestionDetailsObject[eachquestion.toString()] = {
                      criteriaId: eachCriteria._id,
                      criteriaName: eachCriteria.name,
                      questionId: eachquestion.toString()
                    };
                  });
                });
              });
            });

            let questionIds = Object.values(criteriaQuestionDetailsObject).map(
              criteria => criteria.questionId
            );

            let allQuestionWithOptions = await database.models.questions
              .find(
                { _id: { $in: questionIds } },
                { options: 1, question: 1, externalId: 1 }
              )
              .lean();

            allQuestionWithOptions.forEach(question => {
              if (question.options && question.options.length > 0) {
                let optionString = "";
                let optionValueString = "";
                question.options.forEach(option => {
                  optionString += option.label + ",";
                  optionValueString += option.value + "=" + option.label + ",";
                });
                optionString = optionString.replace(/,\s*$/, "");
                optionValueString = optionValueString.replace(/,\s*$/, "");

                questionOptionObject[question._id.toString()] = {
                  questionOptions: question.options,
                  questionOptionString: optionString,
                  questionOptionValueString: optionValueString,
                  questionName: question.question,
                  externalId: question.externalId
                };
              } else {
                questionOptionObject[question._id.toString()] = {
                  questionName: question.question,
                  externalId: question.externalId
                };
              }
            });

            entitySubmissionDocument.forEach(singleEntitySubmission => {
              let criteriaScoreObject = {};
              singleEntitySubmission.criteria.forEach(singleCriteria => {
                criteriaScoreObject[singleCriteria._id.toString()] = {
                  id: singleCriteria._id,
                  externalId: singleCriteria.externalId,
                  score: singleCriteria.score
                };
              });

              if (!Object.values(singleEntitySubmission.answers).length) {
                return resolve({
                  status: httpStatusCode.not_found.status,
                  message: messageConstants.apiResponses.SUBMISSION_NOT_FOUND
                });
              } else {
                Object.values(singleEntitySubmission.answers).forEach(
                  singleAnswer => {
                    if (
                      criteriaScoreObject[singleAnswer.criteriaId] &&
                      !criteriasThatIsNotIncluded.includes(
                        criteriaScoreObject[singleAnswer.criteriaId].externalId
                      )
                    ) {
                      let singleAnswerRecord = {
                        "Entity Id": singleEntitySubmission.entityExternalId,
                        "Criteria Id":
                          criteriaScoreObject[singleAnswer.criteriaId]
                            .externalId,
                        "Criteria Name":
                          criteriaQuestionDetailsObject[singleAnswer.qid] ==
                            undefined
                            ? "Question Deleted Post Submission"
                            : criteriaQuestionDetailsObject[singleAnswer.qid]
                              .criteriaName,
                        QuestionId: questionOptionObject[singleAnswer.qid]
                          ? questionOptionObject[singleAnswer.qid].externalId
                          : "",
                        Question: questionOptionObject[singleAnswer.qid]
                          ? questionOptionObject[singleAnswer.qid]
                            .questionName[0]
                          : "",
                        Answer: singleAnswer.notApplicable
                          ? "Not Applicable"
                          : "",
                        "Answer Option Value":
                          questionOptionObject[singleAnswer.qid] == undefined
                            ? "NA"
                            : "",
                        "Question Rubric Level": singleAnswer.rubricLevel || "",
                        "Option Values":
                          questionOptionObject[singleAnswer.qid] == undefined
                            ? "No Options"
                            : questionOptionObject[singleAnswer.qid]
                              .questionOptionValueString,
                        Options:
                          questionOptionObject[singleAnswer.qid] == undefined
                            ? "No Options"
                            : questionOptionObject[singleAnswer.qid]
                              .questionOptionString,
                        Score: criteriaScoreObject[singleAnswer.criteriaId]
                          ? criteriaScoreObject[singleAnswer.criteriaId].score
                          : "",
                        Remarks: singleAnswer.remarks || "",
                        Files: ""
                      };

                      if (
                        singleAnswer.fileName &&
                        singleAnswer.fileName.length > 0
                      ) {
                        singleAnswer.fileName.forEach(file => {
                          singleAnswerRecord.Files +=
                            imageBaseUrl + file.sourcePath + ",";
                        });
                        singleAnswerRecord.Files = singleAnswerRecord.Files.replace(
                          /,\s*$/,
                          ""
                        );
                      }

                      if (!singleAnswer.notApplicable) {
                        if (
                          singleAnswer.responseType != "matrix" &&
                          singleAnswer.value != undefined
                        ) {
                          let radioResponse = {};
                          let multiSelectResponse = {};
                          let multiSelectResponseArray = [];

                          if (singleAnswer.responseType == "radio") {
                            questionOptionObject[
                              singleAnswer.qid
                            ] && questionOptionObject[
                              singleAnswer.qid
                            ].questionOptions && questionOptionObject[
                              singleAnswer.qid
                            ].questionOptions.forEach(option => {
                              radioResponse[option.value] = option.label;
                            });
                            singleAnswerRecord.Answer = radioResponse[
                              singleAnswer.value
                            ]
                              ? radioResponse[singleAnswer.value]
                              : "NA";
                            singleAnswerRecord["Answer Option Value"] =
                              singleAnswer.value;
                          } else if (
                            singleAnswer.responseType == "multiselect"
                          ) {
                            questionOptionObject[
                              singleAnswer.qid
                            ] && questionOptionObject[
                              singleAnswer.qid
                            ].questionOptions && questionOptionObject[
                              singleAnswer.qid
                            ].questionOptions.forEach(option => {
                              multiSelectResponse[option.value] = option.label;
                            });
                            if (
                              typeof singleAnswer.value == "object" ||
                              typeof singleAnswer.value == "array"
                            ) {
                              if (singleAnswer.value) {
                                singleAnswer.value.forEach(value => {
                                  multiSelectResponseArray.push(
                                    multiSelectResponse[value]
                                  );
                                });
                              }
                            }
                            singleAnswerRecord.Answer = multiSelectResponseArray.toString();
                            singleAnswerRecord[
                              "Answer Option Value"
                            ] = singleAnswer.value.toString();
                          } else {
                            singleAnswerRecord.Answer = singleAnswer.value;
                          }

                          input.push(singleAnswerRecord);
                        } else if (singleAnswer.responseType == "matrix") {
                          let entityId =
                            singleEntitySubmission.entityExternalId;
                          singleAnswerRecord["Answer"] = "Instance Question";

                          input.push(singleAnswerRecord);

                          if (singleAnswer.value || singleAnswer.value == 0) {
                            for (
                              let instance = 0;
                              instance < singleAnswer.value.length;
                              instance++
                            ) {
                              Object.values(
                                singleAnswer.value[instance]
                              ).forEach(eachInstanceChildQuestion => {
                                if (
                                  criteriaScoreObject[
                                  eachInstanceChildQuestion.criteriaId
                                  ] &&
                                  !criteriasThatIsNotIncluded.includes(
                                    criteriaScoreObject[
                                      eachInstanceChildQuestion.criteriaId
                                    ].externalId
                                  )
                                ) {
                                  let eachInstanceChildRecord = {
                                    "Entity Id": entityId,
                                    "Criteria Id":
                                      criteriaScoreObject[
                                        eachInstanceChildQuestion.criteriaId
                                      ].externalId,
                                    "Criteria Name":
                                      criteriaQuestionDetailsObject[
                                        eachInstanceChildQuestion.qid
                                      ] == undefined
                                        ? "Question Deleted Post Submission"
                                        : criteriaQuestionDetailsObject[
                                          eachInstanceChildQuestion.qid
                                        ].criteriaName,
                                    QuestionId: questionOptionObject[
                                      eachInstanceChildQuestion.qid
                                    ]
                                      ? questionOptionObject[
                                        eachInstanceChildQuestion.qid
                                      ].externalId
                                      : "",
                                    Question: questionOptionObject[
                                      eachInstanceChildQuestion.qid
                                    ]
                                      ? questionOptionObject[
                                        eachInstanceChildQuestion.qid
                                      ].questionName[0]
                                      : "",
                                    Answer: eachInstanceChildQuestion.value,
                                    "Answer Option Value":
                                      questionOptionObject[
                                        eachInstanceChildQuestion.qid
                                      ] == undefined
                                        ? "NA"
                                        : "",
                                    "Question Rubric Level":
                                      eachInstanceChildQuestion.rubricLevel ||
                                      "",
                                    "Option Values":
                                      questionOptionObject[
                                        eachInstanceChildQuestion.qid
                                      ] == undefined
                                        ? "No Options"
                                        : questionOptionObject[
                                          eachInstanceChildQuestion.qid
                                        ].questionOptionValueString,
                                    Options:
                                      questionOptionObject[
                                        eachInstanceChildQuestion.qid
                                      ] == undefined
                                        ? "No Options"
                                        : questionOptionObject[
                                          eachInstanceChildQuestion.qid
                                        ].questionOptionString,
                                    Score: criteriaScoreObject[
                                      eachInstanceChildQuestion.criteriaId
                                    ]
                                      ? criteriaScoreObject[
                                        eachInstanceChildQuestion.criteriaId
                                      ].score
                                      : "",
                                    Remarks:
                                      eachInstanceChildQuestion.remarks || "",
                                    Files: ""
                                  };

                                  if (
                                    eachInstanceChildQuestion.fileName &&
                                    eachInstanceChildQuestion.fileName.length >
                                    0
                                  ) {
                                    eachInstanceChildQuestion.fileName.forEach(
                                      file => {
                                        eachInstanceChildRecord["Files"] +=
                                          imageBaseUrl + file + ",";
                                      }
                                    );
                                    eachInstanceChildRecord[
                                      "Files"
                                    ] = eachInstanceChildRecord[
                                      "Files"
                                    ].replace(/,\s*$/, "");
                                  }

                                  let radioResponse = {};
                                  let multiSelectResponse = {};
                                  let multiSelectResponseArray = [];

                                  if (
                                    eachInstanceChildQuestion.responseType ==
                                    "radio"
                                  ) {
                                    questionOptionObject[
                                      eachInstanceChildQuestion.qid
                                    ] && questionOptionObject[
                                      eachInstanceChildQuestion.qid
                                    ].questionOptions && questionOptionObject[
                                      eachInstanceChildQuestion.qid
                                    ].questionOptions.forEach(option => {
                                      radioResponse[option.value] =
                                        option.label;
                                    });
                                    eachInstanceChildRecord[
                                      "Answer"
                                    ] = radioResponse[
                                      eachInstanceChildQuestion.value
                                    ]
                                        ? radioResponse[
                                        eachInstanceChildQuestion.value
                                        ]
                                        : "NA";
                                    eachInstanceChildRecord[
                                      "Answer Option Value"
                                    ] = eachInstanceChildQuestion.value;
                                  } else if (
                                    eachInstanceChildQuestion.responseType ==
                                    "multiselect"
                                  ) {
                                    questionOptionObject[
                                      eachInstanceChildQuestion.qid
                                    ] && questionOptionObject[
                                      eachInstanceChildQuestion.qid
                                    ].questionOptions && questionOptionObject[
                                      eachInstanceChildQuestion.qid
                                    ].questionOptions.forEach(option => {
                                      multiSelectResponse[option.value] =
                                        option.label;
                                    });

                                    if (
                                      eachInstanceChildQuestion.value != "" &&
                                      eachInstanceChildQuestion.value != "NA"
                                    ) {
                                      eachInstanceChildQuestion.value.forEach(
                                        value => {
                                          multiSelectResponseArray.push(
                                            multiSelectResponse[value]
                                          );
                                        }
                                      );
                                      eachInstanceChildRecord[
                                        "Answer"
                                      ] = multiSelectResponseArray.toString();
                                      eachInstanceChildRecord[
                                        "Answer Option Value"
                                      ] = eachInstanceChildQuestion.value.toString();
                                    } else {
                                      eachInstanceChildRecord["Answer"] =
                                        "No value given";
                                    }
                                  }

                                  input.push(eachInstanceChildRecord);
                                }
                              });
                            }
                          }
                        }
                      }
                    }

                    if (
                      criteriaScoreObject[singleAnswer.criteriaId] &&
                      criteriasThatIsNotIncluded.includes(
                        criteriaScoreObject[singleAnswer.criteriaId].externalId)
                      && !singleAnswer.notApplicable && singleAnswer.responseType == "matrix"
                    ) {
                      let singleAnswerRecord = {
                        "Entity Id": singleEntitySubmission.entityExternalId,
                        "Criteria Id":
                          criteriaScoreObject[singleAnswer.criteriaId]
                            .externalId,
                        "Criteria Name":
                          criteriaQuestionDetailsObject[singleAnswer.qid] ==
                            undefined
                            ? "Question Deleted Post Submission"
                            : criteriaQuestionDetailsObject[singleAnswer.qid]
                              .criteriaName,
                        QuestionId: questionOptionObject[singleAnswer.qid]
                          ? questionOptionObject[singleAnswer.qid].externalId
                          : "",
                        Question: questionOptionObject[singleAnswer.qid]
                          ? questionOptionObject[singleAnswer.qid]
                            .questionName[0]
                          : "",
                        Answer: singleAnswer.notApplicable
                          ? "Not Applicable"
                          : "",
                        "Answer Option Value":
                          questionOptionObject[singleAnswer.qid] == undefined
                            ? "NA"
                            : "",
                        "Question Rubric Level": singleAnswer.rubricLevel || "",
                        "Option Values":
                          questionOptionObject[singleAnswer.qid] == undefined
                            ? "No Options"
                            : questionOptionObject[singleAnswer.qid]
                              .questionOptionValueString,
                        Options:
                          questionOptionObject[singleAnswer.qid] == undefined
                            ? "No Options"
                            : questionOptionObject[singleAnswer.qid]
                              .questionOptionString,
                        Score: criteriaScoreObject[singleAnswer.criteriaId]
                          ? criteriaScoreObject[singleAnswer.criteriaId].score
                          : "",
                        Remarks: singleAnswer.remarks || "",
                        Files: ""
                      };

                      if (
                        singleAnswer.fileName &&
                        singleAnswer.fileName.length > 0
                      ) {
                        singleAnswer.fileName.forEach(file => {
                          singleAnswerRecord.Files +=
                            imageBaseUrl + file.sourcePath + ",";
                        });
                        singleAnswerRecord.Files = singleAnswerRecord.Files.replace(
                          /,\s*$/,
                          ""
                        );
                      }

                      let entityId =
                        singleEntitySubmission.entityExternalId;
                      singleAnswerRecord["Answer"] = "Instance Question";

                      input.push(singleAnswerRecord);

                      if (singleAnswer.value || singleAnswer.value == 0) {
                        for (
                          let instance = 0;
                          instance < singleAnswer.value.length;
                          instance++
                        ) {
                          Object.values(
                            singleAnswer.value[instance]
                          ).forEach(eachInstanceChildQuestion => {
                            if (
                              criteriaScoreObject[
                              eachInstanceChildQuestion.criteriaId
                              ] &&
                              !criteriasThatIsNotIncluded.includes(
                                criteriaScoreObject[
                                  eachInstanceChildQuestion.criteriaId
                                ].externalId
                              )
                            ) {
                              let eachInstanceChildRecord = {
                                "Entity Id": entityId,
                                "Criteria Id":
                                  criteriaScoreObject[
                                    eachInstanceChildQuestion.criteriaId
                                  ].externalId,
                                "Criteria Name":
                                  criteriaQuestionDetailsObject[
                                    eachInstanceChildQuestion.qid
                                  ] == undefined
                                    ? "Question Deleted Post Submission"
                                    : criteriaQuestionDetailsObject[
                                      eachInstanceChildQuestion.qid
                                    ].criteriaName,
                                QuestionId: questionOptionObject[
                                  eachInstanceChildQuestion.qid
                                ]
                                  ? questionOptionObject[
                                    eachInstanceChildQuestion.qid
                                  ].externalId
                                  : "",
                                Question: questionOptionObject[
                                  eachInstanceChildQuestion.qid
                                ]
                                  ? questionOptionObject[
                                    eachInstanceChildQuestion.qid
                                  ].questionName[0]
                                  : "",
                                Answer: eachInstanceChildQuestion.value,
                                "Answer Option Value":
                                  questionOptionObject[
                                    eachInstanceChildQuestion.qid
                                  ] == undefined
                                    ? "NA"
                                    : "",
                                "Question Rubric Level":
                                  eachInstanceChildQuestion.rubricLevel ||
                                  "",
                                "Option Values":
                                  questionOptionObject[
                                    eachInstanceChildQuestion.qid
                                  ] == undefined
                                    ? "No Options"
                                    : questionOptionObject[
                                      eachInstanceChildQuestion.qid
                                    ].questionOptionValueString,
                                Options:
                                  questionOptionObject[
                                    eachInstanceChildQuestion.qid
                                  ] == undefined
                                    ? "No Options"
                                    : questionOptionObject[
                                      eachInstanceChildQuestion.qid
                                    ].questionOptionString,
                                Score: criteriaScoreObject[
                                  eachInstanceChildQuestion.criteriaId
                                ]
                                  ? criteriaScoreObject[
                                    eachInstanceChildQuestion.criteriaId
                                  ].score
                                  : "",
                                Remarks:
                                  eachInstanceChildQuestion.remarks || "",
                                Files: ""
                              };

                              if (
                                eachInstanceChildQuestion.fileName &&
                                eachInstanceChildQuestion.fileName.length >
                                0
                              ) {
                                eachInstanceChildQuestion.fileName.forEach(
                                  file => {
                                    eachInstanceChildRecord["Files"] +=
                                      imageBaseUrl + file + ",";
                                  }
                                );
                                eachInstanceChildRecord[
                                  "Files"
                                ] = eachInstanceChildRecord[
                                  "Files"
                                ].replace(/,\s*$/, "");
                              }

                              let radioResponse = {};
                              let multiSelectResponse = {};
                              let multiSelectResponseArray = [];

                              if (
                                eachInstanceChildQuestion.responseType ==
                                "radio"
                              ) {
                                questionOptionObject[
                                  eachInstanceChildQuestion.qid
                                ] && questionOptionObject[
                                  eachInstanceChildQuestion.qid
                                ].questionOptions && questionOptionObject[
                                  eachInstanceChildQuestion.qid
                                ].questionOptions.forEach(option => {
                                  radioResponse[option.value] =
                                    option.label;
                                });
                                eachInstanceChildRecord[
                                  "Answer"
                                ] = radioResponse[
                                  eachInstanceChildQuestion.value
                                ]
                                    ? radioResponse[
                                    eachInstanceChildQuestion.value
                                    ]
                                    : "NA";
                                eachInstanceChildRecord[
                                  "Answer Option Value"
                                ] = eachInstanceChildQuestion.value;
                              } else if (
                                eachInstanceChildQuestion.responseType ==
                                "multiselect"
                              ) {
                                questionOptionObject[
                                  eachInstanceChildQuestion.qid
                                ] && questionOptionObject[
                                  eachInstanceChildQuestion.qid
                                ].questionOptions && questionOptionObject[
                                  eachInstanceChildQuestion.qid
                                ].questionOptions.forEach(option => {
                                  multiSelectResponse[option.value] =
                                    option.label;
                                });

                                if (
                                  eachInstanceChildQuestion.value != "" &&
                                  eachInstanceChildQuestion.value != "NA"
                                ) {
                                  eachInstanceChildQuestion.value.forEach(
                                    value => {
                                      multiSelectResponseArray.push(
                                        multiSelectResponse[value]
                                      );
                                    }
                                  );
                                  eachInstanceChildRecord[
                                    "Answer"
                                  ] = multiSelectResponseArray.toString();
                                  eachInstanceChildRecord[
                                    "Answer Option Value"
                                  ] = eachInstanceChildQuestion.value.toString();
                                } else {
                                  eachInstanceChildRecord["Answer"] =
                                    "No value given";
                                }
                              }

                              input.push(eachInstanceChildRecord);
                            }
                          });
                        }
                      }

                    }

                  }
                );

                for (
                  let pointerToEvidencesStatus = 0;
                  pointerToEvidencesStatus <
                  singleEntitySubmission.evidencesStatus.length;
                  pointerToEvidencesStatus++
                ) {
                  let currentEcm =
                    singleEntitySubmission.evidencesStatus[
                    pointerToEvidencesStatus
                    ];

                  let singleEcmValue = {
                    "School Id": singleEntitySubmission.schoolExternalId,
                    "Criteria Id": currentEcm.externalId,
                    "Criteria Name": currentEcm.isSubmitted
                      ? currentEcm.notApplicable != true
                        ? "Submitted"
                        : "Marked NA"
                      : "Not Submitted"
                  };

                  input.push(singleEcmValue);
                }
              }
            });

            input.push(null);
          }
        );
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/registryDetails/:solutionExternalId fetch registry details
   * @apiVersion 1.0.0
   * @apiName Fetch Registry details
   * @apiGroup Report
   * @apiParam {String} fromDate From Date
   * @apiParam {String} toDate To Date
   * @apiParam {String} solutionExternalId solution externalId
   * @apiParam {String} type registry type
   * @apiUse successBody
   * @apiUse errorBody
   */

   /**
   * Registry details. Type can be teacher,parent,etc
   * @method
   * @name registryDetails
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id .
   * @returns {CSV} - csv consists of solution external id,entity type,
   * parent entity external id,parent entity name,createdAt,updatedAt.
   */

  async registryDetails(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let solutionDocument = await database.models.solutions
          .findOne(
            {
              externalId: req.params._id
            },
            {
              registry: 1,
              entities: 1
            }
          )
          .lean();

        if (solutionDocument.registry.includes(req.query.type)) {
          let groupType = "groups." + req.query.type;

          let entitiesDocument = await database.models.entities
            .find(
              {
                _id: { $in: solutionDocument.entities },
                [groupType]: { $exists: true }
              },
              {
                [groupType]: 1,
                "metaInformation.externalId": 1,
                "metaInformation.name": 1
              }
            )
            .lean();

          let fileName = `${req.query.type} registry`;
          req.query.fromDate != ""
            ? (fileName +=
              " from " + moment(req.query.fromDate).format("YYYY-MM-DD"))
            : "";
          req.query.toDate != ""
            ? (fileName +=
              " to " + moment(req.query.toDate).format("YYYY-MM-DD"))
            : "";

          let fileStream = new FileStream(fileName);
          let input = fileStream.initStream();

          (async function () {
            await fileStream.getProcessorPromise();
            return resolve({
              isResponseAStream: true,
              fileNameWithPath: fileStream.fileNameWithPath()
            });
          })();

          let registryDocuments;

          for (
            let pointerToRegistryDocument = 0;
            pointerToRegistryDocument < entitiesDocument.length;
            pointerToRegistryDocument++
          ) {
            let registryQueryObject = {
              _id: {
                $in:
                  entitiesDocument[pointerToRegistryDocument].groups[
                  req.query.type
                  ]
              },
              entityType: req.query.type,
              createdAt: { $gte: req.query.fromDate },
              createdAt: { $lte: req.query.toDate }
            };

            registryDocuments = await database.models.entities
              .find(registryQueryObject, {
                metaInformation: 1,
                createdAt: 1,
                updatedAt: 1,
                entityType: 1
              })
              .lean();

            await Promise.all(
              registryDocuments.map(async singleRegistry => {
                let allregistryObject = {};

                Object.keys(singleRegistry.metaInformation).forEach(
                  singleKey => {
                    if (
                      ["deleted", "_id", "__v", "createdByProgramId"].indexOf(
                        singleKey
                      ) == -1
                    ) {
                      allregistryObject[
                        gen.utils.camelCaseToTitleCase(singleKey)
                      ] = singleRegistry.metaInformation[singleKey];
                    }
                  }
                );

                allregistryObject["Solution External Id"] = req.params._id;
                allregistryObject["Entity Type"] = singleRegistry.entityType;
                allregistryObject["Parent Entity External Id"] =
                  entitiesDocument[
                    pointerToRegistryDocument
                  ].metaInformation.externalId;
                allregistryObject["Parent Entity Name"] =
                  entitiesDocument[
                    pointerToRegistryDocument
                  ].metaInformation.name;
                singleRegistry.createdAt
                  ? (allregistryObject["Created At"] = reportsHelper.gmtToIst(
                    singleRegistry.createdAt
                  ))
                  : (allregistryObject["Created At"] = "");
                singleRegistry.updatedAt
                  ? (allregistryObject["Updated At"] = reportsHelper.gmtToIst(
                    singleRegistry.updatedAt
                  ))
                  : (allregistryObject["Updated At"] = "");
                input.push(allregistryObject);
              })
            );
          }

          input.push(null);
        } else {
          throw messageConstants.apiResponses.INVALID_TYPE;
        }
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/entityProfileInformation/:solutionExternalId Fetch Entity Profile Information
   * @apiVersion 1.0.0
   * @apiName Fetch Entity Profile Information
   * @apiGroup Report
   * @apiUse successBody
   * @apiUse errorBody
   */

   /**
   * Entity profile information.
   * @method
   * @name entityProfileInformation
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id .
   * @returns {CSV} - csv consists of entity external id, program external id,
   * all the fields based on entity types.
   */

  async entityProfileInformation(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let queryParams = {
          solutionExternalId: req.params._id
        };

        const submissionIds = await database.models.submissions.find(
          queryParams,
          {
            _id: 1
          }
        );

        const solutionDocuments = await database.models.solutions
          .findOne(
            {
              externalId: req.params._id
            },
            { entityProfileFieldsPerEntityTypes: 1 }
          )
          .lean();

        let entityProfileFields = await solutionsHelper.getEntityProfileFields(
          solutionDocuments.entityProfileFieldsPerEntityTypes
        );

        const fileName = `entityProfileInformation`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        if (!submissionIds.length) {
          return resolve({
            status: httpStatusCode.not_found.status,
            message: messageConstants.apiResponses.SUBMISSION_NOT_FOUND
          });
        } else {
          let chunkOfSubmissionIds = _.chunk(submissionIds, 10);
          let submissionIdArray;
          let entityProfileSubmissionDocuments;

          for (
            let pointerToSchoolProfileSubmissionArray = 0;
            pointerToSchoolProfileSubmissionArray < chunkOfSubmissionIds.length;
            pointerToSchoolProfileSubmissionArray++
          ) {
            submissionIdArray = chunkOfSubmissionIds[
              pointerToSchoolProfileSubmissionArray
            ].map(eachSubmissionId => {
              return eachSubmissionId._id;
            });

            entityProfileSubmissionDocuments = await database.models.submissions.find(
              {
                _id: {
                  $in: submissionIdArray
                }
              },
              {
                entityProfile: 1,
                _id: 1,
                solutionId: 1,
                entityExternalId: 1
              }
            );

            await Promise.all(
              entityProfileSubmissionDocuments.map(
                async entityProfileSubmissionDocument => {
                  let entityProfile = _.omit(
                    entityProfileSubmissionDocument.entityProfile,
                    ["deleted", "_id", "_v", "createdAt", "updatedAt"]
                  );
                  if (entityProfile) {
                    let entityProfileObject = {};
                    entityProfileObject["Entity External Id"] =
                      entityProfileSubmissionDocument.entityExternalId;
                    entityProfileObject["Program External Id"] =
                      entityProfileSubmissionDocument.solutionId;

                    entityProfileFields.forEach(eachSchoolField => {
                      entityProfileObject[
                        gen.utils.camelCaseToTitleCase(eachSchoolField)
                      ] = entityProfile[eachSchoolField]
                          ? entityProfile[eachSchoolField]
                          : "";
                    });
                    input.push(entityProfileObject);
                  }
                }
              )
            );
          }
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,          
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/generateEcmReportByDate/:solutionExternalId Generate all ecm report by date
   * @apiVersion 1.0.0
   * @apiName Generate all ecm report by date
   * @apiGroup Report
   * @apiParam {String} fromDate From Date
   * @apiParam {String} toDate To Date
   * @apiParam {String} entityId Comma separated external entity Ids
   * @apiUse successBody
   * @apiUse errorBody
   */

     /**
   * Generate ECM report by date.
   * @method
   * @name generateEcmReportByDate
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id.
   * @param {Array} req.query.entityId - entity ids. 
   * @returns {CSV} -entityId,entityName,questionId,questionName,answers,question,
   * score,assessor id,remarks,ECM,submission date,files
   */

  async generateEcmReportByDate(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let fetchRequiredSubmissionDocumentIdQueryObj = {};
        fetchRequiredSubmissionDocumentIdQueryObj["solutionExternalId"] =
          req.params._id;

        if (
          req.query.entityId &&
          req.query.entityId != "" &&
          req.query.entityId.split(",").length > 0
        ) {
          fetchRequiredSubmissionDocumentIdQueryObj["entityExternalId"] = {
            $in: req.query.entityId.split(",")
          };
        }

        fetchRequiredSubmissionDocumentIdQueryObj[
          "evidencesStatus.submissions.submissionDate"
        ] = {};
        fetchRequiredSubmissionDocumentIdQueryObj[
          "evidencesStatus.submissions.submissionDate"
        ]["$gte"] = req.query.fromDate;
        fetchRequiredSubmissionDocumentIdQueryObj[
          "evidencesStatus.submissions.submissionDate"
        ]["$lte"] = req.query.toDate;

        fetchRequiredSubmissionDocumentIdQueryObj["status"] = {
          $nin: ["started"]
        };

        const submissionDocumentIdsToProcess = await database.models.submissions
          .find(fetchRequiredSubmissionDocumentIdQueryObj, { _id: 1 })
          .lean();

        const solutionDocuments = await database.models.solutions
          .findOne(
            {
              externalId: req.params._id
            },
            { themes: 1 }
          )
          .lean();

        const criteriasId = gen.utils.getCriteriaIds(solutionDocuments.themes);

        let allCriteriaDocument = await database.models.criteria
          .find({ _id: { $in: criteriasId } }, { evidences: 1 })
          .lean();
        let questionIds = gen.utils.getAllQuestionId(allCriteriaDocument);

        let questionIdObject = {};
        const questionDocument = await database.models.questions
          .find(
            { _id: { $in: questionIds } },
            { externalId: 1, options: 1, question: 1 }
          )
          .lean();

        questionDocument.forEach(eachQuestionId => {
          questionIdObject[eachQuestionId._id] = {
            questionExternalId: eachQuestionId.externalId,
            questionOptions: eachQuestionId.options,
            questionName: eachQuestionId.question
          };
        });

        let fileName = `EcmReport`;
        req.query.fromDate
          ? (fileName += moment(req.query.fromDate).format("DD-MM-YYYY"))
          : "";
        req.query.toDate
          ? (fileName += "-" + moment(req.query.toDate).format("DD-MM-YYYY"))
          : "";

        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        if (!submissionDocumentIdsToProcess.length) {
          return resolve({
            status: httpStatusCode.not_found.status,
            message: messageConstants.apiResponses.SUBMISSION_NOT_FOUND
          });
        } else {
          const chunkOfSubmissionIds = _.chunk(
            submissionDocumentIdsToProcess,
            100
          );

          let submissionIds;
          let submissionDocuments;

          for (
            let pointerToSubmissionIdChunkArray = 0;
            pointerToSubmissionIdChunkArray < chunkOfSubmissionIds.length;
            pointerToSubmissionIdChunkArray++
          ) {
            submissionIds = chunkOfSubmissionIds[
              pointerToSubmissionIdChunkArray
            ].map(submissionModel => {
              return submissionModel._id;
            });

            submissionDocuments = await database.models.submissions
              .find(
                {
                  _id: {
                    $in: submissionIds
                  }
                },
                {
                  "assessors.userId": 1,
                  "assessors.externalId": 1,
                  "entityInformation.name": 1,
                  "entityInformation.externalId": 1,
                  evidences: 1,
                  status: 1
                }
              )
              .lean();

            await Promise.all(
              submissionDocuments.map(async submission => {
                let assessors = {};

                submission.assessors.forEach(assessor => {
                  assessors[assessor.userId] = {
                    externalId: assessor.externalId
                  };
                });

                Object.values(submission.evidences).forEach(singleEvidence => {
                  if (singleEvidence.submissions) {
                    singleEvidence.submissions &&
                      singleEvidence.submissions.forEach(evidenceSubmission => {
                        let asssessorId = assessors[
                          evidenceSubmission.submittedBy.toString()
                        ]
                          ? assessors[evidenceSubmission.submittedBy.toString()]
                            .externalId
                          : evidenceSubmission.submittedByName
                            ? evidenceSubmission.submittedByName.replace(
                              " null",
                              ""
                            )
                            : null;

                        if (
                          evidenceSubmission.isValid === true &&
                          (evidenceSubmission.submissionDate >=
                            req.query.fromDate &&
                            evidenceSubmission.submissionDate <
                            req.query.toDate)
                        ) {
                          Object.values(evidenceSubmission.answers).forEach(
                            singleAnswer => {
                              let singleAnswerRecord = {
                                "Entity Name":
                                  submission.entityInformation.name,
                                "Entity Id":
                                  submission.entityInformation.externalId,
                                Question: questionIdObject[singleAnswer.qid]
                                  ? questionIdObject[singleAnswer.qid]
                                    .questionName[0]
                                  : "",
                                "Question Id": questionIdObject[
                                  singleAnswer.qid
                                ]
                                  ? questionIdObject[singleAnswer.qid]
                                    .questionExternalId
                                  : "",
                                Answer: singleAnswer.notApplicable
                                  ? "Not Applicable"
                                  : "",
                                "Assessor Id": asssessorId,
                                Remarks: singleAnswer.remarks || "",
                                "Start Time": singleAnswer.startTime
                                  ? reportsHelper.gmtToIst(
                                    singleAnswer.startTime
                                  )
                                  : "-",
                                "End Time": singleAnswer.endTime
                                  ? reportsHelper.gmtToIst(singleAnswer.endTime)
                                  : "-",
                                Files: "",
                                ECM: evidenceSubmission.externalId,
                                "Submission Date": reportsHelper.gmtToIst(
                                  evidenceSubmission.submissionDate
                                )
                              };

                              if (
                                singleAnswer.fileName &&
                                singleAnswer.fileName.length > 0
                              ) {
                                singleAnswer.fileName.forEach(file => {
                                  singleAnswerRecord.Files +=
                                    imageBaseUrl + file.sourcePath + ",";
                                });
                                singleAnswerRecord.Files = singleAnswerRecord.Files.replace(
                                  /,\s*$/,
                                  ""
                                );
                              }

                              if (!singleAnswer.notApplicable) {
                                if (singleAnswer.responseType != "matrix") {
                                  let radioResponse = {};
                                  let multiSelectResponse = {};
                                  let multiSelectResponseArray = [];

                                  if (singleAnswer.responseType == "radio") {
                                    questionIdObject[singleAnswer.qid] &&
                                      questionIdObject[singleAnswer.qid]
                                        .questionOptions &&
                                      questionIdObject[
                                        singleAnswer.qid
                                      ].questionOptions.forEach(option => {
                                        radioResponse[option.value] =
                                          option.label;
                                      });
                                    singleAnswerRecord.Answer =
                                      radioResponse[singleAnswer.value];
                                  } else if (
                                    singleAnswer.responseType == "multiselect"
                                  ) {
                                    questionIdObject[singleAnswer.qid] &&
                                      questionIdObject[singleAnswer.qid]
                                        .questionOptions && questionIdObject[
                                          singleAnswer.qid
                                        ].questionOptions.forEach(option => {
                                          multiSelectResponse[option.value] =
                                            option.label;
                                        });

                                    if (
                                      typeof singleAnswer.value == "object" ||
                                      typeof singleAnswer.value == "array"
                                    ) {
                                      if (singleAnswer.value) {
                                        singleAnswer.value.forEach(value => {
                                          multiSelectResponseArray.push(
                                            multiSelectResponse[value]
                                          );
                                        });
                                      }
                                    }
                                    singleAnswerRecord.Answer = multiSelectResponseArray.toString();
                                  } else {
                                    singleAnswerRecord.Answer =
                                      singleAnswer.value;
                                  }
                                  input.push(singleAnswerRecord);
                                } else {
                                  singleAnswerRecord.Answer =
                                    "Instance Question";

                                  if (
                                    singleAnswer.value &&
                                    singleAnswer.value.length
                                  ) {
                                    for (
                                      let instance = 0;
                                      instance < singleAnswer.value.length;
                                      instance++
                                    ) {
                                      singleAnswer.value[instance] != null &&
                                        Object.values(
                                          singleAnswer.value[instance]
                                        ).forEach(eachInstanceChildQuestion => {
                                          let eachInstanceChildRecord = {
                                            "Entity Name":
                                              submission.entityInformation.name,
                                            "Entity Id":
                                              submission.entityInformation
                                                .externalId,
                                            Question: questionIdObject[
                                              eachInstanceChildQuestion.qid
                                            ]
                                              ? questionIdObject[
                                                eachInstanceChildQuestion.qid
                                              ].questionName[0]
                                              : "",
                                            "Question Id": questionIdObject[
                                              eachInstanceChildQuestion.qid
                                            ]
                                              ? questionIdObject[
                                                eachInstanceChildQuestion.qid
                                              ].questionExternalId
                                              : "",
                                            "Submission Date": evidenceSubmission.submissionDate
                                              ? reportsHelper.gmtToIst(
                                                evidenceSubmission.submissionDate
                                              )
                                              : "-",
                                            Answer: "",
                                            "Assessor Id": asssessorId,
                                            Remarks:
                                              eachInstanceChildQuestion.remarks ||
                                              "",
                                            "Start Time": eachInstanceChildQuestion.startTime
                                              ? reportsHelper.gmtToIst(
                                                eachInstanceChildQuestion.startTime
                                              )
                                              : "-",
                                            "End Time": eachInstanceChildQuestion.endTime
                                              ? reportsHelper.gmtToIst(
                                                eachInstanceChildQuestion.endTime
                                              )
                                              : "-",
                                            Files: "",
                                            ECM: evidenceSubmission.externalId
                                          };

                                          if (
                                            eachInstanceChildQuestion.fileName &&
                                            eachInstanceChildQuestion.fileName
                                              .length > 0
                                          ) {
                                            eachInstanceChildQuestion.fileName.forEach(
                                              file => {
                                                if (
                                                  file.sourcePath.split("/")
                                                    .length == 1
                                                ) {
                                                  file.sourcePath =
                                                    submission._id.toString() +
                                                    "/" +
                                                    evidenceSubmission.submittedBy +
                                                    "/" +
                                                    file.name;
                                                }
                                                eachInstanceChildRecord.Files +=
                                                  imageBaseUrl +
                                                  file.sourcePath +
                                                  ",";
                                              }
                                            );
                                            eachInstanceChildRecord.Files = eachInstanceChildRecord.Files.replace(
                                              /,\s*$/,
                                              ""
                                            );
                                          }

                                          let radioResponse = {};
                                          let multiSelectResponse = {};
                                          let multiSelectResponseArray = [];

                                          if (
                                            eachInstanceChildQuestion.responseType ==
                                            "radio"
                                          ) {
                                            questionIdObject[
                                              eachInstanceChildQuestion.qid
                                            ] &&
                                              questionIdObject[
                                                eachInstanceChildQuestion.qid
                                              ].questionOptions &&
                                              questionIdObject[
                                                eachInstanceChildQuestion.qid
                                              ].questionOptions.forEach(
                                                option => {
                                                  radioResponse[option.value] =
                                                    option.label;
                                                }
                                              );
                                            eachInstanceChildRecord.Answer =
                                              radioResponse[
                                              eachInstanceChildQuestion.value
                                              ];
                                          } else if (
                                            eachInstanceChildQuestion.responseType ==
                                            "multiselect"
                                          ) {
                                            questionIdObject[
                                              eachInstanceChildQuestion.qid
                                            ] &&
                                              questionIdObject[
                                                eachInstanceChildQuestion.qid
                                              ].questionOptions && questionIdObject[
                                                eachInstanceChildQuestion.qid
                                              ].questionOptions.forEach(
                                                option => {
                                                  multiSelectResponse[
                                                    option.value
                                                  ] = option.label;
                                                }
                                              );

                                            if (
                                              typeof eachInstanceChildQuestion.value ==
                                              "object" ||
                                              typeof eachInstanceChildQuestion.value ==
                                              "array"
                                            ) {
                                              if (
                                                eachInstanceChildQuestion.value
                                              ) {
                                                eachInstanceChildQuestion.value.forEach(
                                                  value => {
                                                    multiSelectResponseArray.push(
                                                      multiSelectResponse[value]
                                                    );
                                                  }
                                                );
                                              }

                                              eachInstanceChildRecord.Answer = multiSelectResponseArray.toString();
                                            } else {
                                              eachInstanceChildRecord.Answer =
                                                eachInstanceChildQuestion.value;
                                            }
                                          } else {
                                            eachInstanceChildRecord.Answer =
                                              eachInstanceChildQuestion.value;
                                          }

                                          input.push(eachInstanceChildRecord);
                                        });
                                    }
                                  }
                                }
                              }
                            }
                          );
                        }
                      });
                  }
                });
              })
            );

            function sleep(ms) {
              return new Promise(resolve => {
                setTimeout(resolve, ms);
              });
            }

            if (input.readableBuffer && input.readableBuffer.length) {
              while (input.readableBuffer.length > 20000) {
                await sleep(2000);
              }
            }
          }
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,          
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/submissionFeedback/:solutionExternalId Generate feedback for the submissions
   * @apiVersion 1.0.0
   * @apiName Generate feedback for the submissions
   * @apiGroup Report
   * @apiParam {String} fromDate From Date
   * @apiParam {String} toDate To Date
   * @apiUse successBody
   * @apiUse errorBody
   */

    /**
   * feedback of the submission
   * @method
   * @name submissionFeedback
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id.
   * @param {String} req.query.fromDate - from date.
   * @param {String} req.query.toDate - to date. 
   * @returns {CSV} csv consists of - Q1,Q2,Q3,Q4,entity id,entity name,program id,
   * user id, submission date.
   */

  async submissionFeedback(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let submissionQueryObject = {};
        submissionQueryObject.solutionExternalId = req.params._id;
        submissionQueryObject["feedback.submissionDate"] = {};
        submissionQueryObject["feedback.submissionDate"]["$gte"] =
          req.query.fromDate;
        submissionQueryObject["feedback.submissionDate"]["$lte"] =
          req.query.toDate;

        let submissionsIds = await database.models.submissions.find(
          submissionQueryObject,
          {
            _id: 1
          }
        ).lean();

        const fileName = `Generate Feedback For Submission`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        if (!submissionsIds.length) {
          throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;
        } else {
          let chunkOfSubmissionsIdsDocument = _.chunk(submissionsIds, 10);
          let submissionId;
          let submissionDocumentsArray;

          for (
            let pointerTosubmissionIdDocument = 0;
            pointerTosubmissionIdDocument <
            chunkOfSubmissionsIdsDocument.length;
            pointerTosubmissionIdDocument++
          ) {
            submissionId = chunkOfSubmissionsIdsDocument[
              pointerTosubmissionIdDocument
            ].map(submissionModel => {
              return submissionModel._id;
            });

            submissionDocumentsArray = await database.models.submissions
              .find(
                {
                  _id: {
                    $in: submissionId
                  }
                },
                { feedback: 1, assessors: 1, entityExternalId: 1 }
              )
              .lean();
            await Promise.all(
              submissionDocumentsArray.map(async eachSubmission => {
                let result = {};
                let assessorObject = {};

                eachSubmission.assessors.forEach(eachAssessor => {
                  assessorObject[eachAssessor.userId] = {
                    externalId: eachAssessor.externalId
                  };
                });

                eachSubmission.feedback.forEach(eachFeedback => {
                  result["Q1"] = eachFeedback.q1;
                  result["Q2"] = eachFeedback.q2;
                  result["Q3"] = eachFeedback.q3;
                  result["Q4"] = eachFeedback.q4;
                  result["Entity Id"] = eachSubmission.entityExternalId;
                  result["Entity Name"] = eachFeedback.schoolName;
                  result["Program Id"] = eachFeedback.programId;
                  result["User Id"] = assessorObject[eachFeedback.userId]
                    ? assessorObject[eachFeedback.userId].externalId
                    : " ";
                  result["Submission Date"] = eachFeedback.submissionDate;
                });
                input.push(result);
              })
            );
          }
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message : error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/ecmSubmissionByDate/:solutionExternalId Generate ECM submissions By date
   * @apiVersion 1.0.0
   * @apiName Generate ECM submissions By date
   * @apiGroup Report
   * @apiParam {String} fromDate From Date
   * @apiParam {String} toDate To Date
   * @apiUse successBody
   * @apiUse errorBody
   */

   /**
   * Datewise ecm report.
   * @method
   * @name ecmSubmissionByDate
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id.
   * @param {String} req.query.fromDate - from date.
   * @param {String} req.query.toDate - to date. 
   * @param {Array} req.query.entityId - entity ids. 
   * @returns {CSV} csv consists of - entityExternalId,entityName,ecmName,ecmExternalId,
   * submissionDate
   */

  async ecmSubmissionByDate(req) {
    return new Promise(async (resolve, reject) => {
      try {
        const fileName = `ecmSubmissionByDate`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        let entityProfileSubmissionDocuments = await database.models.submissions.aggregate(
          [
            {
              $match: { solutionExternalId: req.params._id }
            },
            {
              $project: {
                entityId: 1,
                evidencesStatus: 1,
                entityName: "$entityInformation.name",
                entityExternalId: 1
              }
            },
            {
              $unwind: "$evidencesStatus"
            },
            {
              $unwind: "$evidencesStatus.submissions"
            },
            {
              $project: {
                entityName: 1,
                ecmName: "$evidencesStatus.name",
                ecmExternalId: "$evidencesStatus.externalId",
                submmissionDate: "$evidencesStatus.submissions.submissionDate",
                entityExternalId: 1
              }
            },
            {
              $match: {
                submmissionDate: {
                  $gte: req.query.fromDate,
                  $lte: req.query.toDate
                }
              }
            }
          ]
        );

        if (!entityProfileSubmissionDocuments.length) {
          return resolve({
            status: httpStatusCode.ok.status,
            message: messageConstants.apiResponses.NO_DATA_FOUND
          });
        }

        function sleep(ms) {
          return new Promise(resolve => {
            setTimeout(resolve, ms);
          });
        }

        for (
          let counter = 0;
          counter < entityProfileSubmissionDocuments.length;
          counter++
        ) {
          let entityProfileObject = {};
          entityProfileObject["Entity External Id"] =
            entityProfileSubmissionDocuments[counter].entityExternalId;
          entityProfileObject["Entity Name"] =
            entityProfileSubmissionDocuments[counter].entityName;
          entityProfileObject["ECM Name"] =
            entityProfileSubmissionDocuments[counter].ecmName;
          entityProfileObject["ECM External Id"] =
            entityProfileSubmissionDocuments[counter].ecmExternalId;
          entityProfileObject["Submmission Date"] = moment(
            entityProfileSubmissionDocuments[counter].submmissionDate
          ).format("DD-MM-YYYY");
          input.push(entityProfileObject);

          if (input.readableBuffer && input.readableBuffer.length) {
            while (input.readableBuffer.length > 20000) {
              await sleep(2000);
            }
          }
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/completedParentInterviewsByDate/:solutionExternalId Generate all parent report by date
   * @apiVersion 1.0.0
   * @apiName Generate all parent interview completed report by date
   * @apiGroup Report
   * @apiParam {String} fromDate From Date
   * @apiParam {String} toDate To Date
   * @apiUse successBody
   * @apiUse errorBody
   */

   /**
   * Datewise completed parent interview report.
   * @method
   * @name completedParentInterviewsByDate
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id.
   * @returns {CSV} csv consists of - entityId,entityName,
   * entity(SDMC, EDMC, DOE, NDMC, North DMC, DCB, Private),Date and parentType.
   */

  async completedParentInterviewsByDate(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let fetchRequiredSubmissionDocumentIdQueryObj = {};
        fetchRequiredSubmissionDocumentIdQueryObj["solutionExternalId"] =
          req.params._id;
        fetchRequiredSubmissionDocumentIdQueryObj[
          "parentInterviewResponses"
        ] = { $exists: true };
        fetchRequiredSubmissionDocumentIdQueryObj[
          "parentInterviewResponsesStatus.completedAt"
        ] = {};
        fetchRequiredSubmissionDocumentIdQueryObj[
          "parentInterviewResponsesStatus.completedAt"
        ]["$gte"] = req.query.fromDate;
        fetchRequiredSubmissionDocumentIdQueryObj[
          "parentInterviewResponsesStatus.completedAt"
        ]["$lte"] = req.query.toDate;

        const submissionDocumentIdsToProcess = await database.models.submissions
          .find(fetchRequiredSubmissionDocumentIdQueryObj, { _id: 1 })
          .lean();

        let fileName = `ParentInterview-Completed`;
        req.query.fromDate
          ? (fileName +=
            "fromDate_" + moment(req.query.fromDate).format("DD-MM-YYYY"))
          : "";
        req.query.toDate
          ? (fileName +=
            "toDate_" + moment(req.query.toDate).format("DD-MM-YYYY"))
          : moment().format("DD-MM-YYYY");

        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        if (!submissionDocumentIdsToProcess) {
          throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;
        } else {
          const chunkOfSubmissionIds = _.chunk(
            submissionDocumentIdsToProcess,
            20
          );
          let submissionIds;
          let submissionDocuments;

          let parentTypes = await database.models.entityTypes
            .findOne(
              {
                name: "parent"
              },
              {
                types: 1
              }
            )
            .lean();

          for (
            let pointerToSubmissionIdChunkArray = 0;
            pointerToSubmissionIdChunkArray < chunkOfSubmissionIds.length;
            pointerToSubmissionIdChunkArray++
          ) {
            submissionIds = chunkOfSubmissionIds[
              pointerToSubmissionIdChunkArray
            ].map(submissionModel => {
              return submissionModel._id;
            });

            submissionDocuments = await database.models.submissions
              .find(
                {
                  _id: { $in: submissionIds }
                },
                {
                  "entityInformation.name": 1,
                  "entityInformation.externalId": 1,
                  "entityInformation.administration": 1,
                  "parentInterviewResponsesStatus.status": 1,
                  "parentInterviewResponsesStatus.completedAt": 1,
                  "parentInterviewResponsesStatus.parentType": 1
                }
              )
              .lean();

            await Promise.all(
              submissionDocuments.map(async eachSubmission => {
                let result = {};

                let parentTypeObject = {};
                parentTypes.types.forEach(parentType => {
                  parentTypeObject[parentType.type] = {
                    name: parentType.label,
                    count: 0
                  };
                });

                result["entityId"] =
                  eachSubmission.entityInformation.externalId;
                result["entityName"] = eachSubmission.entityInformation.name;
                result[
                  "Entity (SDMC, EDMC, DOE, NDMC, North DMC, DCB, Private)"
                ] = eachSubmission.entityInformation.administration;

                Object.values(parentTypeObject).forEach(
                  type => (result[type.name] = 0)
                );

                eachSubmission.parentInterviewResponsesStatus.forEach(
                  eachParentInterviewResponse => {
                    if (
                      eachParentInterviewResponse.status === "completed" &&
                      eachParentInterviewResponse.completedAt >=
                      req.query.fromDate &&
                      eachParentInterviewResponse.completedAt <=
                      req.query.toDate
                    ) {
                      result["Date"] = moment(
                        eachParentInterviewResponse.completedAt
                      ).format("DD-MM-YYYY");
                      eachParentInterviewResponse.parentType.forEach(
                        eachParentType => {
                          if (
                            Object.keys(parentTypeObject).includes(
                              eachParentType
                            )
                          )
                            result[
                              parentTypeObject[eachParentType].name
                            ] = ++parentTypeObject[eachParentType].count;
                        }
                      );
                    }
                  }
                );
                if (result["Date"] && result["Date"] != "") {
                  input.push(result);
                }
              })
            );
          }
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/parentInterviewCallDidNotPickupReportByDate/:solutionExternalId Generate report whose parent did not pick up the call
   * @apiVersion 1.0.0
   * @apiName Generate report of all the call responses recorded for parents by date
   * @apiGroup Report
   * @apiParam {String} fromDate From Date
   * @apiParam {String} toDate To Date
   * @apiUse successBody
   * @apiUse errorBody
   */

    /**
   * List of parents who did not pick up call.
   * @method
   * @name parentInterviewCallDidNotPickupReportByDate
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id.
   * @param {String} req.query.fromDate - from Date.
   * @param {String} req.query.toDate - to Date. 
   * @returns {CSV} csv consists of - parent name,parent id,parents name,
   * Date and mobile number.
   */

  async parentInterviewCallDidNotPickupReportByDate(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let allParentsInSolution = await solutionsHelper.allSubGroupEntityIdsByGroupName(
          req.params._id,
          "parent"
        );

        if (!Object.keys(allParentsInSolution).length) {
          return resolve({
            status: httpStatusCode.not_found.status,
            message: messageConstants.apiResponses.PARENT_NOT_FOUND
          });
        }

        let parentRegistryQueryParams = {};

        parentRegistryQueryParams["_id"] = {
          $in: Object.keys(allParentsInSolution)
        };
        parentRegistryQueryParams["metaInformation.callResponse"] = "R2";
        parentRegistryQueryParams[
          "metaInformation.callResponseUpdatedTime"
        ] = {};
        parentRegistryQueryParams["metaInformation.callResponseUpdatedTime"][
          "$gte"
        ] = req.query.fromDate;
        parentRegistryQueryParams["metaInformation.callResponseUpdatedTime"][
          "$lte"
        ] = req.query.toDate;

        const parentRegistryIdsArray = await database.models.entities
          .find(parentRegistryQueryParams, { _id: 1 })
          .lean();

        let fileName = `ParentInterview-CallNotPickedupReport`;
        req.query.fromDate
          ? (fileName +=
            "fromDate_" + moment(req.query.fromDate).format("DD-MM-YYYY"))
          : "";
        req.query.toDate
          ? (fileName +=
            "toDate_" + moment(req.query.toDate).format("DD-MM-YYYY"))
          : moment().format("DD-MM-YYYY");

        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        if (!parentRegistryIdsArray) {
          throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;
        } else {
          const chunkOfParentRegistryDocumentIds = _.chunk(
            parentRegistryIdsArray,
            20
          );

          let parentIds;
          let parentRegistryDocuments;

          for (
            let pointerToParentIdChunkArray = 0;
            pointerToParentIdChunkArray <
            chunkOfParentRegistryDocumentIds.length;
            pointerToParentIdChunkArray++
          ) {
            parentIds = chunkOfParentRegistryDocumentIds[
              pointerToParentIdChunkArray
            ].map(parentModel => {
              return parentModel._id;
            });

            parentRegistryDocuments = await database.models.entities
              .find(
                {
                  _id: { $in: parentIds }
                },
                {
                  "metaInformation.callResponseUpdatedTime": 1,
                  "metaInformation.name": 1,
                  "metaInformation.callResponse": 1,
                  "metaInformation.phone1": 1
                }
              )
              .lean();

            await Promise.all(
              parentRegistryDocuments.map(async eachParentRegistry => {
                let result = {};
                result["Date"] = moment(
                  eachParentRegistry.metaInformation.callResponseUpdatedTime
                ).format("DD-MM-YYYY");
                result["Parent Name"] =
                  allParentsInSolution[
                    eachParentRegistry._id.toString()
                  ].parentEntityName;
                result["Parent Id"] =
                  allParentsInSolution[
                    eachParentRegistry._id.toString()
                  ].parentEntityExternalId;
                result["Parents Name"] =
                  eachParentRegistry.metaInformation.name;
                result["Mobile number"] =
                  eachParentRegistry.metaInformation.phone1;
                input.push(result);
              })
            );
          }
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/parentInterviewCallResponseByDate/:solutionExternalId Generate report for the parent whose callResponse is present.
   * @apiVersion 1.0.0
   * @apiName Generate report for the parent whose callResponse is present.
   * @apiGroup Report
   * @apiParam {String} fromDate From Date
   * @apiParam {String} toDate To Date
   * @apiUse successBody
   * @apiUse errorBody
   */


    /**
   * Number of call response by date.
   * @method
   * @name parentInterviewCallResponseByDate
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id.
   * @param {String} req.query.fromDate - from Date.
   * @param {String} req.query.toDate - to Date. 
   * @returns {CSV} csv consists of - call response type and count per day.
   */

  async parentInterviewCallResponseByDate(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let allParentsInSolution = await solutionsHelper.allSubGroupEntityIdsByGroupName(
          req.params._id,
          "parent"
        );

        if (!Object.keys(allParentsInSolution).length) {
          return resolve({
            status: httpStatusCode.not_found.status,
            message: customElements.PARENT_NOT_FOUND
          });
        }

        let parentRegistryQueryParams = {};

        parentRegistryQueryParams["_id"] = {
          $in: Object.keys(allParentsInSolution)
        };
        parentRegistryQueryParams[
          "metaInformation.callResponseUpdatedTime"
        ] = {};
        parentRegistryQueryParams["metaInformation.callResponseUpdatedTime"][
          "$gte"
        ] = req.query.fromDate;
        parentRegistryQueryParams["metaInformation.callResponseUpdatedTime"][
          "$lte"
        ] = req.query.toDate;

        const parentRegistryIdsArray = await database.models.entities
          .find(parentRegistryQueryParams, {
            "metaInformation.callResponse": 1,
            "metaInformation.callResponseUpdatedTime": 1
          })
          .lean();

        let fileName = `ParentInterview-CallResponsesReport`;
        req.query.fromDate
          ? (fileName +=
            "fromDate_" + moment(req.query.fromDate).format("DD-MM-YYYY"))
          : "";
        req.query.toDate
          ? (fileName +=
            "toDate_" + moment(req.query.toDate).format("DD-MM-YYYY"))
          : moment().format("DD-MM-YYYY");

        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        if (!parentRegistryIdsArray) {
          throw messageConstants.apiResponses.SUBMISSION_NOT_FOUND;
        } else {
          let arrayOfDate = [];

          let parentInterviewCallResponseTypes = await database.models.entityTypes
            .findOne(
              {
                name: "parent"
              },
              {
                callResponseTypes: 1
              }
            )
            .lean();

          let callResponseObj = {};
          parentInterviewCallResponseTypes.callResponseTypes.forEach(
            callResponse => {
              callResponseObj[callResponse.type] = {
                name: callResponse.label
              };
            }
          );

          await Promise.all(
            parentRegistryIdsArray.map(async eachParentRegistry => {
              if (
                eachParentRegistry.metaInformation.callResponseUpdatedTime >=
                req.query.fromDate &&
                eachParentRegistry.metaInformation.callResponseUpdatedTime <=
                req.query.toDate &&
                eachParentRegistry.metaInformation.callResponse
              ) {
                arrayOfDate.push({
                  date: moment(
                    eachParentRegistry.metaInformation.callResponseUpdatedTime
                  ).format("YYYY-MM-DD"),
                  callResponse: eachParentRegistry.metaInformation.callResponse
                });
              }
            })
          );

          let groupByDate = _.mapValues(_.groupBy(arrayOfDate, "date"), v =>
            _.sortBy(v, "date")
          );

          Object.values(groupByDate).forEach(eachGroupDate => {
            let result = {};
            result["date"] = eachGroupDate[0].date;

            Object.values(callResponseObj).forEach(
              type => (result[type.name] = 0)
            );
            let callResponseForEachGroupDate = _.countBy(
              eachGroupDate,
              "callResponse"
            );

            Object.keys(callResponseForEachGroupDate).forEach(
              eachCallResponse => {
                result[callResponseObj[eachCallResponse].name] =
                  callResponseForEachGroupDate[eachCallResponse];
              }
            );

            input.push(result);
          });
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/entityList/:solutionExternalId Fetch Entity list based on solutionId
   * @apiVersion 1.0.0
   * @apiName Fetch Entity list based on solutionId
   * @apiGroup Report
   * @apiUse successBody
   * @apiUse errorBody
   */

    /**
   * List of entity.
   * @method
   * @name entityList
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id.
   * @returns {CSV} csv consists of list of entities in solution and details of it.
   */

  async entityList(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let solutionEntities = await database.models.solutions
          .findOne(
            {
              externalId: req.params._id
            },
            {
              entities: 1
            }
          )
          .lean();

        let entityDocumentList = await database.models.entities
          .find(
            {
              _id: {
                $in: solutionEntities.entities
              }
            },
            {
              _id: 1
            }
          )
          .lean();

        const fileName = `Entity List`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        if (!entityDocumentList.length) {
          return resolve({
            status: httpStatusCode.not_found.status,
            message: messageConstants.apiResponses.ENTITY_NOT_FOUND
          });
        } else {
          let chunkOfEntityDocument = _.chunk(entityDocumentList, 10);
          let entityId;
          let entityDocumentsArray;

          for (
            let pointerToEntityDocument = 0;
            pointerToEntityDocument < chunkOfEntityDocument.length;
            pointerToEntityDocument++
          ) {
            entityId = chunkOfEntityDocument[pointerToEntityDocument].map(
              entityModel => {
                return entityModel._id;
              }
            );

            entityDocumentsArray = await database.models.entities
              .find({
                _id: {
                  $in: entityId
                }
              })
              .lean();

            await Promise.all(
              entityDocumentsArray.map(async eachEntityDocument => {
                let result = {};

                Object.keys(eachEntityDocument.metaInformation).forEach(
                  singleKey => {
                    if (
                      ["types", "questionGroup", "_id", "_v"].indexOf(
                        singleKey
                      ) == -1
                    ) {
                      result[gen.utils.camelCaseToTitleCase(singleKey)] =
                        eachEntityDocument.metaInformation[singleKey];
                    }
                  }
                );

                result["types"] = eachEntityDocument.metaInformation.types.join(
                  ","
                );
                input.push(result);
              })
            );
          }
        }
        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message : error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

  /**
   * @api {get} /assessment/api/v1/reports/frameworkDetails/:solutionExternalId Fetch Framework details based on framework external id
   * @apiVersion 1.0.0
   * @apiName Fetch Frameworks details
   * @apiGroup Report
   * @apiUse successBody
   * @apiUse errorBody
   */

   /**
   * List of entity.
   * @method
   * @name frameworkDetails
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solution external id.
   * @returns {CSV} csv consists of list of framework details information.
   */

  async frameworkDetails(req) {
    return new Promise(async (resolve, reject) => {
      try {
        const fileName = `FrameworkDetails`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        })();

        let solutionDocuments = await database.models.solutions
          .findOne(
            {
              externalId: req.params._id
            },
            {
              themes: 1
            }
          )
          .lean();

        let criteriaIds = gen.utils.getCriteriaIds(solutionDocuments.themes);

        let allCriteriaDocument = await database.models.criteria
          .find({ _id: { $in: criteriaIds } }, { name: 1, externalId: 1 })
          .lean();

        let criteriaObject = _.keyBy(allCriteriaDocument, "_id");

        let getFrameworkDetails = function (themes, parentData = {}) {
          themes.forEach(theme => {
            if (theme.children) {
              let hierarchyTrackToUpdate = { ...parentData };
              hierarchyTrackToUpdate[theme.label] = theme.name;
              getFrameworkDetails(theme.children, hierarchyTrackToUpdate);
            } else {
              let data = {};

              let hierarchyTrackToUpdate = { ...parentData };
              hierarchyTrackToUpdate[theme.label] = theme.name;

              theme.criteria.forEach(criteria => {
                data = {};

                Object.keys(hierarchyTrackToUpdate).forEach(
                  eachHierarchyUpdateData => {
                    data[eachHierarchyUpdateData] =
                      hierarchyTrackToUpdate[eachHierarchyUpdateData];
                  }
                );

                data["criteria Name"] =
                  criteriaObject[criteria.criteriaId.toString()].name;
                data["criteria ExternalId"] =
                  criteriaObject[criteria.criteriaId.toString()].externalId;

                input.push(data);
              });
            }
          });
        };

        getFrameworkDetails(solutionDocuments.themes);

        input.push(null);
      } catch (error) {
        return reject({
          status : error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }

};
