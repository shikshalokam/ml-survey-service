const csv = require("csvtojson");
const entitiesHelper = require(ROOT_PATH + "/module/entities/helper")
const FileStream = require(ROOT_PATH + "/generics/fileStream");

module.exports = class Entities extends Abstract {
  constructor() {
    super(entitiesSchema);
  }

  static get name() {
    return "entities";
  }

  /**
  * @api {post} /assessment/api/v1/entities/add?type=:entityType&programId=:programInternalId&solutionId=:solutionInternalId&parentEntityId=:parentEntityInternalId Entity add
  * @apiVersion 0.0.1
  * @apiName Entity add
  * @apiGroup Entities
  * @apiParamExample {json} Request-Body:
  * {
  *	"data": [
  *       {
  *	        "studentName" : "",
  *	        "grade" : "",
  *	        "name" : "",
  *	        "gender" : "",
  *   		  "type": "",
  *  		    "typeLabel":"",
  * 		    "phone1": "Phone",
  * 		    "phone2": "",
  * 		    "address": "",
  *	        "schoolId" : "",
  *   		  "schoolName": "",
  *  		    "programId": ""
  *      },
  *	]
  *}
  * @apiUse successBody
  * @apiUse errorBody
  */
  add(req) {
    return new Promise(async (resolve, reject) => {

      try {
        let queryParams = {
          type : req.query.type,
          programId: req.query.programId,
          solutionId: req.query.solutionId,
          parentEntityId: req.query.parentEntityId
        }
        let result = await entitiesHelper.add(queryParams, req.body.data, req.userDetails);

        return resolve({
          message: "Entity information added successfully.",
          result: result
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }

  /**
  * @api {get} /assessment/api/v1/entities/list/:entityId?type=:entityType Entity list
  * @apiVersion 0.0.1
  * @apiName Entity list
  * @apiGroup Entities
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/entities/list/5bfe53ea1d0c350d61b78d0a?type=parent
  * @apiUse successBody
  * @apiUse errorBody
  */
 
  list(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entitiesHelper.list(req.query.type, req.params._id);

        return resolve({
          message: "Information fetched successfully.",
          result: result
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }


  /**
  * @api {get} /assessment/api/v1/entities/form?type=:entityType Entity form
  * @apiVersion 0.0.1
  * @apiName Entity form
  * @apiGroup Entities
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/entities/form?type=parent
  * @apiUse successBody
  * @apiUse errorBody
  */
  form(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entitiesHelper.form(req.query.type);

        return resolve({
          message: "Information fetched successfully.",
          result: result
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }

    })
  }

  /**
  * @api {get} /assessment/api/v1/entities/fetch/:entityId?type=:entityType Entity profile
  * @apiVersion 0.0.1
  * @apiName Entity profile
  * @apiGroup Entities
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/entities/fetch/5bfe53ea1d0c350d61b78d0a?type=parent
  * @apiUse successBody
  * @apiUse errorBody
  */
  fetch(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entitiesHelper.fetch(req.query.type, req.params._id);

        return resolve({
          message: "Information fetched successfully.",
          result: result
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }

  /**
  * @api {post} /assessment/api/v1/entities/update/:entityId?type=:entityType Update Entity Information
  * @apiVersion 0.0.1
  * @apiName Update Entity Information
  * @apiGroup Entities
  * @apiParamExample {json} Request-Body:
  * 	{
  *	        "studentName" : "",
  *	        "grade" : "",
  *	        "name" : "",
  *	        "gender" : "",
  *   		  "type": "",
  *  		    "typeLabel":"",
  *  		    "phone1": "",
  *  	    	"phone2": "",
  *     		"address": "",
  *    		  "programId": "",
  *    		  "callResponse":"",
  *         "createdByProgramId" : "5b98d7b6d4f87f317ff615ee",
  *         "parentEntityId" : "5bfe53ea1d0c350d61b78d0a"
  *   }
  * @apiUse successBody
  * @apiUse errorBody
  */
  update(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let result = await entitiesHelper.update(req.query.type, req.params._id, req.body);

        return resolve({
          message: "Information updated successfully.",
          result: result
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }

  /**
  * @api {post} /assessment/api/v1/entities/bulkCreate?type=:entityType Upload Entity Information CSV
  * @apiVersion 0.0.1
  * @apiName Upload Entity Information CSV
  * @apiGroup Entities
  * @apiParam {String} type Entity Type.
  * @apiParam {File} entities     Mandatory entities file of type CSV.
  * @apiUse successBody
  * @apiUse errorBody
  */
  bulkCreate(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let entityCSVData = await csv().fromString(req.files.entities.data.toString());
        let newEntityData = await entitiesHelper.bulkCreate(req.query.type, null, null, req.userDetails, entityCSVData);

        if(newEntityData.length > 0) {

          const fileName = `Entity-Upload`;
          let fileStream = new FileStream(fileName);
          let input = fileStream.initStream();
  
          (async function () {
            await fileStream.getProcessorPromise();
            return resolve({
              isResponseAStream: true,
              fileNameWithPath: fileStream.fileNameWithPath()
            });
          }());

          await Promise.all(newEntityData.map(async newEntity => {
            input.push(newEntity)
          }))

          input.push(null)

        } else {
          throw "Something went wrong!"
        }

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }


  /**
  * @api {post} /assessment/api/v1/entities/mappingUpload?programId=:programExternalId&?solutionId=:solutionExternalId Upload Entity Mapping Information CSV
  * @apiVersion 0.0.1
  * @apiName Upload Entity Information CSV
  * @apiGroup Entities
  * @apiParam {String} programId Program External ID.
  * @apiParam {String} solutionId Solution External ID.
  * @apiParam {File} entityMap     Mandatory entity mapping file of type CSV.
  * @apiUse successBody
  * @apiUse errorBody
  */
  mappingUpload(req) {
      return new Promise(async (resolve, reject) => {

          try {

            let entityCSVData = await csv().fromString(req.files.entityMap.data.toString());

            let solutionEntities = await database.models.solutions.findOne({
              programExternalId: req.query.programId,
              externalId: req.query.solutionId
            }, {
              entities : 1
            }).lean();

            if(!solutionEntities.entities.length > 0) 
              throw "Invalid Solution ID."
              
            const solutionEntitiyMap = solutionEntities.entities.reduce(
              (ac, entityId) => ({
                ...ac,
                [entityId.toString()]: true
              }),
              {}
            );

            const entityMapUploadedData = await Promise.all(
              entityCSVData.map(async (singleRow) => {
                  
                if(solutionEntitiyMap[singleRow.parentEntiyId] && singleRow.parentEntiyId != "" && singleRow.childEntityId != "") {
                  await entitiesHelper.addSubEntityToParent(singleRow.parentEntiyId, singleRow.childEntityId);
                }
                return true

              })
            )

            return resolve({
              message: "Information updated successfully."
            });

          } catch (error) {

            return reject({
              status: error.status || 500,
              message: error.message || "Oops! something went wrong.",
              errorObject: error
            })

          }

      })
  }

  /**
  * @api {post} /assessment/api/v1/entities/uploadForPortal?type=:entityType&programId=:programExternalId&solutionId=:solutionExternalId Upload Entity Information CSV Using Portal
  * @apiVersion 0.0.1
  * @apiName Upload Entity Information CSV Using Portal
  * @apiGroup Entities
  * @apiParam {File} entities     Mandatory entities file of type CSV.
  * @apiUse successBody
  * @apiUse errorBody
  */
  uploadForPortal(req) {
    return new Promise(async (resolve, reject) => {

      try {

        let entityCsvData = await csv().fromString(req.files.entities.data.toString());

        await entitiesHelper.bulkCreate(req.query.type, req.query.programId, req.query.solutionId, req.userDetails, entityCsvData);

        return resolve({
          message: "Information updated successfully."
        });

      } catch (error) {

        return reject({
          status: error.status || 500,
          message: error.message || "Oops! something went wrong.",
          errorObject: error
        })

      }


    })
  }

};