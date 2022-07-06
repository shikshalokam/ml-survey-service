const { pick, findIndex, get, compact, find, omit } = require("lodash");
const {
  publishQuestionSet,
  updateQuestionSetHierarchy,
  readQuestionSetHierarchy,
} = require("../../api-list/question");
const { CONFIG } = require("../../constant/config");
const { updateById } = require("../../db");

const updateHierarchyChildren = (hierarchy, migratedId, index) => {
  if (
    migratedId &&
    !hierarchy.criterias[index].questions.includes(migratedId)
  ) {
    hierarchy.criterias[index].questions.push(migratedId);
  }
  return hierarchy;
};


const getOperator = (visibleIf) => {
  const operator =
    visibleIf.operator === "==="
      ? "eq"
      : visibleIf.operator === "!==" || visibleIf.operator === "!="
      ? "ne"
      : "";

  return operator;
};

const getPrecondition = (visible, parentId, parentQuestion) => {
  return {
    and: [
      {
        [getOperator(visible)]: [
          {
            var: `${parentId}.response1.value`,
            type: "responseDeclaration",
          },
          findIndex(parentQuestion.options, {
            value: visible.value,
          }),
        ],
      },
    ],
  }
}


const updateHierarchyTemplate = async (hierarchy, solution, programId) => {
  const updateHierarchyData = {
    request: {
      data: {
        nodesModified: {},
        hierarchy: {
          [hierarchy.questionset]: {
            children: [],
            root: true,
          },
        },
      },
    },
  };

  for (let i = 0; i < hierarchy.criterias.length; i++) {
    const criteria = hierarchy.criterias[i];
    const metadata = pick(criteria, [
      "code",
      "name",
      "description",
      "mimeType",
      "primaryCategory",
      "allowMultipleInstances",
      "instances",
    ]);
    updateHierarchyData.request.data.nodesModified[criteria.name] = {
      metadata: {
        ...metadata,
      },
      objectType: "QuestionSet",
      root: false,
      isNew: true,
    };
    updateHierarchyData.request.data.hierarchy[
      hierarchy.questionset
    ].children.push(criteria.name);

    updateHierarchyData.request.data.hierarchy[criteria.name] = {
      children: compact(criteria.questions),
      root: false,
    };
  }

  console.log("updateHierarchydata", JSON.stringify(updateHierarchyData));
  console.log();
  const questionsetId = hierarchy.questionsetDbId;

  if (!hierarchy.isHierarchyUpdated) {
    const result = await updateQuestionSetHierarchy(updateHierarchyData);

    await updateById(CONFIG.DB.TABLES.solutions, questionsetId, {
      isHierarchyUpdated: true,
      isBranchingUpdated: false,
      sourcingProgramId: programId,
    });
    for (let i = 0; i < hierarchy.criterias.length; i++) {
      const criterias = hierarchy.criterias[i];
      hierarchy.criterias[i].migratedId = result[criterias.name];
    }
  }

  if (!hierarchy.isBranchingUpdated) {
    const branchinghierarchy = await branchingQuestionSetHierarchy(hierarchy);
    console.log("branchinghierarchy", JSON.stringify(branchinghierarchy));

    const result = await updateQuestionSetHierarchy(branchinghierarchy).catch(
      (err) => {
        console.log(
          "Error while updating the questionset branching",
          err.response.data
        );
      }
    );
    if (result) {
      await updateById(CONFIG.DB.TABLES.solutions, questionsetId, {
        isBranchingUpdated: true,
        sourcingProgramId: programId,
      });
      await publishQuestionSet(hierarchy.questionset);
    }
  }
};

const branchingQuestionSetHierarchy = async (hierarchy) => {
  let questionSetHierarchy = {};
  if (hierarchy.questionset && hierarchy.isHierarchyUpdated) {
      questionSetHierarchy = await readQuestionSetHierarchy(
      hierarchy.questionset
    );
  }

  const updateHierarchyData = {
    request: {
      data: {
        nodesModified: {},
        hierarchy: {
          [hierarchy.questionset]: {
            children: [],
            root: true,
          },
        },
      },
    },
  };
  for (let i = 0; i < hierarchy.criterias.length; i++) {
    const criteria = hierarchy.criterias[i];
    const hierarchyData = find(questionSetHierarchy.children, {
      name: criteria?.name,
    });
    criteria.migratedId =
      hierarchy.questionset && hierarchy.isHierarchyUpdated
        ? hierarchyData?.identifier
        : criteria.migratedId;

    const metadata = pick(criteria, [
      "code",
      "name",
      "description",
      "mimeType",
      "primaryCategory",
      "allowMultipleInstances",
      "instances",
    ]);
    updateHierarchyData.request.data.nodesModified[criteria.migratedId] = {
      metadata: {
        ...metadata,
        allowBranching: "Yes",
        branchingLogic: get(criteria, "branchingLogic") || {},
      },
      objectType: "QuestionSet",
      root: false,
      isNew: false,
    };
    updateHierarchyData.request.data.hierarchy[
      hierarchy.questionset
    ].children.push(criteria.migratedId);

    updateHierarchyData.request.data.hierarchy[criteria.migratedId] = {
      children: compact(criteria.questions),
      root: false,
    };
  }
  return updateHierarchyData;
};

module.exports = {
  updateHierarchyChildren,
  updateHierarchyTemplate,
  branchingQuestionSetHierarchy,
  getOperator,
  getPrecondition
};

