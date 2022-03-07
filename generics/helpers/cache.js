/**
 * name : cache.js
 * author : Priyanka Pradeep
 * created-date : 21-Feb-2020
 * Description : Cache set , get and remove functionality.
 */

 const nodeCache = require( "node-cache" );
 const cache = new nodeCache();

 /**
  * Get cache data.
  * @method
  * @name get - Get specific cache data
  * @params key - name of the cache key.
  * @returns {Array} - return specific cache data.
*/

function getValue(key){
    let data = []; 

    if (cache.has(key)) {
        data = cache.get(key);
    }

    return data;
}


 /**
  * Set new cache data
  * @method
  * @name set
  * @params key - name of the cache key.
  * @params value - cache data to set.  
  * @returns {Array} - cache updated data.
*/

function setValue(key, value, timeout){
    let data = cache.set( key, value, timeout );
    return data;
}

/**
  * delete cache data
  * @method
  * @name remove
  * @params key - cache key need to be removed. 
  * @returns 
*/

function removeKey(key){

    let data = cache.del(key);
    return;
}

module.exports = {
    getValue : getValue,
    setValue : setValue,
    removeKey : removeKey
}