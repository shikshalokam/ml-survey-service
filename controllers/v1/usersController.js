/**
 * name : usersController.js
 * author : Aman
 * created-date : 20-May-2020
 * Description : Users related information.
 */

 // Dependencies 

 const usersHelper = require(MODULES_BASE_PATH + "/users/helper");
 const observationsHelper = require(MODULES_BASE_PATH + "/observations/helper")
 const observationSubmissionsHelper = require(MODULES_BASE_PATH +
     "/observationSubmissions/helper");
 /**
    * Users
    * @class
*/
module.exports = class Users {
    constructor() {}

    static get name() {
        return "users";
    }

    /**
    * @api {get} /assessment/api/v1/users/programs/:userId List of user programs
    * @apiVersion 1.0.0
    * @apiName List of user programs
    * @apiGroup Users
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/users/programs/e97b5582-471c-4649-8401-3cc4249359bb
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    *  {
    * "message": "Successfully fetched user programs",
    * {
    "status": 200,
    "result": [
        {
            "_id": "5b98d7b6d4f87f317ff615ee",
            "name": "DCPCR School Development Index 2018-19",
            "externalId": "PROGID01",
            "description": "DCPCR School Development Index 2018-19",
            "solutions": [
                {
                    "programName": "DCPCR School Development Index 2018-19",
                    "programId": "5b98d7b6d4f87f317ff615ee",
                    "_id": "5b98fa069f664f7e1ae7498c",
                    "name": "DCPCR Assessment Framework 2018",
                    "externalId": "EF-DCPCR-2018-001",
                    "description": "DCPCR Assessment Framework 2018",
                    "type": "assessment",
                    "subType": "institutional",
                    "entities": [
                        {
                            "_id": "5bfe53ea1d0c350d61b78d5c",
                            "name": "Tulip Public School, Pckt 20 Sec.24 Rohini, Delhi",
                            "externalId": "1413311",
                            "entityType": "school",
                            "submissionId": "5e9537f7cd48090a5339a640",
                            "submissionStatus": "inprogress"
                        },
                        {
                            "_id": "5d80ee3bbbcc4b1bf8e79ddf",
                            "name": "PUNJAB GSSS K.B.D.S. BOYS",
                            "externalId": "3020800103",
                            "entityType": "school",
                            "totalSubmissionCount": 1,
                            "submissions": [
                                {
                                    "submissionId": "5ebb6df88ea4e621b754c86c",
                                    "submissionStatus": "completed",
                                    "submissionNumber": 1,
                                    "entityId": "5d80ee3bbbcc4b1bf8e79ddf",
                                    "createdAt": "2020-05-13T03:48:08.380Z",
                                    "updatedAt": "2020-05-13T03:48:36.665Z",
                                    "observationName": "PACE AP MEO d-1",
                                    "observationId": "5ea1a24369ce5e39c315268b"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}
  */

    /**
   * Programs list information 
   * @method
   * @name programs
   * @returns {JSON} list of programs information. 
   */
  
   programs(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let userPrograms = await usersHelper.programs(
            req.params._id ? req.params._id : req.userDetails.userId
        );

        return resolve(userPrograms);

      } catch (error) {

        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        })

      }


    })
  }


    /**
    * @api {get} /assessment/api/v1/users/entities/:userId List of user entities
    * @apiVersion 1.0.0
    * @apiName List of user entities
    * @apiGroup Users
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/users/entities/e97b5582-471c-4649-8401-3cc4249359bb
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    "message": "Successfully fetched user entities",
    "status": 200,
    "result": {
        "entityTypes": [
            {
                "name": "School",
                "key": "school"
            }
        ],
        "entities": {
            "school": [
                {
                    "_id": "5bfe53ea1d0c350d61b78d5c",
                    "name": "Tulip Public School, Pckt 20 Sec.24 Rohini, Delhi",
                    "externalId": "1413311",
                    "entityType": "school",
                    "solutions": [
                        {
                            "programName": "DCPCR School Development Index 2018-19",
                            "programId": "5b98d7b6d4f87f317ff615ee",
                            "_id": "5b98fa069f664f7e1ae7498c",
                            "name": "DCPCR Assessment Framework 2018",
                            "externalId": "EF-DCPCR-2018-001",
                            "description": "DCPCR Assessment Framework 2018",
                            "type": "assessment",
                            "subType": "institutional",
                            "submissionId": "5e9537f7cd48090a5339a640",
                            "submissionStatus": "inprogress"
                        }
                    ]
                }
            ]
        }
    }
}
  */

    /**
   * List of user entities.
   * @method
   * @name entities
   * @param {Object} req -request Data.
   * @param {String} req.params._id - user id
   * @returns {JSON} List of user entities.  
   */
  
  entities(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let entitiesData = await usersHelper.entities(
            req.params._id ? req.params._id : req.userDetails.userId
        );

        return resolve(entitiesData);

      } catch (error) {

        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        })

      }


    })
  }

  /**
     * @api {get} /assessment/api/v1/users/privatePrograms/:userId List of user private programs
     * @apiVersion 2.0.0
     * @apiName List of user private programs
     * @apiGroup Programs
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/users/privatePrograms/e97b5582-471c-4649-8401-3cc4249359bb
     * @apiParamExample {json} Response:
     * {
     "message": "List of private programs",
     "status": 200,
     "result": [
        {
            "_id": "5edf0d14c57dab7f639f3e0d",
            "externalId": "EF-DCPCR-2018-001-TEMPLATE-2020-06-09 09:46:20",
            "name": "My program",
            "description": "DCPCR Assessment Framework 2018"
        }
     ]}
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
    * Private Programs .
    * @method
    * @name privatePrograms
    * @param {Object} req -request Data.
    * @param {String} req.params._id - user id
    * @returns {JSON} - List of programs created by user.
    */

   async privatePrograms(req) {
    return new Promise(async (resolve, reject) => {

        try {

            let programsData = 
            await usersHelper.privatePrograms(
                (req.params._id && req.params._id != "") ? 
                req.params._id : 
                req.userDetails.userId
            );

            return resolve(programsData);

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
     * @api {post} /assessment/api/v1/users/createProgramAndSolution/:userId Users created program and solution.
     * @apiVersion 2.0.0
     * @apiName Users created program and solution.
     * @apiGroup Programs
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/users/createProgramAndSolution/e97b5582-471c-4649-8401-3cc4249359bb
     * @apiParamExample {json} Request-Body:
     * {
     * "programId" : "",
     * "programName" : "Test project program",
     * "solutionName" : "Test project solution"
     }
     * @apiUse successBody
     * @apiUse errorBody
     * @apiParamExample {json} Response:
     * {
    "status": 200,
    "result": {
        "program": {
            "resourceType": [
                "Program"
            ],
            "language": [
                "English"
            ],
            "keywords": [
                "keywords 1",
                "keywords 2"
            ],
            "concepts": [],
            "components": [],
            "isAPrivateProgram": true,
            "_id": "5f44b08cdbe917732246149f",
            "deleted": false,
            "externalId": "Test project program-1598337164794",
            "name": "Test project program",
            "description": "Test project program",
            "status": "active",
            "imageCompression": {
                "quality": 10
            },
            "updatedAt": "2020-08-25T06:32:44.796Z",
            "createdAt": "2020-08-25T06:32:44.796Z",
            "__v": 0
        },
        "solution": {
            "resourceType": [],
            "language": [],
            "keywords": [],
            "concepts": [],
            "themes": [],
            "flattenedThemes": [],
            "entities": [],
            "registry": [],
            "isRubricDriven": false,
            "enableQuestionReadOut": false,
            "captureGpsLocationAtQuestionLevel": false,
            "isAPrivateProgram": false,
            "allowMultipleAssessemts": false,
            "isDeleted": false,
            "_id": "5f44b08cdbe91773224614a0",
            "deleted": false,
            "name": "Test project solution",
            "externalId": "Test project solution-1598337164794",
            "description": "Test project solution",
            "programId": "5f44b08cdbe917732246149f",
            "programExternalId": "Test project program-1598337164794",
            "programName": "Test project program",
            "programDescription": "Test project program",
            "updatedAt": "2020-08-25T06:32:44.801Z",
            "createdAt": "2020-08-25T06:32:44.801Z",
            "__v": 0
        }
    }}
     */

    /**
    * Create user program and solution.
    * @method
    * @name createProgramAndSolution
    * @param {Object} req -request Data.
    * @param {String} req.params._id - user id
    * @returns {JSON} - Created user program and solution.
    */

   async createProgramAndSolution(req) {
    return new Promise(async (resolve, reject) => {

        try {

            let createdProgramAndSolution = 
            await usersHelper.createProgramAndSolution(
                (req.params._id && req.params._id != "") ? 
                req.params._id : 
                req.userDetails.id,
                req.body,
                req.userDetails.userToken
            );

            return resolve(createdProgramAndSolution);

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
    * @api {get} /user/observations/{{programId}}
    * @apiVersion 1.0.0
    * @apiName Get survey and observation documents in program
    * @apiGroup Internal API
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiParam {String} programId.
    * @apiSampleRequest /observation/getStartedObservations/63a42786c0b15a0009f0505e
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    {
   "success":true,
   "message":"Observation fetched successfully",
   "status":200,
   "result":[
         {
            "_id":"64639270a0efdd0008575952",
            "solutionId":"63690d9e743f760009155f6b",
            "solutionExternalId":"2546ecb8-407f-11ec-8473-7fe753029532-1667829150737",
            "programId":"6319a4d53c40dd000978dacb",
            "programExternalId":"PGM-FD558-testing_program-5.0"
         },
         {
            "_id":"64639279a0efdd000857595a",
            "solutionId":"6369011a743f760009155e9b",
            "solutionExternalId":"2546ecb8-407f-11ec-8473-7fe753029532-1667825946531",
            "programId":"6319a4d53c40dd000978dacb",
            "programExternalId":"PGM-FD558-testing_program-5.0"
         },
         
      ],
}
    */
    /**
   * Get observation documents for program.
   * @method
   * @name getStartedObservations
   * @param {Object} req -request Data.
   * @param {String} req.params._id - programId.
   * @returns {JSON} 
   */

     async observations(req,res){

        return new Promise(async (resolve, reject) => {

            try {
                /**
                 * @function observations 
                 * @param {String} programId - programId
                 * @param {String} userId - userId
                 * @return {Object} containing all the observations information started by user in that program
                 */
                let observationDetails = await usersHelper.observations(
                    req.userDetails.userId,
                    req.params._id ? req.params._id : ""
                );

                return resolve({
                    message: observationDetails.message,
                    result: observationDetails.data
                })

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
    * @api {get} /user/surveys/{{programId}}
    * @apiVersion 1.0.0
    * @apiName Get survey and observation documents in program
    * @apiGroup Internal API
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiParam {String} programId.
    * @apiSampleRequest /surveys/getStartedSurveys/63a42786c0b15a0009f0505e
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    {
   "success":true,
   "message":"Surveys fetched successfully",
   "status":200,
   "result":[
         {
            "_id":"64639270a0efdd0008575952",
            "solutionId":"63690d9e743f760009155f6b",
            "solutionExternalId":"2546ecb8-407f-11ec-8473-7fe753029532-1667829150737",
            "programId":"6319a4d53c40dd000978dacb",
            "programExternalId":"PGM-FD558-testing_program-5.0"
         },
         {
            "_id":"64639279a0efdd000857595a",
            "solutionId":"6369011a743f760009155e9b",
            "solutionExternalId":"2546ecb8-407f-11ec-8473-7fe753029532-1667825946531",
            "programId":"6319a4d53c40dd000978dacb",
            "programExternalId":"PGM-FD558-testing_program-5.0"
         },
      ],
}
    */
    /**
   * Get survey documents for program.
   * @method
   * @name getStartedSurveys
   * @param {Object} req -request Data.
   * @param {String} req.params._id - programId.
   * @returns {JSON} 
   */

     async surveys(req,res){

        return new Promise(async (resolve, reject) => {

            try {

                /**
                 * @function survey 
                 * @param {String} programId - programId
                 * @param {String} userId - userId
                 * @return {Object} containing all the survey information started by user in that program
                 */
                let surveyDetails = await usersHelper.surveys(
                    req.userDetails.userId,
                    req.params._id ? req.params._id : ""
                );

                return resolve({
                    message: surveyDetails.message,
                    result: surveyDetails.data
                })

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
    * @api {get} /users/surveySubmissions/{{solutionId}}
    * @apiVersion 1.0.0
    * @apiName Get survey and observation documents in program
    * @apiGroup Internal API
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiParam {String} programId.
    * @apiSampleRequest /users/surveySubmissions/63a42786c0b15a0009f0505e
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    {
        "success":true,
        "message":"Survey submission fetched successfully",
        "data":[
            {
                "_id":"62e228eedd8c6d0009da5084",
                "solutionId":"627dfc6509446e00072ccf78",
                "surveyId":"62e228eedd8c6d0009da507d",
                "status":"completed",
                "surveyInformation":{
                    "name":"Create a Survey (To check collated reports) for 4.9 regression -- FD 380",
                    "description":"Create a Survey (To check collated reports) for 4.9 regression -- FD 380"
                }
            }
        ]
    }
    */
    /**
   * Get survey documents for program.
   * @method
   * @name getStartedSurveys
   * @param {Object} req -request Data.
   * @param {String} req.params._id - programId.
   * @returns {JSON} 
   */

    async surveySubmissions(req,res){

        return new Promise(async (resolve, reject) => {

            try {

                let surveyDetails = await usersHelper.surveySubmissions(
                    req.userDetails.userId,
                    req.params._id ? req.params._id : ""
                );

                return resolve({
                    message: surveyDetails.message,
                    result: surveyDetails.data
                })

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
     * @api {get} /assessment/api/v1/users/listObservationInfo Get Overview Info of observation consumed by an user
     * @apiVersion 1.0.0
     * @apiName List Observation Info
     * @apiGroup users
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/users/listObservationInfo
     * @apiParamExample {json} Response:
{
    "message": "Observation overview information fetched successfully",
    "status": 200,
    "result": [
        {
            "_id": "60caf260ecea0772d81d7e5e",
            "entities": [
                "8ac1efe9-0415-4313-89ef-884e1c8eee34",
                "b54a5c6d-98be-4313-af1c-33040b1703aa",
                "2f76dcf5-e43b-4f71-a3f2-c8f19e1fce03"
            ],
            "isAPrivateProgram": false,
            "name": "AP-TEST-PROGRAM-3.6.5-OBS-1-DEO",
            "description": "Description of AP-TEST-PROGRAM-3.6.5-OBS-1-DEO",
            "status": "published",
            "submissionInfoArray": [
                [
                    {
                        "_id": "60d1d97ea2709472c8c49b09",
                        "entityId": "8ac1efe9-0415-4313-89ef-884e1c8eee34",
                        "entityInformation": {
                            "name": "SRIKAKULAM"
                        },
                        "entityType": "district",
                        "createdBy": "fca2925f-1eee-4654-9177-fece3fd6afc9",
                        "status": "started",
                        "title": "Observation 1"
                    }
                ],
                [
                    {
                        "_id": "60d58ee5983c1372591ccb5b",
                        "entityId": "b54a5c6d-98be-4313-af1c-33040b1703aa",
                        "entityInformation": {
                            "name": "VIZIANAGARAM"
                        },
                        "entityType": "district",
                        "createdBy": "fca2925f-1eee-4654-9177-fece3fd6afc9",
                        "status": "completed",
                        "title": "Observation 1"
                    }
                ],
                [
                    {
                        "_id": "60caf262ecea0772d81d7e5f",
                        "entityId": "2f76dcf5-e43b-4f71-a3f2-c8f19e1fce03",
                        "entityInformation": {
                            "name": "ANANTAPUR"
                        },
                        "entityType": "district",
                        "createdBy": "fca2925f-1eee-4654-9177-fece3fd6afc9",
                        "status": "started",
                        "title": "Observation 1"
                    }
                ]
            ]
        }]}
     * @apiUse successBody
     * @apiUse errorBody
     */
     
    /**
    * list Observation Info
    * @method
    * @name listObservationInfo
    * @param {Object} req -request Data.
    * @returns {JSON} - List of observation consumed by an user
    */
    usersObservation(req) {
        return new Promise(async (resolve, reject) => {
            try {
    
                let userObservationDetails = await usersHelper.usersObservation({
                    stats:req.query.stats,
                    userId:req.userDetails.userId
                })
                
                return resolve({
                    message:messageConstants.apiResponses.OBSERVATION_OVERVIEW_INFORMATION_FETCHED,
                    result: userObservationDetails
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
}