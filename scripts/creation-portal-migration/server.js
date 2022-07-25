require("dotenv").config({path: "./../../.env"});
const { createDBInstance } = require("./db/dbConfig");
const { findAll } = require("./db");
const {
  getQuestionSetTemplates,
} = require("./template/generate/gQuestionSet.js");

const { ObjectId } = require("mongodb");
const logger = require("./logger");
var fs = require("fs");
const { CONFIG } = require("./constant/config");


fs.existsSync("logs") || fs.mkdirSync("logs");

const migrateData = async (req, res) => {
  try {

    const programMigration = {
      migrated: 0,
      updated: 0,
      published: 0,
      nominated: 0,
      contributor: 0,
      accepted: 0,
    };
    const questionSetMigration = {
      migrated: 0,
      hierarchy: 0,
      branching: 0,
      published: 0,
    };

    const migratedCount = {
      totalCount: 0,
      success: {
        program: {
          existing: {
            ...programMigration,
          },
          current: {
            ...programMigration,
          },
        },
        questionSet: {
          existing: {
            ...questionSetMigration,
          },
          current: {
            ...questionSetMigration,
          },
        },
      },
      failed: {
        program: {
          migrated: { count: 0, ids: [] },
          updated: { count: 0, ids: [] },
          published: { count: 0, ids: [] },
          nominated: { count: 0, ids: [] },
          contributor: { count: 0, ids: [] },
          accepted: { count: 0, ids: [] },
        },
        questionSet: {
          migrated: { count: 0, ids: [] },
          hierarchy: { count: 0, ids: [] },
          branching: { count: 0, ids: [] },
          published: { count: 0, ids: [] },
        },
        question: { count: 0, ids: [] }
      },
    };
    const db = await createDBInstance();
    // req.query.questionsetID ||
    const id = "600b21c57ea68a7ed9278873";

    const data = await findAll(CONFIG.DB.TABLES.solutions, {
      _id: ObjectId(id),
      // programId: { $exists: true },
      type: { $in: ["observation", "survey"] },
    });

    migratedCount.totalCount = data.length;

    const template = await getQuestionSetTemplates(
      data,
      migratedCount
    );

    console.log();
    console.log("migratedCounttt", JSON.stringify(migratedCount));
    console.log();
    // logger.in
    logger.info(`\n migratedCount ${JSON.stringify(migratedCount)}`);
    
    // return template;
    process.exit();
  } catch (err) {
    logger.error(`Error while migrating : ${err}`)

    throw new Error("Error occured", err);
  }
};

migrateData();