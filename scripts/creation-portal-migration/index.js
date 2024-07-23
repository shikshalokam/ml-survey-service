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

    // connect to db
    const db = await createDBInstance();

    // get solutions from mongo {survey, observation w/o rubric}
    let data = await findAll(CONFIG.DB.TABLES.solutions, {
      programId: { $exists: true },
      isRubricDriven: false,
      type: { $in: ["observation", "survey"] },
      // _id: ObjectID("5f362b78af0a4decfa9a1070")
      // _id: ObjectID("5f3bc15416fdc4ed008171b1")
      // _id: ObjectID("5f362b78af0a4decfa9a1070")
      // _id: ObjectID("5f34e44681871d939950bca7")
      // _id: ObjectID("5f34ec17585244939f89f90d")
      // _id: ObjectID("5f36d6d019377eecddb06946")
      _id: ObjectID("5f4000bd19377eecddb06979")

    });
    migratedCount.totalCount = data.length;


    // const p = await  getAllCriterias(data[0],migratedCount,"program 1");

    // contributor = {
    //   "authorId": "86d2d978-5b20-4453-8a76-82b5a4c728c9",
    //   "mappedUserId": "b8e3c5f2-07b3-49f3-964f-ef8e90897513",
    //   "userName": "karan121",
    //   "rootOrgId": "01338111579044249633",
    //   "rootOrgName": "dockstaging",
    //   "org_id": "d7da22f6-b737-4817-a194-6a205e535559",
    //   "srcOrgAdminId": "2730f876-735d-4935-ba52-849c524a53fe",
    //   "srcOrgAdminUserName": "dockstaging1@yopmail.com",
    //   "contributorOrgAdminId": "2730f876-735d-4935-ba52-849c524a53fe",
    //   "contributorOrgAdminUserName": "dockstaging1@yopmail.com",
    //   "programId": "d1b93850-df5e-11ed-87b4-9feca80ba862",
    //   "programName": "MH01-Mantra4Change-APSWREIS School Leader Feedback sourcing project",
    //   "solutionId": "5f362b78af0a4decfa9a1070",
    //   "solutionName": "Need Assessment Form_Teacher Training"
    // }

    // const t = await migrateQuestionset(data[0], "d1b93850-df5e-11ed-87b4-9feca80ba862", migratedCount, contributor)




    // To create the program and the questionsets
    const template = await createProgramAndQuestionsets(
      data,
      migratedCount
    );

    console.log(JSON.stringify(migratedCount));
    logger.info(`\n migratedCount ${JSON.stringify(migratedCount)}`);
    process.exit();
  } catch (err) {
    logger.error(`Error while migrating : ${err}`)
    console.log(err)
    throw new Error("Error occured", err);
  }
};

migrateData();