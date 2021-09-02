/**
 * name : frameworks/helper.js
 * author : Aman
 * created-date : 22-Dec-2018
 * Description : All frameworks related helper functionality.
 */

 /**
    * FrameworksHelper
    * @class
*/

module.exports = class FrameworksHelper {
    /**
   * Mandatory field required when creating framework.
   * @method
   * @name mandatoryField
   * @returns {Object} - mandatory field.
   */

    static mandatoryField() {
        let mandatoryFields = {
            author: "",
            resourceType: ["Assessment Framework"],
            language: ["English"],
            keywords: ["Framework", "Assessment"],
            concepts: [],
            isRubricDriven: true,
            isDeleted: false,
            parentId: null,
        }

        return mandatoryFields

    }

     /**
    * Create framework
    * @method
    * @name create
    * @param {Object} frameworkData - framework data to insert 
    * @returns {Array} - returns created framework.
    */

    static create(frameworkData) {
        return new Promise(async (resolve, reject) => {
          try {
              let frameworkDocument = await database.models.frameworks.create(frameworkData);
              return resolve(frameworkDocument);
          } catch (error) {
            return reject(error)
          }
        })
    }

     /**
     * Delete framework.
     * @method
     * @name delete
     * @param {String} frameworkExternalId - frameworkExternalId 
     * @returns {String} - message.
     */

    static delete(frameworkExternalId= "") {
        return new Promise(async (resolve, reject) => {
            try {

                if(frameworkExternalId == ""){
                    throw new Error(messageConstants.apiResponses.FRAMEWORK_EXTERNAL_ID_REQUIRED_CHECK)
                }

                let frameworkDocument = await database.models.frameworks.remove({'externalId': frameworkExternalId });

                if(!frameworkDocument || !frameworkDocument.deletedCount){
                  throw new Error(messageConstants.apiResponses.FRAMEWORK_COULD_NOT_BE_DELETED)
                }

                return resolve({
                    success: true,
                    message: messageConstants.apiResponses.FRAMEWORK_DELETED,
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

}