const fs = require('fs');
const path = require('path');

function writeJsFile(basePath, folderName, fileName, data) {
  const fullPath = path.join(basePath, folderName);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const filePath = path.join(fullPath, `${fileName}.js`);

  const jsContent = `const ${fileName} = ${JSON.stringify(data, null, 2)};\n`;

  fs.writeFileSync(filePath, jsContent, 'utf8');
}

module.exports = {
  writeJsFile
}

