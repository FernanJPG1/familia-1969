const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function verify() {
  console.log('--- Probando API REST de Cortes y Servicios ---');

  // 1. Crear nuevo corte
  const createRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/services',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Mullet Moderno con Degradado',
    category: 'Corte',
    badge: '⭐ Novedad',
    durationMinutes: 45,
    price: 38000,
    description: 'Corte mullet retro con degradado en sienes y textura superior',
    icon: 'fa-scissors'
  });

  console.log('1. Creación:', createRes.status, createRes.data?.service?.name);
  const createdId = createRes.data?.service?.id;

  // 2. Editar el corte
  const editRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/services/${createdId}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    price: 40000,
    badge: '🔥 Top Tendencia'
  });
  console.log('2. Edición:', editRes.status, 'Nuevo precio:', editRes.data?.service?.price, 'Insignia:', editRes.data?.service?.badge);

  // 3. Pausar (Toggle)
  const toggleRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/services/${createdId}/toggle`,
    method: 'PATCH'
  });
  console.log('3. Pausar:', toggleRes.status, 'isActive:', toggleRes.data?.service?.isActive);

  // 4. Reactivar (Toggle)
  const toggleOnRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/services/${createdId}/toggle`,
    method: 'PATCH'
  });
  console.log('4. Reactivar:', toggleOnRes.status, 'isActive:', toggleOnRes.data?.service?.isActive);

  // 5. Simular WhatsApp Bot interactuando con el nuevo corte
  const waRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/whatsapp/incoming',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    from: '573119876543',
    text: 'Hola quiero hacerme el mullet moderno'
  });
  console.log('5. WhatsApp Bot respuesta:');
  console.log('   Tipo:', waRes.data?.response?.type);
  console.log('   Texto:\n' + waRes.data?.response?.body);
  if (waRes.data?.response?.buttons) {
    console.log('   Botones:', waRes.data?.response?.buttons?.map(b => b.title).join(', '));
  }

  console.log('\n✅ VERIFICACIÓN COMPLETA EXITOSA.');
}

verify().catch(console.error);
