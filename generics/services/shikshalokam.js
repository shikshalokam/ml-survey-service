/**
 * name : shikshalokam.js
 * author : Aman Jung Karki
 * Date : 26-June-2020
 * Description : All shikshalokam related information.
 */

//dependencies

const request = require('request');

/**
  * Get user profile information.
  * @function
  * @name userProfile
  * @param {Object} token - Logged in user token.
  * @param {Object} userId - user id.
  * @returns {Object} User profile information.
*/

const userProfile = function ( token,userId ) {

    return new Promise((resolve, reject) => {
        try {

            const shikshalokamCallBack = function (err, response) {
                if (err) {
                    return reject({
                        success : false,
                        data : []
                    })
                } else {
                    let profileData = JSON.parse(response.body);
                    return resolve({
                        success : true,
                        data : profileData.result.response
                    });
                }
            }

            let url = process.env.USER_SERVICE_URL + "/api/user/v1/read/" + userId;

            request.get(url,{
                headers: {
                  authorization: process.env.AUTHORIZATION,
                  "x-authenticated-user-token": token
                }
              }, shikshalokamCallBack);

        } catch (error) {
            return reject(error);
        }
    })

}

module.exports = {
    userProfile : userProfile
}; 