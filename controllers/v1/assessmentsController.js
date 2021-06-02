/**
 * name : assessments.js
 * author : Akash
 * created-date : 22-Nov-2018
 * Description : Institutional Assessments.
 */


// Dependencies.
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
     * @apiDefine errorBody
     * @apiError {String} status 4XX,5XX
     * @apiError {String} message Error
     */

    /**
     * @apiDefine successBody
     *  @apiSuccess {String} status 200
     * @apiSuccess {String} result Data
     */

    /**
    * @api {get} /assessment/api/v1/assessments/details/{programID}?solutionId={solutionId}&entityId={entityId}&submissionNumber=submissionNumber&ecmMethod=ecmMethod Detailed assessments
    * @apiVersion 1.0.0
    * @apiName Assessment details
    * @apiGroup Assessments
    * @apiParam {String} solutionId Solution ID.
    * @apiParam {String} entityId Entity ID.
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/assessments/details/5c56942d28466d82967b9479?solutionId=5c5693fd28466d82967b9429&entityId=5c5694be52600a1ce8d24dc7&submissionNumber=1&ecmMethod=OB
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
       {
         "code": "AC5",
            "sections": [
            {
                "code": "DF",
                "questions": [
                    {
                    "_id": "5be8ec282d325f5b71da4e0d",
                    "question": [
                        "Student Name",
                        ""
                    ],
                    "options": [],
                    "children": [],
                    "questionGroup": [
                     "A1"
                    ],
                    "fileName": [],
                    "instanceQuestions": [],
                    "deleted": false,
                    "tip": "",
                    "externalId": "AS/TL/05a",
                    "visibleIf": "",
                    "file": "",
                    "responseType": "text",
                    "validation": {
                     "required": true
                    },
                    "showRemarks": false,
                    "isCompleted": false,
                    "remarks": "",
                    "value": "",
                    "canBeNotApplicable": "false",
                    "usedForScoring": "",
                    "modeOfCollection": "onfield",
                    "questionType": "auto",
                    "accessibility": "local",
                    "updatedAt": "2018-11-12T02:57:44.843Z",
                    "createdAt": "2018-11-12T02:57:44.843Z",
                    "__v": 0,
                    "evidenceMethod": "AC5",
                    "payload": {
                        "criteriaId": "5be8e3b42d325f5b71da4e00",
                        "responseType": "text",
                        "evidenceMethod": "AC5",
                        "rubricLevel": ""
                    },
                    "startTime": "",
                    "endTime": ""
                    }
                    ],
                    "externalId": "AC5",
                    "tip": "Some tip at evidence level.",
                    "name": "Assessment- Class 5",
                    "description": "Some description about evidence",
                    "modeOfCollection": "onfield",
                    "canBeNotApplicable": true,
                    "notApplicable": false,
                    "canBeNotAllowed": true,
                    "remarks": "",
                    "startTime": "",
                    "endTime": "",
                    "isSubmitted": false,
                    "submissions": []
                }
    */

     /**
      * Assessment details.
      * @method
      * @name details
      * @param {Object} req - request data. 
      * @param {String} req.params._id - program id.
      * @param {String} req.query.solutionId - solution id.
      * @param {String} req.query.entityId - entity id.
      * @param {String} req.query.submissionNumber - submission number.
      * @param {String} req.userDetails.userId -logged in user id.
      * @returns {JSON} returns assessment details response.
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

                let solutionDocumentProjectionFields = await assessmentsHelper.solutionDocumentProjectionFieldsForDetailsAPI()

                let solutionDocument = await database.models.solutions.findOne(
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
                    isAPrivateProgram : programDocument.isAPrivateProgram, 
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

                if( solutionDocument.referenceFrom === messageConstants.common.PROJECT) {
                    
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
                                    ecmSection.name = solutionDocument.sections[ecmSection.code]
                                });
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

                const parsedAssessment = await assessmentsHelper.parseQuestions(
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

     /**
    * @api {get} /assessment/api/v1/assessments/metaForm/:solutionId Assessment Solution Meta Form
    * @apiVersion 1.0.0
    * @apiName Assessment Solution Meta Form
    * @apiGroup Assessments
    * @apiHeader {String} X-authenticated-user-token Authenticity token
    * @apiSampleRequest /assessment/api/v1/assessments/metaForm/5ed5ec4dd2afa80d0f616460
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * "result": [
        {
            "field": "name",
            "label": "Title",
            "value": "",
            "visible": true,
            "editable": true,
            "validation": {
                "required": true
            },
            "input": "text"
        },{
            "field": "description",
            "label": "Description",
            "value": "",
            "visible": true,
            "editable": true,
            "input": "text",
            "validation": {
                "required": true
            },
            "min": "",
            "max": ""
        }
    ]
    */

     /**
   * Assessment meta form.
   * @method
   * @name metaForm
   * @param {Object} req -request Data.
   * @returns {JSON} - Assessment meta form.
   */

   async metaForm(req) {

    return new Promise(async (resolve, reject) => {

        try {

            let assessmentForm = 
            await assessmentsHelper.metaForm(
                req.params._id
            );

            return resolve(assessmentForm);

        } catch (error) {
            return reject({
                status: error.status || httpStatusCode.internal_server_error.status,
                message: error.message || httpStatusCode.internal_server_error.message,
                errorObject: error
            });
        }
    });
   }

   /**
     * @api {post} /assessment/api/v1/assessments/create?solutionId=solutionId Create assessment solution
     * @apiVersion 1.0.0
     * @apiName Create assessment solution
     * @apiGroup Assessments
     * @apiParamExample {json} Request-Body:
     *  {
     * "name" : "My Solution",
     * "description" : "My Solution Description",
     * "program" : {
     * "_id" : "",
     * "name" : "My program"
     * },
     * "entities" : ["5bfe53ea1d0c350d61b78d0a"]
     * }
     * @apiSampleRequest /assessment/api/v1/assessments/create?solutionId=5ed5ec4dd2afa80d0f616460
     * @apiUse successBody
     * @apiUse errorBody
     * @apiParamExample {json} Response:
     * {
    "message": "Successfully created solution",
    "status": 200,
    "result": {
        "_id": "5edf857ed56fc75d57d50a6c",
        "externalId": "EF-DCPCR-2018-001-TEMPLATE-1591707006669",
        "frameworkExternalId": "EF-DCPCR-2018-001",
        "frameworkId": "5d15adc5fad01368a494cbd6",
        "programExternalId": "My program-1591707006618",
        "programId": "5edf857ed56fc75d57d50a6b",
        "entityTypeId": "5d15a959e9185967a6d5e8a6",
        "entityType": "school",
        "isAPrivateProgram" : true
    }
     }
     */
     
    /**
    * Create solution from Assessment template
    * @method
    * @name create
    * @param {Object} req -request Data.
    * @returns {JSON} - Create solution from Assessment template
    */

   async create(req) {
    return new Promise(async (resolve, reject) => {

        try {

            let solutionData = 
            await assessmentsHelper.create(
              req.query.solutionId,
              req.userDetails,
              req.body
            );

            return resolve(solutionData);

        } catch (error) {

            return reject({
                status: error.status || httpStatusCode.internal_server_error.status,
                message: error.message || httpStatusCode.internal_server_error.message,
                errorObject: error
            });
        }
    })
   }

}
