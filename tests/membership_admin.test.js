const assert = require('assert');
const http = require('http');

function apiRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runMembershipTests() {
  console.log('=== TEST SUITE: GESTIÓN DE TIEMPO Y MEMBRESÍAS DE SOFTWARE ===');

  // 1. Login Admin
  const adminLogin = await apiRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@familia1969.com', password: 'FamiliaAdmin1969*' });

  assert.strictEqual(adminLogin.status, 200, 'Admin login debe ser 200');
  const adminToken = adminLogin.data.token;
  console.log('✓ 1. Admin login exitoso');

  // 2. Registro de nuevo barbero
  const testBarberEmail = `mateo.barber.${Date.now()}@familia1969.com`;
  const regRes = await apiRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Mateo Membership Test',
    email: testBarberEmail,
    password: 'Password1969*',
    phone: '+57 319 888 9900'
  });

  assert.strictEqual(regRes.status, 201, 'Registro debe ser 201');
  const barberUserId = regRes.data.user.id;
  console.log('✓ 2. Nuevo barbero registrado con ID:', barberUserId);

  // 3. Admin lista barberos y verifica membresía
  const listRes = await apiRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/barbers',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  assert.strictEqual(listRes.status, 200);
  const foundBarber = listRes.data.barbers.find(b => b.id === barberUserId);
  assert.ok(foundBarber, 'Barbero debe aparecer en lista del admin');
  assert.ok(foundBarber.membership, 'Barbero debe tener objeto membership');
  console.log('✓ 3. Membresía inicial evaluada:', foundBarber.membership.plan, 'Días restantes:', foundBarber.membership.daysRemaining);

  // 4. Admin agrega +30 días a la membresía del barbero
  const renewRes = await apiRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/admin/barbers/${barberUserId}/membership`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    plan: 'mensual',
    addDays: 30,
    price: 50000,
    paymentMethod: 'Nequi',
    notes: 'Pago mensualidad recibido por Nequi'
  });

  assert.strictEqual(renewRes.status, 200, 'Renovación de membresía debe responder 200');
  assert.ok(renewRes.data.barber.membership.daysRemaining >= 30, 'Días restantes deben ser al menos 30');
  console.log('✓ 4. Membresía extendida con +30 días. Días actuales:', renewRes.data.barber.membership.daysRemaining);

  // 5. Admin actualiza a Plan Anual VIP
  const anualRes = await apiRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/admin/barbers/${barberUserId}/membership`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    plan: 'anual',
    addDays: 365,
    price: 480000,
    paymentMethod: 'Bancolombia Transferencia'
  });

  assert.strictEqual(anualRes.status, 200);
  assert.strictEqual(anualRes.data.barber.membership.plan, 'anual');
  assert.ok(anualRes.data.barber.membership.daysRemaining >= 365);
  console.log('✓ 5. Barbero ascendido a Plan Anual. Días:', anualRes.data.barber.membership.daysRemaining);

  // 6. Consultar métricas de membresías del software
  const metricsRes = await apiRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/memberships/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  assert.strictEqual(metricsRes.status, 200);
  assert.ok(metricsRes.data.memberships, 'Debe incluir objeto de métricas memberships');
  console.log('✓ 6. Métricas de membresías obtenidas:', metricsRes.data.memberships);
  assert.ok(typeof metricsRes.data.memberships.monthlyRecurringRevenue === 'number', 'MRR debe ser numérico');
  assert.ok(metricsRes.data.memberships.active >= 1, 'Debe haber membresías activas');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE GESTIÓN Y MEDICIÓN DE MEMBRESÍAS PASARON CON ÉXITO!');
  process.exit(0);
}

runMembershipTests().catch(err => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
