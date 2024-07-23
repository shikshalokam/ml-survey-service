const { questionTemplate, questionStatic } = require("../config/question");

/**
* To map the body field data 
* @method
* @name getQBodyParagraph
* @param {Object} questionData - questionData
* @returns {String} - returns mapped body field data with p tag
**/
const getQBodyParagraph = (questionData) => {
  return questionData
    .map((data) => {
      return `<p>${data}</p>`;
    })
    .join("");
};

/**
* To map the body field data  with div tag
* @method
* @name getQBodyDiv
* @param {Object} questionData - questionData
* @returns {String} - returns mapped body field data with div tag
**/
const getQBodyDiv = (questionData) => {
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
  console.log("getDate");

  for (let key in questionTemplate.date) {
    const keyL = key.toLowerCase();
    let date = question["dateFormat"] ? question["dateFormat"].replace("-", "/"): "";

    if (questionStatic.date.includes(key)) {
      template[key] = questionTemplate.date[key];
    } else if (keyL === "interactiontypes") {
      template[key] = [question[questionTemplate.date[key]]];
    } else if (keyL === "body") {
      template[key] = getQBodyParagraph(question[questionTemplate.date[key]]);
    } else if (keyL === "editorstate") {
      template[key] = {
        question: getQBodyParagraph(question[questionTemplate.date["body"]]),
      };
    } else if (keyL === "interactions") {
      template[key] = {
        validation: {
          required: question["validation"]["required"] ? 'Yes' : 'No',
        },
        response1: {
          validation: {
            pattern: question["dateFormat"] ? date.replace("-", "/"): question["dateFormat"],
          },
          autoCapture: question["autoCapture"],
        },
      };
    } else if (keyL === "evidence") {
      template[key] = question["file"]
        ? { ...question["file"], mimeType: question["file"]["type"] }
        : { mimeType: [] };
      if (question?.file) {
        template['showEvidence'] = "Yes"
      }
    } else if (keyL === "instructions") {
      template[key] = { default: question["tip"] };
    } else if (keyL === 'showremarks') {
      template[key] = question[questionTemplate.date[key]] === true ? 'Yes' : 'No';
    } else if (keyL === 'name') {
      template[key] = question[questionTemplate.date[key]]?.length > 0 ? question[questionTemplate.date[key]][0] : "Question"
    } else {
      template[key] = question[questionTemplate.date[key]] || "";
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

  for (let key in questionTemplate.slider) {
    const keyL = key.toLowerCase();
    if (questionStatic.slider.includes(key)) {
      template[key] = questionTemplate.slider[key];
    } else if (keyL === "interactiontypes") {
      template[key] = [question[questionTemplate.slider[key]]];
    } else if (keyL === "body") {
      template[key] = getQBodyParagraph(question[questionTemplate.slider[key]]);
    } else if (keyL === "editorstate") {
      template[key] = {
        question: getQBodyParagraph(question[questionTemplate.slider["body"]]),
      };
    } else if (keyL === "interactions") {
      template[key] = {
        validation: {
          required: question["validation"]["required"] ? 'Yes' : 'No',
        },
        response1: {
          validation: {
            range: {
              min: question["validation"]["min"],
              max: question["validation"]["max"],
            },
          },
          step: "1",
        },
      };
    } else if (keyL === "evidence") {
      template[key] = question["file"]
        ? {...question["file"], mimeType: question["file"]["type"] }
        : { mimeType: [] };
        if (question?.file) {
          template['showEvidence'] = "Yes"
        }
    } else if (keyL === "instructions") {
      template[key] = { default: question["tip"] };
    } else if (keyL === 'showremarks') {
      template[key] = question[questionTemplate.slider[key]] === true ? 'Yes' : 'No';
    } else if (keyL === 'name') {
      template[key] = question[questionTemplate.slider[key]]?.length > 0 ? question[questionTemplate.slider[key]][0] : "Question"
    } else {
      template[key] = question[questionTemplate.slider[key]] || "";
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
* @name getMSMCQTemplate
* @param {Object} question - question
* @returns {Object} - returns mapped multiselect mcq type question
**/
const getMSMCQTemplate = (question) => {
  const template = {};

  console.log("getMSMCQ");


  for (let key in questionTemplate.multiselect) {
    const keyL = key.toLowerCase();
    if (questionStatic.multiselect.includes(key)) {
      template[key] = questionTemplate.multiselect[key];
    } else if (keyL === "interactiontypes") {
      template[key] = [question[questionTemplate.multiselect[key]]];
    } else if (keyL === "body") {
      template[key] = getQBodyDiv(question[questionTemplate.multiselect[key]]);
    } else if (keyL === "editorstate") {
      template[key] = {
        question: getQBodyDiv(question[questionTemplate.multiselect["body"]]),
        options: getEditorOptions(question["options"]),
      };
    } else if (keyL === "interactions") {
      template[key] = {
        validation: {
          required: question["validation"]["required"] ? 'Yes' : 'No',
        },
        response1: {
          type: "choice",
          options: getOptions(question["options"]),
        },
      };
    } else if (keyL === "evidence") {
      template[key] = question["file"]
        ? { ...question["file"], mimeType: question["file"]["type"] }
        : { mimeType: [] };
        if (question?.file) {
          template['showEvidence'] = "Yes"
        }
    } else if (keyL === "instructions") {
      template[key] = { default: question["tip"] };
    } else if (keyL === 'showremarks') {
      template[key] = question[questionTemplate.multiselect[key]] === true ? 'Yes' : 'No';
    } else if (keyL === 'name') {
      template[key] = question[questionTemplate.multiselect[key]]?.length > 0 ? question[questionTemplate.multiselect[key]][0] : "Question"
    } else {
      template[key] = question[questionTemplate.multiselect[key]] || "";
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
  console.log();
  console.log("getMcq", );
  console.log();

  for (let key in questionTemplate.mcq) {
    const keyL = key.toLowerCase();
    if (questionStatic.mcq.includes(key)) {
      template[key] = questionTemplate.mcq[key];
    } else if (keyL === "interactiontypes") {
      template[key] = [question[questionTemplate.mcq[key]]];
    } else if (keyL === "body") {
      template[key] = getQBodyDiv(question[questionTemplate.mcq[key]]);
    } else if (keyL === "editorstate") {
      template[key] = {
        question: getQBodyDiv(question[questionTemplate.mcq["body"]]),
        options: getEditorOptions(question["options"]),
      };
    } else if (keyL === "interactions") {
      template[key] = {
        validation: {
          required: question["validation"]["required"] ? 'Yes' : 'No',
        },
        response1: {
          type: "choice",
          options: getOptions(question["options"]),
        },
      };
    } else if (keyL === "evidence") {
      template[key] = question["file"]
        ? { ...question["file"], mimeType: question["file"]["type"] }
        : { mimeType: [] };
        if (question?.file) {
          template['showEvidence'] = "Yes"
        }
    } else if (keyL === "instructions") {
      template[key] = { default: question["tip"] };
    } else if (keyL === 'showremarks') {
      template[key] = question[questionTemplate.mcq[key]] === true ? 'Yes' : 'No';
    } else if (keyL === 'name') {
      template[key] = question[questionTemplate.mcq[key]]?.length > 0 ? question[questionTemplate.mcq[key]][0] : "Question"
    } else {
      template[key] = question[questionTemplate.mcq[key]] || "";
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


  for (let key in questionTemplate.text) {
    const keyL = key.toLowerCase();
    if (questionStatic.text.includes(key)) {
      template[key] = questionTemplate.text[key];
    } else if (keyL === "interactiontypes") {
      template[key] = [question[questionTemplate.text[key]]];
    } else if (keyL === "body") {
      template[key] = getQBodyParagraph(question[questionTemplate.text[key]]);
    } else if (keyL === "editorstate") {
      template[key] = {
        question: getQBodyParagraph(question[questionTemplate.text["body"]]),
      };
    } else if (keyL === "interactions") {
      template[key] = {
        validation: {
          required: question["validation"]["required"] ? 'Yes' : 'No',
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
                : question["validation"]["IsNumber"]
                ? "Yes"
                : "No",
          },
        },
      };
    } else if (keyL === "evidence") {
      template[key] = question["file"]
        ? { ...question["file"], mimeType: question["file"]["type"] }
        : { mimeType: [] };
        if (question?.file) {
          template['showEvidence'] = "Yes"
        }
    } else if (keyL === "instructions") {
      template[key] = { default: question["tip"] };
    } else if (keyL === 'showremarks') {
      template[key] = question[questionTemplate.text[key]] === true ? 'Yes' : 'No';
    } else if (keyL === 'name') {
      template[key] = question[questionTemplate.text[key]]?.length > 0 ? question[questionTemplate.text[key]][0] : "Question";
    } else {
      template[key] = question[questionTemplate.text[key]] || "";
    }
  }
  return template;
};


module.exports = {
  getDateTemplate,
  getSliderTemplate,
  getMSMCQTemplate,
  getTextTemplate,
  getMCQTemplate,
};
