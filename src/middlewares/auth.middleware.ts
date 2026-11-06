import { CryptoUtils } from '../core/utils/crypto.utils';

export function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers ? (req.headers['authorization'] || req.headers['Authorization']) : null;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso no autorizado. Se requiere iniciar sesión como barbero o administrador.'
    });
  }

  const token = authHeader.substring(7);
  const payload = CryptoUtils.verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      error: 'Sesión expirada o token inválido. Por favor inicia sesión nuevamente.'
    });
  }

  req.user = payload;
  next();
}

export function optionalAuth(req: any, res: any, next: any) {
  const authHeader = req.headers ? (req.headers['authorization'] || req.headers['Authorization']) : null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = CryptoUtils.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}
