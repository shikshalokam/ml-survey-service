const fs = require("fs");
let { parse } = require("csv-parse");
const csvtojson = require("csvtojson");
const path = require("path");
const logger = require("../../logger");

/**
* To get solution author and org details
* @method
* @name getCsvData
* @param {Object} solution - question
* @returns {Object} - returns csv data
**/
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
        // check if solution.author is present is csv
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
        // return if the csv data if solution.author is present in csv, where d is headers and srcOrgAdmin is csv data
        resolve({ data: d, srcOrgAdmin });
      });
  });
};

/**
* To update csv file with solution programId
* @method
* @name updateCsvFile
* @param {any[]} csvData - csvData
* @param {Object} columnToUpdate - columnToUpdate
* @param {String} programId - programId
* @param {String} programName - programName
* @returns {Object} - returns csv data
**/
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

  fs.writeFileSync(filename, d, (err) => {
    if (err) {
      logger.error("Error while writing to file", err);
    }
  });
};

/**
* To get solution author details from csv
* @method
* @name getContributorAndSrcAdminData
* @param {Object} solution - solution
* @returns {Object} - returns csv data
**/
const getContributorAndSrcAdminData = async (solution) => {

  // get csv data for the solution
  const csv = await getCsvData(solution);

  // convert csv to json format
  const srcOrgAdmin = await csvtojson().fromString(csv.srcOrgAdmin);
  return { csvData: csv.data, srcOrgAdmin: srcOrgAdmin[0] };
};

module.exports = {
  getCsvData,
  updateCsvFile,
  getContributorAndSrcAdminData,
};
