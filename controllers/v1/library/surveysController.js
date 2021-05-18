/**
 * name : surveysController.js
 * author : Deepa
 * created-date : 04-Sep-2020
 * Description : Surveys library related information.
 */

const librarySurveysHelper = require(MODULES_BASE_PATH + "/library/surveys/helper");

 /**
    * Surveys
    * @class
*/
module.exports = class Surveys {
    
    constructor() {}

    static get name() {
        return "Surveys";
    }

    /**
    * @api {get} /assessment/api/v1/library/surveys/list?search=:searchText&page=:page&limit=:limit List of survey solutions
    * @apiVersion 1.0.0
    * @apiName List of survey solutions
    * @apiGroup Survey Solutions Library
    * @apiSampleRequest /assessment/api/v1/library/surveys/list?search=A&page=1&limit=1
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
        "message": "Survey solutions list fetched successfully",
        "status": 200,
        "result": {
           "data": [
              {
                "_id": "5f57ad1283096e7c4474417d",
                "name": "Test survey",
                "externalId": "Test-survey",
                "description": "Survey and feedback"
              }
            ],
           "count": 1
        }
      }
    */

      /**
      * List of survey solutions
      * @method
      * @name list
      * @param {Object} req - All requested Data.
      * @returns {JSON} returns a list of survey solution.
     */

    async list(req) {
        return new Promise(async (resolve, reject) => {
            try {
                
                let surveySolutions = 
                await librarySurveysHelper.list( 
                  req.searchText, 
                  req.pageSize, 
                  req.pageNo,
                  req.userDetails.userId,
                  req.rspObj.userToken  
                );

                return resolve({
                    message: surveySolutions.message,
                    result: surveySolutions.data
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
    * @api {get} /assessment/api/v1/library/surveys/details/:librarySolutionId Details of survey solution.
    * @apiVersion 1.0.0
    * @apiName Details of survey solution
    * @apiGroup Survey Solutions Library
    * @apiSampleRequest /assessment/api/v1/library/surveys/details/5ed5ec4dd2afa80d0f616460
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    "message": "Survey solution details fetched successfully",
    "status": 200,
    "result": {
        "name": "Test survey",
        "creator": "",
        "description": "Survey and feedback",
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
                
                let surveySolution = 
                await librarySurveysHelper.details( 
                    req.params._id
                );

                return resolve({
                      message: surveySolution.message,
                      result: surveySolution.data
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
