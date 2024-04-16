/**
 * name : helper.js
 * author : Aman
 * created-date : 23-Jun-2020
 * Description : Library categories helper functionality.
 */

// Dependencies 
let coreService = require(ROOT_PATH + "/generics/services/core");
let sessionHelpers = require(ROOT_PATH+"/generics/helpers/sessions");

/**
    * libraryCategoriesHelper
    * @class
*/

module.exports = class libraryCategoriesHelper {

      /**
   * Library categories
   * @method
   * @name categoryDocuments
   * @param {Object} [findQuery = "all"] - filtered data.
   * @param {Array} [fields = "all"] - projected data.
   * @param {Array} [skipFields = "none"] - fields to skip.
   * @returns {Array} - Library categories data.
   */

  static categoryDocuments(
    findQuery = "all", 
    fields = "all",
    skipFields = "none"
  ) {
      return new Promise(async (resolve, reject) => {
        
        try {
          
          let queryObject = {};

          if (findQuery != "all") {
              queryObject = findQuery;
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

          let libraryCategoriesData = 
          await database.models.libraryCategories.find(
            queryObject, 
            projection
          ).lean();
          
          return resolve(libraryCategoriesData);

      } catch (error) {
          return reject({
              status: error.status || httpStatusCode.internal_server_error.status,
              message: error.message || httpStatusCode.internal_server_error.message,
              errorObject: error
          });
        }
      });
    }

    /**
      * List of library categories.
      * @method
      * @name list
      * @returns {Object} Library categories lists.
     */

    static list() {
        return new Promise(async (resolve, reject) => {
            try {

                let result = "";
                let libraryData = sessionHelpers.get("libraryCategories");

                if( libraryData && libraryData.length > 0 ) {
                    result = libraryData;
                } else {
                    await this.setLibraryCategories();
                }

                return resolve({
                  message : messageConstants.apiResponses.LIBRARY_CATEGORY_FETCHED,
                  result : result
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
      * Set library categories.
      * @method
      * @name setLibraryCategories
      * @returns {Object} Set library categories lists.
     */

    static setLibraryCategories() {
        return new Promise(async (resolve, reject) => {
            try {

                let libraryCategories = 
                await this.categoryDocuments(
                    {
                        status : messageConstants.common.ACTIVE_STATUS
                    },
                    [
                        "externalId",
                        "name",
                        "icon",
                        "updatedAt"
                    ]
                );
                
                if( !(libraryCategories.length > 0) ) {
                    throw {
                        status : httpStatusCode.bad_request.status,
                        message : messageConstants.apiResponses.LIBRARY_CATEGORIES_NOT_FOUND,
                        result : []
                    }
                }
    
                let categories = {};
                
                let libraryCategoriesIcon = libraryCategories.map(category => {
                    
                    categories[category.icon] = {
                        name : category.name,
                        type : category.externalId,
                        updatedAt : category.updatedAt
                    };
                    
                    return category.icon
                });

                let result = await coreService.getDownloadableUrl(
                    {
                        filePaths : libraryCategoriesIcon
                    }
                );
                
                if( result.status !== httpStatusCode.ok.status) {
                    throw {
                        status : httpStatusCode.bad_request.status,
                        message : messageConstants.apiResponses.URL_COULD_NOT_BE_FOUND
                    }
                }
                
                result = result.result.map(downloadableImage=>{
                    return _.merge(
                        categories[downloadableImage.filePath],
                        { url : downloadableImage.url }
                    )
                });

                result = result.sort((a,b)=> a.name.toString() > b.name.toString() ? 1 : -1);
                
                sessionHelpers.set("libraryCategories",result);

                return resolve({
                  message : messageConstants.apiResponses.LIBRARY_CATEGORY_FETCHED,
                  result : result
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

};


