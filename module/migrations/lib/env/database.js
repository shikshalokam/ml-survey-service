const { MongoClient } = require("mongodb");
global.ObjectID = require('mongodb').ObjectID

module.exports = {
  async connect() {

    const url = process.env.MONGODB_URL
    const databaseName = process.env.DB
    const options = {useNewUrlParser: true}

    if (!url) {
      throw new Error("No `url` defined in config file!");
    }

    if (!databaseName) {
      throw new Error(
        "No database found"
      );
    }

    const client = await MongoClient.connect(
      url,
      options
    );

    const db = client.db(databaseName);
    db.close = client.close;
    return db;
  },
  async connectToTransferFromDB() {

    const url = process.env.MONGODB_URL
    const databaseName = process.env.TRANSFER_FROM_DB || process.env.DB
    const options = {useNewUrlParser: true}

    if (!url) {
      throw new Error("No `url` defined in config file!");
    }

    if (!databaseName) {
      throw new Error(
        "No database found"
      );
    }

    const client = await MongoClient.connect(
      url,
      options
    );

    const transferFromDb = client.db(databaseName);
    transferFromDb.close = client.close;
    return transferFromDb;
  }
};
