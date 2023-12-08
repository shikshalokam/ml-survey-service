/**
 * name : admin.js
 * author : Ankit Shahu
 * created-date : 20-09-2023
 * Description : Admin Related information.
 */


module.exports = class Admin {
  static get name() {
    return 'admin';
  }


   /**
     * @api {post} /kendra/api/v1/admin/createIndex/:collectionName
     * Creates indexs on collections 
     * @apiVersion 1.0.0
     * @apiGroup Admin
     * @apiSampleRequest /kendra/api/v1/admin/createIndex/apps
     * @param {json} Request-Body:
     * 
         {
              "keys": [
                  "scope.roles"
              ]
          }
     * @apiParamExample {json} Response:
     * {
          "message": "Keys indexed successfully",
          "status": 200
      }
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
      * Create indexs on collections
      * @method
      * @name createIndex
      * @param {String} _id - MongoDB Collection Name
      * @param {Object} req - Req Body
      * @returns {JSON} success body.
    */
  async createIndex(req) {
    return new Promise(async (resolve, reject) => {
      try {
        let collection = req.params._id;
        let keys = req.body.keys;

        let presentIndex = await database.models[collection].db.collection(collection).listIndexes({}, { key: 1 }).toArray();
        let indexes = presentIndex.map((indexedKeys) => {
          return Object.keys(indexedKeys.key)[0];
        });
        let indexNotPresent = _.differenceWith(keys, indexes);
        if (indexNotPresent.length > 0) {
          indexNotPresent.forEach(async (key) => {
            await database.models[collection].db.collection(collection).createIndex({ [key]: 1 });
          });
          return resolve({
            message: messageConstants.apiResponses.KEYS_INDEXED_SUCCESSFULLY,
            success: true,
          });
        } else {
          return resolve({
            message: messageConstants.apiResponses.KEYS_ALREADY_INDEXED,
            success: true,
          });
        }
      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error,
        });
      }
    });
  }
};
