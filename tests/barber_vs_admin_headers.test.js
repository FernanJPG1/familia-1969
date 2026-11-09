const fs = require('fs');
const assert = require('assert');

function runTest() {
  console.log('=== TEST: BARBER VS ADMINISTRATOR SEPARATION OF HEADERS AND SIDEBAR ===');

  const html = fs.readFileSync('C:/Users/Usuario/Desktop/Barberia/index.html', 'utf8');

  // 1. Verify barber header is present in app-view
  assert(html.includes('id="barber-header-bar"'), 'Debe existir barber-header-bar');
  assert(html.includes('topbar-date-widget'), 'Barbero debe tener widget de fechas (Hoy)');
  assert(html.includes('topbar-kpis'), 'Barbero debe tener KPIs en vivo (Caja Hoy, Citas, Bot WhatsApp)');
  console.log('✓ 1. Header tradicional del barbero con fecha, KPIs y acciones presente');

  // 2. Verify barber sidebar labels are restored to their original names
  assert(html.includes('>Agenda de Citas</span>'), 'Barbero debe tener "Agenda de Citas"');
  assert(html.includes('>Mis Tipos de Corte</span>'), 'Barbero debe tener "Mis Tipos de Corte"');
  assert(html.includes('>Consola Bot 24/7</span>'), 'Barbero debe tener "Consola Bot 24/7"');
  assert(html.includes('>Caja & Ganancias</span>'), 'Barbero debe tener "Caja & Ganancias"');
  assert(html.includes('>Configuración Total</span>'), 'Barbero debe tener "Configuración Total"');
  assert(html.includes('>Presentación / Club</span>'), 'Barbero debe tener "Presentación / Club"');
  console.log('✓ 2. Menú lateral del barbero restaurado al 100% con sus nombres originales');

  // 3. Verify admin sketch layout has its exclusive header and sidebar
  assert(html.includes('id="admin-portal-view"'), 'Debe existir admin-portal-view');
  assert(html.includes('id="asketch-top-regis"'), 'Admin debe tener contador de Registros en header');
  assert(html.includes('id="asketch-top-act"'), 'Admin debe tener contador de Activos en header');
  assert(html.includes('openAdminSimulator()'), 'Admin debe tener botón Simulador');
  assert(html.includes('id="asketch-btn-registra"'), 'Admin sidebar debe tener "Registra"');
  assert(html.includes('id="asketch-btn-configu"'), 'Admin sidebar debe tener "Configu"');
  assert(html.includes('id="asketch-btn-balance"'), 'Admin sidebar debe tener "Balance"');
  console.log('✓ 3. Interfaz exclusiva del Administrador según el boceto intacta');

  // 4. Verify updateAuthUI() separates admin vs barber headers strictly
  assert(html.includes("if (adminHeader) adminHeader.style.display = 'none';"), 'Debe ocultar adminHeader para barberos');
  assert(html.includes("if (barberHeader) barberHeader.style.display = 'flex';"), 'Debe mostrar barberHeader para barberos');
  console.log('✓ 4. updateAuthUI() conmuta y protege los headers según el rol de forma estricta');

  console.log('\n🎉 TODAS LAS VALIDACIONES DE SEPARACIÓN BARBERO VS ADMIN PASARON [100% OK]!');
}

runTest();
