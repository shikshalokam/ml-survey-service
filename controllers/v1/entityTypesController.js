/**
 * name : entityTypesController.js
 * author : Akash
 * created-date : 22-Nov-2018
 * Description : Entity types information. 
 */

 // Dependencies
const csv = require("csvtojson");
const entitiyTypesHelper = require(MODULES_BASE_PATH + "/entityTypes/helper");
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");
const FileStream = require(ROOT_PATH + "/generics/fileStream");

 /**
    * EntityTypes
    * @class
*/
module.exports = class EntityTypes extends Abstract {
  constructor() {
    super(entityTypesSchema);
  }

  static get name() {
    return "entityTypes";
  }


  /**
  * @api {get} /assessment/api/v1/entityTypes/canBeObserved /:stateId
  * Entity Type list which can be observed.
  * @apiVersion 1.0.0
  * @apiName Entity Type Observable list
  * @apiGroup Entity Types
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/entityTypes/canBeObserved/5da829874c67d63cca1bd9d0
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
    "message": "Entity types fetched successfully.",
    "status": 200,
    "result": [
        {
            "_id": "5d15a959e9185967a6d5e8a6",
            "name": "school"
        }
    ]
  }
  */

  /**
   * Get all the entity types which can be observed.
   * @method
   * @name canBeObserved 
   * @returns {JSON} - List of all entity types that can be observed.
   */

  canBeObserved(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entitiyTypesHelper.canBeObserved(
          req.params._id ? req.params._id : ""
        );

        return resolve(result);

      } catch (error) {

        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });

      }


    })
  }


  /**
  * @api {get} /assessment/api/v1/entityTypes/createGroupEntityTypeIndex 
  * Create groups.entityType index
  * @apiVersion 1.0.0
  * @apiName Create groups.entityType index
  * @apiGroup Entity Types
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/entityTypes/createGroupEntityTypeIndex
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
    "message": "Entity type index created successfully.",
    "status": 200,
    "result": [
        "Index successfully created for entity type - school"
      ]
    }
  */

   /**
   * Get all the entity types which can be observed.
   * @method
   * @name createGroupEntityTypeIndex 
   * @returns {JSON} - List of all entity types that can be observed.
   */

  createGroupEntityTypeIndex() {
    return new Promise(async (resolve, reject) => {

      try {

        const result = await entitiyTypesHelper.list({}, { name: 1 });

        let indexResult = await Promise.all(result.map(async entityType => {
          const indexCreation = await entitiesHelper.createGroupEntityTypeIndex(entityType.name);
          return "Index successfully created for entity type - " + entityType.name;
        }))

        if (
          indexResult.findIndex(
            index => index === undefined || index === null
          ) >= 0
        ) {
          throw messageConstants.apiResponses.SOMETHING_WENT_WRONG +"entity group index was not created.";
        }

        return resolve({
          message: messageConstants.apiResponses.ENTITY_TYPE_INDEX,
          result: indexResult
        });

      } catch (error) {

        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        })

      }


    })
  }

   /**
  * @api {get} /assessment/api/v1/entityTypes/list List all entity types.
  * @apiVersion 1.0.0
  * @apiName Entity Type list
  * @apiGroup Entity Types
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/entityTypes/list
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * "result": [
    {
      "_id": "5ce23d633c330302e720e661",
      "name": "teacher"
    },
    {
      "_id": "5ce23d633c330302e720e663",
      "name": "schoolLeader"
    }
    ]
  */

  /**
   * List all the entity types.
   * @method
   * @name list 
   * @returns {JSON} - List of all entity types.
   */

  list() {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entitiyTypesHelper.list("all", { name: 1 });

        return resolve({
          message: messageConstants.apiResponses.ENTITY_TYPES_FETCHED,
          result: result
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

     /**
  * @api {post} /assessment/api/v1/entityTypes/find find entity type based on query.
  * @apiVersion 1.0.0
  * @apiName find entity type based on query
  * @apiGroup Entity Types
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/entityTypes/find
  * @apiParamExample {json} Request-Body:
  * {
    "query" : {
        "name" : "school"
    },
    "projection" : {
      "_id" : 1,
      "name" : 1
    }
  }
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
    "message": "Entity types fetched successfully.",
    "status": 200,
    "result": [
        {
            "_id": "5d15a959e9185967a6d5e8a6",
            "name": "school"
        }
    ]
}
  */

  /**
   * find entity types.
   * @method
   * @name find 
   * @param {Object} req - requested data.
   * @param {Object} req.body.query - filtered data.
   * @param {Array} req.body.projection - Projected field.
   * @param {Array} req.body.skipFields - Field to skip.
   * @returns {JSON} - find entity types.
   */

  find(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entitiyTypesHelper.list(
          req.body.query, 
          req.body.projection,
          req.body.skipFields
        );

        return resolve({
          message: messageConstants.apiResponses.ENTITY_TYPES_FETCHED,
          result: result
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

  /**
  * @api {post} /assessment/api/v1/entityTypes/bulkCreate Bulk Create Entity Types
  * @apiVersion 1.0.0
  * @apiName Bulk Create Entity Types
  * @apiGroup Entity Types
  * @apiParam {File} entityTypes Mandatory entity Type file of type CSV.
  * @apiSampleRequest /assessment/api/v1/entityTypes/bulkCreate
  * @apiUse successBody
  * @apiUse errorBody
  */

    /**
   * Bulk create Entity Types.
   * @method
   * @name bulkCreate
   * @param {Object} req -request data.
   * @param {Object} req.files.entityTypes -entityTypes data.
   * @returns {CSV} Bulk create entity Types data. 
   */

  bulkCreate(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let entityTypesCSVData = await csv().fromString(req.files.entityTypes.data.toString());

        if (!entityTypesCSVData || entityTypesCSVData.length < 1) {
          throw messageConstants.apiResponses.FILE_DATA_MISSING;
        }

        let newEntityTypeData = await entitiyTypesHelper.bulkCreate(entityTypesCSVData, req.userDetails);

        if (newEntityTypeData.length > 0) {

          const fileName = `EntityType-Upload`;
          let fileStream = new FileStream(fileName);
          let input = fileStream.initStream();

          (async function () {
            await fileStream.getProcessorPromise();
            return resolve({
              isResponseAStream: true,
              fileNameWithPath: fileStream.fileNameWithPath()
            });
          }());

          await Promise.all(newEntityTypeData.map(async entityType => {
            input.push(entityType);
          }))

          input.push(null);

        } else {
          throw messageConstants.apiResponses.SOMETHING_WENT_WRONG;
        }

      } catch (error) {

        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });

      }


    })
  }

  /**
  * @api {post} /assessment/api/v1/entityTypes/bulkUpdate Bulk Update Entity Types
  * @apiVersion 1.0.0
  * @apiName Bulk Create Entity Types
  * @apiGroup Entity Types
  * @apiParam {File} entityTypes Mandatory entity Type file of type CSV.
  * @apiSampleRequest /assessment/api/v1/entityTypes/bulkUpdate
  * @apiUse successBody
  * @apiUse errorBody
  */

    /**
   * Bulk update Entity Types.
   * @method
   * @name bulkUpdate
   * @param {Object} req -request data.
   * @param {Object} req.files.entityTypes -entityTypes data.
   * @returns {CSV} Bulk update entity Types data. 
   */

  bulkUpdate(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let entityTypesCSVData = await csv().fromString(req.files.entityTypes.data.toString());

        if (!entityTypesCSVData || entityTypesCSVData.length < 1) {
          throw messageConstants.apiResponses.FILE_DATA_MISSING;
        }

        let newEntityTypeData = await entitiyTypesHelper.bulkUpdate(entityTypesCSVData, req.userDetails);

        if (newEntityTypeData.length > 0) {

          const fileName = `EntityType-Upload`;
          let fileStream = new FileStream(fileName);
          let input = fileStream.initStream();

          (async function () {
            await fileStream.getProcessorPromise();
            return resolve({
              isResponseAStream: true,
              fileNameWithPath: fileStream.fileNameWithPath()
            });
          }());

          await Promise.all(newEntityTypeData.map(async entityType => {
            input.push(entityType);
          }))

          input.push(null);

        } else {
          throw messageConstants.apiResponses.SOMETHING_WENT_WRONG;
        }

      } catch (error) {

        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });

      }


    })
  }

};
