/**
 * name : entityAssessors/helper.js
 * author : Akash
 * created-date : 22-Nov-2018
 * Description : All Entity Assessors helper functionality.
 */

//Dependencies
const moment = require("moment");
let shikshalokam = require(ROOT_PATH + "/generics/helpers/shikshalokam");
const slackClient = require(ROOT_PATH + "/generics/helpers/slackCommunications");
const kafkaClient = require(ROOT_PATH + "/generics/helpers/kafkaCommunications");
const chunkOfSubmissionsLength = 500;
const kendraService = require(ROOT_PATH + "/generics/services/kendra");
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const programsHelper = require(MODULES_BASE_PATH + "/programs/helper");
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");


/**
    * EntityAssessorHelper
    * @class
*/
module.exports = class EntityAssessorHelper {

     /**
   * List entity assessors data.
   * @method
   * @name assessorsDocument
   * @param {Object} [findQuery = "all"] - filtered data
   * @param {Array} [fields = "all"] - projected field.
   * @param {Array} [skipFields = "none"] - projected field.
   * @returns {Array} - List of entity assessors data.
   */

    static assessorsDocument(findQuery = "all", fields = "all",skipFields = "none") {
        return new Promise(async (resolve, reject) => {
            
            try {
                
                let queryObject = {};
                
                if (findQuery != "all") {
                    
                    queryObject = findQuery;
                }

                let projection = {};
                
                if (fields != "all") {
                    
                    fields.forEach(element => {
                        projection[element] = 1;
                    });
                }

                if (skipFields != "none") {
                    skipFields.forEach(element => {
                        projection[element] = 0;
                    });
                }
                
                let assessorsData = 
                await database.models.entityAssessors.find(queryObject, projection).lean();
                
                return resolve(assessorsData);
            
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
     * Get track of entity assessor.
     * @method
     * @name uploadEntityAssessorTracker
     * @param {Object} entityAssessor - entityAssessor data.
     * @returns {Object} Uploaded entity assessor tracker data.
     */

    // <- Dirty fix. Not in use.

    // static uploadEntityAssessorTracker(entityAssessor) {
    //     return new Promise(async (resolve, reject) => {
    //         try {

    //             let entityAssessorsTrackersDocument = await database.models.entityAssessorsTrackers.find({ "assessorUserId": entityAssessor.assessorId, "programId": entityAssessor.programId }).sort({ "dateOfOperation": -1 }).limit(1).lean();

    //             if (!entityAssessorsTrackersDocument.length) {
    //                 return resolve();
    //             }

    //             let actions = ["APPEND", "OVERRIDE", "REMOVE"];

    //             if (entityAssessor.entities.length) {
    //                 entityAssessor.entities = entityAssessor.entities.map(entity => entity.toString());
    //             }

    //             let trackerObject = {};

    //             entityAssessorsTrackersDocument = entityAssessorsTrackersDocument[0];

    //             let updatedData = entityAssessorsTrackersDocument.updatedData;

    //             if (actions.includes(entityAssessor.action)) {

    //                 trackerObject.action = entityAssessor.action;

    //                 if (entityAssessor.action == "APPEND") {

    //                     entityAssessor.entities.forEach(entity => {
    //                         if (!updatedData.includes(entity)) {
    //                             updatedData.push(entity);
    //                         }
    //                     })

    //                 } else if (entityAssessor.action == "OVERRIDE") {

    //                     updatedData = entityAssessor.entities;

    //                 } else if (entityAssessor.action == "REMOVE") {

    //                     _.pullAll(updatedData, entityAssessor.entities);

    //                 }

    //             } else {

    //                 throw { 
    //                     status: httpStatusCode.bad_request.status, 
    //                     message: messageConstants.apiResponses.WRONG_ACTION
    //                 };

    //             }

    //             trackerObject.updatedData = updatedData;

    //             trackerObject.actionObject = entityAssessor.entities;

    //             trackerObject.assessorId = entityAssessorsTrackersDocument.assessorId;

    //             trackerObject.programId = entityAssessor.programId;

    //             trackerObject.solutionId = entityAssessor.solutionId;

    //             trackerObject.entityType = entityAssessor.entityType;

    //             trackerObject.entityTypeId = entityAssessor.entityTypeId;

    //             trackerObject.dateOfOperation = new Date;

    //             trackerObject.validFrom = moment().startOf('day');

    //             //hard coded long range value to reduce query

    //             let date = new Date();

    //             trackerObject.validTo = date.setFullYear(2100);

    //             trackerObject.createdBy = entityAssessor.assessorId;

    //             let queryObject = {};

    //             queryObject.assessorId = entityAssessorsTrackersDocument.assessorId;

    //             queryObject.programId = entityAssessor.programId;

    //             queryObject.dateOfOperation = {};

    //             queryObject.dateOfOperation["$gte"] = moment().startOf('day');

    //             queryObject.dateOfOperation["$lte"] = moment().endOf('day');

    //             let trackerDocument = await database.models.entityAssessorsTrackers.findOneAndUpdate(queryObject, trackerObject, {
    //                 upsert: true,
    //                 new: true,
    //                 setDefaultsOnInsert: true,
    //                 returnNewDocument: true
    //             });

    //             let lastDataDate = moment(entityAssessorsTrackersDocument.dateOfOperation).format("DD-MM-YYYY");
    //             let todayDate = moment().format("DD-MM-YYYY");

    //             if (lastDataDate != todayDate) {

    //                 let queryObject = {
    //                     assessorId: entityAssessorsTrackersDocument.assessorId,
    //                     programId: entityAssessorsTrackersDocument.programId,
    //                     dateOfOperation: entityAssessorsTrackersDocument.dateOfOperation
    //                 };

    //                 entityAssessorsTrackersDocument.validTo = moment().endOf('day').subtract(1, 'days');

    //                 delete entityAssessorsTrackersDocument.createdAt;
    //                 delete entityAssessorsTrackersDocument._id;

    //                 await database.models.entityAssessorsTrackers.findOneAndUpdate(queryObject, entityAssessorsTrackersDocument, {
    //                     upsert: true,
    //                     new: true,
    //                     setDefaultsOnInsert: true,
    //                     returnNewDocument: true
    //                 });

    //             }

    //             return resolve({ result: trackerDocument });

    //         } catch (error) {
    //             return reject({
    //                 status: error.status || httpStatusCode.internal_server_error.status,
    //                 message: error.message || httpStatusCode.internal_server_error.message,
    //                 errorObject: error
    //             });
    //         }
    //     })
    // }

    /**
     * Entity Assessors upload helper function.
     * @method
     * @name upload
     * @param {Array} assessorData - assessor data array.
     * @param {String} programId - program id.
     * @param {String} solutionId - solution id. 
     * @param {String} userId - Logged in user id.
     * @param {String} token - Logged in user token.
     */

    static upload(assessorData, programId, solutionId, userId, token) {
        return new Promise(async (resolve, reject) => {
            try {

                let entityIds = [];
                let programIds = [];
                let solutionIds = [];
                let userExternalIds = [];

                assessorData.forEach(assessor => {
                    assessor.entities.split(",").forEach(entityAssessor => {
                        if (entityAssessor)
                            entityIds.push(entityAssessor.trim())
                    })

                    programIds.push(programId ? programId : assessor.programId);

                    solutionIds.push(solutionId ? solutionId : assessor.solutionId);

                    if (!assessor["keycloak-userId"]) {
                        if (!userExternalIds.includes(assessor.externalId)) {
                            userExternalIds.push(assessor.externalId);
                        }
                    }

                    if (!assessor["keycloak-parentId"]) {
                        if (assessor.parentId && assessor.parentId !== "" && !userExternalIds.includes(assessor.parentId)) {
                            userExternalIds.push(assessor.parentId);
                        }
                    }

                });

                let programsFromDatabase = await database.models.programs.find({
                    externalId: { $in: programIds }
                }, { externalId: 1, name: 1 }).lean();

                let solutionsFromDatabase = await database.models.solutions.find({
                    externalId: { $in: solutionIds }
                }, { externalId: 1, entityType: 1, entityTypeId: 1, entities: 1, name: 1, type: 1, subType: 1 }).lean();

                let entitiesBySolution = _.flattenDeep(solutionsFromDatabase.map(solution => solution.entities));

                let entityFromDatabase = await database.models.entities.aggregate([
                    {
                        $match: { _id: { $in: entitiesBySolution } }
                    },
                    {
                        $project: {
                            externalId: "$metaInformation.externalId",
                            name: "$metaInformation.name"
                        }
                    }
                ]);

                let entityDataByExternalId = _.keyBy(entityFromDatabase, "externalId");

                let userIdByExternalId;

                if (userExternalIds.length > 0) {
                    userIdByExternalId = await this.getInternalUserIdByExternalId(token, userExternalIds);
                }

                let programsData = programsFromDatabase.reduce(
                    (ac, program) => ({
                        ...ac, [program.externalId]: {
                            programId: program._id,
                            name: program.name
                        }
                    }), {});

                let solutionData = solutionsFromDatabase.reduce(
                    (ac, solution) => ({
                        ...ac, [solution.externalId]: {
                            solutionId: solution._id,
                            entityType: solution.entityType,
                            entityTypeId: solution.entityTypeId,
                            name: solution.name,
                            type: solution.type,
                            subType: solution.subType,
                        }
                    }), {});

                assessorData = await Promise.all(assessorData.map(async (assessor) => {

                    if (assessor["keycloak-userId"] && assessor["keycloak-userId"] !== "") {
                        assessor["userId"] = assessor["keycloak-userId"];
                    } else {

                        if (userIdByExternalId[assessor.externalId] === "") {
                            throw { status: 400, message: "Keycloak id for user is not present" };
                        }

                        assessor["userId"] = userIdByExternalId[assessor.externalId];
                    }


                    if (assessor["keycloak-parentId"] && assessor["keycloak-parentId"] !== "") {
                        assessor["parentId"] = assessor["keycloak-parentId"];
                    } else {
                        if (assessor.parentId && assessor.parentId !== "") {

                            if (userIdByExternalId[assessor.parentId] === "") {
                                throw { status: 400, message: "Keycloak id for parent is not present" };
                            }

                            assessor["parentId"] = userIdByExternalId[assessor.parentId];
                        }
                    }


                    let assessorEntityArray = new Array;
                    let assessorPushNotificationArray = new Array;

                    assessor.programName = programsData[assessor.programId].name;
                    assessor.programId = programsData[assessor.programId].programId;
                    assessor.createdBy = assessor.updatedBy = userId;
                    assessor.entityType = solutionData[assessor.solutionId].entityType;
                    assessor.entityTypeId = solutionData[assessor.solutionId].entityTypeId;
                    assessor.solutionName = solutionData[assessor.solutionId].name;
                    assessor.solutionType = solutionData[assessor.solutionId].type;
                    assessor.solutionSubType = solutionData[assessor.solutionId].subType;
                    assessor.solutionId = solutionData[assessor.solutionId].solutionId;

                    assessor.entities.split(",").forEach(assessorEntity => {
                        assessorEntity = entityDataByExternalId[assessorEntity.trim()];
                        if (assessorEntity && assessorEntity._id) {
                            assessorEntityArray.push(assessorEntity._id);
                            assessorPushNotificationArray.push({
                                entityId: assessorEntity._id,
                                entityType: assessor.entityType,
                                entityName: assessorEntity.name,
                                programId: assessor.programId,
                                programName: assessor.programName,
                                solutionId: assessor.solutionId,
                                solutionType: assessor.solutionType,
                                solutionSubType: assessor.solutionSubType,
                                solutionName: assessor.solutionName
                            });
                        }
                    })

                    assessor.entities = assessorEntityArray;

                    let fieldsWithOutEntity = {};

                    Object.keys(database.models.entityAssessors.schema.paths).forEach(fieldName => {
                        if (fieldName != 'entities' && assessor[fieldName]) {
                            fieldsWithOutEntity[fieldName] = assessor[fieldName];
                        }
                    })

                    let updateObject;
                    let sendPushNotificationToAssessor = false;

                    if (assessor.entityOperation == "OVERRIDE") {
                        updateObject = { $set: { entities: assessor.entities, ...fieldsWithOutEntity } };
                        sendPushNotificationToAssessor = true;
                    }

                    else if (assessor.entityOperation == "APPEND") {
                        updateObject = { $addToSet: { entities: assessor.entities }, $set: fieldsWithOutEntity };
                        sendPushNotificationToAssessor = true;
                    }

                    else if (assessor.entityOperation == "REMOVE") {
                        updateObject = { $pull: { entities: { $in: assessor.entities } }, $set: fieldsWithOutEntity };
                    }

                    await database.models.entityAssessors.findOneAndUpdate({ userId: assessor.userId, programId: assessor.programId, solutionId: fieldsWithOutEntity["solutionId"] }, updateObject,
                        {
                            upsert: true,
                            new: true,
                            setDefaultsOnInsert: true,
                            returnNewDocument: true
                        });
                    
                    // <- Dirty fix. Entity assessor tracker not required at the moment.

                    // let entityAssessorDocument = {
                    //     "action": assessor.entityOperation,
                    //     "entities": updatedEntityAssessorDocument.entities,
                    //     "assessorId": assessor.userId,
                    //     "programId": assessor.programId,
                    //     "solutionId": assessor.solutionId,
                    //     "entityType": assessor.entityType,
                    //     "entityTypeId": assessor.entityTypeId,
                    // };

                    // await this.uploadEntityAssessorTracker(entityAssessorDocument);

                    if (sendPushNotificationToAssessor && assessorPushNotificationArray.length > 0) {
                        await this.sendUserNotifications(assessor.userId, assessorPushNotificationArray);
                    }

                })).catch(error => {
                    return reject({
                        status: error.status || httpStatusCode.internal_server_error.status,
                        message: error.message || httpStatusCode.internal_server_error.message,
                        errorObject: error
                    });
                });

                return resolve();

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
     * Get user id from external id.
     * @method
     * @name getInternalUserIdByExternalId
     * @param {Array} userExternalIds - Array of externalIds.
     * @param {String} token - user logged in token.
     * @returns {Array} Array of userId for external ids.
     */

    static getInternalUserIdByExternalId(token, userExternalIds) {

        return new Promise(async (resolve, reject) => {

            try {

                userExternalIds = _.compact(userExternalIds);

                let externalIdToUserIdMap = {};

                let result = await Promise.all(userExternalIds.map(userExternalId => {
                    return shikshalokam.getKeycloakUserIdByLoginId(token, userExternalId);
                }))

                userExternalIds.forEach((loginId, index) => {
                    if (result[index] && result[index][0]) {
                        externalIdToUserIdMap[loginId] = result[index][0]["userLoginId"];
                    } else {
                        externalIdToUserIdMap[loginId] = "";
                    }
                })

                return resolve(externalIdToUserIdMap);

            } catch (error) {

                return reject(error);

            }

        })

    }

      /**
     * Send notifications to user.
     * @method
     * @name sendUserNotifications
     * @param {String} [userId = ""] - Logged in userId.
     * @param {Array} [entities = []] - Array of entities. 
     * @returns {Object} Consisting of success and message. 
     */

    static sendUserNotifications(userId = "", entities = []) {
        return new Promise(async (resolve, reject) => {
            try {

                if (userId == "") {
                    throw new Error(messageConstants.apiResponses.INVALID_USER_ID);
                }

                const kafakResponses = await Promise.all(entities.map(async entity => {

                    const kafkaMessage = await kafkaClient.pushUserMappingNotificationToKafka({
                        user_id: userId,
                        internal: false,
                        text: `New ${entity.entityType} - ${entity.entityName} added for you in program ${entity.programName}`,
                        type: "information",
                        action: "mapping",
                        payload: {
                            type: entity.solutionSubType,
                            solution_id: entity.solutionId,
                            program_id: entity.programId,
                            entity_id: entity.entityId
                        },
                        title: "New Assessment",
                        created_at: new Date(),
                        appType: process.env.MOBILE_APPLICATION_APP_TYPE
                    });

                    if (kafkaMessage.status != "success") {
                        let errorObject = {
                            formData: {
                                userId: userId,
                                message: `Failed to push entity notification for entity ${entity.entityName} in program ${entity.programName} and solution ${entity.solutionName}`
                            }
                        };
                        slackClient.kafkaErrorAlert(errorObject);
                        return resolve({
                            success : false
                        });
                    }

                    return resolve(kafkaMessage);

                }));

                if (kafakResponses.findIndex(response => response === undefined || response === null) >= 0) {
                    throw new Error(messageConstants.apiResponses.SOMETHING_WENT_WRONG +"not all notifications were pushed.");
                }

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.NOTIFICATIONS_PUSHED_TO_KAFKA
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
     * Pending Assessments.
     * @method
     * @name pendingAssessment
     * @returns {Array} List of pending assessments.
     */

    static pendingAssessment() {

        return new Promise(async (resolve, reject) => {
            try {

                let queryData = {
                    status : {
                        $ne : messageConstants.apiResponses.STATUS_COMPLETED
                    }
                }

                let submissions = await database.models.submissions.find(
                    queryData, 
                    {
                    _id: 1
                }).lean();

                if( submissions.length < 1 ) {
                    throw {
                        message : 
                        messageConstants.apiResponses.SUBMISSION_NOT_FOUND
                    }
                }

                let chunkOfSubmissionDocuments = 
                _.chunk(submissions,chunkOfSubmissionsLength);

                let submissionDocuments;

                let pendingAssessmentsData = [];
                let submissionsIds;

                for (let pointerToSubmissions = 0; 
                    pointerToSubmissions < chunkOfSubmissionDocuments.length; 
                    pointerToSubmissions++
                ) {

                    submissionsIds = 
                    chunkOfSubmissionDocuments[pointerToSubmissions].map(submission => {
                        return submission._id
                    });

                    submissionDocuments = 
                    await database.models.submissions.find({
                        _id: { $in: submissionsIds }
                    },{
                        _id: 1, 
                        createdAt: 1,
                        entityId: 1, 
                        "entityInformation.name": 1, 
                        "entityInformation.externalId": 1,
                        "assessors.userId" : 1,
                        "assessors.role" : 1,
                        solutionId : 1,
                        programId : 1
                    }).lean();

                    await Promise.all(submissionDocuments.map(async submissionDocument=>{

                        if( 
                            submissionDocument.assessors &&
                            submissionDocument.assessors.length > 0 
                        ) {
                            
                            let entityName = "";
                            
                            if(
                                submissionDocument.entityInformation && 
                                submissionDocument.entityInformation.name
                            ) {
                                entityName = 
                                submissionDocument.entityInformation.name;
                            } else if (
                                submissionDocument.entityInformation && 
                                submissionDocument.entityInformation.externalId
                            ) {
                                entityName = 
                                submissionDocument.entityInformation.externalId;
                            }
                            
                            let result = {
                                _id : submissionDocument._id,
                                solutionId : submissionDocument.solutionId,
                                createdAt : submissionDocument.createdAt,
                                completedDate : submissionDocument.completedDate,
                                entityId : submissionDocument.entityId,
                                programId : submissionDocument.programId,
                                entityName: entityName
                            }
                            
                            submissionDocument.assessors.forEach(assessor=>{
                                if(assessor.role && 
                                    gen.utils.fetchAssessorsLeadAssessorRole().includes(assessor.role)
                                ) {
                                    result["userId"] = assessor.userId;
                                    pendingAssessmentsData.push(result);
                                }
                                
                            })
                        }
                    }))
                }

                return resolve(pendingAssessmentsData);

            } catch (error) {
                return reject(error);
            }
        })
    }

      /**
     * Entity Assessors upload helper function.
     * @method
     * @name completedAssessment
     * @param {String} fromDate - from Date.
     * @param {String} toDate - to date. 
     * @returns {Array} List of completed assessments.
     */

    static completedAssessment( 
        fromDate,
        toDate 
    ) {
        return new Promise(async (resolve, reject) => {
            try {

                let queryData = {
                    status : messageConstants.apiResponses.STATUS_COMPLETED,
                    completedDate : {
                        $exists : true,
                        $gte : fromDate,
                        $lte : toDate
                    }
                }

                let submissions = await database.models.submissions.find(
                    queryData, 
                    {
                    _id: 1
                }).lean();

                if( submissions.length < 1 ) {
                    throw {
                        message : messageConstants.apiResponses.SUBMISSION_NOT_FOUND
                    }
                }
                let chunkOfSubmissionDocuments = 
                _.chunk(submissions,chunkOfSubmissionsLength);

                let submissionDocuments;

                let completedAssessmentsData = [];
                let submissionsIds;

                for (let pointerToSubmissions = 0; 
                    pointerToSubmissions < chunkOfSubmissionDocuments.length; 
                    pointerToSubmissions++
                ) {

                    submissionsIds = 
                    chunkOfSubmissionDocuments[pointerToSubmissions].map(submission => {
                        return submission._id
                    });

                    submissionDocuments = 
                    await database.models.submissions.find({
                        _id: { $in: submissionsIds }
                    },{
                        _id: 1, 
                        completedDate : 1, 
                        entityId: 1, 
                        "entityInformation.name": 1, 
                        "entityInformation.externalId": 1,
                        "assessors.userId" : 1,
                        "assessors.role" : 1,
                        solutionId : 1,
                        programId : 1
                    }).lean();

                    await Promise.all(
                        submissionDocuments.map(async submissionDocument=>{

                        if( 
                            submissionDocument.assessors && 
                            submissionDocument.assessors.length > 0 
                        ) {
                            
                            let entityName = "";
                            
                            if(
                                submissionDocument.entityInformation && 
                                submissionDocument.entityInformation.name
                            ) {
                                entityName = 
                                submissionDocument.entityInformation.name;
                            } else if (
                                submissionDocument.entityInformation && 
                                submissionDocument.entityInformation.externalId
                            ) {
                                entityName = 
                                submissionDocument.entityInformation.externalId;
                            }
                            
                            let result = {
                                _id : submissionDocument._id,
                                solutionId : submissionDocument.solutionId,
                                completedDate : submissionDocument.completedDate,
                                entityId : submissionDocument.entityId,
                                programId : submissionDocument.programId,
                                entityName: entityName
                            }
                            
                            submissionDocument.assessors.forEach(assessor=>{

                                if(assessor.role && 
                                    gen.utils.fetchAssessorsLeadAssessorRole().includes(assessor.role)
                                ) {
                                    result["userId"] = assessor.userId;
                                    completedAssessmentsData.push(result);
                                }
                            })
                        }
                    }))
                }

                return resolve(completedAssessmentsData);

            } catch (error) {
                return reject(error);
            }
        })
    }

      /**
     * Create entity assessor data.
     * @method
     * @name create
     * @param {String} programId - program id.
     * @param {String} solutionId - solution id.
     * @param {Array}  entities - entities data.  
     * @returns {Object} create entity assessor data.
     */

    static create(
        userDetails,
        programId,
        solutionId,
        entities = []
    ) {
        return new Promise(async (resolve, reject) => {
            try {

                let solutionData = 
                await solutionsHelper.solutionDocuments({ 
                    _id : solutionId,
                    status : messageConstants.common.ACTIVE_STATUS
                },["_id","entityType","entityTypeId"]);

                if( !solutionData.length > 0) {
                    throw {
                        status : httpStatusCode.bad_request.status,
                        message : messageConstants.apiResponses.SOLUTION_NOT_FOUND
                    }
                }

                let programData = await programsHelper.list({
                    _id : programId
                },["_id"]);

                if ( !programData.length > 0 ) {
                    throw {
                        status : httpStatusCode.bad_request.status,
                        message : messageConstants.apiResponses.PROGRAM_NOT_FOUND
                    }
                }

                let assessorData = await this.assessorsDocument({
                    userId : userDetails.userId,
                    solutionId : solutionId,
                    programId : programId
                });

                let updateData = {};

                if( !assessorData.length > 0 ) {

                    updateData = {
                        userId : userDetails.userId,
                        email : userDetails.email,
                        name : userDetails.firstName + userDetails.lastName,
                        externalId : userDetails.userName,
                        programId : programId,
                        solutionId : solutionId,
                        entityTypeId : solutionData[0].entityTypeId,
                        entityType : solutionData[0].entityType,
                        role : messageConstants.common.LEAD_ASSESSOR,
                        createdBy : "SYSTEM",
                        updatedBy : "SYSTEM"
                    };
                }

                if( entities.length > 0 ) {
                    
                    let entityDocuments = 
                    await entitiesHelper.entityDocuments({
                        _id : { $in : entities },
                        entityType : solutionData[0].entityType
                    },["_id"]);

                    if( entityDocuments.length > 0 ) {
                        
                        let entitiesIds = entityDocuments.map(entity =>{
                            return entity._id;
                        });

                        updateData["$addToSet"] = {
                            entities : entitiesIds
                        };
                    }
                }

                let entityAssessor = await this.update(
                    programId,
                    solutionId,
                    userDetails.userId,
                    updateData
                );

                return resolve(entityAssessor);

            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
     * Update entity assessor data.
     * @method
     * @name update
     * @param {String} programId - program id.
     * @param {String} solutionId - solution id.
     * @param {Object} userId - logged in user id.
     * @param {Object}  updateData - update assessor data.  
     * @returns {Object} Update Entity assessor data.
     */

    static update(
        programId,
        solutionId,
        userId,
        updateData
    ) {
        return new Promise(async (resolve, reject) => {
            
            try {

                let assessorData = 
                await database.models.entityAssessors.findOneAndUpdate({ 
                    userId : userId, 
                    programId : programId, 
                    solutionId : solutionId
                }, 
                updateData,
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                    returnNewDocument: true
                });

                return resolve(assessorData);

            } catch (error) {
                return reject(error);
            }
        })
    }



    /**
      * Bulk create assessments By entityId and role.
      * @method
      * @name bulkCreateByUserRoleAndEntity - Bulk create assessments by entity and role.
      * @param {Object} userAssessmentData - user assessment data
      * @param {String} userToken - logged in user token.
      * @returns {Object}  Bulk create user assessments.
     */

    static bulkCreateByUserRoleAndEntity(userAssessmentData, userId) {
        return new Promise(async (resolve, reject) => {
            try {

                let userAndEntityList = await kendraService.getUsersByEntityAndRole
                (
                    userAssessmentData.entityId,
                    userAssessmentData.role
                )
                
                if (!userAndEntityList.success || !userAndEntityList.data) {
                    throw new Error(messageConstants.apiResponses.USERS_AND_ENTITIES_NOT_FOUND);
                }

                let assessorData = [];

                await Promise.all(userAndEntityList.data.map( user => {
                    assessorData.push({
                        "entities": user.entityExternalId,
                        "keycloak-userId": user.userId,
                        "entityOperation": "APPEND",
                        "programId" : userAssessmentData.programId,
                        "solutionId": userAssessmentData.solutionId,
                        "role": userAssessmentData.assessorRole
                    })
                })) 
        
                await this.upload
                (
                   assessorData,
                   null,
                   null,
                   userId,
                   null
                )
             
                return resolve({ message : messageConstants.apiResponses.ASSESSOR_CREATED });
            
            } catch (error) {
                return reject(error);
            }
        })
    }


};
