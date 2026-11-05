import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error-handler';

export function createApp() {
  const app = express();

  // Middlewares estándar
  app.use(cors({ origin: '*' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Redirección inmediata a index.html en raíz
  app.get('/', (req, res) => {
    return res.redirect(302, '/index.html');
  });

  // Archivos estáticos del frontend móvil / PWA
  const publicDir = path.join(__dirname, '../public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }
  const assetsDir = path.join(__dirname, '../assets');
  if (fs.existsSync(assetsDir)) {
    app.use('/assets', express.static(assetsDir));
  }

  // Rutas principales del API
  app.use('/api', apiRoutes);

  // Fallback para 404
  app.use((req, res) => {
    res.redirect(302, '/index.html');
  });

  // Manejador centralizado de errores
  app.use(errorHandler);

  return app;
}

export default createApp;
