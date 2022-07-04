const { CONFIG } = require("../constant/config");

const mongoose = require("mongoose");


const connect = async () => {
  try {
    // const db = await mongoose.createConnection(
    //   // CONFIG.DB.DB_HOST
    //   CONFIG.DB.DB_HOST,
    //   {
    //     useNewUrlParser: true,
    //   }
    // );

    const Conn = mongoose.createConnection();

    // connect to database
    this.database = await Conn.openUri(CONFIG.DB.DB_HOST);
    // Conn.on("error", console.error.bind(console, "connection error:"));
    // Conn.once("open", function () {
    //   console.log("Connected to DB");
    // });
    // this.database = db;
    // .db(CONFIG.DB.DB_NAME);
  } catch (err) {
    console.log("Error While connecting to DB", err);
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
