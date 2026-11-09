const fs = require('fs');
const html = fs.readFileSync('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'utf-8');
const lines = html.split('\n');
const idx = lines.findIndex(l => l.includes('id="modal-auth"'));
console.log(lines.slice(idx, idx + 80).join('\n'));
