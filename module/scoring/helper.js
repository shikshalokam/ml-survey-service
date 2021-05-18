/**
 * name : scoring/helper.js
 * author : Akash
 * created-date : 24-Apr-2020
 * Description : Scoring and rating functions.
 */

// Dependencies
const slackClient = require(ROOT_PATH + "/generics/helpers/slackCommunications");
const mathJs = require(ROOT_PATH + "/generics/helpers/mathFunctions");


/**
    * ScoringHelper
    * @class
*/
module.exports = class ScoringHelper {

    /**
     * submissions auto rated.
     * @method
     * @name allSubmission
     * @param {Object} allSubmission.isSubmitted - submission submitted value.
     * @returns {Boolean} submitted or not. 
     */

    static allSubmission(allSubmission) {

        return new Promise(async (resolve, reject) => {

            try {

                return resolve(allSubmission.isSubmitted);


            } catch (error) {
                return reject(error);
            }

        })
    }


    /**
     * Rate entities.
     * @method
     * @name rateEntities
     * @param {String} [sourceApiHelp = "multiRateApi"] - answer data.
     * @param {Array} submissionDocuments - submission data.   
     * @returns {Array}
     */

    static rateEntities(submissionDocuments, sourceApiHelp = "multiRateApi") {

        return new Promise(async (resolve, reject) => {

            try {

                let result = {};
                let resultingArray = new Array;

                await Promise.all(submissionDocuments.map(async eachSubmissionDocument => {

                    result.runUpdateQuery = true;

                    let answersToUpdate = {};

                    let allSubmittedEvidence = eachSubmissionDocument.evidencesStatus.every(this.allSubmission);

                    if (allSubmittedEvidence) {

                        result.criteria = {};
                        result.criteriaErrors = new Array;
                        result.themes = {};

                        let criteriaData = await Promise.all(eachSubmissionDocument.criteria.map(async (criteria) => {

                            if (criteria.weightage > 0) {

                                result.criteria[criteria.externalId] = {};
                                result.criteria[criteria.externalId].criteriaName = criteria.name;
                                result.criteria[criteria.externalId].criteriaExternalId = criteria.externalId;

                                let allCriteriaLevels = Object.values(criteria.rubric.levels).every(eachRubricLevels => {
                                    return eachRubricLevels.expression != "";
                                })

                                if (criteria.rubric.expressionVariables && allCriteriaLevels) {

                                    let submissionAnswers = new Array;

                                    const questionAndCriteriaValueExtractor = function (questionOrCriteria) {
                                        let result;
                                        const questionOrCriteriaArray = questionOrCriteria.split('.');

                                        if (_.includes(questionOrCriteriaArray, "entityProfile")) {

                                            if (eachSubmissionDocument.entityProfile && eachSubmissionDocument.entityProfile[questionOrCriteriaArray[1]]) {
                                                result = eachSubmissionDocument.entityProfile[questionOrCriteriaArray[1]];
                                            } else {
                                                result = eachSubmissionDocument.entityInformation[questionOrCriteriaArray[1]];
                                            }

                                            if (!result || result == "" || !(result.length >= 0)) {
                                                result = "NA";
                                            }

                                            submissionAnswers.push(result);
                                            return result;
                                        }


                                        if (questionOrCriteriaArray.findIndex(questionOrCriteria => _.includes(questionOrCriteria, "scoreOfAllQuestionInCriteria")) >= 0) {
                                            
                                            result = 0;

                                            let criteriaIdIndex = questionOrCriteriaArray.findIndex(questionOrCriteria => !(_.includes(questionOrCriteria, "scoreOfAllQuestionInCriteria")));
                                            let criteriaId = questionOrCriteriaArray[criteriaIdIndex];
                                            if (criteriaIdIndex < 0) {
                                                return "NA";
                                            }

                                            criteria.scoreAchieved = 0;
                                            criteria.maxScore = 0;
                                            criteria.percentageScore = 0;

                                            let allCriteriaQuestions = _.filter(_.values(eachSubmissionDocument.answers), _.matchesProperty('criteriaId', criteriaId));


                                            let scoreOfAllQuestionInCriteria = {};
                                            let totalWeightOfQuestionInCriteria = 0;
                                            allCriteriaQuestions.forEach((question,questionIndexInArray) => {
                                                if(question.value && (question.value != "" || Array.isArray(question.value)) && !question.notApplicable) {
                                                    let questionOptionsSelected = (Array.isArray(question.value)) ? question.value : [question.value]
                                                    if(questionOptionsSelected.length > 0) {
                                                        let selectedOptionScoreFound = false;
                                                        questionOptionsSelected.forEach(optionValue => {
                                                            if(eachSubmissionDocument.questionDocuments && eachSubmissionDocument.questionDocuments[question.qid.toString()]) {
                                                                
                                                                let optionScore = "NA";
                                                                
                                                                if(`${optionValue}-score` in eachSubmissionDocument.questionDocuments[question.qid.toString()]) {  
                                                                    optionScore = eachSubmissionDocument.questionDocuments[question.qid.toString()][`${optionValue}-score`];
                                                                } else if (eachSubmissionDocument.questionDocuments[question.qid.toString()].sliderOptions && eachSubmissionDocument.questionDocuments[question.qid.toString()].sliderOptions.length > 0) {
                                                                    let sliderOptionApplicable = _.find(eachSubmissionDocument.questionDocuments[question.qid.toString()].sliderOptions, { 'value': optionValue});
                                                                    optionScore = (sliderOptionApplicable && sliderOptionApplicable.score) ? sliderOptionApplicable.score : "NA";
                                                                }

                                                                if(optionScore != "NA") {
                                                                    if(scoreOfAllQuestionInCriteria[question.qid.toString()]) {
                                                                        scoreOfAllQuestionInCriteria[question.qid.toString()].scoreAchieved += optionScore;
                                                                        scoreOfAllQuestionInCriteria[question.qid.toString()].percentageScore = (eachSubmissionDocument.questionDocuments[question.qid.toString()].maxScore > 0 && scoreOfAllQuestionInCriteria[question.qid.toString()].score) ? ((scoreOfAllQuestionInCriteria[question.qid.toString()].score  / eachSubmissionDocument.questionDocuments[question.qid.toString()].maxScore)*100) : 0;
                                                                    } else {
                                                                        scoreOfAllQuestionInCriteria[question.qid.toString()] = {
                                                                            scoreAchieved : optionScore,
                                                                            weightage : (eachSubmissionDocument.questionDocuments[question.qid.toString()].weightage || eachSubmissionDocument.questionDocuments[question.qid.toString()].weightage === 0) ? eachSubmissionDocument.questionDocuments[question.qid.toString()].weightage : 1,
                                                                            questionIndexInArray : questionIndexInArray,
                                                                            percentageScore : (eachSubmissionDocument.questionDocuments[question.qid.toString()].maxScore > 0 && optionScore) ? ((optionScore / eachSubmissionDocument.questionDocuments[question.qid.toString()].maxScore)*100) : 0
                                                                        };
                                                                    }
                                                                    selectedOptionScoreFound = true;
                                                                }
                                                            }
                                                        })
                                                        if(selectedOptionScoreFound) {
                                                            totalWeightOfQuestionInCriteria += (eachSubmissionDocument.questionDocuments[question.qid.toString()].weightage  || eachSubmissionDocument.questionDocuments[question.qid.toString()].weightage === 0)  ? eachSubmissionDocument.questionDocuments[question.qid.toString()].weightage : 1;
                                                        }
                                                        if(selectedOptionScoreFound) {
                                                            question.optionScores = eachSubmissionDocument.questionDocuments[question.qid.toString()];
                                                            question.optionScores.percentageScore = (eachSubmissionDocument.questionDocuments[question.qid.toString()].maxScore > 0 && scoreOfAllQuestionInCriteria[question.qid.toString()].scoreAchieved) ? ((scoreOfAllQuestionInCriteria[question.qid.toString()].scoreAchieved / eachSubmissionDocument.questionDocuments[question.qid.toString()].maxScore)*100) : 0;
                                                            question.optionScores.scoreAchieved = (scoreOfAllQuestionInCriteria[question.qid.toString()].scoreAchieved) ? scoreOfAllQuestionInCriteria[question.qid.toString()].scoreAchieved : "";
                                                        }
                                                    }
                                                }
                                            })

                                            if(totalWeightOfQuestionInCriteria > 0 && Object.keys(scoreOfAllQuestionInCriteria).length > 0) {
                                                let criteriaMaxScore = 0;
                                                let criteriaScoreAchieved = 0;
                                                Object.keys(scoreOfAllQuestionInCriteria).forEach(questionId => {
                                                    const questionPointsBasedScore = (scoreOfAllQuestionInCriteria[questionId].scoreAchieved*scoreOfAllQuestionInCriteria[questionId].weightage)/totalWeightOfQuestionInCriteria;

                                                    result += questionPointsBasedScore
                                                    if(answersToUpdate[questionId]) {
                                                        answersToUpdate[questionId].pointsBasedScoreInParent = questionPointsBasedScore,
                                                        answersToUpdate[questionId].scoreAchieved = scoreOfAllQuestionInCriteria[questionId].scoreAchieved,
                                                        answersToUpdate[questionId].weightage = scoreOfAllQuestionInCriteria[questionId].weightage
                                                    } else {
                                                        answersToUpdate[questionId] = {
                                                            pointsBasedScoreInParent : questionPointsBasedScore,
                                                            scoreAchieved: scoreOfAllQuestionInCriteria[questionId].scoreAchieved,
                                                            weightage : scoreOfAllQuestionInCriteria[questionId].weightage,
                                                            maxScore : eachSubmissionDocument.questionDocuments[questionId].maxScore,
                                                            percentageScore : scoreOfAllQuestionInCriteria[questionId].percentageScore
                                                        };
                                                    }

                                                    criteriaMaxScore += eachSubmissionDocument.questionDocuments[questionId].maxScore;
                                                    criteriaScoreAchieved += scoreOfAllQuestionInCriteria[questionId].scoreAchieved;

                                                    allCriteriaQuestions[scoreOfAllQuestionInCriteria[questionId].questionIndexInArray].pointsBasedScoreInParent = questionPointsBasedScore;
                                                })

                                                if(criteriaMaxScore > 0) {
                                                    criteria.maxScore = criteriaMaxScore;
                                                }

                                                if(criteriaScoreAchieved > 0) {
                                                    criteria.scoreAchieved = criteriaScoreAchieved;
                                                }

                                                if(criteriaMaxScore > 0 && criteriaScoreAchieved > 0) {
                                                    criteria.percentageScore = ((criteriaScoreAchieved / criteriaMaxScore)*100);
                                                }
                                            }

                                            submissionAnswers.push(...allCriteriaQuestions);

                                            return result;
                                        }

                                        if (questionOrCriteriaArray.findIndex(questionOrCriteria => _.includes(questionOrCriteria, "countOfAllQuestionInCriteria")) >= 0) {
                                            result = 0;

                                            let criteriaIdIndex = questionOrCriteriaArray.findIndex(questionOrCriteria => !(_.includes(questionOrCriteria, "countOfAllQuestionInCriteria")));
                                            let criteriaId = questionOrCriteriaArray[criteriaIdIndex];
                                            if (criteriaIdIndex < 0) {
                                                return "NA";
                                            }

                                            let criteriaQuestionFunctionIndex = questionOrCriteriaArray.findIndex(questionOrCriteria => _.includes(questionOrCriteria, "countOfAllQuestionInCriteria"));
                                            let criteriaQuestionFunction = questionOrCriteriaArray[criteriaQuestionFunctionIndex];
                                            if (criteriaQuestionFunctionIndex < 0) {
                                                return "NA";
                                            }

                                            criteriaQuestionFunction = criteriaQuestionFunction.substring(
                                                criteriaQuestionFunction.lastIndexOf("(") + 1,
                                                criteriaQuestionFunction.lastIndexOf(")")
                                            );

                                            criteriaQuestionFunction = criteriaQuestionFunction.replace(/\s/g, '');

                                            let allCriteriaQuestions = _.filter(_.values(eachSubmissionDocument.answers), _.matchesProperty('criteriaId', criteriaId));


                                            let criteriaQuestionFilter = criteriaQuestionFunction.split(",");
                                            if (criteriaQuestionFilter[1]) {

                                                // allCriteriaQuestions = _.filter(allCriteriaQuestions, _.matchesProperty(_.head(criteriaQuestionFilter[1].split("=")), _.last(criteriaQuestionFilter[1].split("="))));

                                                let multipleConditionOperator = "";
                                                if (_.includes(criteriaQuestionFilter[1], "AND") > 0) {
                                                    multipleConditionOperator = "AND";
                                                }
                                                if (_.includes(criteriaQuestionFilter[1], "OR") > 0) {
                                                    multipleConditionOperator = "OR";
                                                }

                                                let conditionArray = new Array;
                                                if (multipleConditionOperator != "") {
                                                    conditionArray = criteriaQuestionFilter[1].split(multipleConditionOperator);
                                                } else {
                                                    conditionArray.push(criteriaQuestionFilter[1]);
                                                }


                                                let tempAllQuestion = new Array;

                                                allCriteriaQuestions.forEach(question => {

                                                    let conditionMatch = 0;
                                                    let conditionNotMatch = 0;

                                                    for (let pointerToConditionArray = 0; pointerToConditionArray < conditionArray.length; pointerToConditionArray++) {
                                                        let eachConditionArray = new Array;
                                                        let questionMatchOperator = "==";
                                                        if (_.includes(conditionArray[pointerToConditionArray], "!=") > 0) {
                                                            eachConditionArray = conditionArray[pointerToConditionArray].split("!=");
                                                            questionMatchOperator = "!=";
                                                        } else {
                                                            eachConditionArray = conditionArray[pointerToConditionArray].split("=");
                                                        }

                                                        let singleConditionOperator = "";
                                                        if (_.includes(eachConditionArray[1], "&&") > 0) {
                                                            singleConditionOperator = "&&";
                                                        }
                                                        if (_.includes(eachConditionArray[1], "||") > 0) {
                                                            singleConditionOperator = "||";
                                                        }


                                                        let allPossibleValues = new Array;
                                                        if (singleConditionOperator != "") {
                                                            allPossibleValues = eachConditionArray[1].split(singleConditionOperator);
                                                        } else {
                                                            allPossibleValues.push(eachConditionArray[1]);
                                                        }

                                                        let conditionValueMatch = 0;
                                                        let conditionValueNotMatch = 0;
                                                        for (let pointerToAllPossibleValuesArray = 0; pointerToAllPossibleValuesArray < allPossibleValues.length; pointerToAllPossibleValuesArray++) {
                                                            const eachValue = allPossibleValues[pointerToAllPossibleValuesArray];
                                                            if (questionMatchOperator == "==" && _.isEqual(question[eachConditionArray[0]], eachValue)) {
                                                                conditionValueMatch += 1;
                                                            } else if (questionMatchOperator == "!=" && !_.isEqual(question[eachConditionArray[0]], eachValue)) {
                                                                conditionValueMatch += 1;
                                                            } else {
                                                                conditionValueNotMatch += 1;
                                                            }
                                                        }

                                                        if (singleConditionOperator == "||" && conditionValueMatch > 0) {
                                                            conditionMatch += 1;
                                                        } else if ((singleConditionOperator == "&&" || singleConditionOperator == "") && conditionValueNotMatch <= 0) {
                                                            conditionMatch += 1;
                                                        } else {
                                                            conditionNotMatch += 1;
                                                        }

                                                    }

                                                    if (multipleConditionOperator == "OR" && conditionMatch > 0) {
                                                        tempAllQuestion.push(question);
                                                    } else if ((multipleConditionOperator == "AND" || multipleConditionOperator == "") && conditionNotMatch <= 0) {
                                                        tempAllQuestion.push(question);
                                                    }

                                                })

                                                allCriteriaQuestions = tempAllQuestion;

                                            }

                                            submissionAnswers.push(...allCriteriaQuestions);

                                            allCriteriaQuestions.forEach(question => {
                                                if (question[_.head(criteriaQuestionFilter[0].split("="))] && question[_.head(criteriaQuestionFilter[0].split("="))] == _.last(criteriaQuestionFilter[0].split("="))) {
                                                    result += 1;
                                                }
                                            })

                                            return result;
                                        }

                                        eachSubmissionDocument.answers[questionOrCriteriaArray[0]] && submissionAnswers.push(eachSubmissionDocument.answers[questionOrCriteriaArray[0]])
                                        let inputTypes = ["value", "instanceResponses", "endTime", "startTime", "countOfInstances"];
                                        inputTypes.forEach(inputType => {
                                            if (questionOrCriteriaArray[1] === inputType) {
                                                if (eachSubmissionDocument.answers[questionOrCriteriaArray[0]] && (!eachSubmissionDocument.answers[questionOrCriteriaArray[0]].notApplicable || eachSubmissionDocument.answers[questionOrCriteriaArray[0]].notApplicable != true) && (eachSubmissionDocument.answers[questionOrCriteriaArray[0]][inputType] || eachSubmissionDocument.answers[questionOrCriteriaArray[0]][inputType] == 0)) {

                                                    result = eachSubmissionDocument.answers[questionOrCriteriaArray[0]][inputType];
                                                } else {
                                                    result = "NA";
                                                }
                                            }
                                        })
                                        return result;
                                    }

                                    let expressionVariables = {};
                                    let expressionResult = {};
                                    let allValuesAvailable = true;

                                    Object.keys(criteria.rubric.expressionVariables).forEach(variable => {
                                        if (variable != "default") {
                                            expressionVariables[variable] = questionAndCriteriaValueExtractor(criteria.rubric.expressionVariables[variable]);
                                            expressionVariables[variable] = (expressionVariables[variable] === "NA" && criteria.rubric.expressionVariables.default && criteria.rubric.expressionVariables.default[variable]) ? criteria.rubric.expressionVariables.default[variable] : expressionVariables[variable];
                                            if (expressionVariables[variable] === "NA") {
                                                allValuesAvailable = false;
                                            }
                                        }
                                    })

                                    let errorWhileParsingCriteriaExpression = false;
                                    let errorExpression = {};

                                    if (allValuesAvailable) {

                                        Object.keys(criteria.rubric.levels).forEach(level => {

                                            if (criteria.rubric.levels[level].expression != "") {

                                                try {

                                                    expressionResult[level] = {
                                                        expressionParsed: criteria.rubric.levels[level].expression,
                                                        result: mathJs.eval(criteria.rubric.levels[level].expression, expressionVariables)
                                                    };

                                                } catch (error) {
                                                    log.error("---------------Some exception caught begins---------------")
                                                    log.error("%o",error)
                                                    log.error("%s",criteria.name)
                                                    log.error("%s",criteria.rubric.levels[level].expression)
                                                    log.error("%s",expressionVariables)
                                                    log.error("%s",criteria.rubric.expressionVariables)
                                                    log.error("---------------Some exception caught ends---------------")

                                                    expressionResult[level] = {
                                                        expressionParsed: criteria.rubric.levels[level].expression
                                                    };

                                                    let errorObject = {
                                                        errorName: error.message,
                                                        criteriaName: criteria.name,
                                                        expression: criteria.rubric.levels[level].expression,
                                                        expressionVariables: JSON.stringify(expressionVariables),
                                                        errorLevels: criteria.rubric.levels[level].level,
                                                        expressionVariablesDefined: JSON.stringify(criteria.rubric.expressionVariables)
                                                    };

                                                    result.criteriaErrors.push(errorObject);

                                                    slackClient.rubricErrorLogs(errorObject);

                                                    errorWhileParsingCriteriaExpression = true;

                                                }

                                            } else {

                                                expressionResult[level] = {
                                                    expressionParsed: criteria.rubric.levels[level].expression,
                                                    result: false
                                                };
                                            }

                                        })

                                    }

                                    let score = "NA";
                                    if (allValuesAvailable && !errorWhileParsingCriteriaExpression) {
                                        score = "No Level Matched";
                                        if(expressionResult && Object.keys(expressionResult).length > 0) {
                                            const levelArrayFromHighToLow = _.reverse(Object.keys(expressionResult).sort());
                                            for (let levelIndex = 0; levelIndex < levelArrayFromHighToLow.length; levelIndex++) {
                                                const levelKey = levelArrayFromHighToLow[levelIndex];
                                                if(expressionResult[levelKey] && expressionResult[levelKey].result) {
                                                    score = levelKey;
                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    result.criteria[criteria.externalId].expressionVariablesDefined = criteria.rubric.expressionVariables;
                                    result.criteria[criteria.externalId].expressionVariables = expressionVariables;

                                    result.criteria[criteria.externalId].maxScore = criteria.maxScore;
                                    result.criteria[criteria.externalId].percentageScore = criteria.percentageScore;
                                    result.criteria[criteria.externalId].scoreAchieved = criteria.scoreAchieved;

                                    if (score == "NA") {
                                        result.criteria[criteria.externalId].valuesNotFound = true;
                                        result.criteria[criteria.externalId].score = score;
                                        criteria.score = score;
                                    } else if (score == "No Level Matched") {
                                        result.criteria[criteria.externalId].noExpressionMatched = true;
                                        result.criteria[criteria.externalId].score = score;
                                        criteria.score = score;
                                    } else {
                                        result.criteria[criteria.externalId].score = score;

                                        if( 
                                            criteria.rubric.levels[score]["improvement-projects"] 
                                        ) {
                                        
                                            criteria["improvement-projects"] = 
                                            criteria.rubric.levels[score]["improvement-projects"];
                                        }

                                        criteria.score = score;
                                    }

                                    if(eachSubmissionDocument.scoringSystem == messageConstants.common.POINTS_BASED_SCORING_SYSTEM) {
                                        criteria.pointsBasedScoreOfAllChildren = 0;
                                        submissionAnswers.forEach(answer => {
                                            if(answer.pointsBasedScoreInParent) criteria.pointsBasedScoreOfAllChildren += answer.pointsBasedScoreInParent;
                                        })
                                    }
                                    

                                    result.criteria[criteria.externalId].expressionResult = expressionResult;
                                    result.criteria[criteria.externalId].submissionAnswers = submissionAnswers;
                                }

                            }

                            return criteria;

                        }));

                        if (criteriaData.findIndex(criteria => criteria === undefined) >= 0) {
                            result.runUpdateQuery = false;
                        }

                        let themes = {};

                        if(result.runUpdateQuery && eachSubmissionDocument.scoringSystem == messageConstants.common.POINTS_BASED_SCORING_SYSTEM && eachSubmissionDocument.themes && eachSubmissionDocument.themes.length > 0) {
                                
                            themes = await this.calulateThemeScores(eachSubmissionDocument.themes, criteriaData);
                            
                            if(!themes.success) {
                                result.runUpdateQuery = false;
                            }
                            
                            result.themes = themes.themeResult;
                            result.themeErrors = themes.themeErrors;

                        }

                        if (result.runUpdateQuery) {

                            let updateObject = {$set : {}};

                            if(themes.success) {
                                updateObject.$set.themes = themes.themeData;
                                if(themes.criteriaToUpdate && Object.keys(themes.criteriaToUpdate).length > 0) {
                                    criteriaData.forEach(criteria => {
                                        if(themes.criteriaToUpdate[criteria._id.toString()]) {
                                            Object.keys(themes.criteriaToUpdate[criteria._id.toString()]).forEach(criteriaKeyToUpdate => {
                                                criteria[criteriaKeyToUpdate] = themes.criteriaToUpdate[criteria._id.toString()][criteriaKeyToUpdate];
                                            })
                                        }
                                    })
                                }
                            }

                            updateObject.$set.criteria = criteriaData;
                            updateObject.$set.ratingCompletedAt =  new Date();

                            if(answersToUpdate && Object.keys(answersToUpdate).length > 0) {
                                updateObject.$set.pointsBasedMaxScore = 0;
                                updateObject.$set.pointsBasedScoreAchieved = 0;
                                Object.keys(answersToUpdate).forEach(questionId => {
                                    if(Object.keys(answersToUpdate[questionId]).length > 0) {
                                        Object.keys(answersToUpdate[questionId]).forEach(answerField => {
                                            if(answerField == "maxScore") {
                                                updateObject.$set.pointsBasedMaxScore += answersToUpdate[questionId][answerField];
                                            }
                                            if(answerField == "scoreAchieved") {
                                                updateObject.$set.pointsBasedScoreAchieved += answersToUpdate[questionId][answerField];
                                            }
                                            if(answerField != "value" || answerField != "payload") {
                                                updateObject.$set[`answers.${questionId}.${answerField}`] = answersToUpdate[questionId][answerField];
                                            }
                                        })
                                    }
                                })
                                if(updateObject.$set.pointsBasedMaxScore > 0 && updateObject.$set.pointsBasedScoreAchieved >0) {
                                    updateObject.$set.pointsBasedPercentageScore = ((updateObject.$set.pointsBasedScoreAchieved/updateObject.$set.pointsBasedMaxScore)*100);
                                } else {
                                    updateObject.$set.pointsBasedPercentageScore = 0;
                                }
                            }

                            let submissionModel = (eachSubmissionDocument.submissionCollection) ? eachSubmissionDocument.submissionCollection : "submissions";

                            let updatedSubmissionDocument = await database.models[submissionModel].findOneAndUpdate(
                                {
                                    _id: eachSubmissionDocument._id
                                },
                                updateObject
                            );

                        }

                        let message = messageConstants.apiResponses.CRITERIA_RATING;

                        if (sourceApiHelp == "singleRateApi") {
                            return resolve({
                                result: result,
                                message: message
                            });
                        }

                        resultingArray.push({
                            runUpdateQuery: result.runUpdateQuery,
                            submissionId : eachSubmissionDocument._id,
                            entityId: eachSubmissionDocument.entityExternalId,
                            message: message
                        });

                    } else {

                        if (sourceApiHelp == "singleRateApi") {
                            return resolve({
                                status: httpStatusCode.not_found.status,
                                message: messageConstants.apiResponses.ALL_ECM_NOT_SUBMITTED
                            });
                        }

                        resultingArray.push({
                            runUpdateQuery: false,
                            submissionId : eachSubmissionDocument._id,
                            entityId: eachSubmissionDocument.entityExternalId,
                            message: messageConstants.apiResponses.ALL_ECM_NOT_SUBMITTED
                        });

                    }

                }))


                return resolve(resultingArray);


            } catch (error) {
                return reject(error);
            }

        })

    }


    /**
     * Calculate theme scores.
     * @method
     * @name calulateThemeScores
     * @param {Array} themesWithRubric
     * @param {Array} criteriaDataArray  
     * @returns {JSON} consists of success,themeData,themeResult,themeErrors,
     * criteriaToUpdate
     */

    static calulateThemeScores(themesWithRubric, criteriaDataArray) {

        return new Promise(async (resolve, reject) => {

            try {
                let themeScores = new Array;
                let themeErrors = new Array;
                let themeByHierarchyLevel = {};
                let maxThemeDepth = 0;
                let themeScoreCalculationCompleted = true;
                let themeResult = {};
                let criteriaMap = {};
                let criteriaToUpdate = {};

                for (let pointerToThemeArray = 0; pointerToThemeArray < themesWithRubric.length; pointerToThemeArray++) {
                    const theme = themesWithRubric[pointerToThemeArray];
                    if(theme.hierarchyLevel && theme.hierarchyLevel > maxThemeDepth) {
                        maxThemeDepth = theme.hierarchyLevel;
                    }
                    (themeByHierarchyLevel[theme.hierarchyLevel]) ? themeByHierarchyLevel[theme.hierarchyLevel].push(theme):  themeByHierarchyLevel[theme.hierarchyLevel] = [theme];
                }

                criteriaDataArray.forEach(criteria => {
                    criteriaMap[criteria._id.toString()] = criteria;
                })

                if(Object.keys(themeByHierarchyLevel).length > 0) {
                    while (maxThemeDepth >= 0) {
                        
                        if(themeByHierarchyLevel[maxThemeDepth]) {

                            let themeData = await Promise.all(themeByHierarchyLevel[maxThemeDepth].map(async (theme) => {

                                themeResult[theme.externalId] = {};
                                themeResult[theme.externalId].themeName = theme.name;
                                themeResult[theme.externalId].themeExternalId = theme.externalId;

                                if (theme.weightage > 0) {

                                    let allThemeLevelExpressions = Object.values(theme.rubric.levels).every(eachRubricLevels => {
                                        return eachRubricLevels.expression != "";
                                    })

                                    if (theme.rubric.expressionVariables && allThemeLevelExpressions) {

                                        let children = new Array;

                                        const subThemeValueExtractor = function (subTheme) {
                                            
                                            let result = "NA";
                                            
                                            const subThemeArray = subTheme.split('.');
                                            
                                            if (subThemeArray.findIndex(theme => _.includes(theme, "sumOfPointsOfAllChildren")) >= 0) {
                                                
                                                result = 0;

                                                let themeExternalIdIndex = subThemeArray.findIndex(theme => !(_.includes(theme, "sumOfPointsOfAllChildren")));
                                                if (themeExternalIdIndex < 0) {
                                                    return "NA";
                                                }

                                                let scoreOfAllSubthemeInTheme = {};
                                                let totalWeightOfSubthemeInTheme = 0;

                                                if(theme.immediateChildren) {
                                                    theme.immediateChildren.forEach(subTheme => {
                                                        const subThemeScore =  _.find(themeScores, { 'externalId': subTheme.externalId});
                                                        if(subTheme.weightage > 0) {
                                                            scoreOfAllSubthemeInTheme[subTheme.externalId] = {
                                                                subThemeExternalId :subTheme.externalId,
                                                                weightage : subTheme.weightage,
                                                                pointsBasedScoreOfAllChildren : subThemeScore.pointsBasedScoreOfAllChildren,
                                                                scoreAchieved : subThemeScore.scoreAchieved,
                                                                maxScore : subThemeScore.maxScore
                                                            };
                                                            totalWeightOfSubthemeInTheme += subTheme.weightage;
                                                        }
                                                    })
                                                }

                                                theme.criteriaLevelCount = {};

                                                theme.criteria.forEach(themeCriteria => {
                                                    if(themeCriteria.weightage > 0) {
                                                        if(criteriaMap[themeCriteria.criteriaId.toString()]) {
                                                            (theme.criteriaLevelCount[criteriaMap[themeCriteria.criteriaId.toString()].score]) ? theme.criteriaLevelCount[criteriaMap[themeCriteria.criteriaId.toString()].score] += 1 : theme.criteriaLevelCount[criteriaMap[themeCriteria.criteriaId.toString()].score] = 1;
                                                        }

                                                        if(!theme.immediateChildren && criteriaMap[themeCriteria.criteriaId.toString()]) {
                                                            scoreOfAllSubthemeInTheme[themeCriteria.criteriaId.toString()] = {
                                                                criteriaId :themeCriteria.criteriaId,
                                                                criteriaExternalId :themeCriteria.externalId,
                                                                weightage : themeCriteria.weightage,
                                                                pointsBasedScoreOfAllChildren : criteriaMap[themeCriteria.criteriaId.toString()].pointsBasedScoreOfAllChildren,
                                                                scoreAchieved : criteriaMap[themeCriteria.criteriaId.toString()].scoreAchieved,
                                                                maxScore : criteriaMap[themeCriteria.criteriaId.toString()].maxScore
                                                            };
                                                            totalWeightOfSubthemeInTheme += themeCriteria.weightage;
                                                        }

                                                    }
                                                })

                                                theme.pointsBasedScore = 0;
                                                theme.maxScore = 0;
                                                theme.scoreAchieved = 0;
                                                theme.percentageScore = 0;

                                                Object.keys(scoreOfAllSubthemeInTheme).length > 0 && Object.keys(scoreOfAllSubthemeInTheme).forEach(subThemeKey => {
                                                    result += (scoreOfAllSubthemeInTheme[subThemeKey].pointsBasedScoreOfAllChildren * scoreOfAllSubthemeInTheme[subThemeKey].weightage) / totalWeightOfSubthemeInTheme;
                                                    theme.maxScore += scoreOfAllSubthemeInTheme[subThemeKey].maxScore;
                                                    theme.scoreAchieved += scoreOfAllSubthemeInTheme[subThemeKey].scoreAchieved;
                                                    scoreOfAllSubthemeInTheme[subThemeKey].pointsBasedScoreInParent = (scoreOfAllSubthemeInTheme[subThemeKey].pointsBasedScoreOfAllChildren * scoreOfAllSubthemeInTheme[subThemeKey].weightage) / totalWeightOfSubthemeInTheme;
                                                    if(scoreOfAllSubthemeInTheme[subThemeKey].criteriaId) {
                                                        criteriaToUpdate[scoreOfAllSubthemeInTheme[subThemeKey].criteriaId.toString()] = {
                                                            pointsBasedScoreInParent : scoreOfAllSubthemeInTheme[subThemeKey].pointsBasedScoreInParent,
                                                        };
                                                    }
                                                })
                                                
                                                if(theme.maxScore > 0 && theme.scoreAchieved >0) {
                                                    theme.percentageScore = ((theme.scoreAchieved/theme.maxScore)*100);
                                                }
                                                
                                                children = Object.values(scoreOfAllSubthemeInTheme);
                                                
                                                
                                            }

                                            return result;
                                        }

                                        let expressionVariables = {};
                                        let expressionResult = {};
                                        let allValuesAvailable = true;

                                        Object.keys(theme.rubric.expressionVariables).forEach(variable => {
                                            if (variable != "default") {
                                                expressionVariables[variable] = subThemeValueExtractor(theme.rubric.expressionVariables[variable]);
                                                expressionVariables[variable] = (expressionVariables[variable] === "NA" && theme.rubric.expressionVariables.default && theme.rubric.expressionVariables.default[variable]) ? theme.rubric.expressionVariables.default[variable] : expressionVariables[variable];
                                                if (expressionVariables[variable] === "NA") {
                                                    allValuesAvailable = false;
                                                }
                                            }
                                        })

                                        let errorWhileParsingThemeExpression = false;
                                        let errorExpression = {};

                                        if (allValuesAvailable) {
                                            
                                            Object.keys(theme.rubric.levels).forEach(level => {

                                                if (theme.rubric.levels[level].expression != "") {

                                                    try {

                                                        expressionResult[level] = {
                                                            expressionParsed: theme.rubric.levels[level].expression,
                                                            result: mathJs.eval(theme.rubric.levels[level].expression, expressionVariables)
                                                        };

                                                    } catch (error) {
                                                        log.error("---------------Some exception caught begins---------------")
                                                        log.error("%o",error)
                                                        log.error("%s",theme.name)
                                                        log.error("%s",theme.rubric.levels[level].expression)
                                                        log.error("%s",expressionVariables)
                                                        log.error("%s",theme.rubric.expressionVariables)
                                                        log.error("---------------Some exception caught ends---------------")

                                                        expressionResult[level] = {
                                                            expressionParsed: theme.rubric.levels[level].expression
                                                        };

                                                        let errorObject = {
                                                            errorName: error.message,
                                                            themeName: theme.name,
                                                            expression: theme.rubric.levels[level].expression,
                                                            expressionVariables: JSON.stringify(expressionVariables),
                                                            errorLevels: theme.rubric.levels[level].level,
                                                            expressionVariablesDefined: JSON.stringify(theme.rubric.expressionVariables)
                                                        };
                                                        
                                                        themeErrors.push(errorObject);

                                                        slackClient.rubricErrorLogs(errorObject);

                                                        errorWhileParsingThemeExpression = true;

                                                    }

                                                } else {

                                                    expressionResult[level] = {
                                                        expressionParsed: theme.rubric.levels[level].expression,
                                                        result: false
                                                    };
                                                }

                                            })

                                        }

                                        let score = "NA";
                                        if (allValuesAvailable && !errorWhileParsingThemeExpression) {
                                            score = "No Level Matched";
                                            if(expressionResult && Object.keys(expressionResult).length > 0) {
                                                const levelArrayFromHighToLow = _.reverse(Object.keys(expressionResult).sort());
                                                for (let levelIndex = 0; levelIndex < levelArrayFromHighToLow.length; levelIndex++) {
                                                    const levelKey = levelArrayFromHighToLow[levelIndex];
                                                    if(expressionResult[levelKey] && expressionResult[levelKey].result) {
                                                        score = levelKey;
                                                    }
                                                }
                                            }
                                        }

                                        themeResult[theme.externalId].expressionVariablesDefined = theme.rubric.expressionVariables;
                                        themeResult[theme.externalId].expressionVariables = expressionVariables;
                                        themeResult[theme.externalId].maxScore = theme.maxScore;
                                        themeResult[theme.externalId].percentageScore = theme.percentageScore;
                                        themeResult[theme.externalId].scoreAchieved = theme.scoreAchieved;

                                        if (score == "NA") {
                                            themeResult[theme.externalId].valuesNotFound = true;
                                            themeResult[theme.externalId].pointsBasedLevel = score;
                                            theme.pointsBasedLevel = score
                                        } else if (score == "No Level Matched") {
                                            themeResult[theme.externalId].noExpressionMatched = true;
                                            themeResult[theme.externalId].pointsBasedLevel = score;
                                            theme.pointsBasedLevel = score;
                                        } else {
                                            themeResult[theme.externalId].pointsBasedLevel = score;
                                            theme.pointsBasedLevel = score;
                                        }


                                        theme.pointsBasedScoreOfAllChildren = 0;
                                        children.forEach(child => {
                                            if(child.pointsBasedScoreInParent) {
                                                theme.pointsBasedScoreOfAllChildren += child.pointsBasedScoreInParent;
                                            }
                                        })

                                        themeResult[theme.externalId].expressionResult = expressionResult;
                                        themeResult[theme.externalId].children = children;
                                    }

                                }

                                return theme;

                            }));

                            if (themeData.findIndex(theme => theme === undefined) >= 0) {
                                maxThemeDepth = -1;
                                themeScoreCalculationCompleted = false;
                                break;
                            }

                            themeScores = themeScores.concat(themeData);
                        }

                        maxThemeDepth -= 1;
                    }
                }

                return resolve({
                    success : themeScoreCalculationCompleted,
                    themeData : themeScores,
                    themeResult : themeResult,
                    themeErrors : themeErrors,
                    criteriaToUpdate : criteriaToUpdate
                });


            } catch (error) {
                return reject(error);
            }

        })
    }

};


