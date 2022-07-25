// Dependencies
const surveysHelper = require(MODULES_BASE_PATH + "/surveys/helper");
const redis = require("./../../config/redisConfig");

const cache = redis.client;


module.exports = class Surveys extends Abstract {
  constructor() {
    super(surveysSchema);
  }

  static get name() {
    return "surveys2";
  }

  /**
   * Survey details.
   * @method
   * @name details
   * @param  {Request} req request body.
   * @param  {req.param._id} Either surveyId or link.
   * @param  {req.query.solutionId} solutionId (not required in the case of passing link).
   * @returns {Object} returns survey details information.
   * Result will have the details of survey.
   */

  async details(req) {
    return new Promise(async (resolve, reject) => {
      try {
        const cacheData = await cache
          .get(`surveyDetails:${req.params._id}`)
          .catch((err) => {
            console.log("error", err);
          });

        if (cacheData) {
          console.log("cahcehData", cacheData);
          return resolve(JSON.parse(cacheData));
        } else {

          let validateSurveyId = gen.utils.isValidMongoId(req.params._id);

          let surveyDetails = {};

          if (validateSurveyId || req.query.solutionId) {
            let surveyId = req.params._id ? req.params._id : "";

            surveyDetails = await surveysHelper.detailsV3(
              req.body,
              surveyId,
              req.query.solutionId,
              req.userDetails.userId,
              req.userDetails.userToken
            );
          } else {
            let bodyData = req.body ? req.body : {};

            surveyDetails = await surveysHelper.getDetailsByLink2(
              req.params._id,
              req.userDetails.userId,
              req.userDetails.userToken,
              bodyData
            );
          }

          await cache.setEx(
            `surveyDetails:${req.params._id}`,
            redis.expiry,
            JSON.stringify({
              message: surveyDetails.message,
              result: surveyDetails.data,
            })
          );

          return resolve({
            message: surveyDetails.message,
            result: surveyDetails.data,
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
