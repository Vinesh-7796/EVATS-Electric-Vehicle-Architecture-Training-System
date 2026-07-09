const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.svg') && f.includes('Updated'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(publicDir, file), 'utf8');
  
  console.log(`\n=== ${file} ===`);
  
  // A simple regex to find <g data-cell-id="..."> ... </g> and extract text
  // Since JS regex engine has issues with recursive tags, we will find data-cell-id 
  // and then just grab all text before the next data-cell-id.
  const parts = content.split('data-cell-id="');
  
  parts.forEach(part => {
    const endIdQuote = part.indexOf('"');
    if (endIdQuote === -1) return;
    const id = part.substring(0, endIdQuote);
    
    // remove html tags from the rest of the part
    const rest = part.substring(endIdQuote + 1);
    let val = rest.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    val = val.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (val && !val.match(/^\d+$/) && val.length > 2) {
      console.log(`{ id: '${id}', text: '${val}' },`);
    }
  });
});
