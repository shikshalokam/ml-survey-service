/**
 * name : observationsController.js
 * author : Aman
 * created-date : 22-Nov-2018
 * Description : Updated Observations related information .
 */

// Dependencies
const userExtensionHelper = require(MODULES_BASE_PATH + "/userExtension/helper");
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");
const observationsHelper = require(MODULES_BASE_PATH + "/observations/helper");
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const v1Observation = require(ROOT_PATH + "/controllers/v1/observationsController");
const assessmentsHelper = require(MODULES_BASE_PATH + "/assessments/helper");
const programsHelper = require(MODULES_BASE_PATH + "/programs/helper");
const userRolesHelper = require(MODULES_BASE_PATH + "/userRoles/helper");

/**
    * Observations
    * @class
*/

module.exports = class Observations extends v1Observation {


    // TODO :: url string is too long.

    /**
     * @api {get} /assessment/api/v2/observations/list Observations list
     * @apiVersion 2.0.0
     * @apiName Observations list
     * @apiGroup Observations
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/observations/list
     * @apiParamExample {json} Response:
        "result": [
            {
                "_id": "5d09c34d1f7fd5a2391f7251",
                "entities": [],
                "name": "Observation 1",
                "description": "Observation Description",
                "status": "published",
                "solutionId": "5b98fa069f664f7e1ae7498c"
            },
            {
                "_id": "5d1070326f6ed50bc34aec2c",
                "entities": [
                    {
                        "_id": "5cebbefe5943912f56cf8e16",
                        "submissionStatus": "pending",
                        "submissions": [],
                        "name": "asd"
                    },
                    {
                        "_id": "5cebbf275943912f56cf8e18",
                        "submissionStatus": "pending",
                        "submissions": [],
                        "name": "asd"
                    }
                ],
                "status": "published",
                "endDate": "2019-06-24T00:00:00.000Z",
                "name": "asdasd",
                "description": "asdasdasd",
                "solutionId": "5c6bd309af0065f0e0d4223b"
            }
        ]
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
    * List Observation.
    * @method
    * @name list
    * @param {Object} req -request Data.
    * @returns {JSON} - List observation data.
    */

   async list(req) {

        return new Promise(async (resolve, reject) => {

            try {

                let observations = new Array;

                observations = await observationsHelper.listV2(req.userDetails.userId);
                
                let responseMessage = messageConstants.apiResponses.OBSERVATION_LIST;

                return resolve({
                    message: responseMessage,
                    result: observations
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
     * @api {post} /assessment/api/v2/observation/create?solutionId=:solutionId Create observation
     * @apiVersion 2.0.0
     * @apiName Create observation
     * @apiGroup Observations
     * @apiParamExample {json} Request-Body:
     *  {
     * "name" : "My Solution",
     * "description" : "My Solution Description",
     * "program" : {
     * "_id" : "",
     * "name" : "My program"
     * },
     * "entities" : ["5bfe53ea1d0c350d61b78d0a"],
     * "status" : "Published" 
     * }
     * @apiSampleRequest /assessment/api/v2/observation/create?solutionId=5ed5ec4dd2afa80d0f616460
     * @apiUse successBody
     * @apiUse errorBody
     * @apiParamExample {json} Response:
     * {
    "message": "Successfully created solution",
    "status": 200,
    "result": {
        "_id": "5edf880baf0d3261e4af7f7e",
        "externalId": "AFRICA-ME-TEST-FRAMEWORK-TEMPLATE-1591707659674",
        "frameworkExternalId": "AFRICA-ME-TEST-FRAMEWORK",
        "frameworkId": "5d15adc5fad01368a494cbd7",
        "programExternalId": "My program-1591707659613",
        "programId": "5edf880baf0d3261e4af7f7d",
        "entityTypeId": "5d15a959e9185967a6d5e8a6",
        "entityType": "school",
        "isAPrivateProgram": true,
        "observationName": "My Solution",
        "observationId": "5edf880caf0d3261e4af7f7f"
    }
    }
     */
     
    /**
    * Create observation
    * @method
    * @name create
    * @param {Object} req -request Data.
    * @returns {Object} - created solution,programs and observation from given solution id. 
    */

   async create(req) {
    return new Promise(async (resolve, reject) => {

        try {

            let solutionData = 
            await observationsHelper.createV2(
              req.query.solutionId,
              req.userDetails.userId,
              req.body,
              req.rspObj.userToken 
            );

            return resolve(solutionData);

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

