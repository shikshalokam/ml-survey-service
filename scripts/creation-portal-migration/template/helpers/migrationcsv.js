const fs = require('fs');
const path = require('path');
const csvtojson = require('csvtojson');
const { parse } = require('csv-parse');
const _ = require("lodash");


const filePath = path.resolve('./draft.csv');
const readCSVpath = path.resolve('../../draft.csv')

const defaultData = {
    solutionId: '',
    referenceQuestionSetId: '',
    questionId: '',
    referenceQuestionId: '',
    status: '',
    isFailed: 'NO',
    reasons: ''
};

const writeCSV = async (data) => {
    const rowData = { ...defaultData, ...data };
    const row = Object.values(rowData).join(',') + '\n';

    const fileExists = fs.existsSync(filePath);
    if (!fileExists) {
        const titles = Object.keys(defaultData).join(',') + '\n';
        fs.writeFileSync(filePath, titles);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');

    if (!fileContent.includes(row)) {
        fs.appendFileSync(filePath, row);
    }
};


/**
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
            reasons: questionDetails.reasons
        };
        await writeCSV(data);
    }
};

const readCSV = async () => {
    const rows = [];
    const parser = fs.createReadStream(readCSVpath)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', (row) => {
            rows.push(row);
        });

    return new Promise((resolve, reject) => {
        parser.on('end', () => resolve(rows));
        parser.on('error', reject);
    });
};

const readCSVByTitle = async (title, value) => {
    const rows = await readCSV();
    return rows.filter(row => row[title] === value);
};


module.exports = {
    updateQuestionMappingInCSV,
    writeCSV,
    readCSV,
    readCSVByTitle
}