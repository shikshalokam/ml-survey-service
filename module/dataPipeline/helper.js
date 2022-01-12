/**
 * name : helper.js
 * author : Rakesh
 * created-date : 12-Jun-2020
 * Description : DataPipeline helper functionality.
 */

// Dependencies

const observationSubmissionsHelper = require(MODULES_BASE_PATH + "/observationSubmissions/helper");

const surveySubmissionsHelper = require(MODULES_BASE_PATH + "/surveySubmissions/helper");

/**
 * dataPipelineHelper
 * @class
 */

module.exports = class dataPipelineHelper {

    /**
     * get observation submission details.
     * @method
     * @name surveySubmission 
     * @param {String} submissionId - submission id.
     * @returns {Object} observation submission details.
     */

    static observationSubmission(projectId) {
        return new Promise(async (resolve, reject) => {
            try {

                const submissionDetails = await observationSubmissionsHelper.details(projectId);

                return resolve({ 
                    data:submissionDetails,
                    success: true,
                    message: messageConstants.apiResponses.OBSERVATION_SUBMISSION_FOUND,
                });


                // return resolve(submissionDetails);

            } catch (error) {
                return resolve({
                    success: false,
                    message: error.message,
                    data: {}
                });
            }
        })
    }

    /**
     * get survey submission details.
     * @method
     * @name surveySubmission 
     * @param {String} submissionId - submission id.
     * @returns {Object} survey submission details.
     */

    static surveySubmission(submissionId) {
        return new Promise(async (resolve, reject) => {
            try {

                const submissionDetails = await surveySubmissionsHelper.details(submissionId);
                return resolve({ 
                    data:submissionDetails,
                    success: true,
                    message: messageConstants.apiResponses.SURVEY_SUBMISSION_FOUND,
                });


            } catch (error) {
                return resolve({
                    success: false,
                    message: error.message,
                    data: {}
                });
            }
        })
    }

}