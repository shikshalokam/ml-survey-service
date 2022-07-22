const getSectionTemplate = (section) => {
  return {
    _id: section._id,
    __v: 0,
    concepts: [],
    createdAt: section?.createdAt,
    createdFor: [],
    criteriaType: "manual",
    description: "Matrix section description",
    evidences: [
      {
        code: "OB",
        sections: [
          {
            code: "S1",
            questions: [],
          },
        ],
      },
    ],
    externalId: section?.externalId,
    flag: "",
    frameworkCriteriaId: "",
    keywords: ["Keyword 1", "Keyword 2"],
    language: ["English"],
    name: "Matrix Section",
    owner: "",
    remarks: "",
    resourceType: ["Program", "Framework", "Criteria"],
    score: "",
    showRemarks: null,
    timesUsed: "",
    updatedAt: section?.updatedAt,
    weightage: "",
    migratedId: null,
  };
};

module.exports = {
  getSectionTemplate,
};
