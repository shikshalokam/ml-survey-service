const path = require("path");
let rootPath = path.join(__dirname, "../../");
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
const { validate: uuidValidate, v4: uuidV4 } = require("uuid");
require("dotenv").config({ path: rootPath + "/.env" });
var fs = require("fs");
let mongoUrl = process.env.MONGODB_URL;
const dbName = mongoUrl.split("/").pop();
let url = mongoUrl.split(dbName)[0];

//config and routes
require("../../config");
require("../../config/globalVariable")();

const arg = process.argv[2];
if (!arg || (!arg.startsWith("programId=") && !arg.startsWith("solutionId="))) {
  console.error(
    "Usage: node verifyRoleInsertion.js programId=id1,id2 OR solutionId=id1,id2"
  );
  process.exit(1);
}

const [key, value] = arg.split("=");
const ids = value.split(",");

function generateUUId() {
  return uuidV4();
}

(async () => {
  let connection = await MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  let db = connection.db(dbName);
  try {
    let collectionName = key === "programId" ? "programs" : "solutions";

    //Db query for getting program or solution Document

    const query = { _id: { $in: ids.map((id) => new ObjectId(id)) } };
    const solutionOrProgramDetails = await db
      .collection(collectionName)
      .find(query, {
        projection: { _id: 1, externalId: 1, name: 1, "scope.roles": 1 },
      })
      .toArray();
    if (solutionOrProgramDetails.length === 0) {
      console.log("No documents found for the given IDs.");
    } else {
      const fileName = `verified_${collectionName}_data_${generateUUId()}.txt`;
      fs.writeFileSync(
        fileName,
        JSON.stringify(solutionOrProgramDetails, null, 2)
      );
    }
    console.log("Script Executed Succesfully");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(1);
  }
})();
