module.exports = {
  name: "frameworks",
  schema: {
    externalId: String,
    name: String,
    description: String,
    author: String,
    parentId: "ObjectId",
    resourceType: Array,
    language: Array,
    keywords: Array,
    concepts: Array,
    createdFor: Array,
    scoringSystem: String,
    levelToScoreMapping: Object,
    themes: Array,
    noOfRatingLevels: Number,
    isRubricDriven: { type : Boolean, default: false },
    updatedBy: String,
    isDeleted: Boolean,
    createdBy: String,
    entityTypeId: "ObjectId",
    entityType: String,
    rootOrganisations : {
      type : [String],
      default : []
    },
    criteriaLevelReport : Boolean,
    license:Object,
    creator:String
  }
};
