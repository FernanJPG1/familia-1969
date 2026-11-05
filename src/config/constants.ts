export const APP_CONSTANTS = {
  TIMEZONE: 'America/Bogota',
  DEFAULT_SLOT_BUFFER_MINUTES: 10,
  DEFAULT_WORK_START: '09:00',
  DEFAULT_WORK_END: '19:00',
  DEFAULT_LUNCH_START: '13:00',
  DEFAULT_LUNCH_END: '14:00',
  
  // Días de la semana estándar (1 = Lunes, 7 = Domingo)
  DAY_NAMES: {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo',
  } as Record<number, string>,

  DAY_NAMES_SHORT: {
    1: 'Lun',
    2: 'Mar',
    3: 'Mié',
    4: 'Jue',
    5: 'Vie',
    6: 'Sáb',
    7: 'Dom',
  } as Record<number, string>,

  STATUS_COLORS: {
    confirmed: '#34D399',
    pending: '#FBBF24',
    completed: '#60A5FA',
    cancelled: '#9CA3AF',
    no_show: '#F87171',
  },
};

export default APP_CONSTANTS;
