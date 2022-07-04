const {
  pick,
  findIndex,
  get,
  compact,
} = require("lodash");
const { publishQuestionSet, updateQuestionSetHierarchy } = require("../../api-list/question");
const { CONFIG } = require("../../constant/config");
const { updateById } = require("../../db");

const updateHierarchyChildren = (hierarchy, migratedId, index) => {
  if (!hierarchy.criterias[index].questions.includes(migratedId)) {
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
      await updateById(CONFIG.DB.TABLES.criteriaQuestions, criterias.criDbId, {
        migratedId: result[criterias.name],
      });
    }
  }

  if (!hierarchy.isBranchingUpdated) {
    const branchinghierarchy = branchingQuestionSetHierarchy(hierarchy);
    console.log("branchinghierarchy", JSON.stringify(branchinghierarchy));

    const result = await updateQuestionSetHierarchy(branchinghierarchy);
    await updateById(CONFIG.DB.TABLES.solutions, questionsetId, {
      isBranchingUpdated: true,
      sourcingProgramId: programId,
    });
  }
  await publishQuestionSet(hierarchy.questionset);
};

const branchingQuestionSetHierarchy = (hierarchy) => {
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



// const updateBranchingObject = (data, question, childId) => {
//   const { parentId } = data;
//   const matrixId = get(data, "matrix") ? data?.matrix?._id.toString() : "";

//   if (
//     !data.hierarchy.criterias[data.index].branchingLogic[
//       parentId
//     ].target.includes(question?.migratedId)
//   ) {
//     data.hierarchy.criterias[data.index].branchingLogic[parentId].target.push(
//       question?.migratedId
//     );
//   }

//   const ids = data.hierarchy.criterias[data.index].branchingLogic[
//     parentId
//   ].target.filter((ele) => ele !== childId && ele !== matrixId);

//   data.hierarchy.criterias[data.index].branchingLogic[parentId].target =
//     compact(ids);

//   delete data.hierarchy.criterias[data.index].branchingLogic[childId];
//   delete data.hierarchy.criterias[data.index].branchingLogic[matrixId];

//   const visible = question?.visibleIf ? question?.visibleIf[0] : {};
//   if (question?.migratedId) {
//     data.hierarchy.criterias[data.index].branchingLogic[question?.migratedId] =
//       {
//         target: [],
//         preCondition: {
//           and: [
//             {
//               [getOperator(visible)]: [
//                 {
//                   var: `${parentId}.response1.value`,
//                   type: "responseDeclaration",
//                 },
//                 `${findIndex(data?.parent?.options, {
//                   value: visible.value,
//                 })}`,
//               ],
//             },
//           ],
//         },
//         source: [parentId],
//       };
//   }

//   return data;
// };

// const updateChildBranching = (data, question, children) => {
//   const { parentId } = data;

//   for (let i = 0; i < children.length; i++) {
//     const childId = children[i].toString();

//     if (childId !== question._id.toString()) {
//       if (
//         !data.hierarchy.criterias[data.index].branchingLogic[
//           parentId
//         ].target.includes(childId)
//       ) {
//         data.hierarchy.criterias[data.index].branchingLogic[
//           parentId
//         ].target.push(childId);
//       }

//       data.hierarchy.criterias[data.index].branchingLogic[childId] = {
//         target: [],
//         preCondition: {},
//         source: [],
//       };
//     } else {
//       data = { ...updateBranchingObject(data, question) };
//     }
//   }

//   return data;
// };
