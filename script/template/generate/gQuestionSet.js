const { isEmpty, uniq, get } = require("lodash");
const { ObjectId } = require("mongodb");
const { createQuestionSet } = require("../../api-list/question");

const { CONFIG } = require("../../constant/config");
const { findAll, updateById } = require("../../db");
const logger = require("../../logger");
const {
  updateHierarchyChildren,
  getPrecondition,
  updateHierarchyTemplate,
} = require("../helpers/hierarchyHelper");
const {
  isVisibleIfPresent,
  isChildrenPresent,
  setQuestionSetTemplate,
  getQuestionFromDB,
  createQuestionTemplate,
} = require("../helpers/questionsetHelper");
const { createProgramTemplate } = require("./gProgram");

const getQuestionSetTemplates = async (solutions, migratedCount) => {
  const data = Promise.all(
    solutions.map(async (solution) => {
      let programId = solution.sourcingProgramId;
      console.log();
      console.log(
        "-----------------------sourcingProgramId----------------------",
        programId
      );
      console.log();
      programId = await createProgramTemplate(
        solution,
        programId,
        migratedCount
      );
      console.log();
      console.log(
        "-----------------------------program-------------------------------------"
      );
      console.log();
      console.log("ProgramId", programId);

      if (!programId) {
        return;
      }

      return getQuestionSetTemplate(solution, programId, migratedCount);
    })
  );
  return data;
};

const getQuestionSetTemplate = async (solution, programId, migratedCount) => {
  let templateData = setQuestionSetTemplate(solution, programId);

  const questionsetid = solution._id.toString();

  let hierarchy = {
    questionsetDbId: questionsetid,
    isHierarchyUpdated: solution.isHierarchyUpdated || false,
    isBranchingUpdated: solution.isBranchingUpdated || false,
    isPublished: solution.isPublished || false,
    sourcingProgramId: programId,
    isSrcProgramUpdated: solution.isSrcProgramUpdated || false,
    isSrcProgramPublished: solution.isSrcProgramPublished || false,
    isNominated: solution.isNominated || false,
    isContributorAdded: solution.isContributorAdded || false,
    isContributorAccepted: solution.isContributorAccepted || false,
    criterias: [],
  };

  let questionSetMigratedId = solution.migratedId;

  if (!questionSetMigratedId) {
    questionSetMigratedId = await createQuestionSet(templateData).catch(
      (err) => {
        console.log(`Error while creating Questionset for solution_id: ${questionsetid} Error:`,err?.response?.data)
        logger.error(`Error while creating Questionset for solution_id: ${questionsetid} Error:
        ${JSON.stringify(err?.response?.data)}`);

        migratedCount.failed.questionSet.migrated.count++;
        if (!migratedCount.failed.questionSet.migrated.ids.includes(id)) {
          migratedCount.failed.questionSet.migrated.ids.push(id);
        }
      }
    );
    if (!questionSetMigratedId) {
      return;
    }

    await updateById(CONFIG.DB.TABLES.solutions, questionsetid, {
      migratedId: questionSetMigratedId,
    });

    migratedCount.success.questionSet.current.migrated++;

    hierarchy = {
      ...hierarchy,
      questionset: questionSetMigratedId,
    };
  } else {
    migratedCount.success.questionSet.existing.migrated++;

    hierarchy = {
      ...hierarchy,
      questionset: questionSetMigratedId,
    };
  }

  if (solution.themes) {
    for (let i = 0; i < solution.themes.length; i++) {
      const theme = solution.themes[i];
      let criteriaArrayId = theme.criteria;
      for (let j = 0; j < criteriaArrayId.length; j++) {
        const criteria = criteriaArrayId[j];
        const criteriaId = criteria.criteriaId.toString();
        const criResult = await findAll(CONFIG.DB.TABLES.criteriaQuestions, {
          _id: ObjectId(criteriaId),
        });

        const questions = criResult
          ? criResult[0].evidences
            ? criResult[0].evidences[0].sections[0].questions
            : []
          : [];

        console.log();
        console.log(
          "criResultcriResult",
          criResult[0].name,
          "questions.length",
          questions.length
        );
        console.log();

        logger.info(`CriResult name:${criResult[0].name} criteria questions = ${questions.length}`)

        hierarchy.criterias.push({
          questions: [],
        });
        const questionTemplates = await getQuestionTemplate(
          questions,
          hierarchy,
          (index = j),
          criResult[0],
          solution.type,
          criteriaId,
          (criteriaMigratedId = criResult[0].migratedId || ""),
          migratedCount
        );
        hierarchy = questionTemplates.hierarchy;
      }
    }
  }

  await updateHierarchyTemplate(hierarchy, solution, programId, migratedCount);
  return hierarchy;
};

const getQuestionTemplate = async (
  questions,
  hierarchy,
  index,
  criteria,
  type,
  criteriaId,
  criteriaMigratedId,
  migratedCount
) => {
  hierarchy.criterias[index] = {
    migratedId: criteriaMigratedId,
    criDbId: criteriaId,
    code: criteria.externalId,
    name: criteria.name,
    description: criteria.description,
    mimeType: "application/vnd.sunbird.questionset",
    primaryCategory: type,
    questions: [],
    branchingLogic: {},
    allowMultipleInstances: "",
    instances: {},
  };
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const questionId = question._id.toString();
    const templates = await getChildren(
      questionId,
      hierarchy,
      index,
      migratedCount
    );
  }

  hierarchy.criterias[index].questions = uniq(
    hierarchy.criterias[index].questions
  );

  return { questions, hierarchy };
};

const getChildren = async (questionId, hierarchy, index, migratedCount) => {
  const question = await getQuestionFromDB(questionId);
  const migratedId = await createQuestionTemplate(question, migratedCount);
  const parentId = migratedId;
  hierarchy = updateHierarchyChildren(hierarchy, migratedId, index);

  logger.info(`getChildren of questionId: ${questionId} and questiontype: ${question?.responseType}`)

  if (question.responseType !== "matrix") {
    if (!isChildrenPresent(question) && !isVisibleIfPresent(question)) {
      hierarchy = updateHierarchyChildren(hierarchy, parentId, index);
      return hierarchy;
    }

    if (isChildrenPresent(question) && !isVisibleIfPresent(question)) {
      const data = await IfChildrenAndNoVisibleIf(
        question,
        hierarchy,
        index,
        parentId,
        migratedCount
      );
    }

    if (!isChildrenPresent(question) && isVisibleIfPresent(question)) {
      return await IfNoChildrenAndVisibleIfAndInnerChildren(
        question,
        hierarchy,
        index,
        migratedCount
      );
    }
  } else if (question.responseType === "matrix") {
    const instanceQuestions = question?.instanceQuestions;
    if (hierarchy.criterias[index]) {
      hierarchy.criterias[index] = {
        ...hierarchy.criterias[index],
        allowMultipleInstances: "Yes",
        instances: { label: question.instanceIdentifier },
      };
    }

    const visible = !isEmpty(get(question, "visibleIf"))
      ? question?.visibleIf[0]
      : {};

    let matrixParentId = "";
    let matrixParentQuestion = {};
    let matrixParentIdMigratedId = "";
    if (!isEmpty(visible)) {
      matrixParentId = visible._id;
      matrixParentQuestion = await getQuestionFromDB(matrixParentId);
      matrixParentIdMigratedId = matrixParentQuestion?.migratedId || "";
      if (!matrixParentIdMigratedId) {
        matrixParentIdMigratedId = await createQuestionTemplate(
          question,
          migratedCount
        );
      }
      hierarchy = updateHierarchyChildren(
        hierarchy,
        matrixParentIdMigratedId,
        index
      );
    }

    for (let i = 0; i < instanceQuestions.length; i++) {
      const instanceQuestionId = instanceQuestions[i];
      const insQuestion = await getQuestionFromDB(instanceQuestionId);
      const insMigratedId = await createQuestionTemplate(
        insQuestion,
        migratedCount
      );

      hierarchy = updateHierarchyChildren(hierarchy, insMigratedId, index);

      if (!isEmpty(visible)) {
        if (
          hierarchy.criterias[index].branchingLogic.hasOwnProperty(
            matrixParentIdMigratedId
          )
        ) {
          hierarchy.criterias[index].branchingLogic[
            matrixParentIdMigratedId
          ].target.push(insMigratedId);

          if (insMigratedId) {
            hierarchy.criterias[index].branchingLogic[insMigratedId] = {
              target: [],
              preCondition: getPrecondition(
                visible,
                matrixParentIdMigratedId,
                matrixParentQuestion
              ),
              source: [matrixParentIdMigratedId],
            };
          }
        } else {
          {
            hierarchy.criterias[index].branchingLogic[
              matrixParentIdMigratedId
            ] = {
              target: [insMigratedId],
              preCondition: {},
              source: [],
            };

            if (insMigratedId) {
              hierarchy.criterias[index].branchingLogic[insMigratedId] = {
                target: [],
                preCondition: getPrecondition(
                  visible,
                  matrixParentIdMigratedId,
                  matrixParentQuestion
                ),
                source: [matrixParentIdMigratedId],
              };
            }
          }
        }
      }
    }
  }
};

const IfChildrenAndNoVisibleIf = async (
  question,
  hierarchy,
  index,
  parentId,
  migratedCount
) => {
  let branching = {
    [parentId]: {
      target: [],
      preCondition: {},
      source: [],
    },
  };

  if (question.children && question.children.length && !question.visibleIf) {
    const children = question.children;
    for (let i = 0; i < children.length; i++) {
      const childId = children[i].toString();
      const childQuestion = await getQuestionFromDB(childId);
      const migratedId = await createQuestionTemplate(
        childQuestion,
        migratedCount
      );
      hierarchy = updateHierarchyChildren(hierarchy, migratedId, index);

      if (migratedId) {
        branching[parentId].target.push(migratedId);
      }

      if (
        !isChildrenPresent(childQuestion) &&
        isVisibleIfPresent(childQuestion)
      ) {
        const childBranching = await IfNoChildrenAndVisibleIf(
          question,
          parentId,
          childQuestion,
          migratedCount
        );

        branching = {
          ...branching,
          ...childBranching,
        };
      }
    }
  }

  hierarchy.criterias[index].branchingLogic = branching;
  return hierarchy;
};

const IfNoChildrenAndVisibleIf = async (
  parentQuestion,
  parentId,
  question,
  migratedCount
) => {
  const visibleIf = question.visibleIf || [];
  let childBranching = {};
  for (let i = 0; i < visibleIf.length; i++) {
    const visible = visibleIf[i];
    const childId = question._id.toString();
    const chiQuestion = await getQuestionFromDB(childId);
    const migratedId = await createQuestionTemplate(chiQuestion, migratedCount);
    if (migratedId) {
      childBranching = {
        [migratedId]: {
          target: [],
          preCondition: getPrecondition(visible, parentId, parentQuestion),
          source: [parentId],
        },
      };
    }
  }
  return childBranching;
};

const IfNoChildrenAndVisibleIfAndInnerChildren = async (
  question,
  hierarchy,
  index,
  migratedCount
) => {
  const visibleIf = question.visibleIf || [];
  for (let i = 0; i < visibleIf.length; i++) {
    const visible = visibleIf[i];
    const parentId = visible._id.toString();
    const parentQuestion = await getQuestionFromDB(parentId);
    const migratedId = await createQuestionTemplate(
      parentQuestion,
      migratedCount
    );
    hierarchy.criterias[index].questions.push(migratedId);
    if (
      isChildrenPresent(parentQuestion) &&
      !isVisibleIfPresent(parentQuestion)
    ) {
      return await IfChildrenAndNoVisibleIf(
        parentQuestion,
        hierarchy,
        index,
        migratedId,
        migratedCount
      );
    }
  }
};

module.exports = {
  getQuestionSetTemplates,
};
