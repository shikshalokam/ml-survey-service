const {
  pick,
  isEmpty,
  findIndex,
  isArray,
  uniq,
} = require("lodash");
const {
  publishQuestionSet,
  updateQuestionSetHierarchy,
  readQuestionSetHierarchy,
} = require("../../api-list/question");
const { CONFIG } = require("../../constant/config");
const { updateById } = require("../../db");
const logger = require("../../logger");

const updateSolutionsDb = async (
  query,
  referenceQuestionsetId,
  migratedCount
) => {
  const res = await updateById(
    CONFIG.DB.TABLES.solutions,
    referenceQuestionsetId,
    query
  ).catch((err) => {
    logger.error(
      `Error while updating questionset in solutions collection: ${solution?._id}`
    );
  });

  if (query.hasOwnProperty("migrationReference.isHierarchyUpdated")) {
    migratedCount.success.questionSet.current.hierarchy++;
  }
  if (query.hasOwnProperty("migrationReference.isBranchingUpdated")) {
    migratedCount.success.questionSet.current.branching++;
  }
  if (query.hasOwnProperty("migrationReference.isPublished")) {
    migratedCount.success.questionSet.current.published++;
  }
};

const updateHierarchyTemplate = async (
  sectionsList,
  solution,
  programId,
  migratedCount
) => {
  logger.debug(
    `updateHierarchyTemplate: programId = ${programId}; solution: ${solution?._id}`
  );
  let updateHierarchyData = {};
  let query = {};
  if (!solution?.migrationReference?.isHierarchyUpdated) {
    updateHierarchyData = getHierarchyData(sectionsList, solution);
    const result = await updateQuestionSetHierarchy(updateHierarchyData).catch(
      (err) => {
        console.log("updateQuestionSetHierarchy Err", err?.response?.data);
        logger.error(`Error while updating the questionset for solution_id: ${solution?._id} Error:
          ${JSON.stringify(err.response.data)}`);
        if (
          !migratedCount.failed.questionSet.hierarchy.ids.includes(
            solution?.referenceQuestionSetId
          )
        ) {
          migratedCount.failed.questionSet.hierarchy.count++;
          migratedCount.failed.questionSet.hierarchy.ids.push(
            solution?.referenceQuestionSetId
          );
        }
      }
    );

    if (!result) {
      await updateSolutionsDb(query, solution?._id?.toString(), migratedCount);
      return;
    }
    query = {
      ...query,
      "migrationReference.isHierarchyUpdated": true,
    }

    solution.migrationReference.isHierarchyUpdated = true;
    
    updateHierarchyData = getHierarchyData(sectionsList,solution, result);

  } else {
    migratedCount.success.questionSet.existing.hierarchy++;
  }
  
  logger.info(
    `updateHierarchyTemplate: Hierarchydata = ${JSON.stringify(
      updateHierarchyData
    )}`
  );
  
  if (!solution.migrationReference.isBranchingUpdated) {
    updateHierarchyData = await branchingQuestionSetHierarchy(solution, sectionsList);

    if (updateHierarchyData) {
      const result = await updateQuestionSetHierarchy(updateHierarchyData).catch(
        (err) => {
          logger.error(`Error while updating the questionset branching for solution_id: ${  solution?._id} Error:
            ${JSON.stringify(err?.response?.data)}`);
  
          if (
            !migratedCount.failed.questionSet.branching.ids.includes(
               solution?.referenceQuestionSetId
            )
          ) {
            migratedCount.failed.questionSet.branching.count++;
            migratedCount.failed.questionSet.branching.ids.push(
               solution?.referenceQuestionSetId
            );
          }
        }
      );
  
      if (!result) {
        await updateSolutionsDb(query, solution?._id?.toString(), migratedCount);
        return;
      }
      query = {
        ...query,
        "migrationReference.isBranchingUpdated": true,
      };
    } else {
      if (
        !migratedCount.failed.questionSet.branching.ids.includes(
          solution?.referenceQuestionSetId
        )
      ) {
        migratedCount.failed.questionSet.branching.count++;
        migratedCount.failed.questionSet.branching.ids.push(
          solution?.referenceQuestionSetId
        );
      }
    }
  } else {
    migratedCount.success.questionSet.existing.branching++;
  }
  if (!solution.migrationReference?.isPublished) {
    const res = await publishQuestionSet(solution.referenceQuestionSetId).catch((err) => {
      logger.error(`Error while publishing the questionset for solution_id: ${solution?._id} === ${
        solution?.referenceQuestionSetId
      } Error:
          ${JSON.stringify(err.response.data)}`);

      if (
        !migratedCount.failed.questionSet.published.ids.includes(
          solution?.referenceQuestionSetId
        )
      ) {
        migratedCount.failed.questionSet.published.count++;

        migratedCount.failed.questionSet.published.ids.push(
          solution?.referenceQuestionSetId
        );
      }
    });
    if (!res) {
      await updateSolutionsDb(query, solution?._id?.toString(), migratedCount);
      return;
    }
    query = {
      ...query,
      "migrationReference.isPublished": true,
    };
  } else {
    migratedCount.success.questionSet.existing.published++;
  }
  const res = await updateSolutionsDb(query, solution?._id?.toString(), migratedCount);
};


const getHierarchyData = (sectionsList, solution, result={}) => {

  const sectionKeys = Object.keys(sectionsList);

  const hierarchyData = {
    request: {
      data: {
        nodesModified: {},
        hierarchy: {
        }
      }
    }
  };

  sectionKeys.map((section) => {
    if (sectionsList[section]?.children?.length > 0) {
      const sectionTitle = !isEmpty(result) ? result[sectionsList[section]?.sectionData?.name] : sectionsList[section]?.sectionData?.name
      const metadata = pick(sectionsList[section].sectionData, [
        "code",
        "name",
        "description",
        "mimeType",
        "primaryCategory",
        "allowMultipleInstances",
        "instances",
      ]);
      if (!hierarchyData.request.data.nodesModified.hasOwnProperty(sectionTitle)) {
        hierarchyData.request.data.nodesModified[
          sectionTitle
        ] = !isEmpty(result) ? {
          metadata: {
            ...metadata,
            allowBranching: "Yes",
            branchingLogic: sectionsList[section].branchingLogic
          },
          objectType: "QuestionSet",
          root: false,
          isNew: false,
        } :  {
          metadata: metadata,
          objectType: "QuestionSet",
          root: false,
          isNew: true,
        };
      }
      if (!isEmpty(result)) {
        hierarchyData.request.data.nodesModified = {
          ...hierarchyData.request.data.nodesModified,
          ...sectionsList[section]?.nodesModified,
        };
      }
      if (!hierarchyData?.request?.data?.hierarchy[solution?.referenceQuestionSetId]?.children?.includes(sectionTitle)) {
        if (hierarchyData.request.data.hierarchy[solution?.referenceQuestionSetId]?.children?.length > 0) {
          hierarchyData.request.data.hierarchy[solution?.referenceQuestionSetId]?.children.push(sectionTitle)
        } else {
          hierarchyData.request.data.hierarchy[solution?.referenceQuestionSetId] = {
            children: [sectionTitle],
            root: true
          };
        }
      }
      if (!hierarchyData?.request?.data?.hierarchy.hasOwnProperty(sectionTitle)) {
        hierarchyData.request.data.hierarchy[sectionTitle] = {
          children: uniq([...sectionsList[section].children]),
          root: false,
        }
      }
    }
  });
  return hierarchyData;
}


const branchingQuestionSetHierarchy = async (solution, sectionsList) => {
  logger.debug("branchingQuestionSetHierarchy", JSON.stringify(sectionsList));
  let questionSetHierarchy = {};
  if (solution.referenceQuestionSetId && solution?.migrationReference?.isHierarchyUpdated) {
    questionSetHierarchy = await readQuestionSetHierarchy(
      solution?.referenceQuestionSetId
    ).catch(err => {
      console.log("Error", err);
      return;
    });
  }

  const result = {};
  questionSetHierarchy?.children?.map(child => {
    result[child?.name] =  child?.identifier
  });

  if (!isEmpty(result)) {
    return getHierarchyData(sectionsList, solution, result);
  }

  return;

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
  logger.debug(
    `getPrecondition: parentId = ${parentId}; visible: ${JSON.stringify(
      visible
    )}`
  );
  return {
    and: [
      {
        [getOperator(visible)]: [
          {
            var: `${parentId}.response1.value`,
            type: "interactions",
          },
          [findIndex(parentQuestion.options, {
            value: isArray(visible?.value) ? visible?.value[0] : visible?.value,
          })],
        ],
      },
    ],
  };
};

module.exports = {
  updateHierarchyTemplate,
  getPrecondition,
  getOperator
};
