var path = require("path");

var Logger = require("bunyan");

const date =
  new Date().getDate() +
  "-" +
  new Date().getMonth() +
  "-" +
  new Date().getFullYear();

var logger = new Logger({
  name: "creation-portal-migration",
  streams: [
    {
      level: "error",
      path: path.join(__dirname, `/logs/${date}-error.log`),
    },
    {
      level: "debug",
      path: path.join(__dirname, `/logs/${date}-debug.log`),
    },
    {
      level: "info",
      path: path.join(__dirname, `/logs/${date}-info.log`),
    },
  ],
});



module.exports = logger;
