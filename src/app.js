require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const equiposRoutes = require('./routes/equipos.routes');
const prestamosRoutes = require('./routes/prestamos.routes');
const AppError = require('./utils/AppError');

const app = express();

// ===================================================================
// SEGURIDAD DEFENSIVA: HELMET Y CONTENT SECURITY POLICY (CSP)
// REGLA DURA: Permite Bootstrap desde cdn.jsdelivr.net y PROHÍBE scripts inline.
// Incluye Google Fonts en estilos y fuentes.
// ===================================================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://cdn.jsdelivr.net'
        ],
        styleSrc: [
          "'self'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com'
        ],
        fontSrc: [
          "'self'",
          'https://cdn.jsdelivr.net',
          'https://fonts.gstatic.com'
        ],
        imgSrc: [
          "'self'",
          'data:'
        ]
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// ===================================================================
// SEGURIDAD DEFENSIVA: CORS CON LISTA BLANCA DESDE CORS_ORIGINS
// ===================================================================
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite peticiones sin origen (como Postman, curl o aplicaciones móviles nativas)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new AppError(`Acceso denegado por política de CORS para el origen: ${origin}`, 403)
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ===================================================================
// PARSEO DE PETICIONES CON LÍMITE ESTRICTO DE 10KB
// Mitiga ataques de denegación de servicio (DoS) por sobrecarga de carga útil (payload).
// ===================================================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Servidor de archivos estáticos para la interfaz de usuario en public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// Estado de salud básico
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    data: {
      servicio: 'RedTec API REST',
      version: '1.0.0',
      estado: 'Operativo',
      timestamp: new Date().toISOString()
    }
  });
});

// ===================================================================
// ENRUTADOR PRINCIPAL DE LA API
// ===================================================================
app.use('/api/auth', authRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/prestamos', prestamosRoutes);

// Manejador de rutas no encontradas en el prefijo /api/
app.all('/api/*', (req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
});

// ===================================================================
// MIDDLEWARE CENTRAL DE GESTIÓN DE ERRORES
// REGLA DURA:
// Formato uniforme: { ok: false, error: { message, details? } }
// Sin stack de error en entorno de producción.
// ===================================================================
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  const errorResponse = {
    message: err.message || 'Error interno del servidor.'
  };

  if (err.details) {
    errorResponse.details = err.details;
  }

  // En desarrollo se expone el stack para diagnóstico; en producción se oculta estrictamente
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    errorResponse.stack = err.stack;
  }

  return res.status(statusCode).json({
    ok: false,
    error: errorResponse
  });
});

module.exports = app;
