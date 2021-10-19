/**
 * name : elastic-search.js.
 * author : Aman Karki.
 * created-date : 02-Feb-2021.
 * Description : Elastic Search health check.
*/

// Dependencies

const { Client : esClient } = require('@elastic/elasticsearch');

function health_check() {
    return new Promise( async (resolve,reject) => {

        const elasticSearchClient = new esClient({
            node: process.env.ELASTICSEARCH_HOST_URL
          });
        
          elasticSearchClient.ping({
          }, function (error) {
            if (error) {
                return resolve(false);
            } else {
                return resolve(true);
            }
          });
    })
}

module.exports = {
    health_check : health_check
}