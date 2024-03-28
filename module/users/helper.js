/**
 * name : helper.js
 * author : Aman
 * created-date : 20-May-2020
 * Description : All users helper functionality.
 */

 // Dependencies 

 const entityAssessorsHelper = require(MODULES_BASE_PATH + "/entityAssessors/helper");
 const programsHelper = require(MODULES_BASE_PATH + "/programs/helper");
 const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
 const observationsHelper = require(MODULES_BASE_PATH + "/observations/helper");
 const submissionsHelper = require(MODULES_BASE_PATH + "/submissions/helper");
 const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");
 const observationSubmissionsHelper = require(MODULES_BASE_PATH + "/observationSubmissions/helper");
 const surveysHelper = require(MODULES_BASE_PATH + "/surveys/helper");
 const userExtensionsHelper = require(MODULES_BASE_PATH + "/userExtension/helper");
 const surveySubmissionsHelper = require(MODULES_BASE_PATH + "/surveySubmissions/helper");
 const shikshalokamHelper = require(MODULES_BASE_PATH + "/shikshalokam/helper");
 const telemetryEventOnOff = process.env.TELEMETRY_ON_OFF
 let kafkaClient = require(ROOT_PATH + "/generics/helpers/kafkaCommunications");

/**
    * UserHelper
    * @class
*/
module.exports = class UserHelper {


        /**
   * Delete user information.
   * @method
   * @name deleteUserPIIData
   * @param {Objcet} userDeleteEvent
   *{
      "eid": "BE_JOB_REQUEST",
      "ets": 1619527882745,
      "mid": "LP.1619527882745.32dc378a-430f-49f6-83b5-bd73b767ad36",
      "actor": {
        "id": "delete-user",
        "type": "System"
      },
      "context": {
        "channel": "01309282781705830427",
        "pdata": {
          "id": "org.sunbird.platform",
          "ver": "1.0"
        },
        "env": "dev"
      },
      "object": {
        "id": "<deleted-userId>",
        "type": "User"
      },
      "edata": {
        "organisationId": "0126796199493140480",
        "userId": "a102c136-c6da-4c6c-b6b7-0f0681e1aab9",
        "suggested_users": [
          {
            "role": "ORG_ADMIN",
            "users": [
              "<orgAdminUserId>"
            ]
          },
          {
            "role": "CONTENT_CREATOR",
            "users": [
              "<contentCreatorUserId>"
            ]
          },
          {
            "role": "COURSE_MENTOR",
            "users": [
              "<courseMentorUserId>"
            ]
          }
        ],
        "action": "delete-user",
        "iteration": 1
      }
    }
   * @returns {Object} Object with status if found and updated then will return true else will return false.
   */
    static deleteUserPIIData(userDeleteEvent) {
        return new Promise(async (resolve, reject) => {
            try {
                let userId = userDeleteEvent.edata.userId;
                let filter = {
                    createdBy: userId,
                }
            
                let updateObject =  {
                    $set: {
                        "userProfile.firstName": messageConstants.common.DELETED_USER,
                    },
                    $unset: {
                        "userProfile.email": 1,
                        "userProfile.maskedEmail": 1,
                        "userProfile.maskedPhone": 1,
                        "userProfile.recoveryEmail": 1,
                        "userProfile.phone": 1,
                        "userProfile.lastName": 1,
                        "userProfile.prevUsedPhone": 1,
                        "userProfile.prevUsedEmail": 1,
                        "userProfile.recoveryPhone": 1,
                        "userProfile.dob": 1,
                        "userProfile.encEmail": 1,
                        "userProfile.encPhone": 1,
                    },
                };

                let updateObjectForObservationSubmission =  {
                    $set: {
                        "userProfile.firstName": messageConstants.common.DELETED_USER,
                        "observationInformation.userProfile.firstName": messageConstants.common.DELETED_USER,
                    },
                    $unset: {
                        "userProfile.email": 1,
                        "userProfile.maskedEmail": 1,
                        "userProfile.maskedPhone": 1,
                        "userProfile.recoveryEmail": 1,
                        "userProfile.phone": 1,
                        "userProfile.lastName": 1,
                        "userProfile.prevUsedPhone": 1,
                        "userProfile.prevUsedEmail": 1,
                        "userProfile.recoveryPhone": 1,
                        "userProfile.dob": 1,
                        "userProfile.encEmail": 1,
                        "userProfile.encPhone": 1,
                        "observationInformation.userProfile.email": 1,
                        "observationInformation.userProfile.maskedEmail": 1,
                        "observationInformation.userProfile.maskedPhone": 1,
                        "observationInformation.userProfile.recoveryEmail": 1,
                        "observationInformation.userProfile.phone": 1,
                        "observationInformation.userProfile.lastName": 1,
                        "observationInformation.userProfile.prevUsedPhone": 1,
                        "observationInformation.userProfile.prevUsedEmail": 1,
                        "observationInformation.userProfile.recoveryPhone": 1,
                        "observationInformation.userProfile.dob": 1,
                        "observationInformation.userProfile.encEmail": 1,
                        "observationInformation.userProfile.encPhone": 1,
                    },
                };
                
                let updateDataStatus = await Promise.all([surveySubmissionsHelper.updateMany(filter,updateObject),
                    observationsHelper.updateMany(filter,updateObject),
                    observationSubmissionsHelper.updateMany(filter,updateObjectForObservationSubmission)
                ])
                if(updateDataStatus && (updateDataStatus[0].nModified > 0 || updateDataStatus[1].nModified > 0 || updateDataStatus[2].nModified > 0 )){
                    if(telemetryEventOnOff !== messageConstants.common.OFF){
                        /**
                         * Telemetry Raw Event
                         * {"eid":"","ets":1700188609568,"ver":"3.0","mid":"e55a91cd-7964-46bc-b756-18750787fb32","actor":{},"context":{"channel":"","pdata":{"id":"projectservice","ver":"7.0.0"},"env":"","cdata":[],"rollup":{}},"object":{},"edata":{}}
                         */

                        let rawEvent = await gen.utils.generateTelemetryEventSkeletonStructure();
                        rawEvent.eid = messageConstants.common.AUDIT;
                        rawEvent.context.channel = userDeleteEvent.context.channel;
                        rawEvent.context.env = messageConstants.common.USER;
                        rawEvent.edata.state = messageConstants.common.DELETE_STATE;
                        rawEvent.edata.type = messageConstants.common.USER_DELETE_TYPE;
                        rawEvent.edata.props = [];
                        let userObject = {
                        id: userId,
                        type: messageConstants.common.USER,
                        };
                        rawEvent.actor = userObject;
                        rawEvent.object = userObject;
                        rawEvent.context.pdata.pid = `${process.env.ID}.${messageConstants.common.USER_DELETE_MODULE}`
            
                        let telemetryEvent = await gen.utils.generateTelemetryEvent(rawEvent);
                        telemetryEvent.lname = messageConstants.common.TELEMTRY_EVENT_LOGGER;
                        telemetryEvent.level = messageConstants.common.INFO_LEVEL

                        await kafkaClient.pushTelemetryEventToKafka(telemetryEvent)
                    }
                    return resolve({
                        success: true,
                    });
                } else {
                    return resolve({
                        success: true,
                    });
                }
                
            } catch (err) {
                return reject(err);
            }
        });
    }


     /**
   * Details user information. 
   * @method
   * @name userDetailsInformation
   * @param {String} userId 
   * @returns {Object} consists of observation,solutions,entities,programs and assessorData,submissions and observation submissions data.
   * associated to the user. 
   */

    static userDetailsInformation( userId ) {
        return new Promise(async (resolve, reject) => {
            try {

                let assessorsData = 
                await entityAssessorsHelper.assessorsDocument({
                    userId : userId
                },[
                    "programId",
                    "solutionId",
                    "entities",
                    "createdAt"
                ]);
                
                let programIds = [];
                let solutionIds = [];
                let entityIds = [];
                
                if( assessorsData.length > 0 ) {
                    
                    assessorsData.forEach(assessor=>{
                        
                        programIds.push(assessor.programId);
                        solutionIds.push(assessor.solutionId);
                        entityIds = entityIds.concat(assessor.entities);
                    })

                }

                let submissions = await submissionsHelper.submissionDocuments({
                    solutionId : { $in : solutionIds },
                    entityId : { $in : entityIds }
                },[
                    "status",
                    "_id",
                    "entityId",
                    "solutionId",
                    "title",
                    "submissionNumber",
                    "completedDate",
                    "createdAt",
                    "updatedAt"
                ],"none",
                {
                    createdAt : -1
                });
                
                let observationsData = 
                await observationsHelper.observationDocuments({
                    createdBy : userId,
                    status : messageConstants.common.PUBLISHED
                },[
                    "entities",
                    "solutionId",
                    "programId",
                    "entityId",
                    "name",
                    "description",
                    "status",
                    "observationId",
                    "createdAt",
                    "updatedAt"
                ]);

                let observationIds = [];
                let observationSolutions = [];
                let observationEntities = [];
                
                if ( observationsData.length > 0 ) {
                    
                    observationsData.forEach(observation=>{
                        observationIds.push(observation._id);
                        observation["isObservation"] = true;
                        programIds.push(observation.programId);
                        observationSolutions.push(observation.solutionId);
                        observationEntities = observationEntities.concat(observation.entities);
                    });
                }

                let observationSubmissions = 
                await observationSubmissionsHelper.observationSubmissionsDocument({
                    observationId : { $in : observationIds },
                    entityId : { $in : observationEntities }
                },[
                    "status",
                    "submissionNumber",
                    "entityId",
                    "createdAt",
                    "updatedAt",
                    "observationInformation.name",
                    "observationId", 
                    "title",
                    "completedDate",
                    "ratingCompletedAt"   
                ],{
                    createdAt : -1
                });

                solutionIds = solutionIds.concat(observationSolutions);
                entityIds = entityIds.concat(observationEntities);

                let surveysData = 
                await surveysHelper.surveyDocuments({
                    createdBy : userId,
                    status : messageConstants.common.PUBLISHED,
                    programId : { $exists: true}
                },[
                    "solutionId",
                    "programId",
                    "name",
                    "description",
                    "status",
                    "endDate",
                    "createdAt",
                    "updatedAt"
                ]);

                let surveyIds = [];
                let surveySolutions = [];
                
                if ( surveysData.length > 0 ) {
                    
                    surveysData.forEach(survey=>{
                        surveyIds.push(survey._id);
                        survey["isSurvey"] = true;
                        programIds.push(survey.programId);
                        surveySolutions.push(survey.solutionId);
                    });
                }

                let surveySubmissions = 
                await surveySubmissionsHelper.surveySubmissionDocuments({
                    surveyId : { $in : surveyIds }
                },[
                    "status",
                    "createdAt",
                    "updatedAt",
                    "name",
                    "surveyId", 
                    "completedDate",
                    "endDate"  
                ],{
                    createdAt : -1
                });

                solutionIds = solutionIds.concat(surveySolutions);

                if ( !(programIds.length > 0) ) {
                    throw {
                        status : httpStatusCode.ok.status,
                        message : messageConstants.apiResponses.PROGRAM_NOT_MAPPED_TO_USER
                    }
                }

                if( !(solutionIds.length > 0) ) {
                    throw {
                        status : httpStatusCode.ok.status,
                        message : messageConstants.apiResponses.SOLUTION_NOT_MAPPED_TO_USER
                    }
                }
                
                let programs = 
                await programsHelper.programDocument(
                    programIds,
                    ["name","externalId","description"]
                );
                
                if ( !(programs.length > 0) ) {
                    throw {
                        status : httpStatusCode.ok.status,
                        message : messageConstants.apiResponses.PROGRAM_NOT_FOUND
                    }
                }
                
                let programsData = programs.reduce(
                    (ac, program) => ({
                        ...ac,
                        [program._id.toString()]: program
                }), {});
                
                let solutions = 
                await solutionsHelper.solutionDocuments(
                    {
                        _id : { $in : solutionIds },
                        status : messageConstants.common.ACTIVE_STATUS,
                        isDeleted : false 
                    },[
                        "name",
                        "description",
                        "externalId",
                        "type",
                        "subType",
                        "solutionId",
                        "allowMultipleAssessemts",
                        "isAPrivateProgram",
                        "entityType",
                        "entityTypeId"
                    ]
                );

                if ( !(solutions.length > 0)) {
                    throw {
                        status : httpStatusCode.ok.status,
                        message : messageConstants.apiResponses.SOLUTION_NOT_FOUND
                    }
                }

                // let solutionsData = solutions.reduce(
                //     (ac, solution) => ({
                //         ...ac,
                //         [solution._id.toString()]: solution
                //     }), {});

                let removedSolutions = await userExtensionsHelper.userExtensionDocuments({
                    userId: userId
                  },["removedFromHomeScreen"]);

                let userRemovedSolutionsFromHomeScreen = new Array;

                if(Array.isArray(removedSolutions) && removedSolutions.length > 0 && Array.isArray(removedSolutions[0].removedFromHomeScreen) && removedSolutions[0].removedFromHomeScreen.length >0) {
                    removedSolutions[0].removedFromHomeScreen.forEach(solutionId => {
                        userRemovedSolutionsFromHomeScreen.push(solutionId.toString());
                    })
                }

                let solutionsData = {};

                for (let pointerToSolutionsArray = 0; pointerToSolutionsArray < solutions.length; pointerToSolutionsArray++) {
                    let solution = solutions[pointerToSolutionsArray];
                    solution.showInHomeScreen = true;
                    if(userRemovedSolutionsFromHomeScreen.length > 0 && userRemovedSolutionsFromHomeScreen.indexOf(solution._id.toString()) > -1) {
                        solution.showInHomeScreen = false;
                    }

                    solutionsData[solution._id.toString()] = solution;
                }

                let entitiesData = {};
                if( entityIds.length > 0 ) {


                    let entities = await entitiesHelper.entityDocuments({
                        _id : { $in : entityIds }
                    }, [
                        "_id",
                        "metaInformation.externalId",
                        "metaInformation.name",
                        "metaInformation.city",
                        "metaInformation.state",
                        "entityType"
                    ]);

                    if ( entities.length > 0 ) {
                        
                        entitiesData = entities.reduce(
                            (ac, entity) => ({
                                ...ac,
                                [entity._id.toString()]: entity
                        }), {});
                    }

                }

                return resolve({
                    entityAssessors : assessorsData,
                    observations : observationsData,
                    surveys : surveysData,
                    programsData : programsData,
                    solutionsData : solutionsData,
                    entitiesData : entitiesData,
                    submissions : submissions,
                    observationSubmissions : observationSubmissions,
                    surveySubmissions: surveySubmissions
                });
                    
            } catch(error) {
                return reject(error);
            }
        })
    }

     /**
   * list user programs.
   * @method
   * @name programs
   * @param {String} userId - logged in user id
   * @returns {Object} list of user programs. 
   */

    static programs( userId ) {
        return new Promise(async (resolve, reject) => {
            try {

                let userDetails = await this.userDetailsInformation(
                    userId
                );

                let users = [...userDetails.entityAssessors,...userDetails.observations,...userDetails.surveys];
                
                users = users.sort((a,b) => b.createdAt - a.createdAt);

                let submissions = {};
                let observationSubmissions = {};
                let surveySubmissions = {};

                if( userDetails.submissions.length > 0 ) {
                    submissions =  _submissions(userDetails.submissions);
                };

                if( userDetails.observationSubmissions.length > 0 ) {
                    
                    observationSubmissions = _observationSubmissions(
                        userDetails.observationSubmissions
                    );
                }

                if ( userDetails.surveySubmissions.length > 0 ) {
                    surveySubmissions = _surveySubmissions
                     ( userDetails.surveySubmissions
                     );
                }

                let result = [];
                 
                for( let user = 0 ; user < users.length ; user ++ ) {
                   
                    let program = 
                    users[user].programId && 
                    userDetails.programsData[users[user].programId.toString()];

                    let solution = 
                    users[user].solutionId &&
                    userDetails.solutionsData[users[user].solutionId.toString()];

                    if ( program && solution ) {

                        let programIndex = result.findIndex(programData =>
                            programData.externalId === program.externalId
                        );

                        if ( programIndex < 0 ) {

                            result.push(_programInformation(program));
                            programIndex = result.length - 1;
                        }

                        let solutionIndex = 
                        result[programIndex].solutions.findIndex(
                            solutionData => solutionData.externalId === solution.externalId
                        );

                        if (solutionIndex < 0) {

                            let solutionInformation;
                            
                            if (users[user].isObservation) {
                                solutionInformation = _observationInformation
                                (
                                    program,
                                    users[user],
                                    solution
                                )
                            }
                            else if (users[user].isSurvey) {
                                solutionInformation = _surveyInformation
                                (
                                    program,
                                    users[user],
                                    solution
                                )
                            }
                            else {
                                solutionInformation = _solutionInformation(program, solution);
                            }
                            
                            if (!users[user].isSurvey) {
                                solutionInformation["entities"] = [];
                            }
                                
                            result[programIndex].solutions.push(
                                solutionInformation
                            );

                            solutionIndex = 
                            result[programIndex].solutions.length - 1;
                        }
                        
                        if (users[user].isSurvey) {
                          if (surveySubmissions[users[user]._id]) {
                             result[programIndex].solutions[solutionIndex].submissions = (surveySubmissions[users[user]._id]["submissions"]);
                          }
                        }
                        else {
                            
                        let solutionOrObservationId = 
                        users[user].isObservation ?
                        users[user]._id 
                        : solution._id;

                        let submissionData = 
                        users[user].isObservation ? 
                        observationSubmissions : submissions;

                        result[programIndex].solutions[solutionIndex].entities = 
                        _entities(
                            users[user].entities,
                            userDetails.entitiesData,
                            solutionOrObservationId,
                            submissionData,
                            users[user].isObservation ? true : false
                        );

                        }
                    }
                }

                return resolve({
                    message : messageConstants.apiResponses.USER_PROGRAMS_FETCHED,
                    result : result
                });


            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
   * Entity types and entities detail information
   * @method
   * @name entities
   * @param {string} userId - logged in user Id.
   * @returns {Array} - Entity types and entities detail information.
   */

    static entities( userId ) {
        return new Promise(async (resolve, reject) => {
            try {

                let userDetails = await this.userDetailsInformation(
                    userId
                );

                let submissions = {};
                let observationSubmissions = {};

                if( userDetails.submissions.length > 0 ) {
                    submissions =  _submissions(userDetails.submissions);
                };

                if( userDetails.observationSubmissions.length > 0 ) {
                    
                    observationSubmissions = _observationSubmissions(
                        userDetails.observationSubmissions
                    );
                }

                let result = {
                    entityTypes : 
                    _entityTypesKeyValue(
                        Object.values(userDetails.entitiesData)
                    ),
                    entities : {}
                }

                let users = userDetails.entityAssessors.concat(
                    userDetails.observations
                );

                for ( let user = 0 ; user < users.length ; user++) {

                    let userData = users[user];
                    let program = 
                    users[user].programId &&
                    userDetails.programsData[users[user].programId.toString()];
                    
                    let solution = 
                    users[user].solutionId &&
                    userDetails.solutionsData[users[user].solutionId.toString()];

                    if ( solution && program && userData.entities.length > 0 ) {

                        userData.entities.forEach(entity => {

                            let entitiesData = userDetails.entitiesData;
            
                            if ( entitiesData[entity.toString()] ) {
                        
                                if (
                                    !result.entities[entitiesData[entity.toString()].entityType]
                                ) {
                                    result.entities[entitiesData[entity.toString()].entityType] = [];
                                }
                        
                                let entityExternalId =  
                                entitiesData[entity.toString()]["metaInformation"]["externalId"];
                        
                                let entityIndex =  
                                result.entities[entitiesData[entity.toString()].entityType].findIndex(
                                    entity => entity.externalId === entityExternalId
                                );
                        
                                if ( entityIndex < 0 ) {

                                    let entityInformation =  _entityInformation(userDetails.entitiesData[entity.toString()]);
                                    entityInformation["solutions"] = [];

                                    result.entities[entitiesData[entity.toString()].entityType].push(entityInformation);
                                    
                                    entityIndex = 
                                    result.entities[entitiesData[entity.toString()].entityType].length -1 ;
                                }
                        
                                let solutionIndex = 
                                result.entities[entitiesData[entity.toString()].entityType][entityIndex].solutions.findIndex(
                                    solutionData => solutionData._id.toString() === solution._id.toString()
                                )
                        
                                if( solutionIndex < 0 ) {

                                    let solutionOrObservationInformation = 
                                    users[user].isObservation ? 
                                    _observationInformation(
                                        program,
                                        users[user],
                                        solution
                                    ) : _solutionInformation(program,solution);
                                    
                                    let submission;

                                    if( users[user].isObservation ) {
                                        submission = 
                                         _observationSubmissionInformation(
                                            observationSubmissions,
                                            users[user]._id,
                                            entity.toString()
                                        ) 
                                    } else {
                                        submission = 
                                        _submissionInformation(
                                            submissions,
                                            solution._id,
                                            entity
                                        );
                                    }

                                    let solutionData = {
                                        ...solutionOrObservationInformation,
                                        ...submission
                                    }

                                    result.entities[entitiesData[entity.toString()].entityType][entityIndex].solutions.push(
                                        solutionData
                                    );
                                }
                            }
                        });
                    }

                }

                return resolve({
                    message : 
                    messageConstants.apiResponses.USER_ENTITIES_FETCHED_SUCCESSFULLY,

                    result : result
                })

            } catch (error) {
                return reject(error);
            }
        })
    }

     /**
   * List of all private programs created by user
   * @method
   * @name privatePrograms
   * @param {string} userId - logged in user Id.
   * @returns {Array} - List of all private programs created by user.
   */

  static privatePrograms( userId ) {
    return new Promise(async (resolve, reject) => {
        try {

            let userPrivatePrograms = 
            await programsHelper.userPrivatePrograms(
                userId
            );

            return resolve({
                message : 
                messageConstants.apiResponses.PRIVATE_PROGRAMS_LIST,

                result : userPrivatePrograms
            })

        } catch (error) {
            return reject(error);
        }
    })
  }

   /**
   * Create user program and solution
   * @method
   * @name createProgramAndSolution
   * @param {string} userId - logged in user Id.
   * @param {object} programData - data needed for creation of program.
   * @param {object} solutionData - data needed for creation of solution.
   * @returns {Array} - Created user program and solution.
   */

  static createProgramAndSolution( userId,data,userToken ) {
    return new Promise(async (resolve, reject) => {
        try {

            let userPrivateProgram = "";
            let dateFormat = gen.utils.epochTime();

            if( data.programId && data.programId !== "" ) {

                userPrivateProgram =  await programsHelper.list(
                    {
                        _id : data.programId
                    },
                    ["externalId","name","description"]
                );

                if( !userPrivateProgram.length > 0 ) {
                    return resolve({
                        message : messageConstants.apiResponses.PROGRAM_NOT_FOUND,
                        result : {}
                    })
                }

                userPrivateProgram = userPrivateProgram[0];

            } else {

                let programData = {
                    name : data.programName,
                    isAPrivateProgram : true,
                    status : messageConstants.common.ACTIVE_STATUS,
                    externalId : 
                    data.programExternalId ? 
                    data.programExternalId : 
                    data.programName + "-" + dateFormat,
                    description : 
                    data.programDescription ? 
                    data.programDescription : 
                    data.programName,
                    userId : userId
                }

                userPrivateProgram = 
                await programsHelper.create(
                    programData
                );
            }

            let solutionData = {
                name : data.solutionName,
                externalId : 
                data.solutionExternalId ? 
                data.solutionExternalId : 
                data.solutionName+ "-" + dateFormat,
                description : 
                data.solutionDescription ? 
                data.solutionDescription : data.solutionName,
                programId : userPrivateProgram._id,
                programExternalId : userPrivateProgram.externalId,
                programName : userPrivateProgram.name,
                programDescription : userPrivateProgram.description
            }

            solutionData.entities = 
            solutionData.entities && solutionData.entities.length > 0 ? 
            solutionData.entities : [];

            const solution = await solutionsHelper.create(solutionData);

            if( solution._id ) {
                await database.models.programs.updateOne({ 
                    _id : userPrivateProgram._id 
                }, { 
                    $addToSet: { components : ObjectId(solution._id) } 
                });
            }

            return resolve({
                message : 
                messageConstants.apiResponses.USER_PROGRAM_AND_SOLUTION_CREATED,
                result : {
                    program : userPrivateProgram,
                    solution : solution
                }
            })

        } catch (error) {
            return reject(error);
        }
    })
  }

  /**
      * Get surveys documents started by user.
      * @method
      * @name surveys
      * @param  {String} userId - userId of user.
      * @param  {String} programId - program Id.
      * @returns {result} - all the survey which user has started in that program. 
     */
    static surveys(userId, programId){
        return new Promise(async (resolve, reject) => {
            try {
                
                 /**
                 * Get Survey document based on filtered data provided.
                 * @name surveyDocuments
                 * @param {Array} [surveyFilter = "all"] - survey ids.
                 * @param {Array} [fieldsArray = "all"] - projected fields.
                 * @param {Array} [sortedData = "all"] - sorted field.
                 * @param {Array} [skipFields = "none"] - field not to include
                 * @returns {Array} List of surveys. 
                 */
                let surveyData = await surveysHelper.surveyDocuments({
                    createdBy : userId,
                    programId : programId,
                    },[
                        "solutionId",
                        "solutionExternalId",
                        "programId",
                        "programExternalId",
                    ]
                );

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.SURVEYS_FETCHED,
                    data: surveyData
                });

            }
            catch (err) {
                return resolve({
                    success: false,
                    message: err.message,
                    data: false
                });
            }
        })
    }

    /**
      * get observation documents started by user.
      * @method
      * @name observations
      * @param  {String} userId - userId of user.
      * @param  {String} programId - program Id.
      * @returns {result} - all the observation which user has started in that program. 
     */

     static observations(userId, programId){
        return new Promise(async (resolve, reject) => {
            try {
                 /**
                 * Get Observation document based on filtered data provided.
                 * @name observationDocuments
                 * @param {Object} [findQuery = "all"] -filter data.
                 * @param {Array} [fields = "all"] - Projected fields.
                 * @returns {Array} - List of observations.
                 */
                let observationData = await observationsHelper.observationDocuments({
                    createdBy : userId,
                    programId : programId,
                    },[
                        "solutionId",
                        "solutionExternalId",
                        "programId",
                        "programExternalId",
                    ]
                );

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.OBSERVATION_FETCHED,
                    data: observationData
                });

            }
            catch (err) {
                return resolve({
                    success: false,
                    message: err.message,
                    data: false
                });
            }
        })
    }

    /**
      * get surveySubmission Documents documents started by user.
      * @method
      * @name surveySubmissions
      * @param  {String} userId - userId of user.
      * @param  {String} solutionId - solution Id.
      * @returns {result} - all the surveySubmission in particular solution which user has submitted. 
     */

     static surveySubmissions(userId, solutionId){
        return new Promise(async (resolve, reject) => {
            try {
                
                let surveySubmission = await surveySubmissionsHelper.surveySubmissionDocuments({
                    createdBy : userId,
                    solutionId : solutionId,
                    },[
                        "surveyId",
                        "solutionId",
                        "surveyInformation.name",
                        "surveyInformation.endDate",
                        "surveyInformation.description",
                        "status",
                        "_id",
                    ]
                );

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.SURVEY_SUBMISSION_FOUND,
                    data: surveySubmission
                });

            }
            catch (err) {
                return resolve({
                    success: false,
                    message: err.message,
                    data: false
                });
            }
        })
    }

};

  /**
   * Entity types .
   * @method
   * @name _entityTypesKeyValue - submission helper functionality
   * @param {Array} entities - list of entities.
   * @returns {Array} - Entity types key-value pair.
   */

  function _entityTypesKeyValue(entities) {

      let result = [];
    
      entities.forEach(entity => {
        
        let findEntityTypesIndex = 
        result.findIndex(
            type => type.key === entity.entityType
        );

        if( findEntityTypesIndex < 0 ) {
            
            result.push({
                "name" : gen.utils.camelCaseToTitleCase(entity.entityType),
                "key" : entity.entityType
            })
        }
      });
    
    return result;
  }

  /**
   * observations submissions data.
   * @method
   * @name _observationSubmissions - observations helper functionality
   * @param {Array} observationSubmissions - observation submissions.
   * @returns {Array} - observations submissions data.
   */

function _observationSubmissions(observationSubmissions) {

    let submissions = {};

    observationSubmissions.forEach(submission=>{
        
        if ( !submissions[submission.observationId.toString()] ) {
            submissions[submission.observationId.toString()] =  {};
        }

        if( !submissions[submission.observationId.toString()][submission.entityId.toString()] ) {
            submissions[submission.observationId.toString()][submission.entityId.toString()] = {};
            submissions[submission.observationId.toString()][submission.entityId.toString()]["submissions"] = [];
        }
            
        submissions[submission.observationId.toString()][submission.entityId.toString()]["submissions"].push(
            {
                "_id" : submission._id,
                "status" : submission.status,
                "submissionNumber" : submission.submissionNumber,
                "entityId" : submission.entityId,
                "createdAt" : submission.createdAt,
                "updatedAt" : submission.updatedAt,
                "observationName" : 
                submission.observationInformation && submission.observationInformation.name ? 
                submission.observationInformation.name : "",
                "observationId" : submission.observationId,
                "title" : submission.title,
                "submissionDate" : submission.completedDate ? submission.completedDate : "",
                "ratingCompletedAt" : submission.ratingCompletedAt ? submission.ratingCompletedAt : ""
            }
        );
    })

    return submissions;
}

  /**
   * observations submissions information.
   * @method
   * @name _observationSubmissionInformation - observations helper functionality
   * @param {Object} submissions - observation submissions key-value pair.
   * @param {String} observationId - solution internal id.
   * @param {String} entityId - entity internal id.
   * @returns {Object} - observations submissions information.
   */

function _observationSubmissionInformation(submissions,observationId,entityId) {
    return {
        totalSubmissionCount : 
        submissions[observationId] && submissions[observationId][entityId] && submissions[observationId][entityId].submissions.length > 0 ? 
        submissions[observationId][entityId].submissions.length  : 
        0,

        submissions : 
        submissions[observationId] && submissions[observationId][entityId] && submissions[observationId][entityId].submissions.length > 0 ? 
        submissions[observationId][entityId].submissions.slice(0,10) : 
        []

    };
}

  /**
   * list of submissions.
   * @method
   * @name _submissions
   * @param {Array} submissions - list of submissions.
   * @returns {Array} - submissions data.
   */

  function _submissions(submissions) {

    let submissionData = {};

    submissions.forEach(submission=>{
        
        if ( !submissionData[submission.solutionId.toString()] ) {
            submissionData[submission.solutionId.toString()] =  {};
        }

        if( !submissionData[submission.solutionId.toString()][submission.entityId.toString()] ) {
            submissionData[submission.solutionId.toString()][submission.entityId.toString()] = {};
            submissionData[submission.solutionId.toString()][submission.entityId.toString()]["submissions"] = [];
        }
            
        submissionData[submission.solutionId.toString()][submission.entityId.toString()]["submissions"].push(
            {
                submissionNumber : submission.submissionNumber,
                title : submission.title,
                _id : submission._id,
                status : submission.status,
                createdAt : submission.createdAt,
                updatedAt : submission.updatedAt,
                submissionDate : 
                submission.completedDate ? 
                submission.completedDate : ""
            }
        );
    })

    return submissionData;
}

/**
   * submissions information
   * @method
   * @name _submissionInformation
   * @param {Array} submissions - list of submissions.
   * @param {String} solutionId - solution id.
   * @param {String} entityId - entity id.
   * @returns {Array} - submissions data.
   */

function _submissionInformation(submissions,solutionId,entityId) {
    return {
        totalSubmissionCount : 
        submissions[solutionId] && submissions[solutionId][entityId] && submissions[solutionId][entityId].submissions.length > 0 ? 
        submissions[solutionId][entityId].submissions.length  : 
        0,

        submissions : 
        submissions[solutionId] && submissions[solutionId][entityId] && submissions[solutionId][entityId].submissions.length > 0 ? 
        submissions[solutionId][entityId].submissions.slice(0,10) : 
        []

    };
}

 /**
   * program information
   * @method
   * @name _programInformation - program information
   * @param {Object} program - program data.
   * @param {String} program._id - program internal id.
   * @param {String} program.name - program name.
   * @param {String} program.description - program description.
   * @returns {Object} - program information
   */

function _programInformation(program) {
    return {
        _id : program._id,
        name : program.name,
        externalId : program.externalId,
        description : program.description,
        solutions : []
    }
}

 /**
   * solution information
   * @method
   * @name _solutionInformation - program information
   * @param {Object} program - program data.
   * @param {String} program._id - program internal id.
   * @param {String} program.name - program name.
   * @param {Object} solution - solution data.
   * @param {String} solution.externalId - solution external id.
   * @param {String} solution._id - solution internal id.
   * @param {String} solution.name - solution name.
   * @param {String} solution.description - solution description.
   * @param {String} solution.type - solution type.
   * @param {String} solution.subType - solution subType.
   * @returns {Object} - solution information
   */

function _solutionInformation(program,solution) {
    return {
        programName : program.name,
        programId : program._id,
        _id : solution._id,
        name : solution.name,
        externalId : solution.externalId,
        description : solution.description,
        type : solution.type,
        subType : solution.subType,
        allowMultipleAssessemts : solution.allowMultipleAssessemts ? solution.allowMultipleAssessemts : false,
        showInHomeScreen : solution.showInHomeScreen ? solution.showInHomeScreen : false,
        isAPrivateProgram : solution.isAPrivateProgram ? solution.isAPrivateProgram : false,
        entityType : solution.entityType,
        entityTypeId : solution.entityTypeId
    }
}

/**
   * observation information
   * @method
   * @name _observationInformation - observation information
   * @param {Object} program - program data.
   * @param {String} program._id - program internal id.
   * @param {String} program.name - program name.
   * @param {Object} observation - observation data.
   * @param {String} observation.externalId - observation external id.
   * @param {String} observation._id - observation internal id.
   * @param {String} observation.name - observation name.
   * @param {String} observation.description - observation description.
   * @returns {Object} - observation information
   */

function _observationInformation(program,observation,solution) {
    return {
        programName : program.name,
        programId : program._id,
        _id : observation._id,
        name : observation.name,
        externalId : observation.externalId,
        description : observation.description,
        type : solution.type,
        subType : solution.subType,
        solutionExternalId : solution.externalId,
        solutionId : solution._id,
        showInHomeScreen : solution.showInHomeScreen ? solution.showInHomeScreen : false,
        isAPrivateProgram : solution.isAPrivateProgram ? solution.isAPrivateProgram : false,
        entityType : solution.entityType,
        entityTypeId : solution.entityTypeId 
    }
}

    /**
   * survey information
   * @method
   * @name _surveyInformation - survey information
   * @param {Object} program - program data.
   * @param {String} program._id - program internal id.
   * @param {String} program.name - program name.
   * @param {Object} survey - survey data.
   * @param {String} survey.externalId - survey external id.
   * @param {String} survey._id - survey internal id.
   * @param {String} survey.name - survey name.
   * @param {String} survey.description - survey description.
   * @returns {Object} - survey information
   */

function _surveyInformation(program,survey,solution) {
    return {
        programName : program.name,
        programId : program._id,
        _id : survey._id,
        name : survey.name,
        externalId : survey.externalId,
        description : survey.description,
        type : solution.type,
        subType : solution.subType,
        solutionExternalId : solution.externalId,
        solutionId : solution._id,
        entityType : solution.entityType ? solution.entityType : "",
        entityTypeId : solution.entityTypeId ? solution.entityTypeId : "",
        showInHomeScreen : solution.showInHomeScreen ? solution.showInHomeScreen : false
    }
}

/**
   * Entities data
   * @method
   * @name _entities - Entities data
   * @param {Array} entities - entities
   * @param {Object} entitiesData - entity internalId to data.
   * @param {String} solutionOrObservationId - solution or observation id.
   * @param {Object} submissions - submissions data.
   * @param {Object} [observation = false] - either observation submissions or submissions.
   * @returns {Array} - Entities data
   */

function _entities(
    entities,
    entitiesData,
    solutionOrObservationId,
    submissions,
    observation = false
) {

    let result = [];

    if( entities.length > 0 ) {

        entities.forEach(entityId=>{

            if( entitiesData[entityId.toString()] ) {
                
                let entityIndex = 
                result.findIndex(entity=>
                    entity.externalId === entitiesData[entityId.toString()].externalId
                );
        
                if( entityIndex < 0 ) {
        
                    let entityObj = _entityInformation(
                        entitiesData[entityId.toString()]
                    );
        
                    let submission;
        
                    if( observation ) {
        
                        submission = 
                        _observationSubmissionInformation(
                            submissions,
                            solutionOrObservationId,
                            entityId
                        );
        
                    } else {
                        submission =
                        _submissionInformation(
                            submissions,
                            solutionOrObservationId,
                            entityId
                        );
                    }
        
                    entityObj = {
                        ...entityObj,
                        ...submission
                    }
        
                    result.push(
                        entityObj
                    );
                }

            }
        })

    }

    return result;

}

 /**
   * entity information
   * @method
   * @name _entityInformation 
   * @param {Object} entityDetails - entity details key-value pair.
   * @returns {Object} - entity information
   */

function _entityInformation(entityDetails) {
    return {
        _id : entityDetails._id,
        name : entityDetails.metaInformation.name ? entityDetails.metaInformation.name : "",
        externalId : entityDetails.metaInformation.externalId,
        entityType : entityDetails.entityType
    }
}


 /**
   * surveys submissions data.
   * @method
   * @name _surveySubmissions - surveys helper functionality
   * @param {Array} surveySubmissions - survey submissions.
   * @returns {Array} - surveys submissions data.
   */

function _surveySubmissions(surveySubmissions) {

    let submissions = {};

    surveySubmissions.forEach(submission=>{
        
        if ( !submissions[submission.surveyId.toString()]) {
            submissions[submission.surveyId.toString()] = {}
            submissions[submission.surveyId.toString()]["submissions"] = []
        }
        
        submissions[submission.surveyId.toString()]["submissions"].push({ 
                "_id" : submission._id,
                "status" : submission.status,
                "createdAt" : submission.createdAt,
                "updatedAt" : submission.updatedAt,
                "name" : submission.name,
                "surveyId" : submission.surveyId,
                "submissionDate" : submission.completedDate ? submission.completedDate : "",
                "endDate" : submission.endDate
        })

    })

    return submissions;
}
