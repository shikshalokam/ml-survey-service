/**
 * name : exportController.js
 * author : Akash
 * created-date : 01-feb-2019
 * Description : export program,solution,framework,criteria,questions so that later on
 * we can import it.
 */

// Dependencies
const filesHelper = require(MODULES_BASE_PATH + "/files/helper")


/**
    * Export
    * @class
*/
module.exports = class Export {

    constructor() {
    }

    static get name() {
        return "export";
    }

    /**
    * @api {get} /assessment/api/v1/export/program/:programExternalId Export Program Document
    * @apiVersion 1.0.0
    * @apiName Export Program Document
    * @apiGroup Export
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/export/program/PROGID01
    * @apiUse successBody
    * @apiUse errorBody
    */

      /**
    * Export program.
    * @method
    * @name program
    * @param {Object} req - request data.
    * @param {String} req.params._id - program id.
    * @returns {JSON} export into json file.
    */

    program(req) {
        return new Promise(async (resolve, reject) => {
            try {
                let programId = req.params._id;
                let programDocument = await database.models.programs.findOne({ externalId: programId });
                if (!programDocument) {
                    return resolve({
                        status: httpStatusCode.bad_request.status,
                        message: messageConstants.apiResponses.PROGRAM_NOT_FOUND
                    });
                }

                let filePath = await filesHelper.createFileWithName(`Program_${programId}`);

                return resolve(await filesHelper.writeJsObjectToJsonFile(filePath, programDocument));

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
    * @api {get} /assessment/api/v1/export/solution/:solutionExternalId Export Solution Document
    * @apiVersion 1.0.0
    * @apiName Export Solution Document
    * @apiGroup Export
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/export/solution/EF-DCPCR-2018-001
    * @apiUse successBody
    * @apiUse errorBody
    */

      /**
    * Export solution.
    * @method
    * @name solution
    * @param {Object} req - request data.
    * @param {JSON} req.params._id - solution external id.
    * @returns {JSON} export into json file. 
    */

    solution(req) {
        return new Promise(async (resolve, reject) => {
            try {
                let solutionDocument = await database.models.solutions.findOne({ externalId: req.params._id });
                if (!solutionDocument) {
                    return resolve({
                        status: httpStatusCode.bad_request.status,
                        message: messageConstants.apiResponses.SOLUTION_NOT_FOUND
                    });
                }

                let filePath = await filesHelper.createFileWithName(`Solution_${req.params._id}`);

                return resolve(await filesHelper.writeJsObjectToJsonFile(filePath, solutionDocument));

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
    * @api {get} /assessment/api/v1/export/framework/:frameworkExternalId Export Framework Document
    * @apiVersion 1.0.0
    * @apiName Export Framework Document
    * @apiGroup Export
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/export/framework/EF-DCPCR-2018-001
    * @apiUse successBody
    * @apiUse errorBody
    */

      /**
    * Export framework.
    * @method
    * @name framework
    * @param {Object} req - request data.
    * @param {JSON} req.params._id - framework external id.
    * @returns {JSON} export into json file. 
    */

    framework(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let frameworkDocument = await database.models.frameworks.findOne({ externalId: req.params._id });
                if (!frameworkDocument) {
                    return resolve({
                        status: httpStatusCode.bad_request.status,
                        message: messageConstants.apiResponses.FRAMEWORK_NOT_FOUND
                    });
                }

                let filePath = await filesHelper.createFileWithName(`Framework_${req.params._id}`);

                return resolve(await filesHelper.writeJsObjectToJsonFile(filePath, frameworkDocument));

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
    * @api {get} /assessment/api/v1/export/frameworkCriteria/:frameworkExternalId Export Framework Criteria Document
    * @apiVersion 1.0.0
    * @apiName Export Framework Criteria Document
    * @apiGroup Export
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/export/frameworkCriteria/EF-DCPCR-2018-001
    * @apiUse successBody
    * @apiUse errorBody
    */

    /**
    * Export framework criteria.
    * @method
    * @name frameworkCriteria
    * @param {Object} req - request data.
    * @param {JSON} req.params._id - framework external id.
    * @returns {JSON} export into json file. 
    */

    frameworkCriteria(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let frameworkDocument = await database.models.frameworks.findOne({ externalId: req.params._id }, { themes: 1 });
                if (!frameworkDocument) {
                    return resolve({
                        status: httpStatusCode.bad_request.status,
                        message: messageConstants.apiResponses.FRAMEWORK_NOT_FOUND
                    });
                }

                let filePath = await filesHelper.createFileWithName(`FrameworkCriteria_${req.params._id}`);
                let criteriaIds = gen.utils.getCriteriaIds(frameworkDocument.themes);
                let allCriteriaDocument = await database.models.criteria.find({ _id: { $in: criteriaIds } });

                return resolve(await filesHelper.writeJsObjectToJsonFile(filePath, allCriteriaDocument));

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
    * @api {get} /assessment/api/v1/export/solutionCriteria/:frameworkExternalId Export Solution Criteria Document
    * @apiVersion 1.0.0
    * @apiName Export Solution Criteria Document
    * @apiGroup Export
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/export/solutionCriteria/EF-DCPCR-2018-001
    * @apiUse successBody
    * @apiUse errorBody
    */

    /**
    * Export solutionCriteria.
    * @method
    * @name solutionCriteria
    * @param {Object} req - request data.
    * @param {JSON} req.params._id - solution external id.
    * @returns {JSON} export into json file. 
    */

    solutionCriteria(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let solutionDocument = await database.models.solutions.findOne({ externalId: req.params._id }, { themes: 1 });
                if (!solutionDocument) {
                    return resolve({
                        status: httpStatusCode.bad_request.status,
                        message: messageConstants.apiResponses.SOLUTION_NOT_FOUND
                    });
                }

                let filePath = await filesHelper.createFileWithName(`SolutionCriteria_${req.params._id}`);
                let criteriaIds = gen.utils.getCriteriaIds(solutionDocument.themes);
                let allCriteriaDocument = await database.models.criteria.find({ _id: { $in: criteriaIds } });

                return resolve(await filesHelper.writeJsObjectToJsonFile(filePath, allCriteriaDocument));

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
    * @api {get} /assessment/api/v1/export/questions/:frameworkExternalId Export Solution Questions Document
    * @apiVersion 1.0.0
    * @apiName Export Solution Questions Document
    * @apiGroup Export
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/export/questions/EF-DCPCR-2018-001
    * @apiUse successBody
    * @apiUse errorBody
    */

      /**
    * Export questions.
    * @method
    * @name questions
    * @param {Object} req - request data.
    * @param {JSON} req.params._id - solution external id.
    * @returns {JSON} export into json file. 
    */

    questions(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let solutionDocument = await database.models.solutions.findOne({ externalId: req.params._id }, { themes: 1 });
                if (!solutionDocument) {
                    return resolve({
                        status: httpStatusCode.bad_request.status,
                        message: messageConstants.apiResponses.SOLUTION_NOT_FOUND
                    });
                }

                let filePath = await filesHelper.createFileWithName(`QuestionInSolution_${req.params._id}`);
                let criteriaIds = gen.utils.getCriteriaIds(solutionDocument.themes);

                let allCriteriaQuestionDocuments = await database.models.criteriaQuestions.find({ _id: { $in: criteriaIds } });

                let allQuestions = [];
                allCriteriaQuestionDocuments.forEach(singleCriteria => {
                    singleCriteria.evidences.forEach(singleEvidence => {
                        singleEvidence.sections.forEach(section => {
                            section.questions.forEach(question => {
                                allQuestions.push(question);
                            })
                        })
                    })
                })

                return resolve(await filesHelper.writeJsObjectToJsonFile(filePath, allQuestions));

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
