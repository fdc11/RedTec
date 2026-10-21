const { Router } = require('express');
const equiposController = require('../controllers/equipos.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { soloAdmin } = require('../middlewares/role.middleware');
const {
  validarIdParam,
  validarCrearEquipo,
  validarActualizarEquipo,
  validarFiltrosEquipos
} = require('../middlewares/validator.middleware');

const router = Router();

/**
 * Rutas de consulta de catálogo:
 * Requieren autenticación con token JWT.
 */
router.get('/', verificarToken, validarFiltrosEquipos, equiposController.listarEquipos);
router.get('/:id', verificarToken, validarIdParam, equiposController.obtenerEquipoPorId);

/**
 * Rutas de administración de inventario:
 * Protegidas por autenticación JWT y rol exclusivo de Administrador.
 */
router.post('/', verificarToken, soloAdmin, validarCrearEquipo, equiposController.crearEquipo);
router.put('/:id', verificarToken, soloAdmin, validarIdParam, validarActualizarEquipo, equiposController.actualizarEquipo);
router.delete('/:id', verificarToken, soloAdmin, validarIdParam, equiposController.eliminarEquipo);

module.exports = router;
