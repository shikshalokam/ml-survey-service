/**
 * name : programOperationsController.js
 * author : Akash
 * created-date : 20-Jan-2019
 * Description : Program operations related information.
 */

// Dependencies
const moment = require("moment-timezone");
const FileStream = require(ROOT_PATH + "/generics/fileStream");
const opsHelper = require(MODULES_BASE_PATH + "/programOperations/helper");
const solutionHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const submissionHelper = require(MODULES_BASE_PATH + "/submissions/helper");

/**
    * ProgramOperations
    * @class
*/
module.exports = class ProgramOperations {

    /**
    * @api {get} /assessment/api/v1/programOperations/listByUser Fetch Program List By User
    * @apiVersion 1.0.0
    * @apiName Fetch Program List By User
    * @apiGroup Program Operations
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * "result": [
        {
           "_id": "5b98d7b6d4f87f317ff615ee",
           "name": "DCPCR School Development Index 2018-19",
           "description": "DCPCR School Development Index 2018-19",
           "externalId": "PROGID01",
           "assessments": [
              {
                 "_id": "5b98fa069f664f7e1ae7498c",
                 "externalId": "EF-DCPCR-2018-001",
                 "name": "DCPCR Assessment Framework 2018",
                 "description": "DCPCR Assessment Framework 2018"
              }
            ]
        }
    ]
    */

     /**
   * List program operations.
   * @method
   * @name listByUser
   * @param {Object} req -request data.
   * @param {Object} req.userDetails -Logged in user data. 
   * @param {String} req.userDetails.userId - logged in user id.
   * @returns {JSON}
   */

    async listByUser(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let userRole = gen.utils.getUserRole(req.userDetails, false);

                let entityAssessorDocumentByUser = await database.models.entityAssessors.find({ userId: req.userDetails.id, role: userRole }, { solutionId: 1 }).lean();

                let solutionsDocuments = await database.models.solutions.aggregate([
                    { "$match": { "_id": { $in: entityAssessorDocumentByUser.map(solution => solution.solutionId) } } },
                    {
                        $project: {
                            "externalId": "$programExternalId",
                            "_id": "$programId",
                            "name": "$programName",
                            "description": "$programDescription",
                            "assessmentId": "$_id",
                            "assessmentExternalId": "$externalId",
                            "assessmentName": "$name",
                            "assessmentDescription": "$description"
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            name: { $first: "$name" },
                            description: { $first: "$description" },
                            externalId: { $first: "$externalId" },
                            assessments: {
                                $push: {
                                    "_id": "$assessmentId",
                                    "externalId": "$assessmentExternalId",
                                    "name": "$assessmentName",
                                    "description": "$assessmentDescription"
                                }
                            },
                        }
                    },
                ]
                );

                let response;

                if (!solutionsDocuments.length) {

                    response = { 
                        status: httpStatusCode.not_found.status, 
                        message: messageConstants.apiResponses.SOLUTION_NOT_FOUND 
                    };

                } else {

                    response = { 
                        message: messageConstants.apiResponses.PROGRAM_LIST, 
                    result: solutionsDocuments };

                }

                return resolve(response);

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
    * @api {get} /assessment/api/v1/programOperations/reportFilters/:solutionId Fetch Reports Filter
    * @apiVersion 1.0.0
    * @apiName Fetch Filters(Drop down contents) for Reports
    * @apiGroup Program Operations
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * "result": [
        {
            "field": "fromDate",
            "label": "start date",
            "value": "",
            "visible": true,
            "editable": true,
            "input": "date",
            "validation": {
                "required": true
            },
            "min": "1970-01-01T00:00:00.000Z",
            "max": "2019-10-01T05:48:46.008Z"
        }
    ]
    */

    /**
   * report filters
   * @method
   * @name reportFilters
   * @param {Object} req -request data.
   * @param {Object} req.userDetails -Logged in user data. 
   * @param {String} req.params._id - solution id.
   * @returns {JSON}
   */

    async reportFilters(req) {
        opsHelper.checkUserAuthorization(req.userDetails, req.params._id);
        return new Promise(async (resolve, reject) => {
            try {

                let solutionDocument = await database.models.solutions.findOne({ _id: ObjectId(req.params._id) }, { entities: 1 }).lean();

                let entityTypeDocument = await database.models.entityTypes.findOne({ "name": "school" }, { types: 1 }).lean();

                let administrationTypes = await database.models.entities.distinct('metaInformation.administration', { _id: { $in: solutionDocument.entities } }).lean();

                administrationTypes = _.compact(administrationTypes).sort().map(administrationType => {
                    return {
                        label: administrationType,
                        value: administrationType
                    }
                });

                let reportsFilterForm = await database.models.forms.findOne({ "name": "reportsFilter" }, { value: 1 }).lean();

                let result = reportsFilterForm.value;

                result.forEach(formField => {
                    if (formField.field == "fromDate") {
                        formField.min = new Date(0);
                        formField.max = new Date();
                    };
                    if (formField.field == "toDate") {
                        formField.min = new Date(0);
                        formField.max = new Date();
                    };
                    if (formField.field == "entityTypes") {
                        formField.options = entityTypeDocument.types;
                    }
                    if (formField.field == "administration") {
                        formField.options = administrationTypes;
                    }
                });

                return resolve({
                    message: messageConstants.apiResponses.REPORTS_FILTER,
                    result: result
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
    * @api {get} /assessment/api/v1/programOperations/userProfile/:solutionId Fetch User Profile
    * @apiVersion 1.0.0
    * @apiName User profile
    * @apiGroup Program Operations
    * @apiParamExample {json} Response:
    * "result": [
        {
            "label": "dateOfReportGeneration",
            "value": "01-10-2019"
        },
        {
            "label": "nameOfTheManager",
            "value": "Sandeep"
        },
        {
            "label": "role",
            "value": "Assessors"
        },
        {
            "label": "nameOfTheProgram",
            "value": "DCPCR School Development Index 2018-19"
        },
        {
            "label": "userName",
            "value": "a1"
        },
        {
            "label": "email",
            "value": "a1@shikshalokamdev.dev"
        }
    ]
    * @apiUse successBody
    * @apiUse errorBody
    */

     /**
   * User profile information.
   * @method
   * @name userProfile
   * @param {Object} req -request data.
   * @param {Object} req.userDetails -Logged in user data. 
   * @param {String} req.params._id - solution id.
   * @returns {JSON}
   */

    async userProfile(req) {

        opsHelper.checkUserAuthorization(req.userDetails, req.params._id);

        return new Promise(async (resolve, reject) => {
            try {

                let userRole = gen.utils.getReadableUserRole(req.userDetails);

                let managerName = (req.userDetails.firstName + " " + req.userDetails.lastName).trim();

                let programDocument = await database.models.solutions.findOne({ _id: ObjectId(req.params._id) }, { programName: 1 }).lean();

                let result = [
                    {
                        label: "dateOfReportGeneration",
                        value: moment().format('DD-MM-YYYY'),
                    },
                    {
                        label: "nameOfTheManager",
                        value: managerName
                    },
                    {
                        label: "role",
                        value: userRole,
                    },
                    {
                        label: "nameOfTheProgram",
                        value: programDocument.programName,
                    },
                    {
                        label: "userName",
                        value: req.userDetails.userName || "",
                    },
                    {
                        label: "email",
                        value: req.userDetails.email || "",
                    }
                ];

                return resolve({
                    message: messageConstants.apiResponses.MANAGER_PROFILE,
                    result: result
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
    * @api {get} /assessment/api/v1/programOperations/entitySummary/:solutionId?administration=:administrationType&schoolTypes=:schoolTypes&area=:area&schoolName=:schoolName&fromDate=2019-01-01 Fetch Entity Summary
    * @apiVersion 1.0.0
    * @apiName Fetch Entity Summary
    * @apiGroup Program Operations
    * @apiUse successBody
    * @apiUse errorBody
    */

     /**
   * Entity Summary
   * @method
   * @name entitySummary
   * @param {Object} req -request data.
   * @param {Object} req.userDetails -Logged in user data. 
   * @param {String} req.params._id - solution id.
   * @returns {JSON}
   */

    async entitySummary(req) {

        opsHelper.checkUserAuthorization(req.userDetails, req.params._id);

        return new Promise(async (resolve, reject) => {
            try {

                let resultArray = [
                    {
                        label: "entitiesAssigned",
                        value: "",
                    },
                    {
                        label: "entitiesCompleted",
                        value: "",
                    },
                    {
                        label: "entitiesInporgress",
                        value: "",
                    },
                    {
                        label: "averageTimeTakenInDays",
                        value: "",
                    }
                ];

                let entityObjects = await opsHelper.getEntities(req.userDetails, req.query, req.pageSize, req.pageNo, false, [], req.params._id);

                if (!entityObjects || !entityObjects.result || !entityObjects.result.length) {
                    return resolve({
                        result: resultArray
                    });
                }

                let entityDocuments = entityObjects.result;

                let entityIds = entityDocuments.map(entity => entity.id);

                let entitiesCompletedCount = database.models.submissions.countDocuments({ entityId: { $in: entityIds }, status: 'completed' }).lean().exec();

                let entitiesInprogressCount = database.models.submissions.countDocuments({ entityId: { $in: entityIds }, status: 'inprogress' }).lean().exec();

                [entitiesCompletedCount, entitiesInprogressCount] = await Promise.all([entitiesCompletedCount, entitiesInprogressCount]);

                let averageTimeTaken = (entityDocuments.length / entitiesCompletedCount);

                resultArray[0]["value"] = entityDocuments.length;
                resultArray[1]["value"] = entitiesCompletedCount || "";
                resultArray[2]["value"] = entitiesInprogressCount || "";
                resultArray[3]["value"] = averageTimeTaken ? (parseFloat(averageTimeTaken.toFixed(2)) || "") : "";

                return resolve({
                    message: messageConstants.apiResponses.ENTITY_FETCHED,
                    result: resultArray
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
    * @api {get} /assessment/api/v1/programOperations/assessorReport/:solutionId?administration=:administrationType&schoolTypes=:schoolTypes&area=:area&schoolName=:schoolName&fromDate=2019-01-01&csv=false Fetch Assessor Report
    * @apiVersion 1.0.0
    * @apiName Fetch Assessor Report
    * @apiGroup Program Operations
    * @apiUse successBody
    * @apiUse errorBody
    */

    /**
   * Assessor Report
   * @method
   * @name assessorReport
   * @param {Object} req -request data.
   * @param {Object} req.userDetails -Logged in user data. 
   * @param {String} req.params._id - solution id.
   * @returns {JSON}
   */

    async assessorReport(req) {
        opsHelper.checkUserAuthorization(req.userDetails, req.params._id);
        return new Promise(async (resolve, reject) => {
            try {

                let programDocument = await solutionHelper.solutionDocument(ObjectId(req.params._id), ["_id", "entities", "programId", "programName", "programExternalId"]);

                if (!programDocument.length) {
                    throw { 
                        status: httpStatusCode.bad_request.status, 
                        message: httpStatusCode.bad_request.message 
                    };
                }

                programDocument = programDocument[0];

                let assessorDetails;
                let assessorQueryObject = {};
                assessorQueryObject["$or"] = [
                    {
                        "parentId": req.userDetails.id
                    },
                    {
                        "userId": req.userDetails.id
                    }
                ];

                assessorQueryObject["programId"] = programDocument.programId;

                assessorQueryObject["solutionId"] = ObjectId(req.params._id);

                if (req.query.assessorName) assessorQueryObject["name"] = new RegExp(req.query.assessorName.replace(/[^a-zA-Z0-9_-]/g, ''), 'i');

                if (req.query.csv && req.query.csv == "true") {
                    const fileName = `assessorReport`;
                    var fileStream = new FileStream(fileName);
                    var input = fileStream.initStream();

                    (async function () {
                        await fileStream.getProcessorPromise();
                        return resolve({
                            isResponseAStream: true,
                            fileNameWithPath: fileStream.fileNameWithPath()
                        });
                    }());
                }

                let limitValue = (req.query.csv && req.query.csv == "true") ? "" : req.pageSize;
                let skipValue = (req.query.csv && req.query.csv == "true") ? "" : (req.pageSize * (req.pageNo - 1));

                assessorDetails = database.models.entityAssessors.find(assessorQueryObject, { userId: 1, name: 1, entities: 1 }).limit(limitValue).skip(skipValue).lean().exec();

                let totalCount = database.models.entityAssessors.countDocuments(assessorQueryObject).exec();

                [assessorDetails, totalCount] = await Promise.all([assessorDetails, totalCount]);

                let assessorEntityIds = _.flattenDeep(assessorDetails.map(entity => entity.entities));

                //get only uniq entityIds
                if (assessorEntityIds.length) {
                    let uniqAssessorEntityIds = _.uniq(assessorEntityIds.map(entity => entity.toString()));
                    assessorEntityIds = uniqAssessorEntityIds.map(entity => ObjectId(entity));
                }

                let userIds = assessorDetails.map(assessor => assessor.userId);

                let assessorEntityMap = _.keyBy(assessorDetails, 'userId');

                assessorEntityIds = await opsHelper.getEntities(req.userDetails, req.query, req.pageSize, req.pageNo, false, userIds, req.params._id);

                assessorEntityIds = (assessorEntityIds.result && assessorEntityIds.result.length) ? assessorEntityIds.result.map(entity => entity.id) : [];

                let submissionDocuments = await database.models.submissions.find({ entityId: { $in: assessorEntityIds } }, { status: 1, createdAt: 1, completedDate: 1, entityId: 1 }).lean();

                let entitySubmissionMap = _.keyBy(submissionDocuments, 'entityId');

                let assessorsReports = [];
                assessorDetails.forEach(async (assessor) => {
                    let entityByAssessor = opsHelper.getSubmissionByAssessor(assessor.userId, entitySubmissionMap, assessorEntityMap);
                    let entityData = _.countBy(entityByAssessor, 'status');
                    let entityAssigned = entityByAssessor.length;
                    let assessorResult = {
                        name: assessor.name || "",
                        entitiesAssigned: entityAssigned || "",
                        entitiesCompleted: entityData.completed || "",
                        entitiesCompletedPercent: parseFloat(((entityData.completed / entityAssigned) * 100).toFixed(2)) || "",
                        averageTimeTaken: opsHelper.getAverageTimeTaken(entityByAssessor)
                    };
                    assessorsReports.push(assessorResult);
                    if (req.query.csv && req.query.csv == "true") {
                        input.push(assessorResult);

                        if (input.readableBuffer && input.readableBuffer.length) {
                            while (input.readableBuffer.length > 20000) {
                                await opsHelper.sleep(2000);
                            }
                        }

                    }
                })
                if (req.query.csv && req.query.csv == "true") {
                    input.push(null);
                } else {
                    let result = await opsHelper.constructResultObject('programOperationAssessorReports', assessorsReports, totalCount, req.userDetails, programDocument.name, req.query);
                    return resolve({ result: result });
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
    * @api {get} /assessment/api/v1/programOperations/entityReport/:solutionId?administration=:administrationType&schoolTypes=:schoolTypes&area=:area&schoolName=:schoolName&fromDate=2019-01-01&csv=false Fetch Entity Report
    * @apiVersion 1.0.0
    * @apiName Fetch Entity Report
    * @apiGroup Program Operations
    * @apiUse successBody
    * @apiUse errorBody
    */

     /**
   * Entity Report
   * @method
   * @name entityReport
   * @param {Object} req -request data.
   * @param {Object} req.userDetails -Logged in user data. 
   * @param {String} req.params._id - solution id.
   * @returns {JSON}
   */

    async entityReport(req) {
        opsHelper.checkUserAuthorization(req.userDetails, req.params._id);
        return new Promise(async (resolve, reject) => {
            try {

                let programDocument = await solutionHelper.solutionDocument(ObjectId(req.params._id), ["_id", "entities", "programId", "programName", "programExternalId"]);

                if (!programDocument.length) {
                    throw {  
                        status: httpStatusCode.bad_request.status, 
                        message: httpStatusCode.bad_request.message
                    };
                }

                programDocument = programDocument[0];

                let programExternalId = programDocument.programExternalId;

                let isCSV = req.query.csv;
                let entityDocuments = await opsHelper.getEntities(req.userDetails, req.query, req.pageSize, req.pageNo, (!isCSV || isCSV == "false") ? true : false, [], req.params._id);

                if (!entityDocuments) {
                    return resolve(noDataFound());
                }

                let entityObjects = entityDocuments.result;

                let totalCount = entityDocuments.totalCount;

                if (!entityObjects || !entityObjects.length) {
                    return resolve(noDataFound());
                }

                async function noDataFound() {
                    let result = await opsHelper.constructResultObject('programOperationEntityReports', [], totalCount, req.userDetails, programDocument.programName, req.query);
                    return { result: result };
                }

                let submissionQueryObject = {};
                let entityObjectIds = entityObjects.map(entity => entity.id);
                submissionQueryObject.entityId = { $in: entityObjectIds };
                submissionQueryObject.programExternalId = programExternalId;

                if (isCSV && isCSV == "true") {

                    const fileName = `entityReport`;
                    var fileStream = new FileStream(fileName);
                    var input = fileStream.initStream();

                    (async function () {
                        await fileStream.getProcessorPromise();
                        return resolve({
                            isResponseAStream: true,
                            fileNameWithPath: fileStream.fileNameWithPath()
                        });
                    }());
                }

                let submissionDocuments = await database.models.submissions.find(submissionQueryObject, { status: 1, createdAt: 1, completedDate: 1, 'evidencesStatus.isSubmitted': 1, entityExternalId: 1 }).lean();

                submissionDocuments = _.keyBy(submissionDocuments, 'entityExternalId');

                let result = {};

                result.entitiesReport = [];
                entityObjects.forEach(async (singleEntityDocument) => {
                    let submissionDetails = submissionDocuments[singleEntityDocument.externalId];
                    let resultObject = {};
                    resultObject.status = submissionDetails ? (submissionHelper.mapSubmissionStatus(submissionDetails.status) || submissionDetails.status) : "";
                    resultObject.name = singleEntityDocument.name || "";
                    resultObject.daysElapsed = submissionDetails ? moment().diff(moment(submissionDetails.createdAt), 'days') : "";
                    resultObject.assessmentCompletionPercent = submissionDetails ? opsHelper.getAssessmentCompletionPercentage(submissionDetails.evidencesStatus) : "";

                    if (isCSV == "true") {
                        input.push(resultObject);

                        if (input.readableBuffer && input.readableBuffer.length) {
                            while (input.readableBuffer.length > 20000) {
                                await opsHelper.sleep(2000);
                            }
                        }
                    } else {
                        result.entitiesReport.push(resultObject);
                    }

                })

                if (isCSV == "true") {
                    input.push(null);
                } else {
                    result = await opsHelper.constructResultObject('programOperationEntityReports', result.entitiesReport, totalCount, req.userDetails, programDocument.programName, req.query);
                    return resolve({ result: result });
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
    * @api {get} /assessment/api/v1/programOperations/searchEntity/:solutionId?id=entityId Search Entity By Id
    * @apiVersion 1.0.0
    * @apiName Fetch Filters(Autocomplete contents) for Reports
    * @apiGroup Program Operations
    * @apiUse successBody
    * @apiUse errorBody
    */

     /**
   * Search Entity
   * @method
   * @name searchEntity
   * @param {Object} req -request data.
   * @param {Object} req.userDetails -Logged in user data. 
   * @param {String} req.params._id - solution id.
   * @returns {JSON}
   */

    //program operation search entity autocomplete API
    async searchEntity(req) {
        opsHelper.checkUserAuthorization(req.userDetails, req.params._id);
        return new Promise(async (resolve, reject) => {
            try {
                let programDocument = await solutionHelper.solutionDocument(ObjectId(req.params._id), ["_id", "entities"]);

                if (!programDocument.length) {
                    throw {
                        status: httpStatusCode.bad_request.status, 
                        message: httpStatusCode.bad_request.message
                    };
                }

                programDocument = programDocument[0];
                
                let entityIdAndName = await database.models.entities.find(
                    {
                        _id: { $in: programDocument.entities },
                        "metaInformation.externalId": new RegExp(req.query.id.replace(/[^a-zA-Z0-9_-]/g, ''), 'i')
                    },
                    {
                        "metaInformation.externalId": 1,
                        "metaInformation.name": 1
                    }
                ).limit(5).lean();//autocomplete needs only 5 dataset

                entityIdAndName = entityIdAndName.map(entityIdAndName => {
                    entityIdAndName.metaInformation._id = entityIdAndName._id;
                    return entityIdAndName.metaInformation;
                })

                return resolve({
                    status: httpStatusCode.ok.status,
                    result: entityIdAndName
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