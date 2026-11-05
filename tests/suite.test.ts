import assert from 'assert';
import { store } from '../src/database/store';
import { availabilityEngine } from '../src/modules/availability/availability.engine';
import { whatsappService } from '../src/modules/whatsapp/whatsapp.service';
import { WhatsAppNLU } from '../src/modules/whatsapp/whatsapp.nlu';
import { DateTimeUtils } from '../src/core/utils/datetime.utils';
import { AppointmentsService } from '../src/modules/appointments/appointments.service';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';

async function runTests() {
  console.log('🧪 Iniciando batería de pruebas unitarias y de integración...\n');

  // ==========================================================================
  // TEST 1: DateTimeUtils
  // ==========================================================================
  console.log('Test 1: DateTimeUtils formatting & arithmetic...');
  assert.strictEqual(DateTimeUtils.timeToMinutes('09:30'), 570, '09:30 debe ser 570 minutos');
  assert.strictEqual(DateTimeUtils.minutesToTime(570), '09:30', '570 minutos debe ser 09:30');
  assert.strictEqual(DateTimeUtils.format12h('14:30'), '2:30 PM', '14:30 debe ser 2:30 PM');
  assert.strictEqual(DateTimeUtils.format12h('09:00'), '9:00 AM', '09:00 debe ser 9:00 AM');
  assert.strictEqual(DateTimeUtils.isOverlapping(540, 580, 560, 600), true, 'Deben solaparse');
  assert.strictEqual(DateTimeUtils.isOverlapping(540, 580, 580, 620), false, 'Límites adyacentes no solapan');
  console.log('✅ DateTimeUtils pasó todas las pruebas.');

  // ==========================================================================
  // TEST 2: AvailabilityEngine
  // ==========================================================================
  console.log('\nTest 2: AvailabilityEngine slot calculation...');
  const barber = store.getPrimaryBarber();
  const service = store.services[0]; // 40 min
  const testDate = DateTimeUtils.getTomorrowDateString(); // mañana para evitar que los slots de hoy hayan pasado

  const slots = availabilityEngine.calculateSlotsForBarber({
    barber,
    service,
    date: testDate,
    schedules: store.schedules,
    blocks: store.blocks,
    existingAppointments: store.appointments,
    slotBufferMinutes: 10,
  });

  assert.ok(slots.length > 0, 'Debe generar slots');
  console.log(`- Slots totales generados para mañana (${testDate}): ${slots.length}`);

  // Verificar que el receso de almuerzo (13:00 - 14:00) esté bloqueado
  const lunchSlot = slots.find(s => s.formattedTime.includes('1:00 PM') || s.formattedTime.includes('1:20 PM'));
  if (lunchSlot) {
    assert.strictEqual(lunchSlot.available, false, 'El slot que coincide con el almuerzo debe estar no disponible');
    console.log(`- Slot de almuerzo correctamente bloqueado: ${lunchSlot.formattedTime} (Motivo: ${lunchSlot.reason})`);
  }

  // Verificar isSlotFree
  const freeSlot = slots.find(s => s.available);
  assert.ok(freeSlot, 'Debe existir al menos un slot libre para mañana');
  const isFree = availabilityEngine.isSlotFree({
    barberId: barber.id,
    startTime: new Date(freeSlot.startTime),
    endTime: new Date(freeSlot.endTime),
    existingAppointments: store.appointments,
    blocks: store.blocks,
  });
  assert.strictEqual(isFree, true, 'isSlotFree debe ser true para un slot disponible');
  console.log('✅ AvailabilityEngine pasó todas las pruebas.');

  // ==========================================================================
  // TEST 3: WhatsApp NLU
  // ==========================================================================
  console.log('\nTest 3: WhatsApp NLU Intent Recognition...');
  assert.strictEqual(WhatsAppNLU.detectIntent('¿Dónde queda la barbería?'), 'LOCATION');
  assert.strictEqual(WhatsAppNLU.detectIntent('cuanto cuesta el corte clasico'), 'PRICES');
  assert.strictEqual(WhatsAppNLU.detectIntent('a que hora abren manana'), 'SCHEDULE');
  assert.strictEqual(WhatsAppNLU.detectIntent('quiero hablar con mateo silva'), 'TALK_HUMAN');
  assert.strictEqual(WhatsAppNLU.detectIntent('hola buenas tardes'), 'GREETING');
  assert.strictEqual(WhatsAppNLU.detectIntent('quiero agendar una cita'), 'BOOK_INTENT');
  console.log('✅ WhatsApp NLU reconoció correctamente todas las intenciones.');

  // ==========================================================================
  // TEST 4: WhatsApp Conversational Bot Flow (Simulación paso a paso)
  // ==========================================================================
  console.log('\nTest 4: WhatsApp Bot Step-by-Step Flow...');
  const testPhone = '573998887766'; // Cliente nuevo de prueba

  // Paso 1: Saludo inicial
  const r1 = await whatsappService.handleIncomingMessage('tenant-demo-1', {
    from: testPhone,
    type: 'text',
    text: 'hola',
  });
  assert.ok(r1.body.includes('Mateo Silva'), 'El saludo debe mencionar a Mateo Silva');
  assert.ok(r1.sections && r1.sections.length > 0, 'Debe mostrar el catálogo de cortes');
  console.log('- Paso 1: Saludo y catálogo respondido correctamente.');

  // Paso 2: Selección de corte
  const r2 = await whatsappService.handleIncomingMessage('tenant-demo-1', {
    from: testPhone,
    type: 'interactive_list',
    listId: 'SERVICE_srv-1',
  });
  assert.ok(r2.buttons && r2.buttons.length > 0, 'Debe ofrecer opciones de fecha');
  assert.ok(r2.body.includes('Corte Clásico'), 'Debe confirmar el corte seleccionado');
  console.log('- Paso 2: Selección de corte y botones de fecha generados.');

  // Paso 3: Selección de fecha (mañana)
  const tomorrowStr = DateTimeUtils.getTomorrowDateString();
  const r3 = await whatsappService.handleIncomingMessage('tenant-demo-1', {
    from: testPhone,
    type: 'interactive_button',
    buttonId: `DATE_${tomorrowStr}`,
  });
  assert.ok(r3.sections && r3.sections[0].rows.length > 0, 'Debe devolver lista de slots disponibles');
  const chosenSlotRow = r3.sections[0].rows[0];
  console.log(`- Paso 3: Slots recibidos para mañana. Primer slot elegido: ${chosenSlotRow.title}`);

  // Paso 4: Selección de slot horario
  const r4 = await whatsappService.handleIncomingMessage('tenant-demo-1', {
    from: testPhone,
    type: 'interactive_list',
    listId: chosenSlotRow.id,
  });
  assert.ok(r4.body.includes('Nombre y Apellido'), 'Debe solicitar el nombre para un cliente nuevo');
  console.log('- Paso 4: Horario apartado y solicitud de nombre.');

  // Paso 5: Ingreso de nombre y confirmación de reserva atómica
  const r5 = await whatsappService.handleIncomingMessage('tenant-demo-1', {
    from: testPhone,
    type: 'text',
    text: 'Carlos Santana',
  });
  assert.ok(r5.body.includes('CITA AGENDADA CON ÉXITO'), 'Debe confirmar la cita con éxito');
  assert.ok(r5.body.includes('Carlos Santana'), 'Debe contener el nombre del cliente');
  console.log('- Paso 5: Cita confirmada y registrada en la base de datos.');

  // ==========================================================================
  // TEST 5: AppointmentsService & Dashboard
  // ==========================================================================
  console.log('\nTest 5: Dashboard & Appointments verification...');
  const dashboard = DashboardService.getDashboardForDate(tomorrowStr);
  const createdApp = dashboard.appointments.find((a: any) => a.clientName === 'Carlos Santana');
  assert.ok(createdApp, 'La cita recién agendada debe estar presente en el dashboard');
  assert.strictEqual(createdApp.status, 'confirmed');
  console.log(`- Cita encontrada en dashboard: ${createdApp.serviceName} a las ${new Date(createdApp.startTime).toLocaleTimeString()}`);

  // Probar recordatorio T-2h
  const reminderMsg = whatsappService.generateReminderMessage(createdApp.id);
  assert.ok(reminderMsg, 'Debe generar el mensaje de recordatorio');
  assert.ok(reminderMsg.buttons && reminderMsg.buttons.length === 2, 'Debe incluir botones de Voy en camino y Cancelar');
  console.log('- Recordatorio T-2h generado con botones interactivos.');

  // Probar cancelación por botón interactivo
  const cancelReply = await whatsappService.handleIncomingMessage('tenant-demo-1', {
    from: testPhone,
    type: 'interactive_button',
    buttonId: `CANCEL_APPOINTMENT_${createdApp.id}`,
  });
  assert.ok(cancelReply.body.includes('Turno cancelado'), 'Debe responder confirmando la cancelación');
  assert.strictEqual(createdApp.status, 'cancelled', 'El estado de la cita debe ser cancelled');
  console.log('- Cancelación interactiva probada con éxito.');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS (5/5) PASARON EXITOSAMENTE!');
}

runTests().catch(err => {
  console.error('\n❌ Error en las pruebas:', err);
  process.exit(1);
});
