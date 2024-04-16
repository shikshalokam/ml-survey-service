/**
 * name : users.js
 * author : Aman Jung Karki
 * Date : 11-Nov-2019
 * Description : All users related api call.
 */

//dependencies
const request = require('request');
const userServiceUrl = process.env.USER_SERVICE_URL;

const profile = function ( token,userId = "" ) {
    return new Promise(async (resolve, reject) => {
        try {

            let url = userServiceUrl + messageConstants.endpoints.USER_READ_V5;
            
            if( userId !== "" ) {
                url = url + "/" + userId + "?"  + "fields=organisations,roles,locations,declarations,externalIds"
            }
            
            const options = {
                headers : {
                    "content-type": "application/json",
                    "x-authenticated-user-token" : token
                }
            };
            
            request.get(url,options,userReadCallback);
            let result = {
                success : true
            };
            function userReadCallback(err, data) {
                
                if (err) {
                    result.success = false;
                } else {
                    let response = JSON.parse(data.body);
                    if( response.responseCode === httpStatusCode['ok'].code ) {
                        result["data"] = _.omit(response.result, [
                            "response.email",
                            "response.maskedEmail",
                            "response.maskedPhone",
                            "response.recoveryEmail",
                            "response.phone",
                            "response.lastName",
                            "response.prevUsedPhone",
                            "response.prevUsedEmail",
                            "response.recoveryPhone",
                            "response.encEmail",
                            "response.encPhone"
                          ]);
                    } else {
                        result.success = false;
                    }

                }
                
                return resolve(result);
            }
            setTimeout(function () {
                return resolve (result = {
                    success : false
                });
             }, messageConstants.common.SERVER_TIME_OUT);

        } catch (error) {
            return reject(error);
        }
    })
}

/**
  * 
  * @function
  * @name locationSearch
  * @param {object} filterData -  bodydata.
  * @param {String} pageSize - requesting page size.
  * @param {String} pageNo - requesting page number
  * @param {String} searchKey - search key.
  * @param {Boolean} formatResult - format result
  * @param {Boolean} returnObject - return object or array.
  * @param {Boolean} resultForSearchEntities - format result for searchEntities api call.
  * @returns {Promise} returns a promise.
*/

const locationSearch = function ( filterData, pageSize = "", pageNo = "", searchKey = "", formatResult = false, returnObject = false, resultForSearchEntities = false ) {
    return new Promise(async (resolve, reject) => {
        try {

            let bodyData = {};
            bodyData["request"] = {};
            bodyData["request"]["filters"] = filterData;
  
            if ( pageSize !== "" ) {
                bodyData["request"]["limit"] = pageSize;
            } 
    
            if ( pageNo !== "" ) {
                let offsetValue = pageSize * ( pageNo - 1 ); 
                bodyData["request"]["offset"] = offsetValue;
            }
  
            if ( searchKey !== "" ) {
                bodyData["request"]["query"] = searchKey
            }
          
            const url = 
            userServiceUrl + messageConstants.endpoints.GET_LOCATION_DATA;
            const options = {
                headers : {
                    "content-type": "application/json"
                },
                json : bodyData
            };
          
          request.post(url,options,requestCallback);
  
            let result = {
                success : true
            };
  
            function requestCallback(err, data) {
                if (err) {
                    result.success = false;
                } else {

                    let response = data.body;
                    if( response.responseCode === messageConstants.common.OK &&
                        response.result &&
                        response.result.response &&
                        response.result.response.length > 0
                    ) {
                        // format result if true
                        if ( formatResult ) {
                            let entityDocument = [];
                            response.result.response.map(entityData => {
                                let data = {};
                                data._id = entityData.id;
                                data.entityType = entityData.type;
                                data.metaInformation = {};
                                data.metaInformation.name = entityData.name;
                                data.metaInformation.externalId = entityData.code;
                                data.registryDetails = {};
                                data.registryDetails.locationId = entityData.id;
                                data.registryDetails.code = entityData.code;
                                entityDocument.push(data);
                            });
                            if ( returnObject ) {
                                result["data"] = entityDocument[0];
                                result["count"] = response.result.count;
                            } else {
                                result["data"] = entityDocument;
                                result["count"] = response.result.count;
                            }
                        } else if ( resultForSearchEntities ) {
                            let entityDocument = [];
                            response.result.response.map(entityData => {
                                let data = {};
                                data._id = entityData.id;
                                data.name = entityData.name;
                                data.externalId = entityData.code;
                                entityDocument.push(data);
                            });
                            result["data"] = entityDocument;
                            result["count"] = response.result.count;
                    }else {
                        result["data"] = response.result.response;
                        result["count"] = response.result.count;
                    }
                } else {
                    result.success = false;
                }
            }
                return resolve(result);
          }
  
            setTimeout( function () {
                return resolve (result = {
                    success : false
                });
           }, messageConstants.common.SERVER_TIME_OUT);
  
        } catch (error) {
            return reject(error);
        }
    })
  }
  
  /**
    * @function
    * @name orgSchoolSearch
    * @param {object} filterData -  bodydata.
    * @param {String} pageSize - requesting page size.
    * @param {String} pageNo - requesting page number
    * @param {String} searchKey - search key.
    * @param {object} fields -  query data.
    * @returns {Promise} returns a promise.
  */
    const orgSchoolSearch = function ( filterData, pageSize = "", pageNo = "", searchKey = "", fields = [] ) {
        return new Promise(async (resolve, reject) => {
            try {

                let bodyData = {};
                bodyData["request"] = {};
                bodyData["request"]["filters"] = filterData;
  
                if ( pageSize !== "" ) {
                    bodyData["request"]["limit"] = pageSize;
                } 
      
                if ( pageNo !== "" ) {
                    let offsetValue = pageSize * ( pageNo - 1 ); 
                    bodyData["request"]["offset"] = offsetValue;
                }

                if ( searchKey !== "" ) {
                    if ( gen.utils.checkIfStringIsNumber(searchKey) ) {
                        bodyData["request"]["fuzzy"] = {
                            "externalId" : searchKey
                        }
                    } else {
                        bodyData["request"]["fuzzy"] = {
                            "orgName" : searchKey
                        }
                    }
                }
  
                //for getting specified key data only.
                if ( fields.length > 0 ) {
                    bodyData["request"]["fields"] = fields;
                }
              
                const url = 
                userServiceUrl + messageConstants.endpoints.GET_SCHOOL_DATA;
                const options = {
                    headers : {
                      "content-type": "application/json"
                    },
                    json : bodyData
                };

                request.post(url,options,requestCallback);
                let result = {
                    success : true
                };
    
                function requestCallback(err, data) {
    
                    if (err) {
                        result.success = false;
                    } else {

                        let response = data.body;
                        if ( response.responseCode === messageConstants.common.OK &&
                            response.result &&
                            response.result.response &&
                            response.result.response.content &&
                            response.result.response.content.length > 0
                        ){
                            result["data"] = response.result.response.content;
                            result["count"] = response.result.response.count;
                        } else {
                            result.success = false;
                        }
                    }

                    return resolve(result);
                }
                setTimeout(function () {
                    return resolve (result = {
                        success : false
                    });
               }, messageConstants.common.SERVER_TIME_OUT);
  
            } catch (error) {
                return reject(error);
            }
        })
    }

/**
  * get subEntities of matching type by recursion.
  * @method
  * @name getSubEntitiesBasedOnEntityType
  * @param {Array} entityIds - Array of entity Ids - parent entities.
  * @param {String} entityType - Entity type.
  * @param {Array} result - subentities of type {entityType} of {entityIds}
  * @returns {Array} - Sub entities matching the type.
*/

async function getSubEntitiesBasedOnEntityType( parentIds, entityType, result ) {
     
    if( !(parentIds.length > 0) ){
        return result;
    }
    let bodyData={
        "parentId" : parentIds
    };

    let entityDetails = await locationSearch(bodyData);
    if( !entityDetails.success ) {
        return (result);
    }

    let entityData = entityDetails.data;
    let parentEntities = [];
    entityData.map(entity => {
    if( entity.type == entityType ) {
        result.push(entity.id)
    } else {
        parentEntities.push(entity.id)
    }
    });

    if( parentEntities.length > 0 ){
        await getSubEntitiesBasedOnEntityType(parentEntities,entityType,result)
    } 

    let uniqueEntities = _.uniq(result);
    return uniqueEntities;
}

/**
  * get Parent Entities of an entity.
  * @method
  * @name getParentEntities
  * @param {String} entityId - entity id
  * @returns {Array} - parent entities.
*/

async function getParentEntities( entityId, iteration = 0, parentEntities ) {

    if ( iteration == 0 ) {
        parentEntities = [];
    }

    let filterQuery = {
        "id" : entityId
    };

    let entityDetails = await locationSearch(filterQuery);
    if ( !entityDetails.success ) {
        return parentEntities;
    } else {
        
        let entityData = entityDetails.data[0];
        if ( iteration > 0 ) parentEntities.push(entityData);
        if ( entityData.parentId ) {
            iteration = iteration + 1;
            entityId = entityData.parentId;
            await getParentEntities(entityId, iteration, parentEntities);
        }
    }

    return parentEntities;

}


module.exports = {
    profile : profile,
    locationSearch : locationSearch,
    orgSchoolSearch : orgSchoolSearch,
    getSubEntitiesBasedOnEntityType : getSubEntitiesBasedOnEntityType,
    getParentEntities : getParentEntities
}
