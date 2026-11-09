const fs = require('fs');
const filePath = 'C:\\Users\\Usuario\\Desktop\\Barberia\\tests\\multi_barber_admin.test.js';
let code = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
code = code.replace(/\r\n/g, '\n');

// Replace the Date.now() email with a single variable or consistent token
code = code.split('`carlos.mendoza.${Date.now()}@familia1969.com`').join('carlosEmail');
code = code.replace("'carlos.mendoza@familia1969.com'", 'carlosEmail');

if (!code.includes('const carlosEmail =')) {
  code = code.replace(
    "console.log('\\n=== TEST 2: Register New Barber (Carlos Barber) ===');",
    "const carlosEmail = `carlos.mendoza.${Date.now()}@familia1969.com`;\n      console.log('\\n=== TEST 2: Register New Barber (Carlos Barber) ===');"
  );
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('[OK] multi_barber_admin.test.js successfully fixed!');
