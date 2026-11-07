"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
exports.optionalAuth = optionalAuth;
const crypto_utils_1 = require("../core/utils/crypto.utils");
function requireAuth(req, res, next) {
    const authHeader = req.headers ? (req.headers['authorization'] || req.headers['Authorization']) : null;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Acceso no autorizado. Se requiere iniciar sesión como barbero o administrador.'
        });
    }
    const token = authHeader.substring(7);
    const payload = crypto_utils_1.CryptoUtils.verifyToken(token);
    if (!payload) {
        return res.status(401).json({
            error: 'Sesión expirada o token inválido. Por favor inicia sesión nuevamente.'
        });
    }
    req.user = payload;
    next();
}
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado. Se requieren permisos exclusivos de Administrador de FAMILIA 1969.'
            });
        }
        next();
    });
}
function optionalAuth(req, res, next) {
    const authHeader = req.headers ? (req.headers['authorization'] || req.headers['Authorization']) : null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = crypto_utils_1.CryptoUtils.verifyToken(token);
        if (payload) {
            req.user = payload;
        }
    }
    next();
}
