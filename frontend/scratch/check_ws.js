
const fs = require('fs');
const content = fs.readFileSync('d:\\project workspace\\my-team-flow-project\\frontend\\src\\components\\workspace\\ProjectAnalyticsTab.tsx', 'utf8');
const lines = content.split('\n');
console.log('Line 478: ' + JSON.stringify(lines[477]));
console.log('Line 479: ' + JSON.stringify(lines[478]));
