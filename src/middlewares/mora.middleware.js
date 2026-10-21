const { Op } = require('sequelize');
const { Prestamo } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Middleware para la regla de negocio: Verificar Estado de Mora.
 *
 * REGLA DURA:
 * Prestamo.count donde usuarioId = req.usuario.id, fechaDevolucionReal null
 * y fechaDevolucionEsperada < ahora (Op.lt).
 * Si count > 0 responde 403 Forbidden con mensaje claro. Aplica a todos los roles.
 *
 * Aprovecha el índice compuesto (usuarioId, fechaDevolucionReal) para máxima eficiencia.
 */
const verificarMora = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return next(new AppError('Usuario no autenticado al evaluar mora.', 401));
    }

    const ahora = new Date();

    const cantidadEnMora = await Prestamo.count({
      where: {
        usuarioId: req.usuario.id,
        fechaDevolucionReal: null,
        fechaDevolucionEsperada: {
          [Op.lt]: ahora
        }
      }
    });

    if (cantidadEnMora > 0) {
      return next(
        new AppError(
          'Sanción por mora activa: Posee préstamos con fecha de devolución vencida sin entregar. Debe regularizar su estado antes de solicitar un nuevo equipo.',
          403
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verificarMora
};
