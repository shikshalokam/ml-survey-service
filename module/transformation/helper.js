// Dependencies.
const { isEmpty, find, capitalize } = require("lodash");
const { readQuestion } = require("../../generics/services/question");
const { readQuestionSet } = require("../../generics/services/questionset");
const { questionType } = require("../../templates/questionTemp");
const {
  criteriaTemplate,
  defaultCriteria,
  baseAssessment,
  assessmentTemplate,
} = require("../../templates/criteriaAndAssessment");

module.exports = class Transformation {
  static getQuestionSetHierarchy(
    migratedId,
    submissionDocumentCriterias,
    solutionDocument,
    isPageQuestionsRequired = true
  ) {
    return new Promise(async (resolve, reject) => {
      const res = await readQuestionSet(migratedId).catch((err) => {
        console.log("Error", err?.response?.data);
        reject(err?.response?.data);
      });

      const questionSetHierarchy = res?.result?.questionSet;

      const migratedCriteriaQuestions = questionSetHierarchy?.children || [];
      const evidences = await this.questionEvidences(
        migratedCriteriaQuestions,
        submissionDocumentCriterias,
        isPageQuestionsRequired
      );

      assessmentTemplate.assessment.evidences[0].name = capitalize(
        solutionDocument?.type
      );
      assessmentTemplate.assessment.evidences[0].sections[0].name = `${capitalize(
        solutionDocument?.type
      )} Questions`;

      assessmentTemplate.assessment.evidences[0].sections[0].questions =
        evidences?.evidenceSections || [];
      assessmentTemplate.assessment.evidences[0].sections[0].code = "SQ";
      assessmentTemplate.assessment.evidences[0].code =
        assessmentTemplate.assessment.evidences[0].externalId = "SF";
      assessmentTemplate.assessment.evidences[0].description =
        questionSetHierarchy?.descripton || "";

      resolve({
        ...evidences,
        evidences: assessmentTemplate.assessment.evidences,
      });
    });
  }

  static questionEvidences(
    criteriaQuestions,
    submissionDocumentCriterias,
    isPageQuestionsRequired
  ) {
    return new Promise(async (resolve, reject) => {
      const evidenceSections = [];
      for (let i = 0; i < criteriaQuestions.length; i++) {
        const criteria = criteriaQuestions[i];
        const assessment = { ...baseAssessment };
        const criteriaObj = {};

        for (let key in criteriaTemplate) {
          if (key === "createdFor") {
            criteriaObj[key] = criteria[criteriaTemplate[key]]
              ? [criteria[criteriaTemplate[key]]]
              : [];
          } else if (defaultCriteria.includes(key)) {
            criteriaObj[key] = criteriaTemplate[key];
          } else if (!isEmpty(criteriaTemplate[key])) {
            criteriaObj[key] = criteria[criteriaTemplate[key]] || "";
          }
        }

        assessment.page = "p" + (i + 1);

        const children = criteria?.children || [];


        if (isPageQuestionsRequired && children.length > 0) {
          const pageQuestions = await this.getPageQuestions(
            criteria,
            children,
            []
          );

          const isMatrixQuestion = criteria?.instances?.label;
          
          let matrixQuestion = {};
          if (isMatrixQuestion) {
            matrixQuestion = this.getMatrixQuestions(criteria);
            matrixQuestion.instanceQuestions = pageQuestions;
            assessment.pageQuestions = matrixQuestion;
          } else {
            assessment.pageQuestions = pageQuestions;
          }
        }
        submissionDocumentCriterias.push(criteriaObj);
        if (children.length > 0) evidenceSections.push(assessment);
      }
      resolve({ evidenceSections, submissionDocumentCriterias });
    });
  }

  static getPageQuestions(criteria, children, pageQuestions) {
    const readQuestions = [];
    return new Promise(async (resolve, reject) => {



      for (let j = 0; j < children.length; j++) {
        const res = await readQuestion(children[j]?.identifier);

        let childData = res?.data;
        readQuestions.push(childData);

        // branchingLogic
        const branching = criteria?.branchingLogic;

        if (!isEmpty(branching) && childData) {
          childData = await this.updateChildDataWithBranching(
            branching,
            childData,
            readQuestions,
            children
          );
        }


        // question transformation
        const childTemplate = await this.tranformQuestionData(
          {},
          childData,
          j,
          children[j]
        );

        pageQuestions.push(childTemplate);
      }


      resolve(pageQuestions);
    });
  }

  static getTemplateType(childData) {
    const responseType = childData?.primaryCategory?.toLowerCase();
    let type = "";
    if (responseType === "text") {
      type =
        childData?.interactions.response1.type.number.toLowerCase() === "yes"
          ? "number"
          : "text";
    } else if (responseType === "multiselect multiple choice question") {
      type =
        childData?.responseDeclaration?.response1?.cardinality.toLowerCase() ===
        "single"
          ? "radio"
          : "multiselect";
    } else {
      type = responseType;
    }
    return type;
  }
  static updateChildDataWithBranching(
    branching,
    childData,
    readQuestions,
    children
  ) {
    return new Promise(async (resolve, reject) => {
      if (branching.hasOwnProperty(childData?.identifier)) {
        const ques = branching[childData.identifier];
        if (ques?.target?.length > 0) {
          childData.children = ques.target || [];
          childData.options = childData?.interactions?.response1.options;
        } else if (!isEmpty(ques?.preCondition)) {
          const operator = Object.keys(ques?.preCondition?.and[0]);

          const index = ques?.preCondition?.and[0][operator];


          let branchingQue = find(readQuestions, {
            identifier: ques?.source[0],
          });
          let branchingQueId = !isEmpty(branchingQue)
            ? branchingQue?.identifier
            : "";

          if (!branchingQueId) {
            branchingQue = find(children, { identifier: ques?.source[0] });
            branchingQueId = branchingQue?.identifier;
            const res = await readQuestion(branchingQueId);
            branchingQue = res?.data;
          }

          const i = index[1] === -1 ? 0 : index[1];

          const visibleIf = [
            {
              operator: operator[0] === "eq" ? "===" : "!==",
              value: [branchingQue?.interactions?.response1.options[i]?.value],
              _id: ques?.source[0],
            },
          ];
          childData.visibleIf = visibleIf || [];
        }
        resolve(childData);
      }
      resolve(childData);
    });
  }

  static tranformQuestionData(childQuestion, childData, index, child) {

    const type = this.getTemplateType(childData);


    return new Promise((resolve, reject) => {
      for (let key in questionType[type]) {
        const keyData = questionType[type][key];
        if (questionType.defaultFields.includes(key)) {
          childQuestion[key] = keyData;
        } else if (questionType.arrayFields.includes(key)) {

          childQuestion[key] = childData[keyData] || [];
        } else if (key === "question") {
          const questionData = [];
          let str = childData[keyData] ? childData[keyData] : "";
          while (str.length > 0) {
            const startIndex = str.indexOf("<p>");
            if (startIndex > -1) {
              const start = str.slice(startIndex + 3);
              const endIndex = start.indexOf("</p>");
              let end = start.slice(0, endIndex);

              end = end.replace("&nbsp", "");

              questionData.push(end);

              str = start.slice(endIndex);
            } else str = "";
          }

          childQuestion[key] = questionData;
        } else if (key === "validation") {
          const obj = {};
          for (const cKey in keyData) {
            if (cKey === "required") {
              const requir = childData?.interactions?.validation?.required;

              obj[cKey] =
                requir === true || requir === "Yes" || requir === "yes"
                  ? true
                  : false;
            } else if (cKey === "IsNumber") {
              const typen = childData?.interactions?.response1?.type?.number;
              obj[cKey] = typen.toLowerCase() === "yes" ? true : false;
            } else if (cKey === "max" || cKey === "min") {
              const slider =
                type === "slider"
                  ? childData?.interactions.response1.validation.range[cKey]
                  : type === "date"
                  ? childData?.interactions.validation[cKey]
                  : "";
              obj[cKey] = slider;
            }
          }
          childQuestion[key] = obj;
        } else if (key === "payload") {
          childQuestion[key] = {
            ...keyData,
            criteriaId: childData.identifier,
            responseType: type,
          };
        } else if (key === "file") {
          if (
            childData[keyData["type"]] &&
            childData[keyData["type"]].length > 0
          ) {
            const requir = childData?.interactions?.validation?.required;
            childQuestion[key] = {
              ...keyData,
              required:
                requir === true || requir === "Yes" || requir === "yes"
                  ? "Yes"
                  : "No",
              type: childData?.evidence?.type,
            };
          } else childQuestion[key] = "";
        } else if (key === "updatedAt" || key === "createdAt") {
          childQuestion[key] = child[keyData];
        } else if (key === "dateFormat") {
          childQuestion[key] =
            childData?.interactions?.response1?.validation?.pattern || "";
        } else if (key === "options") {
          childQuestion[key] =
            childData?.interactions?.response1?.options || [];
        } else if (key === "showRemarks" || key === "autoCapture") {
          const typen = childData[keyData];
          childQuestion[key] =
            key !== "autoCapture"
              ? typen === true || typen === "Yes" || typen === "yes"
                ? true
                : false
              : childData[keyData] || false;
        } else if (key === "questionNumber" || key === "page") {
          childQuestion[key] =
            key === "questionNumber" ? `${index + 1}` : baseAssessment.page;
        } else {
          childQuestion[key] = childData[keyData]
            ? childData[keyData]
            : child[keyData]
            ? child[keyData]
            : "";

        }
      }
      resolve(childQuestion);
    });
  }

  static getMatrixQuestions(criteria) {
    const matrixObj = {};
    for (let key in questionType.matrix) {
      if (key === "instanceIdentifier") {
        matrixObj["instanceIdentifier"] = criteria?.instances?.label || "";
      } else if (key === "payload") {
        matrixObj[key] = {
          ...questionType.matrix.payload,
          criteriaId: criteria.identifier,
          responseType: "matrix",
        };
      } else if (questionType.arrayFields.includes(key)) {
        matrixObj[key] =
          key !== "children" ? criteria[questionType.matrix[key]] : [];
      } else if (
        questionType.defaultFields.includes(key) ||
        key === "validation"
      ) {
        matrixObj[key] = questionType.matrix[key] || "";
      } else if (key !== "validation") {
        matrixObj[key] = criteria[questionType.matrix[key]] || "";
      }
    }

    return matrixObj;
  }
};
