const fs = require('fs');
const path = require('path');

const version = { version: Date.now().toString() };

fs.writeFileSync(
  path.join(__dirname, '../public/version.json'),
  JSON.stringify(version)
);

console.log('version.json generated:', version); 