/**
 * name : userExtension/helper.js
 * author : Akash
 * created-date : 01-feb-2019
 * Description : User extension helper related functionality.
 */

// Dependencies
const userRolesHelper = require(MODULES_BASE_PATH + "/userRoles/helper");
const entityTypesHelper = require(MODULES_BASE_PATH + "/entityTypes/helper");
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");
const shikshalokamGenericHelper = require(ROOT_PATH + "/generics/helpers/shikshalokam");
const elasticSearchData = require(ROOT_PATH + "/generics/helpers/elasticSearch");
const programsHelper = require(MODULES_BASE_PATH + "/programs/helper");

/**
    * UserExtensionHelper
    * @class
*/

module.exports = class UserExtensionHelper {

    /**
   * Get profile with entity details
   * @method
   * @name profileWithEntityDetails
   * @param {Object} filterQueryObject - filtered data.
   * @returns {Object} 
   */

    static profileWithEntityDetails(filterQueryObject) {
        return new Promise(async (resolve, reject) => {
            try {

                const entityTypesArray = await entityTypesHelper.list({}, {
                    name: 1,
                    immediateChildrenEntityType: 1
                });

                let enityTypeToImmediateChildrenEntityMap = {};

                if (entityTypesArray.length > 0) {
                    entityTypesArray.forEach(entityType => {
                        enityTypeToImmediateChildrenEntityMap[entityType.name] = (entityType.immediateChildrenEntityType && entityType.immediateChildrenEntityType.length > 0) ? entityType.immediateChildrenEntityType : [];
                    })
                }

                let queryObject = [
                    {
                        $match: filterQueryObject
                    },
                    {
                        $lookup: {
                            "from": "entities",
                            "localField": "roles.entities",
                            "foreignField": "_id",
                            "as": "entityDocuments"
                        }
                    },
                    {
                        $lookup: {
                            "from": "userRoles",
                            "localField": "roles.roleId",
                            "foreignField": "_id",
                            "as": "roleDocuments"
                        }
                    },
                    {
                        $project: {
                            "externalId": 1,
                            "roles": 1,
                            "roleDocuments._id": 1,
                            "roleDocuments.code": 1,
                            "roleDocuments.title": 1,
                            "entityDocuments._id": 1,
                            "entityDocuments.metaInformation.externalId": 1,
                            "entityDocuments.metaInformation.name": 1,
                            "entityDocuments.groups": 1,
                            "entityDocuments.entityType": 1,
                            "entityDocuments.entityTypeId": 1,
                            "improvementProjects" : 1
                        }
                    }
                ];

                let userExtensionData = await database.models.userExtension.aggregate(queryObject);
                let relatedEntities = [];

                if (userExtensionData[0]) {

                    let roleMap = {};

                    if( 
                        userExtensionData[0].entityDocuments && 
                        userExtensionData[0].entityDocuments.length >0 
                    ) {
                        
                        let projection = [
                            entitiesHelper.entitiesSchemaData().SCHEMA_METAINFORMATION+".externalId", 
                            entitiesHelper.entitiesSchemaData().SCHEMA_METAINFORMATION+".name", 
                            entitiesHelper.entitiesSchemaData().SCHEMA_METAINFORMATION+".addressLine1",
                            entitiesHelper.entitiesSchemaData().SCHEMA_METAINFORMATION+".addressLine2",
                            entitiesHelper.entitiesSchemaData().SCHEMA_METAINFORMATION+".administration",
                            entitiesHelper.entitiesSchemaData().SCHEMA_METAINFORMATION+".city",
                            entitiesHelper.entitiesSchemaData().SCHEMA_METAINFORMATION+".country",
                            entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_TYPE_ID,
                            entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_TYPE
                        ];

                        relatedEntities = 
                        await entitiesHelper.relatedEntities(
                        userExtensionData[0].entityDocuments[0]._id, 
                        userExtensionData[0].entityDocuments[0].entityTypeId, 
                        userExtensionData[0].entityDocuments[0].entityType, 
                        projection
                        );
                    }

                    if ( 
                        userExtensionData[0].roleDocuments && 
                        userExtensionData[0].roleDocuments.length > 0 
                    ) {

                        userExtensionData[0].roleDocuments.forEach(role => {
                            roleMap[role._id.toString()] = role;
                        })
                        let entityMap = {};
                        
                        userExtensionData[0].entityDocuments.forEach(entity => {
                            entity.metaInformation.childrenCount = 0;
                            entity.metaInformation.entityType = entity.entityType;
                            entity.metaInformation.entityTypeId = entity.entityTypeId;
                            entity.metaInformation.subEntityGroups = new Array;

                            Array.isArray(enityTypeToImmediateChildrenEntityMap[entity.entityType]) && enityTypeToImmediateChildrenEntityMap[entity.entityType].forEach(immediateChildrenEntityType => {
                                if (entity.groups && entity.groups[immediateChildrenEntityType]) {
                                    entity.metaInformation.immediateSubEntityType = immediateChildrenEntityType;
                                    entity.metaInformation.childrenCount = entity.groups[immediateChildrenEntityType].length;
                                }
                            })

                            entity.groups && Array.isArray(Object.keys(entity.groups)) && Object.keys(entity.groups).forEach(subEntityType => {
                                entity.metaInformation.subEntityGroups.push(subEntityType);
                            })

                            entityMap[entity._id.toString()] = entity;
                        })

                        for (
                            let userExtensionRoleCounter = 0; 
                            userExtensionRoleCounter < userExtensionData[0].roles.length; 
                            userExtensionRoleCounter++
                        ) {
                            if (userExtensionData[0].roles[userExtensionRoleCounter]["entities"] && userExtensionData[0].roles[userExtensionRoleCounter].entities.length > 0) {
                                for (
                                    let userExtenionRoleEntityCounter = 0;
                                    userExtenionRoleEntityCounter < userExtensionData[0].roles[userExtensionRoleCounter].entities.length;
                                    userExtenionRoleEntityCounter++
                                ) {
                                    userExtensionData[0].roles[userExtensionRoleCounter].entities[userExtenionRoleEntityCounter] = {
                                        _id: entityMap[userExtensionData[0].roles[userExtensionRoleCounter].entities[userExtenionRoleEntityCounter].toString()]._id,
                                        ...entityMap[userExtensionData[0].roles[userExtensionRoleCounter].entities[userExtenionRoleEntityCounter].toString()].metaInformation
                                    };
                                }
                                roleMap[userExtensionData[0].roles[userExtensionRoleCounter].roleId.toString()].immediateSubEntityType = (userExtensionData[0].roles[userExtensionRoleCounter].entities[0] && userExtensionData[0].roles[userExtensionRoleCounter].entities[0].entityType) ? userExtensionData[0].roles[userExtensionRoleCounter].entities[0].entityType : "";
                                roleMap[userExtensionData[0].roles[userExtensionRoleCounter].roleId.toString()].entities = userExtensionData[0].roles[userExtensionRoleCounter].entities;
                            }
                        }
                    }

                    let aclInformation = await this.roleBasedAclInformation(
                        userExtensionData[0].roles
                    );

                    return resolve(
                        _.merge(_.omit(
                            userExtensionData[0], 
                            [
                            this.userExtensionSchemaData().USER_EXTENSION_ROLE,
                            this.userExtensionSchemaData().USER_EXTENSION_ENTITY_DOCUMENTS,
                            this.userExtensionSchemaData().USER_EXTENSION_ROLE_DOCUMENTS 
                            ]), 
                        { roles: _.isEmpty(roleMap) ? [] : Object.values(roleMap) },
                        { relatedEntities : relatedEntities },
                        { acl : aclInformation }
                    )
                    );
                } else {
                    return resolve({});
                }
            } catch (error) {
                return reject(error);
            }
        })


    }

    /**
   * Bulk create or update user.
   * @method
   * @name bulkCreateOrUpdate
   * @param {Array} userRolesCSVData
   * @param {Object} userDetails -logged in user details.
   * @param {String} userDetails.id -logged in user id.  
   * @returns {Array} 
   */

    static bulkCreateOrUpdate(userRolesCSVData, userDetails) {

        return new Promise(async (resolve, reject) => {
            try {

                let userRolesUploadedData = new Array;

                const userRolesArray = await userRolesHelper.list({
                    status: "active",
                    isDeleted: false
                }, {
                        code: 1,
                        title: 1,
                        entityTypes: 1,
                        isAPlatformRole: 1
                });

                let userRoleMap = {};
                let userRoleAllowedEntityTypes = {};

                userRolesArray.forEach(userRole => {
                    userRoleMap[userRole.code] = {
                        roleId: userRole._id,
                        code: userRole.code,
                        entities: [],
                        isAPlatformRole: userRole.isAPlatformRole
                    };
                    userRoleAllowedEntityTypes[userRole.code] = new Array;
                    if (userRole.entityTypes && userRole.entityTypes.length > 0) {
                        userRole.entityTypes.forEach(entityType => {
                            userRoleAllowedEntityTypes[userRole.code].push(entityType.entityTypeId);
                        })
                    }
                })

                let userToKeycloakIdMap = {};
                let userKeycloakId = "";
                // let userRole;
                // let existingEntity;
                // let existingUserRole;
                const keycloakUserIdIsMandatoryInFile = 
                (process.env.DISABLE_LEARNER_SERVICE_ON_OFF && process.env.DISABLE_LEARNER_SERVICE_ON_OFF == "ON") ? "true" : false;

                for (
                    let csvRowNumber = 0; 
                    csvRowNumber < userRolesCSVData.length; 
                    csvRowNumber++
                ) {
                    
                    let removeUserFromEntity = false;

                    let userRole = gen.utils.valueParser(userRolesCSVData[csvRowNumber]);
                    userRole["_SYSTEM_ID"] = "";
                    aclData(userRole);

                    try {

                        if (userRole.role && !userRoleMap[userRole.role]) {
                            userRole["_SYSTEM_ID"] = "";
                            userRole.status = messageConstants.apiResponses.INVALID_ROLE_CODE;
                            userRolesUploadedData.push(userRole);
                            continue;
                        }

                        if (
                            userRole.platform_role && 
                            (
                                !userRoleMap[userRole.platform_role] ||
                                !userRoleMap[userRole.platform_role].isAPlatformRole
                            )
                        ) {
                            userRole["_SYSTEM_ID"] = "";
                            userRole.status = messageConstants.apiResponses.INVALID_ROLE_CODE;
                            delete userRoleMap[userRole.platform_role].isAPlatformRole;
                            userRolesUploadedData.push(userRole);
                            continue;
                        }

                        if (userToKeycloakIdMap[userRole.user]) {
                            userKeycloakId = userToKeycloakIdMap[userRole.user];
                        } else {
                            if (keycloakUserIdIsMandatoryInFile) {
                                if (!userRole["keycloak-userId"] || userRole["keycloak-userId"] == "") {
                                    throw messageConstants.apiResponses.KEYCLOAK_USER_ID;
                                }
                                userKeycloakId = userRole["keycloak-userId"]
                                userToKeycloakIdMap[userRole.user] = userRole["keycloak-userId"];
                            } else {
                                let keycloakUserId = await shikshalokamGenericHelper.getKeycloakUserIdByLoginId(userDetails.userToken, userRole.user);

                                if (keycloakUserId && keycloakUserId.length > 0 && keycloakUserId[0].userLoginId) {
                                    userKeycloakId = keycloakUserId[0].userLoginId;
                                    userToKeycloakIdMap[userRole.user] = keycloakUserId[0].userLoginId;
                                } else {
                                    throw messageConstants.apiResponses.USER_ENTITY_ID;
                                }
                            }
                        }

                        if (userRole.entity) {
                            
                            let entityQueryObject = {
                                _id: userRole.entity
                            };

                            if (userRoleAllowedEntityTypes[userRole.role] && userRoleAllowedEntityTypes[userRole.role].length > 0) {
                                entityQueryObject.entityTypeId = {
                                    $in: userRoleAllowedEntityTypes[userRole.role]
                                };
                            }
                        
                            const entityDetails = await entitiesHelper.entityDocuments(
                                entityQueryObject,
                                ["_id"]
                            );

                            if (!entityDetails.length > 0) {
                                userRole["_SYSTEM_ID"] = "";
                                userRole.status = messageConstants.apiResponses.INVALID_ENTITY_ID;
                                userRolesUploadedData.push(userRole);
                                continue;
                            }

                        }

                        let programIds = [];

                        if (userRole.programs && userRole.programs.length > 0) {
                            const programDocuments = 
                            await programsHelper.list({
                                externalId : { $in : userRole.programs } 
                            },["_id"]);

                            if ( !programDocuments.length > 0 ) {
                                userRole["_SYSTEM_ID"] = "";
                                userRole.status = messageConstants.apiResponses.PROGRAM_NOT_FOUND;
                                userRolesUploadedData.push(userRole);
                                continue;
                            }

                            programIds = programDocuments.map(program => {
                                return program._id;
                            });
                        }

                        let existingUser = await this.userExtensionDocuments(
                            {userId: userKeycloakId},
                            ["roles","platformRoles"]
                        );

                        let user = "";
                        existingUser = existingUser[0];
                        
                        if (!existingUser) {

                            let userInformation = {
                                "userId": userKeycloakId,
                                "externalId": userRole.user,
                                "status": "active",
                                "updatedBy": userDetails.id,
                                "createdBy": userDetails.id
                            };


                            if (userRole.entityOperation) {
                                userInformation["roles"] = [{
                                    roleId: userRoleMap[userRole.role].roleId,
                                    code: userRoleMap[userRole.role].code,
                                    entities:  [ObjectId(userRole.entity)],
                                    acl: userRole.acl
                                }];
                            }

                            if (userRole.programOperation) {
                                userInformation["platformRoles"] = [{
                                    roleId: userRoleMap[userRole.platform_role].roleId,
                                    code: userRoleMap[userRole.platform_role].code,
                                    programs: programIds
                                }];
                            }

                            user = await database.models.userExtension.create(
                                userInformation
                            );

                            if (user._id) {
                                userRole["_SYSTEM_ID"] = user._id;
                                userRole.status = "Success";
                            } else {
                                userRole["_SYSTEM_ID"] = "";
                                userRole.status = "Failed to create the user role.";
                            }
                        } else {

                            let updateQuery = {};

                            if (userRole.entityOperation) {
                                
                                let userRoleToUpdate;

                                if (existingUser.roles && existingUser.roles.length > 0) {
                                    userRoleToUpdate = _.findIndex(existingUser.roles, { 'code': userRole.role });
                                }

                                if (!(userRoleToUpdate >= 0)) {
                                    userRoleToUpdate = existingUser.roles.length;
                                    userRoleMap[userRole.role].entities = new Array;
                                    existingUser.roles.push(userRoleMap[userRole.role]);
                                }

                                existingUser.roles[userRoleToUpdate].entities = 
                                existingUser.roles[userRoleToUpdate].entities.map(
                                    eachEntity => eachEntity.toString()
                                );

                                if (userRole.entityOperation == "OVERRIDE") {

                                    existingUser.roles[userRoleToUpdate].entities = [userRole.entity];
                                    existingUser.roles[userRoleToUpdate].acl = userRole.acl;

                                } else if (userRole.entityOperation == "APPEND" || userRole.entityOperation == "ADD") {

                                    existingUser.roles[userRoleToUpdate].entities.push(userRole.entity);
                                    existingUser.roles[userRoleToUpdate].entities = _.uniq(existingUser.roles[userRoleToUpdate].entities);

                                } else if (userRole.entityOperation == "REMOVE") {

                                    _.pull(existingUser.roles[userRoleToUpdate].entities, userRole.entity);
                                    removeUserFromEntity = true;
                                }

                                existingUser.roles[userRoleToUpdate].entities = existingUser.roles[userRoleToUpdate].entities.map(eachEntity => ObjectId(eachEntity));
                                updateQuery["roles"] = existingUser.roles;
                            } 
                            
                            if (userRole.programOperation) {

                                let userPlatformRoleToUpdate;

                                if (existingUser.platformRoles && existingUser.platformRoles.length > 0) {
                                    userPlatformRoleToUpdate = _.findIndex(existingUser.platformRoles, { 'code': userRole.platform_role });
                                }

                                if (!(userPlatformRoleToUpdate >= 0)) {
                                    userPlatformRoleToUpdate = existingUser.platformRoles.length;
                                    userRoleMap[userRole.platform_role].programs = new Array;
                                    existingUser.platformRoles.push(userRoleMap[userRole.platform_role]);
                                }

                                existingUser.platformRoles[userPlatformRoleToUpdate].programs = 
                                existingUser.platformRoles[userPlatformRoleToUpdate].programs.map(
                                    program => program.toString()
                                );
                                
                                if (userRole.programOperation == "OVERRIDE") {
                                    existingUser.platformRoles[userPlatformRoleToUpdate].programs = programIds;
                                } else if (userRole.programOperation == "APPEND" || userRole.programOperation == "ADD") {
                                    
                                    existingUser.platformRoles[userPlatformRoleToUpdate].programs =
                                    existingUser.platformRoles[userPlatformRoleToUpdate].programs.concat(programIds);
                                    existingUser.platformRoles[userPlatformRoleToUpdate].programs = 
                                    _.uniq(existingUser.platformRoles[userPlatformRoleToUpdate].programs);

                                } else if (userRole.programOperation == "REMOVE") {

                                    if (programIds.length > 0 ) {
                                        programIds.forEach(programId => {
                                            _.pull(existingUser.platformRoles[userPlatformRoleToUpdate].programs,programId.toString());
                                        })
                                    }
                                }

                                existingUser.platformRoles[userPlatformRoleToUpdate].programs = existingUser.platformRoles[userPlatformRoleToUpdate].programs.map(eachProgram => ObjectId(eachProgram));

                                updateQuery["platformRoles"] = existingUser.platformRoles;
                            }

                            user =
                            await database.models.userExtension.findOneAndUpdate(
                                {
                                    _id: existingUser._id
                                },
                                updateQuery,
                                {
                                    new : true,
                                    returnNewDocument : true
                                }
                            );

                            userRole["_SYSTEM_ID"] = existingUser._id;
                            userRole.status = "Success";
                        }

                        let entityObject = {};

                        if (removeUserFromEntity) {
                            entityObject.entityId = userRole.entity;
                            entityObject.role = userRole.role;
                        }
                      
                        await this.pushUserToElasticSearch(user._doc, entityObject);

                    } catch (error) {
                        userRole.status = (error && error.message) ? error.message : error;
                    }

                    userRolesUploadedData.push(userRole);
                }

                return resolve(userRolesUploadedData);

            } catch (error) {
                return reject(error)
            }
        })

    }

    /**
   * Get entities for logged in user.
   * @method
   * @name getUserEntities
   * @param {String} [userId = false] -logged in user id.
   * @param {String} userDetails.id -logged in user id.  
   * @returns {Array} list of entities
   */

    static getUserEntities(userId = false) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!userId) {
                    throw messageConstants.apiResponses.USER_ID_REQUIRED_CHECK;
                }

                let userExtensionDoument = await database.models.userExtension.findOne({
                    userId: userId
                }, { roles: 1 }).lean();

                if (!userExtensionDoument) {
                    throw { 
                        status: httpStatusCode.bad_request.status, 
                        message: messageConstants.apiResponses.USER_EXTENSION_NOT_FOUND 
                    };
                }

                let entities = [];

                for (
                    let pointerToUserExtension = 0; 
                    pointerToUserExtension < userExtensionDoument.roles.length; 
                    pointerToUserExtension++
                ) {
                    entities = _.concat(
                        entities, 
                        userExtensionDoument.roles[pointerToUserExtension].entities
                    );
                }

                return resolve(entities);

            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
   * Role based acl information
   * @method
   * @name roleBasedAclInformation
   * @param {String} roles - user roles
   * @returns {object}  
   */

  static roleBasedAclInformation( roles ) {
    return new Promise(async (resolve, reject) => {
        try {

            let aclInformation = {};

            for( let role = 0; role < roles.length ; role ++ ) {
                
                if( !aclInformation[roles[role].code] ) {
                    aclInformation[roles[role].code] = {};
                }

                if( roles[role].acl ) {
                    aclInformation[roles[role].code] = roles[role].acl;
                }
            }


            return resolve(aclInformation);

        } catch (error) {
            return reject(error);
        }
    })
  }

    /**
   * user access control list
   * @method
   * @name userAccessControlList
   * @param {String} userId - logged in user id.
   * @returns {object}  
   */

  static userAccessControlList( userId ) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId) {
                throw {
                    status : httpStatusCode.bad_request.status,
                    message : messageConstants.apiResponses.USER_ID_REQUIRED_CHECK
                }
            }

            let userExtensionDoument = await database.models.userExtension.findOne({
                userId: userId
            }, { "roles.acl" : 1 }).lean();

            if (!userExtensionDoument) {
                return resolve({
                    success : false
                });
            }

            let acl = {};

            for (
                let pointerToUserExtension = 0; 
                pointerToUserExtension < userExtensionDoument.roles.length; 
                pointerToUserExtension++
            ) {

                let currentUserRole = userExtensionDoument.roles[pointerToUserExtension];

                if( currentUserRole.acl ) {
                    
                    let aclKeys = 
                    Object.keys(currentUserRole.acl);
    
                    for( let aclKey = 0; aclKey < aclKeys.length ; aclKey ++ ) {
                        let currentAclKey = aclKeys[aclKey];
    
                        if ( !acl[currentAclKey] ) {
                            acl[currentAclKey] = [];
                        }
    
                        if ( currentUserRole.acl[aclKeys[aclKey]].tags ) {
                            acl[currentAclKey] = _.union(
                                acl[currentAclKey],
                                currentUserRole.acl[aclKeys[aclKey]].tags
                            )
                            
                        }
                    }
                }

            }

            return resolve({
                success : true,
                acl : acl
            });

        } catch (error) {
            return reject(error);
        }
    })
  }

    /**
   * Get user entity universe by entity type.
   * @method
   * @name getUserEntitiyUniverseByEntityType
   * @param {String} [userId = false] -logged in user id.
   * @param {String} [entityType = false] - entity type.  
   * @returns {Array} list of all entities. 
   */

    static getUserEntitiyUniverseByEntityType(userId = false, entityType = false) {
        return new Promise(async (resolve, reject) => {
            try {
                if ( !userId ) {
                    throw messageConstants.apiResponses.USER_ID_REQUIRED_CHECK;
                }

                if ( !entityType ) {
                    throw messageConstants.apiResponses.ENTITY_ID_REQUIRED_CHECK;
                }

                let allEntities = new Array;

                let userExtensionEntities = await this.getUserEntities(userId);

                if ( !userExtensionEntities.length > 0 ) {
                    resolve(allEntities);
                } else {
                    allEntities = userExtensionEntities;
                }


                let entitiesFound = await entitiesHelper.entityDocuments({
                    _id: { $in: allEntities },
                    entityType: entityType
                }, [entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_OBJECT_ID]);


                if ( entitiesFound.length > 0 ) {
                    entitiesFound.forEach(eachEntityData => {
                        allEntities.push(eachEntityData._id);
                    });
                }

                let findQuery = {
                    _id: { $in: userExtensionEntities },
                    entityType: { $ne: entityType }
                };

                let groups = entitiesHelper.entitiesSchemaData().SCHEMA_ENTITY_GROUP;
                findQuery[`${groups}.${entityType}`] = { $exists: true };

                let remainingEntities = await entitiesHelper.entityDocuments(findQuery, [`${groups}.${entityType}`]);

                if (remainingEntities.length > 0) {
                    remainingEntities.forEach(eachEntityNotFound => {
                        allEntities = _.concat(allEntities, eachEntityNotFound.groups[entityType]);
                    })
                }

                return resolve(allEntities);

            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
    * Entities list 
    * @method
    * @name entities
    * @param userId - logged in user Id
    * @param entityType - entity type
    * @param pageSize - Page limit
    * @param pageNo - Page No
    * @param search - search data
    * @returns {JSON} List of entities of the given type. 
    */

  static entities( 
      userId,
      entityType,
      pageSize,
      pageNo,
      search
    ) {
    return new Promise(async (resolve, reject) => {
        try {

            let entities = 
            await this.getUserEntities(userId);

            if ( !entities.length > 0 ) {
                throw {
                    status : httpStatusCode.bad_request.status,
                    message : messageConstants.apiResponses.ENTITY_NOT_FOUND
                }
            }
            
            let entitiesFound = await entitiesHelper.entityDocuments({
                _id: { $in: entities },
                entityType: entityType
            }, ["_id"]);

            let allEntities = [];

            if ( entitiesFound.length > 0 ) {
                entitiesFound.forEach(eachEntityData => {
                    allEntities.push(eachEntityData._id);
                });
            }

            let findQuery = {
                _id: { $in: entities },
                entityType: { $ne: entityType },
                [`groups.${entityType}`] : { $exists: true }
            };

            let remainingEntities = 
            await entitiesHelper.entityDocuments(
                findQuery, 
                [`groups.${entityType}`]
            );
            
            if ( remainingEntities.length > 0 ) {
                remainingEntities.forEach(entity => {
                    allEntities = _.concat(
                        allEntities, 
                        entity.groups[entityType]
                    );
                })
            }
            
            if (!allEntities.length > 0) {
                throw { 
                    status: httpStatusCode.bad_request.status,
                    message: messageConstants.apiResponses.ENTITY_NOT_FOUND
                };
            }

            let queryObject = {
                $match : {
                    _id : { $in : allEntities }
                }
            };

            let userAccessControlList = await this.userAccessControlList(
                userId
            );

            if( 
                userAccessControlList.success &&
                userAccessControlList.acl[entityType] && 
                userAccessControlList.acl[entityType].length > 0 
            ) {
                queryObject["$match"]["metaInformation.tags"] = {
                    $in : userAccessControlList.acl[entityType]
                }
            }

            if ( search && search !== "" ) {
                queryObject["$match"]["$or"] = [
                    { "metaInformation.name": new RegExp(search, 'i') },
                    { "metaInformation.externalId": new RegExp("^" + search, 'm') },
                    { "metaInformation.addressLine1": new RegExp(search, 'i') },
                    { "metaInformation.addressLine2": new RegExp(search, 'i') }
                ]
            }

            let skippingValue = pageSize * (pageNo - 1);

            let result = await database.models.entities.aggregate([
                queryObject,
                {
                    $project: {
                        "metaInformation.externalId" : 1, 
                        "metaInformation.name" : 1, 
                        "metaInformation.addressLine1" : 1, 
                        "metaInformation.addressLine2" : 1, 
                        "metaInformation.administration" : 1, 
                        "metaInformation.city" : 1, 
                        "metaInformation.country" : 1, 
                        "entityTypeId" : 1, 
                        "entityType" : 1
                    }
                },
                {
                    $facet : {
                        "totalCount" : [
                            { "$count" : "count" }
                        ],
                        "data" : [
                            { $skip : skippingValue },
                            { $limit : pageSize }
                        ],
                    }
                }, {
                    $project : {
                        "data" : 1,
                        "count" : {
                            $arrayElemAt : ["$totalCount.count", 0]
                        }
                    }
                }
            ]);

            return resolve({
                message: messageConstants.apiResponses.USER_EXTENSION_ENTITIES_FETCHED,
                result: result[0].data,
                count: result[0].count ? result[0].count : 0
            });

           
        } catch(error) {
            return reject(error);
        }
    })
    
  }

    /**
   * Default user extension schemas value.
   * @method
   * @name userExtensionSchemaData
   * @returns {JSON} List of default schemas. 
   */

  static userExtensionSchemaData() {
    return {
        "USER_EXTENSION_ROLE" : "roles",
        "USER_EXTENSION_ENTITY_DOCUMENTS" : "entityDocuments", 
        "USER_EXTENSION_ROLE_DOCUMENTS" : "roleDocuments"
    }
  }

    /**
   * Push user data to elastic search
   * @method
   * @name pushUserToElasticSearch
   * @name userData - created or modified user data.
   * @returns {Object} 
   */

  static pushUserToElasticSearch(userData, removeUserFromEntity= {}) {
    return new Promise(async (resolve, reject) => {
        try {

         let userInformation = _.pick(userData,[
                "_id",
                "status", 
                "isDeleted",
                "deleted",
                "roles",
                "userId",
                "externalId",
                "updatedBy",
                "createdBy",
                "updatedAt",
                "createdAt"
            ]);

           
            await elasticSearchData.createOrUpdate(
                userData.userId,
                process.env.ELASTICSEARCH_USER_EXTENSION_INDEX,
                {
                    data : userInformation
                }
            );

            if (userInformation.roles.length > 0) {
                await entitiesHelper.updateUserRolesInEntitiesElasticSearch
                (
                    userInformation.roles,
                    userInformation.userId
                )
            }
            
            if (Object.keys(removeUserFromEntity).length > 0) {
                await entitiesHelper.deleteUserRoleFromEntitiesElasticSearch
                (
                    removeUserFromEntity.entityId,
                    removeUserFromEntity.role,
                    userInformation.userId
                )
            }

            return resolve({
                success : true
            });
            
        }
        catch(error) {
            return reject(error);
        }
    })

   }

   /**
    * Update userExtension document.
    * @method
    * @name updateUserExtensionDocument
    * @param {Object} query - query to find document
    * @param {Object} updateObject - fields to update
    * @returns {String} - message.
    */

   static updateUserExtensionDocument(query= {}, updateObject= {}) {
    return new Promise(async (resolve, reject) => {
        try {

            if (Object.keys(query).length == 0) {
                throw new Error(messageConstants.apiResponses.POLL_UPDATE_QUERY_REQUIRED)
            }

            if (Object.keys(updateObject).length == 0) {
                throw new Error (messageConstants.apiResponses.UPDATE_OBJECT_REQUIRED)
            }

            let updateResponse = await database.models.userExtension.updateOne
            (
                query,
                updateObject
            )
            
            if (updateResponse.nModified == 0) {
                throw new Error(messageConstants.apiResponses.USER_EXTENSION_COULD_NOT_BE_UPDATED)
            }

            return resolve({
                success: true,
                message: messageConstants.apiResponses.USER_EXTENSION_UPDATED,
                data: true
            });

        } catch (error) {
            return resolve({
                success: false,
                message: error.message,
                data: false
            });
        }
    });
}

 /**
   * find userExtensions
   * @method
   * @name userExtensionDocuments
   * @param {Array} [userExtensionFilter = "all"] - userId ids.
   * @param {Array} [fieldsArray = "all"] - projected fields.
   * @param {Array} [skipFields = "none"] - field not to include
   * @returns {Array} List of Users. 
   */
  
  static userExtensionDocuments(
    userExtensionFilter = "all", 
    fieldsArray = "all",
    skipFields = "none"
  ) {
    return new Promise(async (resolve, reject) => {
        try {
    
            let queryObject = (userExtensionFilter != "all") ? userExtensionFilter : {};
    
            let projection = {}
    
            if (fieldsArray != "all") {
                fieldsArray.forEach(field => {
                    projection[field] = 1;
                });
            }

            if( skipFields !== "none" ) {
              skipFields.forEach(field=>{
                projection[field] = 0;
              })
            }
    
            let userDocuments = 
            await database.models.userExtension.find(
              queryObject, 
              projection
            ).lean();
            
            return resolve(userDocuments);
            
        } catch (error) {
            return reject(error);
        }
    });
  }
};

 /**
   * Add access control list for user.
   * @method
   * @name aclData 
   * @param {Object} userRole 
   * @returns {JSON} added acl data inside user roles.
   */

function aclData(userRole) {
    let userRoleKeys = Object.keys(userRole);

    for( let userRoleKey = 0; userRoleKey < userRoleKeys.length ; userRoleKey ++) {
        let currentRoleKey = userRoleKeys[userRoleKey];

        if( currentRoleKey.startsWith("acl") ) {
            
            if( !userRole["acl"] ) {
                userRole["acl"] = {};
            }
            let aclData = currentRoleKey.split("_");

            userRole.acl[aclData[1]] = {
                tags : userRole[currentRoleKey].split(",")
            }
            delete userRole[currentRoleKey];
        }
    }
    return userRole;
}