var http = require("https");
const Request = require('./httpRequest');
const jwtDecode = require('jwt-decode');

var getUserInfo = function (token, userId) {

  if (process.env.DISABLE_LEARNER_SERVICE_ON_OFF && process.env.DISABLE_LEARNER_SERVICE_ON_OFF == "ON") {
    let jwtInfo = jwtDecode(token)
    return new Promise(function(resolve,reject) {
      return resolve({
          id: "api.user.read",
          ver: "v1",
          ts: "2019-09-02 05:02:14:728+0000",
          params: {
              err: null,
              errmsg: null,
              msgid: "d236ac15-46e9-4808-b645-a041749e7614",
              resmsgid: null,
              status: "success"
          },
          responseCode: "OK",
          result: {
              response: {
                  address: new Array,
                  avatar: null,
                  badgeAssertions: new Array,
                  channel: "SHIKSHALOKAM",
                  countryCode: null,
                  createdBy: "193cd013-5d7b-4c76-a649-835888b93bb9",
                  createdDate: "2018-10-24 16:45:31:634+0000",
                  currentLoginTime: null,
                  dob: null,
                  education: new Array,
                  email: (jwtInfo.email && jwtInfo.email != "") ? jwtInfo.email : "",
                  emailVerified: false,
                  externalIds: new Array,
                  firstName: jwtInfo.name,
                  gender: null,
                  grade: new Array,
                  id: jwtInfo.sub.split(":").pop(),
                  identifier: jwtInfo.sub.split(":").pop(),
                  isDeleted: false,
                  jobProfile: new Array,
                  language: new Array,
                  lastLoginTime: null,
                  lastName: "",
                  location: null,
                  organisations: [
                      {
                          addedBy: "193cd013-5d7b-4c76-a649-835888b93bb9",
                          approvalDate: "2018-10-24 16:50:05:242+0000",
                          approvedBy: "193cd013-5d7b-4c76-a649-835888b93bb9",
                          hashTagId: "0125747659358699520",
                          id: "0126189555108741123",
                          isApproved: true,
                          isDeleted: false,
                          isRejected: false,
                          organisationId: "0125747659358699520",
                          orgJoinDate: "2018-10-24 16:50:05:242+0000",
                          roles: ["LEAD_ASSESSOR","ASSESSOR"],
                          userId:jwtInfo.sub.split(":").pop()
                      }
                  ],
                  phone: "******0000",
                  phoneverified: null,
                  profileSummary: null,
                  profileVisibility: {
                      phone: "private",
                      email: "private"
                  },
                  roles: ["PUBLIC"],
                  rootOrg: {
                      addressId:null,
                      approvedBy:null,
                      approvedDate:null,
                      channel:"SHIKSHALOKAM",
                      communityId:null,
                      contactDetail:new Array,
                      createdBy:"193cd013-5d7b-4c76-a649-835888b93bb9",
                      createdDate:"2018-08-23 06:12:24:130+0000",
                      dateTime:null,
                      description:"ShikshaLokam",
                      externalId:null,
                      hashTagId:"0125747659358699520",
                      homeUrl:null,
                      id:"0125747659358699520",
                      identifier:"0125747659358699520",
                      imgUrl:null,
                      isApproved:null,
                      isDefault:null,
                      isRootOrg:true,
                      locationId:null,
                      locationIds:new Array,
                      noOfMembers:null,
                      orgCode:null,
                      orgName:"ShikshaLokam",
                      orgType:null,
                      orgTypeId:null,
                      parentOrgId:null,
                      preferredLanguage:null,
                      provider:null,
                      rootOrgId:"0125747659358699520",
                      slug:"shikshalokam",
                      status:1,
                      theme:null,
                      thumbnail:null,
                      updatedBy:null,
                      updatedDate:null
                  },
                  rootOrgId: "0125747659358699520",
                  skills: new Array,
                  status: 1,
                  subject: new Array,
                  tcStatus: null,
                  tcUpdatedDate: null,
                  tempPassword: null,
                  thumbnail: null,
                  updatedBy: null,
                  updatedDate: null,
                  userId: jwtInfo.sub.split(":").pop(),
                  userName: (jwtInfo.email && jwtInfo.email != "") ? 
                  jwtInfo.email.split("@").shift() : (jwtInfo.preferred_username && jwtInfo.preferred_username != "") ? 
                  jwtInfo.preferred_username.split("@").shift() : "",
                  webPages: new Array,
              }
          }
      })
    })
  }

  


  let options = {
    host: process.env.SHIKSHALOKAM_BASE_HOST,
    port: 443,
    path: "/api/user/v1/read/" + userId,
    method: "GET",
    headers: {
      authorization: process.env.AUTHORIZATION,
      "x-authenticated-user-token": token
    }
  };


  let body = "";
  return new Promise(function (resolve, reject) {
    try {
      var httpreq = http.request(options, function (response) {
        response.setEncoding("utf8");
        response.on("data", function (chunk) {
          body += chunk;
        });
        response.on("end", function () {
          if (
            response.headers["content-type"] ==
            "application/json; charset=utf-8" ||
            response.headers["content-type"] == "application/json"
          ) {
            body = JSON.parse(body);
            return resolve(body);
          }
        });
      });
      httpreq.end();
    } catch (error) {
      reject(error);
    }
  });
};

var getKeycloakUserIdByLoginId = function (token, userName) {
  const reqObj = new Request()

  let requestData = {
    "request": {
      "filters": {
        "userName": userName.toLowerCase()
      }
    }
  }

  let url = "https://" + process.env.SHIKSHALOKAM_BASE_HOST + "/api/user/v1/search"
  let options = {
    headers: {
      "content-type": "application/json",
      authorization: process.env.AUTHORIZATION,
      "x-authenticated-user-token": token
    },
    json: requestData
  };

  let returnResponse = []
  return new Promise((resolve, reject) => {
    return resolve(reqObj.post(
      url,
      options
    ));
  }).then(result => {
    let dataResponse = JSON.parse(result.data);
    dataResponse.result.response.content.forEach(eachContent => {
      returnResponse.push({ userLoginId: eachContent.id })
    });

    return returnResponse
  }).catch((err) => {
    returnResponse = {
      success: false,
      message: "Something went wrong !!"
    }
    return returnResponse
  })
}

module.exports = {
  userInfo: getUserInfo,
  getKeycloakUserIdByLoginId: getKeycloakUserIdByLoginId
};
