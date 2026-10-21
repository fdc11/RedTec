const { Router } = require('express');
const prestamosController = require('../controllers/prestamos.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { verificarMora } = require('../middlewares/mora.middleware');
const { verificarLimite } = require('../middlewares/limite.middleware');
const { validarPrestamo, validarIdParam } = require('../middlewares/validator.middleware');

const router = Router();

/**
 * CADENA DE MIDDLEWARES EN POST /api/prestamos (ORDEN EXACTO OBLIGATORIO):
 * 1. verificarToken: valida JWT, verifica expiración y deja req.usuario en la petición.
 * 2. validarPrestamo (express-validator): equipoId entero positivo; fechaDevolucionEsperada válida, futura y máximo MAX_DIAS_PRESTAMO.
 * 3. verificarMora: Prestamo.count donde usuarioId = req.usuario.id, fechaDevolucionReal null y fechaDevolucionEsperada < ahora. Responde 403.
 * 4. verificarLimite: solo para rol 'usuario'. Cuenta préstamos activos; si ya tiene 2, responde 409.
 * 5. Controlador (solicitarPrestamo): transacción pesimista con bloqueo de fila en Usuario y Equipo, revalidación de cupo y cambio atómico a 'Prestado'.
 */
router.post(
  '/',
  verificarToken,
  validarPrestamo,
  verificarMora,
  verificarLimite,
  prestamosController.solicitarPrestamo
);

/**
 * Registrar devolución de préstamo (PUT /api/prestamos/:id/devolver):
 * Accesible solo para el usuario dueño del préstamo o un Administrador.
 * Transacción con bloqueo de fila: si ya estaba devuelto responde 409 Conflict.
 */
router.put(
  '/:id/devolver',
  verificarToken,
  validarIdParam,
  prestamosController.devolverPrestamo
);

/**
 * Listar préstamos (GET /api/prestamos):
 * Si es Administrador ve todos los préstamos del centro; si es Usuario común ve únicamente los suyos.
 */
router.get(
  '/',
  verificarToken,
  prestamosController.listarPrestamos
);

module.exports = router;
