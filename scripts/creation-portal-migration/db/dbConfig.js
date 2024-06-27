const mongoose = require("mongoose");
const logger = require("../logger");
const { CONFIG } = require("../constants/config");


let databaseInstance;

const connect = async () => {

    if (databaseInstance) {
        return databaseInstance;
    }
    try {
        const Conn = mongoose.createConnection();
        // connect to database
        console.log("MONGODB_URL", CONFIG.DB.DB_HOST)
        databaseInstance = await Conn.openUri(CONFIG.DB.DB_HOST, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(() => {
            console.log('DB Connection successfully.')
        });
        Conn.on("error", console.error.bind(console, "connection error:"));
    } catch (err) {
        console.log("Error While connecting to DB", err);
        logger.error(`Error While connecting to DB`, err);
        process.exit();
    }
};

const createDBInstance = async () => {
    await connect();
};

const getDBInstance = () => {
    return databaseInstance;
};


module.exports = {
    createDBInstance,
    getDBInstance,
};
