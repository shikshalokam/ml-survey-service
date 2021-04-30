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
     * @api {get} /assessment/api/v2/observations/searchEntities?solutionId=:solutionId&search=:searchText&limit=1&page=1&parentEntityId=:parentEntityId Search Entities based on observationId or solutionId
     * @apiVersion 2.0.0
     * @apiName Search Entities
     * @apiGroup Observations
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/observations/searchEntities?observationId=5d4bdcab44277a08145d7258&search=a&limit=10&page=1&parentEntityId=5beaa888af0065f0e0a10515
     * @apiParamExample {json} Response:
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
            "count": 1
        }
    ]
     * @apiUse successBody
     * @apiUse errorBody
     */

       /**
    * Search entities in observation.
    * @method
    * @name searchEntities
    * @param {Object} req -request Data.
    * @param {String} req.query.observationId -observation id. 
    * @returns {JSON} List of entities in observations.
    */

    async searchEntities(req) {

        return new Promise(async (resolve, reject) => {

            try {

                let response = {
                    result: {}
                };

                let userId = req.userDetails.userId;
                let result;

                let projection = [];

                if ( req.query.observationId ) {
                    let findObject = {};
                    findObject[entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_OBJECT_ID] = req.query.observationId;
                    findObject[entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_CREATED_BY] = userId;

                    projection.push(
                        entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_TYPE_ID, 
                        entitiesHelper.entitiesSchemaData().SCHEMA_ENTITIES, 
                        entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_TYPE
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
                        entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_TYPE_ID, 
                        entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_TYPE
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

                    let entityType = entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_GROUP+"."+result.entityType;

                    let entitiesData = await entitiesHelper.entityDocuments({
                        _id:req.query.parentEntityId
                      }, [
                        entityType,
                        "entityType",
                        "metaInformation.name",
                        "metaInformation.addressLine1",
                        "metaInformation.addressLine2",
                        "metaInformation.externalId",
                        "metaInformation.districtName"
                      ]);

                    if( entitiesData.length > 0 && entitiesData[0].groups && entitiesData[0].groups[result.entityType]  ) {
                        userAllowedEntities = 
                        entitiesData[0][entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_GROUP][result.entityType];
                    } else {

                        response.result = [];
                        if( entitiesData[0] && entitiesData[0].entityType === result.entityType ) {

                            if( entitiesData[0].metaInformation ) {
                                
                                if( entitiesData[0].metaInformation.name ) {
                                    entitiesData[0]["name"] = entitiesData[0].metaInformation.name;
                                }

                                if( entitiesData[0].metaInformation.externalId ) {
                                    entitiesData[0]["externalId"] = entitiesData[0].metaInformation.externalId;
                                }

                                if( entitiesData[0].metaInformation.addressLine1 ) {
                                    entitiesData[0]["addressLine1"] = entitiesData[0].metaInformation.addressLine1;
                                }

                                if( entitiesData[0].metaInformation.addressLine2 ) {
                                    entitiesData[0]["addressLine2"] = entitiesData[0].metaInformation.addressLine2;
                                }

                                if( entitiesData[0].metaInformation.districtName ) {
                                    entitiesData[0]["districtName"] = entitiesData[0].metaInformation.districtName;
                                }

                                entitiesData[0] = _.pick(
                                    entitiesData[0],
                                    ["_id","name","externalId","addressLine1","addressLine2","districtName"]
                                )
                            }

                            let data = 
                            await entitiesHelper.observationSearchEntitiesResponse(
                                entitiesData,
                                result.entities
                            );

                            response["message"] = messageData;

                            response.result.push({
                                "count" : 1,
                                "data" : data
                            });

                        } else {
                            response["message"] = 
                            messageConstants.apiResponses.ENTITY_NOT_FOUND;
                            
                            response.result.push({
                                "count":0,
                                "data" : []
                            });
                        }  

                        return resolve(response);
                    }
                }

                let userAclInformation = await userExtensionHelper.userAccessControlList(
                    userId
                );

                let tags = [];
                
                if( 
                    userAclInformation.success && 
                    Object.keys(userAclInformation.acl).length > 0 
                ) {
                    Object.values(userAclInformation.acl).forEach(acl=>{
                        tags = tags.concat(acl);
                    })
                }

                let entityDocuments = await entitiesHelper.search(
                    result.entityTypeId, 
                    req.searchText, 
                    req.pageSize, 
                    req.pageNo, 
                    
                    userAllowedEntities && userAllowedEntities.length > 0 ? 
                    userAllowedEntities : 
                    false,
                    tags
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
     * @api {post} /assessment/api/v2/observations/assessment/:observationId?entityId=:entityId&submissionNumber=submissionNumber Assessments
     * @apiVersion 2.0.0
     * @apiName Assessments
     * @apiGroup Observations
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiParam {String} entityId Entity ID.
     * @apiParam {Int} submissionNumber Submission Number.
     * @apiSampleRequest /assessment/api/v2/observations/assessment/5d286eace3cee10152de9efa?entityId=5d286b05eb569501488516c4&submissionNumber=1
     * @apiParamExample {json} Request:
     * {
     *  "role" : "HM",
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

                let response = {
                    message: messageConstants.apiResponses.ASSESSMENT_FETCHED,
                    result: {}
                };

                let observationDocument = await database.models.observations.findOne({ _id: req.params._id, createdBy: req.userDetails.userId, status: {$ne:"inactive"},entities: ObjectId(req.query.entityId) }).lean();

                if (!observationDocument) {
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: messageConstants.apiResponses.OBSERVATION_NOT_FOUND
                    });
                }

                let entityQueryObject = { _id: req.query.entityId, entityType: observationDocument.entityType };
                let entityDocument = await database.models.entities.findOne(
                    entityQueryObject,
                    {
                        metaInformation: 1,
                        entityTypeId: 1,
                        entityType: 1,
                        registryDetails: 1
                    }
                ).lean();

                if (!entityDocument) {
                    let responseMessage = messageConstants.apiResponses.ENTITY_NOT_FOUND;
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: responseMessage 
                    });
                }

                if (entityDocument.registryDetails && Object.keys(entityDocument.registryDetails).length > 0) {
                    entityDocument.metaInformation.registryDetails = entityDocument.registryDetails;
                }

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
                    let responseMessage = messageConstants.apiResponses.SOLUTION_NOT_FOUND;
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: responseMessage 
                    });
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
                    entityTypeId: entityDocument.entityTypeId,
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
                    entityTypeId: solutionDocument.entityTypeId,
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
                    status: "started"
                };

                if( solutionDocument.hasOwnProperty("criteriaLevelReport") ) {
                    submissionDocument["criteriaLevelReport"] = solutionDocument["criteriaLevelReport"];
                }

                if (req.body && req.body.role) {
                    
                    let roleDocument = await userRolesHelper.list
                    ( { code : req.body.role },
                      [ "_id"]
                    )

                    if (roleDocument[0]._id) {
                        req.body.roleId = roleDocument[0]._id; 
                    }

                    submissionDocument.userRoleInformation = req.body;
                }

                 if( solutionDocument.referenceFrom === messageConstants.common.PROJECT ) {
        submissionDocument["referenceFrom"] = messageConstants.common.PROJECT;
        submissionDocument["project"] = solutionDocument.project;
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
                        concepts: 0,
                        createdFor: 0
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

                let submissionDoc = await observationsHelper.findSubmission(
                    submissionDocument
                );

                assessment.submissionId = submissionDoc.result._id;

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
              req.userDetails.userToken 
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

