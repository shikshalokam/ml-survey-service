const json2csvTransform = require('json2csv').Transform;
const stream = require("stream");
const fs = require("fs");
const moment = require("moment-timezone");

let FileStream = class FileStream {
  
  constructor(fileName) {
    const currentDate = new Date();
    const fileExtensionWithTime = moment(currentDate).tz("Asia/Kolkata").format("YYYY_MM_DD_HH_mm") + ".csv";

    if( !fs.existsSync(process.env.PUBLIC_FOLDER_PATH)) {
      fs.mkdirSync(process.env.PUBLIC_FOLDER_PATH);
    }

    if( !fs.existsSync(process.env.PUBLIC_FOLDER_PATH + "/" + process.env.CSV_REPORTS_PATH)) {
      fs.mkdirSync(process.env.PUBLIC_FOLDER_PATH + "/" + process.env.CSV_REPORTS_PATH);
    }

    const filePath = `${process.env.PUBLIC_FOLDER_PATH}/${process.env.CSV_REPORTS_PATH}/${moment(currentDate).tz("Asia/Kolkata").format("YYYY_MM_DD")}/`;

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath);
    }
    this.input = new stream.Readable({ objectMode: true });
    this.fileName = filePath + fileName + "_" + fileExtensionWithTime;
    this.output = fs.createWriteStream(this.fileName, { encoding: 'utf8' });
    this.processor = null;
  }

  initStream() {
    this.input._read = () => { };
    const opts = {};
    const transformOpts = { objectMode: true };
    const json2csv = new json2csvTransform(opts, transformOpts);
    this.processor = this.input.pipe(json2csv).pipe(this.output);
    return this.input;
  }

  getProcessorPromise() {
    const processor = this.processor
    return new Promise(function (resolve, reject) {
      processor.on('finish', resolve);
    });
  }

  fileNameWithPath(){
    return this.fileName;
  }

};

module.exports = FileStream;
