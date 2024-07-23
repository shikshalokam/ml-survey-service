require("dotenv").config({ path: "./../../.env" });
const { createDBInstance } = require("./db/dbConfig");
const { CONFIG } = require("./constant/config");
const { readCSV } = require('./template/helpers/migrationcsv');
const _ = require('lodash');
const logger = require("./logger");
const { findAll } = require("./db");
const { publishQuestion, publishQuestionSet } = require("./api-list/question");
const { ObjectID } = require("mongodb");
const { updateById } = require("./db");



const publishQuestions = async () => {

    const migratedCount = {
        totalCount: 0,
        success: {
            questionSet: {
                existing: {
                    published: 0,
                },
                current: {
                    published: 0,
                },
            },
        },
        failed: {
            questionSet: {
                published: { count: 0, ids: [] },
            },
            question: { count: 0, ids: [] }
        },
    }

    try {
        const csv = await readCSV();
        const db = await createDBInstance();

        

        // publish question 
        for (const row of csv) {

            let data = await findAll(CONFIG.DB.TABLES.questions, {
                _id: ObjectID(row.questionId)
            });

            const question = data[0];

            let isPublished = question?.migrationReference?.isPublished;
            const referenceQuestionId = row?.referenceQuestionId;

            if (referenceQuestionId && !isPublished) {
                // call the api to publish the question in creation portal
                const res = await publishQuestion(referenceQuestionId).catch((err) => {
                    // increment question publish failed count and store the id
                    if (!migratedCount.failed.question.ids.includes(referenceQuestionId)) {
                        migratedCount.failed.question.count++;
                        migratedCount.failed.question.ids.push(referenceQuestionId);
                    }
                    logger.error(`Error while publishing the question for referenceQuestionId: ${referenceQuestionId} Error:
                    ${JSON.stringify(err.response.data)}`);
                });

                logger.info(
                    `createQuestion Template publish response: ${res} , "referenceQuestionId" ${referenceQuestionId} questionId, ${question?._id}`
                );

                if (res) {
                    question = {
                        ...question,
                        migrationReference: { isPublished: true },
                        isPublished: true
                    };
                    logger.info(`createQuestion Template published: ${referenceQuestionId}`);
                }
            }

            if (referenceQuestionId) {
                question.referenceQuestionId = referenceQuestionId;
                // update the query with referenceQuestionId and migrationReference isPublished status
                query = {
                    referenceQuestionId,
                    "migrationReference.isPublished": isPublished,
                };
            } else {
                query = {
                    ...query,
                    "migrationReference.isPublished": isPublished,
                };
            }

            if (!_.isEmpty(query) && question) {
                // update the questionid and published status in db
                await updateById(CONFIG.DB.TABLES.questions, question._id, {
                    ...query,
                });
            }
            console.log(row.questionId,referenceQuestionId)
        };

        // publish questionset 

        for (const row of csv) {

            let data = await findAll(CONFIG.DB.TABLES.solutions, {
                _id: ObjectID(row.solutionId)
            });

            const solution = data[0];

            let isPublished = solution.migrationReference?.isPublished;
            const referenceQuestionSetId = row?.referenceQuestionSetId;

            if (referenceQuestionSetId && !isPublished) {
                // call the api to publish the questionset in creation portal
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
            const result = await updateSolutionsDb(query, solution?._id?.toString(), migratedCount);

        };



    } catch (err) {
        logger.error(`Error while migrating : ${err}`);
        console.log(err);
        throw new Error("Error occurred", err);
        
    }


}

publishQuestions()