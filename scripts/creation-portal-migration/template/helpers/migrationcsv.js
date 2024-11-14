const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const _ = require("lodash");

const filePath = path.resolve("./draft.csv");
const readCSVpath = path.resolve("../../draft.csv");

// Default data structure for each row in the CSV file
const defaultData = {
  solutionId: "",
  referenceQuestionSetId: "",
  questionId: "",
  referenceQuestionId: "",
  status: "",
  isFailed: "NO",
  reasons: "",
};

/**
 * Appends or writes a new row of data to the CSV file, ensuring no duplicate rows.
 * @method
 * @name writeCSV
 * @param {Object} data - Data to be written to the CSV file. Fields are merged with `defaultData`.
 * @param {string} [data.solutionId] - Unique identifier for the solution.
 * @param {string} [data.referenceQuestionSetId] - ID of the reference question set.
 * @param {string} [data.questionId] - ID of the question.
 * @param {string} [data.referenceQuestionId] - Reference ID of the question.
 * @param {string} [data.status] - Status of the question (e.g., 'draft').
 * @param {string} [data.isFailed] - Indicates if the question is marked as failed ('YES' or 'NO').
 * @param {string} [data.reasons] - Reasons for failure, if applicable.
 * @returns {Promise<void>} - Resolves once the data is written to the file.
 */
const writeCSV = async (data) => {
  const rowData = { ...defaultData, ...data };
  const row = Object.values(rowData).join(",") + "\n";

  // Check if the file exists; create it with headers if it doesn't
  const fileExists = fs.existsSync(filePath);
  if (!fileExists) {
    const titles = Object.keys(defaultData).join(",") + "\n";
    fs.writeFileSync(filePath, titles);
  }

  // Append the row if it's not already present in the file
  const fileContent = fs.readFileSync(filePath, "utf8");
  if (!fileContent.includes(row)) {
    fs.appendFileSync(filePath, row);
  }
};

/**
* update the csv with mapping question with status
* @method
* @name updateQuestionMappingCSV
* @param {Object} inputData - {
    solutionId: '5f362b78af0a4decfa9a1070',
    criteriaId: '5f350abaaf0a4decfa9a1056'
    questionsetId: "DS_1234567"
    questions: {
        '5f350abaaf0a4decfa9a105d': {
            id: 'DS_789456123456',
            status: 'draft',
            isFailed: 'No',
            reasons: ''
        }
    }
}
**/
const updateQuestionMappingInCSV = async (inputData) => {
  // Updates the question mapping in the CSV file by iterating over questions.
  const { solutionId, criteriaId, questionsetId, questions } = inputData;

  for (const [questionID, questionDetails] of Object.entries(questions)) {
    const data = {
      solutionId,
      criteriaId,
      referenceQuestionSetId: questionsetId,
      questionId: questionID,
      referenceQuestionId: questionDetails.id,
      status: questionDetails.status,
      isFailed: questionDetails.isFailed,
      reasons: questionDetails.reasons,
    };
    await writeCSV(data);
  }
};

/**
 * Reads and parses data from the CSV file into an array of objects.
 * @method
 * @name readCSV
 * @returns {Promise<Object[]>} - Resolves with an array of objects representing rows in the CSV file.
 */
const readCSV = async () => {
  const rows = [];
  const parser = fs
    .createReadStream(readCSVpath)
    .pipe(parse({ columns: true, trim: true }))
    .on("data", (row) => {
      rows.push(row);
    });

  return new Promise((resolve, reject) => {
    parser.on("end", () => resolve(rows));
    parser.on("error", reject);
  });
};

/**
 * Reads and filters rows from the CSV file based on a column title and value.
 * @method
 * @name readCSVByTitle
 * @param {string} title - The column title to filter by.
 * @param {string} value - The value to match in the specified column.
 * @returns {Promise<Object[]>} - Resolves with an array of filtered objects representing rows in the CSV file.
 */
const readCSVByTitle = async (title, value) => {
  const rows = await readCSV();
  return rows.filter((row) => row[title] === value);
};

module.exports = {
  updateQuestionMappingInCSV,
  writeCSV,
  readCSV,
  readCSVByTitle,
};
