/**
 * name : userOverviewController.js
 * author : Saish
 * created-date : 20-june-2024
 * Description : User overview api
 */

// Dependencies
const observationsHelper = require(MODULES_BASE_PATH + "/observations/helper")
const observationSubmissionsHelper = require(MODULES_BASE_PATH +
    "/observationSubmissions/helper");
/**
    * userOverview
    * @class
*/
module.exports = class userOverview extends Abstract {
    constructor() {
        super(observationSubmissionsSchema);
      }
    
      static get name() {
        return "observationSubmissions";
      }
       /**
     * @api {get} /assessment/api/v1/userOverview/listObservationInfo Get Overview Info of observation consumed by an user
     * @apiVersion 1.0.0
     * @apiName List Observation Info
     * @apiGroup userOverview
     * @apiHeader {String} X-authenticated-user-token Authenticity token
     * @apiSampleRequest /assessment/api/v1/userOverview/listObservationInfo
     * @apiParamExample {json} Response:
{
    "message": "Observation overview information fetched successfully",
    "status": 200,
    "result": [
        {
            "_id": "60caf260ecea0772d81d7e5e",
            "entities": [
                "8ac1efe9-0415-4313-89ef-884e1c8eee34",
                "b54a5c6d-98be-4313-af1c-33040b1703aa",
                "2f76dcf5-e43b-4f71-a3f2-c8f19e1fce03"
            ],
            "isAPrivateProgram": false,
            "name": "AP-TEST-PROGRAM-3.6.5-OBS-1-DEO",
            "description": "Description of AP-TEST-PROGRAM-3.6.5-OBS-1-DEO",
            "status": "published",
            "submissionInfoArray": [
                [
                    {
                        "_id": "60d1d97ea2709472c8c49b09",
                        "entityId": "8ac1efe9-0415-4313-89ef-884e1c8eee34",
                        "entityInformation": {
                            "name": "SRIKAKULAM"
                        },
                        "entityType": "district",
                        "createdBy": "fca2925f-1eee-4654-9177-fece3fd6afc9",
                        "status": "started",
                        "title": "Observation 1"
                    }
                ],
                [
                    {
                        "_id": "60d58ee5983c1372591ccb5b",
                        "entityId": "b54a5c6d-98be-4313-af1c-33040b1703aa",
                        "entityInformation": {
                            "name": "VIZIANAGARAM"
                        },
                        "entityType": "district",
                        "createdBy": "fca2925f-1eee-4654-9177-fece3fd6afc9",
                        "status": "completed",
                        "title": "Observation 1"
                    }
                ],
                [
                    {
                        "_id": "60caf262ecea0772d81d7e5f",
                        "entityId": "2f76dcf5-e43b-4f71-a3f2-c8f19e1fce03",
                        "entityInformation": {
                            "name": "ANANTAPUR"
                        },
                        "entityType": "district",
                        "createdBy": "fca2925f-1eee-4654-9177-fece3fd6afc9",
                        "status": "started",
                        "title": "Observation 1"
                    }
                ]
            ]
        }]}
     * @apiUse successBody
     * @apiUse errorBody
     */
     
    /**
    * list Observation Info
    * @method
    * @name listObservationInfo
    * @param {Object} req -request Data.
    * @returns {JSON} - List of observation consumed by an user
    */

    listObservationInfo(req) {
    return new Promise(async (resolve, reject) => {
        try {

            let queryObject = {
                createdBy: req.userDetails.userId,
            }

            let stats = req.query.stats;
            
            let fields = [
                'name',
                'isAPrivateProgram',
                'entities',
                'status',
                'description',

            ] 

            if (stats == "true") {
              fields = ["_id"];
            }
            let observationDocument =
              await observationsHelper.observationDocuments(
                queryObject,
                fields
              );
            if (stats !== "true") {
              for (let i = 0; i < observationDocument.length; i++) {
                let submissionInfoArray = [];
                let observationId = observationDocument[i]._id;
                let entityArray = observationDocument[i].entities;

                for (let j = 0; j < entityArray.length; j++) {
                  let entityId = entityArray[j];
                  let observationSubmissions =
                    await observationSubmissionsHelper.observationSubmissionsDocument(
                      {
                        observationId: observationId,
                        entityId: entityId,
                      },
                      [
                        "_id",
                        "title",
                        "status",
                        "createdBy",
                        "entityId",
                        "entity.type",
                        "entityInformation.name",
                        "entityType",
                        "createdAt",
                        "updatedAt",
                      ]
                    );

                  if (
                    observationSubmissions &&
                    observationSubmissions.length > 0
                  ) {
                    let updatedAt = observationSubmissions[0].updatedAt;
                    let createdAt = observationSubmissions[0].createdAt;

                    delete observationSubmissions[0].updatedAt;
                    delete observationSubmissions[0].createdAt;
                    observationSubmissions[0].started = createdAt;
                    if (
                      observationSubmissions &&
                      observationSubmissions[0].status == "completed"
                    ) {
                      observationSubmissions[0].completed = updatedAt;
                    }
                  } else {
                    continue;
                  }

                  submissionInfoArray.push(observationSubmissions[0]);
                }
                observationDocument[i]["submissionInfoArray"] =
                  submissionInfoArray;
              }
            }
            return resolve({
                message:messageConstants.apiResponses.OBSERVATION_OVERVIEW_INFORMATION_FETCHED,
                result: observationDocument
            });

        } catch (error) {

            return reject({
                status: error.status || httpStatusCode.internal_server_error.status,
                message: error.message || httpStatusCode.internal_server_error.message,
                errorObject: error
            });
        }
    })
}


}
