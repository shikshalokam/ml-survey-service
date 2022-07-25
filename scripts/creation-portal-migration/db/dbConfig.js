const { CONFIG } = require("../constant/config");

const mongoose = require("mongoose");
const logger = require("../logger");


const connect = async () => {
  try {
    const Conn = mongoose.createConnection();
    // connect to database
    console.log("MONGODB_URL", CONFIG.DB.DB_HOST)
    this.database = await Conn.openUri(CONFIG.DB.DB_HOST);
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
  return this.database;
};

module.exports = {
  createDBInstance,
  getDBInstance,
};
