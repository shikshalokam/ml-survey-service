/**
 * Project          : Ml survey
 * Module           : Configuration
 * Source filename  : index.js
 * Description      : Environment related configuration variables
 * Copyright        : Copyright © 2018
 *                    Written under contract by Above Solutions Pvt. Ltd.
 * Author           : Yogesh Sinoriya <yogesh.sinoriya@above-inc.com>
 */

/**
 * Mongodb Database configuration.
 * @method
 * @name db_connect
*/

let db_connect = function() {
  global.database = require("./dbConfig")();
  global.ObjectId = database.ObjectId;
  global.Abstract = require("../generics/abstract");
};

/**
  * Elastic search configuration.
  * @function
  * @name elasticsearch_connect
*/

// let elasticsearch_connect = function () {
//   global.elasticsearch = require("./db/elasticSearch")();
// };

/**
  * Kafka connection information.
  * @method
  * @name kafka_connect
*/

let kafka_connect = function() {
  global.kafkaClient = require("./kafkaConfig")();
};

const configuration = {
  root: require("path").normalize(__dirname + "/.."),
  app: {
    name: "ml-survey-api"
  }
};

/**
  * Redis connection information.
  * @method
  * @name redis_connect
*/

let redis_connect =   function () {
  const redis = require("./redisConfig");
  redis.connect;
  global.cache = redis.client;
  global.cacheTtl = redis.expiry;
};

db_connect();
kafka_connect();
// elasticsearch_connect();
redis_connect()

module.exports = configuration;
