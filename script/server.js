const { CONFIG } = require("./constant/config");
const { createDBInstance } = require("./db/dbConfig");
const { findAll } = require("./db");

const express = require("express");
const {
  getQuestionSetTemplates,
} = require("./template/generate/gQuestionSet.js");

const { ObjectId } = require("mongodb");

const app = express();
const PORT = 4000;


const migrateData = async (req, res) => {
  try {
    const db = await createDBInstance();
    // req.query.questionsetID ||
    // const id = "5f35044f19377eecddb06922";
    const data = await findAll("solutions", {
      // _id: ObjectId(id),
      // $or: [{migratedId: {$eq: null}}, {migratedId:{$exists: false}}],
      programId: { $exists: true },
      type: {$in: ["observation", "survey"]}
    });
    const template = await getQuestionSetTemplates(data);
    // return template;
    process.exit();
  } catch (err) {
    console.log("Error while reading questionSet", err);
    throw new Error("Error occured", err);
  
  }
};

migrateData();



// app.post("/questionset", async (req, res) => {
//   try {
//     const data = await migrateData(req);

//     res.status(200).json(data);
//   } catch (err) {
//     console.log("Error", err);
//     res.send(err);
//   }
// });

// app.listen(PORT, () => {
//   console.log("app is running at port", PORT);
// });
