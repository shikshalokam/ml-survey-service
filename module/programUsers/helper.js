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
     * @name find
     * @param {Object} query
     * @param {Array} projection 
     * @returns {JSON} - create programUsers.
    */

    static find(query, projection = []) {
        return new Promise(async (resolve, reject) => {
            try {
            
                let programUsers = await database.models.programUsers.find(
                    query,
                    projection
                  ).lean();
                
                return resolve(programUsers);

            } catch (error) {
                return reject(error);
            }
        })
    }

}