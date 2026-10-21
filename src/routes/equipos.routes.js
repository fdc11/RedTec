const { Router } = require('express');
const equiposController = require('../controllers/equipos.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { soloAdmin } = require('../middlewares/role.middleware');
const { validarEquipo } = require('../middlewares/validator.middleware');

const router = Router();

// Rutas de lectura (públicas o accesibles a usuarios autenticados)
router.get('/', equiposController.listarEquipos);
router.get('/:id', equiposController.obtenerEquipoPorId);

// Rutas administrativas protegidas por JWT y RBAC (soloAdmin)
router.post('/', authMiddleware, soloAdmin, validarEquipo, equiposController.crearEquipo);
router.put('/:id', authMiddleware, soloAdmin, validarEquipo, equiposController.actualizarEquipo);
router.delete('/:id', authMiddleware, soloAdmin, equiposController.eliminarEquipo);

module.exports = router;
