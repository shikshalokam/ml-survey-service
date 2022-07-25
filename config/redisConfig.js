const redis = require("redis");

var CACHE = function () {
  var client = redis.createClient(process.env.REDIS_URL);


  client.on("connect", function () {
    console.log("redis client connected");
  });

  client.on("error", console.error.bind(console, "redis connection error:"));

  console.log("redis", client);


  return {
    connect: client.connect(),
    client: client,
    expiry: 24 * 3600
  };
};

module.exports = CACHE();
