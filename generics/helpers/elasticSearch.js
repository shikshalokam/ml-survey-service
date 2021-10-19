/**
 * name : elasticSearch.js
 * author : Aman Jung Karki
 * created-date : 11-Jun-2020
 * Description : elastic search common functionality
 */

/**
  * Get user data
  * @function
  * @name get
  * @param {String} id - a unique document id
  * @param {String} index - elastic search index
  * @param {String} type - elastic search type
  * @returns {Object} Get user data.
*/

var get = function ( 
  id = "",
  index = "",
  type = ""
) {

  return new Promise(async function (resolve, reject) {
    try {

      if (id == "") {
        throw new Error("ID is required");
      }

      if (index == "") {
        throw new Error("Index is required");
      }

      const result = await elasticsearch.client.get({
        id: id,
        index: index
      }, {
          ignore: [httpStatusCode["not_found"].status],
          maxRetries: 3
        });

      return resolve(result);

    } catch (error) {
      return reject(error);
    }
  })
};

/**
  * Create or update based on user data.
  * @function
  * @name createOrUpdate
  * @param {String} id - a unique document id
  * @param {String} index - elastic search index
  * @param {String} data - requested data
  * @returns {Object} created or updated user data.
*/

var createOrUpdate = function (
  id = "",
  index = "",
  data = ""
) {

  return new Promise(async function (resolve, reject) {
    try {

      if (id == "") {
        throw new Error("ID is required");
      }

      if (index == "") {
        throw new Error("Index is required");
      }

      if (Object.keys(data).length == 0) {
        throw new Error("Data is required");
      }

      let result = 
      await elasticsearch.client.update({
        id : id,
        index : index,
        body : {
          doc : data ,
          doc_as_upsert : true
        }
      });

      return resolve(result);

    } catch (error) {
      return reject(error);
    }
  })
};

module.exports = {
  get : get,
  createOrUpdate : createOrUpdate
};