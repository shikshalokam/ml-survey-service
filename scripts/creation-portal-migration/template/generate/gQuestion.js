const constants = require("../../constant");

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

  // Iterate through each key in the date template configuration.
  for (const key of Object.keys(questionDate)) {
    const questionKey = questionDate[key];
    const questionValue = question[questionKey];
    const keyInLowerCase = key.toLowerCase();

    // Directly assign static values from the date template.
    if (questionStaticDate.includes(key)) {
      template[key] = questionDate[key];
    } else {
      switch (keyInLowerCase) {
        case constants.INTERACTION_TYPES:
          // Wrap interaction type in an array.
          template[key] = [questionValue];
          break;

        case constants.BODY:
          // Format the body of the question as HTML.
          template[key] = getQuestionBodyParagraph(questionValue);
          break;

        case constants.EDITOR_STATE:
          // Set editor state with formatted question body.
          template[key] = {
            question: getQuestionBodyParagraph(question[questionDate.body]),
          };
          break;

        case constants.INTERACTIONS:
          // Define interactions with date validation pattern and autoCapture.
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

        case constants.EVIDENCE:
          // Set evidence details, including mimeType.
          template[key] = question?.file
            ? { ...question.file, mimeType: question.file.type }
            : { mimeType: [] };
          if (question?.file) template.showEvidence = "Yes";
          break;

        case constants.INSTRUCTIONS:
          // Set default instructions based on the question tip.
          template[key] = { default: question?.tip || "" };
          break;

        case constants.SHOW_REMARKS:
          // Determine if remarks should be shown.
          template[key] = questionValue ? constants.YES : constants.NO;
          break;

        case constants.NAME:
          // Set the question name, defaulting to "Question" if empty.
          template[key] = questionValue?.[0] || constants.QUESTION;
          break;

        default:
          // Assign other data directly or set to an empty string.
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

  const { slider: questionSlider } = questionTemplate;
  const { slider: questionStaticSlider } = questionStatic;

  // Iterate through each key in the slider template configuration.
  for (const key of Object.keys(questionSlider)) {
    const questionKey = questionSlider[key];
    const questionValue = question[questionKey];
    const keyL = key.toLowerCase();

    // Directly assign static values from the slider template.
    if (questionStaticSlider.includes(key)) {
      template[key] = questionSlider[key];
    } else {
      switch (keyL) {
        case constants.INTERACTION_TYPES:
          // Wrap interaction type in an array.
          template[key] = [questionValue];
          break;

        case constants.BODY:
          // Format the body of the question as HTML.
          template[key] = getQuestionBodyParagraph(questionValue);
          break;

        case constants.EDITOR_STATE:
          // Set editor state with formatted question body.
          template[key] = {
            question: getQuestionBodyParagraph(question[questionSlider.body]),
          };
          break;

        case constants.INTERACTIONS:
          // Define interactions with range and step settings for slider.
          template[key] = {
            [constants.VALIDATION]: {
              [constants.REQUIRED]: question?.validation?.[constants.REQUIRED]
                ? constants.YES
                : constants.NO,
            },
            [constants.RESPONSE_1]: {
              [constants.VALIDATION]: {
                [constants.SLIDER_RANGE]: {
                  [constants.SLIDER_MIN]: question?.validation?.min || 0,
                  [constants.SLIDER_MAX]: question?.validation?.max || 100,
                },
              },
              [constants.SLIDER_STEP]: "1",
            },
          };
          break;

        case constants.EVIDENCE:
          // Set evidence details, including mimeType.
          template[key] = question?.file
            ? {
              ...question.file,
              [constants.MIME_TYPE]: question.file.type,
            }
            : { [constants.MIME_TYPE]: [] };
          if (question?.file) template[constants.SHOW_EVIDENCE] = constants.YES;
          break;

        case constants.INSTRUCTIONS:
          // Set default instructions based on the question tip.
          template[key] = { [constants.DEFAULT]: question?.[constants.TIP] || "" };
          break;

        case constants.SHOW_REMARKS:
          // Determine if remarks should be shown.
          template[key] = questionValue ? constants.YES : constants.NO;
          break;

        case constants.NAME:
          // Set the question name, defaulting to the constant "Question" if empty.
          template[key] = questionValue?.[0] || constants.QUESTION;
          break;

        default:
          // Assign other data directly or set to an empty string.
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

  for (let key in questionTemplate[constants.MULTI_SELECT]) {
    const keyL = key.toLowerCase();

    // If the key is static, directly assign its value from the template.
    if (questionStatic[constants.MULTI_SELECT].includes(key)) {
      template[key] = questionTemplate[constants.MULTI_SELECT][key];
    } else {
      switch (keyL) {
        case constants.INTERACTION_TYPES:
          template[key] = [question[questionTemplate[constants.MULTI_SELECT][key]]];
          break;

        case constants.BODY:
          // Convert the question body into a structured HTML div format.
          template[key] = getQuestionBodyDiv(
            question[questionTemplate[constants.MULTI_SELECT][key]]
          );
          break;

        case constants.EDITOR_STATE:
          // Set the editor state with the formatted question body and options.
          template[key] = {
            question: getQuestionBodyDiv(
              question[questionTemplate[constants.MULTI_SELECT][constants.BODY]]
            ),
            options: getEditorOptions(question[constants.OPTIONS]),
          };
          break;

        case constants.INTERACTIONS:
          // Define interactions with validation and options settings.
          template[key] = {
            [constants.VALIDATION]: {
              [constants.REQUIRED]: question[constants.VALIDATION][constants.REQUIRED]
                ? constants.YES
                : constants.NO,
            },
            [constants.RESPONSE_1]: {
              type: constants.MULTI_SELECT, // Adjust if specific constant for "choice" exists
              options: getOptions(question[constants.OPTIONS]),
            },
          };
          break;

        case constants.EVIDENCE:
          // Set evidence details, including mimeType.
          template[key] = question[constants.FILE]
            ? {
              ...question[constants.FILE],
              [constants.MIME_TYPE]: question[constants.FILE][constants.MIME_TYPE],
            }
            : { [constants.MIME_TYPE]: [] };
          if (question?.[constants.FILE]) {
            template[constants.SHOW_EVIDENCE] = constants.YES;
          }
          break;

        case constants.INSTRUCTIONS:
          // Assign default instructions from the question tip.
          template[key] = { [constants.DEFAULT]: question[constants.TIP] };
          break;

        case constants.SHOW_REMARKS:
          // Determine if remarks should be shown.
          template[key] =
            question[questionTemplate[constants.MULTI_SELECT][key]] === true
              ? constants.YES
              : constants.NO;
          break;

        case constants.NAME:
          // Set the name of the question, defaulting to "Question" if empty.
          template[key] =
            question[questionTemplate[constants.MULTI_SELECT][key]]?.length > 0
              ? question[questionTemplate[constants.MULTI_SELECT][key]][0]
              : constants.QUESTION;
          break;

        default:
          // Assign any other data directly or default to an empty string.
          template[key] = question[questionTemplate[constants.MULTI_SELECT][key]] || "";
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

  // Format the date if a dateFormat is provided in the question.
  const dateFormat = question?.[constants.DATE_FORMAT]?.replace("-", "/") || "";

  // Retrieve the MCQ-specific template and static configuration.
  const mcqTemplate = questionTemplate[constants.MCQ];
  const mcqStatic = questionStatic[constants.MCQ];

  for (const key of Object.keys(mcqTemplate)) {
    const keyL = key.toLowerCase();

    // If the key is static, directly assign its value from the template.
    if (mcqStatic.includes(key)) {
      template[key] = mcqTemplate[key];
      continue;
    }

    const questionData = question[mcqTemplate[key]];

    switch (keyL) {
      case constants.INTERACTION_TYPES:
        template[key] = [questionData];
        break;

      case constants.BODY:
        // Convert the question body into a structured HTML div format.
        template[key] = getQuestionBodyDiv(questionData);
        break;

      case constants.EDITOR_STATE:
        // Set the editor state with the formatted question body and options.
        template[key] = {
          question: getQuestionBodyDiv(question[mcqTemplate[constants.BODY]]),
          options: getEditorOptions(question[constants.OPTIONS]),
        };
        break;

      case constants.INTERACTIONS:
        // Define interactions with validation and options settings.
        template[key] = {
          [constants.VALIDATION]: {
            [constants.REQUIRED]: question?.[constants.VALIDATION]?.[constants.REQUIRED]
              ? constants.YES
              : constants.NO,
          },
          [constants.RESPONSE_1]: {
            type: constants.CHOICE,
            options: getOptions(question[constants.OPTIONS]),
          },
        };
        break;

      case constants.EVIDENCE:
        // Set evidence details, including mimeType.
        template[key] = question[constants.FILE]
          ? {
            ...question[constants.FILE],
            [constants.MIME_TYPE]: question[constants.FILE][constants.MIME_TYPE],
          }
          : { [constants.MIME_TYPE]: [] };
        if (question[constants.FILE]) {
          template[constants.SHOW_EVIDENCE] = constants.YES;
        }
        break;

      case constants.INSTRUCTIONS:
        // Assign default instructions from the question tip.
        template[key] = { [constants.DEFAULT]: question[constants.TIP] };
        break;

      case constants.SHOW_REMARKS:
        // Determine if remarks should be shown.
        template[key] = questionData ? constants.YES : constants.NO;
        break;

      case constants.NAME:
        // Set the name of the question, defaulting to "Question" if empty.
        template[key] = questionData?.length > 0 ? questionData[0] : constants.QUESTION;
        break;

      default:
        // Assign any other data directly or default to an empty string.
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

  // Retrieve the text-specific template and static configuration.
  const textTemplate = questionTemplate[constants.TEXT];
  const textStatic = questionStatic[constants.TEXT];

  // Iterate over each key in the text template.
  for (const key of Object.keys(textTemplate)) {
    const keyL = key.toLowerCase();

    // If the key is static, directly assign its value from the template.
    if (textStatic.includes(key)) {
      template[key] = textTemplate[key];
      continue;
    }

    const questionData = question[textTemplate[key]];

    switch (keyL) {
      case constants.INTERACTION_TYPES:
        // Wrap the interaction type in an array.
        template[key] = [questionData];
        break;

      case constants.BODY:
        // Convert the question body into HTML paragraph format.
        template[key] = getQuestionBodyParagraph(questionData);
        break;

      case constants.EDITOR_STATE:
        // Set the editor state with the formatted question body.
        template[key] = {
          question: getQuestionBodyParagraph(question[textTemplate[constants.BODY]]),
        };
        break;

      case constants.INTERACTIONS:
        // Define interactions with validation and type settings.
        template[key] = {
          [constants.VALIDATION]: {
            [constants.REQUIRED]: question?.[constants.VALIDATION]?.[constants.REQUIRED]
              ? constants.YES
              : constants.NO,
          },
          [constants.RESPONSE_1]: {
            [constants.VALIDATION]: {
              [constants.LIMIT]: {
                [constants.MAX_LENGTH]: "100",
              },
            },
            [constants.TYPE]: {
              [constants.NUMBER]:
                type === constants.TEXT
                  ? constants.NO
                  : question?.[constants.VALIDATION]?.[constants.IS_NUMBER]
                    ? constants.YES
                    : constants.NO,
            },
          },
        };
        break;

      case constants.EVIDENCE:
        // Set evidence details, including mimeType.
        template[key] = question[constants.FILE]
          ? {
            ...question[constants.FILE],
            [constants.MIME_TYPE]: question[constants.FILE][constants.MIME_TYPE],
          }
          : { [constants.MIME_TYPE]: [] };
        if (question[constants.FILE]) {
          template[constants.SHOW_EVIDENCE] = constants.YES;
        }
        break;

      case constants.INSTRUCTIONS:
        // Assign default instructions from the question tip.
        template[key] = { [constants.DEFAULT]: question[constants.TIP] };
        break;

      case constants.SHOW_REMARKS:
        // Determine if remarks should be shown.
        template[key] = questionData ? constants.YES : constants.NO;
        break;

      case constants.NAME:
        // Set the name of the question, defaulting to "Question" if empty.
        template[key] = questionData?.length > 0 ? questionData[0] : constants.QUESTION;
        break;

      default:
        // Assign any other data directly or default to an empty string.
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
