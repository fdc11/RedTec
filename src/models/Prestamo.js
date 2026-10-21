const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Prestamo extends Model {
    /**
     * Comprueba si el préstamo se encuentra actualmente en mora
     */
    estaEnMora() {
      if (this.fechaDevolucionReal) return false;
      return new Date() > new Date(this.fechaDevolucionEsperada);
    }

    static associate(models) {
      // Relación N:1 con Usuario
      Prestamo.belongsTo(models.Usuario, {
        foreignKey: 'usuarioId',
        as: 'usuario'
      });

      // Relación N:1 con Equipo
      Prestamo.belongsTo(models.Equipo, {
        foreignKey: 'equipoId',
        as: 'equipo'
      });
    }
  }

  Prestamo.init({
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
        notNull: { msg: 'El ID de usuario es obligatorio' }
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
        notNull: { msg: 'El ID de equipo es obligatorio' }
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
        isDate: { msg: 'Debe ser una fecha válida' },
        isAfterPrestamo(value) {
          if (this.fechaPrestamo && new Date(value) <= new Date(this.fechaPrestamo)) {
            throw new Error('La fecha de devolución esperada debe ser posterior a la fecha de préstamo');
          }
        }
      }
    },
    fechaDevolucionReal: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    sequelize,
    modelName: 'Prestamo',
    tableName: 'Prestamos'
  });

  return Prestamo;
};
