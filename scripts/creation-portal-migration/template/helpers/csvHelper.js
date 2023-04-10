const { pick } = require("lodash");

const { searchUser } = require("../../api-list/user");

const fs = require("fs");
let { parse } = require("csv-parse");
const csvtojson = require("csvtojson");
const path = require("path");
const { dirname } = require("path");


const getCsvData = async (solution) => {
  const filePath = __dirname.split("/creation-portal-migration/template");
  const filename = path.resolve(filePath[0]) + "/creation-portal-migration/SL-DataMapping.csv";
  let srcOrgAdmin = [];
  return new Promise(async (resolve, reject) => {
    const data = [];
    let index = 0;
    fs.createReadStream(filename)
      .pipe(parse())
      .on("error", (error) => {
        reject(error);
      })
      .on("data", (row) => {
        index = data.length;
        index === 0 && srcOrgAdmin.push(row);
        data.push(row);
        const csvUserIndex = data[0].indexOf("authorId");
        const csvUserId = row[csvUserIndex];
        const pIndex = data[0].indexOf("programId");

        if (index > 0) {
          if (solution.author === csvUserId) {
            srcOrgAdmin.push(row);
            if (!row[pIndex]) {
              row[pIndex] =
                solution?.migrationReference?.sourcingProgramId || "";
            }
          }
        }
      })
      .on("end", () => {
        const header = data;
        const d = header.join("\n");
        srcOrgAdmin = srcOrgAdmin.join("\n");
        fs.writeFileSync(filename, d, (err) => {
          if (err) {
            reject(err);
          }
        });
        resolve({ data: d, srcOrgAdmin });
      });
  });
};

const updateCsvFile = async (csvData = [], columnToUpdate, programId, programName) => {
  const filename = __dirname + "/SL-DataMapping.csv";
  const data = await csvtojson().fromString(csvData);

  let header = Object.keys(data[0]);
  const csvD = [];
  data.forEach((d) => {
    d?.rootOrgId === columnToUpdate?.rootOrgId && (d.programId = programId, d.programName=programName);
    csvD.push(Object.values(d));
  });

  csvD.unshift(header);
  const d = csvD.join("\n");
  console.log();
  console.log();

  fs.writeFileSync(filename, d, (err) => {
    if (err) {
      console.log("errororor", err);
    }
  });
};

const getContributorAndSrcAdminData = async (solution, program_id) => {
  // const userData = await searchUser(solution.author).catch((error) => {
  //   console.log("Error", error);
  // });
  // const contributor = pick(userData[0], ["userId", "userName", "rootOrgId"]);
  // contributor.rootOrgId = "01329314824202649627";
  // const csv = await getCsvData(solution, contributor?.rootOrgId);
  const csv = await getCsvData(solution);
  const srcOrgAdmin = await csvtojson().fromString(csv.srcOrgAdmin);
  return { csvData: csv.data, srcOrgAdmin: srcOrgAdmin[0] };
};

module.exports = {
  getCsvData,
  updateCsvFile,
  getContributorAndSrcAdminData,
};
