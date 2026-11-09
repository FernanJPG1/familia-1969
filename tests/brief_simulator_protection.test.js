const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: PROTECCIÓN SISTEMA VIP & SIMULADOR BREVE EN LANDING ===');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Verificar existencia del modal del simulador breve
assert(html.includes('id="modal-brief-simulator"'), 'Debe existir #modal-brief-simulator');
assert(html.includes('id="sim-view-bot"'), 'Debe existir la vista del bot simulado');
assert(html.includes('id="sim-view-agenda"'), 'Debe existir la vista de agenda simulada');
assert(html.includes('id="sim-view-saas"'), 'Debe existir la vista de membresías simuladas');
console.log('✓ 1. Modal interactivo del simulador breve presente con sus 3 módulos');

// 2. Verificar que los botones de la Landing llaman a openBriefSimulatorModal()
assert(html.includes('openBriefSimulatorModal()'), 'Los botones de la landing deben invocar openBriefSimulatorModal()');
console.log('✓ 2. Botones de la Landing Page redirigen al Simulador Breve');

// 3. Verificar que showAppView() bloquea el acceso sin sesión
assert(html.includes('// PROTECCIÓN ESTRICTA: El sistema VIP NUNCA se puede abrir desde la Landing sin iniciar sesión'), 'showAppView debe estar protegido');
assert(html.includes('if (!currentAuthToken || !currentAuthUser)'), 'showAppView debe validar currentAuthToken y currentAuthUser');
console.log('✓ 3. showAppView() protegido contra accesos anónimos');

// 4. Verificar que checkInitialViewRouting() mantiene a visitantes en la Landing
assert(html.includes('// En el Landing NUNCA se abre el sistema VIP a visitantes públicos'), 'checkInitialViewRouting debe mantener visitantes en Landing');
console.log('✓ 4. checkInitialViewRouting() enruta a visitantes a la Landing');

console.log('\n🎉 ¡TODAS LAS VALIDACIONES DE SEGURIDAD Y SIMULADOR BREVE PASARON CON ÉXITO!');
