/**
 * name : programsController.js
 * author : Akash
 * created-date : 20-Jan-2019
 * Description : Programs related information
 */

// Dependencies
const submissionsHelper = require(MODULES_BASE_PATH + "/submissions/helper");
const insightsHelper = require(MODULES_BASE_PATH + "/insights/helper");
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const programsHelper = require(MODULES_BASE_PATH + "/programs/helper");

/**
    * Programs
    * @class
*/
module.exports = class Programs extends Abstract {

  constructor() {
    super(programsSchema);
  }

  static get name() {
    return "programs";
  }

  find(req) {
    return super.find(req);
  }

  /**
  * @api {get} /assessment/api/v1/programs/list List all the programs
  * @apiVersion 1.0.0
  * @apiName Fetch Program List
  * @apiGroup Program
  * @apiParamExample {json} Response:
    "result": [
      {
        "_id": "5b98d7b6d4f87f317ff615ee",
        "externalId": "PROGID01",
        "name": "DCPCR School Development Index 2018-19",
        "description": "DCPCR School Development Index 2018-19",
        "assessments": [
          {
            "_id": "5b98fa069f664f7e1ae7498c",
            "externalId": "EF-DCPCR-2018-001",
            "name": "DCPCR Assessment Framework 2018",
            "description": "DCPCR Assessment Framework 2018"
          }
        ]
      }
    ]
  * @apiUse successBody
  * @apiUse errorBody
  */

    /**
   * List programs.
   * @method
   * @name list
   * @returns {JSON} - List of programs
   */

  async list(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let programDocument = await database.models.programs.aggregate([
          {
            $lookup: {
              from: "solutions",
              localField: "components",
              foreignField: "_id",
              as: "assessments"
            }
          },
          {
            $project: {
              externalId: 1,
              name: 1,
              description: 1,
              "assessments._id": 1,
              "assessments.externalId": 1,
              "assessments.name": 1,
              "assessments.description": 1
            }
          }
        ]);

        if (!programDocument) {
          return reject({
            status: httpStatusCode.not_found.status,
            message: messageConstants.apiResponses.PROGRAM_NOT_FOUND
          });
        }

        let response = { message: messageConstants.apiResponses.PROGRAM_LIST, result: programDocument };

        return resolve(response);

      }
      catch (error) {
        return reject({ message: error });
      }
    })

  }

  /**
  * @api {get} /assessment/api/v1/programs/entityList?solutionId=""&search="" Fetch Entity List
  * @apiVersion 1.0.0
  * @apiName Fetch Entity List 
  * @apiGroup Program
  * @apiParam {String} solutionId Solution ID.
  * @apiParam {String} Page Page.
  * @apiParam {String} Limit Limit.
  * @apiSampleRequest /assessment/api/v1/programs/entityList?solutionId=5c5693fd28466d82967b9429&search=
  * @apiParamExample {json} Response:
    "result": {
        "totalCount": 54,
        "entityInformation": [
          {
            "externalId": "EXC1001",
            "addressLine1": "Chaitanya Nagar, Gajuwaka, Visakhapatnam, Andhra Pradesh",
            "name": "Chalapathi School",
            "administration": "",
            "status": ""
          }
        ]
      }  
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * List of entity.
   * @method
   * @name entityList
   * @param req - request data.
   * @param req.query.solutionId -solutionId
   * @returns {JSON} - Entity list.
   */

  async entityList(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let solutionId = req.query.solutionId;

        let result = {};

        let solutionDocument = await database.models.solutions.findOne({ _id: ObjectId(solutionId) }, { "entities": 1 }).lean();

        let limitValue = (!req.pageSize) ? "" : req.pageSize;
        let skipValue = (!req.pageNo) ? "" : (req.pageSize * (req.pageNo - 1));

        let queryObject = {};
        queryObject["_id"] = { $in: solutionDocument.entities };
        if (req.searchText != "") {
          queryObject["$or"] = [{ "metaInformation.name": new RegExp(req.searchText, 'i') }, { "metaInformation.externalId": new RegExp(req.searchText, 'i') }];
        }

        let entityDocuments = await database.models.entities.find(queryObject, {
          "metaInformation.name": 1, "metaInformation.addressLine1": 1, "metaInformation.administration": 1, "metaInformation.externalId": 1
        }).limit(limitValue).skip(skipValue).lean();

        let totalCount = await database.models.entities.countDocuments(queryObject);

        let submissionDocument = await database.models.submissions.find({ entityId: { $in: entityDocuments.map(entity => entity._id) } }, { status: 1, entityId: 1 }).lean();

        let submissionEntityMap = _.keyBy(submissionDocument, 'entityId');

        result["totalCount"] = totalCount;

        result["entityInformation"] = entityDocuments.map(eachEntityDocument => {
          let status = submissionEntityMap[eachEntityDocument._id.toString()] ? submissionEntityMap[eachEntityDocument._id.toString()].status : "";
          return {
            "externalId": eachEntityDocument.metaInformation.externalId,
            "addressLine1": eachEntityDocument.metaInformation.addressLine1,
            "name": eachEntityDocument.metaInformation.name,
            "administration": eachEntityDocument.metaInformation.administration,
            "status": submissionsHelper.mapSubmissionStatus(status) || status
          }
        });

        return resolve({ message: messageConstants.apiResponses.ENTITY_LIST, result: result });
      }
      catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message
        })
      }
    })
  }

  /**
  * @api {get} /assessment/api/v1/programs/userEntityList?solutionId="" Fetch User Entity List
  * @apiVersion 1.0.0
  * @apiName Fetch User Entity List 
  * @apiGroup Program
  * @apiParam {String} SolutionId Solution ID.
  * @apiParam {String} Page Page.
  * @apiParam {String} Limit Limit.
  * @apiSampleRequest /assessment/api/v1/programs/userEntityList?solutionId=5b98fa069f664f7e1ae7498c
  * @apiParamExample {json} Response:
  * "result": {
        "entities": [
          {
           "_id": "5bfe53ea1d0c350d61b78d3d",
           "isSingleEntityHighLevel": true,
           "isSingleEntityDrillDown": true,
           "externalId": "1412153",
           "addressLine1": "Karam Vihar Hari Enclave Sultan Puri",
           "addressLine2": "",
           "city": "Urban",
           "name": "Nav Jyoti Public School, Karam Vihar Hari Enclave Sultan Puri Delhi"
          }
        ]
      }
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * List of entity assigned to logged in user.
   * @method
   * @name userEntityList
   * @param req - request data.
   * @param req.query.solutionId -solutionId
   * @param req.userDetails.userId - logged in user id. 
   * @returns {JSON} - Logged in user entity list.
   */

  async userEntityList(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let solutionId = req.query.solutionId;

        let solutionDocument = await database.models.solutions.findOne({ _id: ObjectId(solutionId) }, {
          _id: 1, entities: 1, programExternalId: 1
        }).lean();

        let entityAssessorQueryObject = [
          {
            $match: {
              userId: req.userDetails.userId,
              solutionId: solutionDocument._id
            }
          },
          {
            $lookup: {
              from: "entities",
              localField: "entities",
              foreignField: "_id",
              as: "entityDocuments"
            }
          },
          {
            $project: {
              "entities": 1,
              "entityDocuments._id": 1,
              "entityDocuments.metaInformation.externalId": 1,
              "entityDocuments.metaInformation.name": 1,
              "entityDocuments.metaInformation.addressLine1": 1,
              "entityDocuments.metaInformation.addressLine2": 1,
              "entityDocuments.metaInformation.city": 1,
              "entityDocuments.state": 1
            }
          }
        ];

        const assessorsDocument = await database.models.entityAssessors.aggregate(entityAssessorQueryObject);

        let entityIds = assessorsDocument[0].entityDocuments.map(eachEntityDocument => eachEntityDocument._id);

        let insightDocument = await insightsHelper.insightsDocument(solutionDocument.programExternalId, entityIds);

        let singleEntityDrillDown;

        if (insightDocument.length > 0) {
          let solutionDocument = await solutionsHelper.checkIfSolutionIsRubricDriven(insightDocument[0].solutionId);

          singleEntityDrillDown = solutionDocument ? true : false;

        }

        assessorsDocument[0].entityDocuments.forEach(eachEntityDocument => {
          if (insightDocument.length > 0 && insightDocument.some(eachInsight => eachInsight.entityId.toString() == eachEntityDocument._id.toString())) {
            eachEntityDocument["isSingleEntityHighLevel"] = true;
            eachEntityDocument["isSingleEntityDrillDown"] = singleEntityDrillDown;
          } else {
            eachEntityDocument["isSingleEntityHighLevel"] = false;
            eachEntityDocument["isSingleEntityDrillDown"] = false;
          }
          eachEntityDocument = _.merge(eachEntityDocument, { ...eachEntityDocument.metaInformation });
          delete eachEntityDocument.metaInformation;
        })


        return resolve({
          message: messageConstants.apiResponses.ENTITY_LIST,
          result: {
            entities: assessorsDocument[0].entityDocuments
          }
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
  * @api {get} /assessment/api/v1/programs/userList?solutionId=:solutionInternalId&search=:searchText&page=:page&limit=:limit Fetch User List
  * @apiVersion 1.0.0
  * @apiName Fetch User Entity List 
  * @apiGroup Program
  * @apiParam {String} ProgramId Program ID.
  * @apiParam {String} Page Page.
  * @apiParam {String} Limit Limit.
  * @apiSampleRequest /assessment/api/v1/programs/userList?solutionId=5b98fa069f664f7e1ae7498c&search=&page=1&limit=1
  * @apiParamExample {json} Response:
    "result": {
      "totalCount": 3055,
      "assessorInformation": [
      {
        "_id": "5bfe69021d0c350d61b78e68",
        "userId": "32172a5c-8bfe-4520-9089-355de77aac71",
        "__v": 0,
        "createdAt": "2019-01-01T00:00:00.000Z",
        "createdBy": "e7719630-0457-47ca-a5ce-8190ffb34f13",
        "externalId": "SPM001",
        "parentId": "",
        "programId": "5c9d0937a43629432ce631db",
        "role": "PROGRAM_MANAGER",
        "updatedAt": "2019-01-01T00:00:00.000Z",
        "updatedBy": "e7719630-0457-47ca-a5ce-8190ffb34f13",
        "solutionId": null,
        "entityTypeId": "5ce23d633c330302e720e65f",
        "entityType": "school"
      }
        ]
      }
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * List of assessors.
   * @method
   * @name userList
   * @param req - request data.
   * @param req.query.solutionId -solution id
   * @param req.searchText - searched text based on assessorName and assessorExternalId.
   * @param req.pageSize - page size limit.  
   * @param req.pageNo - page no.
   * @returns {JSON} - Logged in user entity list.
   */

  async userList(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let solutionId = req.query.solutionId;
        let assessorName = {};
        let assessorExternalId = {};

        if (req.searchText != "") {
          assessorName["assessorInformation.name"] = new RegExp((req.searchText), "i");
          assessorExternalId["assessorInformation.externalId"] = new RegExp((req.searchText), "i");
        }

        let solutionDocument = await database.models.solutions.aggregate([
          {
            $match: {
              _id: ObjectId(solutionId)
            }
          },
          {
            $project: {
              "entities": 1
            }
          },
          {
            "$addFields": { "entityIdInObjectIdForm": "$entities" }
          },
          {
            $lookup: {
              from: "entityAssessors",
              localField: "entityIdInObjectIdForm",
              foreignField: "entities",
              as: "assessorInformation"
            }
          },
          {
            $project: {
              "assessorInformation.entities": 0,
              "assessorInformation.deleted": 0
            }
          },
          {
            $unwind: "$assessorInformation"
          },
          {
            $match: { $or: [assessorName, assessorExternalId] }
          },
          {
            $facet: {
              "totalCount": [
                { "$count": "count" }
              ],
              "assessorInformationData": [
                { $skip: req.pageSize * (req.pageNo - 1) },
                { $limit: req.pageSize }
              ],
            }
          },
        ]);

        if (!solutionDocument) {
          throw "Bad request";
        }

        let result = {};

        result["totalCount"] = solutionDocument[0].totalCount[0].count;

        result["assessorInformation"] = solutionDocument[0].assessorInformationData.map(eachAssessor => eachAssessor.assessorInformation);

        return resolve({
          message: messageConstants.apiResponses.ASSESSOR_LIST,
          result: result
        });

      }
      catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
        });
      }
    })
  }


  /**
  * @api {get} /assessment/api/v1/programs/entityBlocks?solutionId="" Fetch Zone
  * @apiVersion 1.0.0
  * @apiName Fetch Zone 
  * @apiGroup Program
  * @apiParam {String} SolutionId Solution ID.
  * @apiParam {String} Page Page.
  * @apiParam {String} Limit Limit.
  * @apiSampleRequest /assessment/api/v1/programs/entityBlocks?solutionId=5b98fa069f664f7e1ae7498c
  * @apiParamExample {json} Response:
  * "result": {
      "zones": [
        {
         "id": "7",
         "label": "Zone - 7"
        },
        {
          "id": "8",
          "label": "Zone - 8"
        }
      ]
    }
  * @apiUse successBody
  * @apiUse errorBody
  */

    /**
   * Entity associated with block.
   * @method
   * @name entityBlocks
   * @param req - request data.
   * @param req.query.solutionId -solution id
   * @returns {JSON} - List of entity blocks.
   */

  async entityBlocks(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let solutionId = req.query.solutionId;

        let solutionDocument = await database.models.solutions.findOne({ _id: ObjectId(solutionId) }, {
          _id: 1, "entities": 1
        }).lean();

        if (!solutionDocument) {
          throw httpStatusCode.bad_request.message;
        }

        let distinctEntityBlocks = await database.models.entities.distinct('metaInformation.blockId', { _id: { $in: solutionDocument.entities } }).lean();

        let result = {};

        result["zones"] = distinctEntityBlocks.map((zoneId) => {
          return {
            id: zoneId,
            label: 'Zone - ' + zoneId
          };
        })

        return resolve({
          message: messageConstants.apiResponses.ZONE_LIST,
          result: result
        });

      }
      catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
        })
      }
    })
  }


  /**
  * @api {get} /assessment/api/v1/programs/blockEntity?solutionId=""&blockId="" Block Entity
  * @apiVersion 1.0.0
  * @apiName Block Entity 
  * @apiGroup Program
  * @apiParam {String} SolutionId Solution ID.
  * @apiParam {String} Page Page.
  * @apiParam {String} Limit Limit.
  * @apiSampleRequest /assessment/api/v1/programs/blockEntity?solutionId=5b98fa069f664f7e1ae7498c&blockId=1
  * @apiParamExample {json} Response:
  * "result": {
      "entities": [
        {
          "_id": "5bfe53ea1d0c350d61b78e4a",
          "name": "Govt. Girls Sr. Sec. School, Nicholson Road, Delhi",
          "externalId": "1207043",
          "addressLine1": "Nicholson Road",
          "addressLine2": "",
          "city": "Urban",
          "isSingleEntityHighLevel": true,
          "isSingleEntityDrillDown": true
        }
      ]
    }
  * @apiUse successBody
  * @apiUse errorBody
  */

     /**
   * List of entity in one particular block.
   * @method
   * @name blockEntity
   * @param req - request data.
   * @param req.query.solutionId -solution id
   * @param req.query.blockId -block id 
   * @returns {JSON} - List of entity blocks.
   */

  async blockEntity(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let solutionId = req.query.solutionId;
        let blockId = req.query.blockId;

        let solutionDocument = await database.models.solutions.findOne({ _id: ObjectId(solutionId) }, {
          _id: 1, "entities": 1, programExternalId: 1
        }).lean();

        if (!solutionDocument) {
          throw httpStatusCode.bad_request.message;
        }

        let entitiesInBlock = await database.models.entities.aggregate([
          {
            $match: {
              _id: { $in: solutionDocument.entities },
              "metaInformation.blockId": blockId
            },
          },
          {
            $project:
            {
              _id: 1,
              name: "$metaInformation.name",
              externalId: "$metaInformation.externalId",
              addressLine1: "$metaInformation.addressLine1",
              addressLine2: "$metaInformation.addressLine2",
              city: "$metaInformation.city"
            }
          }
        ])

        let entitiesIdArray = entitiesInBlock.map(eachEntitiesInBlock => eachEntitiesInBlock._id);

        let insightDocument = await insightsHelper.insightsDocument(solutionDocument.programExternalId, entitiesIdArray);

        let singleEntityDrillDown;

        if (insightDocument.length > 0) {
          let solutionDocument = await solutionsHelper.checkIfSolutionIsRubricDriven(insightDocument[0].solutionId);
          singleEntityDrillDown = solutionDocument ? true : false;
        }

        let result = {};

        entitiesInBlock.forEach(eachEntityInBlock => {
          if (insightDocument.length > 0 && insightDocument.some(eachInsight => eachInsight.entityId.toString() == eachEntityInBlock._id.toString())) {
            eachEntityInBlock["isSingleEntityHighLevel"] = true;
            eachEntityInBlock["isSingleEntityDrillDown"] = singleEntityDrillDown;
          } else {
            eachEntityInBlock["isSingleEntityHighLevel"] = false;
            eachEntityInBlock["isSingleEntityDrillDown"] = false;
          }
        })

        result["entities"] = entitiesInBlock;

        return resolve({
          message: "List of entities fetched successfully",
          result: result
        })

      }
      catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
        })
      }
    })
  }

    /**
  * @api {post} /assessment/api/v1/programs/listByIds List programs by ids
  * @apiVersion 1.0.0
  * @apiName List programs by ids
  * @apiGroup Program
  * @apiParamExample {json} Request:
  * {
  *   "programIds" : ["5b98d7b6d4f87f317ff615ee"]
  * }
  * @apiSampleRequest /assessment/api/v1/programs/listByIds
  * @apiParamExample {json} Response:
  * {
    "message": "Program information list fetched successfully.",
    "status": 200,
    "result": [
        {
            "_id": "5b98d7b6d4f87f317ff615ee",
            "externalId": "PROGID01",
            "name": "DCPCR School Development Index 2018-19",
            "description": "DCPCR School Development Index 2018-19",
            "owner": "a082787f-8f8f-42f2-a706-35457ca6f1fd",
            "createdBy": "a082787f-8f8f-42f2-a706-35457ca6f1fd",
            "updatedBy": "a082787f-8f8f-42f2-a706-35457ca6f1fd",
            "isDeleted": false,
            "status": "active",
            "resourceType": [
                "program"
            ],
            "language": [
                "English"
            ],
            "keywords": [],
            "concepts": [],
            "imageCompression": {
                "quality": 10
            },
            "updatedAt": "2019-01-03T06:07:17.660Z",
            "startDate": "2018-06-28T06:03:48.590Z",
            "endDate": "2020-06-28T06:03:48.591Z",
            "createdAt": "2019-06-28T06:03:48.616Z",
            "isAPrivateProgram": false
        }
    ]
  }
  * @apiUse successBody
  * @apiUse errorBody
  */

     /**
   * List programs by ids.
   * @method
   * @name listByIds
   * @param {Object} req - request data.
   * @param {Array} req.body.solutionIds - Solution ids.
   * @returns {JSON} - List programs by ids.
   */

  async listByIds(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let programsData = 
        await programsHelper.listByIds(req.body.programIds);

        programsData.result = programsData.data;

        return resolve(programsData);
        
      }
      catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
        })
      }
    })
  }

    /**
  * @api {post} /assessment/api/v1/programs/removeSolutions/:programId Remove solutions from Program
  * @apiVersion 1.0.0
  * @apiName removeSolution
  * @apiGroup Program
  * @apiSampleRequest /assessment/api/v1/programs/removeSolutions/5fbe2b964006cc174d10960c
  * @apiHeader {String} X-authenticated-user-token Authenticity token  
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * Remove solutions from program.
   * @method
   * @name removeSolutions
   * @param {Object} req - requested data.
   * @param {String} req.params._id -  program internal id.
   * @param {Array} req.body.solutionIds - solution ids.
   * @returns {JSON} - 
   */

  async removeSolutions(req) {
    return new Promise(async (resolve, reject) => {
      try {

        let programData = 
        await programsHelper.removeSolutions(req.params._id,req.body.solutionIds);
        
        programData.result = programData.data;
        return resolve(programData);

      }
      catch (error) {
        reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        })
      }
    })
  } 

};