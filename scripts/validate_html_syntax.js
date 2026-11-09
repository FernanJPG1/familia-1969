const fs = require('fs');
const vm = require('vm');

function validateHtmlScripts(filePath) {
  console.log(`Validating scripts in ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  let errors = 0;

  while ((match = scriptRegex.exec(content)) !== null) {
    const scriptCode = match[1];
    // Skip empty or external scripts with src
    if (!scriptCode || scriptCode.trim().length === 0) continue;
    
    count++;
    try {
      new vm.Script(scriptCode);
    } catch (err) {
      console.error(`❌ Syntax Error in script #${count} in ${filePath}:`, err.message);
      errors++;
    }
  }

  if (errors === 0) {
    console.log(`✅ All ${count} scripts in ${filePath} are 100% syntactically valid!`);
    return true;
  } else {
    console.error(`❌ Found ${errors} script error(s) in ${filePath}`);
    return false;
  }
}

const ok1 = validateHtmlScripts('C:\\Users\\Usuario\\Desktop\\Barberia\\index.html');
const ok2 = validateHtmlScripts('C:\\Users\\Usuario\\Desktop\\Barberia\\public\\index.html');

if (!ok1 || !ok2) {
  process.exit(1);
} else {
  console.log('🎉 PERFECT SYNTAX IN BOTH HTML FILES!');
}
