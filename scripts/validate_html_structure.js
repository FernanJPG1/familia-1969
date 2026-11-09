const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('C:/Users/Usuario/Desktop/Barberia/index.html', 'utf8');

// Check script blocks
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let idx = 0;
while ((m = scriptRegex.exec(html)) !== null) {
  idx++;
  if (!m[1].trim()) continue;
  try {
    new vm.Script(m[1]);
    console.log('Script #' + idx + ' syntax is 100% VALID');
  } catch (err) {
    console.error('SYNTAX ERROR IN SCRIPT #' + idx + ':', err);
    process.exit(1);
  }
}

// Verify required verification elements exist
const requiredIds = [
  'modal-auth',
  'form-auth-login',
  'form-auth-register',
  'form-auth-verify',
  'tab-auth-login-btn',
  'tab-auth-register-btn',
  'tab-auth-verify-btn',
  'verify-email-code',
  'verify-phone-code',
  'btn-submit-verify',
  'label-email-code-preview',
  'label-phone-code-preview',
  'admin-header-bar',
  'admin-header-total-reg',
  'admin-header-total-act',
  'modal-brief-simulator'
];

requiredIds.forEach(id => {
  if (!html.includes('id="' + id + '"')) {
    console.error('MISSING REQUIRED ELEMENT ID:', id);
    process.exit(1);
  }
});

console.log('All ' + requiredIds.length + ' required element IDs are present!');
console.log('HTML STRUCTURE AND JS SCRIPTS VERIFIED SUCCESSFULLY [100% OK]');
