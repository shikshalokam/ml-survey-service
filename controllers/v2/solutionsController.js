/**
 * name : solutionsController.js
 * author : Akash
 * created-date : 22-feb-2019
 * Description : Solution related information.
 */

// Dependencies
const observationsHelper = require(MODULES_BASE_PATH + "/observations/helper");
const assessmentsHelper = require(MODULES_BASE_PATH + "/assessments/helper")
const transFormationHelper = require(MODULES_BASE_PATH + "/questions/transformationHelper");


/**
    * Solutions
    * @class
*/
module.exports = class Solutions extends Abstract {

  constructor() {
    super(solutionsSchema);
  }

  static get name() {
    return "solutions";
  }

  /**
  * @api {get} /assessment/api/v2/solutions/questions/{{solutionId}} Get Questions in solution .
  * @apiVersion 1.0.0
  * @apiName Get Questions in solution.
  * @apiGroup Solutions
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiParam {String} solutionId Solution Internal ID.
  * @apiSampleRequest /assessment/api/v2/solutions/questions/5f64601df5f6e432fe0f0575
  * @apiUse successBody
  * @apiUse errorBody
  * @apiParamExample {json} Response:
  * {
    "message": "Assessment fetched successfully",
    "status": 200,
    "result": {
        "solution": {
            "_id": "600ac0d1c7de076e6f9943b9",
            "externalId": "AP-TEST-PROGRAM-3.6.5-OBS-1-DEO",
            "name": "AP-TEST-PROGRAM-3.6.5-OBS-1-DEO",
            "description": "Description of AP-TEST-PROGRAM-3.6.5-OBS-1-DEO",
            "registry": [],
            "captureGpsLocationAtQuestionLevel": false,
            "enableQuestionReadOut": false,
            "scoringSystem": null,
            "isRubricDriven": false
        },
        "assessment": {
            "name": "AP-TEST-PROGRAM-3.6.5-OBS-1-DEO",
            "description": "Description of AP-TEST-PROGRAM-3.6.5-OBS-1-DEO",
            "externalId": "AP-TEST-PROGRAM-3.6.5-OBS-1-DEO",
            "submissionId": "",
            "evidences": [
                {
                    "code": "OB",
                    "sections": [
                        {
                            "code": "S1",
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
                                    "page": "p1",
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
                                            "_id": "5ffbfb6669a1847d4286dfbe",
                                            "question": [
                                                "As per PM eVidya guidelines, what has been touted as “One Nation, One Digital Platform”?",
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
                                                "required": true
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
                                            "externalId": "PS01_1597737024465-1610349414803",
                                            "tip": "",
                                            "hint": "",
                                            "responseType": "text",
                                            "modeOfCollection": "onfield",
                                            "accessibility": "No",
                                            "rubricLevel": "",
                                            "sectionHeader": "",
                                            "page": "p1",
                                            "questionNumber": "1",
                                            "updatedAt": "2021-01-11T07:16:54.816Z",
                                            "createdAt": "2020-08-18T07:50:42.547Z",
                                            "__v": 0,
                                            "createdFromQuestionId": "5f3b885219377eecddb06948",
                                            "evidenceMethod": "OB",
                                            "payload": {
                                                "criteriaId": "5ffbfb6669a1847d4286dfc3",
                                                "responseType": "text",
                                                "evidenceMethod": "OB",
                                                "rubricLevel": ""
                                            },
                                            "startTime": "",
                                            "endTime": "",
                                            "gpsLocation": ""
                                        },
                                        {
                                            "_id": "5ffbfb6669a1847d4286dfbf",
                                            "question": [
                                                "Coherent Access Means?",
                                                ""
                                            ],
                                            "isCompleted": false,
                                            "showRemarks": true,
                                            "options": [
                                                {
                                                    "value": "R1",
                                                    "label": "Ensuring all types of channels are used to reach students"
                                                },
                                                {
                                                    "value": "R2",
                                                    "label": "Ensuring all education departments work together for enabling access"
                                                },
                                                {
                                                    "value": "R3",
                                                    "label": "Ensuring per schedule, content shown via synchronous channels is also made available via asynchronous channels"
                                                },
                                                {
                                                    "value": "R4",
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
                                            "externalId": "PS02_1597737024465-1610349414805",
                                            "tip": "",
                                            "hint": "",
                                            "responseType": "radio",
                                            "modeOfCollection": "onfield",
                                            "accessibility": "No",
                                            "rubricLevel": "",
                                            "sectionHeader": "",
                                            "page": "p1",
                                            "questionNumber": "2",
                                            "updatedAt": "2021-01-11T07:16:54.816Z",
                                            "createdAt": "2020-08-18T07:50:42.566Z",
                                            "__v": 0,
                                            "createdFromQuestionId": "5f3b885219377eecddb06949",
                                            "evidenceMethod": "OB",
                                            "payload": {
                                                "criteriaId": "5ffbfb6669a1847d4286dfc3",
                                                "responseType": "radio",
                                                "evidenceMethod": "OB",
                                                "rubricLevel": ""
                                            },
                                            "startTime": "",
                                            "endTime": "",
                                            "gpsLocation": "",
                                            "file": ""
                                        },
                                        {
                                            "_id": "5ffbfb6669a1847d4286dfc0",
                                            "question": [
                                                "QR code shown on TV is also present in",
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
                                                "required": true
                                            },
                                            "externalId": "PS03_1597737024465-1610349414806",
                                            "tip": "",
                                            "hint": "",
                                            "responseType": "text",
                                            "modeOfCollection": "onfield",
                                            "accessibility": "No",
                                            "rubricLevel": "",
                                            "sectionHeader": "",
                                            "page": "p1",
                                            "questionNumber": "3",
                                            "updatedAt": "2021-01-11T07:16:54.816Z",
                                            "createdAt": "2020-08-18T07:50:42.577Z",
                                            "__v": 0,
                                            "createdFromQuestionId": "5f3b885219377eecddb0694a",
                                            "evidenceMethod": "OB",
                                            "payload": {
                                                "criteriaId": "5ffbfb6669a1847d4286dfc3",
                                                "responseType": "text",
                                                "evidenceMethod": "OB",
                                                "rubricLevel": ""
                                            },
                                            "startTime": "",
                                            "endTime": "",
                                            "gpsLocation": "",
                                            "file": ""
                                        },
                                        {
                                            "_id": "5ffbfb6669a1847d4286dfc1",
                                            "question": [
                                                "To accommodate TV content on Diksha, the file size limit has been increased to",
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
                                                "required": true
                                            },
                                            "externalId": "PS04_1597737024465-1610349414807",
                                            "tip": "",
                                            "hint": "",
                                            "responseType": "text",
                                            "modeOfCollection": "onfield",
                                            "accessibility": "No",
                                            "rubricLevel": "",
                                            "sectionHeader": "",
                                            "page": "p1",
                                            "questionNumber": "4",
                                            "updatedAt": "2021-01-11T07:16:54.816Z",
                                            "createdAt": "2020-08-18T07:50:42.587Z",
                                            "__v": 0,
                                            "createdFromQuestionId": "5f3b885219377eecddb0694b",
                                            "evidenceMethod": "OB",
                                            "payload": {
                                                "criteriaId": "5ffbfb6669a1847d4286dfc3",
                                                "responseType": "text",
                                                "evidenceMethod": "OB",
                                                "rubricLevel": ""
                                            },
                                            "startTime": "",
                                            "endTime": "",
                                            "gpsLocation": "",
                                            "file": ""
                                        },
                                        {
                                            "_id": "5ffbfb6669a1847d4286dfc2",
                                            "question": [
                                                "The first State to successfully leverage coherent access via Diksha and increase consumption is",
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
                                                "required": true
                                            },
                                            "externalId": "PS05_1597737024465-1610349414811",
                                            "tip": "",
                                            "hint": "",
                                            "responseType": "text",
                                            "modeOfCollection": "onfield",
                                            "accessibility": "No",
                                            "rubricLevel": "",
                                            "sectionHeader": "",
                                            "page": "p1",
                                            "questionNumber": "5",
                                            "updatedAt": "2021-01-11T07:16:54.816Z",
                                            "createdAt": "2020-08-18T07:50:42.598Z",
                                            "__v": 0,
                                            "createdFromQuestionId": "5f3b885219377eecddb0694c",
                                            "evidenceMethod": "OB",
                                            "payload": {
                                                "criteriaId": "5ffbfb6669a1847d4286dfc3",
                                                "responseType": "text",
                                                "evidenceMethod": "OB",
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
                    "externalId": "OB",
                    "tip": null,
                    "name": "Observation",
                    "description": null,
                    "modeOfCollection": "onfield",
                    "canBeNotApplicable": false,
                    "notApplicable": false,
                    "canBeNotAllowed": false,
                    "remarks": null,
                    "startTime": "",
                    "endTime": "",
                    "isSubmitted": false,
                    "submissions": []
                }
            ],
            "submissions": {}
        }
    }
}
  */
   /**
   * Get Questions in solution.
   * @method
   * @name deleteSolution
   * @param {Object} req - requested data.
   * @param {String} req.params._id - solutiion internal id.
   * @returns {JSON} consists of solution id.
   */

  async questions(req) {
    return new Promise(async (resolve, reject) => {
      try {

          let response = {
              message: messageConstants.apiResponses.ASSESSMENT_FETCHED,
              result: {},
          };
  
        let solutionId = req.params._id;
        let userId = req.userDetails.userId;

        if ( userId == "" ) {
          throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK)
        }

        let solutionDocumentProjectionFields = await observationsHelper.solutionDocumentProjectionFieldsForDetailsAPI();

        let solutionDocument = await database.models.solutions.findOne(
                  { _id: solutionId },
                  { ...solutionDocumentProjectionFields, referenceQuestionSetId: 1, type: 1 }
              ).lean();
          
        if( !solutionDocument ) {
          return resolve({
            status : httpStatusCode.bad_request.status,
            message : messageConstants.apiResponses.SOLUTION_NOT_FOUND
          });
        }

            const referenceQuestionSetId = solutionDocument?.referenceQuestionSetId;
  
            if (!referenceQuestionSetId) {
              let responseMessage =
              messageConstants.apiResponses.SOLUTION_IS_NOT_MIGRATED;
            return resolve({
              status: httpStatusCode.bad_request.status,
              message: responseMessage,
            });
            }

        let solutionDocumentFieldList = await observationsHelper.solutionDocumentFieldListInResponse()

        response.result.solution = await _.pick(solutionDocument, solutionDocumentFieldList);

        let assessment = {};
        assessment.name = solutionDocument.name;
        assessment.description = solutionDocument.description;
        assessment.externalId = solutionDocument.externalId;
        assessment.pageHeading = solutionDocument.pageHeading;
        assessment.submissionId = "";

            let evidenceMethodArray = {};
            let submissionDocumentEvidences = {};
            let submissionDocumentCriterias = [];
            Object.keys(solutionDocument.evidenceMethods).forEach(
              (solutionEcm) => {
                solutionDocument.evidenceMethods[solutionEcm].startTime = "";
                solutionDocument.evidenceMethods[solutionEcm].endTime = "";
                solutionDocument.evidenceMethods[solutionEcm].isSubmitted = false;
                solutionDocument.evidenceMethods[solutionEcm].submissions =
                  new Array();
              }
            );
  
            submissionDocumentEvidences = solutionDocument.evidenceMethods;
  
            let evidences = {};
            if (referenceQuestionSetId) {
              response.result.solution._id = referenceQuestionSetId;
              evidences = await transFormationHelper.getQuestionSetHierarchy(
                submissionDocumentCriterias,
                solutionDocument
              );
            }

        let entityDocument ={
          "metaInformation" :{},
          "questionGroup" : ""
        };

        let entityDocumentQuestionGroup = (entityDocument.metaInformation.questionGroup) ? entityDocument.metaInformation.questionGroup : ["A1"];
        assessment.evidences = [];
        const parsedAssessment = await assessmentsHelper.parseQuestionsV2(
            Object.values(evidenceMethodArray),
            entityDocumentQuestionGroup,
            submissionDocumentEvidences,
            (solutionDocument && solutionDocument.questionSequenceByEcm) ? solutionDocument.questionSequenceByEcm : false,
            {}
        );

        assessment.evidences = evidences.evidences;
        assessment.submissions = parsedAssessment.submissions;

        if (parsedAssessment.generalQuestions && parsedAssessment.generalQuestions.length > 0) {
            assessment.generalQuestions = parsedAssessment.generalQuestions;
        }

        response.result.assessment = assessment;
        return resolve(response);

      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message: error.message || httpStatusCode.internal_server_error.message,
          errorObject: error
        });
      }
    });
  }
  
};
