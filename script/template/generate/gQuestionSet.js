const { isEmpty, uniq, get } = require("lodash");
const { ObjectId } = require("mongodb");
const { createQuestionSet } = require("../../api-list/question");

const { CONFIG } = require("../../constant/config");
const { findAll, updateById } = require("../../db");
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

const getQuestionSetTemplates = async (solutions) => {
  const data = Promise.all(
    solutions.map(async (solution) => {
      console.log();
      console.log(
        "---------------------------solution---------------------------------------"
      );
      console.log();
      let programId = solution.sourcingProgramId;
      programId = await createProgramTemplate(solution, programId).catch(
        (err) => {
          console.log("Error while creating the Program", err.response.data);
        }
      );
      console.log();
      console.log(
        "-----------------------------program-------------------------------------"
      );
      console.log();
      console.log("ProgramId", programId);
      
      if (!programId) {
        console.log("programId empty", programId)
        return;
      }
      console.log("programId Present", programId)
      console.log();
      return getQuestionSetTemplate(solution, programId);
    })
  );
  
  return data;
};

const getQuestionSetTemplate = async (solution, programId) => {
  let templateData = setQuestionSetTemplate(solution, programId);

  const questionsetid = solution._id.toString();

  let hierarchy = {
    questionsetDbId: questionsetid,
    isHierarchyUpdated: solution.isHierarchyUpdated || false,
    sourcingProgramId: programId,
    criterias: [],
  };

  let questionSetMigratedId = solution.migratedId;

  if (!questionSetMigratedId) {
    questionSetMigratedId = await createQuestionSet(templateData).catch(
      (err) => {
        console.log("Error while creating Questionset", err.response.data);
      }
    );
    if (!questionSetMigratedId) {
      return;
    }
    await updateById(CONFIG.DB.TABLES.solutions, questionsetid, {
      migratedId: questionSetMigratedId,
      sourcingProgramId: programId,
    });
    hierarchy = {
      ...hierarchy,
      questionset: questionSetMigratedId,
    };
  } else {
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
          (criteriaMigratedId = criResult[0].migratedId || "")
        );
        hierarchy = questionTemplates.hierarchy;
      }
    }
  }
  console.log();
  console.log("hierarchyStructure", JSON.stringify(hierarchy));
  console.log();
  await updateHierarchyTemplate(hierarchy, solution, programId);
  return hierarchy;
};

const getQuestionTemplate = async (
  questions,
  hierarchy,
  index,
  criteria,
  type,
  criteriaId,
  criteriaMigratedId
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
    const templates = await getChildren(questionId, hierarchy, index);
  }

  hierarchy.criterias[index].questions = uniq(
    hierarchy.criterias[index].questions
  );

  return { questions, hierarchy };
};

const getChildren = async (questionId, hierarchy, index) => {
  const question = await getQuestionFromDB(questionId);
  const migratedId = await createQuestionTemplate(question);
  const parentId = migratedId;
  hierarchy = updateHierarchyChildren(hierarchy, migratedId, index);

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
        parentId
      );
    }

    if (!isChildrenPresent(question) && isVisibleIfPresent(question)) {
      return await IfNoChildrenAndVisibleIfAndInnerChildren(
        question,
        hierarchy,
        index
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
        matrixParentIdMigratedId = await createQuestionTemplate(question);
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
      const insMigratedId = await createQuestionTemplate(insQuestion);

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
  parentId
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
      const migratedId = await createQuestionTemplate(childQuestion);
      // hierarchy.criterias[index].questions.push(migratedId);
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
          childQuestion
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

const IfNoChildrenAndVisibleIf = async (parentQuestion, parentId, question) => {
  const visibleIf = question.visibleIf || [];
  let childBranching = {};
  for (let i = 0; i < visibleIf.length; i++) {
    const visible = visibleIf[i];
    const childId = question._id.toString();
    const chiQuestion = await getQuestionFromDB(childId);
    const migratedId = await createQuestionTemplate(chiQuestion);
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
  index
) => {
  const visibleIf = question.visibleIf || [];
  for (let i = 0; i < visibleIf.length; i++) {
    const visible = visibleIf[i];
    const parentId = visible._id.toString();
    const parentQuestion = await getQuestionFromDB(parentId);
    const migratedId = await createQuestionTemplate(parentQuestion);
    hierarchy.criterias[index].questions.push(migratedId);
    if (
      isChildrenPresent(parentQuestion) &&
      !isVisibleIfPresent(parentQuestion)
    ) {
      return await IfChildrenAndNoVisibleIf(
        parentQuestion,
        hierarchy,
        index,
        migratedId
      );
    }
  }
};

module.exports = {
  getQuestionSetTemplates,
};
