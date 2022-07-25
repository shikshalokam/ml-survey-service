const { getDBInstance } = require("./dbConfig");
const { ObjectId } = require("mongodb");

const findAll = async (clName, query) => {
  try {
    const db = await getDBInstance();
    return await db
      .collection(clName)
      .find({ ...query })
      .toArray();
  } catch (err) {
    console.log("findAll Error: ", err);
  }
};

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
    console.log("updateById  = ", id, "Error: ", err);
  }
};

module.exports = {
  findAll,
  updateById,
};
