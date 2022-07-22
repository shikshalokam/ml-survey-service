/**
 * name : users.js
 * author : Aman Jung Karki
 * Date : 11-Nov-2019
 * Description : All users related api call.
 */

//dependencies
const request = require('request');
const userServiceUrl = process.env.USER_SERVICE_URL;
const dataLimit = process.env.SUNBIRD_RESPONSE_DATA_LIMIT ? parseInt(process.env.SUNBIRD_RESPONSE_DATA_LIMIT) : 10000;
const timeout = process.env.SUNBIRD_SERVER_TIMEOUT ? parseInt(process.env.SUNBIRD_SERVER_TIMEOUT) : 5000;

const profile = function ( token,userId = "" ) {
    return new Promise(async (resolve, reject) => {
        try {

            let url = userServiceUrl + messageConstants.endpoints.USER_READ;

            if( userId !== "" ) {
                url = url + "/" + userId;
            }

            const options = {
                headers : {
                    "content-type": "application/json",
                    "x-authenticated-user-token" : token
                }
            };

            request.post(url,options,kendraCallback);

            function kendraCallback(err, data) {

                let result = {
                    success : true
                };

                if (err) {
                    result.success = false;
                } else {

                    let response = JSON.parse(data.body);
                    if( response.status === HTTP_STATUS_CODE['ok'].status ) {
                        result["data"] = response.result;
                    } else {
                        result.success = false;
                    }

                }

                return resolve(result);
            }

        } catch (error) {
            return reject(error);
        }
    })
}

/**
  * 
  * @function
  * @name learnerLocationSearch
  * @param {String} bearerToken - authorization token.
  * @param {object} filterData -  bodydata .
  * @returns {Promise} returns a promise.
*/

const learnerLocationSearch = function ( filterData, pageSize = "", pageNo = "", searchKey = "" ) {
    return new Promise(async (resolve, reject) => {
        try {
  
          let bodyData = {};
          bodyData["request"] = {};
          bodyData["request"]["filters"] = filterData;
  
          if ( pageSize !== "" ) {
              bodyData["request"]["limit"] = pageSize;
          } else {
              bodyData["request"]["limit"] = dataLimit;
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
  
          request.post(url,options,locationSearchCallback);
  
          let result = {
              success : true
          };
  
          function locationSearchCallback(err, data) {
  
              if (err) {
                  result.success = false;
              } else {
                    
                  let response = data.body;
                  if ( response.responseCode === messageConstants.common.OK ) {
                      result["data"] = response.result;
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
           }, timeout);
  
        } catch (error) {
            return reject(error);
        }
    })
  }
  
  /**
    * @function
    * @name orgSchoolSearch
    * @param {String} bearerToken - authorization token.
    * @param {object} bodyData -  location id
    * @returns {Promise} returns a promise.
  */
  const orgSchoolSearch = function ( filterData, pageSize = "", pageNo = "", searchKey = "", fields) {
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
    
              request.post(url,options,sunbirdCallback);
              let result = {
                  success : true
              };
    
              function sunbirdCallback(err, data) {
    
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
               }, timeout);
  
          } catch (error) {
              return reject(error);
          }
      })
  }

module.exports = {
    profile : profile,
    learnerLocationSearch : learnerLocationSearch,
    orgSchoolSearch : orgSchoolSearch
}
