const assert = require('assert');
const { whatsappService } = require('../dist/modules/whatsapp/whatsapp.service');
const { store } = require('../dist/database/store');
const { env } = require('../dist/config/env');
const { DateTimeUtils } = require('../dist/core/utils/datetime.utils');

async function testBotConversation() {
  console.log('🤖 Iniciando batería de pruebas avanzadas del Asistente WhatsApp Bot...\n');
  const tenantId = env.DEFAULT_TENANT_ID;
  const testPhone = '573198887766';
  store.clients = store.clients.filter(c => c.whatsappPhone !== testPhone);
  store.sessions = store.sessions.filter(s => s.phone !== testPhone);
  // Limpiar citas de pruebas en la fecha de mañana para asegurar que 10:00 AM esté libre
  const tomorrowStr = DateTimeUtils.getTomorrowDateString();
  store.appointments = store.appointments.filter(a => {
    const aDate = DateTimeUtils.extractDateAndTime(a.startTime).dateStr;
    return aDate !== tomorrowStr;
  });

  // 1. Mensaje de bienvenida
  console.log('Test 1: Saludo inicial y presentación del catálogo...');
  const r1 = await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'text',
    text: 'hola buenas'
  });
  assert(r1.body.includes('FAMILIA 1969') || r1.body.includes('VALMONT') || r1.body.includes('Mateo Silva'), 'El bot debe saludar con el nombre de la barbería o barbero');
  assert(r1.sections && r1.sections.length > 0, 'El bot debe incluir secciones con el catálogo de cortes');
  console.log('✅ Saludo inicial y catálogo validados.');

  // 2. Preguntas Frecuentes (Ubicación, Precios, Horarios)
  console.log('\nTest 2: Comprensión NLU de Preguntas Frecuentes...');
  const rLoc = await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'text',
    text: 'dónde quedan ubicados?'
  });
  assert(rLoc.body.includes('Carrera 15') || rLoc.body.includes('Bogotá'), 'Debe responder la dirección');

  const rPrice = await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'text',
    text: 'cuánto cuesta un corte?'
  });
  assert(rPrice.body.includes('$35.000') || rPrice.body.includes('Corte'), 'Debe responder los precios');

  const rSched = await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'text',
    text: 'a qué horas atienden?'
  });
  assert(rSched.body.includes('Atendemos de') || rSched.body.includes('9:00 AM'), 'Debe responder los horarios');
  console.log('✅ Preguntas frecuentes (Ubicación, Precios, Horarios) validadas.');

  // 3. Fast-Track: Especificar corte y fecha directamente
  console.log('\nTest 3: Fast-track booking con corte y fecha en lenguaje natural...');
  const rFast = await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'text',
    text: 'quiero un corte clásico para mañana'
  });
  assert(rFast.sections && rFast.sections[0].rows.length > 0, 'Debe saltar directamente a mostrar los turnos libres');
  assert(rFast.body.includes('Corte Clásico') || rFast.body.includes('Horarios Libres'), 'Debe confirmar el corte seleccionado');
  console.log('✅ Fast-track detectó el servicio y la fecha, mostrando turnos inmediatamente.');

  // 4. Selección de hora por lenguaje natural ("a las 10 am")
  console.log('\nTest 4: Selección de horario por texto libre ("a las 10 am")...');
  const rSlotText = await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'text',
    text: 'a las 10 am'
  });
  assert(rSlotText.body.includes('Nombre') || rSlotText.body.includes('apartado') || rSlotText.body.includes('ÉXITO'), 'Debe aceptar la hora y pedir el nombre');
  console.log('✅ Selección de hora por texto libre aceptada con éxito.');

  // 5. Envío de nombre y confirmación atómica
  console.log('\nTest 5: Captura de nombre y confirmación final de la cita...');
  const rConfirm = await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'text',
    text: 'Mauricio Gómez'
  });
  assert(rConfirm.body.includes('ÉXITO') || rConfirm.body.includes('AGENDADA'), 'Debe confirmar la cita con éxito');
  assert(rConfirm.body.includes('Mauricio Gómez'), 'Debe mencionar el nombre del cliente');
  console.log('✅ Cita confirmada y registrada en la base de datos.');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE CONVERSACIÓN DEL CHAT BOT PASARON (5/5)!');
}

testBotConversation().catch(err => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
