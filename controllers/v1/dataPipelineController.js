/**
 * name : dataPipelineController.js
 * author : Rakesh
 * created-date : 21-July-2020
 * Description : DataPipeline related information.
 */

// Dependencies
const dataPipelineHelper = require(MODULES_BASE_PATH + "/dataPipeline/helper");

/**
 * DataPipeline
 * @class
 */

module.exports = class DataPipeline {

  /**
   * @apiDefine errorBody
   * @apiError {String} status 4XX,5XX
   * @apiError {String} message Error
   */

  /**
   * @apiDefine successBody
   * @apiSuccess {String} status 200
   * @apiSuccess {String} result Data
   */

  static get name() {
    return "dataPipeline";
  }

  /**
   * Get project details.
   * @method
   * @name read
   * @param {Object} req - request data.
   * @param {String} req.params._id - project Id.
   * @returns {JSON} project details
   */

  /**
   * @api {get} /assessment/api/v1/dataPipeline/observationSubmission/:observationSubmissionId Get Observation Submission details
   * @apiVersion 1.0.0
   * @apiName Get Observation Submission details
   * @apiGroup Observation Submissions
   * @apiUse successBody
   * @apiUse errorBody
   */

  /**
   * Get observation submission details.
   * @method
   * @name details
   * @param {Object} req -request data. 
   * @param {String} req.params._id -observation submissions id.
   * @returns {JSON} - obseration submission details
   */

  async observationSubmission(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let submissionDetails = await dataPipelineHelper.observationSubmission(req.params._id);

        return resolve({
          result: submissionDetails.data,
          message: submissionDetails.message
        });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
        });
      }
    })
  }

  /**
   * @api {get} /assessment/api/v1/dataPipeline/surveySubmission/:surveySubmissionId Get Survey Submission details
   * @apiVersion 1.0.0
   * @apiName Get Survey Submission details
   * @apiGroup Observation Submissions
   * @apiUse successBody
   * @apiUse errorBody
   */

  /**
   * Get survey submission details.
   * @method
   * @name details
   * @param {Object} req -request data. 
   * @param {String} req.params._id -survey submissions id.
   * @returns {JSON} - survey submission details
   */

  async surveySubmission(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let submissionDetails = await dataPipelineHelper.surveySubmission(req.params._id);

        return resolve({
          result: submissionDetails.data,
          message: submissionDetails.message
        });

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
        });
      }
    })
  }



};