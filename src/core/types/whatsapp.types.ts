export type WhatsAppStep = 
  | 'IDLE'
  | 'AWAITING_SERVICE'
  | 'AWAITING_DATE'
  | 'AWAITING_SLOT'
  | 'AWAITING_NAME'
  | 'CONFIRMED';

export interface WhatsAppBookingContext {
  serviceId?: string;
  serviceName?: string;
  servicePrice?: number;
  serviceDuration?: number;
  barberId?: string;
  barberName?: string;
  date?: string; // YYYY-MM-DD
  slotStartTime?: string; // ISO string
  slotEndTime?: string;   // ISO string
  slotFormattedTime?: string; // e.g. "10:00 AM - 10:40 AM"
  clientName?: string;
  clientId?: string;
}

export interface WhatsAppButton {
  id: string;
  title: string;
}

export interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListRow[];
}

export interface WhatsAppCalendarPicker {
  minDate: string; // YYYY-MM-DD
  maxDate: string; // YYYY-MM-DD
  activeDays: number[]; // 1 = Lunes ... 7 = Domingo
  restDays: number[];   // e.g. [7]
  restDayNames: string; // e.g. "Domingos"
  barberName: string;
}

export interface WhatsAppIncomingMessage {
  from: string;
  type: 'text' | 'interactive_button' | 'interactive_list';
  text?: string;
  buttonId?: string;
  listId?: string;
}

export interface WhatsAppOutgoingMessage {
  to: string;
  type: 'text' | 'interactive_buttons' | 'interactive_list';
  header?: string;
  body: string;
  footer?: string;
  buttons?: WhatsAppButton[];
  sections?: WhatsAppListSection[];
  calendarPicker?: WhatsAppCalendarPicker;
}

export interface WhatsAppSession {
  id: string;
  tenantId: string;
  whatsappPhone: string;
  currentStep: WhatsAppStep;
  contextData: WhatsAppBookingContext;
  lastInteractionAt: Date;
  expiresAt: Date;
}
