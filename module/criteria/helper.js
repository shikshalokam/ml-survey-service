let improvementProjectService = require(ROOT_PATH+"/generics/services/improvement-project");
let criteriaQuestionsHelper = require(MODULES_BASE_PATH + "/criteriaQuestions/helper");
const questionsHelper = require(MODULES_BASE_PATH + "/questions/helper");

module.exports = class criteriaHelper {

    static setCriteriaRubricExpressions(criteriaId, existingCriteria, criteriaRubricData, solutionLevelKeys) {
        return new Promise(async (resolve, reject) => {
            try {
                
                let expressionVariables = {};
                let expressionVariablesArray = criteriaRubricData.expressionVariables.split("###");
                
                expressionVariablesArray.forEach(expressionVariable => {
                    let tempExpressionVariableArray = expressionVariable.split("=");
                    let expressionVariableArray = new Array;
                    expressionVariableArray.push(tempExpressionVariableArray.shift());
                    expressionVariableArray.push(tempExpressionVariableArray.join('='));
                    let defaultVariableArray = expressionVariableArray[0].split("-");
                    if (defaultVariableArray.length > 1) {
                        if (!expressionVariables.default) {
                            expressionVariables.default = {};
                        }
                        expressionVariables.default[defaultVariableArray[0]] = expressionVariableArray[1];
                    } else {
                        expressionVariables[expressionVariableArray[0]] = expressionVariableArray[1];
                    }
                })

                let rubric = {
                    name: existingCriteria.name,
                    description: existingCriteria.description,
                    type: existingCriteria.criteriaType,
                    expressionVariables: expressionVariables,
                    levels: {}
                };

                let existingCriteriaRubricLevels;

                if (Array.isArray(existingCriteria.rubric.levels)) {
                    existingCriteriaRubricLevels = existingCriteria.rubric.levels;
                } else {
                    existingCriteriaRubricLevels = Object.values(existingCriteria.rubric.levels);
                }
                
                // To update the levels, which does not exists in the db
                Object.keys(_.omit(criteriaRubricData, ['externalId', 'name', 'expressionVariables'])).map(level => {
                  let levelExists = existingCriteriaRubricLevels.filter(function (o) { return o.level === level }).length > 0;

                  if (!levelExists) {
                    existingCriteriaRubricLevels.push ({
                      level: level,
                      label: 'Level ' + level.charAt(1),
                      description: 'NA',
                    });
                  }
                })

                existingCriteriaRubricLevels.forEach(levelObject => {

                  if (solutionLevelKeys.includes(levelObject.level)) {

                  rubric.levels[levelObject.level] = {};

                  Object.keys(levelObject).forEach(level=>{
                    rubric.levels[levelObject.level][level] = levelObject[level];
                  })

                  rubric.levels[levelObject.level].expression = criteriaRubricData[levelObject.level];

                  }
                })

                 await database.models.criteria.findOneAndUpdate(
                    {_id : criteriaId},
                    {
                        rubric: rubric,
                        criteriaType : messageConstants.common.AUTO_RATING
                    }
                );

                await criteriaQuestionsHelper.createOrUpdate(
                  criteriaId
                );

                return resolve({
                    success: true,
                    message : messageConstants.apiResponses.CRITERIA_RUBRIC_UPDATE
                });

            } catch (error) {
                return reject(error);
            }
        })

    }

    /**
   * Criteria documents.
   * @method
   * @name criteriaDocument
   * @param {String} [criteriaFilter = "all"] -filter query.
   * @param {Array} [fieldsArray = "all"] -projected fields. 
   * @returns {Array} criteria data.  
   */
    static criteriaDocument(criteriaFilter = "all", fieldsArray = "all") {
        return new Promise(async (resolve, reject) => {
            try {
        
                let queryObject = (criteriaFilter != "all") ? criteriaFilter : {};
        
        
                let projectionObject = {};
        
                if (fieldsArray != "all") {
                    fieldsArray.forEach(field => {
                        if(typeof field === "string") {
                            projectionObject[field] = 1;
                        } else {
                            if(Object.keys(field).length >0) {
                                for (let [key, value] of Object.entries(field)) {
                                    projectionObject[key] = value;
                              }
                            }
                        }
                    });
                }
        
                let criteriaDocuments = await database.models.criteria.find(queryObject, projectionObject).lean();
                
                return resolve(criteriaDocuments);
                
            } catch (error) {
                return reject(error);
            }
        });
    }

     /**
    * Create criteria
    * @method
    * @name create
    * @param {Object} criteriaData - criteria data to insert 
    * @returns {Array} - returns created criteria.
    */

    static create(criteriaData) {
        return new Promise(async (resolve, reject) => {
          try {
            let criteriaDocuments;
            if( Array.isArray(criteriaData) && criteriaData.length > 0 ) {
              criteriaDocuments = await database.models.criteria.insertMany(
                criteriaData
              );

            } else {
              criteriaDocuments = await database.models.criteria.create(
                criteriaData
              );
            }

            return resolve(criteriaDocuments);
            
          } catch (error) {
            return reject(error)
          }
        })
    }

     /**
    * Upload criteria
    * @method
    * @name upload
    * @param {Object} criteriaData - criteria data to insert
    * @param {String} userId - logged in user id
    * @param {String} token - logged in user token    
    * @returns {Array} - returns created criteria.
    */

   static upload(criteriaData,userId,token) {
    return new Promise(async (resolve, reject) => {
      try {

        let improvementProjectIds = [];
        let improvementObj = {};

        for( let criteria = 0; criteria < criteriaData.length ; criteria ++ ) {

          let parsedCriteria = gen.utils.valueParser(criteriaData[criteria]);

          let parsedCriteriaKeys = Object.keys(parsedCriteria);

          for( let key = 0; key < parsedCriteriaKeys.length ; key ++ ) {
            
            let improvement = 
            parsedCriteriaKeys[key].endsWith("-improvement-projects");

            if( improvement ) {

              if( !improvementObj[improvement] ) {
                improvementObj[parsedCriteria[parsedCriteriaKeys[key]]] = [];
              }

              let improvements = 
              parsedCriteria[parsedCriteriaKeys[key]].split(",");

              improvementProjectIds = _.concat(improvementProjectIds,improvements);

            }
          }

        }

        if ( improvementProjectIds.length > 0 ) {
          
          let improvementProjects = await improvementProjectService.templateLists(
            improvementProjectIds,
            token
          );

          if( improvementProjects.result && improvementProjects.result.length > 0 ) {

            let improvements = {};

            improvementProjects.result.forEach( improvement => {
              if( !improvements[improvement.externalId] ) {
                improvements[improvement.externalId] = {
                  _id : ObjectId(improvement._id),
                  title : improvement.title,
                  goal : improvement.goal,
                  externalId : improvement.externalId
                }
              }
            })
  
            Object.keys(improvementObj).forEach(improvement=>{
            
              let improvementsArr = improvement.split(",");
    
              let result = [];
    
              if( improvementsArr.length > 0 ) {
                
                improvementsArr.forEach(eachImprovement=>{
                  result = _.concat(
                    result,
                    improvements[eachImprovement] ? improvements[eachImprovement] : []
                  );
  
                })
  
              } else {
                result = 
                improvements[improvementsArr[0]] ? improvements[improvementsArr[0]] : [];
              }
  
              improvementObj[improvement] = result;
    
            })
  
          }
          
        }

        let result = [];

        await Promise.all(criteriaData.map(async criteria => {

          let csvData = {};
          let rubric = {};
          let parsedCriteria = gen.utils.valueParser(criteria);

          rubric.name = parsedCriteria.criteriaName;
          rubric.description = parsedCriteria.criteriaName;
          rubric.type = parsedCriteria.type;
          rubric.expressionVariables = {};
          rubric.levels = {};
          let countLabel = 1;

          Object.keys(parsedCriteria).forEach(eachCriteriaKey => {

            let regExpForLevels = /^L+[0-9]/;
            if ( 
              regExpForLevels.test(eachCriteriaKey) && 
              !eachCriteriaKey.includes("-improvement-projects")
            ) {

              let label = "Level " + countLabel++;

              let improvementProject = eachCriteriaKey+"-improvement-projects";

              rubric.levels[eachCriteriaKey] = {
                level: eachCriteriaKey,
                label: label,
                description: parsedCriteria[eachCriteriaKey],
                expression: ""
              };

              if( parsedCriteria[improvementProject] && 
                improvementObj[parsedCriteria[improvementProject]] &&  
                Object.values(improvementObj[parsedCriteria[improvementProject]]).length > 0
              ) {
                
                rubric.levels[eachCriteriaKey]["improvement-projects"] = 
                improvementObj[parsedCriteria[improvementProject]];

              }
            }
          })

          let criteriaStructure = {
            name: parsedCriteria.criteriaName,
            description: parsedCriteria.criteriaName,
            externalId: criteria.criteriaID,
            rubric: rubric
          };

          let criteriaDocuments;

          if( parsedCriteria._SYSTEM_ID ) {
            criteriaDocuments = await database.models.criteria.findOneAndUpdate(
              {
                _id : parsedCriteria._SYSTEM_ID
              },{
                $set : criteriaStructure
              }
            )

            await criteriaQuestionsHelper.createOrUpdate(
              parsedCriteria._SYSTEM_ID
            );

          } else {
            
            criteriaStructure["resourceType"] = [
              "Program",
              "Framework",
              "Criteria"
            ];

            criteriaStructure["language"] = [
              "English"
            ];

            criteriaStructure["keywords"] = [
              "Keyword 1",
              "Keyword 2"
            ];

            criteriaStructure["concepts"] = [
              {
                identifier: "LPD20100",
                name: "Teacher_Performance",
                objectType: "Concept",
                relation: "associatedTo",
                description: null,
                index: null,
                status: null,
                depth: null,
                mimeType: null,
                visibility: null,
                compatibilityLevel: null
              },
              {
                identifier: "LPD20400",
                name: "Instructional_Programme",
                objectType: "Concept",
                relation: "associatedTo",
                description: null,
                index: null,
                status: null,
                depth: null,
                mimeType: null,
                visibility: null,
                compatibilityLevel: null
              },
              {
                identifier: "LPD20200",
                name: "Teacher_Empowerment",
                objectType: "Concept",
                relation: "associatedTo",
                description: null,
                index: null,
                status: null,
                depth: null,
                mimeType: null,
                visibility: null,
                compatibilityLevel: null
              }
            ];

            criteriaStructure["evidences"] = [];
            criteriaStructure["deleted"] = false;
            criteriaStructure["owner"] = userId;
            criteriaStructure["timesUsed"] = 12;
            criteriaStructure["weightage"] = 20;
            criteriaStructure["remarks"] = "";
            criteriaStructure["criteriaType"] = parsedCriteria.criteriaType ? parsedCriteria.criteriaType : messageConstants.common.MANUAL_RATING;
            criteriaStructure["score"] =  "";
            criteriaStructure["flag"] =  "";

            criteriaDocuments = await database.models.criteria.create(
              criteriaStructure
            );

          }

          csvData["Criteria Name"] = parsedCriteria.criteriaName;
          csvData["Criteria External Id"] = parsedCriteria.criteriaID;

          if (criteriaDocuments._id) {
            csvData["Criteria Internal Id"] = criteriaDocuments._id;
          } else {
            csvData["Criteria Internal Id"] = "Not inserted";
          }

          result.push(csvData);
        }))

        return resolve(result);
        
      } catch (error) {
        return reject(error)
      }
    })
   }

    /**
    * Update criteria
    * @method
    * @name update
    * @param {String} criteriaExternalId - criteria external id.
    * @param {String} frameworkIdExists - Either it is a framework id or not.
    * @param {Object} bodyData - Criteria data to be updated.
    * @param {String} userId - Logged in user id.
    * @returns {Array} - returns updated criteria.
    */

   static update(
     criteriaExternalId,
     frameworkIdExists,
     bodyData,
     userId
    ) {
    return new Promise(async (resolve, reject) => {
      try {

        let queryObject = {
          externalId : criteriaExternalId
        }

        if( frameworkIdExists ) {
          queryObject["frameworkCriteriaId"] = {
            $exists : true
          }
        };

        let updateObject = {
          "$set" : {}
        };

        Object.keys(bodyData).forEach(criteriaData=>{
          updateObject["$set"][criteriaData] = bodyData[criteriaData];
        })

        updateObject["$set"]["updatedBy"] = userId;

        let updatedCriteria = 
        await database.models.criteria.findOneAndUpdate(queryObject, updateObject);

        if( frameworkIdExists ) {
          await criteriaQuestionsHelper.createOrUpdate(
            updatedCriteria._id
          );
        }
        
        return resolve({
          status: httpStatusCode.ok.status,
          message: messageConstants.apiResponses.CRITERIA_UPDATED
        });
        
      } catch (error) {
        return reject(error)
      }
    })
}


  /**
   * Create duplicate criterias
   * @method
   * @name duplicate
   * @param {Array} themes - themes       
   * @returns {Object}  old and new Mapped criteria id Object .  
  */

  static duplicate(themes= []) {
    return new Promise(async (resolve, reject) => {
      try {

        if (!themes.length) {
          throw new Error(messageConstants.apiResponses.THEMES_REQUIRED)
        }

        let criteriaIds = await gen.utils.getCriteriaIds(themes);

        if (!criteriaIds.length) {
          throw new Error(messageConstants.apiResponses.CRITERIA_ID_NOT_FOUND)
        }

        let criteriaDocuments = await this.criteriaDocument
        (
          { _id: { $in : criteriaIds }}
        )

        if (!criteriaDocuments.length) {
           throw new Error(messageConstants.apiResponses.CRITERIA_NOT_FOUND)
        }

        let criteriaIdMap = {};
        let questionIdMap = {};
        let questionExternalIdMap = {};

        let duplicateQuestionsResponse = await questionsHelper.duplicate
        (
          criteriaIds
        )
        
        if (duplicateQuestionsResponse.success && Object.keys(duplicateQuestionsResponse.data.questionIdMap).length > 0) {
          questionIdMap = duplicateQuestionsResponse.data.questionIdMap;
        }

        if (duplicateQuestionsResponse.success && Object.keys(duplicateQuestionsResponse.data.questionExternalIdMap).length > 0) {
          questionExternalIdMap = duplicateQuestionsResponse.data.questionExternalIdMap;
        }
        
        await Promise.all(criteriaDocuments.map(async criteria => {

          for(let pointerToEvidence = 0; pointerToEvidence < criteria.evidences.length; pointerToEvidence++) {
            for(let pointerToSection = 0; pointerToSection < criteria.evidences[pointerToEvidence].sections.length; pointerToSection++) {
              let newQuestions = [];
              let sectionQuestions = criteria.evidences[pointerToEvidence].sections[pointerToSection].questions;
              if (sectionQuestions.length > 0) {
                for(let pointerToQuestion = 0; pointerToQuestion < sectionQuestions.length; pointerToQuestion++) {
                   let newQuestionId = questionIdMap[sectionQuestions[pointerToQuestion].toString()] ? questionIdMap[sectionQuestions[pointerToQuestion].toString()] : sectionQuestions[pointerToQuestion];
                   newQuestions.push(newQuestionId);
                  }
                  criteria.evidences[pointerToEvidence].sections[pointerToSection].questions = newQuestions;
              }
            }
          }

          criteria.externalId = criteria.externalId + "-" + gen.utils.epochTime();
          criteria.parentCriteriaId = criteria._id;
          let newCriteriaId = await database.models.criteria.create(_.omit(criteria, ["_id"]));

          if (newCriteriaId._id) {
            criteriaIdMap[criteria._id.toString()] = newCriteriaId._id;
            if(criteria.rubric && criteria.rubric.expressionVariables && Object.keys(criteria.rubric.expressionVariables).length > 0) {

              Object.keys(criteria.rubric.expressionVariables).forEach(expressionVariable => {

                let oldId = criteria.rubric.expressionVariables[expressionVariable].split(".").shift();
                let newId = "";
                if(questionIdMap[oldId]) {
                  newId = questionIdMap[oldId];
                } else if(criteriaIdMap[oldId]) {
                  newId = criteriaIdMap[oldId];
                }
                if(newId != "") {
                  criteria.rubric.expressionVariables[expressionVariable] = newId + "." + criteria.rubric.expressionVariables[expressionVariable].split(".").slice(1).join(".");
                }
              })

              await database.models.criteria.updateOne
              (
                { _id: newCriteriaId._id },
                {
                    $set: {
                        rubric: criteria.rubric
                    }
                }
              )
            }
          }

        }))

        if (Object.keys(criteriaIdMap).length > 0) {
          await criteriaQuestionsHelper.createOrUpdate(
            Object.values(criteriaIdMap),
            true
          );
        }

        return resolve({
          success: true,
          message: messageConstants.apiResponses.DUPLICATED_CRITERIA_SUCCESSFULLY,
          data: {
              criteriaIdMap: criteriaIdMap,
              questionExternalIdMap: questionExternalIdMap
            }
        });

      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false
        })
      }
    })
  }

};
