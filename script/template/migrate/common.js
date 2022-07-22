const { isEmpty, compact } = require("lodash");
const { getPrecondition } = require("../helpers/hierarchyHelper");
const {
  getQuestionFromDB,
  createQuestionTemplate,
} = require("../helpers/questionsetHelper");
const logger = require("./../../logger");

const initHierarchy = (questionsetid, solution, programId, migratedId) => {
  return {
    questionset: migratedId,
    questionsetDbId: questionsetid,
    isHierarchyUpdated: solution?.isHierarchyUpdated || false,
    isBranchingUpdated: solution?.isBranchingUpdated || false,
    isPublished: solution?.isPublished || false,
    sourcingProgramId: programId,
    isSrcProgramUpdated: solution?.isSrcProgramUpdated || false,
    isSrcProgramPublished: solution?.isSrcProgramPublished || false,
    isNominated: solution?.isNominated || false,
    isContributorAdded: solution?.isContributorAdded || false,
    isContributorAccepted: solution?.isContributorAccepted || false,
    criterias: [],
  };
};

const getCriteriaData = (criteria, type, question = {}) => {
  if (isEmpty(question)) {
    return {
      migratedId: "",
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
    };
  } else {
    return {
      migratedId: "",
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

  if (!isEmpty(question) && (!question?.migratedId || !question?.isPublished)) {
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
  const migratedId = child?.migratedId;

  const visible = child?.visibleIf ? child?.visibleIf[0] : {};

  logger.debug(
    `updateHierarchyBranching: migratedId = ${migratedId}; parentId = ${parentId}; visible: ${visible}`
  );

  if (!isEmpty(visible)) {
    if (hasProperty(branching, index, parentId) && migratedId) {
      if (
        !branching.criterias[index].branchingLogic[parentId].target.includes(
          migratedId
        )
      ) {
        branching.criterias[index].branchingLogic[parentId].target.push(
          migratedId
        );
      }

      branching.criterias[index].branchingLogic[migratedId] = {
        target: [],
        preCondition: getPrecondition(visible, parentId, pQuestion),
        source: [parentId],
      };
    } else if (migratedId) {
      branching.criterias[index].branchingLogic[parentId] = {
        target: [migratedId],
        preCondition: {},
        source: [],
      };
      branching.criterias[index].branchingLogic[migratedId] = {
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
