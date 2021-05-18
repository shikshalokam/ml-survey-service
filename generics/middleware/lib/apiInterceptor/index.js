/**
 * name : index.js
 * author : Anuj Gupta
 * Date : 23-sept-2017
 */

var keyCloakAuthUtils = require("keycloak-auth-utils");
var CacheManager = require("../cacheManager");
const jwt = require('jsonwebtoken');
const fs = require('fs');
const accessTokenValidationMode = (process.env.VALIDATE_ACCESS_TOKEN_OFFLINE && process.env.VALIDATE_ACCESS_TOKEN_OFFLINE === "OFF")? "OFF" : "ON";
const keyCloakPublicKeyPath = (process.env.KEYCLOAK_PUBLIC_KEY_PATH && process.env.KEYCLOAK_PUBLIC_KEY_PATH != "") ? ROOT_PATH+"/"+process.env.KEYCLOAK_PUBLIC_KEY_PATH+"/" : ROOT_PATH+"/"+"keycloak-public-keys/" ;

function ApiInterceptor(keyclock_config, cache_config) {
  this.config = keyclock_config;
  this.keyCloakConfig = new keyCloakAuthUtils.Config(this.config);
  this.grantManager = new keyCloakAuthUtils.GrantManager(this.keyCloakConfig);

  this.cacheManagerConfig = cache_config;
  this.cacheManager = new CacheManager(cache_config);
}

/**
 * [validateToken is used for validate user]
 * @param  {[string]}   token    [x-auth-token]
 * @param  {Function} callback []
 * @return {[Function]} callback [its retrun err or object with fields(token, userId)]
 */
ApiInterceptor.prototype.validateToken = function (token, callback) {
  if (accessTokenValidationMode === "ON") {
    var self = this;
    var decoded = jwt.decode(token, { complete: true });
    if(decoded === null || decoded.header === undefined){
      return callback("ERR_TOKEN_INVALID", null);
    }
    const kid = decoded.header.kid
    let cert = "";
    let path = keyCloakPublicKeyPath + kid + '.pem';

    if (fs.existsSync(path)) {
      cert = fs.readFileSync(path);
      jwt.verify(token, cert, { algorithm: 'RS256' }, function (err, decode) {
        if (err) {
          return callback("ERR_TOKEN_INVALID", null);
        }

        if (decode !== undefined) {
          const expiry = decode.exp;
          const now = new Date();
          if (now.getTime() > expiry * 1000) {
            return callback('Expired', null);
          }

          return callback(null, { token: token, userId: decode.sub.split(":").pop() });
        
        } else {
          return callback("ERR_TOKEN_INVALID", null);
        }

      });
    } else {
      return callback("ERR_TOKEN_INVALID", null);
    }
  }else{
    var self = this;
    self.cacheManager.get(token, function (err, tokenData) {
      if (err || !tokenData) {
        self.grantManager.userInfo(token, function (err, userData) {
          if (err) {
            return callback(err, null);
          } else {
            if (self.cacheManagerConfig.ttl) {
              self.cacheManager.set(
                { key: token, value: { token: token, userId: userData.sub.split(":").pop() } },
                function (err, res) { }
              );
            }
            return callback(null, { token: token, userId: userData.sub.split(":").pop() });
          }
        });
      } else {
        return callback(null, tokenData);
      }
    });
  }

  
};

module.exports = ApiInterceptor;
