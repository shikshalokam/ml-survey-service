require("dotenv").config({ path: "./../../.env" });
const { createDBInstance } = require("./db/dbConfig");
const { findAll } = require("./db");
const { CONFIG } = require("./constant/config");
const { compact, uniq } = require("lodash");
const fs = require("fs");
const { searchUser, getOpenSaberUserOrgId } = require("./api-list/user");

/**
* To get the userdata from creation portal
* @method
* @name getUserIds
**/
const getUserIds = async () => {
  try {
    const db = await createDBInstance();
    const data = await findAll(CONFIG.DB.TABLES.solutions, {
      programId: { $exists: true },
      type: { $in: ["observation", "survey"] },
    });

    const userIds = data.map((solution) => solution.author);
    const solutions = data.map((solution) => {
      const programName = `${solution.name} sourcing project`
      return {
        userId: solution.author,
        solutionId: solution._id,
        solutionName: solution.name,
        programId: solution?.migrationReference?.sourcingProgramId || "",
        programName: programName,
      };
    });
    let uniqUsers = uniq(userIds);
    uniqUsers = compact(uniqUsers);
    const usersList = await searchUser(uniqUsers);
    const openSaberOrg = await getOpenSaberUserOrgId();
    const d = writeToCSVFile(usersList, uniqUsers, openSaberOrg, solutions);
    console.log(`\n migratedCount userIds`, d);
  } catch (err) {
    console.log(`Error while migrating : ${err}`);
    throw new Error("Error occured", err);
  }
};

/**
* Write the data to csv file
* @method
* @name writeToCSVFile
* @param {Object[]} users - users
* @param {String[]} usersIdsInDb - usersIdsInDb
* @param {Object[]} openSaberOrg - 
"User_Org": [
  {
      "osUpdatedAt": "2021-05-11T06:07:45.534Z",
      "osCreatedAt": "2021-05-11T06:07:45.534Z",
      "@type": "User_Org",
      "roles": [
          "user",
          "sourcing_reviewer"
        ],
      "osid": "0933fa92-729f-4a77-b5d7-cba40f68b4eb",
      "userId": "d59873a0-40ea-461b-9402-ab090932f92d",
      "orgId": "7c5a96ca-bef8-4027-8736-4fa1ae6f9180"
    }
  ]
* @param {Object[]} solutions - solutions
**/
writeToCSVFile = (users, usersIdsInDb, openSaberOrg, solutions) => {
  const filename = __dirname + "/SL-DataMapping.csv";
  fs.writeFile(
    filename,
    extractAsCSV(users, usersIdsInDb, openSaberOrg, solutions),
    (err) => {
      if (err) {
        console.log("Error writing to csv file", err);
      } else {
        console.log(`saved as ${filename}`);
        process.exit();
      }
    }
  );
};

/**
* Extract the data in csv format
* @method
* @name extractAsCSV
* @param {Object[]} users - users
* @param {String[]} usersIdsInDb - usersIdsInDb
* @param {Object[]} openSaberOrg - 
"User_Org": [
  {
      "osUpdatedAt": "2021-05-11T06:07:45.534Z",
      "osCreatedAt": "2021-05-11T06:07:45.534Z",
      "@type": "User_Org",
      "roles": [
          "user",
          "sourcing_reviewer"
        ],
      "osid": "0933fa92-729f-4a77-b5d7-cba40f68b4eb",
      "userId": "d59873a0-40ea-461b-9402-ab090932f92d",
      "orgId": "7c5a96ca-bef8-4027-8736-4fa1ae6f9180"
    }
  ]
* @param {Object[]} solutions - solutions
**/
const extractAsCSV = (users, usersIdsInDb, openSaberOrg, solutions) => {
  const header = [
    `authorId,mappedUserId,userName,rootOrgId,rootOrgName,org_id,srcOrgAdminId,srcOrgAdminUserName,contributorOrgAdminId,contributorOrgAdminUserName,programId,programName`,
  ];

  let rows = usersIdsInDb.map((id) => {
    const match = users.find((user) => user.userId === id);
    const solution = solutions.find((s) => s.userId === id);
    const org = openSaberOrg.find((o) => o.createdBy === id);
    return `${id},${match?.userId || ""},${match?.userName || ""},${
      match?.rootOrgId || ""
    },${match?.rootOrgName || ""},${org?.orgId || ""},${""},${""},${""},${""},,${solution?.programId || ""},${
      solution?.programName || ""
    }`;
  });

  rows = uniq(rows);
  rows = compact(rows);
  const d = header.concat(rows).join("\n");
  return d;
};

getUserIds();
