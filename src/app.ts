import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error-handler';
import { securityHeaders } from './middlewares/security.middleware';

export function createApp() {
  const app = express();

  // Seguridad y configuración para proxy inverso (Vercel)
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(securityHeaders);

  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir peticiones del mismo origen (sin header Origin), localhost en dev, o dominios autorizados
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0) {
          const isLocalOrVercel =
            origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1') ||
            origin.endsWith('.vercel.app');
          return callback(null, isLocalOrVercel);
        }
        return callback(null, allowedOrigins.includes(origin));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
