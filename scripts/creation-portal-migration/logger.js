var path = require("path");
var fs = require("fs");
var Logger = require("bunyan");


const date = new Date().getDate() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getFullYear();


var dir = __dirname + '/logs';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
};

var logger = new Logger({
    name: "creation-portal-migration",
    streams: [
        {
            level: "error",
            path: path.join(__dirname + `/logs/${date}-error.log`)
        },
        {
            level: "debug",
            path: path.join(__dirname, `/logs/${date}-debug.log`),
        },
        {
            level: "info",
            path: path.join(__dirname, `/logs/${date}-info.log`),
        },
    ]
});


module.exports = logger;
