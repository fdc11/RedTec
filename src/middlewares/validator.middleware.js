const { validationResult, body, param, query } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Middleware de control para evaluar el resultado de las validaciones de express-validator.
 * Si existen errores de validación, interrumpe el flujo y envía un AppError con status 400
 * y el detalle estructurado de cada campo que falló.
 */
const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      campo: err.path || err.param,
      mensaje: err.msg
    }));
    return next(new AppError('Error de validación en los datos de la solicitud.', 400, details));
  }
  next();
};

/**
 * Validación para solicitud de préstamo (POST /api/prestamos).
 * Reglas:
 * - equipoId: entero positivo.
 * - fechaDevolucionEsperada: fecha válida, futura y que no supere MAX_DIAS_PRESTAMO (env, default 30).
 */
const validarPrestamo = [
  body('equipoId')
    .notEmpty().withMessage('El ID del equipo es obligatorio.')
    .isInt({ min: 1 }).withMessage('El ID del equipo debe ser un número entero positivo.'),
  body('fechaDevolucionEsperada')
    .notEmpty().withMessage('La fecha de devolución esperada es obligatoria.')
    .isISO8601().withMessage('La fecha debe tener un formato ISO 8601 válido (ej. 2026-11-20T10:00:00.000Z).')
    .custom((value) => {
      const fecha = new Date(value);
      if (isNaN(fecha.getTime())) {
        throw new Error('Fecha de devolución esperada no es válida.');
      }
      const ahora = new Date();
      if (fecha <= ahora) {
        throw new Error('La fecha de devolución esperada debe ser posterior al momento actual.');
      }

      const maxDias = parseInt(process.env.MAX_DIAS_PRESTAMO, 10) || 30;
      const fechaLimite = new Date(ahora.getTime() + maxDias * 24 * 60 * 60 * 1000);
      if (fecha > fechaLimite) {
        throw new Error(`El plazo máximo permitido para un préstamo es de ${maxDias} días.`);
      }
      return true;
    }),
  validarCampos
];

/**
 * Validación genérica de parámetros de ruta ID (ej. /api/equipos/:id, /api/prestamos/:id/devolver).
 */
const validarIdParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID en la ruta debe ser un número entero positivo.'),
  validarCampos
];

/**
 * Validación para creación de equipos (POST /api/equipos).
 * REGLA DURA: Nadie puede asignar estado 'Prestado' manualmente. Solo 'Disponible' o 'En mantenimiento'.
 */
const validarCrearEquipo = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre del equipo es obligatorio.')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.')
    .escape(),
  body('categoria')
    .trim()
    .notEmpty().withMessage('La categoría del equipo es obligatoria.')
    .isLength({ min: 2, max: 50 }).withMessage('La categoría debe tener entre 2 y 50 caracteres.')
    .escape(),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder los 500 caracteres.')
    .escape(),
  body('estado')
    .optional()
    .custom((val) => {
      if (val === 'Prestado') {
        throw new Error("No está permitido asignar manualmente el estado 'Prestado'. Solo lo hace el flujo de préstamos.");
      }
      if (!['Disponible', 'En mantenimiento'].includes(val)) {
        throw new Error("El estado solo puede ser 'Disponible' o 'En mantenimiento'.");
      }
      return true;
    }),
  validarCampos
];

/**
 * Validación para actualización de equipos (PUT /api/equipos/:id).
 */
const validarActualizarEquipo = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío.')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.')
    .escape(),
  body('categoria')
    .optional()
    .trim()
    .notEmpty().withMessage('La categoría no puede estar vacía.')
    .isLength({ min: 2, max: 50 }).withMessage('La categoría debe tener entre 2 y 50 caracteres.')
    .escape(),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder los 500 caracteres.')
    .escape(),
  body('estado')
    .optional()
    .custom((val) => {
      if (val === 'Prestado') {
        throw new Error("No está permitido asignar manualmente el estado 'Prestado'. Solo lo hace el flujo de préstamos.");
      }
      if (!['Disponible', 'En mantenimiento'].includes(val)) {
        throw new Error("El estado solo puede ser 'Disponible' o 'En mantenimiento'.");
      }
      return true;
    }),
  validarCampos
];

/**
 * Validación para filtros de consulta en catálogo de equipos (GET /api/equipos).
 */
const validarFiltrosEquipos = [
  query('estado')
    .optional()
    .isIn(['Disponible', 'Prestado', 'En mantenimiento'])
    .withMessage("Filtro de estado inválido. Opciones permitidas: 'Disponible', 'Prestado', 'En mantenimiento'."),
  query('categoria')
    .optional()
    .trim()
    .escape(),
  validarCampos
];

/**
 * Validación para registro de nuevos usuarios (POST /api/auth/register).
 */
const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.')
    .escape(),
  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('Debe proporcionar una dirección de correo válida.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  validarCampos
];

/**
 * Validación para inicio de sesión (POST /api/auth/login).
 */
const validarLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('Debe proporcionar un correo electrónico válido.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.'),
  validarCampos
];

module.exports = {
  validarCampos,
  validarPrestamo,
  validarIdParam,
  validarCrearEquipo,
  validarActualizarEquipo,
  validarFiltrosEquipos,
  validarRegistro,
  validarLogin
};
