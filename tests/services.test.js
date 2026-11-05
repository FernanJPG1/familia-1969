const assert = require('assert');
const { store } = require('../dist/database/store');
const { ServicesService } = require('../dist/modules/services/services.service');
const { WhatsAppNLU } = require('../dist/modules/whatsapp/whatsapp.nlu');
const { whatsappService } = require('../dist/modules/whatsapp/whatsapp.service');
const { availabilityEngine } = require('../dist/modules/availability/availability.engine');
const { DateTimeUtils } = require('../dist/core/utils/datetime.utils');

async function testServicesModule() {
  console.log('✂️ Iniciando pruebas del módulo de creación y gestión de tipos de cortes...\n');

  // Limpieza previa de cortes con el mismo nombre para garantizar idempotencia
  store.services = store.services.filter(s => s.name !== 'Taper Fade Moderno & Freestyle');

  // Test 1: Crear nuevo corte personalizado
  console.log('Test 1: Creación de corte por el barbero...');
  const newCut = ServicesService.create({
    name: 'Taper Fade Moderno & Freestyle',
    durationMinutes: 45,
    price: 42000,
    category: 'Corte',
    badge: '🔥 Tendencia',
    description: 'Desvanecido cónico en sienes y cuello, líneas freestyle y peinado mate con textura.',
  });

  assert.ok(newCut.id, 'El corte debe tener un ID asignado');
  assert.strictEqual(newCut.name, 'Taper Fade Moderno & Freestyle');
  assert.strictEqual(newCut.durationMinutes, 45);
  assert.strictEqual(newCut.price, 42000);
  assert.strictEqual(newCut.category, 'Corte');
  assert.strictEqual(newCut.badge, '🔥 Tendencia');
  assert.strictEqual(newCut.isActive, true);
  console.log(`✅ Corte creado exitosamente: "${newCut.name}" ($${newCut.price}, ${newCut.durationMinutes} min, ${newCut.category})`);

  // Test 2: Edición del corte
  console.log('\nTest 2: Edición del corte...');
  const updatedCut = ServicesService.update(newCut.id, {
    price: 45000,
    badge: '⭐ Más Vendido',
  });
  assert.strictEqual(updatedCut.price, 45000);
  assert.strictEqual(updatedCut.badge, '⭐ Más Vendido');
  console.log(`✅ Corte editado exitosamente: Nuevo precio: $${updatedCut.price}, Insignia: ${updatedCut.badge}`);

  // Test 3: Reconocimiento inteligente en WhatsApp NLU
  console.log('\nTest 3: NLU WhatsApp reconoce el nuevo corte creado...');
  const activeServices = ServicesService.getAllActive();
  const matchedService = WhatsAppNLU.matchServiceFromText('hola mateo quiero hacerme un taper fade', activeServices);
  assert.ok(matchedService, 'El bot debe detectar el nuevo corte creado a partir de texto libre');
  assert.strictEqual(matchedService.id, newCut.id);
  console.log(`✅ WhatsApp NLU detectó correctamente el corte "${matchedService.name}" a partir de la frase del cliente.`);

  // Test 4: Disponibilidad para el nuevo corte según su duración (45 min + 10 min buffer = 55 min por slot)
  console.log('\nTest 4: Motor de disponibilidad calcula turnos con la duración personalizada...');
  const barber = store.getPrimaryBarber();
  const tomorrow = DateTimeUtils.getTomorrowDateString();
  const slots = availabilityEngine.calculateSlotsForBarber({
    barber,
    service: updatedCut,
    date: tomorrow,
    schedules: store.schedules,
    blocks: store.blocks,
    existingAppointments: store.appointments,
    slotBufferMinutes: 10,
  });
  assert.ok(slots.length > 0, 'Debe generar slots para el nuevo corte');
  console.log(`✅ Motor de disponibilidad generó ${slots.length} turnos calculados para la duración de ${updatedCut.durationMinutes} min (+10m buffer).`);

  // Test 5: Pausar y reactivar corte (Toggle)
  console.log('\nTest 5: Pausar y reactivar corte...');
  const toggledOff = ServicesService.toggle(newCut.id);
  assert.strictEqual(toggledOff.isActive, false, 'El corte debe quedar pausado');
  const activeAfterPause = ServicesService.getAllActive();
  assert.strictEqual(activeAfterPause.some(s => s.id === newCut.id), false, 'No debe aparecer en cortes activos');

  const toggledOn = ServicesService.toggle(newCut.id);
  assert.strictEqual(toggledOn.isActive, true, 'El corte debe quedar reactivado');
  console.log('✅ Pausa y reactivación del corte verificadas correctamente.');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE CREACIÓN DE CORTES PASARON CON ÉXITO (5/5)!');
}

testServicesModule().catch(err => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
