const criteriaTemplate = {
  // string
  _id: "identifier",
  // number
  __v: 0,
  // string
  createdAt: "createdOn",
  // string
  createdFor: "channel",
  // string
  criteriaType: "manual",
  // string
  description: "description",
  // string
  externalId: "code",
  // string
  flag: "",
  // string
  frameworkCriteriaId: "identifier",
  // string
  name: "name",
  // string
  owner: "consumerId",
  // string
  remarks: "",
  // string
  score: "",
  // string
  showRemarks: "showRemarks",
  // string
  timesUsed: "",
  // string
  updatedAt: "lastUpdatedOn",
  // string
  weightage: "",
  // string
  referenceQuestionSetId: "identifier",
  // object
  rubric: {},
};

const defaultCriteria = [
  "__v",
  "criteriaType",
  "flag",
  "remarks",
  "score",
  "timesUsed",
  "weightage",
  "rubric",
];

module.exports = {
  criteriaTemplate,
  defaultCriteria,
};
