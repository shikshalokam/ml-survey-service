const constants = Object.freeze({
  ED: "ed",
  CREATION_PORTAL: "creation_portal",
  DATE: "date",
  SLIDER: "slider",
  MULTI_SELECT: "multiselect",
  RADIO: "radio",
  MATRIX: "matrix",
  NON_MATRIX: "nonmatrix",
  TEXT: "text",
  NUMBER: "number",
  APPLICATION_URL_ENCODED: "application/x-www-form-urlencoded",
  APPLICATION_JSON: "application/json",
  SURVEY: "Survey",
  OBSERVATION: "Observation",
  QUESTION_SET: "QuestionSet",
  PENDING: "Pending",
  INSTANCE: "instance",
  MATRIX_SECTION: "Matrix Section",
  PARENT: "Parent",
  REFERENCE_QUESTION_ID: "referenceQuestionId",
  PUBLIC: "public",
  SEARCH_CRITERIA: "searchCriteria",
  DRAFT: "Draft",
  APPROVED: "Approved",
  MIGRATED: "migrated",
  UPDATED: "updated",
  PUBLISHED: "published",
  NOMINATED: "nominated",
  CONTRIBUTOR: "contributor",
  ACCEPTED: "accepted",

  // Migration Reference related constants
  MIGRATION_REFERENCE: {
    NAME: "migrationReference",
    SOURCING_PROGRAM_ID: "migrationReference.sourcingProgramId",
    IS_SRC_PROGRAM_UPDATED: "migrationReference.isSourceProgramUpdated",
    IS_SRC_PROGRAM_PUBLISHED: "migrationReference.isSourceProgramPublished",
    IS_NOMINATED: "migrationReference.isNominated",
    IS_CONTRIBUTOR_ADDED: "migrationReference.isContributorAdded",
    IS_CONTRIBUTOR_ACCEPTED: "migrationReference.isContributorAccepted",
    IS_HIERARCHY_UPDATED: "migrationReference.isHierarchyUpdated",
    IS_BRANCHING_UPDATED: "migrationReference.isBranchingUpdated",
    IS_PUBLISHED: "migrationReference.isPublished",
  },

  // User roles
  USER_ROLES: {
    CONTRIBUTOR: "CONTRIBUTOR",
    REVIEWER: "REVIEWER",
  },

  // Object categories
  OBJ_CAT: {
    OBSERVATION_QUESTIONSET_ALL: "obj-cat:observation_questionset_all",
    SURVEY_QUESTIONSET_ALL: "obj-cat:survey_questionset_all",
  },

  //https methods
  METHOD: {
    GET: "get",
    POST: "post",
    PATCH: "patch"
  },

  // for gQuestion file 
  INTERACTION_TYPES: "interactionTypes",
  BODY: "body",
  EDITOR_STATE: "editorstate",
  INTERACTIONS: "interactions",
  EVIDENCE: "evidence",
  INSTRUCTIONS: "instructions",
  SHOW_REMARKS: "showremarks",
  NAME: "name",
  REQUIRED: "required",
  RESPONSE_1: "response1",
  VALIDATION: "validation",
  QUESTION: "Question",
  OPTIONS: "options",
  TIP: "tip",
  DEFAULT: "default",
  SHOW_EVIDENCE: "showEvidence",
  QUESTION_BODY: "questionBody",
  // Slider-Specific
  SLIDER_MIN: "sliderMin",
  SLIDER_MAX: "sliderMax",
  SLIDER_STEP: "sliderStep",
  SLIDER_RANGE: "sliderRange",
  // MCQ-Specific
  OPTION_1: "option1",
  OPTION_2: "option2",
  CORRECT_ANSWER: "correctAnswer",
  // Text-Specific
  PATTERN: "pattern",
  AUTO_CAPTURE: "autoCapture",
  // Evidence Fields
  MIME_TYPE: "mimeType",
  // Yes/No Constants
  YES: "Yes",
  NO: "No",

  CHILDREN: "children", // Key representing child themes
  CRITERIA: "criteria", // Key representing criteria within themes


});

module.exports = constants;
