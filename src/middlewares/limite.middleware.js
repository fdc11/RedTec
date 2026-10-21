const { Prestamo } = require('../models');

/**
 * Middleware de Control de Cupo / Límite de Equipos:
 * Verifica que un usuario común no posea más de 2 equipos prestados simultáneamente.
 */
module.exports = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        error: 'Usuario no autenticado'
      });
    }

    // Los administradores pueden gestionar sin el límite de 2 equipos si lo requieren,
    // pero para usuarios regulares se aplica estrictamente el límite de 2 préstamos activos.
    if (req.usuario.rol === 'usuario') {
      const prestamosActivos = await Prestamo.count({
        where: {
          usuarioId: req.usuario.id,
          fechaDevolucionReal: null
        }
      });

      if (prestamosActivos >= 2) {
        return res.status(400).json({
          ok: false,
          error: 'Límite de préstamos alcanzado: Un usuario no puede tener más de 2 equipos prestados simultáneamente.',
          prestamosActivos,
          limiteMaximo: 2
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error en middleware de límite:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al verificar el límite de préstamos del usuario.'
    });
  }
};
