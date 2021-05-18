/**
 * name : improvement-project.js
 * author : Aman Jung Karki
 * Date : 11-Nov-2019
 * Description : All improvement project related api call.
 */

//dependencies

const request = require('request');

/**
  * Get list of project template lists.
  * @function
  * @name templateLists
  * @param {Array} improvementProjectIds - improvement project external ids.
  * @param {String} token - logged in user token. 
  * @returns {Array} Array of improvement projects.
*/

var templateLists = function (improvementProjectIds,token) {

    let bodyData = {
        "externalIds" : improvementProjectIds
    }

    const improvementProjectsUrl = 
    process.env.IMPROVEMENT_PROJECT_HOST + 
    process.env.IMPROVEMENT_PROJECT_BASE_URL + 
    messageConstants.endpoints.GET_PROJECT_TEMPLATE_LISTS;

    return new Promise((resolve, reject) => {
        try {

            const unnatiCallBack = function (err, response) {
                if (err) {
                    return reject({
                        status : httpStatusCode.bad_request.status,
                        message : messageConstants.apiResponses.UNNATI_SERVICE_DOWN
                    })
                } else {
                    let listOfImprovementProjects = response.body;
                    return resolve(listOfImprovementProjects);
                }
            }

            request.post(improvementProjectsUrl, {
                headers: {
                    "X-authenticated-user-token": token
                },
                json : bodyData
            }, unnatiCallBack);

        } catch (error) {
            return reject(error);
        }
    })

}

module.exports = {
    templateLists : templateLists
};