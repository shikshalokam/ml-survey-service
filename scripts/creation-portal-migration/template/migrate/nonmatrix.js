const {
  isChildrenPresent,
  isVisibleIfPresent,
} = require("../helpers/questionsetHelper");
const {
  isQuestionMatchedInMatrixQuestions,
  getQuestion,
  isQuestionMatched,
  updateHierarchyBranching,
} = require("./common");

const {
  updateHierarchyChildren,
} = require("../helpers/hierarchyHelper");
const { createSection } = require("./matrix");

const logger = require("../../logger");


const updateNonMatrixHierarchyChildren = (
  question,
  nonMatrixQuestions,
  matrixQuestions,
  hierarchy,
  index,
  criteriaId,
  questions,
  matrixHierarchy
) => {

  logger.debug(`updateNonMatrixHierarchyChildren: question = ${question?._id} criteriaId=${criteriaId}`)

  let matched = isQuestionMatched(nonMatrixQuestions, question._id);

  if (matched === false) {
    matched = isQuestionMatchedInMatrixQuestions(
      matrixQuestions,
      criteriaId,
      question._id
    );

    if (matched === false) {
      hierarchy = updateHierarchyChildren(
        hierarchy,
        question?.migratedId,
        index
      );
      nonMatrixQuestions.push(question);
    }
  }


  return {
    hierarchy,
    nonMatrixQuestions,
    questions,
    matrixQuestions,
    matrixHierarchy,
  };
};

const getNonMatrixQuestions = async (
  question,
  questions,
  nonMatrixQuestions,
  matrixQuestions,
  matrixHierarchy,
  hierarchy,
  index,
  type,
  migratedCount,
  criteriaId
) => {
  logger.debug(`getNonMatrixQuestions: criteriaId = ${criteriaId} question = ${question?._id}`)

  question = await getQuestion(
    questions,
    nonMatrixQuestions,
    question._id,
    migratedCount
  );

  console.log("getNonMatrixQuestions", question);


  if (!isChildrenPresent(question) && !isVisibleIfPresent(question)) {

    console.log("getNonMatrixQuestions nonMatrix NoChildrenAndNoVisibleIf", )

    const data = nonMatrixNoChildrenAndNoVisibleIf(
      question,
      nonMatrixQuestions,
      matrixQuestions,
      hierarchy,
      index,
      criteriaId,
      questions,
      matrixHierarchy
    );

    nonMatrixQuestions = data.nonMatrixQuestions;
    hierarchy = data.hierarchy;
    questions = data.questions;
    matrixQuestions = data.matrixQuestions;
    matrixHierarchy = data.matrixHierarchy;

    console.log("getNonMatrixQuestions nonMatrix NoChildrenAndNoVisibleIf", )

  } else if (isChildrenPresent(question) && !isVisibleIfPresent(question)) {
 
    console.log("getNonMatrixQuestions nonMatrix ChildrenAndNoVisibleIf", )

    const data = await nonMatrixChildrenAndNoVisibleIf(
      question,
      questions,
      nonMatrixQuestions,
      matrixQuestions,
      matrixHierarchy,
      hierarchy,
      index,
      type,
      migratedCount,
      criteriaId
    );
    hierarchy = data.hierarchy;
    matrixHierarchy = data.matrixHierarchy;
    matrixQuestions = data.matrixQuestions;
    nonMatrixQuestions = data.nonMatrixQuestions;
    questions = data.questions;

  } else if (!isChildrenPresent(question) && isVisibleIfPresent(question)) {

    console.log("getNonMatrixQuestions nonMatrix NoChildrenAndVisibleIf", )


    const data = await nonMatrixNoChildrenAndVisibleIf(
      question,
      questions,
      nonMatrixQuestions,
      matrixQuestions,
      matrixHierarchy,
      hierarchy,
      index,
      type,
      migratedCount,
      criteriaId
    );
    hierarchy = data.hierarchy;
    matrixHierarchy = data.matrixHierarchy;
    matrixQuestions = data.matrixQuestions;
    nonMatrixQuestions = data.nonMatrixQuestions;
    questions = data.questions;

  }

  return {
    hierarchy,
    matrixHierarchy,
    matrixQuestions,
    nonMatrixQuestions,
    questions,
  };
};

const nonMatrixNoChildrenAndNoVisibleIf = (
  question,
  nonMatrixQuestions,
  matrixQuestions,
  hierarchy,
  index,
  criteriaId,
  questions,
  matrixHierarchy
) => {

  logger.debug(`nonMatrix NoChildrenAndNoVisibleIf: criteriaId = ${criteriaId} question = ${question?._id}`)

  return updateNonMatrixHierarchyChildren(
    question,
    nonMatrixQuestions,
    matrixQuestions,
    hierarchy,
    index,
    criteriaId,
    questions,
    matrixHierarchy
  );
};

const nonMatrixChildrenAndNoVisibleIf = async (
  question,
  questions,
  nonMatrixQuestions,
  matrixQuestions,
  matrixHierarchy,
  hierarchy,
  index,
  type,
  migratedCount,
  criteriaId
) => {

  logger.debug(`nonMatrix ChildrenAndNoVisibleIf: criteriaId = ${criteriaId} question = ${question?._id}`)

  const data = updateNonMatrixHierarchyChildren(
    question,
    nonMatrixQuestions,
    matrixQuestions,
    hierarchy,
    index,
    criteriaId,
    questions,
    matrixHierarchy
  );
  nonMatrixQuestions = data.nonMatrixQuestions;
  hierarchy = data.hierarchy;

  const children = question?.children || [];

  for (let i = 0; i < children.length; i++) {
    const childId = children[i];

    let child = await getQuestion(
      questions,
      nonMatrixQuestions,
      childId,
      migratedCount
    );

    logger.info(`nonMatrix ChildrenAndNoVisibleIf: criteriaId = ${criteriaId} question = ${question?._id} child: ${child?._id}  child responseType: ${child?.responseType}`)


    if (child.responseType === "matrix") {
      const data = await createSection(
        type,
        matrixHierarchy,
        matrixQuestions,
        questions,
        criteriaId,
        child,
        migratedCount
      );
      matrixQuestions = data.matrixQuestions;
      matrixHierarchy = data.matrixHierarchy;
      questions = data.questions;
    } else {

      hierarchy = updateHierarchyBranching(
        hierarchy,
        index,
        question?.migratedId,
        question,
        child
      );

    }
  }


  return {
    hierarchy,
    matrixHierarchy,
    matrixQuestions,
    nonMatrixQuestions,
    questions,
  };
};

const nonMatrixNoChildrenAndVisibleIf = async (
  question,
  questions,
  nonMatrixQuestions,
  matrixQuestions,
  matrixHierarchy,
  hierarchy,
  index,
  type,
  migratedCount,
  criteriaId
) => {

  const visible = question?.visibleIf ? question.visibleIf[0] : "";
  const parentId = visible._id;
  const pQuestion = await getQuestion(
    questions,
    nonMatrixQuestions,
    parentId,
    migratedCount
  );
  logger.debug(`nonMatrix NoChildrenAndVisibleIf: criteriaId = ${criteriaId} question = ${question?._id} question visibleif= ${visible}`)

  const data = updateNonMatrixHierarchyChildren(
    question,
    nonMatrixQuestions,
    matrixQuestions,
    hierarchy,
    index,
    criteriaId,
    questions,
    matrixHierarchy
  );
  nonMatrixQuestions = data.nonMatrixQuestions;
  hierarchy = data.hierarchy;

  if (pQuestion.responseType === "matrix") {
    const data = await createSection(
      type,
      matrixHierarchy,
      matrixQuestions,
      questions,
      criteriaId,
      pQuestion,
      migratedCount
    );
    matrixQuestions = data.matrixQuestions;
    matrixHierarchy = data.matrixHierarchy;
    questions = data.questions;

  } else {
    hierarchy = updateHierarchyBranching(
      hierarchy,
      index,
      pQuestion?.migratedId,
      pQuestion,
      question
    );
    const data = await getNonMatrixQuestions(
      pQuestion,
      questions,
      nonMatrixQuestions,
      matrixQuestions,
      matrixHierarchy,
      hierarchy,
      index,
      type,
      migratedCount,
      criteriaId
    );
    // return data;
    hierarchy = data.hierarchy;
    matrixHierarchy = data.matrixHierarchy;
    matrixQuestions = data.matrixQuestions;
    nonMatrixQuestions = data.nonMatrixQuestions;
    questions = data.questions;
  }

  return {
    hierarchy,
    matrixHierarchy,
    matrixQuestions,
    nonMatrixQuestions,
    questions,
  };
};

module.exports = {
  getNonMatrixQuestions,
};
