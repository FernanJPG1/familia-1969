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

export function requireAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado. Se requieren permisos exclusivos de Administrador de FAMILIA 1969.'
      });
    }
    next();
  });
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
