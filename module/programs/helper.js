/**
 * name : programs/helper.js
 * author : Akash
 * created-date : 20-Jan-2019
 * Description : Programs helper functionality
 */

// Dependencies 
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");
const questionSetService = require(ROOT_PATH + "/generics/services/questionset");
 
/**
    * ProgramsHelper
    * @class
*/
module.exports = class ProgramsHelper {

    /**
   * Programs list.
   * @method
   * @name list
   * @param {Array} [filterQuery = "all"] - filter query data.
   * @param {Array} [fields = "all"] - projected data
   * @param {Array} [skipFields = "none"] - fields to skip
   * @returns {JSON} - Programs list.
   */

  static list(filterQuery = "all" , fields = "all", skipFields = "none") {
    return new Promise(async (resolve, reject) => {
      try {

        let filteredData = {};

        if( filterQuery !== "all" ) {
          filteredData = filterQuery;
        }

        let projection = {};

        if (fields != "all") {
          fields.forEach(element => {
            projection[element] = 1;
          });
        }

        if (skipFields != "none") {
          
          skipFields.forEach(element => {
            projection[element] = 0;
          });
        }
        
        const programs = 
        await database.models.programs.find(
          filteredData, 
          projection
        ).lean();

        return resolve(programs);

      } catch(error) {
        return reject(error);
      }
    })
  }

   /**
   * List of programs.
   * @method
   * @name programDocument
   * @param {Array} [programIds = "all"] - list of programIds.
   * @param {Array} [fields = "all"] -projected data
   * @param {Array} [pageIndex = "all"] - all page index.
   * @param {Array} [pageSize = "all"] - page limit.
   * @returns {JSON} - program document list.
   */

  static programDocument(programIds = "all", fields = "all", pageIndex = "all", pageSize = "all") {

    return new Promise(async (resolve, reject) => {

      try {

        let queryObject = {};

        if (programIds != "all") {
          queryObject = {
            _id: {
              $in: programIds
            }
          };
        }

        let projectionObject = {};

        if (fields != "all") {
          fields.forEach(element => {
            projectionObject[element] = 1;
          });
        }

        let pageIndexValue = 0;
        let limitingValue = 0;

        if (pageIndex != "all" && pageSize !== "all") {
          pageIndexValue = (pageIndex - 1) * pageSize;
          limitingValue = pageSize;
        }

        let programDocuments = await database.models.programs.find(queryObject, projectionObject).skip(pageIndexValue).limit(limitingValue).lean();

        return resolve(programDocuments);

      } catch (error) {

        return reject(error);

      }

    })
  }

   /**
   * Create program
   * @method
   * @name create
   * @param {Array} data 
   * @returns {JSON} - create program.
   */

  static create(data) {

    return new Promise(async (resolve, reject) => {

      try {

        let programData = {
          "externalId" : data.externalId,
          "name" : data.name,
          "description" : data.description ,
          "owner" : data.userId,
          "createdBy" : data.userId,
          "updatedBy" : data.userId,
          "isDeleted" : false,
          "status" : "active",
          "resourceType" : [ 
              "Program"
          ],
          "language" : [ 
              "English"
          ],
          "keywords" : [
            "keywords 1",
            "keywords 2"
          ],
          "concepts" : [],
          "imageCompression" : {
              "quality" : 10
          },
          "components" : [],
          "isAPrivateProgram" : data.isAPrivateProgram ? data.isAPrivateProgram : false  
        }

        let program = await database.models.programs.create(
          programData
        );

        return resolve(program);

      } catch (error) {

        return reject(error);

      }

    })
  }

  /**
   * List of user created programs
   * @method
   * @name userPrivatePrograms
   * @param {String} userId
   * @returns {JSON} - List of programs that user created on app.
   */

  static userPrivatePrograms(userId) {

    return new Promise(async (resolve, reject) => {

      try {

        let programsData = await this.list({
          createdBy : userId,
          isAPrivateProgram : true
        },["name","externalId","description","_id"]);

        if( !programsData.length > 0 ) {
          return resolve({
            message : messageConstants.apiResponses.PROGRAM_NOT_FOUND,
            result : []
          });
        }

        return resolve(programsData);

      } catch (error) {

        return reject(error);

      }

    })
  }

   /**
    * Update program document.
    * @method
    * @name updateProgramDocument
    * @param {Object} query - query to find document
    * @param {Object} updateObject - fields to update
    * @returns {String} - message.
    */

   static updateProgramDocument(query= {}, updateObject= {}) {
    return new Promise(async (resolve, reject) => {
        try {

            if (Object.keys(query).length == 0) {
                throw new Error(messageConstants.apiResponses.UPDATE_QUERY_REQUIRED)
            }

            if (Object.keys(updateObject).length == 0) {
                throw new Error (messageConstants.apiResponses.UPDATE_OBJECT_REQUIRED)
            }

            let updateResponse = await database.models.programs.updateOne
            (
                query,
                updateObject
            )
            
            if (updateResponse.nModified == 0) {
                throw new Error(messageConstants.apiResponses.FAILED_TO_UPDATE)
            }

            return resolve({
                success: true,
                message: messageConstants.apiResponses.UPDATED_DOCUMENT_SUCCESSFULLY,
                data: true
            });

        } catch (error) {
            return resolve({
                success: false,
                message: error.message,
                data: false
            });
        }
    });
}

      /**
    * List programs by ids.
    * @method
    * @name listByIds
    * @param {Array} programIds - Program ids. 
    * @returns {Array} List of Programs.
    */

   static listByIds(programIds) {
    return new Promise(async (resolve, reject) => {
        try {

            let programsData;

            if(Array.isArray(programIds) && programIds.length > 0){

              programsData = 
              await this.list({
                _id : { $in : programIds }
              },"all",[
                "components",
                "imageCompression",
                "updatedAt",
                "createdAt",
                "startDate",
                "endDate",
                "updatedBy"
              ]);

              if( !programsData.length > 0 ) {
                throw {
                  status : httpStatusCode["bad_request"].status,
                  message : messageConstants.apiResponses.PROGRAM_NOT_FOUND
                }
              }

            }

            return resolve({
                success: true,
                message: messageConstants.apiResponses.PROGRAM_LIST,
                data: programsData
            });

        } catch (error) {
            return resolve({
                status : error.status ? error.status : httpStatusCode["internal_server_error"].status,
                success: false,
                message: error.message,
                data: false
            });
        }
    });
}

       /**
    * Remove solutions from program.
    * @method
    * @name removeSolutions
    * @param {Array} programId - Program id. 
    * @param {Array} solutionIds - Program id. 
    * @returns {Array} Update program.
    */

   static removeSolutions(programId,solutionIds) {
    return new Promise(async (resolve, reject) => {
        try {

            let programsData = await this.list({_id : programId },["_id"]);

            if( !programsData.length > 0 ) {
              throw {
                status : httpStatusCode["bad_request"].status,
                message : messageConstants.apiResponses.PROGRAM_NOT_FOUND
              }
            }

            let updateSolutionIds = solutionIds.map(solutionId => ObjectId(solutionId));

            let updateSolution = 
            await database.models.programs.findOneAndUpdate({
              _id : programId
            },{
              $pull : {
                components : { $in : updateSolutionIds }
              }
            });

            return resolve({
                success: true,
                message: messageConstants.apiResponses.PROGRAM_UPDATED_SUCCESSFULLY,
                data: updateSolution
            });

        } catch (error) {
            return resolve({
                status : error.status ? error.status : httpStatusCode["internal_server_error"].status,
                success: false,
                message: error.message,
                data: false
            });
        }
    });
   }

    /**
   * Search programs.
   * @method
   * @name search
   * @param {Object} filteredData - Search programs from filtered data.
   * @param {Number} pageSize - page limit.
   * @param {Number} pageNo - No of the page. 
   * @param {Object} projection - Projected data. 
   * @returns {Array} List of program document. 
   */

  static search(filteredData, pageSize, pageNo,projection,search = "") {
    return new Promise(async (resolve, reject) => {
      try {

        let programDocument = [];

        let projection1 = {};

        if( projection ) {
          projection1["$project"] = projection
        } else {
          projection1["$project"] = {
            name: 1,
            description: 1,
            keywords: 1,
            externalId: 1,
            components: 1
          };
        }

        if ( search !== "" ) {
          filteredData["$match"]["$or"] = [];
          filteredData["$match"]["$or"].push(
            { 
              "name": new RegExp(search, 'i') 
            }, { 
            "description": new RegExp(search, 'i') 
          });
        }

        let facetQuery = {};
        facetQuery["$facet"] = {};

        facetQuery["$facet"]["totalCount"] = [
          { "$count": "count" }
        ];

        facetQuery["$facet"]["data"] = [
          { $skip: pageSize * (pageNo - 1) },
          { $limit: pageSize }
        ];

        let projection2 = {};
        projection2["$project"] = {
          "data": 1,
          "count": {
            $arrayElemAt: ["$totalCount.count", 0]
          }
        };
       
        programDocument.push(filteredData, projection1, facetQuery, projection2);
       
        let programDocuments = 
        await database.models.programs.aggregate(programDocument);

        return resolve(programDocuments);

      } catch (error) {
        return reject(error);
      }
    })
  }

     /**
   * 
   * @method
   * @name mapObservation
   * @param {String} programId - Program Id.
   * @param {Array} entities - entities.
   * @returns {JSON} - Removed entities data.
   */

      static mapObservation(programId, questionSetId, copyReq) {
        return new Promise(async (resolve, reject) => {
          try {
            let status;
            let programData = await database.models.programs.findOne({ _id: programId }).lean();
            if (!programData) {
              return resolve({
                message: messageConstants.apiResponses.PROGRAM_NOT_FOUND,
                status: httpStatusCode.bad_request.status,
              });
            }
            const copyQuestionSetRes = await questionSetService.copyQuestionSet(copyReq, questionSetId)
            const copiedQuestionsetId = copyQuestionSetRes.result.node_id[questionSetId]
            const readRes = await questionSetService.readQuestionSet(copiedQuestionsetId)
            let readQuestionSetRes = readRes.result.questionSet
            let updateRequest = {
              request: {
                data: {
                  nodesModified: {
                    [readQuestionSetRes.identifier]: {
                      metadata: {
                        visibility: "Private"
                      }
                    }
                  },
                  hierarchy: {
                    [readQuestionSetRes.identifier]: {
                      name: readQuestionSetRes.name,
                      children: readQuestionSetRes.childNodes,
                      root: true
                    }
                  }
                }
              }
            }
            const updateRes = await questionSetService.updateQuestionSetHierarchy(updateRequest)
            if(updateRes.status === httpStatusCode.ok.status) {
              let publishRes = await questionSetService.publishQuestionSet(copiedQuestionsetId);
              if(publishRes.status === httpStatusCode.ok.status) {
                let solution = {}
                solution["programId"] = programId;
                solution["entityType"] = readQuestionSetRes.entityType;
                solution["createdBy"] = readQuestionSetRes.createdBy;
                solution["name"] = readQuestionSetRes.name;
                solution["description"] = readQuestionSetRes.description;
                solution["migratedId"] = copiedQuestionsetId;
                solution["externalId"]  = programData.externalId;
                solution["type"] = readQuestionSetRes.primaryCategory;
                solution["subType"] = readQuestionSetRes.entityType;
                let solutionDocument
                try {
                  solutionDocument = await database.models.solutions.create(
                    solution
                  );
                }  catch (error) {
                  return resolve({
                    success: false,
                    status: error.status ?
                      error.status : httpStatusCode['internal_server_error'].status,
                    message: error.message
                  })
                }
                solutionDocument._id ? status = `${solutionDocument._id} created` : status = `${solutionDocument._id} could not be created`;
                if(status) {
                  await database.models.programs.updateOne({ _id: programId }, { $addToSet: { components: solutionDocument._id } });
                  return resolve({
                    status: httpStatusCode.ok.status,
                    result: {
                      [questionSetId]: copiedQuestionsetId,
                      [copiedQuestionsetId]: solutionDocument._id
                    },
                    message: "mapped solution to program successfully"
                  })
                }
              }
            }
          } catch (error) {
            return resolve({
              success: false,
              status: error.status ?
                error.status : httpStatusCode['internal_server_error'].status,
              message: error.message
            })
          }
        })
      } 


     /**
   * 
   * @method
   * @name mapObservation
   * @param {String} programId - Program Id.
   * @param {Array} entities - entities.
   * @returns {JSON} - Removed entities data.
   */

  static mapUpdateObservation(solutionId, updateReq) {
    return new Promise(async (resolve, reject) => {
      try {
        let solutionDocument = await database.models.solutions.findOne({
          _id: solutionId,
        }).lean()
        if (!solutionDocument) {
          return resolve({
            message: messageConstants.apiResponses.SOLUTION_NOT_FOUND,
            status: httpStatusCode.bad_request.status,
          });
        }
        const updateRes = await questionSetService.updateQuestionSet(updateReq, solutionDocument.migratedId)
        if(updateRes.status === 200) {
          const publishQuestionSetRes = await questionSetService.publishQuestionSet(solutionDocument.migratedId)
          if(publishQuestionSetRes.status === 200) {
            let updateQuery = {};
            updateQuery["$set"] = {};
            if (updateReq.name) {
              updateQuery["$set"]["name"] = updateReq.name;
            }
            if (updateReq.description) {
              updateQuery["$set"]["description"] = updateReq.description;
            }
            if (updateReq.startDate) {
              updateQuery["$set"]["startDate"] = updateReq.startDate;
            }
            if (updateReq.startDate) {
              updateQuery["$set"]["endDate"] = updateReq.endDate;
            }
            if (updateReq.status) {
              updateQuery["$set"]["status"] = updateReq.status;
            }
            let updatedSolutionDoc = await database.models.solutions.updateOne(
              {
                _id: solutionId,
              },
              updateQuery
            ).lean();
            return resolve({
              message: messageConstants.apiResponses.OBSERVATION_UPDATED,
            });

          }
        }
      } catch (error) {
        return resolve({
          success: false,
          status: error.status ?
            error.status : httpStatusCode['internal_server_error'].status,
          message: error.message
        })
      }
    })
  } 

};