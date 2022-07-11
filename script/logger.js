var path = require('path')
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  }
const date = new Date().getDate()+'-'+new Date().getMonth()+'-'+new Date().getFullYear()
const logger = createLogger({
    level: "logLevels",
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.File({ filename: path.join(__dirname, `/logs/${date}-error.log`), level: 'error' }),
        new transports.File({ filename: path.join(__dirname, `/logs/${date}-info.log`), level: 'info' }),
        new transports.File({ filename: path.join(__dirname, `/logs/${date}-debug.log`), level: 'debug' }),
    ]
});


error = async(msg) =>{
    logger.error(msg)
}

debug = async(msg) =>{
    logger.debug(msg)
}
info = async(msg) =>{
    logger.info(msg)
}

module.exports = {
    info, error, debug
}