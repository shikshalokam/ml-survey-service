const path = require("path");
let rootPath = path.join(__dirname, "../../");
require("dotenv").config({ path: rootPath + "/.env" });
const { validate: uuidValidate, v4: uuidV4 } = require("uuid");
global.MODULES_BASE_PATH = rootPath + "/module";
const UserRolesHelper = require(MODULES_BASE_PATH + "/userRoles/helper");
let _ = require("lodash");
let mongoUrl = process.env.MONGODB_URL;
let dbName = mongoUrl.split("/").pop();
let url = mongoUrl.split(dbName)[0];
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongodb').ObjectID;
const csv = require("csvtojson");
const filePath = process.argv[2];
const secondArg = process.argv[3];
var fs = require("fs");
//config and routes
require("../../config");
require("../../config/globalVariable")();

function generateUUId() {
  return uuidV4();
}
(async () => {
  if (!filePath) {
    console.error("Please provide a file path");
    process.exit(1);
  }
  let connection = await MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  let db = connection.db(dbName);
  try {
    //Checking for programId or solutionId
    let programId, solutionId;
    if (secondArg && secondArg !="") {
        if (secondArg.startsWith("programId=")) {
          programId = secondArg.split("=")[1];
        } else if (secondArg.startsWith("solutionId=")) {
          solutionId = secondArg.split("=")[1];
        }
      }
    // Convert CSV file to JSON
    const extractedCsvData = await csv().fromFile(filePath);
    if (extractedCsvData.length > 0) {
   
      let updatedSolutions = [];
      let updatedPrograms = [];

      // updating solutions and programs

      for (let j = 0; j < extractedCsvData.length; j++) {
        let roleUpdateinScope = extractedCsvData[j];
        if (
          extractedCsvData[j].oldRoleCode.length > 0 &&
          extractedCsvData[j].newRoleCode.length > 0
        ) {
           
          //Retrieve the role's ID and code for update
          let roleToUpdate = await db.collection("userRoles").findOne(
              { code: roleUpdateinScope.newRoleCode.toLowerCase() },
              { projection: { _id: 1, code: 1 } }
            );
            if (!roleToUpdate) {       
                 throw Error(`${roleUpdateinScope.newRoleCode} Role is not available`)
              }

          let matchQuery = {
            "scope.roles.code": roleUpdateinScope.oldRoleCode,
          };

          let updatedRole = {
            $addToSet: { "scope.roles": roleToUpdate },
          };
          let projection = {
            projection: { _id: 1, externalId: 1, name: 1 },
          };
        if (programId && programId !=" ") {
            matchQuery["_id"] = new ObjectId(programId);
            await db.collection("programs").updateMany(matchQuery, updatedRole);
          } else if (solutionId && solutionId !="") {
            matchQuery["_id"] = new ObjectId(solutionId);
            await db.collection("solutions").updateMany(matchQuery, updatedRole);
          } else {
            await db.collection("solutions").updateMany(matchQuery, updatedRole);
            await db.collection("programs").updateMany(matchQuery, updatedRole);
          }
          // Retrieve the updated solutions and programs

          let updatedSolutionsData = await db
            .collection("solutions")
            .find(matchQuery, projection)
            .toArray();
          let UpdatedProgramData = await db
            .collection("programs")
            .find(matchQuery, projection)
            .toArray();

          updatedSolutions.push(updatedSolutionsData);
          updatedPrograms.push(UpdatedProgramData);
        }
      }
      fs.writeFileSync(
        "updated_solution_records" + generateUUId() + ".txt",
        JSON.stringify(updatedSolutions)
      );
      fs.writeFileSync(
        "updated_programs_records" + generateUUId() + ".txt",
        JSON.stringify(updatedPrograms)
      );
      console.log("Script Executed Succesfully")
      process.exit(1);
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})().catch((err) => console.log("error", err));