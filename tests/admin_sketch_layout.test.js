const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: INTERFAZ DE ADMINISTRADOR SEGÚN BOCETO ===');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Verificar existencia del header exclusivo del administrador
assert(html.includes('id="admin-header-bar"'), 'Debe existir #admin-header-bar');
assert(html.includes('id="admin-topbar-metrics-pill"'), 'Debe existir la píldora de métricas #admin-topbar-metrics-pill');
assert(html.includes('id="admin-header-total-reg"'), 'Debe existir contador #admin-header-total-reg');
assert(html.includes('id="admin-header-total-act"'), 'Debe existir contador #admin-header-total-act');
console.log('✓ 1. Header con métricas de Registros y Activos verificado');

// 2. Verificar existencia de los botones requeridos en el header
assert(html.includes('switchMobileTab(\'whatsapp\')') && html.includes('Simulador'), 'Debe existir botón Simulador');
assert(html.includes('logoutBarber()') && html.includes('Cerrar'), 'Debe existir botón Cerrar');
console.log('✓ 2. Botón del Simulador y Botón de Cerrar presentes en el Header');

// 3. Verificar menú lateral con las opciones del boceto (Registros, Configur, Balance)
assert(html.includes('id="nav-btn-memberships"'), 'Debe existir item Registros');
assert(html.includes('id="nav-btn-settings"'), 'Debe existir item Configur');
assert(html.includes('id="nav-btn-earnings"'), 'Debe existir item Balance');
assert(html.includes('familia1969-badge-blue.png'), 'Debe tener el logo de FAMILIA 1969');
console.log('✓ 3. Barra lateral con Logo, Marca y menú (Registros, Configur, Balance) verificado');

// 4. Verificar función updateAdminHeaderStats()
assert(html.includes('function updateAdminHeaderStats()'), 'Debe existir updateAdminHeaderStats()');
assert(html.includes('/api/admin/stats'), 'Debe consultar las estadísticas de administración');
console.log('✓ 4. Función de sincronización en vivo updateAdminHeaderStats() verificada');

console.log('\n🎉 ¡TODAS LAS VALIDACIONES DE LA INTERFAZ SEGÚN EL BOCETO PASARON CON ÉXITO!');
