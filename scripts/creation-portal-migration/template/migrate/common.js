const { isEmpty } = require("lodash");

/**
* Map section data
* @method
* @name getCriteriaData
* @param {Object} criteria - criteria
* @param {String} type  - observation or survey
* @param {Object} question - criteria
* @returns  - returns the mapped section
**/
const getCriteriaData = (criteria, type, question = {}) => {
  if (isEmpty(question)) {
    return {
      code: criteria?.externalId,
      name: criteria?.name,
      description: criteria?.description,
      mimeType: "application/vnd.sunbird.questionset",
      primaryCategory: type,
    };
  } else {
    return {
      code: question?.externalId,
      name: question?.question[0],
      description: `Matrix description`,
      mimeType: "application/vnd.sunbird.questionset",
      primaryCategory: type,
    };
  }
};

module.exports = {
  getCriteriaData
};
