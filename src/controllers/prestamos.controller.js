const { sequelize, Prestamo, Equipo, Usuario } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * Solicitar un nuevo préstamo.
 *
 * Flujo de ejecución bajo transacción ACID y bloqueo pesimista:
 * 1. Inicia sequelize.transaction.
 * 2. Bloquea la fila del Usuario (lock: t.LOCK.UPDATE) para serializar solicitudes concurrentes del mismo usuario.
 * 3. REVALIDA el límite de préstamos dentro de la transacción para evitar race conditions.
 * 4. Bloquea la fila del Equipo (lock: t.LOCK.UPDATE) para evitar que dos usuarios tomen el mismo equipo simultáneamente.
 * 5. Verifica que el equipo esté 'Disponible' (si no, 409 Conflict).
 * 6. Crea el registro de Prestamo.
 * 7. Actualiza el estado del equipo a 'Prestado'.
 * 8. Commit de la transacción. Si ocurre cualquier error, rollback automático.
 */
const solicitarPrestamo = asyncHandler(async (req, res) => {
  const { equipoId, fechaDevolucionEsperada } = req.body;
  const usuarioId = req.usuario.id;

  const resultado = await sequelize.transaction(async (t) => {
    // 1. Bloqueo pesimista de la fila del Usuario
    const usuario = await Usuario.findByPk(usuarioId, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    // 2. Revalidación atómica del límite dentro de la transacción (exclusivo para usuarios regulares)
    if (usuario.rol === 'usuario') {
      const prestamosActivos = await Prestamo.count({
        where: {
          usuarioId,
          fechaDevolucionReal: null
        },
        transaction: t
      });

      if (prestamosActivos >= 2) {
        throw new AppError(
          'Límite de préstamos alcanzado: Ya posee 2 equipos prestados simultáneamente.',
          409
        );
      }
    }

    // 3. Bloqueo pesimista de la fila del Equipo
    const equipo = await Equipo.findByPk(equipoId, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!equipo) {
      throw new AppError(`El equipo con ID ${equipoId} no existe.`, 404);
    }

    // 4. Verificación de disponibilidad del equipo
    if (equipo.estado !== 'Disponible') {
      throw new AppError(
        `El equipo '${equipo.nombre}' no se encuentra disponible para préstamo (estado actual: ${equipo.estado}).`,
        409
      );
    }

    // 5. Creación del préstamo
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

    // 6. Actualización atómica del inventario
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
    data: {
      id: resultado.prestamo.id,
      usuarioId: resultado.prestamo.usuarioId,
      equipoId: resultado.prestamo.equipoId,
      equipoNombre: resultado.equipo.nombre,
      fechaPrestamo: resultado.prestamo.fechaPrestamo,
      fechaDevolucionEsperada: resultado.prestamo.fechaDevolucionEsperada,
      fechaDevolucionReal: resultado.prestamo.fechaDevolucionReal
    }
  });
});

/**
 * Registrar la devolución de un equipo en préstamo.
 *
 * Flujo transaccional:
 * 1. Bloquea la fila del préstamo con lock: t.LOCK.UPDATE.
 * 2. Verifica autorización: solo el titular del préstamo o un Administrador pueden devolverlo (403).
 * 3. Si el préstamo ya estaba devuelto (fechaDevolucionReal !== null), responde 409 Conflict.
 * 4. Actualiza fechaDevolucionReal con la marca de tiempo actual.
 * 5. Bloquea y actualiza el equipo correspondiente a estado 'Disponible'.
 */
const devolverPrestamo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const usuario = req.usuario;

  const resultado = await sequelize.transaction(async (t) => {
    const prestamo = await Prestamo.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
      include: [{ model: Equipo, as: 'equipo' }]
    });

    if (!prestamo) {
      throw new AppError(`Préstamo con ID ${id} no encontrado.`, 404);
    }

    // Verificación de propiedad o privilegios de administrador
    if (usuario.rol !== 'admin' && prestamo.usuarioId !== usuario.id) {
      throw new AppError('No tiene autorización para devolver un préstamo de otro usuario.', 403);
    }

    // REGLA DURA: Si ya estaba devuelto, responde 409 Conflict
    if (prestamo.fechaDevolucionReal !== null) {
      throw new AppError('Conflicto: Este préstamo ya fue devuelto previamente.', 409);
    }

    const ahora = new Date();
    await prestamo.update(
      { fechaDevolucionReal: ahora },
      { transaction: t }
    );

    // Restauración de disponibilidad en el inventario
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

    return {
      prestamo,
      equipo
    };
  });

  return res.status(200).json({
    ok: true,
    data: {
      id: resultado.prestamo.id,
      usuarioId: resultado.prestamo.usuarioId,
      equipoId: resultado.prestamo.equipoId,
      fechaPrestamo: resultado.prestamo.fechaPrestamo,
      fechaDevolucionEsperada: resultado.prestamo.fechaDevolucionEsperada,
      fechaDevolucionReal: resultado.prestamo.fechaDevolucionReal,
      equipo: {
        id: resultado.equipo?.id,
        nombre: resultado.equipo?.nombre,
        estado: resultado.equipo?.estado
      }
    }
  });
});

/**
 * Listar préstamos registrados.
 *
 * REGLA DURA:
 * El administrador visualiza todos los préstamos de la plataforma.
 * El usuario común visualiza únicamente los suyos.
 */
const listarPrestamos = asyncHandler(async (req, res) => {
  const where = {};

  if (req.usuario.rol !== 'admin') {
    where.usuarioId = req.usuario.id;
  }

  const includeModels = [
    {
      model: Equipo,
      as: 'equipo',
      attributes: ['id', 'nombre', 'categoria', 'estado']
    }
  ];

  if (req.usuario.rol === 'admin') {
    includeModels.push({
      model: Usuario,
      as: 'usuario',
      attributes: ['id', 'nombre', 'email']
    });
  }

  const prestamos = await Prestamo.findAll({
    where,
    include: includeModels,
    order: [['fechaPrestamo', 'DESC']]
  });

  const ahora = new Date();
  const data = prestamos.map((p) => {
    const activo = p.fechaDevolucionReal === null;
    const enMora = activo && new Date(p.fechaDevolucionEsperada) < ahora;
    return {
      id: p.id,
      usuarioId: p.usuarioId,
      equipoId: p.equipoId,
      fechaPrestamo: p.fechaPrestamo,
      fechaDevolucionEsperada: p.fechaDevolucionEsperada,
      fechaDevolucionReal: p.fechaDevolucionReal,
      activo,
      enMora,
      equipo: p.equipo,
      ...(p.usuario ? { usuario: p.usuario } : {})
    };
  });

  return res.status(200).json({
    ok: true,
    data
  });
});

module.exports = {
  solicitarPrestamo,
  devolverPrestamo,
  listarPrestamos
};
