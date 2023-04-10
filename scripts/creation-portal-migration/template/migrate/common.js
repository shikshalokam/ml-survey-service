const { isEmpty } = require("lodash");
const { getPrecondition } = require("../helpers/hierarchyHelper");
const {
  getQuestionFromDB,
  createQuestionTemplate,
} = require("../helpers/questionsetHelper");
const logger = require("../../logger");

const initHierarchy = (questionsetid, solution, programId, referenceQuestionSetId) => {
  return {
    questionset: referenceQuestionSetId,
    questionsetDbId: questionsetid,
    isHierarchyUpdated: solution?.migrationReference?.isHierarchyUpdated || false,
    isBranchingUpdated: solution?.migrationReference?.isBranchingUpdated || false,
    isPublished: solution?.migrationReference?.isPublished || false,
    sourcingProgramId: programId,
    isSrcProgramUpdated: solution?.migrationReference?.isSrcProgramUpdated || false,
    isSrcProgramPublished: solution?.migrationReference?.isSrcProgramPublished || false,
    isNominated: solution?.migrationReference?.isNominated || false,
    isContributorAdded: solution?.migrationReference?.isContributorAdded || false,
    isContributorAccepted: solution?.migrationReference?.isContributorAccepted || false,
    criterias: [],
  };
};

const getCriteriaData = (criteria, type, question = {}) => {
  if (isEmpty(question)) {
    return {
      referenceQuestionSetId: "",
      criDbId: criteria?._id.toString(),
      code: criteria?.externalId,
      name: criteria?.name,
      description: criteria?.description,
      mimeType: "application/vnd.sunbird.questionset",
      primaryCategory: type,
      questions: [],
      branchingLogic: {},
      allowMultipleInstances: "",
      instances: {},
      pageQuestions: {},
      isMatrix: false,
    };
  } else {
    return {
      referenceQuestionSetId: "",
      _id: criteria?._id,
      criDbId: criteria?._id.toString(),
      code: criteria?.externalId,
      name: criteria?.name,
      description: criteria?.description,
      mimeType: "application/vnd.sunbird.questionset",
      primaryCategory: type,
      questions: [],
      branchingLogic: {},
      allowMultipleInstances: "Yes",
      instances: { label: question?.instanceIdentifier },
      pageQuestions: {},
      isMatrix: true
    };
  }
};

const isSectionMatched = (matrixQuestions, criteriaId, matrixId) => {
  logger.debug(
    `isSectionMatched: criteriaId = ${criteriaId} matrixId = ${matrixId}; matrixQuestions: ${matrixQuestions}`
  );
  if (matrixQuestions.hasOwnProperty(criteriaId)) {
    if (matrixQuestions[criteriaId].hasOwnProperty(matrixId)) return true;
  }
  return false;
};

const isQuestionMatched = (data, id) => {

  logger.debug(`isQuestionMatched: id = ${id}; `);

  for (let i = 0; i < data.length; i++) {
    const qid = data[i]._id;

    if (qid.toString() === id.toString()) {
      return data[i];
    }
  }

  return false;
};

const isQuestionMatchedInMatrixQuestions = (
  matrixQuestions,
  criteriaId,
  id
) => {

  logger.debug(
    `isQuestionMatchedInMatrixQuestions: criteriaId = ${criteriaId}; id = ${id}; matrixQuestions: ${matrixQuestions}`
  );

  if (matrixQuestions.hasOwnProperty(criteriaId)) {
    const keys = Object.keys(matrixQuestions[criteriaId]);

    for (let i = 0; i < keys.length; i++) {
      const que = matrixQuestions[criteriaId][keys[i]];
      const questions = que?.questions || [];
      return isQuestionMatched(questions, id);
    }
  }

  return false;
};

const getQuestion = async (questions, questions2, id, migratedCount) => {

  let matched = isQuestionMatched(questions, id);

  let question = {};

  if (matched === false) {
    matched = isQuestionMatched(questions2, id);
  }

  if (matched === false) {
    question = await getQuestionFromDB(id);
  }

  if (matched !== false && !isEmpty(matched)) {
    question = matched;
  }

  if (!isEmpty(question) && (!question?.referenceQuestionId || !question?.migrationReference?.isPublished)) {
    question = await createQuestionTemplate(question, migratedCount);
  }

  logger.info(
    `getQuestion: qid = ${id}; question: ${JSON.stringify(question)}`
  );

  return question;
};

const updateMatrixHierarchyBranching = (
  matrixHierarchy,
  criteriaId,
  matrixId,
  parentId,
  pQuestion,
  child
) => {
  const criterias = matrixHierarchy?.criterias || [];

  logger.debug(
    `updateMatrixHierarchyBranching: criteriaId = ${criteriaId}; matrixId = ${matrixId}; parentId: ${parentId}; child: ${child}`
  );

  for (let i = 0; i < criterias; i++) {
    const criteria = criterias[i];
    if (criteria._id.toString() === criteriaId.toString()) {
      matrixHierarchy = updateHierarchyBranching(
        matrixHierarchy,
        i,
        parentId,
        pQuestion,
        child
      );
    }
  }

  return matrixHierarchy;
};

const updateHierarchyBranching = (
  branching,
  index,
  parentId,
  pQuestion,
  child
) => {
  const referenceQuestionId = child?.referenceQuestionId;

  const visible = child?.visibleIf ? child?.visibleIf[0] : {};

  logger.debug(
    `updateHierarchyBranching: referenceQuestionId = ${referenceQuestionId}; parentId = ${parentId}; visible: ${visible}`
  );

  if (!isEmpty(visible)) {
    if (hasProperty(branching, index, parentId) && referenceQuestionId) {
      if (
        !branching.criterias[index].branchingLogic[parentId].target.includes(
          referenceQuestionId
        )
      ) {
        branching.criterias[index].branchingLogic[parentId].target.push(
          referenceQuestionId
        );
      }

      branching.criterias[index].branchingLogic[referenceQuestionId] = {
        target: [],
        preCondition: getPrecondition(visible, parentId, pQuestion),
        source: [parentId],
      };
    } else if (referenceQuestionId) {
      branching.criterias[index].branchingLogic[parentId] = {
        target: [referenceQuestionId],
        preCondition: {},
        source: [],
      };
      branching.criterias[index].branchingLogic[referenceQuestionId] = {
        target: [],
        preCondition: getPrecondition(visible, parentId, pQuestion),
        source: [parentId],
      };
    }
  }

  return branching;
};

const hasProperty = (hierarchy, index, id) => {
  return hierarchy.criterias[index].branchingLogic.hasOwnProperty(id);
};

module.exports = {
  initHierarchy,
  getCriteriaData,
  isSectionMatched,
  getQuestion,
  isQuestionMatchedInMatrixQuestions,
  isQuestionMatched,
  updateMatrixHierarchyBranching,
  updateHierarchyBranching,
};
