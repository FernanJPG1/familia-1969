/**
 * Módulo NLU (Comprensión de Lenguaje Natural) para el Asistente WhatsApp de la Barbería.
 * Procesa intenciones, normaliza texto e identifica consultas frecuentes con calidez humana.
 */

export type WhatsAppIntent = 
  | 'GREETING'
  | 'LOCATION'
  | 'PRICES'
  | 'SCHEDULE'
  | 'TALK_HUMAN'
  | 'BOOK_INTENT'
  | 'TODAY_AVAILABILITY'
  | 'TOMORROW_AVAILABILITY'
  | 'OTHER_DATE'
  | 'CLIENT_ARRIVED'
  | 'CANCEL_INTENT'
  | 'GRATITUDE'
  | 'AFFIRMATION'
  | 'UNKNOWN';

export class WhatsAppNLU {
  /**
   * Normaliza texto: minúsculas, sin acentos/diacríticos y sin signos de puntuación innecesarios
   */
  public static normalize(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿?¡!,.]/g, '')
      .trim();
  }

  /**
   * Clasifica la intención general del mensaje del cliente con soporte para cortesía y dinamismo
   */
  public static detectIntent(rawText: string, actionId?: string): WhatsAppIntent {
    const action = (actionId || '').toUpperCase();
    const text = this.normalize(rawText);

    if (action === 'INTENT_BOOK' || action === 'RESTART') return 'BOOK_INTENT';
    if (action === 'INTENT_PRICES') return 'PRICES';
    if (action === 'INTENT_TALK_HUMAN') return 'TALK_HUMAN';
    if (action === 'INTENT_BOOK_TODAY') return 'TODAY_AVAILABILITY';
    if (action === 'INTENT_BOOK_TOMORROW') return 'TOMORROW_AVAILABILITY';
    if (action === 'DATE_PICKER' || action === 'INTENT_OTHER_DATE') return 'OTHER_DATE';
    if (action === 'CLIENT_ARRIVED' || action === 'CONFIRM_ARRIVED') return 'CLIENT_ARRIVED';

    // 0. Notificación de llegada del cliente al local (Check-in)
    if (
      text.includes('ya llegue') ||
      text.includes('llegue') ||
      text.includes('estoy aca') ||
      text.includes('estoy aqui') ||
      text.includes('estoy en la sala') ||
      text.includes('estoy en la barberia') ||
      text.includes('ya estoy aca') ||
      text.includes('ya estoy aqui') ||
      text.includes('llegue al local') ||
      text.includes('estoy afuera')
    ) {
      return 'CLIENT_ARRIVED';
    }

    // 1. Agradecimiento y Cortesía
    if (
      text.includes('gracias') ||
      text.includes('muchas gracias') ||
      text.includes('mil gracias') ||
      text.includes('agradezco') ||
      text.includes('muy amable') ||
      text.includes('te lo agradezco')
    ) {
      return 'GRATITUDE';
    }

    // 2. Afirmación / Confirmación coloquial
    if (
      text === 'ok' ||
      text === 'vale' ||
      text === 'listo' ||
      text === 'perfecto' ||
      text === 'dale' ||
      text === 'entendido' ||
      text === 'claro' ||
      text === 'de una' ||
      text === 'excelente' ||
      text === 'super' ||
      text === 'genial'
    ) {
      return 'AFFIRMATION';
    }

    // 3. Hablar con humano / barbero
    if (
      text.includes('humano') || 
      text.includes('persona') || 
      text.includes('hablar con mateo') || 
      text.includes('hablar con alguien') ||
      text.includes('asesor') ||
      text.includes('contacto')
    ) {
      return 'TALK_HUMAN';
    }

    // 4. Ubicación / Dirección / Parqueadero
    if (
      text.includes('donde') ||
      text.includes('ubicacion') ||
      text.includes('direccion') ||
      text.includes('queda') ||
      text.includes('como llegar') ||
      text.includes('donde estan') ||
      text.includes('parqueadero') ||
      text.includes('parqueo') ||
      text.includes('estacionamiento')
    ) {
      return 'LOCATION';
    }

    // 5. Precios / Tarifas / Catálogo
    if (
      text.includes('precio') ||
      text.includes('cuanto vale') ||
      text.includes('cuanto cuesta') ||
      text.includes('costo') ||
      text.includes('tarifas') ||
      text.includes('catalogo') ||
      text.includes('cuanto cobran')
    ) {
      return 'PRICES';
    }

    // 6. Horarios de atención
    if (
      text.includes('horario') ||
      text.includes('a que hora') ||
      text.includes('abren') ||
      text.includes('cierran') ||
      text.includes('atienden') ||
      text.includes('dias atienden') ||
      text.includes('jornada')
    ) {
      return 'SCHEDULE';
    }

    // 7. Disponibilidad inmediata para hoy
    if (text.includes('hoy') && (text.includes('espacio') || text.includes('turno') || text.includes('cita') || text.includes('tarde') || text.includes('cupo'))) {
      return 'TODAY_AVAILABILITY';
    }

    // 8. Disponibilidad para mañana
    if (text.includes('manana') && (text.includes('espacio') || text.includes('turno') || text.includes('cita') || text.includes('cupo'))) {
      return 'TOMORROW_AVAILABILITY';
    }

    // 8b. Otra fecha / desplegar calendario
    if (
      text.includes('otra fecha') ||
      text.includes('otro dia') ||
      text.includes('calendario') ||
      text.includes('ver calendario') ||
      text.includes('mas fechas') ||
      text.includes('despues')
    ) {
      return 'OTHER_DATE';
    }

    // 9. Intención de Agendar
    if (
      text.includes('agendar') ||
      text.includes('apartar') ||
      text.includes('separar') ||
      text.includes('reservar') ||
      text.includes('quiero cita') ||
      text.includes('quiero un corte') ||
      text.includes('turno')
    ) {
      return 'BOOK_INTENT';
    }

    // 10. Saludos y reinicio
    if (
      text === 'hola' ||
      text === 'buenas' ||
      text.startsWith('hola ') ||
      text === 'buenos dias' ||
      text === 'buenas tardes' ||
      text === 'buenas noches' ||
      text === 'menu' ||
      text === 'reiniciar' ||
      text === 'empezar' ||
      text === 'inicio' ||
      text === 'hey' ||
      text === 'que tal'
    ) {
      return 'GREETING';
    }

    return 'UNKNOWN';
  }

  /**
   * Intenta extraer el servicio que el cliente menciona en texto libre
   * Ej: "quiero corte y barba", "hazme un fade", "cuanto sale el ritual", "tienes mullet"
   */
  public static matchServiceFromText(rawText: string, services: any[]): any | null {
    const text = this.normalize(rawText);
    if (!text) return null;

    // 1. Coincidencia exacta o si el texto contiene el nombre completo del corte
    for (const s of services) {
      if (!s.isActive) continue;
      const sNameNorm = this.normalize(s.name);
      if (text.includes(sNameNorm)) return s;
    }

    // 2. Coincidencia por intenciones compuestas (ej: Combo / Corte + Barba / VIP)
    if (text.includes('combo') || (text.includes('corte') && text.includes('barba')) || text.includes('vip')) {
      const combo = services.find(
        (s) => s.isActive && (this.normalize(s.name).includes('combo') || this.normalize(s.name).includes('vip') || s.category === 'Combo')
      );
      if (combo) return combo;
    }

    // Barba sola
    if (text.includes('barba') && !text.includes('corte')) {
      const barba = services.find(
        (s) => s.isActive && (this.normalize(s.name).includes('barba') || s.category === 'Barba')
      );
      if (barba) return barba;
    }

    // Cejas o exfoliación
    if (text.includes('cejas') || text.includes('exfolia')) {
      const cejas = services.find(
        (s) => s.isActive && (this.normalize(s.name).includes('cejas') || this.normalize(s.name).includes('exfolia'))
      );
      if (cejas) return cejas;
    }

    // 3. Puntuación por coincidencia de tokens relevantes (Scoring NLU)
    const stopWords = new Set(['para', 'como', 'este', 'esta', 'todo', 'bien', 'hola', 'solo', 'quiero', 'cuanto', 'vale', 'cuesta', 'tiene', 'hacerme', 'agendar']);
    let bestService: any = null;
    let maxScore = 0;

    for (const s of services) {
      if (!s.isActive) continue;
      const tokens = this.normalize(s.name)
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !stopWords.has(w));

      let score = 0;
      for (const tok of tokens) {
        if (text.includes(tok)) {
          score += tok.length >= 5 ? 2 : 1; // Palabras más largas y específicas otorgan más peso
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestService = s;
      }
    }

    if (maxScore > 0) {
      return bestService;
    }

    return null;
  }
}

export default WhatsAppNLU;
