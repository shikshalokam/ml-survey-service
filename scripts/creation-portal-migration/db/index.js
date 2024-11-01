const { getDBInstance } = require("./dbConfig");
const { ObjectId } = require("mongodb");
const logger = require("../logger");

/**
 * Get all the solutions from MongoDB with the given query and options
 * @method
 * @name findAll
 * @param {String} collectionName - Name of the collection
 * @param {Object} query - Query to fetch data
 * @param {Object} [options] - Optional parameters for query (limit, sort, skip, etc.)
 * @returns {JSON} - Returns the collection data
 **/
const findAll = async (collectionName, query, options = {}) => {
  try {
    const db = await getDBInstance();
    const collection = db.collection(collectionName);

    let documentsCursor = collection.find({ ...query });

    // Apply options if they are provided
    if (options.sort) {
      documentsCursor = documentsCursor.sort(options.sort);
    }
    if (options.limit) {
      documentsCursor = documentsCursor.limit(options.limit);
    }
    if (options.skip) {
      documentsCursor = documentsCursor.skip(options.skip);
    }
    return await documentsCursor.toArray();
  } catch (err) {
    logger.error(`findAll Error: ${err}`);
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
    logger.error(`Failed to update document in collection '${clName}' with ID '${id}'. Query: ${JSON.stringify(query)}. Error: ${err.message}`);
  }
};

module.exports = {
  findAll,
  updateById,
};
