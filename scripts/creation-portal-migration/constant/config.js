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
    base: process.env.BASE_HOST,
    vdn: process.env.VDN_HOST,
  },
  APIS: {
    token: "auth/realms/sunbird/protocol/openid-connect/token",
    read_user: "api/user/v5/read/",
    search_user: "api/user/v3/search",
    create_questionset: "api/questionset/v1/create",
    update_hierarchy: "api/questionset/v1/hierarchy/update",
    publish_questionset: "api/questionset/v1/publish",
    read_questionset: "api/questionset/v1/hierarchy/",
    create_question: "api/question/v1/create",
    publish_question: "api/question/v1/publish",
    create_program: "api/program/v1/create",
    update_program: "api/program/v1/update",
    add_program_nomination: "api/program/v1/nomination/add",
    update_program_nomination: "api/program/v1/nomination/update",
    publish_program: "api/program/v1/publish",
  },
  KEYS: {
    BASE: {
      QUERY: {
        username: process.env.BASE_USER,
        password: process.env.BASE_PWD,
        grant_type: process.env.BASE_GRANT,
        client_id: process.env.BASE_CLIENT,
        client_secret: process.env.BASE_CLIENT_SECRET,
      },
      AUTHORIZATION: process.env.BASE_AUTHORIZATION,
    },
    VDN: {
      QUERY: {
        username: process.env.BASE_USER,
        password: process.env.BASE_PWD,
        grant_type: process.env.BASE_GRANT,
        client_id: process.env.BASE_CLIENT,
        client_secret: process.env.BASE_CLIENT_SECRET,
      },
      AUTHORIZATION: process.env.VDN_AUTHORIZATION,
    },
  },
};

module.exports = {
  CONFIG,
};
