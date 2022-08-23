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
                        result["data"] = response.result;
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
  * @returns {Promise} returns a promise.
*/

const locationSearch = function ( filterData, pageSize = "", pageNo = "", searchKey = "", formatResult = false, returnObject = false ) {
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
                            data.id = entityData.id;
                            data.entityType = entityData.type;
                            data.metaInformation = {};
                            data.metaInformation.name = entityData.name;
                            data.metaInformation.externalId = entityData.code
                            data.registryDetails = {};
                            data.registryDetails.locationId = entityData.id;
                            data.registryDetails.code = entityData.code;
                            entityDocument.push(data);
                        });
                        if ( returnObject ) {
                            result["data"] = entityDocument[0];
                        } else {
                            result["data"] = entityDocument;
                        }
                    } else {
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
                  bodyData["request"]["fuzzy"] = {
                      "orgName" : searchKey
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
                      
                      if( response.responseCode === messageConstants.common.OK) {
                          result["data"] = response.result;
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

module.exports = {
    profile : profile,
    locationSearch : locationSearch,
    orgSchoolSearch : orgSchoolSearch
}
