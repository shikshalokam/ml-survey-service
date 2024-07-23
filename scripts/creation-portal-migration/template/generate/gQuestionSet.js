const { ObjectID } = require("mongodb");
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

const { writeCSV, updateQuestionMappingInCSV } = require('../helpers/migrationcsv')

/**
* Loop through all the solutions from mongo and create the program and migrate the solutions under that program 
* @method
* @name createProgramAndQuestionsets
* @param {Object[]} solutions - solutions
* @param {Object} migratedCount - migratedCount to increment migration count
* 
**/
const createProgramAndQuestionsets = async (solutions, migratedCount) => {
  for (let solution of solutions) {
    let programId = solution?.migrationReference?.sourcingProgramId;
    // To makesure program is migrated, updated, published, nominated and contributor is added
    const programData = await createProgramTemplate(
      solution,
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
    if (programId) {
      if (!solution?.hasOwnProperty('migrationReference')) {
        // get the updated solution with programId from mongo
        const solData = await findAll(CONFIG.DB.TABLES.solutions, {
          _id: solution?._id
        });
        solution = solData[0]
      }
      await migrateQuestionset(
        solution,
        programId,
        migratedCount,
        programData?.contributor
      )
    }
  }
};

/**
* Map the questionset template and create the question set in creation portal for each solution
* @method
* @name migrateQuestionset
* @param {Object} solution - 
    {
        "_id": "5f362b78af0a4decfa9a1070",
        "resourceType": [
            "Observations Framework"
        ],
        "language": [
            "English"
        ],
        "keywords": [
            "Framework",
            "Observation",
            "PISA training",
            " Teacher feedback",
            " TPD feedback"
        ],
        "concepts": [],
        "createdFor": [
            "0123221617357783046602"
        ],
        "themes": [
            {
                "type": "theme",
                "label": "theme",
                "name": "Observation Theme",
                "externalId": "OB",
                "weightage": 100,
                "criteria": [
                    {
                        "criteriaId": "5f350ab519377eecddb06937",
                        "weightage": 33.3333333333333
                    },
                    {
                        "criteriaId": "5f350ab519377eecddb06936",
                        "weightage": 33.3333333333333
                    },
                    {
                        "criteriaId": "5f350ab519377eecddb06938",
                        "weightage": 33.3333333333333
                    }
                ]
            }
        ],
        "flattenedThemes": [],
        "entities": [],
        "registry": [],
        "isRubricDriven": false,
        "enableQuestionReadOut": false,
        "captureGpsLocationAtQuestionLevel": false,
        "isAPrivateProgram": true,
        "allowMultipleAssessemts": false,
        "isDeleted": false,
        "rootOrganisations": [
            "0123221617357783046602"
        ],
        "deleted": false,
        "externalId": "1e0723a4-dd49-11ea-a3bf-000d3af02677-OBSERVATION-TEMPLATE-1597385592748",
        "name": "Need Assessment Form_Teacher Training",
        "description": "Need Assessment Form_Teacher Training",
        "author": "86d2d978-5b20-4453-8a76-82b5a4c728c9",
        "levelToScoreMapping": {
            "L1": {
                "points": 100,
                "label": "Good"
            }
        },
        "scoringSystem": null,
        "noOfRatingLevels": 1,
        "entityTypeId": "5f32d8228e0dc83124040567",
        "entityType": "school",
        "type": "observation",
        "subType": "school",
        "updatedBy": "INITIALIZE",
        "createdAt": "2020-08-14T06:13:12.748Z",
        "updatedAt": "2020-08-14T06:13:12.750Z",
        "frameworkId": "5f350ab5ec065458d5c9d4f5",
        "frameworkExternalId": "1e0723a4-dd49-11ea-a3bf-000d3af02677",
        "isReusable": false,
        "__v": 0,
        "evidenceMethods": {
            "OB": {
                "externalId": "OB",
                "tip": null,
                "name": "Observation",
                "description": null,
                "modeOfCollection": "onfield",
                "canBeNotApplicable": false,
                "notApplicable": false,
                "canBeNotAllowed": false,
                "remarks": null
            }
        },
        "sections": {
            "S1": "Survey Questions"
        },
        "status": "active",
        "questionSequenceByEcm": {
            "OB": {
                "S1": [
                    "PS01_1597311656239",
                    "PS02_1597311656239",
                    "PS03_1597311656239",
                    "PS04_1597311656239",
                    "PS05_1597311656239",
                    "PS06_1597311656239",
                    "PS07_1597311656239",
                    "PS08_1597311656239",
                    "PS09_1597311656239",
                    "PS10_1597311656239",
                    "PS11_1597311656239",
                    "PS12_1597311656239",
                    "PS13_1597311656239",
                    "PS14_1597311656239",
                    "PS15_1597311656239",
                    "PS16_1597311656239",
                    "PS17_1597311656239",
                    "PS18_1597311656239",
                    "PS19_1597311656239",
                    "PS20_1597311656239",
                    "PS21_1597311656239",
                    "PS22_1597311656239",
                    "PS23_1597311656239",
                    "PS24_1597311656239",
                    "PS25_1597311656239"
                ]
            }
        },
        "programId": "5f362b78af0a4decfa9a106f",
        "programExternalId": "PISA Chandigarh-1597385592741",
        "programName": "PISA Chandigarh",
        "programDescription": "Need Assessment Form_Teacher Training",
        "parentSolutionId": "5f350ab519377eecddb06939",
        "startDate": "2020-08-14T06:13:12.748Z",
        "endDate": "2021-08-14T06:13:12.748Z",
        "link": "5f6ca48cf65725b52d4b0a49f268093c",
        "minNoOfSubmissionsRequired": 1,
        "migrationReference": {
            "isContributorAccepted": true,
            "isContributorAdded": true,
            "isNominated": true,
            "isSrcProgramPublished": true,
            "isSrcProgramUpdated": true,
            "sourcingProgramId": "d1b93850-df5e-11ed-87b4-9feca80ba862",
            "isBranchingUpdated": true,
            "isHierarchyUpdated": true,
            "isPublished": true
        },
        "referenceQuestionSetId": "do_21377880795792998411483"
    }
* @param {String} programId - created programId for the solution
* @param {Object} migratedCount - migratedCount to increment migration count
* @param {Object} contributor - contributor and srcorgadmin data from csv
* 
**/
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
  // Create the questionset mapping
  let templateData = setQuestionSetTemplate(solution, programId, contributor);
  const questionSetId = solution?._id.toString();

  let questionSetMigratedId = solution.referenceQuestionSetId;

  if (questionSetMigratedId) {
    migratedCount.success.questionSet.existing.migrated++;
  } else {
    // calls the api to create the question set
    questionSetMigratedId = await createQuestionSet(templateData).catch(
      (err) => {
        logger.error(`migrateQuestionset: Error while creating Questionset for solution_id: ${questionSetId} Error:
                        ${JSON.stringify(err?.response?.data)}`);

        writeCSV({
          "solutionId": questionSetId,
          "isFailed": "YES",
          "reasons": `${JSON.stringify(err?.response?.data)}`
        })

        console.log(questionSetId)


        if (
          !migratedCount.failed.questionSet.migrated.ids.includes(questionSetId)
        ) {
          migratedCount.failed.questionSet.migrated.count++;
          migratedCount.failed.questionSet.migrated.ids.push(questionSetId);
        }
      }
    );

    writeCSV({
      "solutionId": questionSetId,
      "isFailed": "NO",
      "referenceQuestionSetId": questionSetMigratedId,
      "reasons": ""
    })


    console.log(questionSetId, questionSetMigratedId);



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
  const criterias = await getAllCriterias(solution, migratedCount, programId, questionSetMigratedId);
};


/**
* Recursive function to get criterias
* @method
* @name getThemeChildrenCriteria
* @param {Object} theme - theme
* @param {Object[]} criterias - criterias
* @returns {JSON} - [
  { criteriaId: 5f350ab519377eecddb06937, weightage: 33.3333333333333 },
  { criteriaId: 5f350ab519377eecddb06936, weightage: 33.3333333333333 },
  { criteriaId: 5f350ab519377eecddb06938, weightage: 33.3333333333333 }
]
**/
const getThemeChildrenCriteria = (theme, criterias = []) => {
  if (theme?.hasOwnProperty('children') && theme?.children?.length > 0) {
    for (let i = 0; i < theme?.children?.length; i++) {
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

/**
* Loop through all the criterias and get all the questions from all the criterias
* @method
* @name getAllCriterias
* @param {Object} solution - solution
* @param {Object} migratedCount - migratedCount to increment migration count
* @param {String} programId - programId
* @param {String} questionSetMigratedId - referencequestionId
**/
const getAllCriterias = async (solution, migratedCount, programId, questionSetMigratedId) => {
  let criteriaIds = [];
  if (solution?.themes?.length <= 1 && solution?.themes[0]?.hasOwnProperty("criteria")) {
    criteriaIds = solution?.themes[0]?.criteria || [];
  } else {
    for (let j = 0; j < solution?.themes?.length; j++) {
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
      ...(matrixAndNonMatrixQues.matrixQuestionIds)
    ];
    nonMatrixQuestionIds = [
      ...nonMatrixQuestionIds,
      ...(matrixAndNonMatrixQues.nonMatrixQuestionIds)
    ];
  }

  matrixQuestionIds = uniq(matrixQuestionIds);
  nonMatrixQuestionIds = uniq(nonMatrixQuestionIds);

  // To Get Matrix sections
  const matrixSections = await getMatrixSectionData(
    matrixQuestionIds,
    allQuestionsFromAllSections,
    solution?.type,
    solution?._id,
    questionSetMigratedId,
    sectionsList,
    existingCriteriaQuestions,
    migratedCount
  );

  sectionsList = {
    ...sectionsList,
    ...matrixSections.sections,
  };

  // To Get Non Matrix sections
  const nonMatrixSections = await getNonMatrixSectionData(
    nonMatrixQuestionIds,
    allQuestionsFromAllSections,
    solution?.type,
    solution?._id,
    questionSetMigratedId,
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

  // create the hierarchy to with formed sections for the current solution
  const hierarchy = await updateHierarchyTemplate(sectionsList, solution, programId, migratedCount).catch(err => {
    logger.error("Error in updateHierarchyTemplate", err)
  });

};

/**
* Separate the matrix and nonmatrix questions
* @method
* @name getMatrixAndNonMatrixQuestions
* @param {Object[]} questions - questions
* @param {String[]} matrixQueIds - matrixQueIds (objectId's) in mongo
* @param {String[]} nonMatrixQueIds - nonMatrixQueIds (objectId's) in mongo
* @returns {JSON} returns matrix and nonmatrix questionIds in mongo 
**/

const getMatrixAndNonMatrixQuestions = (questions, matrixQueIds = [], nonMatrixQueIds = []) => {
  let matrixQuestionIds = matrixQueIds?.length > 0 ? matrixQueIds : [];
  let nonMatrixQuestionIds = nonMatrixQueIds?.length > 0 ? nonMatrixQueIds : [];

  questions.map((question) => {
    const id = question?._id?.toString();

    if (question?.responseType === "matrix") {
      matrixQuestionIds.push(id);
      if (question?.instanceQuestions?.length > 0 && question?.children?.length > 0) {
        matrixQuestionIds = [...matrixQuestionIds, ...getInstanceQuestionIds(question, 'instance'), ...getInstanceQuestionIds(question, 'children')];
      }
      else if (question?.instanceQuestions?.length > 0) {
        matrixQuestionIds = [...matrixQuestionIds, ...getInstanceQuestionIds(question, 'instance')];
      }
      else if (question?.children?.length > 0) {
        matrixQuestionIds = [...matrixQuestionIds, ...getInstanceQuestionIds(question, 'children')];
      }
    } else if (!matrixQuestionIds?.includes(id)) {
      nonMatrixQuestionIds.push(id);
    }
  });

  return { matrixQuestionIds, nonMatrixQuestionIds };
};


/**
* To create and update the matrix section data
* @method
* @name getMatrixSectionData
* @param {String[]} matrixQuestionIds - matrixQueIds (objectId's) in mongo
* @param {Object[]} allQuestionsFromAllSections - allQuestionsFromAllSections
* @param {String} solutionType - Observation or solution
* @param {String} solutionId - ObjectId
* @param {String} referenceQuestionsetId - ObjectId
* @param {Object[]} sections - newly mapped sections to update the hierarchy
* @param {Object[]} existingCriteriaQuestions - current criteria questions
* @param {Object} migratedCount - migratedCount to increment migration count
* @returns {JSON} returns the updated matrix sections and incremented the migratedcount object
**/

const getMatrixSectionData = async (
  matrixQuestionIds,
  allQuestionsFromAllSections,
  solutionType,
  solutionId,
  referenceQuestionsetId,
  sections, //section list 
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
          // Get the question section
          const questionCriteria = getQueCriteriaIdAndData(
            qid,
            existingCriteriaQuestions
          );
          let instanceQuestionsIds = [];

          // update the instanceQuestionIds if a question has both instancequestions and children
          if (question?.instanceQuestions?.length > 0 && question?.children?.length > 0) {
            instanceQuestionsIds = [...instanceQuestionsIds, ...getInstanceQuestionIds(question, 'instance'), ...getInstanceQuestionIds(question, 'children')];
          } // update the instanceQuestionIds if a question has only instancequestions
          else if (question?.instanceQuestions?.length > 0) {
            instanceQuestionsIds = [...instanceQuestionsIds, ...getInstanceQuestionIds(question, 'instance')];
          } // update the instanceQuestionIds if a question has only children
          else if (question?.children?.length > 0) {
            instanceQuestionsIds = [...instanceQuestionsIds, ...getInstanceQuestionIds(question, 'children')];
          }

          const objValues = Object.values(sections);
          let name = "";

          // To check duplicate section titles
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
          // To create the section
          sections[qid] = {
            sectionId: qid,
            questionIds: [],
            children: [],
            sectionData: getCriteriaData(
              questionCriteria?.sectionData,
              solutionType,
              question
            ),
            type: "matrix",
            instanceQuestions: instanceQuestionsIds,
            branchingLogic: {},
            allowMultipleInstances: "Yes",
            instances: { label: question?.instanceIdentifier },
            nodesModified: {}
          }
        }
      } else {
        // Get the question section
        const questionCriteria = getMatrixQueCriteriaIdAndData(
          qid,
          sections
        );
        // Get the migrated question
        let migratedQuestion = await createQuestionTemplate(
          question,
          migratedCount
        );

        updateQuestionMappingInCSV({
          "solutionId": solutionId,
          "criteriaId": '',
          "questionsetId": referenceQuestionsetId,
          questions: {
            [qid]: {
              id: migratedQuestion.referenceQuestionId,
              status: 'draft',
              isFailed: 'No',
              reasons: ''
            }
          }
        })

        // here add the csv file

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
      }
    }
  }
  return { sections, migratedCount };
};

/**
* To create and update the nonmatrix  section data
* @method
* @name getNonMatrixSectionData
* @param {String[]} nonMatrixQuestionIds - nonMatrixQuestionIds (objectId's) in mongo
* @param {Object[]} allQuestionsFromAllSections - allQuestionsFromAllSections
* @param {String} solutionType - Observation or solution
* @param {Object[]} sections - newly mapped sections to update the hierarchy
* @param {Object[]} existingCriteriaQuestions - current criteria questions
* @param {Object} migratedCount - migratedCount to increment migration count
* @returns {JSON} returns the updated nonmatrix sections and incremented the migratedcount object
**/
const getNonMatrixSectionData = async (
  nonMatrixQuestionIds,
  allQuestionsFromAllSections,
  solutionType,
  solutionId,
  referenceQuestionsetId,
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
        // To check if the question is a page question
        if (isPageQuestion(question)) {
          // get the question page and replace p with "" and append to "Page", Ex: p1 => Page 1
          const pageName = `Page ${question?.page?.replace("p", "")}`;
          if (sections?.hasOwnProperty(pageName)) {
            // If sections exists get the sectionData
            sectionData = sections[pageName];
          } else {
            // else create and assign the section data to sections[pageName]
            sections[pageName] = getPageSection(questionCriteria, pageName, solutionType);
            sectionData = sections[pageName]
          }
        } else {
          if (sections?.hasOwnProperty(sectionId)) {
            sectionData = sections[sectionId];
          } else {
            // else create and assign the section data to sections[sectionId]
            sections[sectionId] = getNonPageSection(questionCriteria, sectionId, solutionType);
            sectionData = sections[sectionId];
          }
        }
        if (!sectionData?.questionIds?.includes(qid)) {
          let migratedQuestion = await createQuestionTemplate(
            question,
            migratedCount
          );

          updateQuestionMappingInCSV({
            "solutionId": solutionId,
            "criteriaId": '',
            "questionsetId": referenceQuestionsetId,
            questions: {
              [qid]: {
                id: migratedQuestion.referenceQuestionId,
                status: 'draft',
                isFailed: 'No',
                reasons: ''
              }
            }
          })

          sectionData.children = [...sectionData.children, migratedQuestion?.referenceQuestionId];
          sectionData.questionIds = [...sectionData.questionIds, qid];

          // Create the branchingLogic structure for the parent question
          if (!sectionData?.branchingLogic?.hasOwnProperty(migratedQuestion?.referenceQuestionId)) {
            sectionData.branchingLogic[migratedQuestion?.referenceQuestionId] = {
              target: [],
              preCondition: {},
              source: [],
            }
          }
          // Add the question data to nodesModified changing the visibility to parent
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
          sections[sectionData?.sectionId] = {
            ...sections[sectionData?.sectionId],
            ...sectionData
          }
        }
      } else if (isChildQuestion(question)) {
        const parentId = question?.visibleIf[0]?._id?.toString();
        // get the parentSection and to add the child to parent section
        const parentQuestionCriteria = getQueCriteriaIdAndData(parentId, existingCriteriaQuestions);
        let parentQuestion = allQuestionsFromAllSections.find((que) => que?._id?.toString() === parentId);
        // dead if condition 
        if (parentQuestion?.children?.length <= 0) {
          const data = await findAll(CONFIG.DB.TABLES.questions, {
            _id: parentQuestion?._id,
          }).catch((err) => { });
          parentQuestion = data[0];
        }
        const parentSectionId = parentQuestionCriteria?.sectionId;
        if (!isEmpty(parentQuestion)) {
          if (isPageQuestion(parentQuestion)) {
            // P1 convert to Page 1
            const pageName = `Page ${parentQuestion?.page?.replace("p", "")}`;
            if (sections?.hasOwnProperty(pageName)) {
              sectionData = sections[pageName];
            } else {
              sections[pageName] = getPageSection(parentQuestionCriteria, pageName, solutionType);
              sectionData = sections[pageName]
            }
          }
          else {
            if (sections?.hasOwnProperty(parentSectionId)) {
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

            updateQuestionMappingInCSV({
              "solutionId": solutionId,
              "criteriaId": '',
              "questionsetId": referenceQuestionsetId,
              questions: {
                [qid]: {
                  id: migratedQuestion.referenceQuestionId,
                  status: 'draft',
                  isFailed: 'No',
                  reasons: ''
                }
              }
            })

            let parentMigratedQuestion = await createQuestionTemplate(
              parentQuestion,
              migratedCount
            );

            updateQuestionMappingInCSV({
              "solutionId": solutionId,
              "criteriaId": '',
              "questionsetId": referenceQuestionsetId,
              questions: {
                [parentQuestion._id]: {
                  id: parentMigratedQuestion.referenceQuestionId,
                  status: 'draft',
                  isFailed: 'No',
                  reasons: ''
                }
              }
            })


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
            // Update the branching logic with the question predefined conditions
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
          if (sections?.hasOwnProperty(sectionId)) {
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

          updateQuestionMappingInCSV({
            "solutionId": solutionId,
            "criteriaId": '',
            "questionsetId": referenceQuestionsetId,
            questions: {
              [qid]: {
                id: migratedQuestion.referenceQuestionId,
                status: 'draft',
                isFailed: 'No',
                reasons: ''
              }
            }
          })

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
          sections[sectionData?.sectionId] = {
            ...sections[sectionData?.sectionId],
            ...sectionData
          }
        }
      }
    }
  }
  // console.log(JSON.stringify(sections));
  return { sections, migratedCount };

}

/**
* To check exactly in which section the question present for nonmatrix
* @method
* @name getQueCriteriaIdAndData
* @param {String} qid - nonMatrixQuestionIds (objectId's) in mongo
* @param {Object[]} sections - newly mapped sections to update the hierarchy
* @returns {JSON} returns the question section
**/
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

/**
* To check exactly in which section the question present for matrix
* @method
* @name getMatrixQueCriteriaIdAndData
* @param {String} qid - MatrixQuestionIds (objectId's) in mongo
* @param {Object[]} sections - newly mapped sections to update the hierarchy
* @returns {JSON} returns the question section
**/
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

/**
* Get the instanceQuestions and children questions if it's a matrix question
* @method
* @name getInstanceQuestionIds
* @param {Object} question - question
* @param {String} type - type 
* @returns {JSON} returns all the instance and children questionIds belongs to matrix question
**/
const getInstanceQuestionIds = (question, type = "") => {
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

/**
* To check if the question  is a child question
* @method
* @name isChildQuestion
* @param {Object} question - question
* @returns {Boolean} - return true if the question is a child
**/
const isChildQuestion = (question) => {
  return !isEmpty(question?.visibleIf)
};

/**
* To check if the question is a parent question
* @method
* @name isParentQuestion
* @param {Object} question - question
* @returns {Boolean} - return true if the question is a parent
**/
const isParentQuestion = (question) => {
  return question?.children?.length > 0
};

/**
* To check if the question belongs to any page
* @method
* @name isPageQuestion
* @param {Object} question - question
* @returns {Boolean} - return true if the question belongs to any page
**/
const isPageQuestion = (question) => {
  return !isEmpty(question?.page)
}

/**
* To Create a section named with page number: Ex: Page 1 
* @method
* @name getPageSection
* @param {Object} questionCriteria - {"sectionId":"5f350ab519377eecddb06936","questionIds":["5f350abaaf0a4decfa9a1055","5f350abaaf0a4decfa9a1056","5f350abaaf0a4decfa9a1057","5f350abaaf0a4decfa9a1058"],"sectionData":{"_id":"5f350ab519377eecddb06936","__v":0,"concepts":[{"identifier":"LPD20100","name":"Teacher_Performance","objectType":"Concept","relation":"associatedTo","description":null,"index":null,"status":null,"depth":null,"mimeType":null,"visibility":null,"compatibilityLevel":null},{"identifier":"LPD20400","name":"Instructional_Programme","objectType":"Concept","relation":"associatedTo","description":null,"index":null,"status":null,"depth":null,"mimeType":null,"visibility":null,"compatibilityLevel":null},{"identifier":"LPD20200","name":"Teacher_Empowerment","objectType":"Concept","relation":"associatedTo","description":null,"index":null,"status":null,"depth":null,"mimeType":null,"visibility":null,"compatibilityLevel":null}],"createdAt":"2020-08-13T09:41:14.126Z","createdFor":["0125747659358699520","0125748495625912324"],"criteriaType":"manual","description":"General Information","externalId":"PS001_1597311656239","flag":"","frameworkCriteriaId":"5f350ab26ba5e3ecd7a42210","keywords":["Keyword 1","Keyword 2"],"language":["English"],"name":"General Information","owner":"2b655fd1-201d-4d2a-a1b7-9048a25c0afa","remarks":"","resourceType":["Program","Framework","Criteria"],"rubric":{"name":"General Information","description":"General Information","type":"auto","levels":{"L1":{"level":"L1","label":"Level 1","description":"NA","expression":""}}},"score":"","showRemarks":null,"timesUsed":12,"updatedAt":"2020-08-13T09:41:14.167Z","weightage":20}}
* @param {String} pageName - section Id 
* @param {String} solutionType - observation or solution
* @returns {JSON} - returns mapped section data
**/
const getPageSection = (questionCriteria, pageName, solutionType) => {
  return {
    sectionId: pageName,
    questionIds: [],
    children: [],
    sectionData: getCriteriaData(
      { ...questionCriteria?.sectionData, name: pageName },
      solutionType
    ),
    type: "nonmatrix",
    branchingLogic: {},
    allowMultipleInstances: "",
    instances: {},
    nodesModified: {}
  }
}

/**
* To Create a section named with page number: Ex: Page 1 
* @method
* @name getNonPageSection
* @param {Object} questionCriteria - {"sectionId":"5f350ab519377eecddb06938","questionIds":["5f350abaaf0a4decfa9a1061","5f350abaaf0a4decfa9a1065","5f350abaaf0a4decfa9a1066","5f350abaaf0a4decfa9a1067","5f350abaaf0a4decfa9a1068","5f350abaaf0a4decfa9a1069","5f350abaaf0a4decfa9a106a","5f350abaaf0a4decfa9a106b","5f350abaaf0a4decfa9a106c","5f350abaaf0a4decfa9a106d"],"sectionData":{"_id":"5f350ab519377eecddb06938","__v":0,"concepts":[{"identifier":"LPD20100","name":"Teacher_Performance","objectType":"Concept","relation":"associatedTo","description":null,"index":null,"status":null,"depth":null,"mimeType":null,"visibility":null,"compatibilityLevel":null},{"identifier":"LPD20400","name":"Instructional_Programme","objectType":"Concept","relation":"associatedTo","description":null,"index":null,"status":null,"depth":null,"mimeType":null,"visibility":null,"compatibilityLevel":null},{"identifier":"LPD20200","name":"Teacher_Empowerment","objectType":"Concept","relation":"associatedTo","description":null,"index":null,"status":null,"depth":null,"mimeType":null,"visibility":null,"compatibilityLevel":null}],"createdAt":"2020-08-13T09:41:14.297Z","createdFor":["0125747659358699520","0125748495625912324"],"criteriaType":"manual","description":"Support Needed","externalId":"PS003_1597311656239","flag":"","frameworkCriteriaId":"5f350ab26ba5e3ecd7a42212","keywords":["Keyword 1","Keyword 2"],"language":["English"],"name":"Support Needed","owner":"2b655fd1-201d-4d2a-a1b7-9048a25c0afa","remarks":"","resourceType":["Program","Framework","Criteria"],"rubric":{"name":"Support Needed","description":"Support Needed","type":"auto","levels":{"L1":{"level":"L1","label":"Level 1","description":"NA","expression":""}}},"score":"","showRemarks":null,"timesUsed":12,"updatedAt":"2020-08-13T09:41:14.436Z","weightage":20}}
* @param {String} sectionId - section Id
* @param {String} solutionType - observation or solution
* @returns {JSON} - returns mapped section data
**/
const getNonPageSection = (questionCriteria, sectionId, solutionType) => {
  return {
    sectionId: sectionId,
    questionIds: [],
    children: [],
    sectionData: getCriteriaData(
      questionCriteria?.sectionData,
      solutionType
    ),
    type: "nonmatrix",
    branchingLogic: {},
    allowMultipleInstances: "",
    instances: {},
    nodesModified: {}
  }
}


module.exports = {
  createProgramAndQuestionsets,
  getAllCriterias,
  migrateQuestionset
};
