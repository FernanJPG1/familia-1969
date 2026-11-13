/**
 * Aplica cabeceras HTTP de seguridad recomendadas (OWASP) sin dependencias externas.
 */
export function securityHeaders(req: any, res: any, next: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '0');

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Crea un middleware de limitación de peticiones (rate limiting) por IP en memoria.
 * Compatible con proxies/serverless de Vercel mediante x-forwarded-for.
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const hits = new Map<string, RateLimitEntry>();
  const { windowMs, maxRequests, message } = options;

  return (req: any, res: any, next: any) => {
    const now = Date.now();

    // Limpieza ocasional para evitar crecimiento ilimitado en memoria
    if (hits.size > 2000) {
      for (const [key, entry] of hits.entries()) {
        if (entry.resetAt <= now) {
          hits.delete(key);
        }
      }
    }

    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
      req.ip ||
      'unknown';

    const existing = hits.get(clientIp);
    if (!existing || existing.resetAt <= now) {
      hits.set(clientIp, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > maxRequests) {
      const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
      return res.status(429).json({
        error:
          message ||
          'Demasiadas solicitudes desde esta dirección IP. Por favor espera unos minutos antes de reintentar.',
      });
    }

    return next();
  };
}
