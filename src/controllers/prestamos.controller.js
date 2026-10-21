const { Op } = require('sequelize');
const { sequelize, Prestamo, Equipo, Usuario } = require('../models');

/**
 * Solicitar un nuevo préstamo
 * Flujo:
 * 1. Transacción gestionada en base de datos.
 * 2. Bloqueo pesimista de fila (LOCK.UPDATE) para evitar que dos usuarios tomen el mismo equipo.
 * 3. Validación de estado ('Disponible').
 * 4. Registro del préstamo y actualización del equipo a 'Prestado'.
 */
const solicitarPrestamo = async (req, res) => {
  try {
    const { equipoId, fechaDevolucionEsperada } = req.body;
    const usuarioId = req.usuario.id;

    const resultado = await sequelize.transaction(async (t) => {
      // Bloqueo de la fila del equipo para garantizar concurrencia segura
      const equipo = await Equipo.findByPk(equipoId, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!equipo) {
        const error = new Error(`El equipo con ID ${equipoId} no existe.`);
        error.statusCode = 404;
        throw error;
      }

      if (equipo.estado !== 'Disponible') {
        const error = new Error(
          `El equipo '${equipo.nombre}' no se encuentra disponible para préstamo (estado actual: ${equipo.estado}).`
        );
        error.statusCode = 409;
        throw error;
      }

      // Crear el registro del préstamo
      const nuevoPrestamo = await Prestamo.create(
        {
          usuarioId,
          equipoId,
          fechaPrestamo: new Date(),
          fechaDevolucionEsperada: new Date(fechaDevolucionEsperada),
          fechaDevolucionReal: null
        },
        { transaction: t }
      );

      // Cambiar estado del equipo a 'Prestado'
      await equipo.update(
        { estado: 'Prestado' },
        { transaction: t }
      );

      return {
        prestamo: nuevoPrestamo,
        equipo
      };
    });

    return res.status(201).json({
      ok: true,
      mensaje: `Préstamo del equipo '${resultado.equipo.nombre}' otorgado exitosamente.`,
      prestamo: {
        id: resultado.prestamo.id,
        usuarioId: resultado.prestamo.usuarioId,
        equipoId: resultado.prestamo.equipoId,
        equipoNombre: resultado.equipo.nombre,
        fechaPrestamo: resultado.prestamo.fechaPrestamo,
        fechaDevolucionEsperada: resultado.prestamo.fechaDevolucionEsperada
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        ok: false,
        error: error.message
      });
    }

    console.error('Error al procesar solicitud de préstamo:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al procesar el préstamo.'
    });
  }
};

/**
 * Registrar la devolución de un equipo
 */
const devolverPrestamo = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario;

    const resultado = await sequelize.transaction(async (t) => {
      const prestamo = await Prestamo.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
        include: [{ model: Equipo, as: 'equipo' }]
      });

      if (!prestamo) {
        const error = new Error(`Préstamo con ID ${id} no encontrado.`);
        error.statusCode = 404;
        throw error;
      }

      // Solo el usuario titular del préstamo o un Administrador pueden devolverlo
      if (usuario.rol !== 'admin' && prestamo.usuarioId !== usuario.id) {
        const error = new Error('No tienes permiso para devolver un préstamo de otro usuario.');
        error.statusCode = 403;
        throw error;
      }

      if (prestamo.fechaDevolucionReal !== null) {
        const error = new Error(
          `Este préstamo ya fue devuelto previamente el ${prestamo.fechaDevolucionReal.toLocaleString()}.`
        );
        error.statusCode = 400;
        throw error;
      }

      const ahora = new Date();
      await prestamo.update(
        { fechaDevolucionReal: ahora },
        { transaction: t }
      );

      // Regresar el equipo a estado 'Disponible'
      const equipo = await Equipo.findByPk(prestamo.equipoId, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (equipo) {
        await equipo.update(
          { estado: 'Disponible' },
          { transaction: t }
        );
      }

      return { prestamo, equipo };
    });

    return res.json({
      ok: true,
      mensaje: `Equipo '${resultado.equipo?.nombre || ''}' devuelto exitosamente. El inventario ha sido actualizado a Disponible.`,
      prestamo: resultado.prestamo
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        ok: false,
        error: error.message
      });
    }

    console.error('Error al registrar devolución:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al registrar la devolución.'
    });
  }
};

/**
 * Listar los préstamos del usuario autenticado
 */
const listarMisPrestamos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const ahora = new Date();

    const prestamos = await Prestamo.findAll({
      where: { usuarioId },
      include: [
        {
          model: Equipo,
          as: 'equipo',
          attributes: ['id', 'nombre', 'categoria', 'estado']
        }
      ],
      order: [['fechaPrestamo', 'DESC']]
    });

    const prestamosFormateados = prestamos.map((p) => {
      const activo = p.fechaDevolucionReal === null;
      const enMora = activo && new Date(p.fechaDevolucionEsperada) < ahora;
      return {
        ...p.toJSON(),
        activo,
        enMora
      };
    });

    return res.json({
      ok: true,
      total: prestamosFormateados.length,
      prestamos: prestamosFormateados
    });
  } catch (error) {
    console.error('Error al listar préstamos del usuario:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al consultar los préstamos.'
    });
  }
};

/**
 * Listar todos los préstamos registrados (Solo Administrador)
 */
const listarTodosPrestamos = async (req, res) => {
  try {
    const { activo, mora, usuarioId, equipoId } = req.query;
    const where = {};
    const ahora = new Date();

    if (usuarioId) where.usuarioId = usuarioId;
    if (equipoId) where.equipoId = equipoId;

    if (activo === 'true') {
      where.fechaDevolucionReal = null;
    } else if (activo === 'false') {
      where.fechaDevolucionReal = { [Op.ne]: null };
    }

    if (mora === 'true') {
      where.fechaDevolucionReal = null;
      where.fechaDevolucionEsperada = { [Op.lt]: ahora };
    }

    const prestamos = await Prestamo.findAll({
      where,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email', 'rol']
        },
        {
          model: Equipo,
          as: 'equipo',
          attributes: ['id', 'nombre', 'categoria', 'estado']
        }
      ],
      order: [['fechaPrestamo', 'DESC']]
    });

    const prestamosConEstado = prestamos.map((p) => {
      const esActivo = p.fechaDevolucionReal === null;
      const enMora = esActivo && new Date(p.fechaDevolucionEsperada) < ahora;
      return {
        ...p.toJSON(),
        activo: esActivo,
        enMora
      };
    });

    return res.json({
      ok: true,
      total: prestamosConEstado.length,
      prestamos: prestamosConEstado
    });
  } catch (error) {
    console.error('Error al listar todos los préstamos:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al consultar los préstamos.'
    });
  }
};

module.exports = {
  solicitarPrestamo,
  devolverPrestamo,
  listarMisPrestamos,
  listarTodosPrestamos
};
