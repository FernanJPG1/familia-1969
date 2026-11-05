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

  // Ruta raíz para servir index.html directamente en Vercel
  app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, '../public/index.html');
    const rootHtmlPath = path.join(__dirname, '../index.html');
    if (fs.existsSync(htmlPath)) {
      return res.sendFile(htmlPath);
    } else if (fs.existsSync(rootHtmlPath)) {
      return res.sendFile(rootHtmlPath);
    }
    res.status(200).send('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/index.html"></head><body>FAMILIA 1969</body></html>');
  });

  // Manejador centralizado de errores
  app.use(errorHandler);

  return app;
}

export default createApp;
