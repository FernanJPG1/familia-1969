import { prisma } from './client';

export async function seedDatabase() {
  console.log('🌱 Iniciando Seeding de Barbería SaaS...');

  // 1. Limpiar datos previos si existen (en orden de constraints foráneas)
  await prisma.whatsappSession.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.scheduleBlock.deleteMany();
  await prisma.barberSchedule.deleteMany();
  await prisma.client.deleteMany();
  await prisma.service.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.tenant.deleteMany();

  // 2. Crear Tenant Principal
  const tenant = await prisma.tenant.create({
    data: {
      id: 'tenant-demo-1',
      name: "The Gentleman's Cut Barbershop",
      slug: 'gentlemans-cut',
      phone: '+57 300 987 6543',
      address: 'Calle 85 # 14-25, Zona Rosa, Bogotá',
      timezone: 'America/Bogota',
      slotBufferMinutes: 10,
      isActive: true,
    },
  });
  console.log(`✅ Tenant creado: ${tenant.name} (${tenant.id})`);

  // 3. Crear Barberos con colores distintivos para el Timeline
  const barbersData = [
    {
      id: 'barber-1',
      tenantId: tenant.id,
      name: 'Mateo Silva (Master Barber)',
      phone: '+57 311 111 2233',
      colorTag: '#3B82F6', // Azul
      commissionPercentage: 50.0,
      isActive: true,
    },
    {
      id: 'barber-2',
      tenantId: tenant.id,
      name: 'Carlos Mendoza (Fade Specialist)',
      phone: '+57 322 333 4455',
      colorTag: '#10B981', // Verde Esmeralda
      commissionPercentage: 45.0,
      isActive: true,
    },
    {
      id: 'barber-3',
      tenantId: tenant.id,
      name: 'Andrés Vega (Beard & Rituals)',
      phone: '+57 315 777 8899',
      colorTag: '#F59E0B', // Ámbar / Dorado
      commissionPercentage: 50.0,
      isActive: true,
    },
  ];

  for (const b of barbersData) {
    await prisma.barber.create({ data: b });

    // Crear Horarios de Atención: Lunes a Sábado (1 al 6) de 09:00 a 19:00
    for (let day = 1; day <= 6; day++) {
      await prisma.barberSchedule.create({
        data: {
          barberId: b.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '19:00',
          isActive: true,
        },
      });
    }

    // Bloqueo de almuerzo estándar diario de 13:00 a 14:00 para la semana
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    await prisma.scheduleBlock.create({
      data: {
        barberId: b.id,
        date: dateStr,
        startTime: '13:00',
        endTime: '14:00',
        reason: 'Receso de Almuerzo',
      },
    });
  }
  console.log(`✅ ${barbersData.length} barberos creados con jornadas y descansos.`);

  // 4. Crear Catálogo de Servicios
  const servicesData = [
    {
      id: 'srv-1',
      tenantId: tenant.id,
      name: 'Corte Clásico & Fade Premium',
      durationMinutes: 40,
      price: 35000,
      isActive: true,
    },
    {
      id: 'srv-2',
      tenantId: tenant.id,
      name: 'Ritual de Barba & Toalla Caliente',
      durationMinutes: 30,
      price: 25000,
      isActive: true,
    },
    {
      id: 'srv-3',
      tenantId: tenant.id,
      name: 'Combo VIP: Corte + Barba + Mascarilla',
      durationMinutes: 60,
      price: 55000,
      isActive: true,
    },
    {
      id: 'srv-4',
      tenantId: tenant.id,
      name: 'Perfilado de Cejas & Exfoliación',
      durationMinutes: 20,
      price: 18000,
      isActive: true,
    },
  ];

  for (const s of servicesData) {
    await prisma.service.create({ data: s });
  }
  console.log(`✅ ${servicesData.length} servicios de catálogo creados.`);

  // 5. Crear Clientes de demostración
  const clientsData = [
    {
      id: 'client-1',
      tenantId: tenant.id,
      name: 'David Rincón',
      whatsappPhone: '573001234567',
      totalNoShows: 0,
    },
    {
      id: 'client-2',
      tenantId: tenant.id,
      name: 'Alejandro Morales',
      whatsappPhone: '573109876543',
      totalNoShows: 1, // Ejemplo con historial de no-show
    },
    {
      id: 'client-3',
      tenantId: tenant.id,
      name: 'Camilo Torres',
      whatsappPhone: '573155554433',
      totalNoShows: 0,
    },
  ];

  for (const c of clientsData) {
    await prisma.client.create({ data: c });
  }
  console.log(`✅ ${clientsData.length} clientes creados.`);

  // 6. Crear Citas de Prueba para el día de hoy
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  // Cita 1: Mateo Silva a las 10:00 (duración 40 min -> fin 10:40)
  const start1 = new Date(`${yyyy}-${mm}-${dd}T10:00:00`);
  const end1 = new Date(`${yyyy}-${mm}-${dd}T10:40:00`);

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      barberId: 'barber-1',
      clientId: 'client-1',
      serviceId: 'srv-1',
      startTime: start1,
      endTime: end1,
      totalPrice: 35000,
      status: 'confirmed',
      notes: 'Cliente prefiere degradado alto con tijera arriba',
    },
  });

  // Cita 2: Carlos Mendoza a las 11:00 (Combo VIP 60 min -> fin 12:00)
  const start2 = new Date(`${yyyy}-${mm}-${dd}T11:00:00`);
  const end2 = new Date(`${yyyy}-${mm}-${dd}T12:00:00`);

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      barberId: 'barber-2',
      clientId: 'client-2',
      serviceId: 'srv-3',
      startTime: start2,
      endTime: end2,
      totalPrice: 55000,
      status: 'confirmed',
      notes: 'Recordatorio enviado vía WhatsApp',
    },
  });

  // Cita 3: Andrés Vega a las 15:00 (30 min -> fin 15:30)
  const start3 = new Date(`${yyyy}-${mm}-${dd}T15:00:00`);
  const end3 = new Date(`${yyyy}-${mm}-${dd}T15:30:00`);

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      barberId: 'barber-3',
      clientId: 'client-3',
      serviceId: 'srv-2',
      startTime: start3,
      endTime: end3,
      totalPrice: 25000,
      status: 'pending',
      notes: 'Pendiente de confirmación de última hora',
    },
  });

  console.log('✅ Citas iniciales creadas en el Timeline del Dashboard.');
  console.log('🚀 Base de datos inicializada con éxito.');
}

// Ejecución directa si se invoca con tsx/node
if (require.main === module) {
  seedDatabase()
    .catch((err) => {
      console.error('❌ Error en seed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
