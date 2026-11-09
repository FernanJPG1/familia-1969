import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fam_1969_super_secure_vault_secret_key_2026';

export class CryptoUtils {
  /**
   * Hashea una contraseña usando scrypt ultra-rápido optimizado para entornos serverless y baja latencia.
   * Formato: v2:salt:hash (o salt:hash para compatibilidad)
   */
  public static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 32, { N: 4096, r: 8, p: 1 });
    return `v2:${salt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Verifica de forma segura (inmune a timing attacks) si la contraseña coincide con el hash.
   * Soporta tanto el formato rápido v2 como el formato legacy.
   */
  public static verifyPassword(password: string, combined: string): boolean {
    if (!combined) return false;

    try {
      if (combined.startsWith('v2:')) {
        const parts = combined.split(':');
        const salt = parts[1];
        const key = parts[2];
        const derivedKey = crypto.scryptSync(password, salt, 32, { N: 4096, r: 8, p: 1 });
        const keyBuffer = Buffer.from(key, 'hex');
        if (keyBuffer.length !== derivedKey.length) return false;
        return crypto.timingSafeEqual(keyBuffer, derivedKey);
      }

      // Legacy fallback
      if (combined.includes(':')) {
        const [salt, key] = combined.split(':');
        const derivedKey = crypto.scryptSync(password, salt, 64);
        const keyBuffer = Buffer.from(key, 'hex');
        if (keyBuffer.length !== derivedKey.length) return false;
        return crypto.timingSafeEqual(keyBuffer, derivedKey);
      }
    } catch {
      return false;
    }

    return false;
  }

  /**
   * Genera un token de sesión firmado con HMAC-SHA256 y expiración.
   */
  public static createToken(payload: Record<string, any>, expiresInHours: number = 72): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Math.floor(Date.now() / 1000) + (expiresInHours * 3600);
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  /**
   * Valida y decodifica un token de sesión. Retorna el payload o null si es inválido o expiró.
   */
  public static verifyToken(token: string): Record<string, any> | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
      if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        return null; // Token expirado
      }
      return payload;
    } catch {
      return null;
    }
  }
}

export default CryptoUtils;
