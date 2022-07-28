const redis = require("redis");

var Connect = function () {
  var client = redis.createClient(process.env.REDIS_URL);


  client.on("connect", function () {
    console.log("redis connected");
  });

  client.on("error", console.error.bind(console, "redis connection error:"));


  return {
    connect: client.connect(),
    client: client,
    expiry: process.env.REDIS_TTL
  };
};

module.exports = Connect();
