const { ObjectId } = require("mongodb");
const { createQuestionSet } = require("../../api-list/question");

const { CONFIG } = require("./../../constant/config");
const { findAll, updateById } = require("../../db");
const logger = require("../../logger");
const { updateHierarchyTemplate } = require("../helpers/hierarchyHelper");
const { setQuestionSetTemplate } = require("../helpers/questionsetHelper");
const { createProgramTemplate } = require("./gProgram");
const { getCriteriaData, initHierarchy } = require("../migrate/common");
const { createSection } = require("../migrate/matrix");
const { getNonMatrixQuestions } = require("../migrate/nonmatrix");

const getQuestionSetTemplates = async (solutions, migratedCount) => {
  const data = [];
    // solutions.map(async (solution) => {
      for (let solution of solutions) {
      let programId = solution?.migrationReference?.sourcingProgramId;
      const programData = await createProgramTemplate(
        solution,
        programId,
        migratedCount
      ).catch(error => {
        console.log("Errror", error);
      });
      programId = programData?.programId;
      solution.author = programData?.contributor?.mappedUserId ? programData?.contributor?.mappedUserId : solution.author;
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
        data.push(await migrateQuestionset(solution, programId, migratedCount, programData?.contributor));
      }
    // })
  }
  
  return data;
};

const migrateQuestionset = async (solution, programId, migratedCount, contributor) => {
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
        if (!migratedCount.failed.questionSet.migrated.ids.includes(questionSetId)) {
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

  let hierarchy = initHierarchy(
    questionSetId,
    solution,
    programId,
    questionSetMigratedId
  );
  let matrixHierarchy = { criterias: [] };

  let data = await migrateCriteriaQuestions(
    solution,
    hierarchy,
    matrixHierarchy,
    migratedCount
  );

  for (let i = 0; i < data.matrixHierarchy.criterias.length; i++) {
    const cri = data.matrixHierarchy.criterias[i];
    data.hierarchy.criterias.push(cri);
  }


  await updateHierarchyTemplate(
    data.hierarchy,
    solution,
    programId,
    migratedCount
  );

  return data.hierarchy;
};

const migrateCriteriaQuestions = async (
  solution,
  hierarchy,
  matrixHierarchy,
  migratedCount
) => {
  logger.debug(
    `migrateCriteriaQuestions: ${solution?._id}`
  );

  let criteriaIds = solution?.themes[0]?.criteria || [];
  criteriaIds = criteriaIds.map((criteria) => ObjectId(criteria?.criteriaId));
  const criterias = await findAll(CONFIG.DB.TABLES.criteria_questions, {
    _id: { $in: criteriaIds },
  }).catch((err) => {});

  for (let i = 0; i < criterias.length; i++) {
    const criteria = criterias[i];
    let questionIds = criteria?.evidences[0].sections[0]?.questions || [];
    questionIds = questionIds.map((question) => question?._id);

    const criteriaQuestions = await findAll(CONFIG.DB.TABLES.questions, {
      _id: { $in: questionIds },
    }).catch((err) => {});

    hierarchy.criterias[i] = getCriteriaData(criteria, solution?.type);

    logger.info(
      `migrateCriteriaQuestions: --------------------criteria---------------------- ${criteria?.name}`
    );

    const data = await migrateQuestions(
      (type = solution?.type),
      criteriaQuestions,
      hierarchy,
      matrixHierarchy,
      migratedCount,
      (index = i),
      (criteriaId = criteria?._id.toString())
    );

    hierarchy = data.hierarchy;
    matrixHierarchy = data.matrixHierarchy;
  }
  return { hierarchy, matrixHierarchy };
};

const migrateQuestions = async (
  type,
  questions,
  hierarchy,
  matrixHierarchy,
  migratedCount,
  index,
  criteriaId
) => {
  let matrixQuestions = {};
  let nonMatrixQuestions = [];


  logger.info(
    `migrateQuestions: criteria:${criteriaId} questions: ${questions.length} `
  );

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];


    logger.info(
      `migrateQuestions: criteria:${criteriaId} question: ${question?._id} question responseType: ${question?.responseType} `
    );

    
    if (question?.responseType === "matrix") {


      const data = await createSection(
        type,
        matrixHierarchy,
        matrixQuestions,
        questions,
        criteriaId,
        question,
        migratedCount
      );
      matrixQuestions = data.matrixQuestions;
      matrixHierarchy = data.matrixHierarchy;
      questions = data.questions;

    } else {
      const data = await getNonMatrixQuestions(
        question,
        questions,
        nonMatrixQuestions,
        matrixQuestions,
        matrixHierarchy,
        hierarchy,
        index,
        type,
        migratedCount,
        criteriaId
      );

      hierarchy = data.hierarchy;
      matrixHierarchy = data.matrixHierarchy;
      matrixQuestions = data.matrixQuestions;
      nonMatrixQuestions = data.nonMatrixQuestions;
      questions = data.questions;
    }
  }
  return { hierarchy, matrixHierarchy };
};

module.exports = {
  getQuestionSetTemplates,
};
