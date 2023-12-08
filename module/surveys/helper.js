/**
 * name : surveys/helper.js
 * author : Deepa
 * created-date : 07-Spe-2020
 * Description : Surveys helper functionality.
 */

// Dependencies
const programsHelper = require(MODULES_BASE_PATH + "/programs/helper");
const solutionsHelper = require(MODULES_BASE_PATH + "/solutions/helper");
const criteriaHelper = require(MODULES_BASE_PATH + "/criteria/helper");
const kafkaClient = require(ROOT_PATH +
  "/generics/helpers/kafkaCommunications");
const assessmentsHelper = require(MODULES_BASE_PATH + "/assessments/helper");
const surveySubmissionsHelper = require(MODULES_BASE_PATH +
  "/surveySubmissions/helper");
const appsPortalBaseUrl =
  process.env.APP_PORTAL_BASE_URL && process.env.APP_PORTAL_BASE_URL !== ""
    ? process.env.APP_PORTAL_BASE_URL + "/"
    : "https://apps.shikshalokam.org/";
const criteriaQuestionsHelper = require(MODULES_BASE_PATH +
  "/criteriaQuestions/helper");
const coreService = require(ROOT_PATH + "/generics/services/core");
const surveySolutionTemplate = "-SURVEY-TEMPLATE";
const surveyAndFeedback = "SF";
const questionsHelper = require(MODULES_BASE_PATH + "/questions/helper");
const userProfileService = require(ROOT_PATH + "/generics/services/users");
const programUsersHelper = require(MODULES_BASE_PATH + "/programUsers/helper");
const programJoinEnabled = process.env.PROGRAM_JOIN_ON_OFF
/**
 * SurveysHelper
 * @class
 */
module.exports = class SurveysHelper {
  /**
   * find surveys
   * @method
   * @name surveyDocuments
   * @param {Array} [surveyFilter = "all"] - survey ids.
   * @param {Array} [fieldsArray = "all"] - projected fields.
   * @param {Array} [sortedData = "all"] - sorted field.
   * @param {Array} [skipFields = "none"] - field not to include
   * @returns {Array} List of surveys.
   */

  static surveyDocuments(
    surveyFilter = "all",
    fieldsArray = "all",
    sortedData = "all",
    skipFields = "none"
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        let queryObject = surveyFilter != "all" ? surveyFilter : {};

        let projection = {};

        if (fieldsArray != "all") {
          fieldsArray.forEach((field) => {
            projection[field] = 1;
          });
        }

        if (skipFields !== "none") {
          skipFields.forEach((field) => {
            projection[field] = 0;
          });
        }

        let surveyDocuments;

        if (sortedData !== "all") {
          surveyDocuments = await database.models.surveys
            .find(queryObject, projection)
            .sort(sortedData)
            .lean();
        } else {
          surveyDocuments = await database.models.surveys
            .find(queryObject, projection)
            .lean();
        }

        return resolve(surveyDocuments);
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * Create survey.
   * @method create
   * @name create
   * @param {Object} data - survey creation data.
   * @returns {JSON} Survey creation data.
   */

  static create(data = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        let surveyData = await database.models.surveys.create(data);

        return resolve(surveyData);
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * Create survey solution template.
   * @method
   * @name createSolutionTemplate
   * @param {String} solutionData - survey solution details
   * @param {String} userId - logged in userId
   * @param {String} appName - name of the app
   * @returns {JSON} - solutionId.
   */

  static createSolutionTemplate(solutionData, userId = "") {
    return new Promise(async (resolve, reject) => {
      try {
        if (!solutionData.name) {
          throw new Error(messageConstants.apiResponses.SOLUTION_NAME_REQUIRED);
        }

        if (!solutionData.externalId) {
          throw new Error(
            messageConstants.apiResponses.SOLUTION_EXTERNAL_ID_REQUIRED
          );
        }

        if (!solutionData.description) {
          throw new Error(
            messageConstants.apiResponses.SOLUTION_DESCRIPTION_REQUIRED
          );
        }

        if (userId == "") {
          throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK);
        }

        let newSolutionDocument = {};
        newSolutionDocument.type = messageConstants.common.SURVEY;
        newSolutionDocument.subType = messageConstants.common.SURVEY;
        newSolutionDocument.name = solutionData.name;
        newSolutionDocument.externalId =
          solutionData.externalId + surveySolutionTemplate;
        newSolutionDocument.description = solutionData.description;
        newSolutionDocument.linkTitle = solutionData.linkTitle;
        newSolutionDocument.linkUrl = solutionData.linkUrl;
        newSolutionDocument.author = userId;
        newSolutionDocument.resourceType = ["Survey Solution"];
        newSolutionDocument.language = ["English"];
        newSolutionDocument.keywords = ["Survey"];
        newSolutionDocument.isReusable = true;
        newSolutionDocument.status = messageConstants.common.ACTIVE_STATUS;
        let date = new Date();
        newSolutionDocument.startDate = solutionData.startDate
          ? new Date(solutionData.startDate)
          : new Date();
        newSolutionDocument.endDate = solutionData.endDate
          ? new Date(solutionData.endDate)
          : date.setFullYear(date.getFullYear() + 1);

        newSolutionDocument.sections = { SQ: "Survey Questions" };
        newSolutionDocument.evidenceMethods = {
          SF: {
            externalId: surveyAndFeedback,
            name: "Survey And Feedback",
            description: "Survey And Feedback",
            modeOfCollection: "",
            canBeNotApplicable: false,
            notApplicable: false,
            canBeNotAllowed: false,
            remarks: "",
            isActive: true,
          },
        };

        let themes = [
          {
            type: "theme",
            label: "theme",
            externalId: surveyAndFeedback,
            name: "Survey and Feedback",
            weightage: 0,
          },
        ];

        let criteriaDocument = {
          name: "Survey and Feedback",
          description: "Survey and Feedback",
          externalId: newSolutionDocument.externalId + "-" + surveyAndFeedback,
          owner: userId,
          language: ["English"],
          keywords: ["Keyword 1", "Keyword 2"],
          frameworkCriteriaId: null,
        };

        let newCriteria = await criteriaHelper.create(criteriaDocument);

        if (newCriteria._id) {
          themes[0].criteria = [
            {
              criteriaId: newCriteria._id,
              weightage: 0,
            },
          ];
        }

        newSolutionDocument.themes = themes;

        let newSolution = await solutionsHelper.create(
          _.omit(newSolutionDocument, ["_id"])
        );

        if (newSolution._id) {
          return resolve({
            success: true,
            message: messageConstants.apiResponses.SURVEY_SOLUTION_CREATED,
            data: {
              solutionId: newSolution._id,
            },
          });
        } else {
          throw new Error(
            messageConstants.apiResponses.ERROR_CREATING_SURVEY_SOLUTION
          );
        }
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * Import survey template to solution.
   * @method
   * @name importSurveryTemplateToSolution
   * @param {String} solutionId - survey template solution id
   * @param {String} userId - logged in userId
   * @param {String} appName - name of the app
   * @returns {JSON} - sharable link.
   */

  static importSurveryTemplateToSolution(
    solutionId = "",
    userId = "",
    appName = ""
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        if (solutionId == "") {
          throw new Error(messageConstants.apiResponses.SOLUTION_ID_REQUIRED);
        }

        if (userId == "") {
          throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK);
        }

        if (appName == "") {
          throw new Error(
            messageConstants.apiResponses.APP_NAME_FIELD_REQUIRED
          );
        }

        let solutionDocument = await solutionsHelper.solutionDocuments({
          _id: solutionId,
        });

        if (!solutionDocument.length) {
          throw messageConstants.apiResponses.SOLUTION_NOT_FOUND;
        }

        let newSolutionDocument = solutionDocument[0];
        let solutionExternalId =
          solutionDocument[0].externalId.split(surveySolutionTemplate)[0] +
          "-" +
          gen.utils.epochTime();

        let criteriaId = await gen.utils.getCriteriaIds(
          newSolutionDocument.themes
        );

        let solutionCriteria = await criteriaHelper.criteriaDocument({
          _id: criteriaId[0],
        });

        solutionCriteria[0].externalId =
          solutionExternalId + "-" + surveyAndFeedback;

        let duplicateQuestionsResponse = await questionsHelper.duplicate([
          solutionCriteria[0]._id,
        ]);

        if (
          duplicateQuestionsResponse.success &&
          Object.keys(duplicateQuestionsResponse.data.questionIdMap).length > 0
        ) {
          solutionCriteria[0].evidences[0].sections[0].questions =
            Object.values(duplicateQuestionsResponse.data.questionIdMap);
        }

        let questionExternalIdMap = {};
        if (
          duplicateQuestionsResponse.success &&
          Object.keys(duplicateQuestionsResponse.data.questionExternalIdMap)
            .length > 0
        ) {
          questionExternalIdMap =
            duplicateQuestionsResponse.data.questionExternalIdMap;
        }

        if (
          newSolutionDocument["questionSequenceByEcm"] &&
          Object.keys(newSolutionDocument.questionSequenceByEcm).length > 0
        ) {
          Object.keys(newSolutionDocument.questionSequenceByEcm).map(
            (evidence) => {
              Object.keys(
                newSolutionDocument.questionSequenceByEcm[evidence]
              ).map((section) => {
                let questionExternalIds =
                  newSolutionDocument.questionSequenceByEcm[evidence][section];
                let newQuestionExternalIds = [];
                questionExternalIds.map((questionExternalId) => {
                  if (questionExternalIdMap[questionExternalId]) {
                    newQuestionExternalIds.push(
                      questionExternalIdMap[questionExternalId]
                    );
                  }
                });
                newSolutionDocument.questionSequenceByEcm[evidence][section] =
                  newQuestionExternalIds;
              });
            }
          );
        }

        solutionCriteria[0].parentCriteriaId = solutionCriteria[0]._id;

        let newCriteriaId = await criteriaHelper.create(
          _.omit(solutionCriteria[0], ["_id"])
        );

        if (newCriteriaId._id) {
          newSolutionDocument.themes[0].criteria = [
            {
              criteriaId: newCriteriaId._id,
              weightage: 0,
            },
          ];
        }

        await criteriaQuestionsHelper.createOrUpdate(newCriteriaId._id, true);

        newSolutionDocument.externalId = solutionExternalId;
        newSolutionDocument.isReusable = false;
        newSolutionDocument.parentSolutionId = solutionId;
        newSolutionDocument.createdAt = new Date();

        let newSolution = await solutionsHelper.create(
          _.omit(newSolutionDocument, ["_id"])
        );

        if (newSolution._id) {
          let link = await gen.utils.md5Hash(userId + "###" + newSolution._id);

          await solutionsHelper.updateSolutionDocument(
            { _id: newSolution._id },
            {
              $set: { link: link },
            }
          );
          //will not Validate App Name
          // let appDetails = await coreService.getAppDetails(appName);

          // if (appDetails.result == false) {
          //     throw new Error(messageConstants.apiResponses.APP_NOT_FOUND);
          // }

          return resolve({
            success: true,
            message: messageConstants.apiResponses.SURVEY_SOLUTION_IMPORTED,
            data: {
              solutionId: newSolution._id,
              solutionExternalId: newSolution.externalId,
              link:
                appsPortalBaseUrl +
                appName +
                messageConstants.common.TAKE_SURVEY +
                link,
            },
          });
        } else {
          throw new Error(
            messageConstants.apiResponses.ERROR_IMPORTING_SURVEY_SOLUTION
          );
        }
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * Map survey solution to program.
   * @method
   * @name mapSurverySolutionToProgram
   * @param {String} solutionId - survey solution id
   * @param {String} programId - programId
   * @returns {String} - message.
   */

  static mapSurverySolutionToProgram(solutionId = "", programId = "") {
    return new Promise(async (resolve, reject) => {
      try {
        if (solutionId == "") {
          throw new Error(messageConstants.apiResponses.SOLUTION_ID_REQUIRED);
        }

        if (programId == "") {
          throw new Error(messageConstants.apiResponses.PROGRAM_ID_REQUIRED);
        }

        let programDocument = await programsHelper.list(
          {
            externalId: programId,
          },
          ["externalId", "name", "description"]
        );

        if (!programDocument.length) {
          throw new Error(messageConstants.apiResponses.PROGRAM_NOT_FOUND);
        }

        let updateSolutionData = {};

        updateSolutionData.programId = programDocument[0]._id;
        updateSolutionData.programName = programDocument[0].name;
        updateSolutionData.programDescription = programDocument[0].description;
        updateSolutionData.programExternalId = programDocument[0].externalId;

        await solutionsHelper.updateSolutionDocument(
          { _id: solutionId },
          {
            $set: updateSolutionData,
          }
        );

        if (typeof solutionId == "string") {
          solutionId = ObjectId(solutionId);
        }

        await programsHelper.updateProgramDocument(
          {
            _id: programDocument[0]._id,
          },
          {
            $addToSet: { components: solutionId },
          }
        );

        return resolve({
          success: true,
          message: messageConstants.apiResponses.MAPPED_SOLUTION_TO_PROGRAM,
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * Bulk create survey.
   * @method
   * @name bulkCreate
   * @param {Object} solution - solution document.
   * @param {String} solution.externalId - solution external id.
   * @param {String} solution.name - solution name.
   * @param {String} solution.description - solution description.
   * @param {String} solution.type - solution type.
   * @param {String} solution._id - solution id.
   * @param {String} userId - logged in user id.
   * @param {Array} userOrganisations - User organisations
   * @returns {Object} status.
   */

  static bulkCreate(userId = "", solution = {}, userOrganisations = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        let surveyDocument = await this.createSurveyDocument(
          userId,
          solution,
          userOrganisations
        );

        if (surveyDocument.success && surveyDocument.data._id !== "") {
          await this.sendUserNotifications(userId, {
            solutionType: solution.type,
            solutionId: solution._id.toString(),
            surveyId: surveyDocument.data._id.toString(),
          });
        }

        return resolve({
          status: surveyDocument.data.status,
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * Create survey document.
   * @method
   * @name createSurveyDocument
   * @param {String} userId - logged in user id.
   * @param {Object} solution - solution document .
   * @returns {Object} status and survey id.
   */

  static createSurveyDocument(userId = "", solution = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        let status;
        let surveyId = "";
        let date = new Date();

        let surveyDocument = await this.surveyDocuments(
          {
            solutionExternalId: solution.externalId,
            createdBy: userId,
            isDeleted: false,
          },
          ["_id"]
        );

        if (surveyDocument.length > 0) {
          status = messageConstants.apiResponses.SURVEY_ALREADY_EXISTS;
        } else {
          let survey = {};

          survey["status"] = messageConstants.common.PUBLISHED;
          survey["deleted"] = false;
          survey["solutionId"] = solution._id;
          survey["solutionExternalId"] = solution.externalId;
          survey["createdBy"] = userId;
          survey["startDate"] = date;
          survey["endDate"] = solution.endDate
            ? solution.endDate
            : date.setFullYear(date.getFullYear() + 1);
          survey["name"] = solution.name;
          survey["description"] = solution.description;
          survey["isAPrivateProgram"] = solution.isAPrivateProgram;

          if (solution.programId) {
            survey["programId"] = solution.programId;
          }
          if (solution.programExternalId) {
            survey["programExternalId"] = solution.programExternalId;
          }

          surveyDocument = await this.create(survey);

          if (surveyDocument._id) {
            surveyId = surveyDocument._id;
          }

          surveyId
            ? (status = `${surveyId._id} created`)
            : (status = `${surveyId._id} could not be created`);
        }

        return resolve({
          success: true,
          data: {
            status: status,
            _id: surveyId,
          },
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * Send user notifications.
   * @method
   * @name sendUserNotifications
   * @param {Object} [surveyData = {}] - .
   * @param {String} [userId = ""] - logged in user id.
   * @returns {Object} message and success status.
   */

  static sendUserNotifications(userId = "", surveyData = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        if (userId == "") {
          throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK);
        }

        const kafkaMessage =
          await kafkaClient.pushUserMappingNotificationToKafka({
            user_id: userId,
            internal: false,
            text: `New survey is assigned to you`,
            type: "information",
            action: "mapping",
            payload: {
              type: surveyData.solutionType,
              solution_id: surveyData.solutionId,
              survey_id: surveyData.surveyId,
            },
            title: "New Survey",
            created_at: new Date(),
            appType: process.env.MOBILE_APPLICATION_APP_TYPE,
          });

        if (kafkaMessage.status != "success") {
          let errorObject = {
            formData: {
              userId: userId,
              message: `Failed to push notification for survey ${surveyData.surveyId.toString()} in the solution ${
                surveyData.solutionName
              }`,
            },
          };
          console.log(errorObject);
          throw new Error(
            `Failed to push notification for survey ${surveyData.surveyId.toString()} in the solution ${
              surveyData.solutionName
            }`
          );
        }

        return resolve({
          success: true,
          message: messageConstants.apiResponses.NOTIFICATION_PUSHED_TO_KAFKA,
          data: true,
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * Get survey details by link.
   * @method
   * @name getDetailsByLink
   * @param {String} link - link
   * @param {String} userId - userId
   * @param {String} token  - user access token
   * @param {Number} appVersion  - application version
   * @param {String} appName  - App name
   * @returns {JSON} - returns survey solution,program and question details.
   */

  static getDetailsByLink(
    link = "",
    userId = "",
    token = "",
    roleInformation = {},
    version = "",
    appVersion = "",
    appName = ""
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        if (link == "") {
          throw new Error(messageConstants.apiResponses.LINK_REQUIRED_CHECK);
        }

        if (userId == "") {
          throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK);
        }

        if (token == "") {
          throw new Error(
            messageConstants.apiResponses.REQUIRED_USER_AUTH_TOKEN
          );
        }

        let solutionDocument = await solutionsHelper.solutionDocuments(
          {
            link: link,
          },
          [
            "externalId",
            "name",
            "description",
            "type",
            "endDate",
            "status",
            "programId",
            "programExternalId",
            "isAPrivateProgram",
          ]
        );

        if (!solutionDocument.length) {
          throw new Error(messageConstants.apiResponses.SOLUTION_NOT_FOUND);
        }

        if (version === "") {
          if (new Date() > new Date(solutionDocument[0].endDate)) {
            if (
              solutionDocument[0].status ==
              messageConstants.common.ACTIVE_STATUS
            ) {
              await solutionsHelper.updateSolutionDocument(
                { link: link },
                { $set: { status: messageConstants.common.INACTIVE_STATUS } }
              );
            }

            throw new Error(messageConstants.apiResponses.LINK_IS_EXPIRED);
          }
        }

        let surveyDocument = await this.surveyDocuments(
          { solutionId: solutionDocument[0]._id, createdBy: userId },
          ["_id"]
        );

        let surveyId;

        if (surveyDocument.length > 0) {
          surveyId = surveyDocument[0]._id;
        } else {
          let createSurveyDocument = await this.createSurveyDocument(
            userId,
            solutionDocument[0]
            // userOrgDetails[userId]
          );

          if (!createSurveyDocument.success) {
            throw new Error(
              messageConstants.apiResponses.SURVEY_CREATION_FAILED
            );
          }

          surveyId = createSurveyDocument.data._id;
        }

        let validateSurvey = await this.validateSurvey(
          surveyId,
          userId,
          version && version === messageConstants.common.VERSION_3
            ? false
            : true
        );

        if (!validateSurvey.success) {
          return resolve(validateSurvey);
        }

        let surveyDetails = await this.details(
          surveyId,
          userId,
          validateSurvey.data.submissionId,
          roleInformation,
          token,
          appVersion,
          appName
        );

        if (!surveyDetails.success) {
          return resolve(surveyDetails);
        }

        return resolve({
          success: true,
          message: surveyDetails.message,
          data: surveyDetails.data,
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * survey details.
   * @method
   * @name details
   * @param  {String} surveyId - survey id.
   * @param {String} userId - userId
   * @param {String} userToken - userToken.
   * @param {Number} appVersion - appVersion.
   * @param {String} appName - app name.
   * @returns {JSON} - returns survey solution, program and questions.
   */

  static details(
    surveyId = "",
    userId = "",
    submissionId = "",
    roleInformation = {},
    userToken = "",
    appVersion = "",
    appName = ""
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        if (surveyId == "") {
          throw new Error(messageConstants.apiResponses.SURVEY_ID_REQUIRED);
        }

        if (userId == "") {
          throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK);
        }

        let surveyDocument = await this.surveyDocuments({
          _id: surveyId,
          status: messageConstants.common.PUBLISHED,
          isDeleted: false,
        });

        if (!surveyDocument.length) {
          throw new Error(messageConstants.apiResponses.SURVEY_NOT_FOUND);
        }

        surveyDocument = surveyDocument[0];

        let solutionQueryObject = {
          _id: surveyDocument.solutionId,
          status: messageConstants.common.ACTIVE_STATUS,
          isDeleted: false,
        };

        let solutionDocumentProjectionFields =
          await this.solutionDocumentProjectionFieldsForDetailsAPI();

        let solutionDocument = await solutionsHelper.solutionDocuments(
          solutionQueryObject,
          solutionDocumentProjectionFields
        );

        if (!solutionDocument.length) {
          throw new Error(messageConstants.apiResponses.SOLUTION_NOT_FOUND);
        }

        solutionDocument = solutionDocument[0];

        let endDateCheckRequired = true;

        if (submissionId != "") {
          let submissionDocument =
            await surveySubmissionsHelper.surveySubmissionDocuments(
              {
                _id: submissionId,
              },
              ["status"]
            );

          if (submissionDocument && submissionDocument.length > 0) {
            if (
              submissionDocument[0].status ==
              messageConstants.common.SUBMISSION_STATUS_COMPLETED
            ) {
              endDateCheckRequired = false;
            }
          }
        }

        if (endDateCheckRequired) {
          if (new Date() > new Date(solutionDocument.endDate)) {
            if (
              solutionDocument.status == messageConstants.common.ACTIVE_STATUS
            ) {
              await solutionsHelper.updateSolutionDocument(
                { _id: solutionDocument._id },
                { $set: { status: messageConstants.common.INACTIVE_STATUS } }
              );
            }

            throw new Error(messageConstants.apiResponses.LINK_IS_EXPIRED);
          }
        }

        let programDocument = [];

        if (surveyDocument.programId) {
          let programQueryObject = {
            _id: surveyDocument.programId,
            status: messageConstants.common.ACTIVE_STATUS,
            components: { $in: [ObjectId(surveyDocument.solutionId)] },
          };

          programDocument = await programsHelper.list(programQueryObject, [
            "externalId",
            "name",
            "description",
            "imageCompression",
            "isAPrivateProgram",
            "rootOrganisations",
            "requestForPIIConsent",
          ]);
        }

        let solutionDocumentFieldList =
          await this.solutionDocumentFieldListInResponse();

        let result = {};

        result.solution = await _.pick(
          solutionDocument,
          solutionDocumentFieldList
        );

        if (programDocument.length > 0) {
          result.program = programDocument[0];
          //Check data present in programUsers collection.
          //checkForUserJoinedProgramAndConsentShared will returns an object which contain joinProgram and consentShared status.
          let programJoinStatus =
            await programUsersHelper.checkForUserJoinedProgramAndConsentShared(
              programDocument[0]._id,
              userId
            );

          // if programJoined key is false, user not joined the program.
          result.programJoined = programJoinStatus.joinProgram;
          result.consentShared = programJoinStatus.consentShared;
          result.rootOrganisations = programDocument[0].rootOrganisations
            ? programDocument[0].rootOrganisations[0]
            : "";
          if (programDocument[0].hasOwnProperty("requestForPIIConsent")) {
            result.requestForPIIConsent =
              programDocument[0].requestForPIIConsent;
          }
        }

        let assessment = {};

        assessment.name = solutionDocument.name;
        assessment.description = solutionDocument.description;
        assessment.externalId = solutionDocument.externalId;

        let criteriaId = solutionDocument.themes[0].criteria[0].criteriaId;
        let weightage = solutionDocument.themes[0].criteria[0].weightage;

        let criteriaQuestionDocument = await criteriaQuestionsHelper.list(
          { _id: criteriaId },
          "all",
          ["resourceType", "language", "keywords", "concepts"]
        );

        let evidenceMethodArray = {};
        let submissionDocumentEvidences = {};
        let submissionDocumentCriterias = [];

        Object.keys(solutionDocument.evidenceMethods).forEach((solutionEcm) => {
          solutionDocument.evidenceMethods[solutionEcm].startTime = "";
          solutionDocument.evidenceMethods[solutionEcm].endTime = "";
          solutionDocument.evidenceMethods[solutionEcm].isSubmitted = false;
          solutionDocument.evidenceMethods[solutionEcm].submissions =
            new Array();
        });

        submissionDocumentEvidences = solutionDocument.evidenceMethods;

        let criteria = criteriaQuestionDocument[0];

        criteria.weightage = weightage;

        submissionDocumentCriterias.push(_.omit(criteria, ["evidences"]));

        criteria.evidences.forEach((evidenceMethod) => {
          if (evidenceMethod.code) {
            if (!evidenceMethodArray[evidenceMethod.code]) {
              evidenceMethod.sections.forEach((ecmSection) => {
                ecmSection.name = solutionDocument.sections[ecmSection.code];
              });
              _.merge(
                evidenceMethod,
                submissionDocumentEvidences[evidenceMethod.code]
              );
              evidenceMethodArray[evidenceMethod.code] = evidenceMethod;
            } else {
              evidenceMethod.sections.forEach((evidenceMethodSection) => {
                let sectionExisitsInEvidenceMethod = 0;
                let existingSectionQuestionsArrayInEvidenceMethod = [];

                evidenceMethodArray[evidenceMethod.code].sections.forEach(
                  (exisitingSectionInEvidenceMethod) => {
                    if (
                      exisitingSectionInEvidenceMethod.code ==
                      evidenceMethodSection.code
                    ) {
                      sectionExisitsInEvidenceMethod = 1;
                      existingSectionQuestionsArrayInEvidenceMethod =
                        exisitingSectionInEvidenceMethod.questions;
                    }
                  }
                );

                if (!sectionExisitsInEvidenceMethod) {
                  evidenceMethodSection.name =
                    solutionDocument.sections[evidenceMethodSection.code];
                  evidenceMethodArray[evidenceMethod.code].sections.push(
                    evidenceMethodSection
                  );
                } else {
                  evidenceMethodSection.questions.forEach(
                    (questionInEvidenceMethodSection) => {
                      existingSectionQuestionsArrayInEvidenceMethod.push(
                        questionInEvidenceMethodSection
                      );
                    }
                  );
                }
              });
            }
          }
        });

        if (submissionId !== "") {
          assessment.submissionId = submissionId;

          let surveySubmissionDocument =
            await surveySubmissionsHelper.surveySubmissionDocuments(
              {
                _id: submissionId,
              },
              ["evidences"]
            );

          submissionDocumentEvidences = surveySubmissionDocument[0].evidences;
        } else {
          // join survey's program. PII data consent is given via this api call.
          if(programJoinEnabled !== messageConstants.common.OFF) {
            if (solutionDocument.programId && userToken !== "") {
              if (
                programDocument.length > 0 &&
                programDocument[0].hasOwnProperty("requestForPIIConsent")
              ) {
                //fetch programUsers data
                let programUsers = await programUsersHelper.programUsersDocuments(
                  {
                    userId: userId,
                    programId: solutionDocument.programId,
                  },
                  ["_id", "resourcesStarted"]
                );
                if (
                  !programUsers.length > 0 ||
                  (programUsers.length > 0 &&
                    programUsers[0].resourcesStarted == false)
                ) {
                  let programJoinData = {};
                  programJoinData.userRoleInformation = roleInformation;
                  programJoinData.isResource = true;
                  programJoinData.consentShared = true;
                  let joinProgram = await coreService.joinProgram(
                    userToken,
                    programJoinData,
                    solutionDocument.programId,
                    appVersion,
                    appName
                  );

                  if (!joinProgram.success) {
                    return resolve({
                      status: httpStatusCode.bad_request.status,
                      message: messageConstants.apiResponses.PROGRAM_JOIN_FAILED,
                    });
                  }
                }
              }
            }
          }
          let submissionDocument = {
            solutionId: solutionDocument._id,
            solutionExternalId: solutionDocument.externalId,
            surveyId: surveyDocument._id,
            createdBy: surveyDocument.createdBy,
            evidenceSubmissions: [],
            status: messageConstants.common.SUBMISSION_STATUS_STARTED,
            evidences: submissionDocumentEvidences,
            evidencesStatus: Object.values(submissionDocumentEvidences),
            criteria: submissionDocumentCriterias,
            surveyInformation: {
              ..._.omit(surveyDocument, ["_id", "deleted", "__v"]),
            },
            isAPrivateProgram: surveyDocument.isAPrivateProgram,
          };
          submissionDocument.surveyInformation.startDate = new Date();

          //Fetch user profile information by calling sunbird's user read api.
          let addReportInfoToSolution = false;
          let userProfileData = {};
          let userProfile = await userProfileService.profile(userToken, userId);
          if (
            userProfile.success &&
            userProfile.data &&
            userProfile.data.response
          ) {
            userProfileData = userProfile.data.response;
            addReportInfoToSolution = true;
          }
          submissionDocument.userProfile = userProfileData;

          if (Object.keys(roleInformation).length > 0 && roleInformation.role) {
            //commented for multiple role
            // let roleDocument = await userRolesHelper.list
            // ( { code : roleInformation.role },
            //   [ "_id"]
            // )

            // if (roleDocument.length > 0) {
            //     roleInformation.roleId = roleDocument[0]._id;
            // }

            submissionDocument.userRoleInformation = roleInformation;
          }

          if (programDocument.length > 0) {
            submissionDocument.programId = programDocument[0]._id;
            submissionDocument.programExternalId =
              programDocument[0].externalId;
          }

          let submissionDoc = await database.models.surveySubmissions.create(
            submissionDocument
          );

          if (submissionDoc._id) {
            assessment.submissionId = submissionDoc._id;
            //once survey submission created add reportInformation to survey solution
            if (addReportInfoToSolution && submissionDoc.solutionId) {
              let updateSolution =
                await solutionsHelper.addReportInformationInSolution(
                  submissionDoc.solutionId,
                  submissionDoc.userProfile
                );
            }
          }
        }

        const parsedAssessment = await assessmentsHelper.parseQuestionsV2(
          Object.values(evidenceMethodArray),
          ["A1"],
          submissionDocumentEvidences,
          solutionDocument && solutionDocument.questionSequenceByEcm
            ? solutionDocument.questionSequenceByEcm
            : false
        );

        assessment.evidences = parsedAssessment.evidences;
        assessment.submissions = parsedAssessment.submissions;
        if (
          parsedAssessment.generalQuestions &&
          parsedAssessment.generalQuestions.length > 0
        ) {
          assessment.generalQuestions = parsedAssessment.generalQuestions;
        }

        result.assessment = assessment;

        return resolve({
          success: true,
          message:
            messageConstants.apiResponses.SURVEY_DETAILS_FETCHED_SUCCESSFULLY,
          data: result,
        });
      } catch (error) {
        return reject({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   *  Helper function for list of fields to be selected from solution document.
   * @method
   * @name solutionDocumentProjectionFieldsForDetailsAPI
   * @returns {Array} - List of solution document fields.
   */

  static solutionDocumentProjectionFieldsForDetailsAPI() {
    return new Promise(async (resolve, reject) => {
      return resolve([
        "name",
        "externalId",
        "programId",
        "programExternalId",
        "description",
        "themes",
        "questionSequenceByEcm",
        "evidenceMethods",
        "sections",
        "captureGpsLocationAtQuestionLevel",
        "enableQuestionReadOut",
        "author",
        "endDate",
      ]);
    });
  }

  /**
   *  Helper function for list of solution fields to be sent in response.
   * @method
   * @name solutionDocumentFieldListInResponse
   * @returns {Array} - list of solution document fields.
   */

  static solutionDocumentFieldListInResponse() {
    return new Promise(async (resolve, reject) => {
      return resolve([
        "_id",
        "externalId",
        "name",
        "description",
        "captureGpsLocationAtQuestionLevel",
        "enableQuestionReadOut",
      ]);
    });
  }

  /**
   * Validate survey.
   * @method
   * @name validateSurvey
   * @param {String} surveyId - survey id.
   * @param {String} userId - logged in user id.
   * @returns {Bollean} survey is valid or not.
   */

  static validateSurvey(surveyId, userId, validateSurveySubmission = true) {
    return new Promise(async (resolve, reject) => {
      try {
        if (surveyId == "") {
          throw new Error(messageConstants.apiResponses.SURVEY_ID_REQUIRED);
        }

        if (userId == "") {
          throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK);
        }

        let surveySubmissionDocument =
          await surveySubmissionsHelper.surveySubmissionDocuments(
            {
              surveyId: surveyId,
              createdBy: userId,
            },
            ["status", "surveyInformation.endDate"]
          );

        let submissionId = "";

        if (surveySubmissionDocument.length > 0) {
          submissionId = surveySubmissionDocument[0]._id;

          if (validateSurveySubmission) {
            if (
              surveySubmissionDocument[0].status ==
              messageConstants.common.SUBMISSION_STATUS_COMPLETED
            ) {
              return resolve({
                success: false,
                message:
                  messageConstants.apiResponses
                    .MULTIPLE_SUBMISSIONS_NOT_ALLOWED,
                data: {
                  status: surveySubmissionDocument[0].status,
                },
              });
            }

            if (
              new Date() >
              new Date(surveySubmissionDocument[0].surveyInformation.endDate)
            ) {
              throw new Error(messageConstants.apiResponses.LINK_IS_EXPIRED);
            }
          }
        }

        return resolve({
          success: true,
          data: {
            submissionId: submissionId,
          },
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * List of surveys.
   * @method
   * @name surveys
   * @param {Object} query - filter query object
   * @param {String} pageSize - Size of page.
   * @param {String} pageNo - page no.
   * @param {String} search - search text.
   * @param {Array} fieldsArray - projection fields.
   * @returns {Object} List of surveys.
   */

  static surveys(query, pageSize, pageNo, searchQuery, fieldsArray) {
    return new Promise(async (resolve, reject) => {
      try {
        let matchQuery = {
          $match: query,
        };

        if (searchQuery && searchQuery.length > 0) {
          matchQuery["$match"]["$or"] = searchQuery;
        }
        let projection = {};
        fieldsArray.forEach((field) => {
          projection[field] = 1;
        });

        let aggregateData = [];
        aggregateData.push(matchQuery);
        aggregateData.push(
          {
            $project: projection,
          },
          {
            $facet: {
              totalCount: [{ $count: "count" }],
              data: [{ $skip: pageSize * (pageNo - 1) }, { $limit: pageSize }],
            },
          },
          {
            $project: {
              data: 1,
              count: {
                $arrayElemAt: ["$totalCount.count", 0],
              },
            },
          }
        );

        let result = await database.models.surveys.aggregate(aggregateData);

        return resolve({
          success: true,
          message: messageConstants.apiResponses.SURVEYS_FETCHED,
          data: {
            data: result[0].data,
            count: result[0].count ? result[0].count : 0,
          },
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: {
            data: [],
            count: 0,
          },
        });
      }
    });
  }

  /**
   * Get list of surveys with the targetted ones.
   * @method
   * @name getSurvey
   * @param {Object} bodyData - Requested body data.
   * @param {String} userId - Logged in user Id.
   * @param {String} pageSize - size of page.
   * @param {String} pageNo - page number.
   * @param {String} search - search text.
   * @returns {Object}
   */

  static getSurvey(bodyData, userId, token, pageSize, pageNo, search = "") {
    return new Promise(async (resolve, reject) => {
      try {
        let surveySolutions = await surveySubmissionsHelper.surveySolutions(
          userId,
          messageConstants.common.DEFAULT_PAGE_NO,
          messageConstants.common.DEFAULT_PAGE_SIZE,
          search
        );

        let solutionIds = [];

        let totalCount = 0;
        let mergedData = [];

        if (surveySolutions.success && surveySolutions.data) {
          totalCount = surveySolutions.data.count;
          mergedData = surveySolutions.data.data;

          if (mergedData.length > 0) {
            mergedData.forEach((surveyData) => {
              surveyData.isCreator = true;
              if (surveyData.solutionId) {
                solutionIds.push(ObjectId(surveyData.solutionId));
              }
            });
          }
        }

        let surveySubmissions = await surveySubmissionsHelper.surveyList(
          userId,
          messageConstants.common.DEFAULT_PAGE_NO,
          messageConstants.common.DEFAULT_PAGE_SIZE,
          search
        );

        if (
          surveySubmissions.success &&
          surveySubmissions.data.data.length > 0
        ) {
          totalCount += surveySubmissions.data.count;

          surveySubmissions.data.data.forEach((surveyData) => {
            surveyData.isCreator = false;
            if (surveyData.solutionId) {
              solutionIds.push(ObjectId(surveyData.solutionId));
            }
          });

          mergedData = [...mergedData, ...surveySubmissions.data.data];
        }

        if (solutionIds.length > 0) {
          bodyData["filter"] = {};
          bodyData["filter"]["skipSolutions"] = solutionIds;
        }

        let targetedSolutions =
          await coreService.solutionBasedOnRoleAndLocation(
            token,
            bodyData,
            messageConstants.common.SURVEY,
            search
          );

        if (targetedSolutions.success) {
          if (
            targetedSolutions.data.data &&
            targetedSolutions.data.data.length > 0
          ) {
            totalCount += targetedSolutions.data.count;

            targetedSolutions.data.data.forEach((targetedSolution) => {
              targetedSolution.solutionId = targetedSolution._id;
              targetedSolution._id = "";
              targetedSolution.isCreator = false;
              mergedData.push(targetedSolution);
              delete targetedSolution.type;
              delete targetedSolution.externalId;
            });
          }
        }

        if (mergedData.length > 0) {
          let startIndex = pageSize * (pageNo - 1);
          let endIndex = startIndex + pageSize;
          mergedData = mergedData.slice(startIndex, endIndex);
        }

        return resolve({
          success: true,
          message: messageConstants.apiResponses.TARGETED_SURVEY_FETCHED,
          data: {
            data: mergedData,
            count: totalCount,
          },
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: [],
        });
      }
    });
  }

  /**
   * survey details.
   * @method
   * @name detailsV2
   * @param {Object} bodyData - Request body data.
   * @param  {String} surveyId - surveyId.
   * @param {String} solutionId - solutionId
   * @param {String} userId - logged in userId
   * @param {String} token - logged in user token
   * @returns {JSON} - returns survey solution, program and questions.
   */

  static detailsV2(
    bodyData,
    surveyId = "",
    solutionId = "",
    userId = "",
    token = ""
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        let surveyData = await this.findOrCreateSurvey(
          bodyData,
          surveyId,
          solutionId,
          userId,
          token
        );

        if (!surveyData.success) {
          return resolve(surveyData);
        }

        let validateSurvey = await this.validateSurvey(surveyData.data, userId);

        if (!validateSurvey.success) {
          return resolve(validateSurvey);
        }

        let surveyDetails = await this.details(
          surveyData.data,
          userId,
          validateSurvey.data.submissionId,
          bodyData,
          token
        );

        if (!surveyDetails.success) {
          return resolve(surveyDetails);
        }

        return resolve({
          success: true,
          message: surveyDetails.message,
          data: surveyDetails.data,
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * Find or create survey based on targeted data.
   * @method
   * @name findOrCreateSurvey
   * @param {Object} bodyData - Request body data.
   * @param  {String} surveyId - surveyId.
   * @param {String} solutionId - solutionId
   * @param {String} userId - logged in userId
   * @param {String} token - logged in user token
   * @returns {JSON} - returns survey solution, program and questions.
   */

  static findOrCreateSurvey(
    bodyData,
    surveyId = "",
    solutionId = "",
    userId = "",
    token = ""
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        if (userId == "") {
          throw new Error(messageConstants.apiResponses.USER_ID_REQUIRED_CHECK);
        }

        if (solutionId == "") {
          throw new Error(messageConstants.apiResponses.SOLUTION_ID_REQUIRED);
        }

        if (token == "") {
          throw new Error(
            messageConstants.apiResponses.REQUIRED_USER_AUTH_TOKEN
          );
        }

        if (surveyId == "") {
          let surveyDocument = await this.surveyDocuments(
            {
              solutionId: solutionId,
              createdBy: userId,
            },
            ["_id"]
          );

          if (surveyDocument.length > 0) {
            surveyId = surveyDocument[0]._id;
          } else {
            let solutionData =
              await coreService.solutionDetailsBasedOnRoleAndLocation(
                token,
                bodyData,
                solutionId,
                messageConstants.common.SURVEY
              );

            if (!solutionData.success) {
              throw new Error(
                messageConstants.apiResponses.SOLUTION_DETAILS_NOT_FOUND
              );
            }

            if (
              solutionData.data.hasOwnProperty("endDate") &&
              new Date(solutionData.data.endDate) < new Date()
            ) {
              throw new Error(messageConstants.apiResponses.SOLUTION_EXPIRED);
            }

            let createSurveyDocument = await this.createSurveyDocument(
              userId,
              solutionData.data,
              token,
              bodyData
            );

            if (!createSurveyDocument.success) {
              throw new Error(
                messageConstants.apiResponses.SURVEY_CREATION_FAILED
              );
            }

            surveyId = createSurveyDocument.data._id;
          }
        }

        return resolve({
          success: true,
          data: surveyId,
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * survey details.
   * @method
   * @name detailsV3
   * @param {Object} bodyData - Request body data.
   * @param  {String} surveyId - surveyId.
   * @param {String} solutionId - solutionId
   * @param {String} userId - logged in userId
   * @param {String} token - logged in user token
   * @param {Number} appVersion - application version
   * @param {String} appName - application name
   * @returns {JSON} - returns survey solution, program and questions.
   */

  static detailsV3(
    bodyData,
    surveyId = "",
    solutionId = "",
    userId = "",
    token = "",
    appVersion = "",
    appName = ""
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        let surveyData = await this.findOrCreateSurvey(
          bodyData,
          surveyId,
          solutionId,
          userId,
          token
        );

        if (!surveyData.success) {
          return resolve(surveyData);
        }

        let validateSurvey = await this.validateSurvey(
          surveyData.data,
          userId,
          false
        );

        if (!validateSurvey.success) {
          return resolve(validateSurvey);
        }

        let surveyDetails = await this.details(
          surveyData.data,
          userId,
          validateSurvey.data.submissionId,
          bodyData,
          token,
          appVersion,
          appName
        );

        if (!surveyDetails.success) {
          return resolve(surveyDetails);
        }

        return resolve({
          success: true,
          message: surveyDetails.message,
          data: surveyDetails.data,
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * List of user assigned surveys.
   * @method
   * @name userAssigned
   * @param {String} userId - Logged in user Id.
   * @param {String} pageSize - size of page.
   * @param {String} pageNo - page number.
   * @param {String} search - search text.
   * @param {String} filter - filter text.
   * @param {Array} solutionIds - survey solution Ids.
   * @returns {Object}
   */

  static userAssigned(
    userId,
    pageSize,
    pageNo,
    search = "",
    filter,
    surveyReportPage = "",
    solutionIds = []
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        let surveySolutions = {
          success: false,
        };

        if (
          surveyReportPage === "" ||
          gen.utils.convertStringToBoolean(surveyReportPage)
        ) {
          surveySolutions = await surveySubmissionsHelper.surveySolutions(
            userId,
            pageNo,
            pageSize,
            search,
            filter
          );
        }

        let totalCount = 0;
        let mergedData = [];

        if (surveySolutions.success && surveySolutions.data) {
          totalCount = surveySolutions.data.count;
          mergedData = surveySolutions.data.data;

          if (mergedData.length > 0) {
            mergedData.forEach((surveyData) => {
              surveyData.isCreator = true;
            });
          }
        }

        let surveySubmissions = await surveySubmissionsHelper.surveyList(
          userId,
          pageNo,
          pageSize,
          search,
          filter,
          surveyReportPage,
          solutionIds
        );

        if (
          surveySubmissions.success &&
          surveySubmissions.data.data.length > 0
        ) {
          totalCount += surveySubmissions.data.count;

          surveySubmissions.data.data.forEach((surveyData) => {
            surveyData.isCreator = false;
          });

          mergedData = [...mergedData, ...surveySubmissions.data.data];
        }

        return resolve({
          success: true,
          message: messageConstants.apiResponses.USER_ASSIGNED_SURVEY_FETCHED,
          data: {
            data: mergedData,
            count: totalCount,
          },
        });
      } catch (error) {
        return resolve({
          success: false,
          message: error.message,
          data: [],
        });
      }
    });
  }

  /**
   * Get survey solution link.
   * @method
   * @name getLink
   * @param  {String} solutionId - solution external Id.
   * @param  {String} appName - name of app.
   * @returns {getLink} - sharable link
   */

  static getLink(solutionId, appName) {
    return new Promise(async (resolve, reject) => {
      try {
        let surveyData = await solutionsHelper.solutionDocuments(
          {
            externalId: solutionId,
            isReusable: false,
            type: messageConstants.common.SURVEY,
          },
          ["link"]
        );

        if (!surveyData.length) {
          throw new Error(messageConstants.apiResponses.SOLUTION_NOT_FOUND);
        }
        //will not validate App Name
        // let appDetails = await coreService.getAppDetails(appName);

        // if (appDetails.result === false) {
        //   throw new Error(messageConstants.apiResponses.APP_NOT_FOUND);
        // }

        let link =
          appsPortalBaseUrl +
          appName +
          messageConstants.common.TAKE_SURVEY +
          surveyData[0].link;

        return resolve({
          success: true,
          message: messageConstants.apiResponses.SURVEY_LINK_GENERATED,
          data: link,
        });
      } catch (err) {
        return resolve({
          success: false,
          message: err.message,
          data: false,
        });
      }
    });
  }
};
