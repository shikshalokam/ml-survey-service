let data = {
  timestamp: "2023-10-12T07:11:42.529Z",
  msg: {
    eid: "AUDIT",
    ets: 1697094702528,
    ver: "3.0",
    mid: "9c9abc2e55c10c8d2bf0272086af6f51",
    actor: { id: "0cc9286c-3937-4dbc-a9da-7dfeb3a95a2d", type: "User" },
    context: {
      channel: "0135261634806579203",
      pdata: {
        id: "dev.sunbird.learning.service",
        pid: "userorg-service",
        ver: "5.3.0",
      },
      env: "User",
      cdata: [{ id: "9c9abc2e55c10c8d2bf0272086af6f51", type: "Request" }],
      rollup: {},
    },
    object: { id: "0cc9286c-3937-4dbc-a9da-7dfeb3a95a2d", type: "User" },
    edata: {
      state: "Delete",
      type: "DeleteUserStatus",
      props: [
        "{keycloakCredentials:false, userLookUpTable:true, userExternalIdTable:true, userTable:true}",
      ],
    },
  },
  lname: "TelemetryEventLogger",
  tname: "application-akka.actor.brr-usr-dispatcher-6",
  level: "INFO",
  HOSTNAME: "userorg-5f8bdf4f7b-x9cdw",
  "application.home": "/home/sunbird/userorg-service-1.0-SNAPSHOT",
};

console.log(JSON.stringify(JSON.parse(data.msg)));
