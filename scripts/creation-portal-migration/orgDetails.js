require("dotenv").config({ path: "./../../.env" });
const { createDBInstance } = require("./db/dbConfig");
const { findAll } = require("./db");
const { CONFIG } = require("./constant/config");
const { compact, uniq } = require("lodash");
const fs = require("fs");
const { searchUser, getOpenSaberUserOrgId } = require("./api-list/user");

const getUserIds = async () => {
  try {
    const db = await createDBInstance();

    console.log("./../creation-portal-migration", db);
    const data = await findAll(CONFIG.DB.TABLES.solutions, {
      programId: { $exists: true },
      type: { $in: ["observation", "survey"] },
    });

    const userIds = data.map((solution) => solution.author);
    const solutions = data.map((solution) => {
      return {
        userId: solution.author,
        solutionId: solution._id,
        solutionName: solution.name,
        programId: solution?.migrationReference?.sourcingProgramId || "",
        programName: `Migrated ${solution.name}`,
      };
    });
    const uniqUsers = compact([...new Set(userIds)]);
    const usersList = await searchUser(uniqUsers);
    const openSaberOrg = await getOpenSaberUserOrgId();
    const d = writeToCSVFile(usersList, uniqUsers, openSaberOrg, solutions);
    console.log(`\n migratedCount userIds`, d);
  } catch (err) {
    console.log(`Error while migrating : ${err}`);
    throw new Error("Error occured", err);
  }
};

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
      }
    }
  );
};

const extractAsCSV = (users, usersIdsInDb, openSaberOrg, solutions) => {
  const header = [
    `ENV,authorId,mappedUserId,userName,rootOrgId,rootOrgName,org_id,srcOrgAdminId,srcOrgAdminUserName,contributorOrgAdminId,contributorOrgAdminUserName,solutionId,solutionName,programId,programName`,
  ];

  let rows = usersIdsInDb.map((id) => {
    const match = users.find((user) => user.userId === id);
    const solution = solutions.find((s) => s.userId === id);
    console.log("solutionsolution", solution);
    const org = openSaberOrg.find((o) => o.createdBy === id);
    return `STAGE,${id},${match?.userId || ""},${match?.userName || ""},${
      match?.rootOrgId || ""
    },${match?.rootOrgName || ""},${org?.orgId || ""},${""},${""},${""},${""},${
      solution?.solutionId || ""
    },${solution?.solutionName || ""},${solution?.programId || ""},${
      solution?.programName || ""
    }`;
  });

  rows = uniq(rows);
  rows = compact(rows);
  const d = header.concat(rows).join("\n");
  return d;
};

getUserIds();
