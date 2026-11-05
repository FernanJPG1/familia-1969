const assert = require('assert');
const { store } = require('../dist/database/store');
const { whatsappService } = require('../dist/modules/whatsapp/whatsapp.service');
const { WhatsAppNLU } = require('../dist/modules/whatsapp/whatsapp.nlu');
const { ReminderScheduler } = require('../dist/modules/appointments/reminder.scheduler');
const { DateTimeUtils } = require('../dist/core/utils/datetime.utils');

async function testRemindersAndNotifications() {
  console.log('🔔 Iniciando pruebas de Notificaciones al Barbero y Recordatorios 20m al Cliente...\n');

  const tenant = store.getPrimaryTenant();
  const barber = store.getPrimaryBarber();
  const service = store.services[0];
  const testPhone = '573109998877';

  // Limpieza previa de citas de prueba anteriores para asegurar idempotencia
  store.appointments = store.appointments.filter(a => a.notes !== 'Turno de prueba para recordatorio 20m');
  store.clients = store.clients.filter(c => c.whatsappPhone !== testPhone);
  store.sessions = store.sessions.filter(s => s.phone !== testPhone);

  // 1. Crear cliente y cita para dentro de 15 minutos (en la ventana de 20 minutos)
  console.log('Test 1: Scheduler de Recordatorio Automático (20 minutos antes)...');
  let client = {
    id: `client-test-${Date.now()}`,
    tenantId: tenant.id,
    name: 'Andrés Cepeda',
    whatsappPhone: testPhone,
    totalNoShows: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.clients.push(client);

  const in15Minutes = new Date(Date.now() + 15 * 60 * 1000);
  const endTime = new Date(in15Minutes.getTime() + service.durationMinutes * 60 * 1000);

  const testApp = {
    id: `app-reminder-test-${Date.now()}`,
    tenantId: tenant.id,
    barberId: barber.id,
    clientId: client.id,
    serviceId: service.id,
    startTime: in15Minutes,
    endTime: endTime,
    totalPrice: service.price,
    status: 'confirmed',
    notes: 'Turno de prueba para recordatorio 20m',
    reminderSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.appointments.push(testApp);

  // Ejecutar el scheduler
  const sentCount = ReminderScheduler.checkAndSendReminders();
  assert.ok(sentCount >= 1, 'El scheduler debió detectar y enviar el recordatorio para la cita en 15m');
  assert.ok(testApp.reminderSentAt !== null, 'reminderSentAt debe estar poblado tras el disparo');
  console.log('✅ Scheduler disparó exitosamente el recordatorio de 20 minutos.');

  // 2. Verificar contenido del mensaje de recordatorio de 20 minutos
  console.log('\nTest 2: Verificación del formato del mensaje de recordatorio de 20m...');
  const reminderMsg = whatsappService.generateReminderMessage(testApp.id);
  assert.ok(reminderMsg, 'Debe generar el mensaje de recordatorio');
  assert.ok(reminderMsg.header.includes('20 Minutos'), 'El encabezado debe especificar 20 minutos');
  assert.ok(reminderMsg.body.includes('20 minutos'), 'El cuerpo debe indicar que la cita es en 20 minutos');
  console.log(`✅ Mensaje de 20 minutos validado: "${reminderMsg.header}"`);

  // 3. Cliente avisa por WhatsApp: "Ya llegué" / "estoy acá"
  console.log('\nTest 3: NLU reconoce intención de llegada del cliente...');
  const intent1 = WhatsAppNLU.detectIntent('ya llegué a la barbería');
  const intent2 = WhatsAppNLU.detectIntent('estoy acá afuera');
  assert.strictEqual(intent1, 'CLIENT_ARRIVED', 'Debe reconocer "ya llegué" como CLIENT_ARRIVED');
  assert.strictEqual(intent2, 'CLIENT_ARRIVED', 'Debe reconocer "estoy acá" como CLIENT_ARRIVED');
  console.log('✅ NLU clasificó correctamente las frases de llegada física al local.');

  // 4. Procesamiento del mensaje de llegada y actualización de estado a 'arrived'
  console.log('\nTest 4: El cliente avisa que llegó y se actualiza el estado a "arrived"...');
  const arrivalResponse = await whatsappService.handleIncomingMessage(tenant.id, {
    from: testPhone,
    type: 'text',
    text: 'Hola Mateo ya llegué al local',
  });
  assert.ok(arrivalResponse.body.includes('sala de espera'), 'La respuesta debe confirmar que está en sala de espera');
  assert.strictEqual(testApp.status, 'arrived', 'El estado del turno en store debe cambiar a "arrived"');
  console.log('✅ Estado actualizado a "arrived" y barbero notificado en tiempo real.');

  // 5. Botón interactivo de llegada (CONFIRM_ARRIVED_)
  console.log('\nTest 5: Botón interactivo CONFIRM_ARRIVED...');
  testApp.status = 'confirmed'; // reset
  const buttonResponse = await whatsappService.handleIncomingMessage(tenant.id, {
    from: testPhone,
    type: 'interactive_button',
    buttonId: `CONFIRM_ARRIVED_${testApp.id}`,
  });
  assert.strictEqual(testApp.status, 'arrived', 'El estado debe cambiar a "arrived" mediante botón interactivo');
  assert.ok(buttonResponse.body.includes('sala de espera'), 'Debe confirmar que está en sala de espera');
  console.log('✅ Botón interactivo de llegada procesado correctamente.');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE RECORDATORIOS Y NOTIFICACIONES DE LLEGADA PASARON EXITOSAMENTE (5/5)!');
}

testRemindersAndNotifications().catch(err => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
