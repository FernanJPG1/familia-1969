import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error-handler';

export function createApp() {
  const app = express();

  // Middlewares estándar
  app.use(cors({ origin: '*' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Archivos estáticos del frontend móvil / PWA
  app.use(express.static(path.join(__dirname, '../public')));

  // Rutas principales del API
  app.use('/api', apiRoutes);

  // Manejador centralizado de errores
  app.use(errorHandler);

  return app;
}

export default createApp;
