/**
 * name : deltaDataMigrationScriptForOCI.js
 * author : Vishnu
 * created-date : 27-04-2023
 * Description : Migration script for OCI mongoDB.
 */

// Dependencies
const path = require("path");
let ROOT_PATH = path.join(__dirname, '../../')
require('dotenv').config({ path: ROOT_PATH+'/.env' })
let _ = require("lodash");
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
const kafkaClient = require(ROOT_PATH + "generics/helpers/kafkaCommunications");

// DB credentials 
let mongoUrlOfOCIDb = process.env.MONGODB_URL;
let ociDbName = mongoUrlOfOCIDb.split("/").pop();
let DbUrl = mongoUrlOfOCIDb.split(ociDbName)[0];
let azureDbName = "sl-prod-old";

(async () => {
    // Azure DB connection && OCI db connection
    let connection = await MongoClient.connect(DbUrl, { useNewUrlParser: true });
    let db_Azure = connection.db(azureDbName);
    let db_OCI = connection.db(ociDbName);

    try {
        console.log("--------------------Execution Started------------------")
        let collections = ["observations","observationSubmissions", "surveys", "surveySubmissions"];
        const fromDate = new Date('2023-04-18T00:00:00Z'); // Specify the date from which to fetch data
        let mongoIdsFromAzureDb = [];
        let mongoIdsFromOCIDb = [];
        let missingObservations = [];
        let missingObservationSubmissions = [];
        let missingSurveys = [];
        let missingSurveySubmissions= [];
       
        // Loop through each collection
        for( let index = 0; index < collections.length; index++ ) {
            // get data from Azure Db
            let collectionDetailsFromAzureDb = await db_Azure.collection(collections[index]).find({
                createdAt: {"$gte": fromDate},
            }).project({_id:1}).toArray();

            // get mongoIds 
            mongoIdsFromAzureDb = await getArrayOfMongoIds(collectionDetailsFromAzureDb);
        
            // get data fromOCI Db
            let collectionDetailsFromOCIDb = await db_OCI.collection(collections[index]).find({
            }).project({_id:1}).toArray();

            // get mongoIds 
            mongoIdsFromOCIDb = await getArrayOfMongoIds(collectionDetailsFromOCIDb)

            let missingDataIds = _.differenceWith(mongoIdsFromAzureDb, mongoIdsFromOCIDb,_.isEqual);
           
            if (collections[index] == "observations"){
                missingObservations = missingDataIds;
            } else if (collections[index] == "observationSubmissions"){
                missingObservationSubmissions = missingDataIds;
            } else if (collections[index] == "surveys"){
                missingSurveys = missingDataIds;
            } else {
                missingSurveySubmissions = missingDataIds;
            }
        }
        // check for missing ids and if present create doc and call kafka events
        if ( missingObservations.length > 0 ){
            await createDataInOCIdatabaseCollection(missingObservations,"observations");
        }

        if ( missingObservationSubmissions.length > 0 ){
            await createDataInOCIdatabaseCollection(missingObservationSubmissions,"observationSubmissions");
        }

        if ( missingSurveys.length > 0 ){
            await createDataInOCIdatabaseCollection(missingSurveys,"surveys");
        }

        if ( missingSurveySubmissions.length > 0 ){
            await createDataInOCIdatabaseCollection(missingSurveySubmissions,"surveySubmissions");
        }

        /**
         * createDataInOCIdatabaseCollection
         * @param {Array} mongoIds -  _ids
         * @param {String} collectionName
         */
        async function createDataInOCIdatabaseCollection (mongoIds,collectionName) {
            try{
                let collectionDetailsFromAzureDb = await db_Azure.collection(collectionName).find({
                    _id: {"$in": mongoIds},
                }).project().toArray();
    
                let chunkOfDocument = _.chunk(collectionDetailsFromAzureDb, 10);
                for ( let chunkOfDocumentIndex = 0; chunkOfDocumentIndex < chunkOfDocument.length; chunkOfDocumentIndex++ ) {
                    await insertIntoOCIDatabase(chunkOfDocument[chunkOfDocumentIndex],collectionName);
                }
                
            }catch(err){
                console.log("error occured")
            }
        }
 
        /**
         * insertIntoOCIDatabase
         * @param {Object} data - data to create
         * @param {String} collectionName 
        */
        async function insertIntoOCIDatabase (data,collectionName) {
            try{
                // create doc
                let createDoc = await db_OCI.collection(collectionName).insertMany(data);
                if(createDoc.ops && createDoc.ops.length > 0 && (collectionName === "observationSubmissions" || collectionName === "surveySubmissions")) {
                    for (let index=0; index < createDoc.ops.length; index++) {
                        await callKafkaEvents(createDoc.ops[index],collectionName);
                    }
                }    
                return createDoc;
                
            }catch(err){
                console.log("error occured")
            }
        }

        /**
         * callKafkaEvents
         * @param {Object} data - event data to push int kafka
         * @param {String} collectionName 
         */
        async function callKafkaEvents (data,collectionName) {
            try{
               if (collectionName == "observationSubmissions"){
                    //push observation submission to Kafka
                    kafkaClient.pushObservationSubmissionToKafka(data);
                    if(data.status && data.status === "ratingPending") {
                        await kafkaClient.pushObservationSubmissionToKafkaQueueForRating({submissionModel : "observationSubmissions",submissionId : data._id});
                    }
                } else {
                    // call surveySubmissionsEvents
                    if(data.status && data.status === "completed") {
                        await kafkaClient.pushCompletedSurveySubmissionToKafka(data);
                    } else {
                        await kafkaClient.pushInCompleteSurveySubmissionToKafka(data);
                    }
                }
                
            }catch(err){
                console.log("error occured")
            }
        }

        /**
         * getArrayOfMongoIds 
         * @param {Array} data 
         * @request - [{6025062519f84e54685df33f}]
         * @returns {Array} - [6025062519f84e54685df33f]
         */
        async function getArrayOfMongoIds( data ) {
            // get mongoIds 
            let mongoIdsArray = [];
            if ( data.length > 0 ) {
                mongoIdsArray = data.map(function (obj) {
                  return obj._id;
                });
                return mongoIdsArray;
            } else {
                return mongoIdsArray;
            }
        }

        //write added doc ids to file
        fs.writeFile(
            'AddedDocIds.json',
            JSON.stringify({observations:missingObservations,observatioSubmissions:missingObservationSubmissions,surveys:missingSurveys,surveySubmissions:missingSurveySubmissions}),

            function (err) {
                if (err) {
                    console.error('Crap happens');
                }
            }
        );
        
        console.log("observations added:",missingObservations.length);
        console.log("observationSubmissions added :",missingObservationSubmissions.length);
        console.log("surveys added :",missingSurveys.length);
        console.log("surveySubmissions added :",missingSurveySubmissions.length);
        console.log("--------------------Execution Finished------------------")                    
        connection.close();
   }
   catch (error) {
       console.log(error)
   }
})().catch(err => console.error(err));