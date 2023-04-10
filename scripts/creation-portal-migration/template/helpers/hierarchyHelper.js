const {
  pick,
  findIndex,
  get,
  compact,
  find,
  omit,
  isArray,
  uniq,
} = require("lodash");
const {
  publishQuestionSet,
  updateQuestionSetHierarchy,
  readQuestionSetHierarchy,
} = require("../../api-list/question");
const { CONFIG } = require("./../../constant/config");
const { updateById } = require("../../db");
const logger = require("../../logger");

const updateHierarchyChildren = (
  hierarchy,
  referenceQuestionId,
  index,
  question
) => {
  logger.debug(
    `updateHierarchyChildren: referenceQuestionId = ${referenceQuestionId}`
  );

  if (
    referenceQuestionId &&
    !hierarchy.criterias[index].questions.includes(referenceQuestionId)
  ) {
    hierarchy.criterias[index].questions.push(referenceQuestionId);
  }

  if (question?.page) {
    const page = question?.page ? question?.page?.trim() : ""
    if (
      hierarchy.criterias[index].pageQuestions.hasOwnProperty(page)
    ) {
      if (
        !hierarchy.criterias[index].pageQuestions[page].includes(
          referenceQuestionId
        )
      ) {
        hierarchy.criterias[index].pageQuestions[page].push(
          referenceQuestionId
        );
      }
    } else {
      hierarchy.criterias[index].pageQuestions[page] = [
        referenceQuestionId,
      ];
    }
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

const updateHierarchyTemplate = async (
  hierarchy,
  solution,
  programId,
  migratedCount
) => {
  // console.log("updateHierarchyTemplate", JSON.stringify(hierarchy));
  await updateCriteriasList(hierarchy, solution, programId, migratedCount);
};

const branchingQuestionSetHierarchy = async (hierarchy, newCriterias) => {

  logger.debug("branchingQuestionSetHierarchy", JSON.stringify(hierarchy));


  let questionSetHierarchy = {};
  if (hierarchy.questionset && hierarchy.isHierarchyUpdated) {
    questionSetHierarchy = await readQuestionSetHierarchy(
      hierarchy?.questionset
    ).catch(err => {
      console.log("Error", err);
      return;
    });
    console.log("questionset", hierarchy.questionset )
    logger.info(`${"questionset", hierarchy.questionset, "questionSetHierarchy", questionSetHierarchy }`)
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


  for (let i = 0; i < newCriterias.length; i++) {
    const criteria = newCriterias[i];
    const hierarchyData = find(questionSetHierarchy.children, {
      name: criteria?.name,
    });
    criteria.referenceQuestionSetId =
      hierarchy.questionset && hierarchy.isHierarchyUpdated
        ? hierarchyData?.identifier
        : criteria.referenceQuestionSetId;
    if (criteria?.referenceQuestionSetId) {
      const metadata = pick(criteria, [
        "code",
        "name",
        "description",
        "mimeType",
        "primaryCategory",
        "allowMultipleInstances",
        "instances",
      ]);
      updateHierarchyData.request.data.nodesModified[
        criteria.referenceQuestionSetId
      ] = {
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
      ].children.push(criteria.referenceQuestionSetId);

      updateHierarchyData.request.data.hierarchy[
        criteria.referenceQuestionSetId
      ] = {
        children: compact(criteria.questions),
        root: false,
      };
    }
  }


  updateHierarchyData.request.data.hierarchy[hierarchy.questionset].children = uniq(updateHierarchyData.request.data.hierarchy[hierarchy.questionset].children);
  return updateHierarchyData;
};

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

const updateCriteriasList = async (
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


  let pageSections = {};
  const newCriterias = [];

  for (let i = 0; i < hierarchy.criterias.length; i++) {
    let criteria = hierarchy.criterias[i];
    const pageKeys = Object.keys(criteria.pageQuestions) || [];
    const branchingKeys = Object.keys(criteria.branchingLogic) || [];
    let questionsCopy = [];
    if (!criteria.isMatrix) {
      questionsCopy = criteria.questions;
      for (let index = 0; index < criteria.questions.length; index++) {
        const qId = criteria.questions[index];
        if (branchingKeys.includes(qId)) {
          if (criteria.branchingLogic[qId].target.length > 0) {
            const data = updatePageData(
              pageKeys,
              criteria,
              pageSections,
              questionsCopy,
              qId,
              qId,
              true
            );
            questionsCopy = data.questionsCopy;
            pageSections = data.pageSections;
            criteria = data.criteria;
          } else {
            const parentId = criteria.branchingLogic[qId].source[0];
            const data = updatePageData(
              pageKeys,
              criteria,
              pageSections,
              questionsCopy,
              parentId,
              qId,
              true
            );
            questionsCopy = data.questionsCopy;
            pageSections = data.pageSections;
            criteria = data.criteria;
          }
        } else {
          const data = updatePageData(
            pageKeys,
            criteria,
            pageSections,
            questionsCopy,
            qId,
            qId,
            false
          );
          questionsCopy = data.questionsCopy;
          pageSections = data.pageSections;
          criteria = data.criteria;
        }
      }
      // console.log("questionscioy", questionsCopy.length, criteria?.name, criteria?.branchingLogic)
      if (questionsCopy.length > 0) {
        criteria.questions = questionsCopy;
        newCriterias.push(criteria);
      }
    } else {
      newCriterias.push(criteria);
    }
  }

  const pageSectionKeys = Object.keys(pageSections);
  for (
    let pageSectionIndex = 0;
    pageSectionIndex < pageSectionKeys.length;
    pageSectionIndex++
  ) {
    // console.log();
    // console.log(
    //   "pageSectionkeys",
    //   pageSectionKeys,
    //   pageSections[pageSectionIndex]
    // );
    // console.log();

    newCriterias.push(pageSections[pageSectionKeys[pageSectionIndex]]);
  }

  for (let section = 0; section < newCriterias.length; section++) {
    const sectionData = newCriterias[section];
    const metadata = pick(sectionData, [
      "code",
      "name",
      "description",
      "mimeType",
      "primaryCategory",
      "allowMultipleInstances",
      "instances",
    ]);
    updateHierarchyData.request.data.nodesModified[sectionData.name] = {
      metadata: {
        ...metadata,
      },
      objectType: "QuestionSet",
      root: false,
      isNew: true,
    };
    updateHierarchyData.request.data.hierarchy[
      hierarchy.questionset
    ].children.push(sectionData?.name);

    updateHierarchyData.request.data.hierarchy[sectionData.name] = {
      children: compact(sectionData.questions),
      root: false,
    };
  }

  logger.info(
    `updateHierarchyTemplate: Hierarchydata = ${JSON.stringify(
      updateHierarchyData
    )}`
  );

  const questionsetId = hierarchy.questionsetDbId;
  let query = {};
  if (!hierarchy.isHierarchyUpdated) {
    updateHierarchyData.request.data.hierarchy[hierarchy.questionset].children = uniq(updateHierarchyData.request.data.hierarchy[hierarchy.questionset].children);
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
      "migrationReference.isHierarchyUpdated": true,
    };

    for (let i = 0; i < newCriterias.length; i++) {
      const criterias = newCriterias[i];
      newCriterias[i].referenceQuestionSetId = result[criterias.name];
    }
  } else {
    migratedCount.success.questionSet.existing.hierarchy++;
  }

  if (!hierarchy.isBranchingUpdated) {
    const branchinghierarchy = await branchingQuestionSetHierarchy(
      hierarchy,
      newCriterias
    );

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
      "migrationReference.isBranchingUpdated": true,
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
      "migrationReference.isPublished": true,
    };
  } else if (hierarchy.isPublished) {
    migratedCount.success.questionSet.existing.published++;
  }
  const res = await updateSolutionsDb(query, questionsetId, migratedCount);
};

const updatePageData = (
  pageKeys,
  criteria,
  pageSections,
  questionsCopy,
  idInPages,
  idToAdd,
  isBranching
) => {
  let pageName = "";
  for (let page = 0; page < pageKeys.length; page++) {
    pageName = criteria.pageQuestions[pageKeys[page]].includes(idInPages)
      ? pageKeys[page].trim()
      : pageName.trim();
  }
  if (pageName && pageSections.hasOwnProperty(pageName)) {
    if (!pageSections[pageName].questions.includes(idToAdd)) {
      pageSections[pageName].questions.push(idToAdd);
      questionsCopy = questionsCopy.filter((id) => id !== idToAdd);
    } else {
      questionsCopy = questionsCopy.filter((id) => id !== idToAdd);
    }
  } else if (pageName && !pageSections.hasOwnProperty(pageName)) {
    questionsCopy = questionsCopy.filter((id) => id !== idToAdd);
    pageSections[pageName] = {
      questions: [idToAdd],
      referenceQuestionSetId: "",
      criDbId: "",
      code: criteria?.code,
      name: `Page ${pageName}`,
      description: `Description ${pageName}`,
      mimeType: "application/vnd.sunbird.questionset",
      primaryCategory: "observation",
      allowMultipleInstances: "",
      instances: {},
      branchingLogic: {},
      isMatrix: false,
    };
  }

  if (pageName && isBranching) {
    const branching = criteria.branchingLogic[idToAdd];

    if (!pageSections[pageName].branchingLogic.hasOwnProperty(idToAdd)) {
      pageSections[pageName].branchingLogic = {
        ...pageSections[pageName].branchingLogic,
        [idToAdd]: {...branching},
      };
      delete criteria.branchingLogic[idToAdd];
    }

    for (let target=0; target < branching.target.length; target++) {
      
      if (!pageSections[pageName].branchingLogic.hasOwnProperty(idToAdd)) {
      pageSections[pageName].branchingLogic = {
        ...pageSections[pageName].branchingLogic,
        [branching.target[target]]: criteria.branchingLogic[branching.target[target]] ,
      };
      delete criteria.branchingLogic[branching.target[target]];
    }
  }
    
  }

  return { questionsCopy, pageSections, criteria };
};

module.exports = {
  updateHierarchyChildren,
  updateHierarchyTemplate,
  branchingQuestionSetHierarchy,
  getOperator,
  getPrecondition,
};
