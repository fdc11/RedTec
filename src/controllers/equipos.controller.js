const { Op } = require('sequelize');
const { Equipo, Prestamo, Usuario } = require('../models');

/**
 * Listar todos los equipos con soporte para filtros por estado, categoría y búsqueda
 */
const listarEquipos = async (req, res) => {
  try {
    const { estado, categoria, busqueda } = req.query;
    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (busqueda) {
      where.nombre = {
        [Op.like]: `%${busqueda}%`
      };
    }

    const equipos = await Equipo.findAll({
      where,
      order: [['nombre', 'ASC']]
    });

    return res.json({
      ok: true,
      total: equipos.length,
      equipos
    });
  } catch (error) {
    console.error('Error al listar equipos:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al consultar el inventario de equipos.'
    });
  }
};

/**
 * Obtener detalle de un equipo específico por su ID
 */
const obtenerEquipoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const equipo = await Equipo.findByPk(id, {
      include: [
        {
          model: Prestamo,
          as: 'prestamos',
          limit: 5,
          order: [['fechaPrestamo', 'DESC']],
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['id', 'nombre', 'email']
            }
          ]
        }
      ]
    });

    if (!equipo) {
      return res.status(404).json({
        ok: false,
        error: `Equipo con ID ${id} no encontrado.`
      });
    }

    return res.json({
      ok: true,
      equipo
    });
  } catch (error) {
    console.error('Error al obtener equipo:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al consultar el equipo.'
    });
  }
};

/**
 * Registrar un nuevo equipo (Solo Admin)
 */
const crearEquipo = async (req, res) => {
  try {
    const { nombre, categoria, estado } = req.body;

    const nuevoEquipo = await Equipo.create({
      nombre,
      categoria,
      estado: estado || 'Disponible'
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Equipo registrado exitosamente en el inventario.',
      equipo: nuevoEquipo
    });
  } catch (error) {
    console.error('Error al crear equipo:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al registrar el nuevo equipo.'
    });
  }
};

/**
 * Actualizar los datos de un equipo (Solo Admin)
 */
const actualizarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, categoria, estado } = req.body;

    const equipo = await Equipo.findByPk(id);
    if (!equipo) {
      return res.status(404).json({
        ok: false,
        error: `Equipo con ID ${id} no encontrado.`
      });
    }

    // Si se intenta cambiar a 'Disponible' o 'En mantenimiento' mientras tiene un préstamo activo
    if (estado && estado !== 'Prestado') {
      const prestamoActivo = await Prestamo.findOne({
        where: {
          equipoId: id,
          fechaDevolucionReal: null
        }
      });

      if (prestamoActivo && estado !== 'Prestado') {
        return res.status(400).json({
          ok: false,
          error: `No se puede cambiar el estado a '${estado}' porque el equipo tiene un préstamo activo en curso. Primero registre la devolución.`
        });
      }
    }

    await equipo.update({
      nombre: nombre || equipo.nombre,
      categoria: categoria || equipo.categoria,
      estado: estado || equipo.estado
    });

    return res.json({
      ok: true,
      mensaje: 'Equipo actualizado exitosamente.',
      equipo
    });
  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al actualizar el equipo.'
    });
  }
};

/**
 * Eliminar un equipo del inventario (Solo Admin)
 */
const eliminarEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    const equipo = await Equipo.findByPk(id);
    if (!equipo) {
      return res.status(404).json({
        ok: false,
        error: `Equipo con ID ${id} no encontrado.`
      });
    }

    // Regla de integridad: no borrar si tiene un préstamo activo
    const prestamoActivo = await Prestamo.findOne({
      where: {
        equipoId: id,
        fechaDevolucionReal: null
      }
    });

    if (prestamoActivo) {
      return res.status(400).json({
        ok: false,
        error: 'No es posible eliminar el equipo porque se encuentra actualmente prestado.'
      });
    }

    // Si tiene historial pero ya devuelto, borramos el equipo (o préstamos previos si corresponde)
    await equipo.destroy();

    return res.json({
      ok: true,
      mensaje: `Equipo '${equipo.nombre}' eliminado exitosamente.`
    });
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al intentar eliminar el equipo. Es posible que tenga registros históricos vinculados.'
    });
  }
};

module.exports = {
  listarEquipos,
  obtenerEquipoPorId,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo
};
