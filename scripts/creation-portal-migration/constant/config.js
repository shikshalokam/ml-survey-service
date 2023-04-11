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
    token: "auth/realms/sunbird/protocol/openid-connect/token",
    read_user: "api/user/v5/read",
    search_user:"api/user/v3/search",
    open_saber_user_org_search:  "api/reg/search",
    create_questionset: "api/questionset/v1/create",
    update_hierarchy: "api/questionset/v1/hierarchy/update",
    publish_questionset: "api/questionset/v1/publish",
    read_questionset: "api/questionset/v1/hierarchy/",
    create_question: "api/question/v1/create",
    publish_question: "api/question/v1/publish",
    create_program: "api/program/v1/create",
    update_program:"api/program/v1/update",
    add_program_nomination: "api/program/v1/nomination/add",
    update_program_nomination: "api/program/v1/nomination/update",
    publish_program:"api/program/v1/publish",
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
