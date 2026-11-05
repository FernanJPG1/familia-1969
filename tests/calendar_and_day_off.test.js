/**
 * Pruebas unitarias y de integración para:
 * 1. Selección de fecha: Hoy, Mañana, Otra Fecha.
 * 2. Despliegue de Calendario interactivo (DATE_PICKER).
 * 3. Protección del día de descanso semanal del barbero (ej: Domingo de descanso).
 */

const assert = require('assert');
const { whatsappService } = require('../dist/modules/whatsapp/whatsapp.service');
const { store } = require('../dist/database/store');
const { DateTimeUtils } = require('../dist/core/utils/datetime.utils');

async function runCalendarAndDayOffTests() {
  console.log('📅 Iniciando pruebas del Calendario Interactivo y Día de Descanso Semanal...');
  const tenantId = 'tenant-demo-1';
  const testPhone = '573119998877';
  store.clients = store.clients.filter(c => c.whatsappPhone !== testPhone);
  store.sessions = store.sessions.filter(s => s.phone !== testPhone);

  // 1. Saludo inicial
  await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'text',
    text: 'hola'
  });

  // 2. Selección de servicio -> Debe ofrecer Hoy, Mañana y Otra Fecha
  console.log('\nTest 1: Selección de servicio y oferta de fechas (Hoy, Mañana, Otra Fecha)...');
  const rService = await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'interactive_list',
    listId: 'SERVICE_srv-1'
  });

  assert.ok(rService.buttons, 'Debe devolver botones interactivos');
  assert.strictEqual(rService.buttons.length, 3, 'Debe devolver exactamente 3 opciones');
  assert.strictEqual(rService.buttons[0].title, 'Hoy', 'El primer botón debe ser Hoy');
  assert.strictEqual(rService.buttons[1].title, 'Mañana', 'El segundo botón debe ser Mañana');
  assert.ok(rService.buttons[2].title.includes('Otra Fecha'), 'El tercer botón debe ser Otra Fecha');
  assert.strictEqual(rService.buttons[2].id, 'DATE_PICKER', 'El ID del botón debe ser DATE_PICKER');
  console.log('✅ Opciones de fecha validadas: Hoy, Mañana y 📅 Otra Fecha.');

  // 3. Click en "Otra Fecha" (DATE_PICKER) -> Despliega el calendario y próximas fechas
  console.log('\nTest 2: Click en DATE_PICKER -> Despliegue de calendario y próximas fechas activas...');
  const rPicker = await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'interactive_button',
    buttonId: 'DATE_PICKER'
  });

  assert.ok(rPicker.calendarPicker, 'Debe incluir el objeto calendarPicker para el frontend');
  assert.ok(rPicker.calendarPicker.minDate, 'Debe tener minDate');
  assert.ok(rPicker.calendarPicker.restDays.includes(7), 'Debe identificar el Domingo (7) como día de descanso');
  assert.ok(rPicker.sections && rPicker.sections[0].rows.length > 0, 'Debe incluir lista de fechas activas para WhatsApp');
  assert.ok(rPicker.body.includes('descanso'), 'El cuerpo debe recordar la jornada de descanso');
  console.log('✅ Calendario interactivo desplegado con objeto calendarPicker y lista de fechas activas.');

  // 4. Intentar reservar un Domingo (Día de descanso semanal)
  console.log('\nTest 3: Intento de reserva en día de descanso semanal (Domingo)...');
  // Buscar el próximo domingo
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay() + 7) % 7 || 7;
  const sundayDate = new Date();
  sundayDate.setDate(today.getDate() + daysUntilSunday);
  const sundayStr = `${sundayDate.getFullYear()}-${String(sundayDate.getMonth() + 1).padStart(2, '0')}-${String(sundayDate.getDate()).padStart(2, '0')}`;

  const rSunday = await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'interactive_button',
    buttonId: `DATE_${sundayStr}`
  });

  assert.ok(rSunday.header.includes('Día de Descanso'), 'Debe tener encabezado de Día de Descanso');
  assert.ok(rSunday.body.includes('Domingo') || rSunday.body.includes('descanso'), 'Debe explicar que es el día de descanso del barbero');
  assert.ok(rSunday.buttons && rSunday.buttons.length === 3, 'Debe ofrecer alternativas de fecha');
  console.log(`✅ Día de descanso protegido exitosamente: El bot informó que el ${sundayStr} el barbero descansa.`);

  // 5. Selección de un día activo desde el calendario (ej: próximo Viernes o día hábil)
  console.log('\nTest 4: Selección de fecha hábil desde el calendario...');
  // Buscar un día hábil (lunes a sábado)
  const validRow = rPicker.sections[0].rows[0];
  const validDateId = validRow.id; // e.g. DATE_2026-11-05
  
  const rValid = await whatsappService.handleIncomingMessage(tenantId, {
    from: testPhone,
    type: 'interactive_button',
    buttonId: validDateId
  });

  assert.ok(rValid.sections && rValid.sections[0].rows.length > 0, 'Debe devolver turnos libres para la fecha válida');
  assert.ok(rValid.header.includes('Horarios Libres'), 'Debe mostrar Horarios Libres');
  console.log(`✅ Fecha hábil (${validDateId}) procesada con éxito y horarios mostrados.`);

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE CALENDARIO Y DÍA DE DESCANSO PASARON CON ÉXITO (4/4)!');
}

runCalendarAndDayOffTests().catch((err) => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
