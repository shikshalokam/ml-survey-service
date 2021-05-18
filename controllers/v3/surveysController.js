/**
 * name : surveysController.js
 * author : Deepa
 * created-date : 21-Dec-2020
 * Description : Surveys information.
 */

// Dependencies
const surveysHelper = require(MODULES_BASE_PATH + "/surveys/helper");
const v2Survey = require(ROOT_PATH + "/controllers/v2/surveysController");

/**
    * Surveys
    * @class
*/
module.exports = class Surveys extends v2Survey {


    /**
    * @api {post} /assessment/api/v3/surveys/details/:surveyId?solutionId=:solutionId
    * Survey details.
    * @apiVersion 3.0.0
    * @apiGroup Surveys
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v3/surveys/details/5de8a220c210d4700813e695?solutionId=5f5b38ec45365677f64b2843
    * @apiParamExample {json}  Request-Body:
    * {
    *   "role" : "HM",
   		"state" : "236f5cff-c9af-4366-b0b6-253a1789766a",
        "district" : "1dcbc362-ec4c-4559-9081-e0c2864c2931",
        "school" : "c5726207-4f9f-4f45-91f1-3e9e8e84d824"
    }
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    "message": "Survey details fetched successfully",
    "status": 200,
    "result": {
        "solution": {
            "_id": "600ac696c7de076e6f994a66",
            "externalId": "AP-TEST-PROGRAM-3.6.5-SURVEY-1-DEO",
            "name": "AP-TEST-PROGRAM-3.6.5-SURVEY-1-DEO",
            "description": "Description of AP-TEST-PROGRAM-3.6.5-SURVEY-1-DEO",
            "captureGpsLocationAtQuestionLevel": false,
            "enableQuestionReadOut": false
        },
        "program": {
            "_id": "600ab53cc7de076e6f993724",
            "isAPrivateProgram": false,
            "externalId": "AP-TEST-PROGRAM-3.6.5",
            "name": "AP-TEST-PROGRAM-3.6.5",
            "description": "",
            "imageCompression": {
                "quality": 10
            }
        },
        "assessment": {
            "name": "AP-TEST-PROGRAM-3.6.5-SURVEY-1-DEO",
            "description": "Description of AP-TEST-PROGRAM-3.6.5-SURVEY-1-DEO",
            "externalId": "AP-TEST-PROGRAM-3.6.5-SURVEY-1-DEO",
            "submissionId": "600b40f383c4c7139fb19a02",
            "evidences": [
                {
                    "code": "SF",
                    "sections": [
                        {
                            "code": "SQ",
                            "questions": [
                                {
                                    "_id": "",
                                    "question": "",
                                    "isCompleted": "",
                                    "showRemarks": "",
                                    "options": "",
                                    "sliderOptions": "",
                                    "children": "",
                                    "questionGroup": "",
                                    "fileName": "",
                                    "instanceQuestions": "",
                                    "isAGeneralQuestion": "",
                                    "autoCapture": "",
                                    "allowAudioRecording": "",
                                    "prefillFromEntityProfile": "",
                                    "entityFieldName": "",
                                    "isEditable": "",
                                    "showQuestionInPreview": "",
                                    "deleted": "",
                                    "remarks": "",
                                    "value": "",
                                    "usedForScoring": "",
                                    "questionType": "",
                                    "canBeNotApplicable": "",
                                    "visibleIf": "",
                                    "validation": "",
                                    "file": "",
                                    "externalId": "",
                                    "tip": "",
                                    "hint": "",
                                    "responseType": "pageQuestions",
                                    "modeOfCollection": "",
                                    "accessibility": "",
                                    "rubricLevel": "",
                                    "sectionHeader": "",
                                    "page": "p2",
                                    "questionNumber": "",
                                    "updatedAt": "",
                                    "createdAt": "",
                                    "__v": "",
                                    "createdFromQuestionId": "",
                                    "evidenceMethod": "",
                                    "payload": "",
                                    "startTime": "",
                                    "endTime": "",
                                    "gpsLocation": "",
                                    "pageQuestions": [
                                        {
                                            "_id": "5ffbfc5469a1847d4286dfcc",
                                            "question": [
                                                "Grade?",
                                                ""
                                            ],
                                            "isCompleted": false,
                                            "showRemarks": false,
                                            "options": [],
                                            "sliderOptions": [],
                                            "children": [],
                                            "questionGroup": [
                                                "A1"
                                            ],
                                            "fileName": [],
                                            "instanceQuestions": [],
                                            "isAGeneralQuestion": false,
                                            "autoCapture": false,
                                            "allowAudioRecording": false,
                                            "prefillFromEntityProfile": false,
                                            "entityFieldName": "",
                                            "isEditable": true,
                                            "showQuestionInPreview": false,
                                            "deleted": false,
                                            "remarks": "",
                                            "value": "",
                                            "usedForScoring": "",
                                            "questionType": "auto",
                                            "canBeNotApplicable": "false",
                                            "visibleIf": "",
                                            "validation": {
                                                "required": true,
                                                "max": "4",
                                                "min": "1"
                                            },
                                            "file": {
                                                "required": true,
                                                "type": [
                                                    "image/jpeg",
                                                    "docx",
                                                    "pdf",
                                                    "ppt"
                                                ],
                                                "minCount": 0,
                                                "maxCount": 10,
                                                "caption": "FALSE"
                                            },
                                            "externalId": "TSD003_1604483265440-1610349652536",
                                            "tip": "",
                                            "hint": "",
                                            "responseType": "slider",
                                            "modeOfCollection": "onfield",
                                            "accessibility": "No",
                                            "rubricLevel": "",
                                            "sectionHeader": "",
                                            "page": "p2",
                                            "questionNumber": "3",
                                            "updatedAt": "2021-01-11T07:20:52.544Z",
                                            "createdAt": "2020-11-04T09:47:55.359Z",
                                            "__v": 0,
                                            "createdFromQuestionId": "5fa278cb6c10b27561cd281f",
                                            "evidenceMethod": "SF",
                                            "payload": {
                                                "criteriaId": "5ffbfc5469a1847d4286dfd0",
                                                "responseType": "slider",
                                                "evidenceMethod": "SF",
                                                "rubricLevel": ""
                                            },
                                            "startTime": "",
                                            "endTime": "",
                                            "gpsLocation": ""
                                        },
                                        {
                                            "_id": "5ffbfc5469a1847d4286dfcd",
                                            "question": [
                                                "Which of the following is functional in the toilets of the school?",
                                                ""
                                            ],
                                            "isCompleted": false,
                                            "showRemarks": false,
                                            "options": [
                                                {
                                                    "value": "R1",
                                                    "label": "Cisterns"
                                                },
                                                {
                                                    "value": "R2",
                                                    "label": "Taps"
                                                },
                                                {
                                                    "value": "R3",
                                                    "label": "Washbasins"
                                                },
                                                {
                                                    "value": "R4",
                                                    "label": "Handwash/Soap"
                                                },
                                                {
                                                    "value": "R5",
                                                    "label": "None of the above"
                                                }
                                            ],
                                            "sliderOptions": [],
                                            "children": [],
                                            "questionGroup": [
                                                "A1"
                                            ],
                                            "fileName": [],
                                            "instanceQuestions": [],
                                            "isAGeneralQuestion": false,
                                            "autoCapture": false,
                                            "allowAudioRecording": false,
                                            "prefillFromEntityProfile": false,
                                            "entityFieldName": "",
                                            "isEditable": true,
                                            "showQuestionInPreview": false,
                                            "deleted": false,
                                            "remarks": "",
                                            "value": "",
                                            "usedForScoring": "",
                                            "questionType": "auto",
                                            "canBeNotApplicable": "false",
                                            "visibleIf": "",
                                            "validation": {
                                                "required": true
                                            },
                                            "externalId": "TSD004_1604483265440-1610349652537",
                                            "tip": "",
                                            "hint": "exam date",
                                            "responseType": "multiselect",
                                            "modeOfCollection": "onfield",
                                            "accessibility": "No",
                                            "rubricLevel": "",
                                            "sectionHeader": "",
                                            "page": "p2",
                                            "questionNumber": "4",
                                            "updatedAt": "2021-01-11T07:20:52.544Z",
                                            "createdAt": "2020-11-04T09:47:55.372Z",
                                            "__v": 0,
                                            "createdFromQuestionId": "5fa278cb6c10b27561cd2820",
                                            "evidenceMethod": "SF",
                                            "payload": {
                                                "criteriaId": "5ffbfc5469a1847d4286dfd0",
                                                "responseType": "multiselect",
                                                "evidenceMethod": "SF",
                                                "rubricLevel": ""
                                            },
                                            "startTime": "",
                                            "endTime": "",
                                            "gpsLocation": "",
                                            "file": ""
                                        }
                                    ]
                                }
                            ],
                            "name": "Survey Questions"
                        }
                    ],
                    "externalId": "SF",
                    "name": "Survey And Feedback",
                    "description": "Survey And Feedback",
                    "modeOfCollection": "",
                    "canBeNotApplicable": false,
                    "notApplicable": false,
                    "canBeNotAllowed": false,
                    "remarks": "",
                    "isActive": true,
                    "startTime": 1611816056314,
                    "endTime": 1611816077128,
                    "isSubmitted": true,
                    "submissions": []
                }
            ],
            "submissions": {
                "SF": {
                    "externalId": "SF",
                    "answers": {
                        "5ffbfc5469a1847d4286dfcc": {
                            "qid": "5ffbfc5469a1847d4286dfcc",
                            "value": 3,
                            "remarks": "",
                            "fileName": [],
                            "gpsLocation": "",
                            "payload": {
                                "question": [
                                    "Grade?",
                                    ""
                                ],
                                "labels": [
                                    3
                                ],
                                "responseType": "slider",
                                "filesNotUploaded": []
                            },
                            "startTime": 1611816060929,
                            "endTime": 1611816062432,
                            "criteriaId": "5ffbfc5469a1847d4286dfd0",
                            "responseType": "slider",
                            "evidenceMethod": "SF",
                            "rubricLevel": ""
                        }
                    },
                    "startTime": 1611816056314,
                    "endTime": 1611816077128,
                    "gpsLocation": null,
                    "submittedBy": "5deed393-6e04-449a-b98d-7f0fbf88f22e",
                    "submittedByName": "R Rejneesh Pillai ",
                    "submittedByEmail": "pi************@gmail.com",
                    "submissionDate": "2021-01-28T06:41:17.249Z",
                    "isValid": true
                }
            }
        }
    }}
    */
    /**
    * Survey details.
    * @method
    * @name details
    * @param  {Request} req request body.
    * @returns {Object} returns survey details information.
    * Result will have the details of survey.
    */

    async details(req) {
    return new Promise(async (resolve, reject) => {
        try {

            let validateSurveyId = gen.utils.isValidMongoId(req.params._id);
            let surveyDetails = {};

            if( validateSurveyId || req.query.solutionId ) {
                
                let surveyId = req.params._id ? req.params._id : "";

                surveyDetails = await surveysHelper.detailsV3
                (   
                    req.body,
                    surveyId,
                    req.query.solutionId,
                    req.userDetails.userId,
                    req.rspObj.userToken
                );
            } else {

                surveyDetails = await surveysHelper.getDetailsByLink(
                    req.params._id,
                    req.userDetails.userId,
                    req.rspObj.userToken,
                    req.body,
                    messageConstants.common.VERSION_3
                );
            }

            return resolve({
                message: surveyDetails.message,
                result: surveyDetails.data
            });

        } catch (error) {
            return reject({
                status: error.status || httpStatusCode.internal_server_error.status,
                message: error.message || httpStatusCode.internal_server_error.message,
                errorObject: error
            });
        }
    });
   }

}