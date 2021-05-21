/**
 * name : filesController.js
 * author : Akash
 * created-date : 22-Nov-2018
 * Description : All files related information.
 */

// Dependencies
const filesHelper = require(MODULES_BASE_PATH + "/files/helper")

/**
    * FileUpload
    * @class
*/
module.exports = class FileUpload {

  /**
  * @api {post} /assessment/api/v1/files/getImageUploadUrl Get File Upload URL
  * @apiVersion 1.0.0
  * @apiName Get File Upload URL
  * @apiGroup Files
  * @apiParamExample {json} Request-Body:
  * 
  *   "files" : [
  *     "23-Oct-2018-8AM-image121.jpg",
  *     "23-Oct-2018-8AM-image222.jpg",
  *     "23-Oct-2018-8AM-image323.jpg"
  *   ],
  *   "submissionId": "5bee56b30cd752559fd13012"
  * @apiUse successBody
  * @apiUse errorBody
  */

   /**
   * Get the url of the image upload.
   * @method
   * @name getImageUploadUrl
   * @param {Object} req -request Data.
   * @param {Array} req.body.files - image upload files.
   * @param {String} req.body.submissionId - submission id. 
   * @returns {JSON} - Url generated link. 
   */

  getImageUploadUrl(req) {

    return new Promise(async (resolve, reject) => {

      try {

        if(!Array.isArray(req.body.files) || req.body.files.length < 1) {
          throw new Error(messageConstants.apiResponses.FILES_NAME_NOT_GIVEN);
        }

        const folderPath = req.body.submissionId + "/" + req.userDetails.userId + "/";

        let signedUrl = await filesHelper.getSignedUrls(folderPath, req.body.files);

        if(signedUrl.success) {
          return resolve({
            message: messageConstants.apiResponses.URL_GENERATED,
            result: signedUrl.files
          });
        } else {
          throw new Error(signedUrl.message);
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
