require("dotenv").config();

const CONFIG = {
  DB: {
    DB_HOST: process.env.MONGODB_URL,
    DB_NAME: process.env.DB_NAME,
    TABLES: {
      solutions: "solutions",
      criteria_questions: "criteriaQuestions",
      questions: "questions",
    },
  },

  HOST: {
    ed: process.env.ED_BASE_URL,
    creation_portal: process.env.CREATION_PORTAL_URL,
  },
  APIS: {
    token: process.env.GEN_TOKEN || "auth/realms/sunbird/protocol/openid-connect/token",
    read_user: process.env.READ_USER || "api/user/v5/read",
    search_user: process.env.SEARCH_USER || "api/user/v3/search",
    open_saber_user_org_search: process.env.OPEN_SABER_USER_ORG_SEARCH || "api/reg/search",
    create_questionset: process.env.CREATE_QUESTION_SET || "api/questionset/v1/create",
    update_hierarchy: process.env.UPDATE_QUESTION_SET_HIERARCHY || "api/questionset/v1/hierarchy/update",
    publish_questionset: process.env.PUBLISH_QUESTION_SET || "api/questionset/v1/publish",
    read_questionset: "api/" + process.env.READ_QUESTION_SET + "/" || "api/questionset/v1/hierarchy/",
    create_question: process.env.CREATE_QUESTION || "api/question/v1/create",
    publish_question: process.env.PUBLISH_QUESTION || "api/question/v1/publish",
    create_program: process.env.CREATE_PROGRAM || "api/program/v1/create",
    update_program: process.env.UPDATE_PROGRAM || "api/program/v1/update",
    add_program_nomination: process.env.ADD_PROGRAM_NOMINATION || "api/program/v1/nomination/add",
    update_program_nomination: process.env.UPDATE_PROGRAM_NOMINATION || "api/program/v1/nomination/update",
    publish_program: process.env.PUBLISH_PROGRAM || "api/program/v1/publish",
  },
  KEYS: {
    ED: {
      QUERY: {
        username: process.env.MASTER_USER_EMAIL,
        password: process.env.MASTER_USER_PWD,
        grant_type: process.env.TOKEN_GEN_GRANT_TYPE,
        client_id: process.env.TOKEN_GEN_CLIENT,
        client_secret: process.env.TOKEN_GEN_CLIENT_SECRET,
      },
      AUTHORIZATION: process.env.ED_AUTHORIZATION,
    },
    CREATION_PORTAL: {
      QUERY: {
        username: process.env.MASTER_USER_EMAIL,
        password: process.env.MASTER_USER_PWD,
        grant_type: process.env.TOKEN_GEN_GRANT_TYPE,
        client_id: process.env.TOKEN_GEN_CLIENT,
        client_secret: process.env.TOKEN_GEN_CLIENT_SECRET,
      },
      AUTHORIZATION: process.env.CREATION_PORTAL_AUTHORIZATION,
    },
  },
};

module.exports = {
  CONFIG,
};
