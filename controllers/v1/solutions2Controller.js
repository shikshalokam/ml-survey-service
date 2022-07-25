// Dependencies
const csv = require("csvtojson");
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const criteriaHelper = require(MODULES_BASE_PATH + "/criteria/helper");
const questionsHelper = require(MODULES_BASE_PATH + "/questions/helper");
const FileStream = require(ROOT_PATH + "/generics/fileStream");
const observationsHelper = require(MODULES_BASE_PATH + "/observations/helper");
const assessmentsHelper = require(MODULES_BASE_PATH + "/assessments/helper");
const transFormationHelper = require(MODULES_BASE_PATH +
  "/transformation/helper");

const redis = require("./../../config/redisConfig");

const cache = redis.client;

/**
 * Solutions
 * @class
 */
module.exports = class Solutions2 extends Abstract {
  constructor() {
    super(solutionsSchema);
  }

  static get name() {
    return "solutions";
  }

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
        const cacheData = await cache
          .get(`solutionQuestions:${req.params._id}`)
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

          let solutionId = req.params._id;
          let userId = req.userDetails.userId;

          if (userId == "") {
            throw new Error(
              messageConstants.apiResponses.USER_ID_REQUIRED_CHECK
            );
          }

          let solutionDocumentProjectionFields =
            await observationsHelper.solutionDocumentProjectionFieldsForDetailsAPI();

          let solutionDocument = await database.models.solutions
            .findOne(
              { _id: solutionId },
              { ...solutionDocumentProjectionFields, migratedId: 1, type: 1 }
            )
            .lean();

          if (!solutionDocument) {
            return resolve({
              status: httpStatusCode.bad_request.status,
              message: messageConstants.apiResponses.SOLUTION_NOT_FOUND,
            });
          }

          const migratedId = solutionDocument?.migratedId;

          let solutionDocumentFieldList =
            await observationsHelper.solutionDocumentFieldListInResponse();

          response.result.solution = await _.pick(
            solutionDocument,
            solutionDocumentFieldList
          );

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
          if (!!migratedId) {
            console.log("migrattetemigrattetemigrattete", migratedId);
            response.result.solution._id = migratedId;
            evidences = await transFormationHelper.getQuestionSetHierarchy(
              migratedId,
              submissionDocumentCriterias,
              solutionDocument
            );
          }

          let entityDocument = {
            metaInformation: {},
            questionGroup: "",
          };

          let entityDocumentQuestionGroup = entityDocument.metaInformation
            .questionGroup
            ? entityDocument.metaInformation.questionGroup
            : ["A1"];
          assessment.evidences = [];
          const parsedAssessment = await assessmentsHelper.parseQuestionsV2(
            Object.values(evidenceMethodArray),
            entityDocumentQuestionGroup,
            submissionDocumentEvidences,
            solutionDocument && solutionDocument.questionSequenceByEcm
              ? solutionDocument.questionSequenceByEcm
              : false,
            {}
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
            `solutionQuestions:${req.params._id}`,
            redis.expiry,
            JSON.stringify(response)
          );
          return resolve(response);
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
