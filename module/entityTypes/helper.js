/**
 * name : entityTyes/helper.js
 * author : Akash
 * created-date : 22-Feb-2019
 * Description : Entity types related helper functionality.
 */

 /**
    * EntityTypesHelper
    * @class
*/
module.exports = class EntityTypesHelper {

    /**
      * List of all entity types.
      * @method
      * @name list
      * @param {Object} [queryParameter = "all"] - Filtered query data.
      * @param {Object} [projection = {}] - Projected data.   
      * @returns {Object} returns a entity types list from the filtered data.
     */

    static list(queryParameter = "all", projection = {}) {
        return new Promise(async (resolve, reject) => {
            try {

                if( queryParameter === "all" ) {
                    queryParameter = {};
                };

                let entityTypeData = 
                await database.models.entityTypes.find(queryParameter, projection).lean();

                return resolve(entityTypeData);

            } catch (error) {
                return reject(error);
            }
        })

    }

    /**
      * List of entity types which can be observed in a state.
      * @method
      * @name canBeObserved
      * @param {String} stateId
      * @returns {Object} returns list of all entity type which can be observed in a state.
     */

    static canBeObserved( stateId ) {
        return new Promise(async (resolve, reject) => {
            try {

                let observableEntityTypes = 
                await this.list(
                    { 
                        isObservable: true 
                    }, { 
                        name: 1 
                    }
                );

                if ( stateId ) {

                    let entityDocument = await database.models.entities.findOne(
                        {
                            _id : stateId
                        },{
                            childHierarchyPath : 1
                        }
                    ).lean();

                    if ( !entityDocument ) {
                        return resolve(
                            {
                                status : httpStatusCode.bad_request.status,
                                message : messageConstants.apiResponses.ENTITY_NOT_FOUND
                            }
                        );
                    }

                    let result = [];

                    if( 
                        entityDocument.childHierarchyPath && 
                        entityDocument.childHierarchyPath.length > 0 
                    ) {
                        
                        observableEntityTypes.forEach(entityType=>{
                            
                            if( 
                                entityDocument.childHierarchyPath.includes(entityType.name) 
                            ) {
                                result.push(entityType);
                            }
                        })
                    }

                    observableEntityTypes = result;
                }

                return resolve({
                    message : messageConstants.apiResponses.ENTITY_TYPES_FETCHED,
                    result : observableEntityTypes
                });

            } catch (error) {
                return reject(error);
            }
        })

    }

     /**
   * Upload entity types via csv.
   * @method
   * @name bulkCreate
   * @param {Array} entityTypesCSVData
   * @param {Object} userDetails -logged in user data.
   * @param {String} userDetails.id -logged in user id.   
   * @returns {Object} consists of SYSTEM_ID
   */

    static bulkCreate(entityTypesCSVData,userDetails) {

        return new Promise(async (resolve, reject) => {
            try {

                const entityTypesUploadedData = await Promise.all(
                    entityTypesCSVData.map(async entityType => {

                        try {

                            entityType = gen.utils.valueParser(entityType);
                            entityType.regsitryDetails = {};
                            let removedKeys = []
                            Object.keys(entityType).forEach(function(eachKey){
                                if(eachKey.startsWith('registry-')){
                                    let newKey = eachKey.replace('registry-', '');
                                    entityType.regsitryDetails[newKey] = entityType[eachKey];
                                    removedKeys.push(entityType[eachKey]);
                                }
                            })

                            if(entityType.profileFields){
                                entityType.profileFields = entityType.profileFields.split(",") || [];
                            }

                            if(entityType.immediateChildrenEntityType != "" && entityType.immediateChildrenEntityType != undefined){
                                let entityTypeImmediateChildren = entityType.immediateChildrenEntityType.split(",");
                                entityTypeImmediateChildren = _.uniq(entityTypeImmediateChildren);

                                entityType.immediateChildrenEntityType = new Array;
                                entityTypeImmediateChildren.forEach(immediateChildren => {
                                    entityType.immediateChildrenEntityType.push(immediateChildren);
                                })
                            }

                            if (entityType.isObservable) {
                                entityType.isObservable = gen.utils.convertStringToBoolean(entityType.isObservable);
                            }
                            if (entityType.toBeMappedToParentEntities) {
                                entityType.toBeMappedToParentEntities = gen.utils.convertStringToBoolean(entityType.toBeMappedToParentEntities);
                            }

                            if(removedKeys && removedKeys.length > 0){
                                for (var key in entityType) {
                                    for( var removedKey in removedKeys){
                                        if (entityType.hasOwnProperty(removedKey)) {
                                            delete entityType[removedKey];
                                        } 
                                    }

                                }
                            }                          

                            let newEntityType = await database.models.entityTypes.create(
                                _.merge({
                                    "isDeleted" : false,
                                    "updatedBy": userDetails.id,
                                    "createdBy": userDetails.id
                                },entityType)
                            );

                            delete entityType.regsitryDetails;

                            if (newEntityType._id) {
                                entityType["_SYSTEM_ID"] = newEntityType._id; 
                                entityType.status = "Success";
                            } else {
                                entityType["_SYSTEM_ID"] = "";
                                entityType.status = "Failed";
                            }

                        } catch (error) {
                            entityType["_SYSTEM_ID"] = "";
                            entityType.status = (error && error.message) ? error.message : error;
                        }

                        return entityType;
                    })
                )

                return resolve(entityTypesUploadedData);

            } catch (error) {
                return reject(error);
            }
        })

    }

    /**
   * Upload entity types via csv.
   * @method
   * @name bulkUpdate
   * @param {Array} entityTypesCSVData
   * @param {Object} userDetails -logged in user data.
   * @param {String} userDetails.id -logged in user id.   
   * @returns {Object} consists of SYSTEM_ID
   */

    static bulkUpdate(entityTypesCSVData,userDetails) {

        return new Promise(async (resolve, reject) => {
            try {

                const entityTypesUploadedData = await Promise.all(
                    entityTypesCSVData.map(async entityType => {

                        try {

                            entityType = gen.utils.valueParser(entityType);
                            entityType.regsitryDetails = {};
                            let removedKeys = []
                            Object.keys(entityType).forEach(function(eachKey){
                                if(eachKey.startsWith('registry-')){
                                    let newKey = eachKey.replace('registry-', '');
                                    entityType.regsitryDetails[newKey] = entityType[eachKey];
                                    removedKeys.push(entityType[eachKey]);
                                }
                            })

                            if(entityType.profileFields){
                                entityType.profileFields = entityType.profileFields.split(",") || [];
                            }

                            if(entityType.immediateChildrenEntityType != ""){
                                let entityTypeImmediateChildren = entityType.immediateChildrenEntityType.split(",");
                                entityTypeImmediateChildren = _.uniq(entityTypeImmediateChildren);

                                entityType.immediateChildrenEntityType = new Array;
                                entityTypeImmediateChildren.forEach(immediateChildren => {
                                    entityType.immediateChildrenEntityType.push(immediateChildren);
                                })
                            }

                            if (entityType.isObservable) {
                                entityType.isObservable = gen.utils.convertStringToBoolean(entityType.isObservable);
                            }
                            if (entityType.toBeMappedToParentEntities) {
                                entityType.toBeMappedToParentEntities = gen.utils.convertStringToBoolean(entityType.toBeMappedToParentEntities);
                            }

                            if(removedKeys && removedKeys.length > 0){
                                for (var key in entityType) {
                                    for( var removedKey in removedKeys){
                                        if (entityType.hasOwnProperty(removedKey)) {
                                            delete entityType[removedKey];
                                        } 
                                    }

                                }
                            }                          

                            let updateEntityType  = await database.models.entityTypes.findOneAndUpdate(
                                {
                                    _id : ObjectId(entityType._SYSTEM_ID)
                                },
                                _.merge({
                                    "updatedBy": userDetails.id
                                },entityType)
                            );

                            delete entityType.regsitryDetails;

                            if (updateEntityType._id) {
                                entityType["_SYSTEM_ID"] = updateEntityType._id; 
                                entityType.status = "Success";
                            } else {
                                entityType["_SYSTEM_ID"] = "";
                                entityType.status = "Failed";
                            }

                        } catch (error) {
                            entityType["_SYSTEM_ID"] = "";
                            entityType.status = (error && error.message) ? error.message : error;
                        }

                        return entityType;
                    })
                )

                return resolve(entityTypesUploadedData);

            } catch (error) {
                return reject(error);
            }
        })

    }

};