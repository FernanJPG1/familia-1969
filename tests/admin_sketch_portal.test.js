const assert = require('assert');

async function runTest() {
  console.log('=== TEST: INTERFAZ DEL BOCETO DEL ADMINISTRADOR ===');

  // 1. Iniciar sesión como Admin
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@familia1969.com',
      password: 'FamiliaAdmin1969*'
    })
  });
  assert.strictEqual(loginRes.status, 200, 'Login falló');
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✓ 1. Admin autenticado:', loginData.user.name, 'Rol:', loginData.user.role);

  // 2. Obtener lista de barberos para la sección "Registra"
  const barbersRes = await fetch('http://localhost:3000/api/admin/barbers', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(barbersRes.status, 200);
  const barbersData = await barbersRes.json();
  console.log('✓ 2. Sección "Registra": Total barberos recuperados:', barbersData.barbers.length);

  // 3. Obtener métricas para la píldora superior "( Regis: X   Act: Y )" y "Balance"
  const statsRes = await fetch('http://localhost:3000/api/admin/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(statsRes.status, 200);
  const statsData = await statsRes.json();
  const mrr = statsData.memberships.monthlyRecurringRevenue;
  console.log(`✓ 3. Topbar Pill: ( Regis: ${statsData.totalBarbers}   Act: ${statsData.activeBarbers} )`);
  console.log('✓ 4. Sección "Balance": MRR Software calculado: $' + mrr.toLocaleString('es-CO') + ' COP');

  // 5. Test de adición de tiempo (+30 Días) a un barbero
  const targetBarber = barbersData.barbers[0];
  const initialDays = targetBarber.membership ? targetBarber.membership.daysRemaining : 15;
  
  const renewRes = await fetch(`http://localhost:3000/api/admin/barbers/${targetBarber.id}/membership`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      plan: 'mensual',
      addDays: 30,
      price: 50000,
      paymentMethod: 'Nequi / Transferencia',
      notes: 'Test de adición rápida de +30 días'
    })
  });
  assert.strictEqual(renewRes.status, 200);
  const renewData = await renewRes.json();
  const newDays = renewData.barber.membership.daysRemaining;
  console.log(`✓ 5. Botón [+30 Días]: Barbero "${targetBarber.name}" pasó de ${initialDays} días a ${newDays} días restantes.`);
  assert.strictEqual(newDays >= initialDays + 29, true, 'Días no incrementaron correctamente');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE LA INTERFAZ DEL ADMINISTRADOR PASARON AL 100%!');
}

runTest().catch(err => {
  console.error('Error en prueba:', err);
  process.exit(1);
});
