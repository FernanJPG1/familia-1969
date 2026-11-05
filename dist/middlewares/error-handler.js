"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const app_error_1 = require("../core/errors/app-error");
function errorHandler(err, req, res, next) {
    const statusCode = err instanceof app_error_1.AppError ? err.statusCode : 500;
    const message = err.message || 'Error interno del servidor';
    console.error(`[Error] ${req.method} ${req.url} - ${statusCode}: ${message}`);
    if (err.stack && statusCode === 500) {
        console.error(err.stack);
    }
    res.status(statusCode).json({
        success: false,
        error: message,
        details: err.details || null,
    });
}
exports.default = errorHandler;
