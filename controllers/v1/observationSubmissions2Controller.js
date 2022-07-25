// Dependencies

const observationsHelper = require(MODULES_BASE_PATH + "/observations/helper");
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const entitiesHelper = require(MODULES_BASE_PATH + "/entities/helper");
const submissionsHelper = require(MODULES_BASE_PATH + "/submissions/helper");
const criteriaHelper = require(MODULES_BASE_PATH + "/criteria/helper");
const questionsHelper = require(MODULES_BASE_PATH + "/questions/helper");
const observationSubmissionsHelper = require(MODULES_BASE_PATH +
  "/observationSubmissions/helper");
const scoringHelper = require(MODULES_BASE_PATH + "/scoring/helper");
const transFormationHelper = require(MODULES_BASE_PATH +
  "/transformation/helper");
const redis = require("./../../config/redisConfig");

const cache = redis.client;

/**
 * ObservationSubmissions
 * @class
 */
module.exports = class ObservationSubmissions extends Abstract {
  constructor() {
    super(observationSubmissionsSchema);
  }

  static get name() {
    return "observationSubmissions";
  }

  /**
   * create observation submissions.
   * @method
   * @name create
   * @param {Object} req -request data.
   * @param {String} req.params._id -observation solution id.
   * @param {String} req.query.entityId -entity id.
   * @param {String} req.userDetails.userId - logged in user id.
   * @param {String} req.userDetails.userToken - logged in user token.
   * @returns {JSON} - observation submissions creation.
   */

  async create(req) {
    return new Promise(async (resolve, reject) => {
      try {
        const cacheData = await cache
          .get(`submissionCreate:${req.params._id}:${req.params.entityId}`)
          .catch((err) => {
            console.log("error", err);
          });

        if (cacheData) {
          console.log("cahcehData", cacheData);
          return resolve(JSON.parse(cacheData));
        } else {
          let observationDocument =
            await observationsHelper.observationDocuments({
              _id: req.params._id,
              createdBy: req.userDetails.userId,
              status: {$ne:"inactive"},
              entities: ObjectId(req.query.entityId),
            });

          if (!observationDocument[0]) {
            return resolve({
              status: httpStatusCode.bad_request.status,
              message: messageConstants.apiResponses.OBSERVATION_NOT_FOUND,
            });
          }

          observationDocument = observationDocument[0];

          let entityDocument = await entitiesHelper.entityDocuments(
            {
              _id: req.query.entityId,
              entityType: observationDocument.entityType,
            },
            ["metaInformation", "entityTypeId", "entityType", "registryDetails"]
          );

          if (!entityDocument[0]) {
            return resolve({
              status: httpStatusCode.bad_request.status,
              message: messageConstants.apiResponses.ENTITY_NOT_FOUND,
            });
          }

          entityDocument = entityDocument[0];

          if (
            entityDocument.registryDetails &&
            Object.keys(entityDocument.registryDetails).length > 0
          ) {
            entityDocument.metaInformation.registryDetails =
              entityDocument.registryDetails;
          }

          let solutionDocument = await solutionsHelper.solutionDocuments(
            {
              _id: observationDocument.solutionId,
              status: "active",
            },
            [
              "externalId",
              "themes",
              "frameworkId",
              "frameworkExternalId",
              "evidenceMethods",
              "entityTypeId",
              "entityType",
              "programId",
              "programExternalId",
              "isAPrivateProgram",
              "scoringSystem",
              "isRubricDriven",
              "project",
              "referenceFrom",
              "criteriaLevelReport",
              "migratedId",
              "type",
            ]
          );

          if (!solutionDocument[0]) {
            return resolve({
              status: httpStatusCode.bad_request.status,
              message: messageConstants.apiResponses.SOLUTION_NOT_FOUND,
            });
          }

          solutionDocument = solutionDocument[0];

          const migratedId = solutionDocument?.migratedId;

          console.log("migrated", migratedId);

          let entityProfileForm = await database.models.entityTypes
            .findOne(solutionDocument.entityTypeId, {
              profileForm: 1,
            })
            .lean();

          if (!entityProfileForm) {
            return resolve({
              status: httpStatusCode.bad_request.status,
              message:
                messageConstants.apiResponses.ENTITY_PROFILE_FORM_NOT_FOUND,
            });
          }

          let lastSubmissionNumber = 0;

          const lastSubmissionForObservationEntity =
            await observationsHelper.findLastSubmissionForObservationEntity(
              req.params._id,
              req.query.entityId
            );

          if (!lastSubmissionForObservationEntity.success) {
            throw new Error(lastSubmissionForObservationEntity.message);
          }

          lastSubmissionNumber = lastSubmissionForObservationEntity.result + 1;

          let submissionDocument = {
            entityId: entityDocument._id,
            entityExternalId: entityDocument.metaInformation.externalId
              ? entityDocument.metaInformation.externalId
              : "",
            entityInformation: entityDocument.metaInformation,
            solutionId: solutionDocument._id,
            solutionExternalId: solutionDocument.externalId,
            programId: solutionDocument.programId,
            programExternalId: solutionDocument.programExternalId,
            isAPrivateProgram: solutionDocument.isAPrivateProgram,
            frameworkId: solutionDocument.frameworkId,
            frameworkExternalId: solutionDocument.frameworkExternalId,
            entityTypeId: solutionDocument.entityTypeId,
            entityType: solutionDocument.entityType,
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
            scoringSystem: solutionDocument.scoringSystem,
            isRubricDriven: solutionDocument.isRubricDriven,
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

          let submissionDocumentEvidences = {};
          let submissionDocumentCriterias = [];
          Object.keys(solutionDocument.evidenceMethods).forEach(
            (solutionEcm) => {
              if (
                !(
                  solutionDocument.evidenceMethods[solutionEcm].isActive ===
                  false
                )
              ) {
                solutionDocument.evidenceMethods[solutionEcm].startTime = "";
                solutionDocument.evidenceMethods[solutionEcm].endTime = "";
                solutionDocument.evidenceMethods[
                  solutionEcm
                ].isSubmitted = false;
                solutionDocument.evidenceMethods[solutionEcm].submissions =
                  new Array();
              } else {
                delete solutionDocument.evidenceMethods[solutionEcm];
              }
            }
          );
          submissionDocumentEvidences = solutionDocument.evidenceMethods;

          let evidences = {};
          if (!!migratedId) {
            evidences = await transFormationHelper.getQuestionSetHierarchy(
              migratedId,
              submissionDocumentCriterias,
              solutionDocument,
              false
            );
          }

          submissionDocument.evidences = submissionDocumentEvidences;
          submissionDocument.evidencesStatus = Object.values(
            submissionDocumentEvidences
          );
          submissionDocument.criteria =
            evidences.submissionDocumentCriterias || {};
          console.log(
            "observationSubmissions2",
            JSON.stringify(evidences.submissionDocumentCriterias)
          );
          submissionDocument.submissionNumber = lastSubmissionNumber;

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

          let newObservationSubmissionDocument =
            await database.models.observationSubmissions.create(
              submissionDocument
            );

          if (
            newObservationSubmissionDocument.referenceFrom ===
            messageConstants.common.PROJECT
          ) {
            await observationSubmissionsHelper.pushSubmissionToImprovementService(
              _.pick(newObservationSubmissionDocument, [
                "project",
                "status",
                "_id",
              ])
            );
          }

          // Push new observation submission to kafka for reporting/tracking.
          observationSubmissionsHelper.pushObservationSubmissionForReporting(
            newObservationSubmissionDocument._id
          );

          let observations = new Array();

          observations = await observationsHelper.listV2(
            req.userDetails.userId
          );

          let responseMessage =
            messageConstants.apiResponses.OBSERVATION_SUBMISSION_CREATED;
          await cache.setEx(
            `submissionCreate:${req.params._id}:${req.params.entityId}`,
            redis.expiry,
            JSON.stringify({
              message: responseMessage,
              result: observations,
            })
          );

          return resolve({
            message: responseMessage,
            result: observations,
          });
        }
      } catch (error) {
        return reject({
          status: error.status || httpStatusCode.internal_server_error.status,
          message:
            error.message || httpStatusCode.internal_server_error.message,
          errorObject: error,
        });
      }
    });
  }
};
