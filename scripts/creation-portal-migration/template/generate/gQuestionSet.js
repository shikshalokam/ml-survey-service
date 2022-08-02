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
  const data = Promise.all(
    solutions.map(async (solution) => {
      let programId = solution.sourcingProgramId;
      console.log();
      console.log(
        "-----------------------sourcingProgramId----------------------",
        programId
      );
      console.log();
      programId = await createProgramTemplate(
        solution,
        programId,
        migratedCount
      );
      console.log();
      console.log(
        "-----------------------------program-------------------------------------"
      );
      console.log();
      console.log("ProgramId", programId);
      logger.debug(
        `-----------------------sourcingProgramId----------------------
        ${programId}`
      );

      if (!programId) {
        return;
      }

      return await migrateQuestionset(solution, programId, migratedCount);
    })
  );
  return data;
};

const migrateQuestionset = async (solution, programId, migratedCount) => {
  logger.debug(
    `-----------------------migrateQuestionset----------------------
    ${programId}`
  );
  let templateData = setQuestionSetTemplate(solution, programId);
  const questionSetId = solution?._id.toString();

  let questionSetMigratedId = solution.referenceQuestionSetId;

  if (questionSetMigratedId) {
    migratedCount.success.questionSet.existing.migrated++;
  } else {
    questionSetMigratedId = await createQuestionSet(templateData).catch(
      (err) => {
        logger.error(`migrateQuestionset: Error while creating Questionset for solution_id: ${questionsetid} Error:
                        ${JSON.stringify(err?.response?.data)}`);
        if (!migratedCount.failed.questionSet.migrated.ids.includes(id)) {
          migratedCount.failed.questionSet.migrated.count++;
          migratedCount.failed.questionSet.migrated.ids.push(id);
        }
      }
    );

    logger.info(
      `migrateQuestionset: questionSetMigratedId: 
      ${questionSetMigratedId}`
    );

    console.log(`migrateQuestionset: questionSetMigratedId: 
    ${questionSetMigratedId}`);

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
      console.log(`migrateQuestionset: Error while updating question: 
      ${err}`);
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

  console.log();
  console.log("migrateQuestionset", JSON.stringify(data.hierarchy));
  console.log();
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

    console.log();
    console.log(
      "--------------------criteria----------------------",
      criteria?.name
    );
    console.log();

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

  console.log();
  console.log("migrateQuestions", questions.length);
  console.log();

  logger.info(
    `migrateQuestions: criteria:${criteriaId} questions: ${questions.length} `
  );

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    console.log();
    console.log(
      "migrateQuestions question responsetype",
      question?.responseType,
      "qid",
      question._id,

    );
    console.log();

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

      console.log();
      console.log("migrateQuestions createSection", matrixHierarchy);
      console.log();
    } else {
      console.log();
      console.log(
        "==========migrateQuestions getNonMatrixQuestions============",
        question?.responseType,
        question?._id
      );
      console.log();

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

      console.log();
      console.log(
        "==========migrateQuestions getNonMatrixQuestions end ============",
        matrixHierarchy
      );
      console.log();

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
