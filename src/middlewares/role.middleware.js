const AppError = require('../utils/AppError');

/**
 * Middleware de Control de Acceso Basado en Roles (RBAC).
 * Garantiza que solo los usuarios con rol 'admin' puedan acceder al recurso.
 * Responde 403 Forbidden si el usuario no tiene los privilegios requeridos.
 */
const soloAdmin = (req, res, next) => {
  if (!req.usuario) {
    return next(new AppError('Autenticación requerida antes de verificar roles.', 401));
  }

  if (req.usuario.rol !== 'admin') {
    return next(
      new AppError('Acceso denegado: Se requieren privilegios de Administrador para realizar esta acción.', 403)
    );
  }

  next();
};

module.exports = {
  soloAdmin
};
