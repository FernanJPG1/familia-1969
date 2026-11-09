const http = require('http');

http.get('http://localhost:3000/index.html', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('=== VERIFICACIÓN EXHAUSTIVA DE LANDING SCROLLYTELLING ===');
    const checks = [
      { name: 'Status 200 OK', test: res.statusCode === 200 },
      { name: 'Contenedor #landing-view', test: body.includes('id="landing-view"') },
      { name: 'Contenedor #app-view', test: body.includes('id="app-view"') },
      { name: 'Navbar Sticky Landing', test: body.includes('class="landing-nav"') },
      { name: 'Logo Badge Familia 1969', test: body.includes('/assets/brand/familia1969-badge-blue.png') },
      { name: 'Botón Login Landing', test: body.includes("openAuthModal('login')") },
      { name: 'Botón Registro Barbero Landing', test: body.includes("openAuthModal('register')") },
      { name: 'Botón Entrar al Sistema Landing', test: body.includes("showAppView()") },
      { name: 'Capítulo 1: WhatsApp Directo', test: body.includes('01') && body.includes('COMUNICACI') },
      { name: 'Capítulo 2: Privacidad NIST', test: body.includes('02') && body.includes('BLINDAJE CRIPTOGR') },
      { name: 'Capítulo 3: Control Maestro', test: body.includes('03') && body.includes('CONTROL MAESTRO') },
      { name: 'Capítulo 4: Inteligencia de Turnos', test: body.includes('04') && body.includes('INTELIGENCIA DE TURNOS') },
      { name: 'Escena 1 WhatsApp Mockup', test: body.includes('id="scene-1"') },
      { name: 'Escena 2 NIST scrypt Vault', test: body.includes('id="scene-2"') },
      { name: 'Escena 3 Admin Cockpit Mockup', test: body.includes('id="scene-3"') },
      { name: 'Escena 4 Matriz de Turnos', test: body.includes('id="scene-4"') },
      { name: 'Servicio: Corte Clásico $35.000', test: body.includes('$35.000') && body.includes('Corte Clásico & Fade Texturizado') },
      { name: 'Servicio: Ritual Barba $25.000', test: body.includes('$25.000') && body.includes('Ritual Barba Imperial') },
      { name: 'Servicio: Combo VIP $55.000', test: body.includes('$55.000') && body.includes('Combo VIP Familia 1969') },
      { name: 'Servicio: Perfilado $18.000', test: body.includes('$18.000') && body.includes('Perfilado & Navaja Tradicional') },
      { name: 'Función showLandingView()', test: body.includes('function showLandingView()') },
      { name: 'Función showAppView()', test: body.includes('function showAppView()') },
      { name: 'Función initLandingScrollytelling()', test: body.includes('function initLandingScrollytelling()') },
      { name: 'Función checkInitialViewRouting()', test: body.includes('function checkInitialViewRouting()') },
      { name: 'Botón Topbar Club / Landing', test: body.includes('Club / Landing') },
      { name: 'Enlace Sidebar Presentación / Club', test: body.includes('Presentación / Club') }
    ];

    let passed = 0;
    checks.forEach(c => {
      if (c.test) {
        console.log(`  [OK] ${c.name}`);
        passed++;
      } else {
        console.error(`  [FAIL] ${c.name}`);
      }
    });

    console.log(`\nResultado: ${passed}/${checks.length} verificaciones exitosas.`);
    if (passed === checks.length) {
      console.log('🎉 100% DE PRUEBAS SUPERADAS CON ÉXITO.');
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}).on('error', err => {
  console.error('Error al conectar:', err.message);
  process.exit(1);
});
