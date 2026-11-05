import { AppError } from '../core/errors/app-error';

export function errorHandler(err: any, req: any, res: any, next: any) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
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

export default errorHandler;
