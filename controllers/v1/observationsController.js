/**
 * name : observationsController.js
 * author : Akash
 * created-date : 22-Nov-2018
 * Description : Observations information.
 */

// Dependencies

const observationsHelper = require(MODULES_BASE_PATH + "/observations/helper")
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper")
const assessmentsHelper = require(MODULES_BASE_PATH + "/assessments/helper")
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper")
const userExtensionHelper = require(MODULES_BASE_PATH + "/userExtension/helper");
const programsHelper = require(MODULES_BASE_PATH + "/programs/helper");
const userRolesHelper = require(MODULES_BASE_PATH + "/userRoles/helper");
const userProfileService = require(ROOT_PATH + "/generics/services/users");
const coreService = require(ROOT_PATH + "/generics/services/core");
const programUsersHelper = require(MODULES_BASE_PATH + "/programUsers/helper");

/**
    * Observations
    * @class
*/
module.exports = class Observations extends Abstract {

    constructor() {
        super(observationsSchema);
    }

    /**
    * @api {get} /assessment/api/v1/observations/solutions/:entityTypeId?search=:searchText&limit=1&page=1 Observation Solution
    * @apiVersion 1.0.0
    * @apiName Observation Solution
    * @apiGroup Observations
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/observations/solutions/5cd955487e100b4dded3ebb3?search=Framework&pageSize=10&pageNo=1
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * "result": [
        {
            "data": [
                {
                    "_id": "5c6bd309af0065f0e0d4223b",
                    "externalId": "TAF-2019",
                    "name": "Teacher Assessment Framework",
                    "description": "Teacher Assessment Framework",
                    "keywords": [
                        "Framework",
                        "Priyanka",
                        "Assessment"
                    ],
                    "entityTypeId": "5ce23d633c330302e720e661",
                    "programId": "5c6bd365af0065f0e0d42280"
                }
            ],
            "count": 1
        }
    ]
    */

     /**
   * Observation solutions.
   * @method
   * @name solutions
   * @param {Object} req -request Data.
   * @param {String} req.params._id - entity type id.
   * @returns {JSON} - Solution Details.
   */

    async solutions(req) {

        return new Promise(async (resolve, reject) => {

            try {

                let response = {};
                let messageData;
                let matchQuery = {};

                matchQuery["$match"] = {};

                if (req.params._id) {
                    matchQuery["$match"]["entityTypeId"] = ObjectId(req.params._id);
                }

                matchQuery["$match"]["type"] = "observation";
                matchQuery["$match"]["isReusable"] = true;
                matchQuery["$match"]["status"] = "active";

                matchQuery["$match"]["$or"] = [];
                matchQuery["$match"]["$or"].push({ "name": new RegExp(req.searchText, 'i') }, { "description": new RegExp(req.searchText, 'i') }, { "keywords": new RegExp(req.searchText, 'i') });

                let solutionDocument = await solutionsHelper.search(matchQuery, req.pageSize, req.pageNo);

                messageData = messageConstants.apiResponses.SOLUTION_FETCHED;

                if (!solutionDocument[0].count) {
                    solutionDocument[0].count = 0;
                    messageData = messageConstants.apiResponses.SOLUTION_NOT_FOUND;
                }

                response.result = solutionDocument;
                response["message"] = messageData;

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
    * @api {get} /assessment/api/v1/observations/metaForm/:solutionId Observation Creation Meta Form
    * @apiVersion 1.0.0
    * @apiName Observation Creation Meta Form
    * @apiGroup Observations
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/observations/metaForm
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    * "message": "Observation meta fetched successfully.",
    * "status": 200,
    * "result": [
    * {
    * "field": "name",
    * "label": "Title",
    * "value": "",
    * "visible": true,
    * "editable": true,
    * "input": "text",
    * "validation": {
    * "required": true
    * }
    * },
    * {
    * "field": "description",
    * "label": "Description",
    * "value": "",
    * "visible": true,
    * "editable": true,
    * "input": "textarea",
    * "validation": {
    * "required": true
    * }
    * },{
    * "field": "status",
    * "label": "Status",
    * "value": "draft",
    * "visible": false,
    * "editable": true,
    * "input": "radio",
    * "validation": {
    * "required": true
    * },
    * "options": [
    * {
    * "value": "published",
    * "label": "Published"
    * },
    * {
    * "value": "draft",
    * "label": "Published"
    * },
    * {
    * "value": "completed",
    * "label": "Completed"
    * }
    * ]
    * }
    * ]}
    */

     /**
   * Observation meta form.
   * @method
   * @name metaForm
   * @param {Object} req -request Data.
   * @returns {JSON} - Observation meta form.
   */

    async metaForm(req) {

        return new Promise(async (resolve, reject) => {

            try {

                let solutionsData = await database.models.solutions.findOne({
                    _id: ObjectId(req.params._id),
                    isReusable: true,
                    type : messageConstants.common.OBSERVATION
                }, {
                        observationMetaFormKey: 1
                    }).lean();


                if (!solutionsData._id) {
                    let responseMessage = httpStatusCode.bad_request.message;
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: responseMessage 
                    });
                }

                let observationsMetaForm = await database.models.forms.findOne({ "name": (solutionsData.observationMetaFormKey && solutionsData.observationMetaFormKey != "") ? solutionsData.observationMetaFormKey : "defaultObservationMetaForm" }, { value: 1 }).lean();

                return resolve({
                    message: messageConstants.apiResponses.OBSERVATION_META_FETCHED,
                    result: observationsMetaForm.value
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
     * @api {post} /assessment/api/v1/observations/create?solutionId=:solutionInternalId Create Observation
     * @apiVersion 1.0.0
     * @apiName Create Observation
     * @apiGroup Observations
     * @apiParamExample {json} Request-Body:
     * {
     *	    "data": {
     *          "name": String,
     *          "description": String,
     *          "startDate": String,
     *          "endDate": String,
     *          "status": String,
     *          "entities":["5beaa888af0065f0e0a10515","5beaa888af0065f0e0a10516"]
     *      }
     *      "userRoleAndProfileInformation": {
     *          "role" : "HM,DEO",
     *          "state" : "236f5cff-c9af-4366-b0b6-253a1789766a",
     *          "district" : "1dcbc362-ec4c-4559-9081-e0c2864c2931",
     *          "school" : "c5726207-4f9f-4f45-91f1-3e9e8e84d824"
     *      }
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */
     
    /**
    * Create Observation.
    * @method
    * @name create
    * @param {Object} req -request Data.
    * @returns {JSON} - Created observation data.
    */

    create(req) {
        return new Promise(async (resolve, reject) => {

            try {

                let result = await observationsHelper.create(
                    req.query.solutionId, 
                    req.body.data, 
                    req.userDetails.id, 
                    req.userDetails.userToken,
                    req.query.programId,
                    req.body.userRoleAndProfileInformation
                );

                return resolve({
                    message: messageConstants.apiResponses.OBSERVATION_CREATED,
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
     * @api {get} /assessment/api/v1/observations/list Observations list
     * @apiVersion 1.0.0
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

                observations = await observationsHelper.listV1(req.userDetails.userId);
                
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
     * @api {post} /assessment/api/v1/observations/addEntityToObservation/:observationId Map entities to observations
     * @apiVersion 1.0.0
     * @apiName Map entities to observations
     * @apiGroup Observations
     * @apiParamExample {json} Request-Body:
     * {
     *	    "data": ["5beaa888af0065f0e0a10515","5beaa888af0065f0e0a10516"]
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
    * Add entity to observation.
    * @method
    * @name addEntityToObservation
    * @param {Object} req -request Data.
    * @param {String} req.params._id -Observation id. 
    * @returns {JSON} message - regarding either entity is added to observation or not.
    */

     async addEntityToObservation(req) {

        return new Promise(async (resolve, reject) => {

            try {

                let result = 
                await observationsHelper.addEntityToObservation(
                    req.params._id,
                    req.body.data,
                    req.userDetails.id
                );

                return resolve(result);

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
     * @api {post} /assessment/api/v1/observations/removeEntityFromObservation/:observationId Un Map entities to observations
     * @apiVersion 1.0.0
     * @apiName Un Map entities to observations
     * @apiGroup Observations
    * @apiParamExample {json} Request-Body:
     * {
     *	    "data": ["5beaa888af0065f0e0a10515","5beaa888af0065f0e0a10516"]
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */


    /**
    * Remove entity from observation.
    * @method
    * @name removeEntityFromObservation
    * @param {Object} req -request Data.
    * @param {String} req.params._id -observation id. 
    * @returns {JSON} observation remoevable message
    */

    async removeEntityFromObservation(req) {

        return new Promise(async (resolve, reject) => {

            try {

                let result = 
                await observationsHelper.removeEntityFromObservation(
                    req.params._id,
                    req.body.data,
                    req.userDetails.id
                );
                
                return resolve(result);

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
     * @api {post} /assessment/api/v1/observations/updateEntities/:observationId Map entities to observations
     * @apiVersion 1.0.0
     * @apiName Map entities to observations
     * @apiGroup Observations
     * @apiParamExample {json} Request-Body:
     *  {
     *	    "data": ["5beaa888af0065f0e0a10515","5beaa888af0065f0e0a10516"]
     * }
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
    * Add entity to observation.
    * @method
    * @name updateEntities
    * @param {Object} req -request Data.
    * @param {String} req.params._id -Observation id. 
    * @returns {JSON} message - regarding either entity is added to observation or not.
    */

    async updateEntities(req) {

        return new Promise(async (resolve, reject) => {

            try {

                let response = {};
                if( req.method === "POST" ) {
                    response = 
                    await observationsHelper.addEntityToObservation(
                        req.params._id,
                        req.body.data,
                        req.userDetails.id
                    )
                } else if( req.method === "DELETE" ) {
                    response = 
                    await observationsHelper.removeEntityFromObservation(
                        req.params._id,
                        req.body.data ? req.body.data : (req.query.entityId ? req.query.entityId.split(',') : []),
                        req.userDetails.id
                    ) 
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
     * @api {get} /assessment/api/v1/observations/searchEntities/:solutionId=:solutionId&search=:searchText&limit=1&page=1&parentEntityId=:parentEntityId Search Entities based on observationId or solutionId 
     * @apiVersion 1.0.0
     * @apiName Search Entities
     * @apiGroup Observations
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/observations/searchEntities/5d1a002d2dfd8135bc8e1615?search=&limit=100&page=1
     * @apiUse successBody
     * @apiUse errorBody
     * @apiParamExample {json} Response:
        {
            "message": "Entities fetched successfully",
            "status": 200,
            "result": [
                {
                    "data": [
                        { 
                          "_id": "5bfe53ea1d0c350d61b78d0f",
                            "name": "Shri Shiv Middle School, Shiv Kutti, Teliwara, Delhi",
                            "externalId": "1208138",
                            "addressLine1": "Shiv Kutti, Teliwara",
                            "addressLine2": ""
                        }
                    ],
                    "count": 435
                }
            ]
        }
     */

    /**
    * Search entities in observation.
    * @method
    * @name searchEntities
    * @param {Object} req -request Data.
    * @param {String} req.params._id -observation id. 
    * @returns {JSON} List of entities in observations.
    */

    async searchEntities(req) {

        return new Promise(async (resolve, reject) => {

            try {

                let formatForSearchEntities = true;
                let response = {
                    result: {}
                };

                let userId = req.userDetails.userId;
                let result;

                let projection = [];

                if ( !req.query.observationId && !req.query.solutionId ) {
                    throw {
                        status: httpStatusCode.bad_request.status,
                        message: messageConstants.apiResponses.OBSERVATION_SOLUTION_ID_REQUIRED
                    };
                }

                if ( req.query.observationId ) {
                    let findObject = {
                        "_id" : req.query.observationId,
                        "createdBy" : userId
                    };

                    projection.push(
                        "entities",
                        "entityType"
                    );

                    let observationDocument = 
                    await observationsHelper.observationDocuments(findObject, projection);
                    result = observationDocument[0];

                }

                if ( req.query.solutionId ) {
                    let findQuery = {
                        _id: ObjectId(req.query.solutionId)
                    };
                    projection.push(
                        "entityType"
                    );

                    let solutionDocument = await solutionsHelper.solutionDocuments(findQuery, projection);
                    result = _.merge(solutionDocument[0]);
                }
               
                let userAllowedEntities = new Array;

                // try {
                //     userAllowedEntities = await userExtensionHelper.getUserEntitiyUniverseByEntityType(userId, result.entityType);
                // } catch (error) {
                //     userAllowedEntities = [];
                // }

                let messageData = messageConstants.apiResponses.ENTITY_FETCHED;

                if( !(userAllowedEntities.length > 0) && req.query.parentEntityId ) {
                    let filterData = {
                        "id" : req.query.parentEntityId
                    };

                    let entitiesDocument = await userProfileService.locationSearch( 
                            filterData,
                            "",
                            "",
                            "",
                            false,
                            false,
                            formatForSearchEntities
                        );
                    
                    if ( !entitiesDocument.success ) {
                        return resolve({
                            "message" : messageConstants.apiResponses.ENTITY_NOT_FOUND,
                            "result" : [{
                                "count":0,
                                "data" : []
                            }]
                        })
                    }

                    let entitiesData = entitiesDocument.data;
                    
                    if( entitiesData && entitiesData[0].type === result.entityType ) {
                        response.result = [];
                        
                        let data = 
                        await entitiesHelper.observationSearchEntitiesResponse(
                            entitiesData,
                            result.entities
                        );

                        response["message"] = messageConstants.apiResponses.ENTITY_FETCHED;

                        response.result.push({
                            "data" : data,
                            "count" : 1
                        });
                        return resolve(response);

                    } else {

                        if( result.entityType == messageConstants.common.SCHOOL ) {
                            
                            response.result = [];
                            let filterData = {
                                "orgLocation.id" : req.query.parentEntityId 
                            }
                            //data key that api fetch
                            let fields = ["externalId"];
                            let subEntitiesCode = await userProfileService.orgSchoolSearch(
                                filterData,
                                req.pageSize,
                                req.pageNo,
                                req.searchText,
                                fields
                            );

                            if( !subEntitiesCode.success ) {
                                return resolve({
                                    "message" : messageConstants.apiResponses.ENTITY_NOT_FOUND,
                                    "result" : [{
                                        "count":0,
                                        "data" : []
                                    }]
                                })
                            }
                        
                            let schoolDetails = subEntitiesCode.data;
                            //get code from all data
                            let schoolCodes = [];
                            schoolDetails.map(schoolData=> {
                                schoolCodes.push(schoolData.externalId);
                            });
                            
                            let bodyData={
                                "code" : schoolCodes
                            };
                            // search school data with location code.
                            let entitiesData = await userProfileService.locationSearch( 
                                bodyData,   
                                "",
                                "",
                                "",
                                false,
                                false,
                                formatForSearchEntities
                            );
                        
                            if( !entitiesData.success ) {
                                return resolve({
                                    "message" : messageConstants.apiResponses.ENTITY_NOT_FOUND,
                                    "result" : [{
                                        "count":0,
                                        "data" : []
                                    }]
                                })
                            }
                            
                            let data = 
                                await entitiesHelper.observationSearchEntitiesResponse(
                                entitiesData.data,
                                result.entities
                            );

                            response["message"] = messageConstants.apiResponses.ENTITY_FETCHED;
                            response.result.push({
                                "data" : data,
                                "count" : subEntitiesCode.count
                            });
                            return resolve(response);
                            
                        } else {

                            response.result = [];
                            let subEntitiesMatchingType = [];
                            let parentId = [];
                            parentId.push(req.query.parentEntityId );
                            let subEntities = await userProfileService.getSubEntitiesBasedOnEntityType( parentId,result.entityType,subEntitiesMatchingType )
                            
                            if( !subEntities.length > 0 ) {
                                return resolve({
                                    "message" : messageConstants.apiResponses.ENTITY_NOT_FOUND,
                                    "result" : [{
                                        "count":0,
                                        "data" : []
                                    }]
                                })
                            }
                            
                            let filterData = {
                                "id" : subEntities
                            }

                            let entitiesDocument = await userProfileService.locationSearch( 
                                filterData,
                                req.pageSize,
                                req.pageNo,
                                req.searchText ? req.searchText : ""
                            );

                            subEntities = [];
                            subEntities = entitiesDocument.data;
                            if(entitiesDocument.success){
                                let entityDocument = [];
                                subEntities.map(entityData => {
                                    let data = {};
                                    data._id = entityData.id;
                                    data.name = entityData.name;
                                    data.externalId = entityData.code;
                                    entityDocument.push(data);
                                });

                                let data = await entitiesHelper.observationSearchEntitiesResponse(
                                    entityDocument,
                                    result.entities
                                )
                                
                                response["message"] = messageConstants.apiResponses.ENTITY_FETCHED;
                                response.result.push({
                                    "data" : data,
                                    "count" : entitiesDocument.count
                                });
                            }else{
                                response["message"] = messageConstants.apiResponses.ENTITY_NOT_FOUND;
                                response.result.push({
                                    "data" : [],
                                    "count" : 0
                                });
                            }
                        }       
                    }
                    
                } else {

                    let entityDocuments = await entitiesHelper.search(
                        result.entityType, 
                        req.searchText, 
                        req.pageSize, 
                        req.pageNo
                    );
    
                    let data = 
                    await entitiesHelper.observationSearchEntitiesResponse(
                        entityDocuments[0].data,
                        result.entities
                    )

                    entityDocuments[0].data = data;
    
                    if ( !(entityDocuments[0].count) ) {
                        entityDocuments[0].count = 0;
                        messageData = messageConstants.apiResponses.ENTITY_NOT_FOUND;
                    }
                    response.result = entityDocuments;
                    response["message"] = messageData;
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
     * @api {post} /assessment/api/v1/observations/assessment/:observationId?entityId=:entityId&submissionNumber=submissionNumber&ecmMethod=ecmMethod Assessments 
     * @apiVersion 2.0.0
     * @apiName Assessments
     * @apiGroup Observations
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiParam {String} entityId Entity ID.
     * @apiParam {Int} submissionNumber Submission Number.
     * @apiSampleRequest /assessment/api/v1/observations/assessment/5d286eace3cee10152de9efa?entityId=5d286b05eb569501488516c4&submissionNumber=1&ecmMethod=OB
     * @apiParamExample {json} Request:
     * {
     *  "role" : "HM,DEO",
        "state" : "236f5cff-c9af-4366-b0b6-253a1789766a",
        "district" : "1dcbc362-ec4c-4559-9081-e0c2864c2931",
        "school" : "c5726207-4f9f-4f45-91f1-3e9e8e84d824"
     }
    * @apiParamExample {json} Response:
     * {
        "evidences": [
            {
                "code": "BL",
                "sections": [
                    {
                        "code": "SQ",
                        "questions": [
                            {
                                "_id": "",
                                "question": "",
                                "options": "",
                                "children": "",
                                "questionGroup": "",
                                "fileName": "",
                                "instanceQuestions": "",
                                "deleted": "",
                                "tip": "",
                                "externalId": "",
                                "visibleIf": "",
                                "file": "",
                                "responseType": "pageQuestions",
                                "validation": "",
                                "page": "p1",
                                "showRemarks": "",
                                "isCompleted": "",
                                "remarks": "",
                                "value": "",
                                "canBeNotApplicable": "",
                                "usedForScoring": "",
                                "modeOfCollection": "",
                                "questionType": "",
                                "accessibility": "",
                                "updatedAt": "",
                                "createdAt": "",
                                "__v": "",
                                "evidenceMethod": "",
                                "payload": "",
                                "startTime": "",
                                "endTime": "",
                                "pageQuestions": [
                                    {
                                        "_id": "5be4e40e9a14ba4b5038dcfb",
                                        "question": [
                                            "Are all empty rooms and terrace areas locked securely? ",
                                            ""
                                        ],
                                        "options": [
                                            {
                                                "value": "R1",
                                                "label": "None"
                                            },
                                            {
                                                "value": "R2",
                                                "label": "Some"
                                            },
                                            {
                                                "value": "R3",
                                                "label": "Most"
                                            },
                                            {
                                                "value": "R4",
                                                "label": "All"
                                            }
                                        ],
                                        "children": [],
                                        "questionGroup": [
                                            "A1"
                                        ],
                                        "fileName": [],
                                        "instanceQuestions": [],
                                        "deleted": false,
                                        "tip": "",
                                        "externalId": "LW/SS/22",
                                        "visibleIf": "",
                                        "file": "",
                                        "responseType": "radio",
                                        "validation": {
                                            "required": true
                                        },
                                        "page": "p1",
                                        "showRemarks": false,
                                        "isCompleted": false,
                                        "remarks": "",
                                        "value": "",
                                        "canBeNotApplicable": "false",
                                        "usedForScoring": "",
                                        "modeOfCollection": "onfield",
                                        "questionType": "auto",
                                        "accessibility": "local",
                                        "updatedAt": "2018-11-09T01:34:06.839Z",
                                        "createdAt": "2018-11-09T01:34:06.839Z",
                                        "__v": 0,
                                        "evidenceMethod": "LW",
                                        "payload": {
                                            "criteriaId": "5be1616549e0121f01b2180c",
                                            "responseType": "radio",
                                            "evidenceMethod": "LW",
                                            "rubricLevel": ""
                                        },
                                        "startTime": "",
                                        "endTime": ""
                                    },
                                    {
                                        "_id": "5be445459a14ba4b5038dce8",
                                        "question": [
                                            "Is the list of important phone numbers displayed? ",
                                            ""
                                        ],
                                        "options": [
                                            {
                                                "value": "R1",
                                                "label": "Yes"
                                            },
                                            {
                                                "value": "R2",
                                                "label": "No"
                                            }
                                        ],
                                        "children": [],
                                        "questionGroup": [
                                            "A1"
                                        ],
                                        "fileName": [],
                                        "instanceQuestions": [],
                                        "deleted": false,
                                        "tip": "Look for Fire, Ambulance, Childline, Police, Child Welfare Committee, Hospital/ Doctor  ",
                                        "externalId": "LW/SS/17",
                                        "visibleIf": "",
                                        "file": {
                                            "required": true,
                                            "type": [
                                                "image/jpeg"
                                            ],
                                            "minCount": 1,
                                            "maxCount": 0,
                                            "caption": false
                                        },
                                        "responseType": "radio",
                                        "validation": {
                                            "required": true
                                        },
                                        "showRemarks": false,
                                        "isCompleted": false,
                                        "remarks": "",
                                        "value": "",
                                        "page": "p1",
                                        "canBeNotApplicable": "false",
                                        "usedForScoring": "",
                                        "modeOfCollection": "onfield",
                                        "questionType": "auto",
                                        "accessibility": "local",
                                        "updatedAt": "2018-11-08T14:16:37.565Z",
                                        "createdAt": "2018-11-08T14:16:37.565Z",
                                        "__v": 0,
                                        "evidenceMethod": "LW",
                                        "payload": {
                                            "criteriaId": "5be15e0749e0121f01b21809",
                                            "responseType": "radio",
                                            "evidenceMethod": "LW",
                                            "rubricLevel": ""
                                        },
                                        "startTime": "",
                                        "endTime": ""
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
    * @apiUse successBody
    * @apiUse errorBody
    */

    /**
    * Assessment for observation.
    * @method
    * @name assessment
    * @param {Object} req -request Data.
    * @param {String} req.params._id -observation id. 
    * @param {String} req.query.entityId - entity id.
    * @param {String} req.query.submissionNumber - submission number
    * @param {String} req.userDetails.allRoles -user roles.
    * @returns {JSON} - Observation Assessment details.
    */

    async assessment(req) {

        return new Promise(async (resolve, reject) => {

            try {
                let appVersion = req.headers["x-app-ver"] ? req.headers["x-app-ver"] : req.headers.appversion ? req.headers.appversion : "";
                let appName = req.headers["x-app-id"]  ? req.headers["x-app-id"]  : req.headers.appname ? req.headers.appname : "";
                let response = {
                    message: messageConstants.apiResponses.ASSESSMENT_FETCHED,
                    result: {}
                };

                let queryObject = {
                    _id: req.params._id, 
                    createdBy: req.userDetails.userId,
                    status: {$ne:"inactive"}, 
                    entities: req.query.entityId
                }
                let observationDocument = await observationsHelper.observationDocuments( queryObject )
                observationDocument = observationDocument[0]
                
                if (!observationDocument) {
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: messageConstants.apiResponses.OBSERVATION_NOT_FOUND
                    });
                }
                
                let filterData = {
                    "type" : observationDocument.entityType
                };
                if (gen.utils.checkIfValidUUID(req.query.entityId)) {
                    filterData.id = req.query.entityId;
                } else {
                    filterData.code = req.query.entityId;
                }
                
                let formatResult = true; 
                let returnObject = true;
                let entitiesDocument = await userProfileService.locationSearch( filterData,"","","",formatResult, returnObject );
                
                if ( !entitiesDocument.success ) {
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: messageConstants.apiResponses.ENTITY_NOT_FOUND 
                    });
                }

                let entityDocument = entitiesDocument.data;
                if (entityDocument.registryDetails && Object.keys(entityDocument.registryDetails).length > 0) {
                    entityDocument.metaInformation.registryDetails = entityDocument.registryDetails;
                }

                let entityHierarchy = await userProfileService.getParentEntities( entityDocument._id );
                entityDocument.metaInformation.hierarchy = entityHierarchy;

                const submissionNumber = req.query.submissionNumber && req.query.submissionNumber > 1 ? parseInt(req.query.submissionNumber) : 1;
                let solutionQueryObject = {
                    _id: observationDocument.solutionId,
                    status: "active",
                };

                let solutionDocumentProjectionFields = await observationsHelper.solutionDocumentProjectionFieldsForDetailsAPI()

                let solutionDocument = await database.models.solutions.findOne(
                    solutionQueryObject,
                    solutionDocumentProjectionFields
                ).lean();

                if (!solutionDocument) {
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: messageConstants.apiResponses.SOLUTION_NOT_FOUND 
                    });
                }

                
                if( req.query.ecmMethod && req.query.ecmMethod !== "" ) {
                    if(!solutionDocument.evidenceMethods[req.query.ecmMethod] ) {
                        return resolve({ 
                            status: httpStatusCode.bad_request.status, 
                            message: messageConstants.apiResponses.ECM_NOT_EXIST
                        });
                    }
                }

                let programQueryObject = {
                    _id: observationDocument.programId,
                    status: "active",
                    components: { $in: [ObjectId(observationDocument.solutionId)] }
                };

                let programDocument = await programsHelper.list(
                    programQueryObject,[
                        "externalId",
                        "name",
                        "description",
                        "imageCompression",
                        "isAPrivateProgram"
                    ]
                );

                if ( !programDocument[0]._id ) {
                    throw messageConstants.apiResponses.PROGRAM_NOT_FOUND;
                }

                //fetch programUsers data
                let programUsers = await programUsersHelper.programUsersDocuments(
                    {
                        userId : req.userDetails.userId,
                        programId : observationDocument.programId
                    },
                    [
                        "_id",
                        "resourcesStarted"
                    ]
                );

                if (!programUsers.length > 0 || ( programUsers.length > 0 && programUsers[0].resourcesStarted == false)) {
                    // join observation's program. PII data consent is given via this api call.
                    // no need to check if usr already joined the program or not it is managed in ml-core service. 
                    
                    let programJoinData = {};
                    programJoinData.userRoleInformation = req.body;
                    programJoinData.isResource = true;
                    let joinProgram = await coreService.joinProgram (
                        req.userDetails.userToken,
                        programJoinData,
                        observationDocument.programId,
                        appVersion,
                        appName
                    );
                    
                    if ( !joinProgram.success ) {
                        return resolve({ 
                            status: httpStatusCode.bad_request.status, 
                            message: messageConstants.apiResponses.PROGRAM_JOIN_FAILED
                        });
                    }
                }

                /*
                <- Currently not required for bodh-2:10 as roles is not given in user 
                */

                // let currentUserAssessmentRole = await assessmentsHelper.getUserRole(req.userDetails.allRoles);
                // let profileFieldAccessibility = (solutionDocument.roles && solutionDocument.roles[currentUserAssessmentRole] && solutionDocument.roles[currentUserAssessmentRole].acl && solutionDocument.roles[currentUserAssessmentRole].acl.entityProfile) ? solutionDocument.roles[currentUserAssessmentRole].acl.entityProfile : "";

                // let entityProfileForm = await database.models.entityTypes.findOne(
                //     solutionDocument.entityTypeId,
                //     {
                //         profileForm: 1
                //     }
                // ).lean();

                // if (!entityProfileForm) {
                //     let responseMessage = messageConstants.apiResponses.ENTITY_PROFILE_FORM_NOT_FOUND;
                //     return resolve({ 
                //         status: httpStatusCode.bad_request.status, 
                //         message: responseMessage 
                //     });
                // }

                // let form = [];
                // let entityDocumentTypes = (entityDocument.metaInformation.types) ? entityDocument.metaInformation.types : ["A1"];
                let entityDocumentQuestionGroup = (entityDocument.metaInformation.questionGroup) ? entityDocument.metaInformation.questionGroup : ["A1"];
                // let entityProfileFieldsPerEntityTypes = solutionDocument.entityProfileFieldsPerEntityTypes;
                // let filteredFieldsToBeShown = [];

                // if (entityProfileFieldsPerEntityTypes) {
                //     entityDocumentTypes.forEach(entityType => {
                //         if (entityProfileFieldsPerEntityTypes[entityType]) {
                //             filteredFieldsToBeShown.push(...entityProfileFieldsPerEntityTypes[entityType]);
                //         }
                //     })
                // }

                // entityProfileForm.profileForm.forEach(profileFormField => {
                //     if (filteredFieldsToBeShown.includes(profileFormField.field)) {
                //         profileFormField.value = (entityDocument.metaInformation[profileFormField.field]) ? entityDocument.metaInformation[profileFormField.field] : "";
                //         profileFormField.visible = profileFieldAccessibility ? (profileFieldAccessibility.visible.indexOf("all") > -1 || profileFieldAccessibility.visible.indexOf(profileFormField.field) > -1) : true;
                //         profileFormField.editable = profileFieldAccessibility ? (profileFieldAccessibility.editable.indexOf("all") > -1 || profileFieldAccessibility.editable.indexOf(profileFormField.field) > -1) : true;
                //         form.push(profileFormField);
                //     }
                // })

                response.result.entityProfile = {
                    _id: entityDocument._id,
                    entityType: entityDocument.entityType,
                    // form: form
                };


                let solutionDocumentFieldList = await observationsHelper.solutionDocumentFieldListInResponse()

                response.result.solution = await _.pick(solutionDocument, solutionDocumentFieldList);
                response.result.program = programDocument[0];

                let submissionDocument = {
                    entityId: entityDocument._id,
                    entityExternalId: (entityDocument.metaInformation.externalId) ? entityDocument.metaInformation.externalId : "",
                    entityInformation: entityDocument.metaInformation,
                    solutionId: solutionDocument._id,
                    solutionExternalId: solutionDocument.externalId,
                    programId : programDocument[0]._id,
                    programExternalId : programDocument[0].externalId,
                    isAPrivateProgram : programDocument[0].isAPrivateProgram,
                    programInformation : {
                        ..._.omit(programDocument[0], ["_id", "components","isAPrivateProgram"])
                    },
                    frameworkId: solutionDocument.frameworkId,
                    frameworkExternalId: solutionDocument.frameworkExternalId,
                    entityType: solutionDocument.entityType,
                    scoringSystem: solutionDocument.scoringSystem,
                    isRubricDriven: solutionDocument.isRubricDriven,
                    observationId: observationDocument._id,
                    observationInformation: {
                        ..._.omit(observationDocument, ["_id", "entities", "deleted", "__v"])
                    },
                    createdBy: observationDocument.createdBy,
                    evidenceSubmissions: [],
                    entityProfile: {},
                    status: "started",
                    userProfile : observationDocument.userProfile
                };

                if( solutionDocument.hasOwnProperty("criteriaLevelReport") ) {
                    submissionDocument["criteriaLevelReport"] = solutionDocument["criteriaLevelReport"];
                }
                
                //if (req.body && req.body.role) {
                    //commented for mutiple role
                    // let roleDocument = await userRolesHelper.list
                    // ( { code : req.body.role },
                    //   [ "_id"]
                    // )

                    // if (roleDocument[0]._id) {
                    //     req.body.roleId = roleDocument[0]._id; 
                    // }

                    
                //}
                if( observationDocument.userRoleInformation && Object.keys(observationDocument.userRoleInformation).length > 0 ) {
                    submissionDocument.userRoleInformation = observationDocument.userRoleInformation;
                } else if( req.body && req.body.role && !observationDocument.userRoleInformation ){
                    submissionDocument.userRoleInformation = req.body;
                    let updateObservation = await observationsHelper.updateObservationDocument
                        (
                          { _id: req.params._id },
                          {
                              $set: { userRoleInformation : req.body }
                          }
                        )
                }

                if( observationDocument.referenceFrom === messageConstants.common.PROJECT ) {
                    submissionDocument["referenceFrom"] = messageConstants.common.PROJECT;
                    submissionDocument["project"] = observationDocument.project;
                }
                
                let assessment = {};

                assessment.name = solutionDocument.name;
                assessment.description = solutionDocument.description;
                assessment.externalId = solutionDocument.externalId;
                assessment.pageHeading = solutionDocument.pageHeading;

                let criteriaId = new Array;
                let criteriaObject = {};
                let criteriaIdArray = gen.utils.getCriteriaIdsAndWeightage(solutionDocument.themes);

                criteriaIdArray.forEach(eachCriteriaId => {
                    criteriaId.push(eachCriteriaId.criteriaId);
                    criteriaObject[eachCriteriaId.criteriaId.toString()] = {
                        weightage: eachCriteriaId.weightage
                    };
                })

                let criteriaQuestionDocument = await database.models.criteriaQuestions.find(
                    { _id: { $in: criteriaId } },
                    {
                        resourceType: 0,
                        language: 0,
                        keywords: 0,
                        concepts: 0
                    }
                ).lean();

                let evidenceMethodArray = {};
                let submissionDocumentEvidences = {};
                let submissionDocumentCriterias = [];
                Object.keys(solutionDocument.evidenceMethods).forEach(solutionEcm => {
                    solutionDocument.evidenceMethods[solutionEcm].startTime = "";
                    solutionDocument.evidenceMethods[solutionEcm].endTime = "";
                    solutionDocument.evidenceMethods[solutionEcm].isSubmitted = false;
                    solutionDocument.evidenceMethods[solutionEcm].submissions = new Array;
                })
                submissionDocumentEvidences = solutionDocument.evidenceMethods;

                criteriaQuestionDocument.forEach(criteria => {

                    criteria.weightage = criteriaObject[criteria._id.toString()].weightage;

                    submissionDocumentCriterias.push(
                        _.omit(criteria, [
                            "evidences"
                        ])
                    );

                    criteria.evidences.forEach(evidenceMethod => {

                        if (evidenceMethod.code) {

                            if (!evidenceMethodArray[evidenceMethod.code]) {

                                evidenceMethod.sections.forEach(ecmSection => {
                                    ecmSection.name = solutionDocument.sections[ecmSection.code];
                                })
                                _.merge(evidenceMethod, submissionDocumentEvidences[evidenceMethod.code]);
                                evidenceMethodArray[evidenceMethod.code] = evidenceMethod;

                            } else {

                                evidenceMethod.sections.forEach(evidenceMethodSection => {

                                    let sectionExisitsInEvidenceMethod = 0;
                                    let existingSectionQuestionsArrayInEvidenceMethod = [];

                                    evidenceMethodArray[evidenceMethod.code].sections.forEach(exisitingSectionInEvidenceMethod => {

                                        if (exisitingSectionInEvidenceMethod.code == evidenceMethodSection.code) {
                                            sectionExisitsInEvidenceMethod = 1;
                                            existingSectionQuestionsArrayInEvidenceMethod = exisitingSectionInEvidenceMethod.questions;
                                        }

                                    });

                                    if (!sectionExisitsInEvidenceMethod) {
                                        evidenceMethodSection.name = solutionDocument.sections[evidenceMethodSection.code];
                                        evidenceMethodArray[evidenceMethod.code].sections.push(evidenceMethodSection);
                                    } else {
                                        evidenceMethodSection.questions.forEach(questionInEvidenceMethodSection => {
                                            existingSectionQuestionsArrayInEvidenceMethod.push(
                                                questionInEvidenceMethodSection
                                            );
                                        });
                                    }

                                });

                            }

                        }

                    });

                });

                submissionDocument.evidences = submissionDocumentEvidences;
                submissionDocument.evidencesStatus = Object.values(submissionDocumentEvidences);
                submissionDocument.criteria = submissionDocumentCriterias;
                submissionDocument.submissionNumber = submissionNumber;

                submissionDocument["appInformation"] = {};
  
                if (req.headers["x-app-id"] || req.headers.appname ) {
                    submissionDocument["appInformation"]["appName"] = 
                    req.headers["x-app-id"] ? req.headers["x-app-id"] :
                    req.headers.appname;
                } 
  
                if (req.headers["x-app-ver"] || req.headers.appversion) {
                    submissionDocument["appInformation"]["appVersion"] = 
                    req.headers["x-app-ver"] ? req.headers["x-app-ver"] :
                    req.headers.appversion;
                }

                let submissionDoc = await observationsHelper.findSubmission(
                    submissionDocument
                );

                assessment.submissionId = submissionDoc.result._id;

                if( req.query.ecmMethod && req.query.ecmMethod !== "" ) {
                    if( evidenceMethodArray[req.query.ecmMethod] ) {
                        evidenceMethodArray = {
                            [req.query.ecmMethod] : evidenceMethodArray[req.query.ecmMethod]
                        };
                    }
                }

                const parsedAssessment = await assessmentsHelper.parseQuestionsV2(
                    Object.values(evidenceMethodArray),
                    entityDocumentQuestionGroup,
                    submissionDoc.result.evidences,
                    (solutionDocument && solutionDocument.questionSequenceByEcm) ? solutionDocument.questionSequenceByEcm : false,
                    entityDocument.metaInformation
                );

                assessment.evidences = parsedAssessment.evidences;
                assessment.submissions = parsedAssessment.submissions;
                if (parsedAssessment.generalQuestions && parsedAssessment.generalQuestions.length > 0) {
                    assessment.generalQuestions = parsedAssessment.generalQuestions;
                }

                response.result.assessment = assessment;

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
     * @api {get} /assessment/api/v1/observations/complete/:observationId Mark As Completed
     * @apiVersion 1.0.0
     * @apiName Mark As Completed
     * @apiGroup Observations
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/observations/complete/:observationId
     * @apiUse successBody
     * @apiUse errorBody
     */


      /**
    * Observation mark as complete.
    * @method
    * @name complete
    * @param {Object} req -request Data.
    * @param {String} req.params._id -observation id. 
    * @returns {JSON} 
    */

    async complete(req) {

        return new Promise(async (resolve, reject) => {

            try {

                await database.models.observations.updateOne(
                    {
                        _id: ObjectId(req.params._id),
                        status: { $ne: "completed" },
                        createdBy: req.userDetails.id
                    },
                    {
                        $set: {
                            status: "completed"
                        }
                    }
                );

                return resolve({
                    message: messageConstants.apiResponses.OBSERVATION_MARKED_COMPLETE
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
     * @api {get} /assessment/api/v1/observations/importFromFramework?frameworkId:frameworkExternalId&entityType=entityType Create observation solution from framework.
     * @apiVersion 1.0.0
     * @apiName Create observation solution from framework.
     * @apiGroup Observations
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiParam {String} frameworkId Framework External ID.
     * @apiParam {String} entityType Entity Type.
     * @apiSampleRequest /assessment/api/v1/observations/importFromFramework?frameworkId=CRO-VERSION2-2019&entityType=school
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
    * Import observation from framework.
    * @method
    * @name importFromFramework
    * @param {Object} req -request Data.
    * @param {String} req.query.frameworkId -framework id.
    * @param {String} req.query.entityType - entity type name. 
    * @returns {JSON} 
    */

    async importFromFramework(req) {

        return new Promise(async (resolve, reject) => {
            try {

                if (!req.query.frameworkId || req.query.frameworkId == "" || !req.query.entityType || req.query.entityType == "") {
                    throw messageConstants.apiResponses.INVALID_PARAMETER;
                }

                let frameworkDocument = await database.models.frameworks.findOne({
                    externalId: req.query.frameworkId
                }).lean();

                if (!frameworkDocument._id) {
                    throw messageConstants.apiResponses.FRAMEWORK_NOT_FOUND;
                }

                let bodyData = { "type" : req.query.entityType };
                let entityTypeDocument = await userProfileService.locationSearch( bodyData);
                if ( !entityTypeDocument.success ) {
                    throw messageConstants.apiResponses.ENTITY_TYPES_NOT_FOUND;
                }
                
                let entityType = entityTypeDocument.data[0].type;

                let criteriasIdArray = gen.utils.getCriteriaIds(frameworkDocument.themes);

                let frameworkCriteria = await database.models.criteria.find({ _id: { $in: criteriasIdArray } }).lean();

                let solutionCriteriaToFrameworkCriteriaMap = {};

                await Promise.all(frameworkCriteria.map(async (criteria) => {
                    criteria.frameworkCriteriaId = criteria._id;

                    let newCriteriaId = await database.models.criteria.create(_.omit(criteria, ["_id"]));

                    if (newCriteriaId._id) {
                        solutionCriteriaToFrameworkCriteriaMap[criteria._id.toString()] = newCriteriaId._id;
                    }
                }))


                let updateThemes = function (themes) {
                    themes.forEach(theme => {
                        let criteriaIdArray = new Array;
                        let themeCriteriaToSet = new Array;
                        if (theme.children) {
                            updateThemes(theme.children);
                        } else {
                            criteriaIdArray = theme.criteria;
                            criteriaIdArray.forEach(eachCriteria => {
                                eachCriteria.criteriaId = solutionCriteriaToFrameworkCriteriaMap[eachCriteria.criteriaId.toString()] ? solutionCriteriaToFrameworkCriteriaMap[eachCriteria.criteriaId.toString()] : eachCriteria.criteriaId;
                                themeCriteriaToSet.push(eachCriteria);
                            })
                            theme.criteria = themeCriteriaToSet;
                        }
                    })
                    return true;
                }

                let newSolutionDocument = _.cloneDeep(frameworkDocument);

                updateThemes(newSolutionDocument.themes);

                newSolutionDocument.type = "observation";
                newSolutionDocument.subType = (frameworkDocument.subType && frameworkDocument.subType != "") ? frameworkDocument.subType : entityType;

                newSolutionDocument.externalId = 
                frameworkDocument.externalId + "-OBSERVATION-TEMPLATE";

                newSolutionDocument.frameworkId = frameworkDocument._id;
                newSolutionDocument.frameworkExternalId = frameworkDocument.externalId;

                newSolutionDocument.entityType = entityType;
                newSolutionDocument.isReusable = true;

                let newBaseSolution = 
                await database.models.solutions.create(
                    _.omit(
                        newSolutionDocument, 
                        ["_id"]
                    )
                );

                if (newBaseSolution._id) {

                    let result = {
                        templateId : newBaseSolution._id
                    };

                    let response = {
                        message : messageConstants.apiResponses.OBSERVATION_SOLUTION,
                        result : result
                    };

                    return resolve(response);

                } else {
                    throw messageConstants.apiResponses.ERROR_CREATING_OBSERVATION;
                }

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
    * @api {post} /assessment/api/v1/observations/update/:observationId Update Observation Details
    * @apiVersion 1.0.0
    * @apiName Update Observation Details
    * @apiGroup Observations
    * @apiSampleRequest /assessment/api/v1/observations/update/5cd955487e100b4dded3ebb3
    * @apiUse successBody
    * @apiUse errorBody
    */

    /**
    * Update observations.
    * @method
    * @name update
    * @param {Object} req -request Data.
    * @param {String} req.body.name -name of the observation to update.
    * @param {String} req.body.description -description of the observation to update.   
    * @returns {JSON} message  
    */

    async update(req) {
        return new Promise(async (resolve, reject) => {

            try {

                let updateQuery = {};
                updateQuery["$set"] = {};

                if (req.body.name) {
                    updateQuery["$set"]["name"] = req.body.name;
                }

                if (req.body.description) {
                    updateQuery["$set"]["description"] = req.body.description;
                }

                let observationDocument = await database.models.observations.findOneAndUpdate(
                    {
                        _id: req.params._id,
                        createdBy: req.userDetails.userId,
                        status: { $ne: "inactive" }
                    },
                    updateQuery
                ).lean();

                if (!observationDocument) {
                    throw messageConstants.apiResponses.OBSERVATION_NOT_FOUND;
                }

                return resolve({
                    message: messageConstants.apiResponses.OBSERVATION_UPDATED,
                });

            } catch (error) {

                return reject({
                    status: error.status || httpStatusCode.internal_server_error.status,
                    message: error.message || httpStatusCode.internal_server_error.message
                });

            }


        })
    }

    /**
     * @api {get} /assessment/api/v1/observations/delete/:observationId Delete an Observation
     * @apiVersion 1.0.0
     * @apiName Delete an Observation
     * @apiGroup Observations
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/observations/delete/:observationId
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
    * Delete observations.
    * @method
    * @name delete
    * @param {Object} req -request Data.
    * @param {String} req.params._id -observation id.  
    * @returns {JSON} message   
    */

    async delete(req) {

        return new Promise(async (resolve, reject) => {

            try {

                await database.models.observations.updateOne(
                    {
                        _id: ObjectId(req.params._id),
                        createdBy: req.userDetails.id
                    },
                    {
                        $set: {
                            status: "inactive"
                        }
                    }
                );

                return resolve({
                    message: messageConstants.apiResponses.OBSERVATION_DELETED
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
     * @api {get} /assessment/api/v1/observations/pendingObservations Pending Observations
     * @apiVersion 1.0.0
     * @apiName Pending Observations
     * @apiGroup Observations
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/observations/pendingObservations
     * @apiUse successBody
     * @apiUse errorBody
     * @apiParamExample {json} Response:
        {
            "message": "Pending Observations",
            "status": 200,
            "result": [
                {
                    "_id": "5d31a14dbff58d3d65ede344",
                    "userId": "e97b5582-471c-4649-8401-3cc4249359bb",
                    "solutionId": "5c6bd309af0065f0e0d4223b",
                    "createdAt": "2019-07-19T10:54:05.638Z",
                    "entityId": "5cebbefe5943912f56cf8e16",
                    "observationId": "5d1070326f6ed50bc34aec2c"
                }
            ]
        }
    */

      /**
    * Observations status not equal to completed.
    * @method
    * @name pendingObservations 
    * @returns {JSON} List of pending observations.   
    */

    async pendingObservations() {
        return new Promise(async (resolve, reject) => {
            try {


                let pendingObservationDocuments = 
                await observationsHelper.pendingObservations();

                return resolve({
                    message: messageConstants.apiResponses.PENDING_OBSERVATION,
                    result: pendingObservationDocuments
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
    * @api {get} /assessment/api/v1/observations/completedObservations Completed Observations
    * @apiVersion 1.0.0
    * @apiName Completed Observations
    * @apiGroup Observations
    * @apiParam {String} fromDate From Date
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/observations/completedObservations
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
        {
            "message": "Completed Observations",
            "status": 200,
            "result": [
                {
                    "_id": "5d2702e60110594953c1614a",
                    "userId": "e97b5582-471c-4649-8401-3cc4249359bb",
                    "solutionId": "5c6bd309af0065f0e0d4223b",
                    "createdAt": "2019-06-27T08:55:16.718Z",
                    "entityId": "5cebbefe5943912f56cf8e16",
                    "observationId": "5d1483c9869c433b0440c5dd"
                }
            ]
        }
    */

     /**
    * Completed Observations.
    * @method
    * @name completedObservations 
    * @returns {JSON} List of completed observations.   
    */

    async completedObservations(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let completedObservationDocuments = 
                await observationsHelper.completedObservations(
                    req.query.fromDate,
                    req.query.toDate
                );

                return resolve({
                    message: messageConstants.apiResponses.COMPLETED_OBSERVATION,
                    result: completedObservationDocuments
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
* @api {get} /assessment/api/v1/observations/details/:observationId?solutionId=600ac0d1c7de076e6f9943b9
* Observations details.
* @apiVersion 1.0.0
* @apiGroup Observations
* @apiHeader {String} X-authenticated-user-token Authenticity token
* @apiSampleRequest /assessment/api/v1/observations/details/5de8a220c210d4700813e695?solutionId=600ac0d1c7de076e6f9943b9
* @apiUse successBody
* @apiUse errorBody
* @apiParamExample {json} Response:
{
    "message": "Observation details fetched successfully",
    "status": 200,
    "result": {
        "_id": "5d282bbcc1e91c71b6c025ee",
        "entities": [
            {
                "_id": "5d5bacc27b68e809c81f4994",
                "deleted": false,
                "entityTypeId": "5d28233dd772d270e55b4072",
                "entityType": "school",
                "metaInformation": {
                    "externalId": "1355120",
                    "districtId": "",
                    "districtName": "",
                    "zoneId": "NARELA",
                    "name": "SHAHBAD DAIRY C-I",
                    "types": [
                        "A1"
                    ],
                    "addressLine1": "",
                    "city": "New Delhi",
                    "pincode": "",
                    "state": "New Delhi",
                    "country": "India"
                },
                "updatedBy": "7996ada6-4d46-4e77-b350-390dee883892",
                "createdBy": "7996ada6-4d46-4e77-b350-390dee883892",
                "updatedAt": "2019-08-20T08:18:10.985Z",
                "createdAt": "2019-08-20T08:18:10.985Z",
                "__v": 0
            }
        ],
        "deleted": false,
        "name": "CRO-2019 By",
        "description": "CRO-2019m",
        "status": "inactive",
        "solutionId": "5d282bbcc1e91c71b6c025e6",
        "solutionExternalId": "CRO-2019-TEMPLATE",
        "frameworkId": "5d28233fd772d270e55b4199",
        "frameworkExternalId": "CRO-2019",
        "entityTypeId": "5d28233dd772d270e55b4072",
        "entityType": "school",
        "createdBy": "6e24b29b-8b81-4b70-b1b5-fa430488b1cf",
        "updatedAt": "2019-10-16T06:34:54.224Z",
        "createdAt": "2019-07-01T14:05:11.706Z",
        "startDate": "2018-07-12T06:05:50.963Z",
        "endDate": "2020-07-12T06:05:50.963Z",
        "__v": 0,
        "count": 11
    }
}
*/
      /**
      *  Observation details.
      * @method
      * @name details
      * @param  {Request} req request body.
      * @returns {JSON} Response consists of message,status and result.
      * Result will have the details of the observations including entities details.
     */

      /**
    * Observation details.
    * @method
    * @name details 
    * @param {Object} req request data
    * @param {String} req.params._id observation id. 
    * @returns {JSON} List of completed observations.   
    */

    async details(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let observationDetails = await observationsHelper.details(
                    req.params._id ? req.params._id : "",
                    req.query.solutionId ? req.query.solutionId : "",
                    req.userDetails.userId
                );

                return resolve({
                    message: messageConstants.apiResponses.OBSERVATION_FETCHED,
                    result: observationDetails
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
  * @api {get} /assessment/api/v1/observations/submissionStatus/:observationId?entityId=:entityId
  * @apiVersion 1.0.0
  * @apiName Get Observation Submission Status
  * @apiGroup Observations
  * @apiSampleRequest /assessment/api/v1/observations/submissionStatus/5d1a002d2dfd8135bc8e1617?entityId=5cee7d1390013936552f6a8f
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
    "message": "Successfully fetched observation submissions",
    "status": 200,
    "result": [
        {
            "_id": "5cee8c5390013936552f6a92",
            "status": "started",
            "submissionNumber": 1
        }
    ]
 }

  */
   /**
   * Get observation submission status
   * @method
   * @name submissionStatus
   * @param {Object} req - requested data.
   * @param {String} req.params._id - observation submission id. 
   * @returns {JSON} consists of status of the observation submission.
   */

  async submissionStatus(req) {
    return new Promise(async (resolve, reject) => {
      try {
        
        let submissionDocument =
         await observationsHelper.submissionStatus
          (
            req.params._id,
            req.query.entityId,
            req.userDetails.userId
          );

        submissionDocument.result = submissionDocument.data;

        return resolve(submissionDocument);

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
    * @api {post} /assessment/api/v1/observations/getObservation?page=:page&limit=:limit&search=:search
    * List of observations and targetted ones.
    * @apiVersion 1.0.0
    * @apiGroup Observations
    * @apiSampleRequest /assessment/api/v1/observations/getObservation?page=1&limit=10&search=a
    * @apiParamExample {json} Request:
    * {
    *   "role" : "HM,DEO",
   		"state" : "236f5cff-c9af-4366-b0b6-253a1789766a",
        "district" : "1dcbc362-ec4c-4559-9081-e0c2864c2931",
        "school" : "c5726207-4f9f-4f45-91f1-3e9e8e84d824"
    }
    * @apiParamExample {json} Response:
    {
    "message": "Targeted observations fetched successfully",
    "status": 200,
    "result": {
        "data": [
            {
                "_id": "5f9288fd5e25636ce6dcad66",
                "name": "obs1",
                "description": "observation1",
                "solutionId": "5f9288fd5e25636ce6dcad65",
                "programId": "5d287326652f311044f41dbb"
            },
            {
                "_id": "5fc7aa9e73434430731f6a10",
                "solutionId": "5fb4fce4c7439a3412ff013b",
                "programId": "5f5b216a9c70bd2973aee29f",
                "name": "My Solution",
                "description": "My Solution Description"
            }
        ],
        "count": 2
    }
}
    * @apiUse successBody
    * @apiUse errorBody
    */

    /**
      * List of observations and targetted ones.
      * @method
      * @name getObservation
      * @param {Object} req - request data.
      * @returns {JSON} List of observations with targetted ones.
     */

     async getObservation(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let observations = await observationsHelper.getObservation(
                    req.body,
                    req.userDetails.userId,
                    req.userDetails.userToken,
                    req.pageSize,
                    req.pageNo,
                    req.searchText
                );

                observations["result"] = observations.data;

                return resolve(observations);

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
    * @api {get} /assessment/api/v1/observations/userAssigned?page=:page&limit=:limit&search=:search&filter=:filter
    * List of user assigned observations.
    * @apiVersion 1.0.0
    * @apiGroup Observations
    * @apiSampleRequest /assessment/api/v1/observations/userAssigned?page=1&limit=10&search=a&filter=assignedToMe
    * @apiParamExample {json} Response:
    {
    "message": "List of user assigned observations",
    "status": 200,
    "result": {
        "data": [
            {
                "_id": "5f9288fd5e25636ce6dcad66",
                "name": "obs1",
                "description": "observation1",
                "solutionId": "5f9288fd5e25636ce6dcad65",
                "programId": "5d287326652f311044f41dbb"
            },
            {
                "_id": "5fc7aa9e73434430731f6a10",
                "solutionId": "5fb4fce4c7439a3412ff013b",
                "programId": "5f5b216a9c70bd2973aee29f",
                "name": "My Solution",
                "description": "My Solution Description"
            }
        ],
        "count": 2
    }
}
    * @apiUse successBody
    * @apiUse errorBody
    */

    /**
      * List of user assigned observations.
      * @name userAssigned
      * @param {Object} req - request data.
      * @returns {JSON} List of observations with targetted ones.
     */

    async userAssigned(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let observations = await observationsHelper.userAssigned(
                    req.userDetails.userId,
                    req.pageNo,
                    req.pageSize,
                    req.searchText,
                    req.query.filter
                );

                observations["result"] = observations.data;

                return resolve(observations);

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
    * @api {post} /assessment/api/v1/observations/entities/:observationId?solutionId=:solutionId
    * List of observations entities.
    * @apiVersion 1.0.0
    * @apiGroup Observations
    * @apiSampleRequest /assessment/api/v1/observations/entities?solutionId=5fec29afd1d6d98686a07156
    * @apiParamExample {json} Request:
    * {
    *   "role" : "HM,DEO",
   		"state" : "236f5cff-c9af-4366-b0b6-253a1789766a",
        "district" : "1dcbc362-ec4c-4559-9081-e0c2864c2931",
        "school" : "c5726207-4f9f-4f45-91f1-3e9e8e84d824"
    }
    * @apiParamExample {json} Response:
    {
    "message": "Observation entities fetched successfully",
    "status": 200,
    "result": {
        "_id": "60004c685c1630103719a1ea",
        "entities": [
            {
                "_id": "5db1dd3e8a8e070bedca6c44",
                "externalId": "1514114",
                "name": "PROFESSORS GLOBAL SCHOOL, Kh No.46/11 Baprola Village, Delhi",
                "submissionsCount": 0
            }
        ]
    }}
    * @apiUse successBody
    * @apiUse errorBody
    */

    /**
      * List of entities in observation.
      * @method
      * @name entities
      * @param {Object} req - request data.
      * @returns {JSON} List of entities in observation.
     */

    async entities(req) {
        return new Promise(async (resolve, reject) => {
            try {

                let observations = await observationsHelper.entities(
                    req.userDetails.userId,
                    req.userDetails.userToken,
                    req.params._id ? req.params._id : "",
                    req.query.solutionId, 
                    req.body
                );

                observations["result"] = observations.data;

                return resolve(observations);

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
   