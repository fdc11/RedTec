const { Equipo, Prestamo } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * Listar catálogo de equipos.
 * Requiere autenticación.
 * Admite filtros opcionales por query: ?estado= y ?categoria=.
 */
const listarEquipos = asyncHandler(async (req, res) => {
  const { estado, categoria } = req.query;
  const where = {};

  if (estado) {
    where.estado = estado;
  }

  if (categoria) {
    where.categoria = categoria;
  }

  const equipos = await Equipo.findAll({
    where,
    order: [['nombre', 'ASC']]
  });

  return res.status(200).json({
    ok: true,
    data: equipos
  });
});

/**
 * Obtener detalle de un equipo específico por su ID.
 * Requiere autenticación.
 */
const obtenerEquipoPorId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const equipo = await Equipo.findByPk(id);

  if (!equipo) {
    throw new AppError(`Equipo con ID ${id} no encontrado en el inventario.`, 404);
  }

  return res.status(200).json({
    ok: true,
    data: equipo
  });
});

/**
 * Crear un nuevo equipo en el catálogo.
 * Solo Administradores.
 * REGLA DURA: Nadie puede asignar estado 'Prestado' a mano.
 */
const crearEquipo = asyncHandler(async (req, res) => {
  const { nombre, categoria, descripcion, estado } = req.body;

  if (estado === 'Prestado') {
    throw new AppError(
      "No está permitido asignar manualmente el estado 'Prestado'. Este estado es exclusivo del flujo de préstamos.",
      400
    );
  }

  const nuevoEquipo = await Equipo.create({
    nombre,
    categoria,
    descripcion: descripcion || null,
    estado: estado || 'Disponible'
  });

  return res.status(201).json({
    ok: true,
    data: nuevoEquipo
  });
});

/**
 * Actualizar datos de un equipo existente.
 * Solo Administradores.
 */
const actualizarEquipo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, descripcion, estado } = req.body;

  const equipo = await Equipo.findByPk(id);
  if (!equipo) {
    throw new AppError(`Equipo con ID ${id} no encontrado.`, 404);
  }

  if (estado === 'Prestado') {
    throw new AppError(
      "No está permitido asignar manualmente el estado 'Prestado'.",
      400
    );
  }

  // Si se intenta modificar el estado de un equipo que tiene un préstamo activo
  if (estado && estado !== equipo.estado) {
    const prestamoActivo = await Prestamo.findOne({
      where: {
        equipoId: id,
        fechaDevolucionReal: null
      }
    });

    if (prestamoActivo) {
      throw new AppError(
        `Conflicto: No es posible cambiar el estado del equipo a '${estado}' mientras mantenga un préstamo activo en curso. Registre primero la devolución.`,
        409
      );
    }
  }

  await equipo.update({
    nombre: nombre !== undefined ? nombre : equipo.nombre,
    categoria: categoria !== undefined ? categoria : equipo.categoria,
    descripcion: descripcion !== undefined ? descripcion : equipo.descripcion,
    estado: estado !== undefined ? estado : equipo.estado
  });

  return res.status(200).json({
    ok: true,
    data: equipo
  });
});

/**
 * Eliminar un equipo del catálogo.
 * Solo Administradores.
 * REGLA DURA: Devuelve 409 Conflict si el equipo tiene un préstamo activo.
 */
const eliminarEquipo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const equipo = await Equipo.findByPk(id);
  if (!equipo) {
    throw new AppError(`Equipo con ID ${id} no encontrado.`, 404);
  }

  // 1. Verificación de préstamo activo (Regla de negocio: 409 Conflict)
  const prestamoActivo = await Prestamo.findOne({
    where: {
      equipoId: id,
      fechaDevolucionReal: null
    }
  });

  if (prestamoActivo) {
    throw new AppError(
      'Conflicto: No es posible eliminar el equipo porque se encuentra actualmente prestado.',
      409
    );
  }

  // 2. Intento de eliminación respetando la restricción de integridad referencial (onDelete: 'RESTRICT')
  try {
    await equipo.destroy();
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      throw new AppError(
        'Conflicto de integridad: No se puede eliminar el equipo porque posee un historial de préstamos vinculados. Para retirarlo de circulación, cambie su estado a En mantenimiento.',
        409
      );
    }
    throw error;
  }

  return res.status(200).json({
    ok: true,
    data: {
      message: `El equipo '${equipo.nombre}' fue eliminado exitosamente del inventario.`
    }
  });
});

module.exports = {
  listarEquipos,
  obtenerEquipoPorId,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo
};
