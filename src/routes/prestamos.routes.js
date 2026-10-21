const { Router } = require('express');
const prestamosController = require('../controllers/prestamos.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const moraMiddleware = require('../middlewares/mora.middleware');
const limiteMiddleware = require('../middlewares/limite.middleware');
const { soloAdmin } = require('../middlewares/role.middleware');
const { validarSolicitudPrestamo } = require('../middlewares/validator.middleware');

const router = Router();

/**
 * Cadena de middlewares requerida por la lógica de negocio para crear préstamos:
 * 1. authMiddleware: ¿quién eres?
 * 2. validarSolicitudPrestamo: ¿los datos vienen bien y fecha a futuro?
 * 3. moraMiddleware: ¿tienes préstamos vencidos? -> 403 Forbidden
 * 4. limiteMiddleware: ¿ya tienes 2 equipos prestados? -> 400 Bad Request
 * 5. prestamosController.solicitarPrestamo: transacción y bloqueo pesimista
 */
router.post(
  '/',
  authMiddleware,
  validarSolicitudPrestamo,
  moraMiddleware,
  limiteMiddleware,
  prestamosController.solicitarPrestamo
);

// Registrar devolución
router.put('/:id/devolver', authMiddleware, prestamosController.devolverPrestamo);

// Consultar préstamos propios del usuario
router.get('/mis-prestamos', authMiddleware, prestamosController.listarMisPrestamos);

// Consultar todos los préstamos del centro (Solo Administrador)
router.get('/', authMiddleware, soloAdmin, prestamosController.listarTodosPrestamos);

module.exports = router;
