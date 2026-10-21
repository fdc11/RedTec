const { Prestamo } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Middleware para la regla de negocio: Control de Cupo / Límite de Equipos.
 *
 * REGLA DURA:
 * Solo para rol 'usuario'. Cuenta préstamos activos (fechaDevolucionReal === null).
 * Si ya tiene 2 o más, responde 409 Conflict.
 * Los administradores quedan exentos de este límite restrictivo.
 */
const verificarLimite = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return next(new AppError('Usuario no autenticado al evaluar límite de cupo.', 401));
    }

    if (req.usuario.rol === 'usuario') {
      const prestamosActivos = await Prestamo.count({
        where: {
          usuarioId: req.usuario.id,
          fechaDevolucionReal: null
        }
      });

      if (prestamosActivos >= 2) {
        return next(
          new AppError(
            'Límite de préstamos alcanzado: Los usuarios regulares no pueden poseer más de 2 equipos en préstamo simultáneamente.',
            409
          )
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verificarLimite
};
