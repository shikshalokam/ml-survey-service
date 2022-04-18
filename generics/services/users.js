/**
 * name : users.js
 * author : Aman Jung Karki
 * Date : 11-Nov-2019
 * Description : All users related api call.
 */

//dependencies
const request = require('request');
const userServiceUrl = process.env.USER_SERVICE_URL;
const serverTimeout = process.env.SUNBIRD_SERVER_TIMEOUT ? parseInt(process.env.SUNBIRD_SERVER_TIMEOUT) : 5000;

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
                return reject (result = {
                    success : false
                 });
             }, serverTimeout);

        } catch (error) {
            return reject(error);
        }
    })
}

module.exports = {
    profile : profile
}
//https://staging.sunbirded.org/api/user/v5/read/