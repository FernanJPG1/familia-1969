"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtils = void 0;
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || 'fam_1969_super_secure_vault_secret_key_2026';
class CryptoUtils {
    /**
     * Hashea una contraseña usando scrypt ultra-rápido optimizado para entornos serverless y baja latencia.
     * Formato: v2:salt:hash (o salt:hash para compatibilidad)
     */
    static hashPassword(password) {
        const salt = crypto_1.default.randomBytes(16).toString('hex');
        const derivedKey = crypto_1.default.scryptSync(password, salt, 32, { N: 4096, r: 8, p: 1 });
        return `v2:${salt}:${derivedKey.toString('hex')}`;
    }
    /**
     * Verifica de forma segura (inmune a timing attacks) si la contraseña coincide con el hash.
     * Soporta tanto el formato rápido v2 como el formato legacy.
     */
    static verifyPassword(password, combined) {
        if (!combined)
            return false;
        try {
            if (combined.startsWith('v2:')) {
                const parts = combined.split(':');
                const salt = parts[1];
                const key = parts[2];
                const derivedKey = crypto_1.default.scryptSync(password, salt, 32, { N: 4096, r: 8, p: 1 });
                const keyBuffer = Buffer.from(key, 'hex');
                if (keyBuffer.length !== derivedKey.length)
                    return false;
                return crypto_1.default.timingSafeEqual(keyBuffer, derivedKey);
            }
            // Legacy fallback
            if (combined.includes(':')) {
                const [salt, key] = combined.split(':');
                const derivedKey = crypto_1.default.scryptSync(password, salt, 64);
                const keyBuffer = Buffer.from(key, 'hex');
                if (keyBuffer.length !== derivedKey.length)
                    return false;
                return crypto_1.default.timingSafeEqual(keyBuffer, derivedKey);
            }
        }
        catch {
            return false;
        }
        return false;
    }
    /**
     * Genera un token de sesión firmado con HMAC-SHA256 y expiración.
     */
    static createToken(payload, expiresInHours = 72) {
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const exp = Math.floor(Date.now() / 1000) + (expiresInHours * 3600);
        const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
        const signature = crypto_1.default
            .createHmac('sha256', JWT_SECRET)
            .update(`${header}.${body}`)
            .digest('base64url');
        return `${header}.${body}.${signature}`;
    }
    /**
     * Valida y decodifica un token de sesión. Retorna el payload o null si es inválido o expiró.
     */
    static verifyToken(token) {
        if (!token || typeof token !== 'string')
            return null;
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const [header, body, signature] = parts;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', JWT_SECRET)
            .update(`${header}.${body}`)
            .digest('base64url');
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSignature);
        if (sigBuf.length !== expBuf.length || !crypto_1.default.timingSafeEqual(sigBuf, expBuf)) {
            return null;
        }
        try {
            const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
            if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
                return null; // Token expirado
            }
            return payload;
        }
        catch {
            return null;
        }
    }
}
exports.CryptoUtils = CryptoUtils;
exports.default = CryptoUtils;
