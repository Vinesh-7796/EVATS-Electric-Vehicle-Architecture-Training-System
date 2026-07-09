const fs = require('fs');
const svg = fs.readFileSync(process.argv[2], 'utf8');
const decoded = svg.replace(/&quot;/g, '"');

// Extract all KvX3 IDs
const ids = decoded.match(/KvX3_2IPjFl1woqNRw4t-\d+/g) || [];
const unique = [...new Set(ids)];
console.log('KvX3 IDs in Flowchart 4:', unique.length);
unique.sort().forEach(id => console.log(id));