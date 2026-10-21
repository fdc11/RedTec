const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Prestamo extends Model {
    /**
     * Helper para comprobar si un préstamo activo se encuentra actualmente en mora.
     * @returns {boolean}
     */
    estaEnMora() {
      if (this.fechaDevolucionReal !== null) return false;
      return new Date() > new Date(this.fechaDevolucionEsperada);
    }

    /**
     * Define las relaciones N:1 del modelo Prestamo hacia Usuario y Equipo.
     * @param {object} models - Modelos registrados en Sequelize.
     */
    static associate(models) {
      // Relación N:1 con Usuario: Cada préstamo pertenece a un único usuario.
      Prestamo.belongsTo(models.Usuario, {
        foreignKey: 'usuarioId',
        as: 'usuario',
        onDelete: 'RESTRICT'
      });

      // Relación N:1 con Equipo: Cada préstamo hace referencia a un único equipo.
      Prestamo.belongsTo(models.Equipo, {
        foreignKey: 'equipoId',
        as: 'equipo',
        onDelete: 'RESTRICT'
      });
    }
  }

  Prestamo.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id'
        },
        validate: {
          notNull: { msg: 'El ID de usuario es obligatorio.' }
        }
      },
      equipoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Equipos',
          key: 'id'
        },
        validate: {
          notNull: { msg: 'El ID de equipo es obligatorio.' }
        }
      },
      fechaPrestamo: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      fechaDevolucionEsperada: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: { msg: 'La fecha de devolución esperada debe ser una fecha válida.' }
        }
      },
      fechaDevolucionReal: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }
    },
    {
      sequelize,
      modelName: 'Prestamo',
      tableName: 'Prestamos',
      // Índice compuesto en (usuarioId, fechaDevolucionReal):
      // Optimiza exponencialmente las consultas de verificación de préstamos activos (fechaDevolucionReal IS NULL)
      // y verificación de mora, indispensables en la cadena de middlewares de préstamos.
      indexes: [
        {
          name: 'idx_prestamos_usuario_devolucion_real',
          fields: ['usuarioId', 'fechaDevolucionReal']
        }
      ]
    }
  );

  return Prestamo;
};
