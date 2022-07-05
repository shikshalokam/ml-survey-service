require("dotenv").config({path: "./../.env"});
const { CONFIG } = require("./constant/config");
const { createDBInstance } = require("./db/dbConfig");
const { findAll } = require("./db");
const {
  getQuestionSetTemplates,
} = require("./template/generate/gQuestionSet.js");

const { ObjectId } = require("mongodb");




const migrateData = async () => {
  try {
    console.log("Environment: " + process.env.APPLICATION_ENV );

    const db = await createDBInstance();
    const id = "5f35044f19377eecddb06922";
    const data = await findAll("solutions", {
      _id: ObjectId(id),
      programId: { $exists: true },
      type: {$in: ["observation", "survey"]}
    });
    const template = await getQuestionSetTemplates(data);
    process.exit();
  } catch (err) {
    console.log("Error while reading questionSet", err);
    throw new Error("Error occured", err);
  
  }
};

migrateData();