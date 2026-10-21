const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validarRegistro, validarLogin } = require('../middlewares/validator.middleware');

const router = Router();

// Limitador de peticiones para mitigar ataques de fuerza bruta en autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 intentos por IP
  message: {
    ok: false,
    error: 'Demasiadas solicitudes de autenticación desde esta IP. Por favor intente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/registro', authLimiter, validarRegistro, authController.registro);
router.post('/login', authLimiter, validarLogin, authController.login);
router.get('/perfil', authMiddleware, authController.perfil);

module.exports = router;
