const { isEmpty } = require("lodash");
const logger = require("../../logger");

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
      // referenceQuestionSetId: "",
      // criDbId: criteria?._id.toString(),
      code: criteria?.externalId,
      name: criteria?.name,
      description: criteria?.description,
      mimeType: "application/vnd.sunbird.questionset",
      primaryCategory: type,
      // questions: [],
      // branchingLogic: {},
      // allowMultipleInstances: "",
      // instances: {},
      // pageQuestions: {},
      // isMatrix: false,
      // nodesModified: {}
    };
  } else {
    return {
      // referenceQuestionSetId: "",
      // _id: criteria?._id,
      // criDbId: criteria?._id.toString(),
      code: question?.externalId,
      name: question?.question[0],
      description: `Matrix description`,
      mimeType: "application/vnd.sunbird.questionset",
      primaryCategory: type,
      // questions: [],
      // branchingLogic: {},
      // allowMultipleInstances: "Yes",
      // instances: { label: question?.instanceIdentifier },
      // pageQuestions: {},
      // isMatrix: true,
      // nodesModified: {}
    };
  }
};

module.exports = {
  getCriteriaData
};
