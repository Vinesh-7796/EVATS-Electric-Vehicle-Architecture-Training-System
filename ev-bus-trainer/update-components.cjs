const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.svg') && f.includes('Updated'));

const svgData = {};

files.forEach(file => {
  const content = fs.readFileSync(path.join(publicDir, file), 'utf8');
  const parts = content.split('data-cell-id="');
  const elements = [];
  
  parts.forEach(part => {
    const endIdQuote = part.indexOf('"');
    if (endIdQuote === -1) return;
    const id = part.substring(0, endIdQuote);
    
    const rest = part.substring(endIdQuote + 1);
    let val = rest.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    val = val.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (val && !val.match(/^\d+$/) && val.length > 2) {
      elements.push({ id, text: val.toLowerCase() });
    }
  });
  
  svgData[file] = elements;
});

let componentsTs = fs.readFileSync(path.join(__dirname, 'src', 'data', 'components.ts'), 'utf8');

const fileMapping = {
  'hv-power': 'Flowchart 1 Updated.drawio.svg',
  'lv-power': 'Flowchart 2 Updated.drawio.svg',
  'can-bus': 'Flowchart 3 Updated.drawio.svg',
  'hv-aux': 'Flowchart 4 Updated.drawio.svg',
  'regen-braking': 'Flowchart 5 Updated.drawio.svg',
  'propulsion-system': 'Flowchart 5.5 Updated.drawio.svg',
  'overall': 'Flowchart 6 Updated.drawio.svg'
};

// Replace svgFile references
componentsTs = componentsTs.replace(/Flowchart 1 HV power system\.drawio\.svg/g, 'Flowchart 1 Updated.drawio.svg');
componentsTs = componentsTs.replace(/Flowchart 2 LV power system(_updated)?\.drawio\.svg/g, 'Flowchart 2 Updated.drawio.svg');
componentsTs = componentsTs.replace(/Flowchart 3 (?:can|CAN) Bus network(_updated)?\.drawio\.svg/g, 'Flowchart 3 Updated.drawio.svg');
componentsTs = componentsTs.replace(/Flowchart 4 HV Auxilary network\.drawio\.svg/g, 'Flowchart 4 Updated.drawio.svg');
componentsTs = componentsTs.replace(/Flowchart 5 Regenerative braking\.drawio\.svg/g, 'Flowchart 5 Updated.drawio.svg');
componentsTs = componentsTs.replace(/Flowchart 5\.5 Torque Powertrain and Energy Flow\.drawio\.svg/g, 'Flowchart 5.5 Updated.drawio.svg');
componentsTs = componentsTs.replace(/Flowchart 6 Overall Power System\.drawio\.svg/g, 'Flowchart 6 Updated.drawio.svg');

// We will split the file by createComponent({ ... })
// and parse the object
let updatedComponentsTs = componentsTs;

const regex = /id:\s*'([^']+)',\s*flowchartId:\s*'([^']+)',\s*name:\s*'([^']+)',(?:\s*aliases:\s*\[([^\]]+)\],)?\s*svgCellIds:\s*\[([^\]]*)\]/g;

updatedComponentsTs = updatedComponentsTs.replace(regex, (match, id, flowchartId, name, aliasesStr, oldSvgCellIds) => {
  if (!fileMapping[flowchartId]) return match;
  
  const svgFilename = fileMapping[flowchartId];
  const elements = svgData[svgFilename] || [];
  
  let aliases = [];
  if (aliasesStr) {
    aliases = aliasesStr.split(',').map(s => s.replace(/['"\s]+/g, ' ').trim().toLowerCase()).filter(s => s.length > 0);
  }
  const searchTerms = [name.toLowerCase(), ...aliases].filter(t => t.length > 2);
  
  const foundIds = [];
  elements.forEach(e => {
    const isMatch = searchTerms.some(term => e.text.includes(term));
    if (isMatch) {
      foundIds.push(`'${e.id}'`);
    }
  });
  
  if (foundIds.length > 0) {
    const uniqueIds = Array.from(new Set(foundIds)).join(', ');
    console.log(`[OK] ${id} (${flowchartId}) -> ${uniqueIds}`);
    return match.replace(/svgCellIds:\s*\[[^\]]*\]/, `svgCellIds: [${uniqueIds}]`);
  } else {
    console.log(`[WARNING] No match for ${id} in ${flowchartId}. Search terms: ${searchTerms.join(' | ')}`);
    return match;
  }
});

fs.writeFileSync(path.join(__dirname, 'src', 'data', 'components.ts'), updatedComponentsTs, 'utf8');
console.log('Update complete.');
