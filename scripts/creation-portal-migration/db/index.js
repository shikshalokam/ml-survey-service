const { getDBInstance } = require("./dbConfig");
const { ObjectId } = require("mongodb");
const logger = require("../logger");


// @function for find all documents with params collectionName , querystring
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

// update collection documents by ID
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
