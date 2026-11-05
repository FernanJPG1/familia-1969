const fs = require('fs');
const html = fs.readFileSync('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'utf8');
const ids = new Set();
for (const m of html.matchAll(/id=["']([^"']+)["']/g)) {
  ids.add(m[1]);
}
console.log(JSON.stringify([...ids].sort(), null, 2));
