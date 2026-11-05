"use strict";
/**
 * Utilidades robustas de Fecha, Hora y Zona Horaria para el motor de disponibilidad y agenda.
 * Elimina discrepancias entre UTC y hora local (por ejemplo America/Bogota UTC-5).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateTimeUtils = void 0;
class DateTimeUtils {
    /**
     * Convierte 'HH:mm' a minutos totales desde la medianoche (ej: '09:30' -> 570)
     */
    static timeToMinutes(timeStr) {
        if (!timeStr || !timeStr.includes(':'))
            return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    }
    /**
     * Convierte minutos totales desde la medianoche a formato 'HH:mm' (ej: 570 -> '09:30')
     */
    static minutesToTime(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    /**
     * Formatea minutos o string 'HH:mm' a formato 12 horas con AM/PM (ej: '14:30' -> '02:30 PM')
     */
    static format12h(val) {
        const mins = typeof val === 'string' ? this.timeToMinutes(val) : val;
        let hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        if (hours > 12)
            hours -= 12;
        if (hours === 0)
            hours = 12;
        return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
    }
    /**
     * Formatea un rango de tiempo en formato amigable (ej: 540 a 580 -> '09:00 AM - 09:40 AM')
     */
    static formatTimeRange(startMinutes, endMinutes) {
        return `${this.format12h(startMinutes)} - ${this.format12h(endMinutes)}`;
    }
    /**
     * Obtiene el día de la semana de una fecha 'YYYY-MM-DD' (1 = Lunes, 7 = Domingo).
     * Usa aritmética directa para evitar desfases de medianoche UTC/Local.
     */
    static getDayOfWeek(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        // Crear Date en mediodía local para evitar cualquier salto de día
        const d = new Date(year, month - 1, day, 12, 0, 0);
        const jsDay = d.getDay(); // 0 = Domingo, 1 = Lunes ... 6 = Sábado
        return jsDay === 0 ? 7 : jsDay;
    }
    /**
     * Combina 'YYYY-MM-DD' y 'HH:mm' en una fecha estándar Date y un ISO String limpio.
     */
    static buildDateTime(dateStr, timeStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes, 0, 0);
    }
    /**
     * Extrae la fecha ('YYYY-MM-DD') y hora ('HH:mm') de una Date o string ISO,
     * respetando los componentes locales.
     */
    static extractDateAndTime(dateOrIso) {
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
    static getTodayDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    /**
     * Devuelve la fecha de mañana en formato 'YYYY-MM-DD'
     */
    static getTomorrowDateString() {
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
    static getDayAfterTomorrowDateString() {
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
    static isOverlapping(startA, endA, startB, endB) {
        return startA < endB && endA > startB;
    }
    /**
     * Comprueba si una hora dada para hoy ya pasó
     */
    static isPastDateTime(dateStr, timeStr) {
        const today = this.getTodayDateString();
        if (dateStr < today)
            return true;
        if (dateStr > today)
            return false;
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const targetMins = this.timeToMinutes(timeStr);
        return targetMins <= currentMins;
    }
    /**
     * Intenta parsear una fecha a partir de lenguaje natural (hoy, mañana, días de la semana, etc.)
     */
    static parseDateFromText(text) {
        if (!text)
            return null;
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
            if (diff <= 0)
                diff += 7;
            const targetDate = new Date();
            targetDate.setDate(now.getDate() + diff);
            const y = targetDate.getFullYear();
            const m = String(targetDate.getMonth() + 1).padStart(2, '0');
            const d = String(targetDate.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        const isoMatch = text.match(/\b(202[0-9]-[0-1][0-9]-[0-3][0-9])\b/);
        if (isoMatch)
            return isoMatch[1];
        return null;
    }
    /**
     * Suma días a una fecha 'YYYY-MM-DD' y devuelve el nuevo string 'YYYY-MM-DD'
     */
    static addDaysToDate(dateStr, days) {
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
    static formatDateReadable(dateStr) {
        const dayOfWeek = this.getDayOfWeek(dateStr);
        const [year, month, day] = dateStr.split('-').map(Number);
        const dayNames = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${dayNames[dayOfWeek] || ''}, ${day} de ${monthNames[month - 1]}`;
    }
}
exports.DateTimeUtils = DateTimeUtils;
exports.default = DateTimeUtils;
