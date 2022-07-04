const questionTemplate = {
  date: {
    name: "Migrated Question",
    code: "externalId",
    mimeType: "application/vnd.sunbird.question",
    primaryCategory: "responseType",
    interactionTypes: "responseType",
    showRemarks: "showRemarks",
    instructions: {
      en: [null],
    },
    body: "question",
    editorState: {
      question: "question",
    },
    responseDeclaration: {
      response1: {
        type: "string",
      },
    },
    interactions: {
      validation: "validation",
      response1: {
        validation: {
          pattern: "dateFormat",
        },
        autoCapture: "autoCapture",
      },
    },
    hints: "hint",
  },
  slider: {
    name: "Migrated Question-Slider Type",
    code: "externalId",
    mimeType: "application/vnd.sunbird.question",
    primaryCategory: "responseType",
    interactionTypes: "responseType",
    showRemarks: "showRemarks",
    instructions: {
      en: [null],
    },
    body: "question",
    editorState: {
      question: "question",
    },
    responseDeclaration: {
      response1: {
        type: "integer",
        maxScore: 1,
      },
    },
    interactions: {
      validation: {
        required: "validation.required",
      },
      response1: {
        validation: {
          range: {
            min: "validation.min",
            max: "validation.max",
          },
        },
        step: "1",
      },
    },
    hints: "hint",
    evidence: {
      mimeType: "file.type",
    },
  },
  multiselect: {
    name: "Migrated Question",
    code: "externalId",
    mimeType: "application/vnd.sunbird.question",
    primaryCategory: "Multiselect Multiple Choice Question",
    interactionTypes: ["choice"],
    showRemarks: "showRemarks",
    body: "question",
    hints: "hint",
    interactions: {
      response1: {
        type: "choice",
        options: [
          {
            label: "options[0]",
            value: 0,
          },
          {
            label: "options[1]",
            value: 1,
          },
          {
            label: "options[2]",
            value: 2,
          },
          {
            label: "options[3]",
            value: 3,
          },
          {
            label: "options[4]",
            value: 4,
          },
        ],
      },
      validation: "validation",
    },
    editorState: {
      options: [
        {
          answer: false,
          value: {
            body: "options[0]",
            value: 0,
          },
        },
        {
          answer: false,
          value: {
            body: "options[1]",
            value: 1,
          },
        },
        {
          answer: false,
          value: {
            body: "options[2]",
            value: 2,
          },
        },
        {
          answer: false,
          value: {
            body: "options[3]",
            value: 3,
          },
        },
        {
          answer: false,
          value: {
            body: "options[4]",
            value: 4,
          },
        },
      ],
      question: "question",
    },
    instructions: {
      en: [null],
    },
    evidence: {
      mimeType: "file.type",
    },
    responseDeclaration: {
      response1: {
        maxScore: 1,
        cardinality: "multiple",
        type: "integer",
        correctResponse: {
          outcomes: {
            SCORE: 1,
          },
        },
        mapping: [],
      },
    },
  },
  mcq: {
    name: "Migrated Question",
    code: "externalId",
    description: "",
    mimeType: "application/vnd.sunbird.question",
    primaryCategory: "Multiselect Multiple Choice Question",
    interactionTypes: ["choice"],
    body: "question",
    interactions: {
      validation: "validation",
      response1: {
        type: "choice",
        options: [
          {
            value: 0,
            label: "options[0]",
          },
          {
            value: 1,
            label: "options[1]",
          },
        ],
      },
    },
    editorState: {
      options: [
        {
          answer: false,
          value: {
            body: "options[0]",
            value: 0,
          },
        },
        {
          answer: false,
          value: {
            body: "options[1]",
            value: 1,
          },
        },
      ],
      question: "question",
    },
    responseDeclaration: {
      response1: {
        maxScore: 0,
        cardinality: "single",
        type: "integer",
        correctResponse: {
          outcomes: {
            SCORE: 0,
          },
        },
      },
    },
    instructions: {
      default: "tip",
    },
    hints: "hint",
  },
  text: {
    name: "Migrated Question",
    code: "externalId",
    mimeType: "application/vnd.sunbird.question",
    primaryCategory: "Text",
    interactionTypes: ["text"],
    showRemarks: "showRemarks",
    body: "question",
    instructions: {
      en: [null],
    },
    editorState: {
      question: "question",
    },
    responseDeclaration: {
      response1: {
        type: "string",
        maxScore: 1,
      },
    },
    interactions: {
      validation: {
        required: "validation.required",
      },
      response1: {
        validation: {
          limit: {
            maxLength: "100",
          },
        },
        type: {
          number: "validation.isNumber",
        },
      },
    },
    hints: "hint",
  },
  
};

const questionStatic = {
  date: ["name", "mimeType", "instructions", "responseDeclaration"],
  slider: ["name", "mimeType", "instructions", "responseDeclaration"],
  multiselect: [
    "name",
    "mimeType",
    "instructions",
    "primaryCategory",
    "interactionTypes",
    "responseDeclaration",
  ],
  mcq: [
    "name",
    "mimeType",
    "primaryCategory",
    "interactionTypes",
    "responseDeclaration",
  ],
  text: [
    "name",
    "mimeType",
    "instructions",
    "primaryCategory",
    "interactionTypes",
    "responseDeclaration",
    "instructions"
  ]
};

module.exports = {
  questionTemplate,
  questionStatic,
};
