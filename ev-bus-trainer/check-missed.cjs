const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = [
  'Flowchart 2 Updated.drawio.svg',
  'Flowchart 4 Updated.drawio.svg',
  'Flowchart 5 Updated.drawio.svg',
  'Flowchart 6 Updated.drawio.svg'
];

files.forEach(file => {
  const content = fs.readFileSync(path.join(publicDir, file), 'utf8');
  const parts = content.split('data-cell-id="');
  
  console.log(`\n=== ${file} ===`);
  parts.forEach(part => {
    const endIdQuote = part.indexOf('"');
    if (endIdQuote === -1) return;
    const id = part.substring(0, endIdQuote);
    
    const rest = part.substring(endIdQuote + 1);
    let val = rest.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    val = val.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (val && !val.match(/^\d+$/) && val.length > 2) {
      console.log(`ID: ${id} | TEXT: ${val}`);
    }
  });
});
