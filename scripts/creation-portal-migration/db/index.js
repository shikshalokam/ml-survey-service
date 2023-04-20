const { getDBInstance } = require("./dbConfig");
const { ObjectId } = require("mongodb");
const logger = require("../logger");

/**
* Get all the solution from mongo with the given query
* @method
* @name findAll
* @param {String} clName - collection name
* @param {Object} query - query to fetch data
* @returns {JSON}  - returns the collection data
**/
const findAll = async (clName, query) => {
  try {
    const db = await getDBInstance();
    return await db
      .collection(clName)
      .find({ ...query })
      .toArray();
  } catch (err) {
    logger.error(`findAll Error: , ${err}`);
  }
};

/**
* Update the given collection in db by id
* @method
* @name updateById
* @param {String} clName - collection name
* @param {String} id - id
* @param {Object} query - query
* @returns  - Updates the collection data in mongo
**/
const updateById = async (clName, id, query) => {
  try {
    const db = await getDBInstance();
    const res = await db
      .collection(clName)
      .updateOne(
        { _id: ObjectId(id) },
        { $set: { ...query } },
        { upsert: true }
      );
  } catch (err) {
    logger.error(`"updateById  = ", ${id}, "Error: ", ${err}`);
  }
};

module.exports = {
  findAll,
  updateById,
};
