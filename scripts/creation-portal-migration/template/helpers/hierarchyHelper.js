const {
  pick,
  findIndex,
  get,
  compact,
  find,
  omit,
  isArray,
} = require("lodash");
const {
  publishQuestionSet,
  updateQuestionSetHierarchy,
  readQuestionSetHierarchy,
} = require("../../api-list/question");
const { CONFIG } = require("./../../constant/config");
const { updateById } = require("../../db");
const logger = require("../../logger");

const updateHierarchyChildren = (hierarchy, migratedId, index) => {

  logger.debug(`updateHierarchyChildren: migratedId = ${migratedId}`)


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
  logger.debug(`getPrecondition: parentId = ${parentId}; visible: ${visible}`);

  return {
    and: [
      {
        [getOperator(visible)]: [
          {
            var: `${parentId}.response1.value`,
            type: "interactions",
          },
          findIndex(parentQuestion.options, {
            value: isArray(visible?.value) ? visible?.value[0] : visible?.value,
          }),
        ],
      },
    ],
  };
};

const updateHierarchyTemplate = async (
  hierarchy,
  solution,
  programId,
  migratedCount
) => {
  logger.debug(
    `updateHierarchyTemplate: programId = ${programId}; solution: ${solution?._id}`
  );
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

  logger.info(
    `updateHierarchyTemplate: Hierarchydata = ${JSON.stringify(
      updateHierarchyData
    )}`
  );

  const questionsetId = hierarchy.questionsetDbId;
  let query = {};
  if (!hierarchy.isHierarchyUpdated) {
    const result = await updateQuestionSetHierarchy(updateHierarchyData).catch(
      (err) => {
        logger.error(`Error while updating the questionset for solution_id: ${questionsetId} Error:
      ${JSON.stringify(err.response.data)}`);

        if (
          !migratedCount.failed.questionSet.hierarchy.ids.includes(
            hierarchy?.questionset
          )
        ) {
          migratedCount.failed.questionSet.hierarchy.count++;
          migratedCount.failed.questionSet.hierarchy.ids.push(
            hierarchy?.questionset
          );
        }
      }
    );

    if (!result) {
      await updateSolutionsDb(query, questionsetId, migratedCount);
      return;
    }
    query = {
      ...query,
      isHierarchyUpdated: true,
    };

    for (let i = 0; i < hierarchy.criterias.length; i++) {
      const criterias = hierarchy.criterias[i];
      hierarchy.criterias[i].migratedId = result[criterias.name];
    }
  } else {
    migratedCount.success.questionSet.existing.hierarchy++;
  }

  if (!hierarchy.isBranchingUpdated) {
    const branchinghierarchy = await branchingQuestionSetHierarchy(hierarchy);
    console.log("branchinghierarchy", JSON.stringify(branchinghierarchy));

    const result = await updateQuestionSetHierarchy(branchinghierarchy).catch(
      (err) => {
        logger.error(`Error while updating the questionset branching for solution_id: ${questionsetId} Error:
      ${JSON.stringify(err.response.data)}`);

        if (
          !migratedCount.failed.questionSet.branching.ids.includes(
            hierarchy?.questionset
          )
        ) {
          migratedCount.failed.questionSet.branching.count++;
          migratedCount.failed.questionSet.branching.ids.push(
            hierarchy?.questionset
          );
        }
      }
    );
    if (!result) {
      await updateSolutionsDb(query, questionsetId, migratedCount);
      return;
    }
    query = {
      ...query,
      isBranchingUpdated: true,
    };
  } else {
    migratedCount.success.questionSet.existing.branching++;
  }

  if (!hierarchy.isPublished) {
    const res = await publishQuestionSet(hierarchy.questionset).catch((err) => {
      logger.error(`Error while publishing the questionset for solution_id: ${questionsetId} === ${
        hierarchy?.questionset
      } Error:
      ${JSON.stringify(err.response.data)}`);

      if (
        !migratedCount.failed.questionSet.published.ids.includes(
          hierarchy?.questionset
        )
      ) {
        migratedCount.failed.questionSet.published.count++;

        migratedCount.failed.questionSet.published.ids.push(
          hierarchy?.questionset
        );
      }
    });
    if (!res) {
      await updateSolutionsDb(query, questionsetId, migratedCount);
      return;
    }
    query = {
      ...query,
      isPublished: true,
    };
  } else if (hierarchy.isPublished) {
    migratedCount.success.questionSet.existing.published++;
  }
  const res = await updateSolutionsDb(query, questionsetId, migratedCount);
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
    if (criteria?.migratedId) {
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
  }
  return updateHierarchyData;
};

const updateSolutionsDb = async (query, questionsetId, migratedCount) => {
  const res = await updateById(
    CONFIG.DB.TABLES.solutions,
    questionsetId,
    query
  ).catch((err) => {
    logger.error(
      `Error while updating questionset in solutions collection: ${solution?._id}`
    );
  });

  if (query.hasOwnProperty("isHierarchyUpdated")) {
    migratedCount.success.questionSet.current.hierarchy++;
  }
  if (query.hasOwnProperty("isBranchingUpdated")) {
    migratedCount.success.questionSet.current.branching++;
  }
  if (query.hasOwnProperty("isPublished")) {
    migratedCount.success.questionSet.current.published++;
  }
};

module.exports = {
  updateHierarchyChildren,
  updateHierarchyTemplate,
  branchingQuestionSetHierarchy,
  getOperator,
  getPrecondition,
};
