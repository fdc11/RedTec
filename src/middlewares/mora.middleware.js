const { Op } = require('sequelize');
const { Prestamo, Equipo } = require('../models');

/**
 * Middleware de Sanción Automática:
 * Verifica en tiempo real si el usuario tiene préstamos vencidos no devueltos.
 * En caso afirmativo, deniega la solicitud inmediatamente con código HTTP 403 Forbidden.
 */
module.exports = async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        error: 'Usuario no autenticado'
      });
    }

    const ahora = new Date();

    const prestamosVencidos = await Prestamo.findAll({
      where: {
        usuarioId: req.usuario.id,
        fechaDevolucionReal: null,
        fechaDevolucionEsperada: {
          [Op.lt]: ahora
        }
      },
      include: [
        {
          model: Equipo,
          as: 'equipo',
          attributes: ['id', 'nombre', 'categoria']
        }
      ]
    });

    if (prestamosVencidos.length > 0) {
      return res.status(403).json({
        ok: false,
        error: 'Sanción automática activa: Tienes préstamos con fecha de devolución vencida. Debes devolver los equipos antes de solicitar uno nuevo.',
        cantidadVencidos: prestamosVencidos.length,
        prestamosVencidos: prestamosVencidos.map((p) => ({
          prestamoId: p.id,
          equipo: p.equipo ? p.equipo.nombre : `Equipo #${p.equipoId}`,
          fechaDevolucionEsperada: p.fechaDevolucionEsperada,
          diasDeRetraso: Math.floor((ahora - new Date(p.fechaDevolucionEsperada)) / (1000 * 60 * 60 * 24))
        }))
      });
    }

    next();
  } catch (error) {
    console.error('Error en middleware de mora:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al verificar el estado de mora del usuario.'
    });
  }
};
