const questionSetTemplate = {
  name: "name",
  description: "description",
  code: "externalId",
  mimeType: "application/vnd.sunbird.questionset",
  primaryCategory: "type",
  entityType: "entityType",
  language: "language",
  keywords: "keywords",
  startDate: "startDate",
  endDate: "endDate",
  createdBy: process.env.DEFAULT_CONTRIBUTOR_USER_ID,
  organisationId: process.env.DEFAULT_PROGRAM_CREATOR_ORGANISATION_ID,
  creator: process.env.DEFAULT_CONTRIBUTOR_USER_NAME,
  createdFor: [process.env.DEFAULT_CONTRIBUTOR_USER_CHANNEL_ID],
  channel: process.env.DEFAULT_CONTRIBUTOR_USER_CHANNEL_ID,
  programId: "",
  author: process.env.DEFAULT_CONTRIBUTOR_USER_NAME,
  framework: process.env.DEFAULT_FRAMEWORK_ID,
};

const questionSetTemplateStatic = [
  "mimeType",
  "createdBy",
  "creator",
  "author",
  "organisationId",
  "framework",
  "channel",
  "createdFor"
];

const program = {
  name: `{solutionName} sourcing project`,
  description: `{solutionName} sourcing project description`,
  nomination_enddate: "",
  shortlisting_enddate: "",
  enddate: "",
  content_submission_enddate: "",
  rewards: null,
  content_types: [],
  target_collection_category: [],
  sourcing_org_name: "",
  type: "public",
  target_type: "searchCriteria",
  rootorg_id: process.env.DEFAULT_USER_CHANNEL_ID_TO_CREATE_PROGRAM,
  createdby: process.env.DEFAULT_USER_ID_TO_CREATE_PROGRAM,
  createdOn: "",
  startdate: "",
  slug: process.env.DEFAULT_SLUG,
  status: "Draft",
  program_id: "",
  config: {
    defaultContributeOrgReview: false,
  },
};
const programTemplateStatic = [
  "rewards",
  "content_types",
  "target_collection_category",
  "type",
  "target_type",
  "rootorg_id",
  "createdby",
  "slug",
  "status",
  "program_id",
  "config",
];

module.exports = {
  questionSetTemplate,
  questionSetTemplateStatic,
  program,
  programTemplateStatic,
};
