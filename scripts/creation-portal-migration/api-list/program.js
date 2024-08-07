const { default: axios } = require("axios");
const { CONFIG } = require("../constant/config");
const { getHeaders } = require("./headers");
const constants = require('../constant');


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
  * @returns {JSON} - Creates a program from program template
*/
const createProgram = async (templateData) => {
  const url = CONFIG.HOST.creation_portal + CONFIG.APIS.create_program;
  const data = {
    request: {
      ...templateData,
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(false, c),
    data: data,
  };

  const res = await axios(config);

  return res?.data?.result?.program_id;
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
  * @returns {JSON} - Updates the program with the updated program template
*/
const updateProgram = async (templateData) => {
  const url = CONFIG.HOST.creation_portal + CONFIG.APIS.update_program;
  const data = {
    request: {
      ...templateData,
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(false,constants.CREATION_PORTAL),
    data: data,
  };
  const res = await axios(config);
  return res.data;
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
  * @returns {JSON} - Published the program 
*/
const publishProgram = async (templateData) => {
  const url = CONFIG.HOST.creation_portal + CONFIG.APIS.publish_program;
  const data = {
    request: {
      ...templateData,
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(false, constants.CREATION_PORTAL),
    data: data,
  };

  const res = await axios(config);
  return res.data;
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
  * @returns {JSON} - Nominates the program
**/
const nominateProgram = async (program_id, orgAdmin) => {
  const url =
    CONFIG.HOST.creation_portal + CONFIG.APIS.add_program_nomination;
  const data = {
    request: {
      program_id: program_id,
      status: "Pending",
      collection_ids: [],
      createdby: orgAdmin?.srcOrgAdminId,
      targetprimarycategories: [
        {
          name: "Observation",
          identifier: "obj-cat:observation_questionset_all",
          targetObjectType: "QuestionSet",
        },
        {
          name: "Survey",
          identifier: "obj-cat:survey_questionset_all",
          targetObjectType: "QuestionSet",
        },
      ],
      content_types: [],
      organisation_id: orgAdmin?.org_id,
      user_id: orgAdmin?.mappedUserId||  process.env.DEFAULT_CONTRIBUTOR_ORG_ADMIN_ID,
    },
  };
  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, constants.CREATION_PORTAL),
    data: data,
  };

  const res = await axios(config);
  return res.data;
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
  * @returns {JSON} - updates the contributor to the program
**/
const updateContributorToProgram = async (reqData) => {
  const url =
    CONFIG.HOST.creation_portal + CONFIG.APIS.update_program_nomination;
  const data = {
    request: {
      ...reqData,
    },
  };

  const config = {
    method: "post",
    url: url,
    headers: await getHeaders(true, constants.CREATION_PORTAL),
    data: data,
  };

  const res = await axios(config);
  return res.data;
};

module.exports = {
  createProgram,
  updateProgram,
  publishProgram,
  nominateProgram,
  updateContributorToProgram,
};
