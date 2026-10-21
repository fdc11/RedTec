const { validationResult, body, param, query } = require('express-validator');

/**
 * Middleware genérico para verificar el resultado de las validaciones de express-validator
 */
const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      error: 'Error de validación en los datos enviados',
      errores: errors.array().map((err) => ({
        campo: err.path || err.param,
        mensaje: err.msg
      }))
    });
  }
  next();
};

/**
 * Reglas de validación para el registro de usuarios
 */
const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .escape(),
  body('email')
    .trim()
    .isEmail().withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  validarCampos
];

/**
 * Reglas de validación para el login
 */
const validarLogin = [
  body('email')
    .trim()
    .isEmail().withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
  validarCampos
];

/**
 * Reglas de validación para crear/actualizar equipos
 */
const validarEquipo = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre del equipo es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .escape(),
  body('categoria')
    .trim()
    .notEmpty().withMessage('La categoría es obligatoria')
    .escape(),
  body('estado')
    .optional()
    .isIn(['Disponible', 'Prestado', 'En mantenimiento'])
    .withMessage('El estado debe ser: Disponible, Prestado o En mantenimiento'),
  validarCampos
];

/**
 * Reglas de validación para solicitar préstamo
 */
const validarSolicitudPrestamo = [
  body('equipoId')
    .isInt({ min: 1 }).withMessage('El ID del equipo debe ser un entero positivo'),
  body('fechaDevolucionEsperada')
    .notEmpty().withMessage('La fecha de devolución esperada es obligatoria')
    .isISO8601().withMessage('La fecha debe tener un formato ISO 8601 válido (ej. YYYY-MM-DD)')
    .custom((value) => {
      const fecha = new Date(value);
      if (isNaN(fecha.getTime())) {
        throw new Error('Fecha inválida');
      }
      if (fecha <= new Date()) {
        throw new Error('La fecha de devolución esperada debe ser en el futuro');
      }
      return true;
    }),
  validarCampos
];

module.exports = {
  validarCampos,
  validarRegistro,
  validarLogin,
  validarEquipo,
  validarSolicitudPrestamo
};
