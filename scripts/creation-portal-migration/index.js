require("dotenv").config({ path: "./../../.env" });
const { createDBInstance } = require("./db/dbConfig");
const { findAll } = require("./db");
const {
  createProgramAndQuestionsets,
} = require("./template/generate/gQuestionSet.js");

const { getAllCriterias, migrateQuestionset } = require('./template/generate/gQuestionSet.js')

const logger = require("./logger");
const { CONFIG } = require("./constant/config");
const { ObjectID } = require("mongodb");

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

    // This migratedCount object is to keep track of the migration count
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

    const batchSize = 100;
    let skip = 0;
    let hasMoreDocuments = true;

    // connect to db
    const db = await createDBInstance();


    while (hasMoreDocuments) {
      // get solutions from mongo {survey, observation w/o rubric}
      let data = await findAll(CONFIG.DB.TABLES.solutions, {
        programId: { $exists: true },
        isRubricDriven: false,
        type: { $in: ["observation", "survey"] },
      });

      migratedCount.totalCount = data.length;

      // To create the program and the questionsets
      const template = await createProgramAndQuestionsets(
        data,
        migratedCount
      );

      console.log(JSON.stringify(migratedCount));
      logger.info(`\n migratedCount ${JSON.stringify(migratedCount)}`);


      skip += batchSize;

      if (data.length < batchSize) {
        hasMoreDocuments = false;
      }
    }

    process.exit();
  } catch (err) {
    logger.error(`Error while migrating : ${err}`)
    console.log(err)
    throw new Error("Error occurred", err);
  }
};

migrateData();