/**
 * name : improvement-project.js.
 * author : Aman Karki.
 * created-date : 09-Feb-2021.
 * Description : Improvement service health check.
*/

// Dependencies 
const request = require('request');

/**
   * Health check of improvement service.
   * @function
   * @name health_check
   * @returns {Boolean} - true/false.
*/

function health_check() {
    return new Promise(async (resolve, reject) => {
        try {

            let healthCheckUrl = 
            process.env.ML_PROJECT_SERVICE_URL +  "/healthCheckStatus";

            const options = {
                headers : {
                    "content-type": "application/json"
                }
            };
            
            request.get(healthCheckUrl,options,improvementCallback);

            function improvementCallback(err, data) {

                let result = false;

                if (err) {
                    result = false;
                } else {
                    
                    let response = JSON.parse(data.body);
                    if( response.status === 200 ) {
                        result = true;
                    } else {
                        result = false;
                    }
                }
                return resolve(result);
            }

        } catch (error) {
            return reject(error);
        }
    })
}

module.exports = {
    health_check : health_check
}