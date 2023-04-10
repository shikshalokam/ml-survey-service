const {
  isChildrenPresent,
  isVisibleIfPresent,
} = require("../helpers/questionsetHelper");
const {
  getQuestion,
  getCriteriaData,
  isQuestionMatched,
  isSectionMatched,
  updateMatrixHierarchyBranching,
} = require("./common");

const { getSectionTemplate } = require("../generate/template");
const { compact, isEmpty } = require("lodash");
const logger = require("../../logger");

const createSection = async (
  type,
  matrixHierarchy,
  matrixQuestions,
  questions,
  criteriaId,
  matrixQue,
  migratedCount
) => {
  const matrixId = matrixQue?._id ? matrixQue?._id.toString() : "";
  logger.debug(
    `createSection: criteria:${criteriaId} question: ${matrixQue?._id} question responseType: ${matrixQue?.responseType} `
  );

  if (!isSectionMatched(matrixQuestions, criteriaId, matrixId)) {
    const section = getSectionTemplate(matrixQue);

    const newCriteria = getCriteriaData(section, type, matrixQue);

    logger.info(
      `createSection: criteria:${criteriaId} question: ${matrixQue?._id}: ------------------Matrix as New Criteria---------------- ${newCriteria?.name}`
    );

    matrixHierarchy.criterias.push(newCriteria);

    if (isEmpty(matrixQuestions)) {
      matrixQuestions[criteriaId] = { [matrixId]: { questions: [] } };
    } else {
      matrixQuestions[criteriaId][matrixId] = { questions: [] };
    }

    const visible = !isEmpty(matrixQue?.visibleIf)
      ? matrixQue?.visibleIf[0]
      : "";

    if (visible) {
      const parentId = visible?._id;

      let pQuestion = isQuestionMatched(questions, parentId);

      if (pQuestion !== false) {
        for (let q = 0; q < questions.length; q++) {
          const que = questions[q];
          if (que._id.toString() === parentId.toString()) {
            const children = que.children.map((child) =>
              child.toString() !== matrixQue._id.toString() ? child : null
            );
            que.children = compact(children);
          }
          questions[q] = que;
        }
      }
    }
  }

  const instanceQuestions = matrixQue?.instanceQuestions || [];
  const instanceData = await getInstanceQuestions(
    instanceQuestions,
    matrixHierarchy,
    questions,
    matrixQuestions,
    criteriaId,
    matrixQue._id.toString(),
    type,
    migratedCount
  );

  matrixHierarchy = instanceData.matrixHierarchy;
  matrixQuestions = instanceData.matrixQuestions;
  questions = instanceData.questions;

  return { matrixHierarchy, matrixQuestions, questions };
};

const getInstanceQuestions = async (
  instanceQuestions,
  matrixHierarchy,
  questions,
  matrixQuestions,
  criteriaId,
  matrixId,
  type,
  migratedCount
) => {
  logger.debug(
    `getInstanceQuestions: criteria:${criteriaId} question: ${matrixId}`
  );

  for (let i = 0; i < instanceQuestions.length; i++) {
    const childId = instanceQuestions[i];

    let child = await getQuestion(
      questions,
      matrixQuestions[criteriaId][matrixId],
      childId
    );

    const data = await getMatrixQuestions(
      child,
      questions,
      matrixQuestions,
      criteriaId,
      matrixId,
      matrixHierarchy,
      type,
      migratedCount
    );
    questions = data.questions;
    matrixQuestions = data.matrixQuestions;
    matrixHierarchy = data.matrixHierarchy;
  }

  return { matrixQuestions, matrixHierarchy, questions };
};

const getMatrixQuestions = async (
  question,
  questions,
  matrixQuestions,
  criteriaId,
  matrixId,
  matrixHierarchy,
  type,
  migratedCount
) => {
  logger.debug(
    `getMatrixQuestions: criteriaId = ${criteriaId}; matrixId = ${matrixId};  question: ${question?._id}`
  );

  if (!isChildrenPresent(question) && !isVisibleIfPresent(question)) {
    const data = noChildrenAndnoVisibleIf(
      matrixQuestions,
      criteriaId,
      question,
      matrixId,
      matrixHierarchy,
      questions
    );

    matrixHierarchy = data.matrixHierarchy;
    matrixQuestions = data.matrixQuestions;
  } else if (isChildrenPresent(question) && !isVisibleIfPresent(question)) {
    const data = await childrenAndnoVisibleIf(
      question,
      questions,
      matrixQuestions,
      matrixHierarchy,
      criteriaId,
      matrixId,
      type,
      migratedCount
    );

    matrixHierarchy = data.matrixHierarchy;
    matrixQuestions = data.matrixQuestions;
    questions = data.questions;
  } else if (!isChildrenPresent(question) && isVisibleIfPresent(question)) {
    const data = await noChildrenAndVisibleIf(
      question,
      questions,
      matrixQuestions,
      matrixHierarchy,
      criteriaId,
      matrixId,
      migratedCount,
      type
    );

    questions = data.questions;
    matrixHierarchy = data.matrixHierarchy;
    matrixQuestions = data.matrixQuestions;
  }
  return { matrixHierarchy, matrixQuestions, questions };
};

const noChildrenAndnoVisibleIf = (
  matrixQuestions,
  criteriaId,
  question,
  matrixId,
  matrixHierarchy,
  questions
) => {


  logger.debug(
    `noChildrenAndnoVisibleIf: criteriaId = ${criteriaId}; matrixId = ${matrixId};  question: ${question?._id}`
  );

  const data = updateMatrixHierarchyQuestions(
    matrixQuestions,
    criteriaId,
    question,
    matrixId,
    matrixHierarchy,
    questions
  );

  matrixHierarchy = data.matrixHierarchy;
  matrixQuestions = data.matrixQuestions;
  questions = data.questions;

  return { matrixHierarchy, matrixQuestions, questions };
};

const childrenAndnoVisibleIf = async (
  question,
  questions,
  matrixQuestions,
  matrixHierarchy,
  criteriaId,
  matrixId,
  type,
  migratedCount
) => {
  const children = question?.children || [];

  logger.info(
    `childrenAndnoVisibleIf: criteriaId = ${criteriaId} matrixId = ${matrixId} question = ${question?._id}  children = ${children.length}`
  );

  const updatedData = updateMatrixHierarchyQuestions(
    matrixQuestions,
    criteriaId,
    question,
    matrixId,
    matrixHierarchy,
    questions
  );
  matrixHierarchy = updatedData.matrixHierarchy;
  matrixQuestions = updatedData.matrixQuestions;
  questions = updatedData.questions;

  for (let i = 0; i < children.length; i++) {
    const childId = children[i];
    let child = await getQuestion(
      questions,
      matrixQuestions[criteriaId][matrixId],
      childId,
      migratedCount
    );

    logger.info(
      `childrenAndnoVisibleIf: criteriaId = ${criteriaId} matrixId = ${matrixId} childId = ${child?._id}  child = ${child} responseType: ${child?.responseType}`
    );

    if (child.responseType === "matrix") {
      const data = await createSection(
        type,
        matrixHierarchy,
        matrixQuestions,
        questions,
        criteriaId,
        question,
        migratedCount
      );
      matrixQuestions = data.matrixQuestions;
      matrixHierarchy = data.matrixHierarchy;
      questions = data.questions;
    } else {
      const matched = isQuestionMatched(
        matrixQuestions[criteriaId][matrixId],
        question._id
      );

      if (matched === false) {
        matrixQuestions[criteriaId][matrixId].questions.push(child);
        matrixHierarchy = updateMatrixHierarchy(
          matrixHierarchy,
          matrixId,
          child?.referenceQuestionId,
          criteriaId
        );
        matrixHierarchy = updateMatrixHierarchyBranching(
          matrixHierarchy,
          criteriaId,
          matrixId,
          question?.referenceQuestionId,
          question,
          child
        );
      }
    }
  }

  return { matrixHierarchy, matrixQuestions, questions };
};

const noChildrenAndVisibleIf = async (
  question,
  questions,
  matrixQuestions,
  matrixHierarchy,
  criteriaId,
  matrixId,
  migratedCount,
  type
) => {
  const visible = question?.visibleIf ? question.visibleIf[0] : "";
  const parentId = visible._id;
  const pQuestion = await getQuestion(
    questions,
    matrixQuestions[criteriaId][matrixId],
    parentId,
    migratedCount
  );

  logger.debug(
    `noChildrenAndVisibleIf: criteriaId = ${criteriaId} matrixId = ${matrixId} questionId = ${question?._id} responseType: ${question?.responseType} visible = ${visible} `
  );

  const updatedData = updateMatrixHierarchyQuestions(
    matrixQuestions,
    criteriaId,
    question,
    matrixId,
    matrixHierarchy,
    questions
  );
  matrixHierarchy = updatedData.matrixHierarchy;
  matrixQuestions = updatedData.matrixQuestions;
  questions = updatedData.questions;

  const pMatched = isQuestionMatched(
    matrixQuestions[criteriaId][matrixId],
    pQuestion._id
  );

  if (pMatched === false) {
    matrixQuestions[criteriaId][matrixId].questions.push(pQuestion);
    matrixHierarchy = updateMatrixHierarchy(
      matrixHierarchy,
      matrixId,
      pQuestion?.referenceQuestionId,
      criteriaId
    );
    matrixHierarchy = updateMatrixHierarchyBranching(
      matrixHierarchy,
      criteriaId,
      matrixId,
      pQuestion?.referenceQuestionId,
      pQuestion,
      question
    );

    const data = await getMatrixQuestions(
      pQuestion,
      questions,
      matrixQuestions,
      criteriaId,
      matrixId,
      matrixHierarchy,
      type,
      migratedCount
    );
    questions = data.questions;
    matrixQuestions = data.matrixQuestions;
    matrixHierarchy = data.matrixHierarchy;
  }
  // }

  return { questions, matrixHierarchy, matrixQuestions };
};

const updateMatrixHierarchy = (
  matrixHierarchy,
  matrixId,
  referenceQuestionId,
  criteriaId
) => {
  logger.debug(
    `updateMatrixHierarchy: matrixId = ${matrixId}; referenceQuestionId = ${referenceQuestionId}`
  );

  const criterias = matrixHierarchy.criterias || [];
  for (let i = 0; i < criterias.length; i++) {
    const criteria = criterias[i];
    if (criteria?._id.toString() === matrixId) {
      if (!criteria.questions.includes(referenceQuestionId)) {
        criteria.questions.push(referenceQuestionId);
      }
    }
    criterias[i] = criteria;
  }
  matrixHierarchy.criterias = criterias;

  logger.info(
    `updateMatrixHierarchy: matrixHierarchy: ${JSON.stringify(matrixHierarchy)}`
  );

  return matrixHierarchy;
};

const updateMatrixHierarchyQuestions = (
  matrixQuestions,
  criteriaId,
  question,
  matrixId,
  matrixHierarchy,
  questions
) => {
  logger.debug(
    `updateMatrixHierarchyQuestions: criteriaId = ${criteriaId}; matrixId = ${matrixId};  question: ${question?._id}: referenceQuestionId: ${question?.referenceQuestionId}`
  );

  const matched = isQuestionMatched(
    matrixQuestions[criteriaId][matrixId],
    question._id
  );

  logger.info(
    `updateMatrixHierarchyQuestions: isQuestionMatched: matched = ${
      matched === false ? matched : true
    };`
  );

  if (matched === false) {
    matrixQuestions[criteriaId][matrixId].questions.push(question);
    matrixHierarchy = updateMatrixHierarchy(
      matrixHierarchy,
      matrixId,
      question?.referenceQuestionId,
      criteriaId
    );
  }

  return { matrixHierarchy, matrixQuestions, questions };
};

module.exports = {
  createSection,
};
