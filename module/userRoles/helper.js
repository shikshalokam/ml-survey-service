/**
 * name : userRoles/helper.js
 * author : Akash
 * created-date : 01-feb-2019
 * Description : User roles related information.
 */

// Dependencies
const entityTypesHelper = require(MODULES_BASE_PATH + "/entityTypes/helper");

/**
    * UserRolesHelper
    * @class
*/

module.exports = class UserRolesHelper {

      /**
   * list user roles.
   * @method
   * @name list
   * @param {Object} filterQueryObject -filtered data.
   * @param {Object} projectionQueryObject -projected field. 
   * @returns {Object} list of user roles. 
   */

    static list(filterQueryObject, projectionQueryObject) {
        return new Promise(async (resolve, reject) => {
            try {

                let userRolesData = await database.models.userRoles.find(filterQueryObject,projectionQueryObject).lean();

                return resolve(userRolesData);

            } catch (error) {
                return reject(error);
            }
        })


    }

    /**
   * Upload user roles via csv.
   * @method
   * @name bulkCreate
   * @param {Array} userRolesCSVData
   * @param {Object} userDetails -logged in user data.
   * @param {String} userDetails.id -logged in user id.   
   * @returns {Object} consists of SYSTEM_ID
   */

    static bulkCreate(userRolesCSVData,userDetails) {

        return new Promise(async (resolve, reject) => {
            try {

                let entityTypeNameToEntityTypeMap = await this.getEntityTypeToIdMap();

                const userRolesUploadedData = await Promise.all(
                    userRolesCSVData.map(async userRole => {

                        try {
                            
                            userRole = gen.utils.valueParser(userRole);

                            if(userRole.entityTypes != "") {
                                let roleEntityTypes = userRole.entityTypes.split(",");
                                roleEntityTypes = _.uniq(roleEntityTypes);

                                userRole.entityTypes = new Array;

                                roleEntityTypes.forEach(entityType => {
                                    if(entityTypeNameToEntityTypeMap[entityType]) {
                                        userRole.entityTypes.push(entityTypeNameToEntityTypeMap[entityType]);
                                    } else {
                                        throw messageConstants.apiResponses.INVALID_ENTITY_TYPE;
                                    }
                                })
                            } else {
                                delete userRole.entityTypes;
                            }

                            if (userRole.platformRole && gen.utils.convertStringToBoolean(userRole.platformRole)) {
                                userRole["isAPlatformRole"] = true;
                                delete userRole.platformRole;
                            }

                            let newRole = await database.models.userRoles.create(
                                _.merge({
                                    "status" : "active",
                                    "updatedBy": userDetails.id,
                                    "createdBy": userDetails.id
                                },userRole)
                            );

                            delete userRole.entityTypes;

                            if (newRole._id) {
                                userRole["_SYSTEM_ID"] = newRole._id; 
                                userRole.status = "Success";
                            } else {
                                userRole["_SYSTEM_ID"] = "";
                                userRole.status = "Failed";
                            }

                        } catch (error) {
                            userRole["_SYSTEM_ID"] = "";
                            userRole.status = (error && error.message) ? error.message : error;
                        }


                        return userRole;
                    })
                )


                return resolve(userRolesUploadedData);

            } catch (error) {
                return reject(error);
            }
        })

    }

    /**
   * Update user roles via csv.
   * @method
   * @name bulkUpdate
   * @param {Array} userRolesCSVData
   * @param {Object} userDetails -logged in user data.
   * @param {String} userDetails.id -logged in user id.   
   * @returns {Object} consists of SYSTEM_ID
   */

    static bulkUpdate(userRolesCSVData,userDetails) {

        return new Promise(async (resolve, reject) => {
            try {

                let entityTypeNameToEntityTypeMap = await this.getEntityTypeToIdMap();

                const userRolesUploadedData = await Promise.all(
                    userRolesCSVData.map(async userRole => {

                        try {
                            
                            userRole = gen.utils.valueParser(userRole);

                            if(userRole.entityTypes != "") {
                                let roleEntityTypes = userRole.entityTypes.split(",");
                                roleEntityTypes = _.uniq(roleEntityTypes);
    
                                userRole.entityTypes = new Array;
    
                                roleEntityTypes.forEach(entityType => {
                                    if(entityTypeNameToEntityTypeMap[entityType]) {
                                        userRole.entityTypes.push(entityTypeNameToEntityTypeMap[entityType]);
                                    } else {
                                        throw messageConstants.apiResponses.INVALID_ENTITY_TYPE;
                                    }
                                })
                            } else {
                                delete userRole.entityTypes;
                            }

                            if (userRole.hasOwnProperty("platformRole") && userRole.platformRole !== "") {

                                userRole["isAPlatformRole"] = false;
                                if (gen.utils.convertStringToBoolean(userRole.platformRole)) {
                                    userRole["isAPlatformRole"] = true;
                                }

                                delete userRole.platformRole;
                            }

                            let updateRole = await database.models.userRoles.findOneAndUpdate(
                                {
                                    code : userRole.code
                                },
                                _.merge({
                                    "updatedBy": userDetails.id
                                },userRole)
                            );

                            delete userRole.entityTypes;
                            
                            if (updateRole._id) {
                                userRole["_SYSTEM_ID"] = updateRole._id; 
                                userRole.status = "Success";
                            } else {
                                userRole["_SYSTEM_ID"] = "";
                                userRole.status = "Failed";
                            }

                        } catch (error) {
                            userRole["_SYSTEM_ID"] = "";
                            userRole.status = (error && error.message) ? error.message : error;
                        }


                        return userRole;
                    })
                )


                return resolve(userRolesUploadedData);

            } catch (error) {
                return reject(error);
            }
        })

    }


    /**
   * Entity type to id.
   * @method
   * @name getEntityTypeToIdMap   
   * @returns {Object}
   */

    static getEntityTypeToIdMap() {

        return new Promise(async (resolve, reject) => {
            try {

                let entityTypeList = await entityTypesHelper.list({},{name:1});
            
                let entityTypeNameToEntityTypeMap = {};
            
                entityTypeList.forEach(entityType => {
                    entityTypeNameToEntityTypeMap[entityType.name] = {
                        entityTypeId: entityType._id,
                        entityType:entityType.name
                    };
                });
                
                return resolve(entityTypeNameToEntityTypeMap);

            } catch (error) {
                return reject(error)
            }
        })

    }

};