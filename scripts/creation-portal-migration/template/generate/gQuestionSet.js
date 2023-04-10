const { ObjectId, ObjectID } = require("mongodb");
const { createQuestionSet } = require("../../api-list/question");

const { CONFIG } = require("../../constant/config");
const { findAll, updateById } = require("../../db");
const logger = require("../../logger");
const { updateHierarchyTemplate, getPrecondition } = require("../helpers/hierarchyHelper");

const {
  setQuestionSetTemplate,
  createQuestionTemplate,
} = require("../helpers/questionsetHelper");
const { createProgramTemplate } = require("./gProgram");
const { getCriteriaData } = require("../migrate/common");
const { isEmpty, omit, uniq, compact } = require("lodash");

const getQuestionSetTemplates = async (solutions, migratedCount) => {
  const data = [];
  // solutions.map(async (solution) => {
  for (let solution of solutions) {
    // solution.author = '86d2d978-5b20-4453-8a76-82b5a4c728c9';
    let programId = solution?.migrationReference?.sourcingProgramId;
    const programData = await createProgramTemplate(
      solution,
      programId,
      migratedCount
    ).catch((error) => {
      console.log("Errror", error);
    });
    programId = programData?.programId;
    solution.author = programData?.contributor?.mappedUserId
      ? programData?.contributor?.mappedUserId
      : solution.author;
    logger.debug(
      `-----------------------sourcingProgramId----------------------
        ${programId}`
    );
    // if (!programId) {
    //   return;
    // }
    // data.push(programId)
    // return;
    if (programId) {
      if (!solution?.hasOwnProperty('migrationReference')) {
        const solData  = await findAll(CONFIG.DB.TABLES.solutions, {
          _id: solution?._id
        });
        solution = solData[0]
      }

      data.push(
        await migrateQuestionset(
          solution,
          programId,
          migratedCount,
          programData?.contributor
        )
      );
    }
  }

  return data;
};

const migrateQuestionset = async (
  solution,
  programId,
  migratedCount,
  contributor
) => {
  logger.debug(
    `-----------------------migrateQuestionset----------------------
    ${programId}`
  );
  let templateData = setQuestionSetTemplate(solution, programId, contributor);
  const questionSetId = solution?._id.toString();

  let questionSetMigratedId = solution.referenceQuestionSetId;

  if (questionSetMigratedId) {
    migratedCount.success.questionSet.existing.migrated++;
  } else {
    questionSetMigratedId = await createQuestionSet(templateData).catch(
      (err) => {
        logger.error(`migrateQuestionset: Error while creating Questionset for solution_id: ${questionSetId} Error:
                        ${JSON.stringify(err?.response?.data)}`);
        if (
          !migratedCount.failed.questionSet.migrated.ids.includes(questionSetId)
        ) {
          migratedCount.failed.questionSet.migrated.count++;
          migratedCount.failed.questionSet.migrated.ids.push(questionSetId);
        }
      }
    );

    logger.info(
      `migrateQuestionset: questionSetMigratedId: 
      ${questionSetMigratedId}`
    );

    if (!questionSetMigratedId) {
      return;
    }

    solution.referenceQuestionSetId = questionSetMigratedId;
    await updateById(CONFIG.DB.TABLES.solutions, questionSetId, {
      referenceQuestionSetId: questionSetMigratedId,
    }).catch((err) => {
      logger.error(
        `migrateQuestionset: Error while updating solution referenceQuestionSetId: 
        ${err}`
      );
    });
    migratedCount.success.questionSet.current.migrated++;
  }
  const criterias = await getAllCriterias(solution, migratedCount, programId);
};



const getThemeChildrenCriteria = (theme, criterias=[]) => {
    if (theme?.hasOwnProperty('children') && theme?.children?.length > 0){
      for (let i=0;i<theme?.children?.length;i++) {
          const childCriteria = theme?.children[i];
          if (childCriteria?.hasOwnProperty('criteria')) {
            criterias = [...criterias, ...childCriteria?.criteria];
          } else {
            return getThemeChildrenCriteria(childCriteria, criterias);
          }
      }
    }
  return criterias;
}

const getAllCriterias = async (solution, migratedCount, programId) => {
  let criteriaIds = [];
  if (solution?.themes?.length <= 1 && solution?.themes[0]?.hasOwnProperty("criteria")) {
    criteriaIds = solution?.themes[0]?.criteria || [];
  } else {
    for (let j=0; j < solution?.themes?.length; j++) {
      const theme = solution?.themes[j];
        if (theme?.hasOwnProperty('children')) {
           const criterias = getThemeChildrenCriteria(theme, criteriaIds);
           criteriaIds = [...criteriaIds, ...criterias];
        } else if (theme?.hasOwnProperty('criteria')) {
          criteriaIds = [...criteriaIds, ...theme?.criteria];
        }
    }
  }

  criteriaIds = criteriaIds.map((criteria) => ObjectID(criteria?.criteriaId?.toString()));
  
  const criterias = await findAll(CONFIG.DB.TABLES.criteria_questions, {
    _id: { $in: criteriaIds },
  }).catch((err) => {
    console.log("Error", err);
  });

  let existingCriteriaQuestions = {};
  let allQuestionsFromAllSections = [];
  let matrixQuestionIds = [];
  let nonMatrixQuestionIds = [];
  let sectionsList = {};

  for (let i = 0; i < criterias.length; i++) {
    const criteria = criterias[i];
    let questions = criteria?.evidences[0].sections[0]?.questions || [];
    const questionIds = questions.map((que) => que?._id?.toString()) || [];
    allQuestionsFromAllSections = [
      ...allQuestionsFromAllSections,
      ...questions,
    ];
    existingCriteriaQuestions[criteria?._id.toString()] = {
      sectionId: criteria?._id?.toString(),
      questionIds: questionIds,
      sectionData: omit(criteria, "evidences"),
    };

    matrixQuestionIds = uniq(matrixQuestionIds);
    nonMatrixQuestionIds = uniq(nonMatrixQuestionIds);

    const matrixAndNonMatrixQues = getMatrixAndNonMatrixQuestions(questions, matrixQuestionIds, nonMatrixQuestionIds);
    matrixQuestionIds = [
      ...matrixQuestionIds,
      ...matrixAndNonMatrixQues.matrixQuestionIds,
    ];
    nonMatrixQuestionIds = [
      ...nonMatrixQuestionIds,
      ...matrixAndNonMatrixQues.nonMatrixQuestionIds,
    ];
  }

  const matrixSections = await getMatrixSectionData(
    matrixQuestionIds,
    allQuestionsFromAllSections,
    solution?.type,
    sectionsList,
    existingCriteriaQuestions,
    migratedCount
  );
  
  sectionsList = {
    ...sectionsList,
    ...matrixSections.sections,
  };


  const nonMatrixSections = await getNonMatrixSectionData(
    nonMatrixQuestionIds,
    allQuestionsFromAllSections,
    solution?.type,
    sectionsList,
    existingCriteriaQuestions,
    migratedCount
  );

  sectionsList = {
    ...sectionsList,
    ...nonMatrixSections.sections,
  };
  
  migratedCount = {
    ...migratedCount,
    ...matrixSections.migratedCount,
  };

  migratedCount = {
    ...migratedCount,
    ...nonMatrixSections.migratedCount,
  };


  console.log("sectionsListsectionsList", JSON.stringify(sectionsList));
  const hierarchy = await updateHierarchyTemplate(sectionsList, solution, programId, migratedCount).catch(err => {
    console.log("Error in updateHierarchyTemplate", err);
    logger.error("Error in updateHierarchyTemplate", err)
  });

};

const getMatrixAndNonMatrixQuestions = (questions, matrixQueIds=[], nonMatrixQueIds=[]) => {
  let matrixQuestionIds = matrixQueIds?.length > 0 ? matrixQueIds : [];
  let nonMatrixQuestionIds = nonMatrixQueIds?.length > 0 ? nonMatrixQueIds : [];

  questions.map((question) => {
    const id = question?._id?.toString();

    if (question?.responseType === "matrix") {
        matrixQuestionIds.push(id);
        if (question?.instanceQuestions?.length > 0 && question?.children?.length > 0)
        {
          matrixQuestionIds = [...matrixQuestionIds, ...getInstanceQuestionIds(question, 'instance'), ...getInstanceQuestionIds(question, 'children')];
        }
        else if (question?.instanceQuestions?.length > 0)
        {
          matrixQuestionIds = [...matrixQuestionIds, ...getInstanceQuestionIds(question, 'instance')];
        }
        else if (question?.children?.length > 0)
        {
          matrixQuestionIds = [...matrixQuestionIds, ...getInstanceQuestionIds(question, 'children')];
        }
    } else if (!matrixQuestionIds?.includes(id)) {
        nonMatrixQuestionIds.push(id);
    }
  });

  return { matrixQuestionIds, nonMatrixQuestionIds };
};

const getMatrixSectionData = async (
  matrixQuestionIds,
  allQuestionsFromAllSections,
  solutionType,
  sections,
  existingCriteriaQuestions,
  migratedCount
) => {
  for (let i = 0; i < matrixQuestionIds.length; i++) {
    const qid = matrixQuestionIds[i];
    let question = allQuestionsFromAllSections.find(
      (que) => que?._id?.toString() === qid
    );
    if (!isEmpty(question)) {
      if (question?.responseType === "matrix") {
        if (!sections?.hasOwnProperty(qid)) {
          const questionCriteria = getQueCriteriaIdAndData(
            qid,
            existingCriteriaQuestions
          );
          let instanceQuestionsIds =[];

          if (question?.instanceQuestions?.length > 0 && question?.children?.length > 0)
          {
            instanceQuestionsIds = [...instanceQuestionsIds, ...getInstanceQuestionIds(question, 'instance'), ...getInstanceQuestionIds(question, 'children')];
          }
          else if (question?.instanceQuestions?.length > 0)
          {
            instanceQuestionsIds = [...instanceQuestionsIds, ...getInstanceQuestionIds(question, 'instance')];
          }
          else if (question?.children?.length > 0)
          {
            instanceQuestionsIds = [...instanceQuestionsIds, ...getInstanceQuestionIds(question, 'children')];
          }

        const objValues = Object.values(sections);
        let name = "";
        let isSectionTitlePresent = objValues.map((obj) => {
          name = question?.question?.length > 0 ? question?.question[0] : "Matrix Section";
          if (obj?.sectionData?.name === name) {
            return obj;
          }
        });

        isSectionTitlePresent = compact(isSectionTitlePresent);
        if (isSectionTitlePresent?.length > 0) {
          question = {
            ...question,
            question: [`${name} ${isSectionTitlePresent?.length + 1}`]
          }
        }

          sections[qid] = {
            sectionId: qid,
            questionIds: [],
            children: [],
            questions: [],
            sectionData: getCriteriaData(
              questionCriteria?.sectionData,
              solutionType,
              question
            ),
            type: "matrix",
            parents: {},
            instanceQuestions: instanceQuestionsIds  ,
            pages: [],
            branchingLogic: {},
            allowMultipleInstances: "Yes",
            instances: { label: question?.instanceIdentifier },
            nodesModified: {}
          }
        }
      } else {
        const questionCriteria = getMatrixQueCriteriaIdAndData(
          qid,
          sections
        );
        let migratedQuestion = await createQuestionTemplate(
          question,
          migratedCount
        );
        sections[questionCriteria?.sectionId].children = [...sections[questionCriteria?.sectionId].children, migratedQuestion?.referenceQuestionId];
        sections[questionCriteria?.sectionId].questionIds = [...sections[questionCriteria?.sectionId].questionIds, qid];
        sections[questionCriteria?.sectionId].nodesModified[migratedQuestion?.referenceQuestionId] = {
          isNew: false,
          metadata: {
            ...omit(migratedQuestion, 'referenceQuestionId'),
            visibility: "Parent"
          },
          objectType: "Question",
          root: false,
        }
        migratedQuestion = omit(migratedQuestion, 'referenceQuestionId');
        // sections[questionCriteria?.sectionId].questions = [...sections[questionCriteria?.sectionId].questions, migratedQuestion];
      }
    }
  }
  return { sections, migratedCount };
};

const getNonMatrixSectionData = async (
  nonMatrixQuestionIds,
  allQuestionsFromAllSections,
  solutionType,
  sections,
  existingCriteriaQuestions,
  migratedCount) => {
    for (let i = 0; i < nonMatrixQuestionIds.length; i++) {
      const qid = nonMatrixQuestionIds[i];
      const question = allQuestionsFromAllSections.find((que) => que?._id?.toString() === qid)
      let sectionData = {};
      if (!isEmpty(question) && !isEmpty(getQueCriteriaIdAndData(qid, existingCriteriaQuestions)) && isEmpty(getQueCriteriaIdAndData(qid, sections))) {
        const questionCriteria = getQueCriteriaIdAndData(qid, existingCriteriaQuestions);
        const sectionId = questionCriteria?.sectionId;

        if (isParentQuestion(question)) {
          if (isPageQuestion(question)) {
            const pageName = `Page ${question?.page?.replace("p", "")}`;
                if (sections?.hasOwnProperty(pageName)) {
                  sectionData = sections[pageName];
                } else {
                  sections[pageName] = getPageSection(questionCriteria, pageName, solutionType);
                  sectionData = sections[pageName]
                }
          } else {
            if (sections?.hasOwnProperty(sectionId)){
                  sectionData = sections[sectionId];
            } else {
                  sections[sectionId] = getNonPageSection(questionCriteria, sectionId, solutionType);
                  sectionData = sections[sectionId];
            }
          }
            if (!sectionData?.questionIds?.includes(qid)) {
              let migratedQuestion = await createQuestionTemplate(
                question,
                migratedCount
              );
              sectionData.children = [...sectionData.children, migratedQuestion?.referenceQuestionId];
              sectionData.questionIds = [...sectionData.questionIds, qid];
              if (!sectionData?.branchingLogic?.hasOwnProperty(migratedQuestion?.referenceQuestionId)) {
                sectionData.branchingLogic[migratedQuestion?.referenceQuestionId] = {
                  target: [],
                  preCondition: {},
                  source: [],
                }
              }
              sectionData.nodesModified[migratedQuestion?.referenceQuestionId] = {
                isNew: false,
                metadata: {
                  ...omit(migratedQuestion, 'referenceQuestionId'),
                  visibility: "Parent"
                },
                objectType: "Question",
                root: false,
              }
              migratedQuestion = omit(migratedQuestion, 'referenceQuestionId');
              // sectionData.questions = [...sectionData.questions, migratedQuestion];
    
              console.log("sectionDatasectionData", JSON.stringify(sectionData));

              sections[sectionData?.sectionId] = {
                ...sections[sectionData?.sectionId],
                ...sectionData
              }
            }
          
        } else if (isChildQuestion(question)) {
          const parentId = question?.visibleIf[0]?._id?.toString();
          const parentQuestionCriteria = getQueCriteriaIdAndData(parentId, existingCriteriaQuestions);
          let parentQuestion = allQuestionsFromAllSections.find((que) => que?._id?.toString() === parentId);
          if (parentQuestion?.children?.length <= 0) {
            const data =  await findAll(CONFIG.DB.TABLES.questions, {
              _id: parentQuestion?._id,
            }).catch((err) => {});
            parentQuestion = data[0];
          }
          const parentSectionId = parentQuestionCriteria?.sectionId;
          if (!isEmpty(parentQuestion)) {
            if (isPageQuestion(parentQuestion)) {
              const pageName = `Page ${parentQuestion?.page?.replace("p", "")}`;
                if (sections?.hasOwnProperty(pageName)) {
                  sectionData = sections[pageName];
                } else {
                  sections[pageName] = getPageSection(parentQuestionCriteria, pageName, solutionType);
                  sectionData = sections[pageName]
                }
            }
            else {
              if (sections?.hasOwnProperty(parentSectionId)){
                  sectionData = sections[parentSectionId];
              } else {
                  sections[parentSectionId] = getNonPageSection(parentQuestionCriteria, parentSectionId, solutionType);
                  sectionData = sections[parentSectionId];
              }
            }
            if (!sectionData?.questionIds?.includes(qid)) {
              let migratedQuestion = await createQuestionTemplate(
                question,
                migratedCount
              );
              let parentMigratedQuestion = await createQuestionTemplate(
                parentQuestion,
                migratedCount
              );
              const parentReferenceQuestionId = parentMigratedQuestion?.referenceQuestionId;
              sectionData.children = [...sectionData.children, migratedQuestion?.referenceQuestionId];
              sectionData.questionIds = [...sectionData.questionIds, qid];
              if (sectionData?.branchingLogic?.hasOwnProperty(parentReferenceQuestionId)) {
                sectionData.branchingLogic[parentReferenceQuestionId].target.push(migratedQuestion?.referenceQuestionId);
                sectionData.branchingLogic[parentReferenceQuestionId].target = uniq(sectionData.branchingLogic[parentReferenceQuestionId].target);
              } else {
                sectionData.branchingLogic[parentReferenceQuestionId] = {
                  target: [migratedQuestion?.referenceQuestionId],
                  preCondition: {},
                  source: [],
                }
              }
              const visible = question?.visibleIf ? question?.visibleIf[0] : {};
              sectionData.branchingLogic[migratedQuestion?.referenceQuestionId] = {
                target: [],
                preCondition: getPrecondition(visible, parentReferenceQuestionId, parentQuestion),
                source: [parentReferenceQuestionId],
              }
              sectionData.nodesModified[migratedQuestion?.referenceQuestionId] = {
                isNew: false,
                metadata: {
                  ...omit(migratedQuestion, 'referenceQuestionId'),
                  visibility: "Parent"
                },
                objectType: "Question",
                root: false,
              }
              migratedQuestion = omit(migratedQuestion, 'referenceQuestionId');
              // sectionData.questions = [...sectionData.questions, migratedQuestion];
              sections[sectionData?.sectionId] = {
                ...sections[sectionData?.sectionId],
                ...sectionData
              }
            }
          }
        } else {
          if (isPageQuestion(question)) {
            const pageName = `Page ${question?.page?.replace("p", "")}`;
              if (sections?.hasOwnProperty(pageName)) {
                sectionData = sections[pageName];
              } else {
                sections[pageName] = getPageSection(questionCriteria, pageName, solutionType);
                sectionData = sections[pageName]
              }
          }
          else {
            if (sections?.hasOwnProperty(sectionId)){
                sectionData = sections[sectionId];
            } else {
                sections[sectionId] = getNonPageSection(questionCriteria, sectionId, solutionType);
                sectionData = sections[sectionId];
            }
          }

          if (!sectionData?.questionIds?.includes(qid)) {
            let migratedQuestion = await createQuestionTemplate(
              question,
              migratedCount
            );
            sectionData.children = [...sectionData.children, migratedQuestion?.referenceQuestionId];
            sectionData.questionIds = [...sectionData.questionIds, qid];
            sectionData.nodesModified[migratedQuestion?.referenceQuestionId] = {
              isNew: false,
              metadata: {
                ...omit(migratedQuestion, 'referenceQuestionId'),
                visibility: "Parent"
              },
              objectType: "Question",
              root: false,
            }
            migratedQuestion = omit(migratedQuestion, 'referenceQuestionId');
            // sectionData.questions = [...sectionData.questions, migratedQuestion];
            sections[sectionData?.sectionId] = {
              ...sections[sectionData?.sectionId],
              ...sectionData
            }
          }
        }
      }
    }
  return { sections, migratedCount };
}


const getQueCriteriaIdAndData = (qid, sections) => {
  const sectionIds = Object.keys(sections);
  let criteriaData = {};
  sectionIds.map((sectionId) => {
    if (sections[sectionId]?.questionIds?.includes(qid)) {
      criteriaData = sections[sectionId];
    }
  });
  return criteriaData;
};


const getMatrixQueCriteriaIdAndData = (qid, sections) => {
  const sectionIds = Object.keys(sections);
  let criteriaData = {};
  sectionIds.map((sectionId) => {
    if (sections[sectionId]?.type === 'matrix' && sections[sectionId]?.instanceQuestions.includes(qid)) {
      criteriaData = sections[sectionId];
    }
  });
  return criteriaData;
};

const getInstanceQuestionIds = (question, type="") => {
  let instanceQuestionsIds = [];
  if (type === 'instance') {
    instanceQuestionsIds = question?.instanceQuestions.map((que) =>
    que?._id?.toString()
  );
  } else if (type === 'children') {
      instanceQuestionsIds = question?.children.map((que) =>
        que?._id?.toString()
      );
  }
  return instanceQuestionsIds;
};

const isChildQuestion = (question) => {
  return !isEmpty(question?.visibleIf)
};

const isParentQuestion = (question) => {
  return question?.children?.length > 0 
};

const isPageQuestion = (question) => {
  return !isEmpty(question?.page)
}

const getPageSection = (questionCriteria, pageName, solutionType) => {
  return {
    sectionId: pageName,
    questionIds: [],
    children: [],
    questions: [],
    sectionData: getCriteriaData(
      {...questionCriteria?.sectionData, name: pageName},
      solutionType
    ),
    type: "nonmatrix",
    parents: {},
    pages: [],
    branchingLogic: {},
    allowMultipleInstances: "",
    instances: {},
    nodesModified: {}
  }
}


const getNonPageSection = (questionCriteria, sectionId, solutionType) => {
  return {
    sectionId: sectionId,
    questionIds: [],
    children: [],
    questions: [],
    sectionData: getCriteriaData(
      questionCriteria?.sectionData,
      solutionType
    ),
    type: "nonmatrix",
    parents: {},
    pages: [],
    branchingLogic: {},
    allowMultipleInstances: "",
    instances: {},
    nodesModified: {}
  }
}


module.exports = {
  getQuestionSetTemplates,
};
