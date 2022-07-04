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
  createdBy: "4e397c42-495e-4fdb-8558-f98176230916",
  organisationId: "937dd865-b256-4c1a-9830-a9b5b89f0913",
  creator: "check1@yopmail.com",
  createdFor: ["01309282781705830427"],
  channel: "01309282781705830427",
  programId: "546b3ca0-cb7c-11ec-a165-33909bc91f74",
  author: "check1@yopmail.com",
  framework: "nit_tpd",
};

const questionSetTemplateStatic = [
  "mimeType",
  "createdBy",
  "creator",
  "programId",
  "author",
  "organisationId",
  "framework",
  "channel",
  "createdFor"
];

const program = {
  name: `{solutionName} sourcing project`,
  description: `{solutionName} sourcing project description`,
  nomination_enddate: "2022-05-26",
  shortlisting_enddate: "2022-05-26",
  enddate: "2022-05-26",
  content_submission_enddate: "2022-05-26",
  rewards: null,
  content_types: [],
  target_collection_category: [],
  sourcing_org_name: "NIT",
  type: "public",
  target_type: "searchCriteria",
  rootorg_id: "01285019302823526477",
  createdby: "5a587cc1-e018-4859-a0a8-e842650b9d64",
  createdOn: "2022-05-26",
  startdate: "2022-05-26",
  slug: "sunbird",
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
