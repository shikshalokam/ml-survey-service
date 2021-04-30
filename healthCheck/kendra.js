/**
 * name : kendra.js.
 * author : Aman Karki.
 * created-date : 02-Feb-2021.
 * Description : Kendra service health check.
*/

// Dependencies 
const request = require('request');

/**
   * Health check of kendra service.
   * @function
   * @name health_check
   * @returns {Boolean} - true/false.
*/

function health_check() {
    return new Promise(async (resolve, reject) => {
        try {

            let healthCheckUrl = 
            process.env.ML_CORE_SERVICE_URL +  "/healthCheckStatus";

            const options = {
                headers : {
                    "content-type": "application/json"
                }
            };
            
            request.get(healthCheckUrl,options,kendraCallback);

            function kendraCallback(err, data) {

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