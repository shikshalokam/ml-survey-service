module.exports = {
  name: "criteria",
  schema: {
    externalId: String,
    owner: String,
    timesUsed: Number,
    weightage: Number,
    name: String,
    score: String,
    remarks: String,
    showRemarks: Boolean,
    description: String,
    resourceType: [String],
    language: [String],
    keywords: [String],
    concepts: ["json"],
    rubric: Object,
    evidences: ["json"],
    flag: Object,
    criteriaType: { type : String, default: "manual" },
    frameworkCriteriaId : "ObjectId",
    parentCriteriaId: "ObjectId"
  }
};
