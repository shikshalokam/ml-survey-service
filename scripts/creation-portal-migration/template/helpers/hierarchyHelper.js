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

/**
* Update the query fields in solutions collections
* @method
* @name updateSolutionsDb
* @param {Object} query - fields to update in mongodb.
* @param {String} referenceQuestionsetId - referenceQuestionsetId.
* @param {Object} migratedCount - migratedCount to increment the count.
*/
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

/**
* Update the questionset hierarchy and branching logic
* @method
* @name updateHierarchyTemplate
* @param {Object[]} sectionsList - sectionsList.
* @param {Object} solution - solution.
* @param {String} programId - programId.
* @param {Object} migratedCount - migratedCount to increment the count.
*/
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
        logger.error(`Error while updating the questionset for solution_id: ${solution?._id} Error:
          ${JSON.stringify(err.response.data)}`);
        // increment questionSet hierarchy failed count and store the id

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

    updateHierarchyData = getHierarchyData(sectionsList, solution, result);

  } else {
    // increment questionSet hierarchy success count
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
          logger.error(`Error while updating the questionset branching for solution_id: ${solution?._id} Error:
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
        // Update the solutions collection with hierarchy update  status 
        await updateSolutionsDb(query, solution?._id?.toString(), migratedCount);
        return;
      }
      query = {
        ...query,
        "migrationReference.isBranchingUpdated": true,
      };
    } else {
      // increment questionSet branching failed count and store the id
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
    // increment questionSet branching success count
    migratedCount.success.questionSet.existing.branching++;
  }

  if (!solution.migrationReference?.isPublished) {
    const res = await publishQuestionSet(solution.referenceQuestionSetId).catch((err) => {
      logger.error(`Error while publishing the questionset for solution_id: ${solution?._id} === ${solution?.referenceQuestionSetId
        } Error:
          ${JSON.stringify(err.response.data)}`);
      // increment questionSet published failed count and store the id

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
      // Update the solutions collection with hierarchy update and branching update status 
      await updateSolutionsDb(query, solution?._id?.toString(), migratedCount);
      return;
    }
    query = {
      ...query,
      "migrationReference.isPublished": true,
    };
  } else {
    // increment questionSet published success count
    migratedCount.success.questionSet.existing.published++;
  }

  // Update the solutions collection with hierarchy update and branching update and published status 
  const res = await updateSolutionsDb(query, solution?._id?.toString(), migratedCount);
};


/**
* To form the request data to the required hierarchy format
* @method
* @name getHierarchyData
* @param {Object[]} sectionsList - sectionsList.
* @param {Object} solution - solution.
* @param {Object} result -
    {
      "Comments and Reflection:": "do_21377895770669056011493",
      "Comments and Reflection: 2": "do_21377895770669056011495"
    }
* @returns {JSON} - returns the formatted request hierarchy
**/

const getHierarchyData = (sectionsList, solution, result = {}) => {
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
        } : {
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


/**
* To get the branchingLogic request for the questionset
* @method
* @name branchingQuestionSetHierarchy
* @param {Object} solution - solution.
* @param {Object[]} sectionsList - sectionsList.
* @returns {JSON} - returns the formatted request hierarchy with branching Logic
**/

const branchingQuestionSetHierarchy = async (solution, sectionsList) => {
  logger.debug("branchingQuestionSetHierarchy", JSON.stringify(sectionsList));
  let questionSetHierarchy = {};
  if (solution.referenceQuestionSetId && solution?.migrationReference?.isHierarchyUpdated) {
    // Called If the questionset hierarchy is but updated fails to update the branchig Logic
    questionSetHierarchy = await readQuestionSetHierarchy(
      solution?.referenceQuestionSetId
    ).catch(err => {
      console.log("Error", err);
      return;
    });
  }

  const result = {};
  /** create the result object with child name: identifier
   Ex: 
   {
    "Comments and Reflection:": "do_21377895770669056011493",
    "Comments and Reflection: 2": "do_21377895770669056011495"
   }
  **/
  questionSetHierarchy?.children?.map(child => {
    result[child?.name] = child?.identifier
  });

  if (!isEmpty(result)) {
    return getHierarchyData(sectionsList, solution, result);
  }

  return;

};

/**
* To get the child condition operator
* @method
* @name getOperator
* @param {Object} visibleIf - visibleIf.
* @returns {JSON} - operator
**/
const getOperator = (visibleIf) => {
  const operator =
    visibleIf.operator === "==="
      ? "eq"
      : visibleIf.operator === "!==" || visibleIf.operator === "!="
        ? "ne"
        : "";

  return operator;
};

/**
* Forms and returns the child precondition
* @method
* @name getPrecondition
* @param {Object} visible - visible.
* @param {String} parentId - parentId.
* @param {Object} visible - visible.
* @returns {JSON} - returns the precondition
**/
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
