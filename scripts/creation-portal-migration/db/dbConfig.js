const { CONFIG } = require("../constant/config");

const mongoose = require("mongoose");
const logger = require("../logger");

const connect = async () => {
  try {
    const Connect = mongoose.createConnection();
    // connect to database
    this.database = await Connect.openUri(CONFIG.DB.DB_HOST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    Connect.on("error", console.error.bind(console, "connection error:"));
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
  return this.database;
};

module.exports = {
  createDBInstance,
  getDBInstance,
};
