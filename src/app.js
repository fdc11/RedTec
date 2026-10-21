require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth.routes');
const equiposRoutes = require('./routes/equipos.routes');
const prestamosRoutes = require('./routes/prestamos.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Seguridad Defensiva con Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net'
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com'
        ],
        fontSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com']
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Configuración de CORS Restringido
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir solicitudes sin origin (como aplicaciones móviles, Postman o curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Bloqueado por política de CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Parseo de cuerpo de solicitudes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir la interfaz web estática de prototipo
app.use(express.static(path.join(__dirname, '..', 'public')));

// Estado de salud de la API
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    servicio: 'RedTec API REST',
    version: '1.0.0',
    estado: 'Operativo',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/prestamos', prestamosRoutes);

// Manejador para rutas no encontradas (404)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    ok: false,
    error: `Endpoint '${req.originalUrl}' no encontrado en la API de RedTec.`
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    ok: false,
    error: err.message || 'Error interno del servidor'
  });
});

// Inicio del servidor y verificación de conexión a MySQL
if (require.main === module) {
  sequelize
    .authenticate()
    .then(() => {
      console.log('✅ Conexión a la base de datos MySQL/MariaDB establecida correctamente.');
      app.listen(PORT, () => {
        console.log(`🚀 Servidor RedTec ejecutándose en: http://localhost:${PORT}`);
        console.log(`🌐 Interfaz web disponible en: http://localhost:${PORT}/`);
      });
    })
    .catch((err) => {
      console.error('❌ Error al conectar a la base de datos MySQL:', err);
      process.exit(1);
    });
}

module.exports = app;
