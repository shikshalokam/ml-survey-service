/**
 * name : updateUserProfileInObservationAndSubmissions.js
 * author : Priyanka Pradeep
 * created-date : 10-Nov-2022
 * Description : Migration script for update userProfile in observation
 */

 const path = require("path");
 let rootPath = path.join(__dirname, '../../')
 require('dotenv').config({ path: rootPath+'/.env' })
 
 let _ = require("lodash");
 let mongoUrl = process.env.MONGODB_URL;
 let dbName = mongoUrl.split("/").pop();
 let url = mongoUrl.split(dbName)[0];
 var MongoClient = require('mongodb').MongoClient;
 var ObjectId = require('mongodb').ObjectID;
 
 var fs = require('fs');
 const request = require('request');
 
 const userServiceUrl = "http://learner-service:9000";
 const endPoint = "/v1/location/search";
 const userReadEndpoint =  "/private/user/v1/read";
 
 (async () => {
 
     let connection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
     let db = connection.db(dbName);
 
     try {
 
         let updatedObservationIds = [];
         let updatedSubmissionIds = 0;
         
         //get all Observations
         let observationDocument = await db.collection('observations').find({
             userRoleInformation: {$exists : true},
             userProfile: {$exists : false},
         }).project({ "_id": 1}).toArray();
 
         let chunkOfObservationDocument = _.chunk(observationDocument, 10);
         let observationIds;
 
         for (let pointerToObservation = 0; pointerToObservation < chunkOfObservationDocument.length; pointerToObservation++) {
             
             observationIds = await chunkOfObservationDocument[pointerToObservation].map(
                 observationDoc => {
                 return observationDoc._id;
                 }
             );

             //get user ids of observations without profile
            let userIdsWithoutProfile = await db.collection('observations').find({
                _id: { $in : observationIds }
            }).project({ 
                "_id" : 1,
                "createdBy" : 1
            }).toArray();
            
            //loop userIds- These user profiles are absent in observation
            for ( let count = 0; count < userIdsWithoutProfile.length; count++ ) {

                let observationIdWithoutUserProfile = userIdsWithoutProfile[count]._id;
                let userId = userIdsWithoutProfile[count].createdBy;
                
                //call profile api to get user profile
                let profile = await profileReadPrivate(userId);
            
                // update observation with profile
                if( profile.success && profile.data && profile.data.response ) {
                    let updateObject = {
                        "$set" : {}
                    };
                    updateObject["$set"]["userProfile"] = profile.data.response;
                    
                    await db.collection('observations').findOneAndUpdate({
                        "_id" : observationIdWithoutUserProfile
                    },updateObject);
                }

            }
 
             let observationDocuments = await db.collection('observations').find({
                 _id: { $in : observationIds },
                 userProfile: {$exists : true}
             }).project({ 
                 "_id": 1,
                 "userRoleInformation" : 1,
                 "userProfile" : 1
             }).toArray();
 
             //loop all observation
             for ( let count = 0; count < observationDocuments.length; count++ ) {
 
                 let observation = observationDocuments[count];
                 let userProfile = observation.userProfile;
                 
                 let updateUserProfileRoleInformation = false;   // Flag to see if roleInformation i.e. userProfile.profileUserTypes has to be updated based on userRoleInfromation.roles
 
                 if(observation.userRoleInformation.role) { // Check if userRoleInformation has role value.
                     let rolesInUserRoleInformation = observation.userRoleInformation.role.split(","); // userRoleInfomration.role can be multiple with comma separated.
 
                     let resetCurrentUserProfileRoles = false; // Flag to reset current userProfile.profileUserTypes i.e. if current role in profile is not at all there in userRoleInformation.roles
                     // Check if userProfile.profileUserTypes exists and is an array of length > 0
                     if(userProfile.profileUserTypes && Array.isArray(userProfile.profileUserTypes) && userProfile.profileUserTypes.length >0) {
 
                         // Loop through current roles in userProfile.profileUserTypes
                         for (let pointerToCurrentProfileUserTypes = 0; pointerToCurrentProfileUserTypes < userProfile.profileUserTypes.length; pointerToCurrentProfileUserTypes++) {
                             const currentProfileUserType = userProfile.profileUserTypes[pointerToCurrentProfileUserTypes];
 
                             if(currentProfileUserType.subType && currentProfileUserType.subType !== null) { // If the role has a subType
 
                                 // Check if subType exists in userRoleInformation role, if not means profile data is old and should be reset.
                                 if(!observation.userRoleInformation.role.toUpperCase().includes(currentProfileUserType.subType.toUpperCase())) {
                                     resetCurrentUserProfileRoles = true; // Reset userProfile.profileUserTypes
                                     break;
                                 }
                             } else { // If the role subType is null or is not there
 
                                 // Check if type exists in userRoleInformation role, if not means profile data is old and should be reset.
                                 if(!observation.userRoleInformation.role.toUpperCase().includes(currentProfileUserType.type.toUpperCase())) {
                                     resetCurrentUserProfileRoles = true; // Reset userProfile.profileUserTypes
                                     break;
                                 }
                             }
                         }
                     }
                     if(resetCurrentUserProfileRoles) { // Reset userProfile.profileUserTypes
                         userProfile.profileUserTypes = new Array;
                     }
 
                     // Loop through each subRole in userRoleInformation
                     for (let pointerToRolesInUserInformation = 0; pointerToRolesInUserInformation < rolesInUserRoleInformation.length; pointerToRolesInUserInformation++) {
                         const subRole = rolesInUserRoleInformation[pointerToRolesInUserInformation];
                         // Check if userProfile.profileUserTypes exists and is an array of length > 0
                         if(userProfile.profileUserTypes && Array.isArray(userProfile.profileUserTypes) && userProfile.profileUserTypes.length >0) {
                             if(!_.find(userProfile.profileUserTypes, { 'type': subRole.toLowerCase() }) && !_.find(userProfile.profileUserTypes, { 'subType': subRole.toLowerCase() })) { 
                                 updateUserProfileRoleInformation = true; // Need to update userProfile.profileUserTypes
                                 if(subRole.toUpperCase() === "TEACHER") { // If subRole is not teacher
                                     userProfile.profileUserTypes.push({
                                         "subType" : null,
                                         "type" : "teacher"
                                     })
                                 } else { // If subRole is not teacher
                                     userProfile.profileUserTypes.push({
                                         "subType" : subRole.toLowerCase(),
                                         "type" : "administrator"
                                     })
                                 }
                             }
                         } else { // Make a new entry if userProfile.profileUserTypes is empty or does not exist.
                             updateUserProfileRoleInformation = true; // Need to update userProfile.profileUserTypes
                             userProfile.profileUserTypes = new Array;
                             if(subRole.toUpperCase() === "TEACHER") { // If subRole is teacher
                                 userProfile.profileUserTypes.push({
                                     "subType" : null,
                                     "type" : "teacher"
                                 })
                             } else { // If subRole is not teacher
                                 userProfile.profileUserTypes.push({
                                     "subType" : subRole.toLowerCase(),
                                     "type" : "administrator"
                                 })
                             }
                         }
                     }
                 }
 
                 // Create location only object from userRoleInformation
                 let userRoleInformationLocationObject = _.omit(observation.userRoleInformation, ['role']);
                 
                 // All location keys from userRoleInformation
                 let userRoleInfomrationLocationKeys = Object.keys(userRoleInformationLocationObject);
 
                 let updateUserProfileLocationInformation = false;   // Flag to see if userLocations i.e. userProfile.userLocations has to be updated based on userRoleInfromation location values
 
                 // Loop through all location keys.
                 for (let pointerToUserRoleInfromationLocationKeys = 0; pointerToUserRoleInfromationLocationKeys < userRoleInfomrationLocationKeys.length; pointerToUserRoleInfromationLocationKeys++) {
                     
                     const locationType = userRoleInfomrationLocationKeys[pointerToUserRoleInfromationLocationKeys]; // e.g. state, district, school
                     const locationValue = userRoleInformationLocationObject[locationType]; // Location UUID values or school code.
                     
                     // Check if userProfile.userLocations exists and is an array of length > 0
                     if(userProfile.userLocations && Array.isArray(userProfile.userLocations) && userProfile.userLocations.length >0) {
 
                         if(locationType === "school") { // If location type school exist check if same is there in userProfile.userLocations
                             if(!_.find(userProfile.userLocations, { 'type': "school", 'code': locationValue })) {
                                 updateUserProfileLocationInformation = true; // School does not exist in userProfile.userLocations, update entire userProfile.userLocations
                                 break;
                             }
                         } else { // Check if location type is there in userProfile.userLocations and has same value as userRoleInformation
                             if(!_.find(userProfile.userLocations, { 'type': locationType, 'id': locationValue })) {
                                 updateUserProfileLocationInformation = true; // Location does not exist in userProfile.userLocations, update entire userProfile.userLocations
                                 break;
                             }
                         }
                     } else {
                         updateUserProfileLocationInformation = true;
                         break;
                     }
                 }
 
                 if(userProfile.userLocations && Array.isArray(userProfile.userLocations) && userProfile.userLocations.length >0) {
                     if(userProfile.userLocations.length != userRoleInfomrationLocationKeys.length) {
                         updateUserProfileLocationInformation = true;
                     }
                 }
 
                 // If userProfile.userLocations has to be updated, get all values and set in userProfile.
                 if(updateUserProfileLocationInformation) {
 
                     //update userLocations in userProfile
                     let locationIds = [];
                     let locationCodes = [];
                     let userLocations = new Array;
 
                     userRoleInfomrationLocationKeys.forEach( requestedDataKey => {
                         if (checkIfValidUUID(userRoleInformationLocationObject[requestedDataKey])) {
                             locationIds.push(userRoleInformationLocationObject[requestedDataKey]);
                         } else {
                             locationCodes.push(userRoleInformationLocationObject[requestedDataKey]);
                         }
                     })
 
                     //query for fetch location using id
                     if ( locationIds.length > 0 ) {
                         let locationQuery = {
                             "id" : locationIds
                         }
 
                         let entityData = await locationSearch(locationQuery);
                         if ( entityData.success ) {
                             userLocations = entityData.data;
                         }
                     }
 
                     // query for fetch location using code
                     if ( locationCodes.length > 0 ) {
                         let codeQuery = {
                             "code" : locationCodes
                         }
 
                         let entityData = await locationSearch(codeQuery);
                         if ( entityData.success ) {
                             userLocations =  userLocations.concat(entityData.data);
                         }
                     }
 
                     if ( userLocations.length > 0 ) {
                         userProfile["userLocations"] = userLocations;
                     }
                 }
 
 
                 //update observation and observation submission if userProfile role or location information is incorrect
                 if ( updateUserProfileRoleInformation || updateUserProfileLocationInformation ) {
                     
                     
                     let updateObject = {
                         "$set" : {}
                     };
                     if(updateUserProfileRoleInformation) {
                         updateObject["$set"]["userProfile.profileUserTypes"] = userProfile.profileUserTypes;
                         updateObject["$set"]["userProfile.userRoleMismatchFoundAndUpdated"] = true;
                     }
                     if(updateUserProfileLocationInformation) {
                         updateObject["$set"]["userProfile.userLocations"] = userProfile.userLocations;
                         updateObject["$set"]["userProfile.userLocationsMismatchFoundAndUpdated"] = true;
                     }
 
                     await db.collection('observations').findOneAndUpdate({
                         "_id" : observation._id
                     },updateObject);
 
                     updatedObservationIds.push(observation._id.toString());
                     // update submission
                     let updateSubmission = await db.collection('observationSubmissions').updateMany({
                         "observationId" : observation._id
                     },updateObject);
 
                     updatedSubmissionIds = updatedSubmissionIds + updateSubmission.modifiedCount;
                 }
 
             }
 
             //write updated observation ids to file
             fs.writeFile(
                 'updatedObservationIds.json',
 
                 JSON.stringify(updatedObservationIds),
 
                 function (err) {
                     if (err) {
                         console.error('Crap happens');
                     }
                 }
             );
         }
 
         function locationSearch ( filterData ) {
             return new Promise(async (resolve, reject) => {
                 try {
                     
                     let bodyData={};
                     bodyData["request"] = {};
                     bodyData["request"]["filters"] = filterData;
                     const url = userServiceUrl + endPoint;
                     const options = {
                     headers : {
                         "content-type": "application/json"
                     },
                     json : bodyData
                     };
         
                     request.post(url,options,requestCallback);
 
                     let result = {
                     success : true
                     };
         
                     function requestCallback(err, data) {   
                         if (err) {
                             result.success = false;
                         } else {
                             let response = data.body;
                             if( response.responseCode === "OK" &&
                                 response.result &&
                                 response.result.response &&
                                 response.result.response.length > 0
                             ) {
                                 let entityResult = new Array;
                                 response.result.response.map(entityData => {
                                     let entity = _.omit(entityData, ['identifier']);
                                     entityResult.push(entity);
                                 })
                                 result["data"] = entityResult;
                                 result["count"] = response.result.count;      
                             } else {
                             result.success = false;
                             }
                         }
                         return resolve(result);
                     }
         
                     setTimeout(function () {
                         return resolve (result = {
                             success : false
                     });
                     }, 5000);
         
                 } catch (error) {
                     return reject(error);
                 }
             })
         }

         function profileReadPrivate (userId) {
            return new Promise(async (resolve, reject) => {
                try {
                    //  <--- Important : This url endpoint is private do not use it for regular workflows --->
                    let url = userServiceUrl + userReadEndpoint + "/" + userId;
                    const options = {
                        headers : {
                            "content-type": "application/json"
                        }
                    };
                    request.get(url,options,userReadCallback);
                    let result = {
                        success : true
                    };
                    function userReadCallback(err, data) { 
                        if (err) {
                            result.success = false;
                        } else {
                            
                            let response = JSON.parse(data.body);
                            if( response.responseCode === "OK" ) {
                                result["data"] = response.result;
                            } else {
                                result.success = false;
                            }
        
                        }   
                        return resolve(result);
                    }
                    setTimeout(function () {
                        return resolve (result = {
                            success : false
                         });
                     }, 5000);
        
                } catch (error) {
                    return reject(error);
                }
            })
        }
 
         console.log("Updated observation Count : ", updatedObservationIds.length);
         console.log("Updated submission count : ", updatedSubmissionIds )
         console.log("completed")
         connection.close();
     }
     catch (error) {
         console.log(error)
     }
 })().catch(err => console.error(err));
 
 function checkIfValidUUID(value) {
 const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
 return regexExp.test(value);
 }