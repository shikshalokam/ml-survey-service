const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const { getHeaders } = require("./headers");
const constants = require("../constant");
const logger = require("../logger");

const creationPortalUrl = CONFIG.HOST.creation_portal;

/**
* To create the program in creation portal
* @method
* @name createProgram
* @param {Object} templateData - {
    "request": {
        "name": "MIGRATED APR 4 2023 Test -Mantra4Change-APSWREIS School Leader Feedback sourcing project",
        "description": "Test -Mantra4Change-APSWREIS School Leader Feedback sourcing project description",
        "nomination_enddate": "2023-04-05T07:46:48.015Z",
        "rewards": null,
        "shortlisting_enddate": "2023-04-05T07:46:48.015Z",
        "enddate": "2023-04-06T07:46:48.015Z",
        "content_submission_enddate": "2023-04-05T07:46:48.015Z",
        "type": "public",
        "target_type": "searchCriteria",
        "content_types": [],
        "target_collection_category": [],
        "sourcing_org_name": "dockstaging",
        "rootorg_id": "01338111579044249633",
        "createdby": "2730f876-735d-4935-ba52-849c524a53fe",
        "createdOn": "2023-04-04T07:46:48.015Z",
        "startdate": "2023-04-05T07:46:48.015Z",
        "slug": "sunbird",
        "status": "Draft",
        "program_id": "",
        "rolemapping": [],
        "config": {
            "defaultContributeOrgReview": false,
            "roles": [
                {
                    "id": 1,
                    "name": "CONTRIBUTOR",
                    "tabs": [
                        1
                    ],
                    "default": true,
                    "defaultTab": 1
                },
                {
                    "id": 2,
                    "name": "REVIEWER",
                    "tabs": [
                        2
                    ],
                    "defaultTab": 2
                }
            ]
        }
    }
}
* 
* @returns {Object} - return newly created Program object with ProgramId in the response - {
        "id": "api.program.create",
        "ts": "2022-12-20T09:24:07.416Z",
        "params": {
          "resmsgid": "0db28f81-8048-11ed-be8b-9962d8844469",
          "msgid": "0db28f80-8048-11ed-be8b-9962d8844469",
          "status": "successful",
          "err": null,
          "errmsg": null
        },
        "responseCode": "OK",
        "result": {
          "program_id": "0d8abc30-8048-11ed-be8b-9962d8844469"
        }
      }
*/

const createProgram = function (templateData) {
  const url = creationPortalUrl + CONFIG.APIS.create_program;
  const data = {
    request: {
      ...templateData,
    },
  };

  const config = {
    method: constants.METHOD.POST,
    url: url,
    headers: null,
    data: data,
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(false, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          resolve(res?.data);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while creating program, Error: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          reject(errorResponse);
        });
    } catch (error) {
      reject(error);
    }
  });
};

/**
* To update the program in creation portal
* @method
* @name updateProgram
* @param {Object} templateData - {
   {
    "request": {
        "config": {
            "defaultContributeOrgReview": false,
            "roles": [
                {
                    "id": 1,
                    "name": "CONTRIBUTOR",
                    "tabs": [
                        1
                    ],
                    "default": true,
                    "defaultTab": 1
                },
                {
                    "id": 2,
                    "name": "REVIEWER",
                    "tabs": [
                        2
                    ],
                    "defaultTab": 2
                }
            ],
            "framework": [
                "ekstep_ncert_k-12"
            ],
            "frameworkObj": {
                "code": "ekstep_ncert_k-12",
                "name": "CBSE",
                "type": "K-12",
                "identifier": "ekstep_ncert_k-12"
            },
            "sharedContext": []
        },
        "targetprimarycategories": [
            {
                "identifier": "obj-cat:observation_questionset_all",
                "name": "Observation",
                "targetObjectType": "QuestionSet"
            },
            {
                "identifier": "obj-cat:survey_questionset_all",
                "name": "Survey",
                "targetObjectType": "QuestionSet"
            }
        ],
        "targetprimarycategorynames": [
            "Observation",
            "Survey"
        ],
        "program_id": "2a744d00-7c7b-11ed-bcf5-df48f63ad78b"
    }
}
* 
*  @returns {JSON} - Updates the program with the updated program template -{
        "id": "api.program.update",
        "ts": "2022-12-20T09:58:55.641Z",
        "params": {
          "resmsgid": "ea606891-804c-11ed-be8b-9962d8844469",
          "msgid": "ea606890-804c-11ed-be8b-9962d8844469",
          "status": "successful",
          "err": null,
          "errmsg": null
        },
        "responseCode": "OK",
        "result": {
          "program_id": "a043dc40-3497-11eb-9c32-15914148e3ce"
        }
      }
*/
const updateProgram = function (templateData) {
  const url = creationPortalUrl + CONFIG.APIS.update_program;
  const data = {
    request: {
      ...templateData,
    },
  };

  const config = {
    method: constants.METHOD.POST,
    url: url,
    headers: null,
    data: data,
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(false, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          resolve(res?.data);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while updating program, Error: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          reject(errorResponse);
        });
    } catch (error) {
      reject(error);
    }
  });
};

/**
* To publish the program in creation portal
* @method
* @name publishProgram
* @param {Object} templateData - {
   {
    "request": {
        "program_id": "37a9aef0-81be-11ed-824e-695a192a4217",
        "channel": "sunbird"
    }
}
* 
* @returns {JSON} - Published the program  - {
        "id": "api.v1.publish",
        "ver": "1.0",
        "ts": "2022-12-20T09:32:09.710Z",
        "params": {
          "resmsgid": "2d2ac8e0-8049-11ed-be8b-9962d8844469",
          "msgid": "2c4c4fc0-8049-11ed-be8b-9962d8844469",
          "status": "successful",
          "err": null,
          "errmsg": null
        },
        "responseCode": "OK",
        "result": {
          "program_id": "a043dc40-3497-11eb-9c32-15914148e3ce",
          "afterPublishResponse": {
            "nomination": {
              "error": null,
              "result": {
                "program_id": "a043dc40-3497-11eb-9c32-15914148e3ce",
                "user_id": "48dc0e70-2775-474b-9b78-def27d047836",
                "organisation_id": "e0ab89f4-0fcb-47ea-9b70-3ed0f12b1b7a",
                "status": "Approved",
                "collection_ids": [
                  "do_11369316334888550414055",
                  "do_11369316334883635214053",
                  "do_11369316334885273614054"
                ],
                "content_types": [
                  "Course Assessment",
                  "eTextbook",
                  "Explanation Content",
                  "Learning Resource",
                  "Practice Question Set",
                  "Teacher Resource"
                ]
              }
            },
            "userMapping": {}
          }
        }
      }
*/

const publishProgram = function (templateData) {
  const url = creationPortalUrl + CONFIG.APIS.publish_program;
  const data = {
    request: {
      ...templateData,
    },
  };

  const config = {
    method: constants.METHOD.POST,
    url: url,
    headers: null,
    data: data,
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(false, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          return resolve(res?.data);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while publishing program, Error: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          return reject(errorResponse);
        });
    } catch (error) {
      return reject(error);
    }
  });
};

/**
* To nominate the program in creation portal
* @method
* @name nominateProgram
* @param {String} program_id
* @param {Object} orgAdmin - 
 {
    "request": {
        "program_id": "9b616fc0-d76b-11ed-87b4-9feca80ba862",
        "status": "Pending",
        "collection_ids": [],
        "createdby": "e31c8cc0-ccf3-4b4d-9501-e7beca64592b",
        "targetprimarycategories": [
            {
                "name": "Observation",
                "identifier": "obj-cat:observation_questionset_all",
                "targetObjectType": "QuestionSet"
            },
            {
                "name": "Survey",
                "identifier": "obj-cat:survey_questionset_all",
                "targetObjectType": "QuestionSet"
            }
        ],
        "content_types": [],
        "organisation_id": "fba93280-27b5-4d29-90e0-1f79ecbfa4bf",
        "user_id": "d8d54588-82f7-420d-b098-c03948135d6f"
    }
}
* 
* @returns {JSON} - Nominates the program - {
        "id": "api.nomination.add",
        "ts": "2022-01-30T09:22:15.027Z",
        "params": {
          "resmsgid": "950c85b1-a07f-11ed-a249-d1c2d4936c48",
          "msgid": "950c85b0-a07f-11ed-a249-d1c2d4936c48",
          "status": "successful",
          "err": null,
          "errmsg": null
        },
        "responseCode": "OK",
        "result": {
          "program_id": "c43f7790-0a2a-11eb-a2e9-4fe29a51bb70",
          "user_id": "19ba0e4e-9285-4335-8dd0-f674bf03fa4d"
        }
      }
**/
const nominateProgram = function (program_id, orgAdmin) {
  const url = creationPortalUrl + CONFIG.APIS.add_program_nomination;
  const data = {
    request: {
      program_id: program_id,
      status: constants.PENDING,
      collection_ids: [],
      createdby: orgAdmin?.srcOrgAdminId,
      targetprimarycategories: [
        {
          name: constants.OBSERVATION,
          identifier: constants.OBJ_CAT.OBSERVATION_QUESTIONSET_ALL,
          targetObjectType: constants.QUESTION_SET,
        },
        {
          name: constants.SURVEY,
          identifier: constants.OBJ_CAT.SURVEY_QUESTIONSET_ALL,
          targetObjectType: constants.QUESTION_SET,
        },
      ],
      content_types: [],
      organisation_id: orgAdmin?.org_id,
      user_id:
        orgAdmin?.mappedUserId || process.env.DEFAULT_CONTRIBUTOR_ORG_ADMIN_ID,
    },
  };
  const config = {
    method: constants.METHOD.POST,
    url: url,
    headers: null,
    data: data,
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(true, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          return resolve(res?.data);
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while nominating program, Error: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          return reject(errorResponse);
        });
    } catch (error) {
      return reject(error);
    }
  });
};

/**
* To update the contributor for the program in creation portal
* @method
* @name updateContributorToProgram
* @param {Object} reqData - 
{
    "request": {
        "program_id": "6a4f7430-7ad8-11ed-bcf5-df48f63ad78b",
        "user_id": "1cf88ea3-083d-4fdf-84be-3628e63ce7f0",
        "rolemapping": {
            "REVIEWER": [
                "c5bd1056-d7c7-4f62-ae18-a121490cdd7f"
            ],
            "CONTRIBUTOR": [
                "c5bd1056-d7c7-4f62-ae18-a121490cdd7f"
            ]
        }
    }
}
* 
* @returns {JSON} - updates the contributor to the program - {
        "id": "api.nomination.update",
        "ts": "2023-01-30T09:22:14.027Z",
        "params": {
          "resmsgid": "950c85b1-a07f-11ed-a249-d1c2d4936c48",
          "msgid": "950c85b0-a07f-11ed-a249-d1c2d4936c48",
          "status": "successful",
          "err": null,
          "errmsg": null
        },
        "responseCode": "OK",
        "result": {
          "program_id": "c43f7790-0a2a-11eb-a2e9-4fe29a51bb70",
          "user_id": "19ba0e4e-9285-4335-8dd0-f674bf03fa4d"
        }
      }
**/
const updateContributorToProgram = function (reqData) {
  const url = creationPortalUrl + CONFIG.APIS.update_program_nomination;
  const data = {
    request: {
      ...reqData,
    },
  };

  const config = {
    method: constants.METHOD.POST,
    url: url,
    headers: null,
    data: data,
  };

  return new Promise(async (resolve, reject) => {
    try {
      config.headers = await getHeaders(true, constants.CREATION_PORTAL);

      axios(config)
        .then((res) => {
          resolve(res.data); // Directly resolve the data without checking status
        })
        .catch((error) => {
          const errorResponse = error?.response?.data;
          logger.error(
            `Error while updating contributor to program, Error: ${errorResponse?.responseCode} - ${errorResponse?.params?.errmsg}`
          );
          reject(errorResponse);
        });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  createProgram,
  updateProgram,
  publishProgram,
  nominateProgram,
  updateContributorToProgram,
};
