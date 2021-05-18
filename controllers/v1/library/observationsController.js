/**
 * name : observationsController.js
 * author : Aman
 * created-date : 04-Jun-2020
 * Description : Observations library related information.
 */

const libraryObservationsHelper = 
require(MODULES_BASE_PATH + "/library/observations/helper");

 /**
    * Observations
    * @class
*/
module.exports = class Observations {
    
    constructor() {}

    static get name() {
        return "Observations";
    }

    /**
    * @api {get} /assessment/api/v1/library/observations/list?search=:searchText&page=:page&limit=:limit List of observation solutions
    * @apiVersion 1.0.0
    * @apiName List of observation solutions
    * @apiGroup Observation Solutions Library
    * @apiSampleRequest /assessment/api/v1/library/observations/list?search=A&page=1&limit=1
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    "message": "Successfully fetched observations solutions list",
    "status": 200,
    "result": {
        "data": [
            {
                "_id": "5d15b0d7463d3a6961f91746",
                "externalId": "AFRICA-ME-TEST-FRAMEWORK-TEMPLATE",
                "name": "AFRICA-ME-TEST-FRAMEWORK",
                "description": "AFRICA-ME-TEST-FRAMEWORK"
            }
        ],
        "count": 29
    }}
    */

      /**
      * List of observation solutions
      * @method
      * @name list
      * @param {Object} req - All requested Data.
      * @returns {JSON} returns a list of templates observation solution.
     */

    async list(req) {
        return new Promise(async (resolve, reject) => {
            try {
                
                let observationSolutions = 
                await libraryObservationsHelper.list( 
                  req.searchText, 
                  req.pageSize, 
                  req.pageNo,
                  req.userDetails.userId,
                  req.rspObj.userToken  
                );

                return resolve(observationSolutions);
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
    * @api {get} /assessment/api/v1/library/observations/details/:librarySolutionId Details of observation solution.
    * @apiVersion 1.0.0
    * @apiName Details of observation solution
    * @apiGroup Observation Solutions Library
    * @apiSampleRequest /assessment/api/v1/library/observations/details/5ed5ec4dd2afa80d0f616460
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    "message": "Successfully fetched observation solution details",
    "status": 200,
    "result": {
        "name": "AFRICA-ME-TEST-FRAMEWORK",
        "creator": "",
        "description": "AFRICA-ME-TEST-FRAMEWORK",
        "linkTitle": "",
        "linkUrl": "",
        "questions": [
            "What about any awareness sessions for students and staff on things like personal safety, health, hygiene, and disaster management?",
            "How often do these sessions happen?",
            "What topics are generally covered in these sessions?",
            "Who participated in these sessions?"
        ]
    }}
    */

      /**
      * Details of library solution
      * @method
      * @name details
      * @param {Object} req - All requested Data.
      * @returns {JSON} returns creator,about and questions details.
     */

    async details(req) {
        return new Promise(async (resolve, reject) => {
            try {
                
                let observationSolution = 
                await libraryObservationsHelper.details( 
                    req.params._id
                );

                return resolve(observationSolution);
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
