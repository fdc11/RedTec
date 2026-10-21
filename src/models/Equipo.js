const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Equipo extends Model {
    /**
     * Define las asociaciones del modelo Equipo.
     * @param {object} models - Modelos registrados en la instancia de Sequelize.
     */
    static associate(models) {
      // Relación 1:N: Un equipo puede ser objeto de múltiples registros de préstamos a lo largo del tiempo.
      // onDelete: RESTRICT previene la eliminación si tiene historial de préstamos vinculados.
      Equipo.hasMany(models.Prestamo, {
        foreignKey: 'equipoId',
        as: 'prestamos',
        onDelete: 'RESTRICT'
      });

      // Relación N:M: Equipos con Usuarios a través de la tabla Prestamos.
      // unique: false permite que un equipo se preste varias veces al mismo usuario en diferentes periodos.
      Equipo.belongsToMany(models.Usuario, {
        through: {
          model: models.Prestamo,
          unique: false
        },
        foreignKey: 'equipoId',
        otherKey: 'usuarioId',
        as: 'usuarios',
        onDelete: 'RESTRICT'
      });
    }
  }

  Equipo.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'El nombre del equipo no puede estar vacío.' },
          len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres.' }
        }
      },
      categoria: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'La categoría del equipo es obligatoria.' }
        }
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      estado: {
        type: DataTypes.ENUM('Disponible', 'Prestado', 'En mantenimiento'),
        allowNull: false,
        defaultValue: 'Disponible',
        validate: {
          isIn: {
            args: [['Disponible', 'Prestado', 'En mantenimiento']],
            msg: 'El estado solo puede ser Disponible, Prestado o En mantenimiento.'
          }
        }
      }
    },
    {
      sequelize,
      modelName: 'Equipo',
      tableName: 'Equipos'
    }
  );

  return Equipo;
};
