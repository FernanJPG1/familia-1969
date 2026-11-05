"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.BadRequestError = exports.NotFoundError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    details;
    constructor(message, statusCode = 500, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class BadRequestError extends AppError {
    constructor(message = 'Parámetros o datos no válidos', details) {
        super(message, 400, details);
    }
}
exports.BadRequestError = BadRequestError;
class ConflictError extends AppError {
    constructor(message = 'Conflicto: el horario o recurso ya se encuentra ocupado') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
