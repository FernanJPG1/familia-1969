export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Parámetros o datos no válidos', details?: any) {
    super(message, 400, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto: el horario o recurso ya se encuentra ocupado') {
    super(message, 409);
  }
}
