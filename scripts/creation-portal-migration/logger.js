var path = require("path");
var fs = require("fs");
var Logger = require("bunyan");

// Get the current date in DD-MM-YYYY format for log filenames
const currentDate = new Date();
const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;

// Directory to store logs
var logDir = __dirname + "/logs";

// Ensure the log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create a logger instance with separate streams for error, debug, and info logs
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
