/**
 * name : helper.js
 * author : Vishnu
 * created-date : 12-Jan-2023
 * Description : Programs users related helper functionality.
 */

// Dependencies 

/**
    * ProgramUsersHelper
    * @class
*/
module.exports = class ProgramUsersHelper {
    
    /**
     * find program users details
     * @method
     * @name programUsersDocuments
     * @param {Object} query
     * @param {Array} projection 
     * @returns {JSON} - create programUsers.
    */

    static programUsersDocuments(
        filterData = "all", 
        fieldsArray = "all",
        skipFields = "none"
    ) {
        return new Promise(async (resolve, reject) => {
            try {
                
                let queryObject = (filterData != "all") ? filterData : {};
                let projection = {}
           
                if (fieldsArray != "all") {
                    fieldsArray.forEach(field => {
                        projection[field] = 1;
                   });
               }
               
               if( skipFields !== "none" ) {
                   skipFields.forEach(field=>{
                       projection[field] = 0;
                   });
               }
               
               let programUsers = 
               await database.models.programUsers.find(
                   queryObject, 
                   projection
               ).lean();
           
               return resolve(programUsers);
            
            } catch (error) {
                return reject(error);
            }
        });
    }

    /**
     * Update program users
     * @method
     * @name update
     * @param {Object} query 
     * @param {Object} update 
     * @param {Object} options 
     * @returns {JSON} - create programUsers.
    */

    static update(query, update, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
            
                let programUsers = await database.models.programUsers.findOneAndUpdate(
                    query, 
                    update,
                    options
                );
                if( !programUsers._id ) {
                    throw {
                        message : constants.apiResponses.PROGRAM_USERS_NOT_UPDATED
                    };
                }
                return resolve(programUsers);

            } catch (error) {
                return reject(error);
            }
        })
    }

}