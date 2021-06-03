/**
 * name : assessments.js
 * author : Aman
 * created-date : 22-Nov-2018
 * Description : Updated institutional assessments functionality.
 */

// Dependencies
const assessmentsHelper = require(MODULES_BASE_PATH + "/assessments/helper");
const submissionsHelper = require(MODULES_BASE_PATH + "/submissions/helper");

/**
    * Assessments
    * @class
*/
module.exports = class Assessments {

    constructor() {
    }

    /**
    * @api {get} /assessment/api/v2/assessments/details/{programID}?solutionId={solutionId}&entityId={entityId}&submissionNumber=submissionNumber&ecmMethod=ecmMethod Detailed assessments
    * @apiVersion 2.0.0
    * @apiName Assessment details
    * @apiGroup Assessments
    * @apiParam {String} solutionId Solution ID.
    * @apiParam {String} entityId Entity ID.
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v2/assessments/details/5c56942d28466d82967b9479?solutionId=5c5693fd28466d82967b9429&entityId=5c5694be52600a1ce8d24dc7&submissionNumber=1&ecmMethod=OB
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
       "evidences": [
         {
           "code": "AC3",
            "sections": [
            {
              "code": "RFE",
               "questions": [
                    {
                         "_id": "",
                         "question": "",
                         "options": "",
                         "children": "",
                         "questionGroup": "",
                         "fileName": "",
                         "instanceQuestions": "",
                         "deleted": "",
                         "tip": "",
                         "externalId": "",
                         "visibleIf": "",
                         "file": "",
                         "responseType": "pageQuestions",
                         "validation": "",
                         "showRemarks": "",
                         "isCompleted": "",
                         "remarks": "",
                         "value": "",
                         "page": "p1",
                         "canBeNotApplicable": "",
                         "usedForScoring": "",
                         "modeOfCollection": "",
                         "questionType": "",
                         "accessibility": "",
                         "updatedAt": "",
                         "createdAt": "",
                         "__v": "",
                         "evidenceMethod": "",
                         "payload": "",
                         "startTime": "",
                         "endTime": "",
                         "pageQuestions": [
                             {
                                 "_id": "5be6d08c9a14ba4b5038dd7e",
                                 "question": [
                                     "Does the school have a full time Principal? ",
                                     ""
                                    ],
                                    "options": [
                                        {
                                            "value": "R1",
                                            "label": "Yes"
                                        },
                                        {
                                            "value": "R2",
                                            "label": "No"
                                        }
                                    ],
                                    "children": [],
                                    "questionGroup": [
                                        "A1"
                                    ],
                                    "fileName": [],
                                    "instanceQuestions": [],
                                    "deleted": false,
                                    "tip": "",
                                    "externalId": "IPr/TL/01",
                                    "visibleIf": "",
                                    "file": "",
                                    "responseType": "radio",
                                    "validation": {
                                        "required": true
                                    },
                                    "showRemarks": false,
                                    "isCompleted": false,
                                    "remarks": "",
                                    "value": "",
                                    "page": "p1",
                                    "canBeNotApplicable": "false",
                                    "usedForScoring": "",
                                    "modeOfCollection": "onfield",
                                    "questionType": "auto",
                                    "accessibility": "global",
                                    "updatedAt": "2018-11-10T12:35:24.955Z",
                                    "createdAt": "2018-11-10T12:35:24.955Z",
                                    "__v": 0,
                                    "evidenceMethod": "PI",
                                    "payload": {
                                        "criteriaId": "5be177855e852b0e920ad136",
                                        "responseType": "radio",
                                        "evidenceMethod": "PI",
                                        "rubricLevel": ""
                                    },
                                    "startTime": "",
                                    "endTime": ""
                                }
                            ],
        "name": "Reading Fluency - English"
    }
]
}]
*/

  /**
      * Assessment details.
      * @method
      * @name details
      * @param {Object} req -request data. 
      * @param {String} req.params._id -program id.
      * @param {String} req.query.solutionId -solution id.
      * @param {String} req.query.entityId -entity id.
      * @param {String} req.query.submissionNumber - submission number.
      * @param {String} req.userDetails.userId -logged in user id.
      * @returns {JSON}
   */

    async details(req) {
        return new Promise(async (resolve, reject) => {
            try {
                req.body = req.body || {};

                let response = {
                    message: messageConstants.apiResponses.ASSESSMENT_FETCHED,
                    result: {}
                };

                let programQueryObject = {
                    _id: req.params._id,
                    status: "active",
                    components: { $in: [ObjectId(req.query.solutionId)] }
                };

                let programDocument = await database.models.programs.findOne(programQueryObject).lean();


                if (!programDocument) {
                    let responseMessage = messageConstants.apiResponses.PROGRAM_NOT_FOUND;
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: responseMessage 
                    });
                }

                let entityAssessorObject = {
                    userId: req.userDetails.userId,
                    programId: req.params._id,
                    solutionId: req.query.solutionId,
                    entities: { $in: [ObjectId(req.query.entityId)] }
                };
                let entityAssessorDocument = await database.models.entityAssessors.findOne(
                    entityAssessorObject
                ).lean();

                if (!entityAssessorDocument) {
                    let responseMessage = messageConstants.apiResponses.UNAUTHORIZED;
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: responseMessage 
                    });
                }

                const isRequestForOncallOrOnField = req.query.oncall && req.query.oncall == 1 ? "oncall" : "onfield";

                let entityQueryObject = { _id: ObjectId(req.query.entityId) };
                let entityDocument = await database.models.entities.findOne(
                    entityQueryObject,
                    {
                        metaInformation: 1,
                        entityTypeId: 1,
                        entityType: 1,
                        registryDetails: 1
                    }
                ).lean();

                if (!entityDocument) {
                    let responseMessage = messageConstants.apiResponses.ENTITY_NOT_FOUND;
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: responseMessage 
                    });
                }

                if (entityDocument.registryDetails && Object.keys(entityDocument.registryDetails).length > 0) {
                    entityDocument.metaInformation.registryDetails = entityDocument.registryDetails;
                }

                let solutionQueryObject = {
                    _id: req.query.solutionId,
                    programId: req.params._id,
                    status: "active",
                    entities: { $in: [ObjectId(req.query.entityId)] }
                };

                let solutionDocumentProjectionFields = 
                await assessmentsHelper.solutionDocumentProjectionFieldsForDetailsAPI()

                let solutionDocument = 
                await database.models.solutions.findOne(
                    solutionQueryObject,
                    solutionDocumentProjectionFields
                ).lean();


                if (!solutionDocument) {
                    let responseMessage = messageConstants.apiResponses.SOLUTION_NOT_FOUND;
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: responseMessage 
                    });
                }

                if( req.query.ecmMethod && req.query.ecmMethod !== "" ) {
                    if(!solutionDocument.evidenceMethods[req.query.ecmMethod] ) {
                        return resolve({ 
                            status: httpStatusCode.bad_request.status, 
                            message: messageConstants.apiResponses.ECM_NOT_EXIST
                        });
                    }
                }

                let currentUserAssessmentRole = await assessmentsHelper.getUserRole([entityAssessorDocument.role]);
                let profileFieldAccessibility = (solutionDocument.roles[currentUserAssessmentRole] && solutionDocument.roles[currentUserAssessmentRole].acl && solutionDocument.roles[currentUserAssessmentRole].acl.entityProfile) ? solutionDocument.roles[currentUserAssessmentRole].acl.entityProfile : {};

                let entityProfileForm = await database.models.entityTypes.findOne(
                    solutionDocument.entityTypeId,
                    {
                        profileForm: 1
                    }
                ).lean();

                if (!entityProfileForm) {
                    let responseMessage = messageConstants.apiResponses.ENTITY_PROFILE_FORM_NOT_FOUND;
                    return resolve({ 
                        status: httpStatusCode.bad_request.status, 
                        message: responseMessage 
                    });
                }

                let form = [];
                let entityDocumentTypes = (entityDocument.metaInformation.types) ? entityDocument.metaInformation.types : ["A1"];
                let entityDocumentQuestionGroup = (entityDocument.metaInformation.questionGroup) ? entityDocument.metaInformation.questionGroup : ["A1"];
                let entityProfileFieldsPerEntityTypes = solutionDocument.entityProfileFieldsPerEntityTypes;
                let filteredFieldsToBeShown = [];

                if (entityProfileFieldsPerEntityTypes) {
                    entityDocumentTypes.forEach(entityType => {
                        if (entityProfileFieldsPerEntityTypes[entityType]) {
                            filteredFieldsToBeShown.push(...entityProfileFieldsPerEntityTypes[entityType]);
                        }
                    })
                }

                entityProfileForm.profileForm.forEach(profileFormField => {
                    if (filteredFieldsToBeShown.includes(profileFormField.field)) {
                        profileFormField.value = (entityDocument.metaInformation[profileFormField.field]) ? entityDocument.metaInformation[profileFormField.field] : "";
                        profileFormField.visible = profileFieldAccessibility.visible.indexOf("all") > -1 || profileFieldAccessibility.visible.indexOf(profileFormField.field) > -1;
                        profileFormField.editable = profileFieldAccessibility.editable.indexOf("all") > -1 || profileFieldAccessibility.editable.indexOf(profileFormField.field) > -1;
                        form.push(profileFormField);
                    }
                })

                response.result.entityProfile = {
                    _id: entityDocument._id,
                    entityTypeId: entityDocument.entityTypeId,
                    entityType: entityDocument.entityType,
                    form: form
                };


                let programDocumentFieldList = await assessmentsHelper.programDocumentFieldListInResponse()

                response.result.program = await _.pick(programDocument, programDocumentFieldList);

                let solutionDocumentFieldList = await assessmentsHelper.solutionDocumentFieldListInResponse()

                response.result.solution = await _.pick(solutionDocument, solutionDocumentFieldList);

                let submissionDocument = {
                    entityId: entityDocument._id,
                    entityExternalId: (entityDocument.metaInformation.externalId) ? entityDocument.metaInformation.externalId : "",
                    entityInformation: entityDocument.metaInformation,
                    solutionId: solutionDocument._id,
                    solutionExternalId: solutionDocument.externalId,
                    frameworkId: solutionDocument.frameworkId,
                    frameworkExternalId: solutionDocument.frameworkExternalId,
                    entityTypeId: solutionDocument.entityTypeId,
                    entityType: solutionDocument.entityType,
                    scoringSystem : solutionDocument.scoringSystem,
                    isRubricDriven : solutionDocument.isRubricDriven,
                    programId: programDocument._id,
                    programExternalId: programDocument.externalId,
                    isAPrivateProgram : 
                    programDocument.isAPrivateProgram ? 
                    programDocument.isAPrivateProgram : 
                    false,
                    programInformation: {
                        ..._.omit(programDocument, ["_id", "components","isAPrivateProgram"])
                    },
                    evidenceSubmissions: [],
                    entityProfile: {},
                    status: "started"
                };

                if( solutionDocument.hasOwnProperty("criteriaLevelReport") ) {
                    submissionDocument["criteriaLevelReport"] = solutionDocument["criteriaLevelReport"];
                }

                if( 
                    solutionDocument.referenceFrom === messageConstants.common.PROJECT
                ) {
                    
                    submissionDocument["referenceFrom"] = messageConstants.common.PROJECT;
                    submissionDocument["project"] = solutionDocument.project;
                }

                let assessment = {};

                assessment.name = solutionDocument.name;
                assessment.description = solutionDocument.description;
                assessment.externalId = solutionDocument.externalId;
                assessment.pageHeading = solutionDocument.pageHeading;

                let criteriaId = new Array;
                let criteriaObject = {};
                let criteriaIdArray = gen.utils.getCriteriaIdsAndWeightage(solutionDocument.themes);

                criteriaIdArray.forEach(eachCriteriaId => {
                    criteriaId.push(eachCriteriaId.criteriaId);
                    criteriaObject[eachCriteriaId.criteriaId.toString()] = {
                        weightage: eachCriteriaId.weightage
                    };
                })

                let criteriaQuestionDocument = await database.models.criteriaQuestions.find(
                    { _id: { $in: criteriaId } },
                    {
                        resourceType: 0,
                        language: 0,
                        keywords: 0,
                        concepts: 0,
                        createdFor: 0
                    }
                ).lean();

                let evidenceMethodArray = {};
                let submissionDocumentEvidences = {};
                let submissionDocumentCriterias = [];

                Object.keys(solutionDocument.evidenceMethods).forEach(solutionEcm => {
                    if(!(solutionDocument.evidenceMethods[solutionEcm].isActive === false)) {
                        solutionDocument.evidenceMethods[solutionEcm].startTime = "";
                        solutionDocument.evidenceMethods[solutionEcm].endTime = "";
                        solutionDocument.evidenceMethods[solutionEcm].isSubmitted = false;
                        solutionDocument.evidenceMethods[solutionEcm].submissions = new Array;
                    } else {
                        delete solutionDocument.evidenceMethods[solutionEcm];
                    }
                })
                submissionDocumentEvidences = solutionDocument.evidenceMethods;

                criteriaQuestionDocument.forEach(criteria => {

                    criteria.weightage = criteriaObject[criteria._id.toString()].weightage;

                    submissionDocumentCriterias.push(
                        _.omit(criteria, [
                            "evidences"
                        ])
                    );

                    criteria.evidences.forEach(evidenceMethod => {

                        if (submissionDocumentEvidences[evidenceMethod.code] && submissionDocumentEvidences[evidenceMethod.code].modeOfCollection === isRequestForOncallOrOnField) {

                            if (!evidenceMethodArray[evidenceMethod.code]) {

                                evidenceMethod.sections.forEach(ecmSection => {
                                    ecmSection.name = solutionDocument.sections[ecmSection.code];
                                })
                                _.merge(evidenceMethod, submissionDocumentEvidences[evidenceMethod.code]);
                                evidenceMethodArray[evidenceMethod.code] = evidenceMethod;

                            } else {

                                // Evidence method already exists
                                // Loop through all sections reading evidence method

                                evidenceMethod.sections.forEach(evidenceMethodSection => {

                                    let sectionExisitsInEvidenceMethod = 0;
                                    let existingSectionQuestionsArrayInEvidenceMethod = [];

                                    evidenceMethodArray[evidenceMethod.code].sections.forEach(exisitingSectionInEvidenceMethod => {

                                        if (exisitingSectionInEvidenceMethod.code == evidenceMethodSection.code) {
                                            sectionExisitsInEvidenceMethod = 1;
                                            existingSectionQuestionsArrayInEvidenceMethod = exisitingSectionInEvidenceMethod.questions;
                                        }

                                    });

                                    if (!sectionExisitsInEvidenceMethod) {
                                        evidenceMethodSection.name = solutionDocument.sections[evidenceMethodSection.code];
                                        evidenceMethodArray[evidenceMethod.code].sections.push(evidenceMethodSection);
                                    } else {
                                        evidenceMethodSection.questions.forEach(questionInEvidenceMethodSection => {
                                            existingSectionQuestionsArrayInEvidenceMethod.push(
                                                questionInEvidenceMethodSection
                                            );
                                        });
                                    }

                                });

                            }

                        }

                    });

                });

                submissionDocument.evidences = submissionDocumentEvidences;
                submissionDocument.evidencesStatus = Object.values(submissionDocumentEvidences);
                submissionDocument.criteria = submissionDocumentCriterias;

                let submissionNumber = 
                req.query.submissionNumber ? parseInt(req.query.submissionNumber) : 1;

                submissionDocument.submissionNumber = submissionNumber;

                let submissionDoc = await submissionsHelper.findSubmissionByEntityProgram(
                    submissionDocument,
                    req.headers['user-agent'],
                    req.userDetails.userId
                );
                
                assessment.submissionId = submissionDoc.result._id;

                if( req.query.ecmMethod && req.query.ecmMethod !== "" ) {
                    if( evidenceMethodArray[req.query.ecmMethod] ) {
                        evidenceMethodArray = {
                            [req.query.ecmMethod] : evidenceMethodArray[req.query.ecmMethod]
                        };
                    }
                }

                if (isRequestForOncallOrOnField == "oncall" && submissionDoc.result.parentInterviewResponses && submissionDoc.result.parentInterviewResponses.length > 0) {
                    assessment.parentInterviewResponses = submissionDoc.result.parentInterviewResponses;
                }

                const parsedAssessment = await assessmentsHelper.parseQuestionsV2(
                    Object.values(evidenceMethodArray),
                    entityDocumentQuestionGroup,
                    submissionDoc.result.evidences,
                    (solutionDocument && solutionDocument.questionSequenceByEcm) ? solutionDocument.questionSequenceByEcm : false,
                    entityDocument.metaInformation
                );

                assessment.evidences = parsedAssessment.evidences;
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

}
