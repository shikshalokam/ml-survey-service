/**
 * name : elasticSearch.js
 * author : Aman Jung Karki
 * created-date : 11-Jun-2020
 * Description : Elastic search configuration file.
 */


//dependencies
// const { Client : esClient } = require('@elastic/elasticsearch');

// /**
//  * Elastic search connection.
//  * @function
//  * @name connect
//  * @return {Object} elastic search client 
//  */

// var connect = function () {

//   const elasticSearchClient = new esClient({
//     node : process.env.ELASTICSEARCH_HOST_URL,
//     maxRetries : 5,
//     requestTimeout : 60000,
//     sniffOnStart : process.env.ELASTIC_SEARCH_SNIFF_ON_START
//   });

//   elasticSearchClient.ping({
//   }, function (error) {
//     if (error) {
//       console.log('Elasticsearch cluster is down!');
//     } else {
//       console.log('Elasticsearch connection established.');
//     }
//   });

//   return {
//     client : elasticSearchClient
//   };

// };

// module.exports = connect;
