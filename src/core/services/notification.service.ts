import { env } from '../../config/env';

export interface VerificationDispatchResult {
  emailSent: boolean;
  whatsappSent: boolean;
}

/**
 * Servicio centralizado para envío real de códigos de verificación
 * por correo (Resend API) y WhatsApp (Meta Cloud API).
 */
export class NotificationService {
  /**
   * Envía un código de 6 dígitos por correo usando Resend si RESEND_API_KEY está configurado.
   */
  public static async sendVerificationEmail(
    toEmail: string,
    name: string,
    code: string
  ): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'FAMILIA 1969 <onboarding@resend.dev>';
    if (!apiKey) return false;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: 'Tu código de verificación - FAMILIA 1969 Barber Club',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #0B1120; color: #F8FAFC; border-radius: 12px;">
              <h2 style="color: #38BDF8; margin-top: 0;">FAMILIA 1969 • Verificación de Barbero</h2>
              <p>Hola <strong>${name}</strong>,</p>
              <p>Usa el siguiente código de 6 dígitos para verificar tu correo electrónico (expira en 15 minutos):</p>
              <div style="font-size: 28px; font-weight: 900; letter-spacing: 6px; text-align: center; padding: 16px; background: #1E293B; border-radius: 8px; color: #FBBF24; margin: 16px 0;">
                ${code}
              </div>
              <p style="font-size: 12px; color: #94A3B8;">Si no solicitaste esta cuenta, puedes ignorar este mensaje.</p>
            </div>
          `,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('[NotificationService] Error enviando email con Resend:', err);
      return false;
    }
  }

  /**
   * Envía un código de verificación por WhatsApp usando Meta Cloud API si las credenciales reales están configuradas.
   */
  public static async sendVerificationWhatsApp(
    toPhoneDigits: string,
    name: string,
    code: string
  ): Promise<boolean> {
    const token = env.META_WA_ACCESS_TOKEN;
    const phoneNumberId = env.META_WA_PHONE_NUMBER_ID;

    if (
      !token ||
      !phoneNumberId ||
      token.startsWith('mock_') ||
      token.includes('TU_TOKEN_AQUI') ||
      phoneNumberId === '100000000000001' ||
      phoneNumberId === '109876543210'
    ) {
      return false;
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: toPhoneDigits,
            type: 'text',
            text: {
              body: `💈 *FAMILIA 1969*\nHola ${name}, tu código de verificación de WhatsApp es: *${code}*\n(Válido por 15 minutos).`,
            },
          }),
        }
      );
      return res.ok;
    } catch (err) {
      console.error('[NotificationService] Error enviando WhatsApp Cloud API:', err);
      return false;
    }
  }

  /**
   * Despacha la verificación por ambos canales en paralelo.
   */
  public static async dispatchVerificationCodes(params: {
    email: string;
    phoneDigits: string;
    name: string;
    emailCode: string;
    phoneCode: string;
  }): Promise<VerificationDispatchResult> {
    const [emailSent, whatsappSent] = await Promise.all([
      this.sendVerificationEmail(params.email, params.name, params.emailCode),
      this.sendVerificationWhatsApp(params.phoneDigits, params.name, params.phoneCode),
    ]);

    return { emailSent, whatsappSent };
  }
}
