/**
 * name : deleteDuplicateRecords.js
 * author : Saish Borkar
 * created-date : 1 Jul 2024
 * Description : Delete duplicate records having same userId and solutionId to enforce compound key 
 *               and data integrity
 */

const path = require("path");
let rootPath = path.join(__dirname, "../../");
require("dotenv").config({ path: rootPath + "/.env" });
const {validate : uuidValidate,v4 : uuidV4} = require('uuid');
let _ = require("lodash");
let mongoUrl = process.env.MONGODB_URL;
let dbName = mongoUrl.split("/").pop();
let url = mongoUrl.split(dbName)[0];
var MongoClient = require("mongodb").MongoClient;

var fs = require("fs");

function generateUUId() {
    return uuidV4();
  }
  

(async () => {
  let connection = await MongoClient.connect(url, { useNewUrlParser: true });
  let db = connection.db(dbName);

  try {
    let pipeline = [
      {
        $match: {
          observationId: { $exists: true, $ne: null },
          entityId: { $exists: true, $ne: null },
          submissionNumber: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: { entityId: "$entityId", observationId: "$observationId",submissionNumber: "$submissionNumber" },
          count: { $sum: 1 },
          docs: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          duplicateCount: "$count",
          duplicateArray: "$docs",
        },
      },
    ];
    let duplicateArray = await db
      .collection("observationSubmissions")
      .aggregate(pipeline)
      .toArray();

    let duplicateProjectsChunk = _.chunk(duplicateArray,100);
    let successfullyDeletedRecords = [];
    let failedToDeletedRecords = [];

    for(let i=0;i<duplicateProjectsChunk.length;i++)
      {
        let currentChunk = duplicateProjectsChunk[i];
        for (let duplicateRecord of currentChunk) {
          try {
    
            let duplicateArray = duplicateRecord.duplicateArray;
            //
            let completedObservationSubmissions = [];
            let blockedObservationSubmissions = [];
            let draftObservationSubmissions = [];
            let inProgressSubmissions = [];
            let ratingPendingObservationSubmissions = [];
            let startedObservationSubmissions = [];
            let toBeDeletedRecords = [];
            for (let i = 0; i < duplicateArray.length; i++) {
              if (duplicateArray[i].status == "completed") {
                completedObservationSubmissions.push(duplicateArray[i]);
              } else if (duplicateArray[i].status == "blocked") {
                blockedObservationSubmissions.push(duplicateArray[i]);
              }if (duplicateArray[i].status == "inprogress") {
                inProgressSubmissions.push(duplicateArray[i]);
              } else if (duplicateArray[i].status == "ratingPending") {
                ratingPendingObservationSubmissions.push(duplicateArray[i]);
              }else if (duplicateArray[i].status == "draft") {
                draftObservationSubmissions.push(duplicateArray[i]);
              } else if (duplicateArray[i].status == "started") {
                startedObservationSubmissions.push(duplicateArray[i]);
              }
            }
    
              completedObservationSubmissions.sort(sortByCreatedAtDescending)
              blockedObservationSubmissions.sort(sortByCreatedAtDescending)
              draftObservationSubmissions.sort(sortByCreatedAtDescending)
              inProgressSubmissions.sort(sortByCreatedAtDescending)
              ratingPendingObservationSubmissions.sort(sortByCreatedAtDescending)
              startedObservationSubmissions.sort(sortByCreatedAtDescending)

            if (completedObservationSubmissions.length > 0) {
              let firstRecord = completedObservationSubmissions[0];
    
              for (let i = 1; i < completedObservationSubmissions.length; i++) {
                toBeDeletedRecords.push(completedObservationSubmissions[i]);
              }

              let restOfRecords = [...blockedObservationSubmissions,
                ...draftObservationSubmissions,
                ...inProgressSubmissions,
                ...ratingPendingObservationSubmissions,
                ...startedObservationSubmissions
              ]
              for (let i = 0; i < restOfRecords.length; i++) {
                toBeDeletedRecords.push(restOfRecords[i]);
              }
    
            } 
            else if (ratingPendingObservationSubmissions.length > 0) {
              let firstRecord = ratingPendingObservationSubmissions[0];
              for (let i = 1; i < ratingPendingObservationSubmissions.length; i++) {
                toBeDeletedRecords.push(ratingPendingObservationSubmissions[i]);
              }

              let restOfRecords = [...blockedObservationSubmissions,
                ...draftObservationSubmissions,
                ...inProgressSubmissions,
                ...startedObservationSubmissions
              ]

              for (let i = 0; i < restOfRecords.length; i++) {
                toBeDeletedRecords.push(restOfRecords[i]);
              }
            }
            else if (inProgressSubmissions.length > 0) {
              let firstRecord = inProgressSubmissions[0];

              for (let i = 1; i < inProgressSubmissions.length; i++) {
                toBeDeletedRecords.push(inProgressSubmissions[i]);
              }

              let restOfRecords = [...blockedObservationSubmissions,
                ...draftObservationSubmissions,
                ...startedObservationSubmissions
              ]

              for (let i = 0; i < restOfRecords.length; i++) {
                toBeDeletedRecords.push(restOfRecords[i]);
              }
            }else if (startedObservationSubmissions.length > 0) {
              let firstRecord = startedObservationSubmissions[0];
              for (let i = 1; i < startedObservationSubmissions.length; i++) {
                toBeDeletedRecords.push(startedObservationSubmissions[i]);
              }

              let restOfRecords = [...blockedObservationSubmissions,
                ...draftObservationSubmissions
              ]

              for (let i = 0; i < restOfRecords.length; i++) {
                toBeDeletedRecords.push(restOfRecords[i]);
              }
            }else if (draftObservationSubmissions.length > 0) {
              let firstRecord = draftObservationSubmissions[0];
              for (let i = 1; i < draftObservationSubmissions.length; i++) {
                toBeDeletedRecords.push(draftObservationSubmissions[i]);
              }
              for (let i = 0; i < blockedObservationSubmissions.length; i++) {
                toBeDeletedRecords.push(blockedObservationSubmissions[i]);
              }
            }else if (blockedObservationSubmissions.length > 0) {
              let firstRecord = blockedObservationSubmissions[0];
              for (let i = 1; i < blockedObservationSubmissions.length; i++) {
                toBeDeletedRecords.push(blockedObservationSubmissions[i]);
              }
            }
    
            const idsToDelete = toBeDeletedRecords.map((record) => record._id);

            const result = await db.collection("observationSubmissions").deleteMany({
              _id: { $in: idsToDelete },
            });

            if (result.deletedCount === toBeDeletedRecords.length) {
              successfullyDeletedRecords.push(...idsToDelete);
            } 
    
          } catch (e) {
            console.log(e);
            continue;
          }
        }

      }
    fs.writeFileSync('successfully_deleted_duplicated_records' + generateUUId()+'.js',JSON.stringify(successfullyDeletedRecords))
    console.log('Script execution completed');
    connection.close();
  } catch (error) {
    console.log(error);
  }
})().catch((err) => console.error(err));


const sortByCreatedAtDescending = (a, b) => {
    if (a.createdAt > b.createdAt) {
      return -1; // a should come before b in sorted order (latest first)
    } else if (a.createdAt < b.createdAt) {
      return 1; // b should come before a
    } else {
      return 0; // timestamps are equal
    }
  };