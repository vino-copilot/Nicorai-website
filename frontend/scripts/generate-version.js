// This small Node.js script generates a version.json file that contains the current timestamp, which can be used for cache busting or frontend version tracking.

const fs = require('fs');
const path = require('path');

const version = { version: Date.now().toString() };

fs.writeFileSync(
  path.join(__dirname, '../public/version.json'),
  JSON.stringify(version)
);

console.log('version.json generated:', version); 