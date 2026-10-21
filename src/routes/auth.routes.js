const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarRegistro, validarLogin } = require('../middlewares/validator.middleware');
const AppError = require('../utils/AppError');

const router = Router();

/**
 * Limitador de tasa (Rate Limiting) para rutas de autenticación.
 * Mitiga ataques de fuerza bruta y ataques de diccionario sobre login y registro.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Máximo 20 peticiones por ventana de 15 minutos por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        'Demasiadas solicitudes de autenticación desde esta dirección IP. Por favor, espere 15 minutos e intente nuevamente.',
        429
      )
    );
  }
});

// Rutas de autenticación especificadas en los requisitos
router.post('/register', authLimiter, validarRegistro, authController.register);
router.post('/login', authLimiter, validarLogin, authController.login);
router.get('/me', verificarToken, authController.me);

module.exports = router;
