var path = require("path");
var fs = require("fs");
var Logger = require("bunyan");

const currentDate = new Date();
const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;

var logDir = __dirname + "/logs";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

var logger = new Logger({
  name: "creation-portal-migration",
  streams: [
    {
      level: "error",
      path: path.join(__dirname, `/logs/${formattedDate}-error.log`),
    },
    {
      level: "debug",
      path: path.join(__dirname, `/logs/${formattedDate}-debug.log`),
    },
    {
      level: "info",
      path: path.join(__dirname, `/logs/${formattedDate}-info.log`),
    },
  ],
});

module.exports = logger;
