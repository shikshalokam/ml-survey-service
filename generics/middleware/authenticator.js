const jwtDecode = require('jwt-decode');
let slackClient = require("../helpers/slackCommunications");
var ApiInterceptor = require("./lib/apiInterceptor");
var messageUtil = require("./lib/messageUtil");
var responseCode = require("../httpStatusCodes");

var shikshalokam = require("../helpers/shikshalokam");

var reqMsg = messageUtil.REQUEST;
var keyCloakConfig = {
  authServerUrl: process.env.sunbird_keycloak_auth_server_url,
  realm: process.env.sunbird_keycloak_realm,
  clientId: process.env.sunbird_keycloak_client_id,
  public: process.env.sunbird_keycloak_public
};

var cacheConfig = {
  store: process.env.sunbird_cache_store,
  ttl: process.env.sunbird_cache_ttl
};

var respUtil = function (resp) {
  return {
    status: resp.errCode,
    message: resp.errMsg,
    currentDate: new Date().toISOString()
  };
};

var tokenAuthenticationFailureMessageToSlack = function (req, token, msg) {
  let jwtInfomration = jwtDecode(token)
  jwtInfomration["x-authenticated-user-token"] = token
  const tokenByPassAllowedLog = { method: req.method, url: req.url, headers: req.headers, body: req.body, errorMsg: msg, customFields: jwtInfomration }
  slackClient.sendExceptionLogMessage(tokenByPassAllowedLog)
}

var apiInterceptor = new ApiInterceptor(keyCloakConfig, cacheConfig);
var removedHeaders = [
  "host",
  "origin",
  "accept",
  "referer",
  "content-length",
  "accept-encoding",
  "accept-language",
  "accept-charset",
  "cookie",
  "dnt",
  "postman-token",
  "cache-control",
  "connection"
];

async function getAllRoles(obj) {
  let roles = await obj.roles;
  await _.forEach(obj.organisations, async value => {
    roles = await roles.concat(value.roles);
  });
  return roles;
}

module.exports = async function (req, res, next) {

  if (req.path.includes("/sharedLinks/verify")) return next();

  if (req.headers && req.headers.linkid) {

    let isShareable = await database.models.sharedLink.findOne({ linkId: req.headers.linkid, isActive: true });

    let requestURL = req.url.includes("?") ? req.url.split("?")[0] : req.url;

    if (isShareable && requestURL.includes(isShareable.reportName)) {

      req.url = (isShareable.queryParams) ? requestURL + "?" + isShareable.queryParams : requestURL;

      req.userDetails = isShareable.userDetails;

      return next();

    } else {

      let msg = "Bad request.";

      const slackMessageForBadRequest = { userIP: req.headers["x-real-ip"], method: req.method, url: req.url, headers: req.headers, body: req.body, errorMsg: msg, customFields: null };

      slackClient.badSharedLinkAccessAttemptAlert(slackMessageForBadRequest);

      let rspObj = {};

      rspObj.errCode = 400;

      rspObj.errMsg = msg;

      rspObj.responseCode = 400;

      return res.status(400).send(respUtil(rspObj));

    }
  }

  removedHeaders.forEach(function (e) {
    delete req.headers[e];
  });

  let paths = [
    "reports", 
    "pendingAssessments", 
    "completedAssessments", 
    "pendingObservations", 
    "completedObservations", 
    "solutionDetails",
    "/solutions/list",
    "/programs/listByIds",
    "frameworks/delete/",
    "questions/delete/",
    "observationSubmissions/disable/"
  ]

  var token = req.headers["x-authenticated-user-token"];
  if (!req.rspObj) req.rspObj = {};
  var rspObj = req.rspObj;

  
  let internalAccessApiPaths = [
    "createGesture", 
    "createEmoji", 
    "solutionDetails",
    "solutions/updateSolutions", 
    "solutions/addEntities",
    "frameworks/delete/",
    "questions/delete/",
    "observationSubmissions/disable/"
  ];
  
  let performInternalAccessTokenCheck = false;
  await Promise.all(internalAccessApiPaths.map(async function (path) {
    if (req.path.includes(path)) {
      performInternalAccessTokenCheck = true;
    }
  }));

  
  if (performInternalAccessTokenCheck) {
    if (req.headers["internal-access-token"] !== process.env.INTERNAL_ACCESS_TOKEN) {
      rspObj.errCode = reqMsg.TOKEN.MISSING_CODE;
      rspObj.errMsg = reqMsg.TOKEN.MISSING_MESSAGE;
      rspObj.responseCode = responseCode.unauthorized.status;
      return res.status(401).send(respUtil(rspObj));
    }
  }

//api need both internal access token and x-authenticated-user-token
  const internalAccessAndTokenApiPaths = ["entityAssessors/create"];
  let performInternalAccessTokenAndTokenCheck = false;
  await Promise.all(internalAccessAndTokenApiPaths.map(async function (path) {
    if (req.path.includes(path)) {
      performInternalAccessTokenAndTokenCheck = true;
    }
  }));

  
  if (performInternalAccessTokenAndTokenCheck) {
    if (req.headers["internal-access-token"] !== process.env.INTERNAL_ACCESS_TOKEN  || !token) {
      rspObj.errCode = reqMsg.TOKEN.MISSING_CODE;
      rspObj.errMsg = reqMsg.TOKEN.MISSING_MESSAGE;
      rspObj.responseCode = responseCode.unauthorized.status;
      return res.status(401).send(respUtil(rspObj));
    }
  }

//api need either x-authenticated-user-token or internal access token
 const insternalAccessTokenOrTokenPaths = ["userExtension/getProfile/","entities/relatedEntities/"];
 let performInternalAccessTokenOrTokenCheck = false;
  await Promise.all(insternalAccessTokenOrTokenPaths.map(async function (path) {
    if (req.path.includes(path)) {
      performInternalAccessTokenOrTokenCheck = true;
    }
  }));
  
  if (performInternalAccessTokenOrTokenCheck && !token) {
    if (req.headers["internal-access-token"] !== process.env.INTERNAL_ACCESS_TOKEN ) {
      rspObj.errCode = reqMsg.TOKEN.MISSING_CODE;
      rspObj.errMsg = reqMsg.TOKEN.MISSING_MESSAGE;
      rspObj.responseCode = responseCode.unauthorized.status;
      return res.status(401).send(respUtil(rspObj));
    }
    else {
        next();
        return
    }
  }

  for (let pointerToByPassPath = 0; pointerToByPassPath < paths.length; pointerToByPassPath++) {
    if ((req.path.includes(paths[pointerToByPassPath]) || (req.query.csv && req.query.csv == true)) && req.headers["internal-access-token"] === process.env.INTERNAL_ACCESS_TOKEN) {
      req.setTimeout(parseInt(REQUEST_TIMEOUT_FOR_REPORTS));
      next();
      return
    }
  }


  let tokenCheckByPassAllowedForURL = false
  let tokenCheckByPassAllowedForUser = false
  let tokenCheckByPassAllowedUserDetails = {}
  if (process.env.DISABLE_TOKEN_ON_OFF && process.env.DISABLE_TOKEN_ON_OFF === "ON" && process.env.DISABLE_TOKEN_CHECK_FOR_API && process.env.DISABLE_TOKEN_CHECK_FOR_API != "") {
    process.env.DISABLE_TOKEN_CHECK_FOR_API.split(',').forEach(allowedEndpoints => {
      if (req.path.includes(allowedEndpoints)) {
        tokenCheckByPassAllowedForURL = true
        let allowedUsersPath = "DISABLE_TOKEN_" + allowedEndpoints + "_USERS"
        if (process.env[allowedUsersPath] && process.env[allowedUsersPath] == "ALL") {
          tokenCheckByPassAllowedForUser = true
          tokenCheckByPassAllowedUserDetails = {
            id: process.env.DISABLE_TOKEN_DEFAULT_USERID,
            userId: process.env.DISABLE_TOKEN_DEFAULT_USERID,
            roles: [process.env.DISABLE_TOKEN_DEFAULT_USER_ROLE],
            name: process.env.DISABLE_TOKEN_DEFAULT_USER_NAME,
            email: process.env.DISABLE_TOKEN_DEFAULT_USER_EMAIL,
          }
        } else if (process.env[allowedUsersPath]) {
          let jwtInfo = jwtDecode(token)
          process.env[allowedUsersPath].split(',').forEach(allowedUser => {
            if (allowedUser == jwtInfo.sub) {
              tokenCheckByPassAllowedForUser = true
              tokenCheckByPassAllowedUserDetails = {
                id: jwtInfo.sub,
                userId: jwtInfo.sub,
                roles: [process.env.DISABLE_TOKEN_DEFAULT_USER_ROLE],
                name: jwtInfo.name,
                email: jwtInfo.email,
              }
            }
          })
        }
      }
    })
  }

  if (!token) {
    rspObj.errCode = reqMsg.TOKEN.MISSING_CODE;
    rspObj.errMsg = reqMsg.TOKEN.MISSING_MESSAGE;
    rspObj.responseCode = responseCode.unauthorized.status;
    return res.status(401).send(respUtil(rspObj));
  }

  apiInterceptor.validateToken(token, function (err, tokenData) {
    // console.error(err, tokenData, rspObj);

    if (err && tokenCheckByPassAllowedForURL && tokenCheckByPassAllowedForUser) {
      req.rspObj.userId = tokenCheckByPassAllowedUserDetails.userId;
      req.rspObj.userToken = req.headers["x-authenticated-user-token"];
      delete req.headers["x-authenticated-userid"];
      delete req.headers["x-authenticated-user-token"];
      req.headers["x-authenticated-userid"] = tokenCheckByPassAllowedUserDetails.userId;
      req.rspObj = rspObj;
      req.userDetails = tokenCheckByPassAllowedUserDetails;
      req.userDetails.userToken = req.rspObj.userToken
      req.userDetails.allRoles = tokenCheckByPassAllowedUserDetails.roles;

      tokenAuthenticationFailureMessageToSlack(req, token, "TOKEN BYPASS ALLOWED")
      next();
      return
    }

    if (err) {
      rspObj.errCode = reqMsg.TOKEN.INVALID_CODE;
      rspObj.errMsg = reqMsg.TOKEN.INVALID_MESSAGE;
      rspObj.responseCode = responseCode.unauthorized.status;
      tokenAuthenticationFailureMessageToSlack(req, token, "TOKEN VERIFICATION WITH KEYCLOAK FAILED")
      return res.status(401).send(respUtil(rspObj));
    } else {
      req.rspObj.userId = tokenData.userId;
      req.rspObj.userToken = req.headers["x-authenticated-user-token"];
      delete req.headers["x-authenticated-userid"];
      delete req.headers["x-authenticated-user-token"];
      // rspObj.telemetryData.actor = utilsService.getTelemetryActorData(req);
      req.headers["x-authenticated-userid"] = tokenData.userId;
      req.rspObj = rspObj;
      shikshalokam
        .userInfo(token, tokenData.userId)
        .then(async userDetails => {
          if (userDetails.responseCode == "OK") {
            req.userDetails = userDetails.result.response;
            req.userDetails.userToken = req.rspObj.userToken
            req.userDetails.allRoles = await getAllRoles(req.userDetails);
            next();
          } else {
            tokenAuthenticationFailureMessageToSlack(req, token, "TOKEN VERIFICATION - FAILED TO GET USER DETAIL FROM LEARNER SERVICE")
            rspObj.errCode = reqMsg.TOKEN.INVALID_CODE;
            rspObj.errMsg = reqMsg.TOKEN.INVALID_MESSAGE;
            rspObj.responseCode = responseCode.unauthorized.status;
            return res.status(401).send(respUtil(rspObj));
          }
        })
        .catch(error => {
          tokenAuthenticationFailureMessageToSlack(req, token, "TOKEN VERIFICATION - ERROR FETCHING USER DETAIL FROM LEARNER SERVICE")
          return res.status(401).send(error);
        });
    }
  });
};
