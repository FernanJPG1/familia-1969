/**
 * Utilidades robustas de Fecha, Hora y Zona Horaria para el motor de disponibilidad y agenda.
 * Elimina discrepancias entre UTC y hora local (por ejemplo America/Bogota UTC-5).
 */

export class DateTimeUtils {
  /**
   * Convierte 'HH:mm' a minutos totales desde la medianoche (ej: '09:30' -> 570)
   */
  public static timeToMinutes(timeStr: string): number {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Convierte minutos totales desde la medianoche a formato 'HH:mm' (ej: 570 -> '09:30')
   */
  public static minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  /**
   * Formatea minutos o string 'HH:mm' a formato 12 horas con AM/PM (ej: '14:30' -> '02:30 PM')
   */
  public static format12h(val: string | number): string {
    const mins = typeof val === 'string' ? this.timeToMinutes(val) : val;
    let hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;

    return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  /**
   * Formatea un rango de tiempo en formato amigable (ej: 540 a 580 -> '09:00 AM - 09:40 AM')
   */
  public static formatTimeRange(startMinutes: number, endMinutes: number): string {
    return `${this.format12h(startMinutes)} - ${this.format12h(endMinutes)}`;
  }

  /**
   * Obtiene el día de la semana de una fecha 'YYYY-MM-DD' (1 = Lunes, 7 = Domingo).
   * Usa aritmética directa para evitar desfases de medianoche UTC/Local.
   */
  public static getDayOfWeek(dateStr: string): number {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Crear Date en mediodía local para evitar cualquier salto de día
    const d = new Date(year, month - 1, day, 12, 0, 0);
    const jsDay = d.getDay(); // 0 = Domingo, 1 = Lunes ... 6 = Sábado
    return jsDay === 0 ? 7 : jsDay;
  }

  /**
   * Combina 'YYYY-MM-DD' y 'HH:mm' en una fecha estándar Date y un ISO String limpio.
   */
  public static buildDateTime(dateStr: string, timeStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }

  /**
   * Extrae la fecha ('YYYY-MM-DD') y hora ('HH:mm') de una Date o string ISO,
   * respetando los componentes locales.
   */
  public static extractDateAndTime(dateOrIso: Date | string): {
    dateStr: string;
    timeStr: string;
    totalMinutes: number;
    hours: number;
    minutes: number;
  } {
    const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = d.getHours();
    const minutes = d.getMinutes();

    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const totalMinutes = hours * 60 + minutes;

    return { dateStr, timeStr, totalMinutes, hours, minutes };
  }

  /**
   * Devuelve la fecha de hoy en formato 'YYYY-MM-DD'
   */
  public static getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Devuelve la fecha de mañana en formato 'YYYY-MM-DD'
   */
  public static getTomorrowDateString(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Devuelve la fecha de pasado mañana en formato 'YYYY-MM-DD'
   */
  public static getDayAfterTomorrowDateString(): string {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Valida si un intervalo de tiempo se solapa con otro
   */
  public static isOverlapping(
    startA: number,
    endA: number,
    startB: number,
    endB: number
  ): boolean {
    return startA < endB && endA > startB;
  }

  /**
   * Comprueba si una hora dada para hoy ya pasó
   */
  public static isPastDateTime(dateStr: string, timeStr: string): boolean {
    const today = this.getTodayDateString();
    if (dateStr < today) return true;
    if (dateStr > today) return false;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const targetMins = this.timeToMinutes(timeStr);
    return targetMins <= currentMins;
  }

  /**
   * Intenta parsear una fecha a partir de lenguaje natural (hoy, mañana, días de la semana, etc.)
   */
  public static parseDateFromText(text: string): string | null {
    if (!text) return null;
    const lower = text.toLowerCase();
    
    if (lower.includes('pasado mañana') || lower.includes('pasado manana')) {
      return this.getDayAfterTomorrowDateString();
    }
    if (lower.includes('hoy')) {
      return this.getTodayDateString();
    }
    if (lower.includes('mañana') || lower.includes('manana')) {
      return this.getTomorrowDateString();
    }

    // Días de la semana
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'miércoles', 'jueves', 'viernes', 'sabado', 'sábado'];
    const targetDayIdx = dayNames.findIndex(d => lower.includes(d));
    if (targetDayIdx !== -1) {
      const targetJsDay = targetDayIdx === 4 ? 3 : (targetDayIdx === 8 ? 6 : targetDayIdx);
      const now = new Date();
      const currentJsDay = now.getDay();
      let diff = targetJsDay - currentJsDay;
      if (diff <= 0) diff += 7;
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + diff);
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const isoMatch = text.match(/\b(202[0-9]-[0-1][0-9]-[0-3][0-9])\b/);
    if (isoMatch) return isoMatch[1];

    return null;
  }

  /**
   * Suma días a una fecha 'YYYY-MM-DD' y devuelve el nuevo string 'YYYY-MM-DD'
   */
  public static addDaysToDate(dateStr: string, days: number): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day + days, 12, 0, 0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayN = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayN}`;
  }

  /**
   * Formato legible en español (ej: "Jueves, 5 de Noviembre")
   */
  public static formatDateReadable(dateStr: string): string {
    const dayOfWeek = this.getDayOfWeek(dateStr);
    const [year, month, day] = dateStr.split('-').map(Number);
    const dayNames: Record<number, string> = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${dayNames[dayOfWeek] || ''}, ${day} de ${monthNames[month - 1]}`;
  }
}

export default DateTimeUtils;
