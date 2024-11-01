const constants = Object.freeze({
  ED: "ed",
  CREATION_PORTAL: "creation_portal",
  DATE: "date",
  SLIDER: "slider",
  MULTI_SELECT: "multiselect",
  RADIO: "radio",
  TEXT: "text",
  NUMBER: "number",
  APPLICATION_URL_ENCODED: "application/x-www-form-urlencoded",
  APPLICATION_JSON: "application/json",
  SURVEY: "Survey",
  OBSERVATION: "Observation",
  QUESTION_SET: "QuestionSet",
  PENDING : "Pending",

  // Migration Reference related constants
  MIGRATION_REFERENCE: {
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
});

module.exports = constants;
