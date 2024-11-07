const { questionTemplate, questionStatic } = require("../config/question");

/**
 * To map the body field data
 * @method
 * @name getQuestionBodyParagraph
 * @param {Object} questionData - questionData
 * @returns {String} - returns mapped body field data with p tag
 **/
const getQuestionBodyParagraph = (questionData) => {
  return questionData
    .map((data) => {
      return `<p>${data}</p>`;
    })
    .join("");
};

/**
 * To map the body field data  with div tag
 * @method
 * @name getQuestionBodyDiv
 * @param {Object} questionData - questionData
 * @returns {String} - returns mapped body field data with div tag
 **/
const getQuestionBodyDiv = (questionData) => {
  const divs = questionData
    .map((data) => {
      return `<div class='mcq-title'><p>${data}&nbsp</p></div><div data-choice-interaction='response1' class='mcq-vertical'></div>`;
    })
    .join("");
  const div = `<div class='question-body'>${divs}</div>`;
  return div;
};

/**
 * To map the question type date
 * @method
 * @name getDateTemplate
 * @param {Object} question - question
 * @returns {Object} - returns mapped date type question
 **/
const getDateTemplate = (question) => {
  const template = {};
  const dateFormat = question?.dateFormat?.replace("-", "/") || "";
  const { date: questionDate } = questionTemplate;
  const { date: questionStaticDate } = questionStatic;

  console.log("getDate");

  for (const key of Object.keys(questionDate)) {
    const questionKey = questionDate[key];
    const questionValue = question[questionKey];
    const keyInLowerCase = key.toLowerCase();

    if (questionStaticDate.includes(key)) {
      template[key] = questionDate[key];
    } else {
      switch (keyInLowerCase) {
        case "interactiontypes":
          template[key] = [questionValue];
          break;

        case "body":
          template[key] = getQuestionBodyParagraph(questionValue);
          break;

        case "editorstate":
          template[key] = {
            question: getQuestionBodyParagraph(question[questionDate.body]),
          };
          break;

        case "interactions":
          template[key] = {
            validation: {
              required: question?.validation?.required ? "Yes" : "No",
            },
            response1: {
              validation: {
                pattern: dateFormat,
              },
              autoCapture: question?.autoCapture,
            },
          };
          break;

        case "evidence":
          template[key] = question?.file
            ? { ...question.file, mimeType: question.file.type }
            : { mimeType: [] };
          if (question?.file) template.showEvidence = "Yes";
          break;

        case "instructions":
          template[key] = { default: question?.tip || "" };
          break;

        case "showremarks":
          template[key] = questionValue ? "Yes" : "No";
          break;

        case "name":
          template[key] = questionValue?.[0] || "Question";
          break;

        default:
          template[key] = questionValue || "";
          break;
      }
    }
  }

  return template;
};


/**
 * To map the question type slider
 * @method
 * @name getSliderTemplate
 * @param {Object} question - question
 * @returns {Object} - returns mapped slider type question
 **/
const getSliderTemplate = (question) => {
  const template = {};
  console.log("getSlider");

  const { slider: questionSlider } = questionTemplate;
  const { slider: questionStaticSlider } = questionStatic;

  for (const key of Object.keys(questionSlider)) {
    const questionKey = questionSlider[key];
    const questionValue = question[questionKey];
    const keyL = key.toLowerCase();

    if (questionStaticSlider.includes(key)) {
      template[key] = questionSlider[key];
    } else {
      switch (keyL) {
        case "interactiontypes":
          template[key] = [questionValue];
          break;

        case "body":
          template[key] = getQuestionBodyParagraph(questionValue);
          break;

        case "editorstate":
          template[key] = {
            question: getQuestionBodyParagraph(question[questionSlider.body]),
          };
          break;

        case "interactions":
          template[key] = {
            validation: {
              required: question?.validation?.required ? "Yes" : "No",
            },
            response1: {
              validation: {
                range: {
                  min: question?.validation?.min || 0,
                  max: question?.validation?.max || 100,
                },
              },
              step: "1",
            },
          };
          break;

        case "evidence":
          template[key] = question?.file
            ? { ...question.file, mimeType: question.file.type }
            : { mimeType: [] };
          if (question?.file) template.showEvidence = "Yes";
          break;

        case "instructions":
          template[key] = { default: question?.tip || "" };
          break;

        case "showremarks":
          template[key] = questionValue ? "Yes" : "No";
          break;

        case "name":
          template[key] = questionValue?.[0] || "Question";
          break;

        default:
          template[key] = questionValue || "";
          break;
      }
    }
  }

  return template;
};

/**
 * To get question options and update the object values as strings
 * @method
 * @name getOptions
 * @param {Object[]} options - options
 * @returns {Object[]} - returns options
 **/

const getOptions = (options) => {
  options.map((values, index) => {
    values.value = `${values?.value}`;
    values.label = `${values.label}`;
  });
  return options;
};

/**
 * To get question options and update the object values
 * @method
 * @name getEditorOptions
 * @param {Object[]} options - options
 * @returns {Object[]} - returns options
 **/
const getEditorOptions = (options) => {
  const data = options.map((values, index) => {
    return {
      answer: false,
      value: {
        body: `<p>${values.label}</p>`,
        value: index,
      },
    };
  });
  return data;
};

/**
 * To map the question type multiselect mcq
 * @method
 * @name getMultipleSelectMCQTemplate
 * @param {Object} question - question
 * @returns {Object} - returns mapped multiselect mcq type question
 **/
const getMultipleSelectMCQTemplate = (question) => {
  const template = {};

  console.log("getMultipleSelectMCQ");

  for (let key in questionTemplate.multiselect) {
    const keyL = key.toLowerCase();
    if (questionStatic.multiselect.includes(key)) {
      template[key] = questionTemplate.multiselect[key];
    } else {
      switch (keyL) {
        case "interactiontypes":
          template[key] = [question[questionTemplate.multiselect[key]]];
          break;

        case "body":
          template[key] = getQuestionBodyDiv(
            question[questionTemplate.multiselect[key]]
          );
          break;

        case "editorstate":
          template[key] = {
            question: getQuestionBodyDiv(
              question[questionTemplate.multiselect["body"]]
            ),
            options: getEditorOptions(question["options"]),
          };
          break;

        case "interactions":
          template[key] = {
            validation: {
              required: question["validation"]["required"] ? "Yes" : "No",
            },
            response1: {
              type: "choice",
              options: getOptions(question["options"]),
            },
          };
          break;

        case "evidence":
          template[key] = question["file"]
            ? { ...question["file"], mimeType: question["file"]["type"] }
            : { mimeType: [] };
          if (question?.file) {
            template["showEvidence"] = "Yes";
          }
          break;

        case "instructions":
          template[key] = { default: question["tip"] };
          break;

        case "showremarks":
          template[key] =
            question[questionTemplate.multiselect[key]] === true ? "Yes" : "No";
          break;

        case "name":
          template[key] =
            question[questionTemplate.multiselect[key]]?.length > 0
              ? question[questionTemplate.multiselect[key]][0]
              : "Question";
          break;

        default:
          template[key] = question[questionTemplate.multiselect[key]] || "";
          break;
      }
    }
  }

  return template;
};

/**
 * To map the question type mcq
 * @method
 * @name getMCQTemplate
 * @param {Object} question - question
 * @returns {Object} - returns mapped mcq type question
 **/
const getMCQTemplate = (question) => {
  const template = {};
  console.log("getMcq");

  const dateFormat = question?.dateFormat?.replace("-", "/") || "";
  const mcqTemplate = questionTemplate.mcq;
  const mcqStatic = questionStatic.mcq;

  for (const key of Object.keys(mcqTemplate)) {
    const keyL = key.toLowerCase();

    if (mcqStatic.includes(key)) {
      template[key] = mcqTemplate[key];
      continue;
    }

    const questionData = question[mcqTemplate[key]];

    switch (keyL) {
      case "interactiontypes":
        template[key] = [questionData];
        break;

      case "body":
        template[key] = getQuestionBodyDiv(questionData);
        break;

      case "editorstate":
        template[key] = {
          question: getQuestionBodyDiv(question[mcqTemplate.body]),
          options: getEditorOptions(question.options),
        };
        break;

      case "interactions":
        template[key] = {
          validation: {
            required: question?.validation?.required ? "Yes" : "No",
          },
          response1: {
            type: "choice",
            options: getOptions(question.options),
          },
        };
        break;

      case "evidence":
        template[key] = question.file
          ? { ...question.file, mimeType: question.file.type }
          : { mimeType: [] };
        if (question.file) template.showEvidence = "Yes";
        break;

      case "instructions":
        template[key] = { default: question.tip };
        break;

      case "showremarks":
        template[key] = questionData ? "Yes" : "No";
        break;

      case "name":
        template[key] = questionData?.length > 0 ? questionData[0] : "Question";
        break;

      default:
        template[key] = questionData || "";
        break;
    }
  }

  return template;
};


/**
 * To map the question type text
 * @method
 * @name getTextTemplate
 * @param {Object} question - question
 * @returns {Object} - returns mapped text type question
 **/
const getTextTemplate = (question, type) => {
  const template = {};
  console.log("getText");

  const textTemplate = questionTemplate.text;
  const textStatic = questionStatic.text;

  for (const key of Object.keys(textTemplate)) {
    const keyL = key.toLowerCase();

    if (textStatic.includes(key)) {
      template[key] = textTemplate[key];
      continue;
    }

    const questionData = question[textTemplate[key]];

    switch (keyL) {
      case "interactiontypes":
        template[key] = [questionData];
        break;

      case "body":
        template[key] = getQuestionBodyParagraph(questionData);
        break;

      case "editorstate":
        template[key] = {
          question: getQuestionBodyParagraph(question[textTemplate.body]),
        };
        break;

      case "interactions":
        template[key] = {
          validation: {
            required: question?.validation?.required ? "Yes" : "No",
          },
          response1: {
            validation: {
              limit: {
                maxLength: "100",
              },
            },
            type: {
              number:
                type === "text"
                  ? "No"
                  : question?.validation?.IsNumber
                  ? "Yes"
                  : "No",
            },
          },
        };
        break;

      case "evidence":
        template[key] = question.file
          ? { ...question.file, mimeType: question.file.type }
          : { mimeType: [] };
        if (question.file) template.showEvidence = "Yes";
        break;

      case "instructions":
        template[key] = { default: question.tip };
        break;

      case "showremarks":
        template[key] = questionData ? "Yes" : "No";
        break;

      case "name":
        template[key] = questionData?.length > 0 ? questionData[0] : "Question";
        break;

      default:
        template[key] = questionData || "";
        break;
    }
  }

  return template;
};


module.exports = {
  getDateTemplate,
  getSliderTemplate,
  getMultipleSelectMCQTemplate,
  getTextTemplate,
  getMCQTemplate,
};
