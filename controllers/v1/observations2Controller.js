const observationsHelper = require(MODULES_BASE_PATH + "/observations/helper");
const assessmentsHelper = require(MODULES_BASE_PATH + "/assessments/helper");
const programsHelper = require(MODULES_BASE_PATH + "/programs/helper");
const transFormationHelper = require(MODULES_BASE_PATH +
  "/transformation/helper");

const redis = require("./../../config/redisConfig");

const cache = redis.client;

// obId : 60128960f5c000702022546f?entityId=5fd098e2e049735a86b748b7
// obId : 60110e692d0bbd2f0c3229c3?entityId=5fd098e2e049735a86b748b0

module.exports = class Observations2 extends Abstract {
  constructor() {
    super(observationsSchema);
  }

  async assessment(req) {
    return new Promise(async (resolve, reject) => {
      try {
        const cacheData = await cache
          .get(`assessment:${req.params._id}:${req.params.entityId}`)
          .catch((err) => {
            console.log("error", err);
          });

        if (cacheData) {
          console.log("cahcehData", cacheData);
          return resolve(JSON.parse(cacheData));
        } else {
          let response = {
            message: messageConstants.apiResponses.ASSESSMENT_FETCHED,
            result: {},
          };

          let observationDocument = await database.models.observations
            .findOne({
              _id: req.params._id,
              createdBy: req.userDetails.userId,
              status: { $ne: "inactive" },
              entities: ObjectId(req.query.entityId),
            })
            .lean();

          if (!observationDocument) {
            return resolve({
              status: httpStatusCode.bad_request.status,
              message: messageConstants.apiResponses.OBSERVATION_NOT_FOUND,
            });
          }

          let entityQueryObject = {
            _id: req.query.entityId,
            entityType: observationDocument.entityType,
          };
          let entityDocument = await database.models.entities
            .findOne(entityQueryObject, {
              metaInformation: 1,
              entityTypeId: 1,
              entityType: 1,
              registryDetails: 1,
            })
            .lean();

          if (!entityDocument) {
            let responseMessage =
              messageConstants.apiResponses.ENTITY_NOT_FOUND;
            return resolve({
              status: httpStatusCode.bad_request.status,
              message: responseMessage,
            });
          }

          if (
            entityDocument.registryDetails &&
            Object.keys(entityDocument.registryDetails).length > 0
          ) {
            entityDocument.metaInformation.registryDetails =
              entityDocument.registryDetails;
          }

          const submissionNumber =
            req.query.submissionNumber && req.query.submissionNumber > 1
              ? parseInt(req.query.submissionNumber)
              : 1;

          let solutionQueryObject = {
            _id: observationDocument.solutionId,
            status: "active",
          };

          let solutionDocumentProjectionFields =
            await observationsHelper.solutionDocumentProjectionFieldsForDetailsAPI();

          let solutionDocument = await database.models.solutions
            .findOne(solutionQueryObject, {
              ...solutionDocumentProjectionFields,
              migratedId: 1,
              type: 1,
            })
            .lean();

          if (!solutionDocument) {
            let responseMessage =
              messageConstants.apiResponses.SOLUTION_NOT_FOUND;
            return resolve({
              status: httpStatusCode.bad_request.status,
              message: responseMessage,
            });
          }

          const migratedId = solutionDocument?.migratedId;
          console.log("migratedIdmigratedIdmigratedId", migratedId);

          if (req.query.ecmMethod && req.query.ecmMethod !== "") {
            if (!solutionDocument.evidenceMethods[req.query.ecmMethod]) {
              return resolve({
                status: httpStatusCode.bad_request.status,
                message: messageConstants.apiResponses.ECM_NOT_EXIST,
              });
            }
          }

          let programQueryObject = {
            _id: observationDocument.programId,
            status: "active",
            components: { $in: [ObjectId(observationDocument.solutionId)] },
          };

          let programDocument = await programsHelper.list(programQueryObject, [
            "externalId",
            "name",
            "description",
            "imageCompression",
            "isAPrivateProgram",
          ]);

          if (!programDocument[0]._id) {
            throw messageConstants.apiResponses.PROGRAM_NOT_FOUND;
          }
          let entityDocumentQuestionGroup = entityDocument.metaInformation
            .questionGroup
            ? entityDocument.metaInformation.questionGroup
            : ["A1"];

          response.result.entityProfile = {
            _id: entityDocument._id,
            entityTypeId: entityDocument.entityTypeId,
            entityType: entityDocument.entityType,
            // form: form
          };

          let solutionDocumentFieldList =
            await observationsHelper.solutionDocumentFieldListInResponse();

          response.result.solution = await _.pick(
            solutionDocument,
            solutionDocumentFieldList
          );
          response.result.program = programDocument[0];

          let submissionDocument = {
            entityId: entityDocument._id,
            entityExternalId: entityDocument.metaInformation.externalId
              ? entityDocument.metaInformation.externalId
              : "",
            entityInformation: entityDocument.metaInformation,
            solutionId: solutionDocument._id,
            solutionExternalId: solutionDocument.externalId,
            programId: programDocument[0]._id,
            programExternalId: programDocument[0].externalId,
            isAPrivateProgram: programDocument[0].isAPrivateProgram,
            programInformation: {
              ..._.omit(programDocument[0], [
                "_id",
                "components",
                "isAPrivateProgram",
              ]),
            },
            frameworkId: solutionDocument.frameworkId,
            frameworkExternalId: solutionDocument.frameworkExternalId,
            entityTypeId: solutionDocument.entityTypeId,
            entityType: solutionDocument.entityType,
            scoringSystem: solutionDocument.scoringSystem,
            isRubricDriven: solutionDocument.isRubricDriven,
            observationId: observationDocument._id,
            observationInformation: {
              ..._.omit(observationDocument, [
                "_id",
                "entities",
                "deleted",
                "__v",
              ]),
            },
            createdBy: observationDocument.createdBy,
            evidenceSubmissions: [],
            entityProfile: {},
            status: "started",
            userProfile: observationDocument.userProfile,
          };

          if (solutionDocument.hasOwnProperty("criteriaLevelReport")) {
            submissionDocument["criteriaLevelReport"] =
              solutionDocument["criteriaLevelReport"];
          }

          if (
            observationDocument.userRoleInformation &&
            Object.keys(observationDocument.userRoleInformation).length > 0
          ) {
            submissionDocument.userRoleInformation =
              observationDocument.userRoleInformation;
          } else if (
            req.body &&
            req.body.role &&
            !observationDocument.userRoleInformation
          ) {
            submissionDocument.userRoleInformation = req.body;
            let updateObservation =
              await observationsHelper.updateObservationDocument(
                { _id: req.params._id },
                {
                  $set: { userRoleInformation: req.body },
                }
              );
          }

          if (
            solutionDocument.referenceFrom === messageConstants.common.PROJECT
          ) {
            submissionDocument["referenceFrom"] =
              messageConstants.common.PROJECT;
            submissionDocument["project"] = solutionDocument.project;
          }

          let assessment = {};

          assessment.name = solutionDocument.name;
          assessment.description = solutionDocument.description;
          assessment.externalId = solutionDocument.externalId;
          assessment.pageHeading = solutionDocument.pageHeading;

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
          if (!!migratedId) {
            console.log("migrattetemigrattetemigrattete", migratedId);
            response.result.solution._id = migratedId;
            evidences = await transFormationHelper.getQuestionSetHierarchy(
              migratedId,
              submissionDocumentCriterias,
              solutionDocument
            );
          }

          submissionDocument.evidences = submissionDocumentEvidences;
          submissionDocument.evidencesStatus = Object.values(
            submissionDocumentEvidences
          );
          submissionDocument.criteria =
            evidences.submissionDocumentCriterias || {};
          submissionDocument.submissionNumber = submissionNumber;

          submissionDocument["appInformation"] = {};

          if (req.headers["x-app-id"] || req.headers.appname) {
            submissionDocument["appInformation"]["appName"] = req.headers[
              "x-app-id"
            ]
              ? req.headers["x-app-id"]
              : req.headers.appname;
          }

          if (req.headers["x-app-ver"] || req.headers.appversion) {
            submissionDocument["appInformation"]["appVersion"] = req.headers[
              "x-app-ver"
            ]
              ? req.headers["x-app-ver"]
              : req.headers.appversion;
          }

          let submissionDoc = await observationsHelper.findSubmission(
            submissionDocument
          );

          assessment.submissionId = submissionDoc.result._id;

          if (req.query.ecmMethod && req.query.ecmMethod !== "") {
            if (evidenceMethodArray[req.query.ecmMethod]) {
              evidenceMethodArray = {
                [req.query.ecmMethod]: evidenceMethodArray[req.query.ecmMethod],
              };
            }
          }


          const parsedAssessment = await assessmentsHelper.parseQuestionsV2(
            Object.values(evidenceMethodArray),
            entityDocumentQuestionGroup,
            submissionDoc.result.evidences,
            solutionDocument && solutionDocument.questionSequenceByEcm
              ? solutionDocument.questionSequenceByEcm
              : false,
            entityDocument.metaInformation
          );


          assessment.evidences = evidences.evidences;
          assessment.submissions = parsedAssessment.submissions;
          if (
            parsedAssessment.generalQuestions &&
            parsedAssessment.generalQuestions.length > 0
          ) {
            assessment.generalQuestions = parsedAssessment.generalQuestions;
          }

          response.result.assessment = assessment;

          await cache.setEx(
            `assessment:${req.params._id}:${req.params.entityId}`,
            redis.expiry,
            JSON.stringify(response)
          );

          return resolve(response);
        }
      } catch (error) {
        console.log("errororooro", error);
        return reject({
          status: error?.status || httpStatusCode.internal_server_error.status,
          message:
            error?.message || httpStatusCode.internal_server_error.message,
          errorObject: error,
        });
      }
    });
  }
};
