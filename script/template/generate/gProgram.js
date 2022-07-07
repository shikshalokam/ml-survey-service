const { isEmpty } = require("lodash");
const {
  createProgram,
  updateProgram,
  publishProgram,
  nominateProgram,
  updateContributorToProgram,
} = require("../../api-list/program");
const { searchUser } = require("../../api-list/user");
const { updateSolutionById } = require("../helpers/questionsetHelper");

const getDate = (increment) => {
  const d = new Date(
    new Date().setDate(new Date().getDate() + increment)
  ).toISOString();

  return d;
};

const createProgramTemplate = async (solution, program_id) => {
  const userData = await searchUser(solution.author);

  const userId =
    userData?.length > 0
      ? solution.author
      : "5a587cc1-e018-4859-a0a8-e842650b9d64";
  const rootOrgId =
    userData?.length > 0 ? userData[0]?.rootOrgId : "01309282781705830427";

  const template = {
    name: `Migrated ${solution?.name} sourcing project`,
    description: `${solution?.name} sourcing project description`,
    nomination_enddate: `${getDate(1)}`,
    rewards: null,
    shortlisting_enddate: `${getDate(1)}`,
    enddate: `${getDate(2)}`,
    content_submission_enddate: `${getDate(1)}`,
    type: "public",
    target_type: "searchCriteria",
    content_types: [],
    target_collection_category: [],
    sourcing_org_name: "NIT",
    rootorg_id: rootOrgId,
    createdby: userId,
    createdOn: `${getDate(0)}`,
    startdate: `${getDate(1)}`,
    slug: "sunbird",
    status: "Draft",
    program_id: "",
    rolemapping: [],
    config: {
      defaultContributeOrgReview: false,
      roles: [
        {
          id: 1,
          name: "CONTRIBUTOR",
          tabs: [1],
          default: true,
          defaultTab: 1,
        },
        {
          id: 2,
          name: "REVIEWER",
          tabs: [2],
          defaultTab: 2,
        },
      ],
    },
  };

  let programId = solution.sourcingProgramId;

  let query = {};

  if (!program_id) {
    programId = await createProgram(template);
    query = { ...query, sourcingProgramId: programId };
  }

  if (!solution.isSrcProgramUpdated) {
    const update_res = await updateProgramTemplate(programId, solution);
    query = {
      ...query,
      isSrcProgramUpdated: true,
    };
  }

  if (!solution.isSrcProgramPublished) {
    const pub_res = await publishProgramTemplate(programId);
    query = {
      ...query,
      isSrcProgramPublished: true,
    };
  }

  if (!solution.isNominated) {
    const res = await nominateProgram(programId, userId);
    query = { ...query, isNominated: true };
  }

  if (!solution.isContributorAdded) {
    const add_contri = {
      program_id: programId,
      user_id: "bb551fff-121e-4a18-b969-984ac62bd572",
      rolemapping: {
        CONTRIBUTOR: ["4e397c42-495e-4fdb-8558-f98176230916"],
      },
    };

    const update_nom = await updateContributorToProgram(add_contri);
    query = { ...query, isContributorAdded: true };
  }

  if (!solution.isContributorAccepted) {
    const accept_contri = {
      program_id: programId,
      user_id: "bb551fff-121e-4a18-b969-984ac62bd572",
      status: "Approved",
      updatedby: userId,
    };
    const update_nom = await updateContributorToProgram(accept_contri);
    query = { ...query, isContributorAccepted: true };
  }

  if (!isEmpty(query)) {
    await updateSolutionById({
      id: solution._id.toString(),
      query: { ...query },
    });
  }

  return programId;
};

const updateProgramTemplate = async (program_id, solution) => {
  const template = {
    config: {
      defaultContributeOrgReview: false,
      roles: [
        {
          id: 1,
          name: "CONTRIBUTOR",
          tabs: [1],
          default: true,
          defaultTab: 1,
        },
        {
          id: 2,
          name: "REVIEWER",
          tabs: [2],
          defaultTab: 2,
        },
      ],
      framework: ["nit_tpd"],
      frameworkObj: {
        code: "nit_tpd",
        name: "nit_tpd",
        type: "TPD",
        identifier: "nit_tpd",
      },
      sharedContext: [],
    },
    targetprimarycategories: [
      {
        identifier: "obj-cat:observation_questionset_all",
        name: "Observation",
        targetObjectType: "QuestionSet",
      },
      {
        identifier: "obj-cat:survey_questionset_all",
        name: "Survey",
        targetObjectType: "QuestionSet",
      },
    ],
    targetprimarycategorynames: ["Observation", "Survey"],
    program_id: program_id,
  };

  return await updateProgram(template);
};

const publishProgramTemplate = async (program_id) => {
  const template = {
    channel: "sunbird",
    program_id: program_id,
  };

  return await publishProgram(template);
};

module.exports = {
  createProgramTemplate,
  publishProgramTemplate,
};
