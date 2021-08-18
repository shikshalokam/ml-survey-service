/**
 * name : helper.js
 * author : Aman
 * created-date : 10-Jun-2020
 * Description : Criteria questions related functionality
 */

 /**
    * CriteriaQuestionsHelper
    * @class
*/
module.exports = class CriteriaQuestionsHelper {

     /**
      * List of criteria questions
      * @method
      * @name list
      * @param {Object} [ findQuery = "all" ] - filtered query data.
      * @param {Array} [ fieldsArray = "all" ] - fields to include.
      * @param {Array} [ skipFields = "none" ] - skip fields.   
      * @returns {Array} List of criteria questions.
     */

    static list( findQuery = "all", fieldsArray = "all", skipFields = "none" ) {
        return new Promise(async (resolve, reject) => {
            try {
        
                let queryObject = {};

                if( findQuery !== "all" ) {
                    queryObject = findQuery;
                }
        
                let projection = {};
        
                if (fieldsArray != "all") {
                    fieldsArray.forEach(field => {
                        projection[field] = 1;
                    });
                }

                if (skipFields != "none") {
                    skipFields.forEach(element => {
                        projection[element] = 0;
                    });
                }
        
                let criteriaQuestionDocuments = 
                await database.models.criteriaQuestions.find(
                    queryObject, 
                    projection
                ).lean();
                
                return resolve(criteriaQuestionDocuments);
                
            } catch (error) {
                return reject(error);
            }
        });
    }
    
    /**
      * Details of criteria questions
      * @method
      * @name details
      * @param {Array} criteriaIds - criteria ids
      * @param {Object} projection - projected data
      * @param {Object} query - additional query if any    
      * @returns {Array} List of criteria questions.
     */

    static details(criteriaIds,projection,query) {
        return new Promise(async (resolve, reject) => {
            try {

                let queryData = {
                    $match : { 
                        _id : { $in : criteriaIds }
                    }
                }

                let queryData2 = {
                    $match : {}
                };

                if(query) {
                    queryData2["$match"] = query;
                }

                let unwindEvidences = {
                    $unwind : "$evidences"
                };

                let unwindSections = {
                    $unwind : "$evidences.sections"
                };

                let unwindQuestions = {
                    $unwind : "$evidences.sections.questions"
                };

                let questionInCriteria = 
                await database.models.criteriaQuestions.aggregate([
                    queryData,
                    unwindEvidences,
                    unwindSections,
                    unwindQuestions,
                    queryData2,
                    projection
                ])

                return resolve(questionInCriteria);

            } catch (error) {
                return reject(error);
            }
        })

    }

    /**
   * Create Or update criteria Questions.
   * @method
   * @name createOrUpdate
   * @param {String} criteriaIds - criteria ids.
   * @param {String} [ updateQuestion = false ] - update question or criteria.
   * @returns {JSON} - success true or false
   */

  static createOrUpdate( 
    criteriaIds,
    updateQuestion = false
  ) {
    return new Promise(async (resolve, reject) => {
        try {

            let result = "";

            if( Array.isArray(criteriaIds) ) {

                result = [];

                for (
                    let criteria = 0; 
                    criteria < criteriaIds.length ; 
                    criteria++ 
                ) {
                    
                    let data = await singleCriteriaCreateOrUpdate(
                        criteriaIds[criteria],
                        updateQuestion
                    );

                    result.push({
                        criteriaId : criteriaIds[criteria],
                        success : data.success
                    });
                }
            } else {
                
                result = 
                await singleCriteriaCreateOrUpdate(
                    criteriaIds,
                    updateQuestion
                );
            }

            return resolve(result);

        } catch (error) {
            return reject(error);
        }
    })
  }

  /**
   * Get criteria Questions.
   * @method
   * @name getCriteriaQuestions
   * @param {Array} criteriaIds - criteria ids.
   * @param {String} evidenceId - evidence externalId.
   * @returns {Array} Question list
   */

  static getCriteriaQuestions( 
    criteriaIds,
    evidenceId
  ) {
    return new Promise(async (resolve, reject) => {
        try {

            let questionsArray = [];
            let criteriaQuestionDocument = await this.list(
                {  _id: { $in: criteriaIds },
                  "evidences": {"$elemMatch": {code: evidenceId}}
                },
                [
                    "evidences.$"
                ],["_id"]);

            if(!criteriaQuestionDocument){
                throw new Error(messageConstants.apiResponses.CRITERIA_QUESTIONS_COULD_NOT_BE_FOUND);
            }

            criteriaQuestionDocument.forEach(eachCriteria => {
                eachCriteria.evidences.forEach(eachEvidence => {
                    if(eachEvidence.code == evidenceId){
                        eachEvidence.sections.forEach(eachSection => {
                            eachSection.questions.forEach(eachQuestion => {
                                questionsArray.push(eachQuestion);
                            })
                        })
                    }
                })
            })

            return resolve(questionsArray);

        } catch (error) {
            return reject(error);
        }
    })
  }

};

   /**
   * Create Or update criteria Questions.
   * @method
   * @name singleCriteriaCreateOrUpdate
   * @param {String} criteriaId - criteria id.
   * @param {String} updateQuestion - update question or criteria.
   * @returns {JSON} success true or false
   */

  function singleCriteriaCreateOrUpdate(criteriaId,updateQuestion) {
    return new Promise(async function (resolve, reject) {
        try {

            let criteriaModel = 
            Object.keys(criteriaSchema.schema);

            let findQuery = {
                "$match" : {
                    "_id" : ObjectId(criteriaId),
                    "frameworkCriteriaId" : { $exists : true }
                }
            };

            let unwindEvidences = {
                "$unwind": "$evidences"
            };

            let unwindSections = {
                "$unwind": "$evidences.sections"
            };

            let lookupQuestions = {
                "$lookup": {
                    "from": "questions",
                    "localField": "evidences.sections.questions",
                    "foreignField": "_id",
                    "as": "evidences.sections.questions"
                }
            };

            let addCriteriaIdInQuestion = {
                "$addFields": {
                    "evidences.sections.questions.criteriaId": "$_id"
                }
            };

            let groupData1 =  {
                "$group": {
                    "_id": {
                        "_id": "$_id",
                        "evidences_code": "$evidences.code"
                    }
                }
            };

            criteriaModel.forEach(criteria=>{
                if( ["evidences"].indexOf(criteria) == -1 ) {
                    groupData1["$group"][criteria] = {
                        "$first" : `$${criteria}`
                    }
                }
            });

            let groupData2 = _.cloneDeep(groupData1);
            groupData2["$group"]["_id"] = "$_id._id";

            if( updateQuestion ) {

                groupData1["$group"]["evidenceCode"] = {
                    "$first": "$evidences.code"
                };

                groupData1["$group"]["sections"] =  {
                    "$push": "$evidences.sections"
                };
                
                groupData2["$group"]["evidences"] = {
                    "$push": {
                        "code" : "$evidenceCode",
                        "sections" : "$sections"
                    }
                };
            }

            let criteriaData = 
            await database.models.criteria.aggregate([
                findQuery,
                unwindEvidences,
                unwindSections,
                lookupQuestions,
                addCriteriaIdInQuestion,
                groupData1,
                groupData2
            ]);

            if ( !criteriaData[0] ) {
                return resolve({
                    success : false
                })
            }

            await database.models.criteriaQuestions.findOneAndUpdate(
                {
                    _id : criteriaId
                },{
                    $set : criteriaData[0]
                },{
                    upsert: true
                }
            );

            return resolve({
                success : true
            });
        
        } catch(error) {
            return reject(error);
        }
    })
  }
