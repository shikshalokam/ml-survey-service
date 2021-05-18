/**
 * name : individualAssessmentsController.js
 * author : Aman
 * created-date : 04-Jun-2020
 * Description : Individual assessments library related information.
 */

const libraryIndividualAssessmentsHelper = 
require(MODULES_BASE_PATH + "/library/individualAssessments/helper");

 /**
    * IndividualAssessments
    * @class
*/

module.exports = class IndividualAssessments {
    
    constructor() {}

    static get name() {
        return "IndividualAssessments";
    }

    /**
    * @api {get} /assessment/api/v1/library/individualAssessments/list?search=:searchText&page=:page&limit=:limit List of Individual assessment solution
    * @apiVersion 1.0.0
    * @apiName List of Individual assessment solution
    * @apiGroup Individual Solution Library
    * @apiSampleRequest /assessment/api/v1/library/individualAssessments/list?search=A&page=1&limit=1
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    "message": "Successfully fetched individual solutions list",
    "status": 200,
    "result": {
        "data": [
            {
                "_id": "5d15b0d7463d3a6961f91745",
                "externalId": "TAF-2019-TEMPLATE",
                "name": "Teacher Assessment Framework",
                "description": "Teacher Assessment Framework"
            }
        ],
        "count": 1
    }}

    */

      /**
      * List of Individual assessment solution
      * @method
      * @name list
      * @param {Object} req - All requested Data.
      * @returns {JSON} returns a list of templates individual library.
     */

    async list(req) {
        return new Promise(async (resolve, reject) => {
            try {
                
                let individualAssessmentSolutions = 
                await libraryIndividualAssessmentsHelper.list( 
                  req.searchText, 
                  req.pageSize, 
                  req.pageNo,
                  req.userDetails.userId,
                  req.rspObj.userToken 
                );

                return resolve(individualAssessmentSolutions);
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
    * @api {get} /assessment/api/v1/library/individualAssessments/details/:librarySolutionId Details of Individual Assessment solution.
    * @apiVersion 1.0.0
    * @apiName Details of Individual Assessment solution
    * @apiGroup Individual Solution Library
    * @apiSampleRequest /assessment/api/v1/library/individualAssessments/details/5ed5ec4dd2afa80d0f616460
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    "message": "Successfully fetched individual solution details",
    "status": 200,
    "result": {
        "name": "DCPCR Assessment Framework 2018",
        "creator": "",
        "description": "DCPCR Assessment Framework 2018",
        "ecmQuestions": [
            {
                "ecm": "LW",
                "name" : "Learning walk",
                "questions": [
                    "Date of textbook delivery to school."
                ]
            }
        ],
        "linkTitle": "Individual assessment",
        "linkUrl": "https://storage.googleapis.com/sl-dev-storage/6e24b29b-8b81-4b70-b1b5-fa430488b1cf/597661590679526_1590677779461.pdf?GoogleAccessId=sl-dev-storage%40shikshalokam.iam.gserviceaccount.com&Expires=1591575574&Signature=fSLCsVMbU7sXEeRn2FSNJ42%2Fy9guIP9rO9FjGh1%2B1D0zBAYDsVdHSXi3cOludZ%2BK32cHoAxx1TxVx1%2FX6rUGqd3M%2FukminSyRH9WwRzL0%2FLyo5n86ft0NiICB2%2BCrQHQi6eNQE7KBASwagHs1P2ljBMY22JO9uQX9en%2FPOhqG2OSkhp45FFgqW%2FclsiLc37WJvCckJny8UjdZoyHIOe360grqoi82HLgQKlB0Pr%2BnfAUvGAKVHhrCSke71xZ6iIW%2Bud5Pm7lqSqorZ0%2B1FFFFfv%2FqVFeDLaZoxKb0eMBIxmrnXFhVAHPiUcPVKFGDddSl1RjGWDnjuMhBvoXbslFNA%3D%3D"
    }}
    */

      /**
      * Details of Individual Assessment solution
      * @method
      * @name details
      * @param {Object} req - All requested Data.
      * @returns {JSON} returns creator,about and questions details.
     */

    async details(req) {
        return new Promise(async (resolve, reject) => {
            try {
                
                let individualAssessmentSolution = 
                await libraryIndividualAssessmentsHelper.details( 
                    req.params._id  
                );

                return resolve(individualAssessmentSolution);
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
