const assert = require('assert');
const fs = require('fs');
const http = require('http');

console.log('=== TEST SUITE: VINCULACIÓN DIRECTA DE WHATSAPP AL INGRESAR NÚMERO DEL BARBERO ===');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Verificar funciones en frontend
assert(html.includes('function formatWhatsAppPhone('), 'Debe existir formatWhatsAppPhone');
assert(html.includes('function onBarberPhoneInput('), 'Debe existir onBarberPhoneInput');
console.log('✓ 1. Funciones frontend de formateo y vinculación en tiempo real presentes');

// 2. Verificar campo de teléfono en registro
assert(html.includes('id="reg-phone"'), 'Debe existir input de teléfono en registro');
assert(html.includes('oninput="onBarberPhoneInput(this.value, \'reg\')"'), 'Input de registro debe tener listener de vinculación');
assert(html.includes('id="reg-phone-wa-preview"'), 'Debe existir contenedor de vista previa de WhatsApp');
assert(html.includes('id="reg-phone-test-link"'), 'Debe existir enlace de prueba para WhatsApp');
console.log('✓ 2. Formulario de registro con vinculación y prueba en vivo de WhatsApp');

// 3. Verificar modal rápido de teléfono
assert(html.includes('id="quick-phone-input"'), 'Debe existir input rápido de teléfono');
assert(html.includes('oninput="onBarberPhoneInput(this.value, \'quick\')"'), 'Input rápido debe tener listener de vinculación');
assert(html.includes('id="quick-phone-wa-preview"'), 'Debe existir contenedor de vista previa en modal rápido');
assert(html.includes('id="quick-phone-test-link"'), 'Debe existir botón de prueba en modal rápido');
console.log('✓ 3. Modal rápido de teléfono con vinculación y prueba en vivo de WhatsApp');

// 4. Verificar botón lanzador de WhatsApp en el header del barbero
assert(html.includes('id="topbar-phone-display"'), 'Debe existir topbar-phone-display');
assert(html.includes('id="topbar-phone-wa-link"'), 'Debe existir lanzador directo topbar-phone-wa-link');
console.log('✓ 4. Header del barbero con botón de número y lanzador directo de WhatsApp (1 clic)');

// 5. Verificar verificación en 2 pasos
assert(html.includes('id="verify-wa-direct-link"'), 'Debe existir enlace directo de WhatsApp en verificación');
console.log('✓ 5. Modal de verificación con enlace directo de WhatsApp para recibir código');

console.log('\n🎉 ¡TODAS LAS VALIDACIONES DE VINCULACIÓN DE WHATSAPP PASARON CON ÉXITO [100% OK]!');
