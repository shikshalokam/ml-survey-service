const path = require('path');
const logger = require("../../logger");
const { questionTemplate, questionStatic } = require("../config/question");
const { writeJsFile } = require('../helper/filewritter');



const basePath = path.join(__dirname, '../');
const folderName = 'logTemplates';

const getQBodyParagraph = (questionData) => {
    return questionData
        .map((data) => {
            return `<p>${data}</p>`;
        })
        .join("");
};

const getQBodyDiv = (questionData) => {
    const divs = questionData
        .map((data) => {
            return `<div class='mcq-title'><p>${data}&nbsp</p></div><div data-choice-interaction='response1' class='mcq-vertical'></div>`;
        })
        .join("");
    const div = `<div class='question-body'>${divs}</div>`;
    return div;
};

const getDateTemplate = (question) => {
    const template = {};
    console.log("getDate");

    for (let key in questionTemplate.date) {
        const keyL = key.toLowerCase();
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
                        pattern: question["dateFormat"],
                    },
                    autoCapture: question["autoCapture"],
                },
            };
        } else if (keyL === "evidence") {
            template[key] = question["file"]
                ? { ...question["file"], mimeType: question["file"]["type"] }
                : { mimeType: [] };
        } else if (keyL === "instructions") {
            template[key] = { default: question["tip"] };
        } else if (keyL === 'showremarks') {
            template[key] = question[questionTemplate.date[key]] === true ? 'Yes' : 'No';
        }
        else {
            template[key] = question[questionTemplate.date[key]] || "";
        }
    }
    console.log("Date template", template);
    writeJsFile(basePath, folderName, "DateTemplate", template);
    return template;
};

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
                ? { ...question["file"], mimeType: question["file"]["type"] }
                : { mimeType: [] };
        } else if (keyL === "instructions") {
            template[key] = { default: question["tip"] };
        } else if (keyL === 'showremarks') {
            template[key] = question[questionTemplate.date[key]] === true ? 'Yes' : 'No';
        } else {
            template[key] = question[questionTemplate.slider[key]] || "";
        }
    }
    console.log("Slider template", template);
    writeJsFile(basePath, folderName, "SliderTemplate", template);
    return template;
};

const getOptions = (options) => {
    options.map((values, index) => {

        values.value = `${values?.value}`;
        values.label = `${values.label}`;
    });
    return options;
};

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
        } else if (keyL === "instructions") {
            template[key] = { default: question["tip"] };
        } else if (keyL === 'showremarks') {
            template[key] = question[questionTemplate.date[key]] === true ? 'Yes' : 'No';
        } else {
            template[key] = question[questionTemplate.multiselect[key]] || "";
        }
    }
    console.log("Multiple Select template", template);
    writeJsFile(basePath, folderName, "MultipleSelectTemplate", template);
    return template;
};

const getMCQTemplate = (question) => {
    const template = {};
    console.log();
    console.log("getMcq", JSON.stringify(questionTemplate.mcq));
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
        } else if (keyL === "instructions") {
            template[key] = { default: question["tip"] };
        } else if (keyL === 'showremarks') {
            template[key] = question[questionTemplate.date[key]] === true ? 'Yes' : 'No';
        } else {
            template[key] = question[questionTemplate.mcq[key]] || "";
        }
    }

    console.log("Multiple Choice template", template);
    writeJsFile(basePath, folderName, "MultipleChoiceTemplate", template);
    return template;
};

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
        } else if (keyL === "instructions") {
            template[key] = { default: question["tip"] };
        } else if (keyL === 'showremarks') {
            template[key] = question[questionTemplate.date[key]] === true ? 'Yes' : 'No';
        } else {
            template[key] = question[questionTemplate.text[key]] || "";
        }
    }
    console.log("Text template", template);
    writeJsFile(basePath, folderName, "TextTemplate", template);
    return template;
};


module.exports = {
    getDateTemplate,
    getSliderTemplate,
    getMSMCQTemplate,
    getTextTemplate,
    getMCQTemplate,
};
