const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Equipo extends Model {
    static associate(models) {
      // Relación 1:N con Préstamos
      Equipo.hasMany(models.Prestamo, {
        foreignKey: 'equipoId',
        as: 'prestamos'
      });

      // Relación N:M con Usuarios a través de Préstamos
      Equipo.belongsToMany(models.Usuario, {
        through: models.Prestamo,
        foreignKey: 'equipoId',
        otherKey: 'usuarioId',
        as: 'prestatarios'
      });
    }
  }

  Equipo.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre del equipo no puede estar vacío' },
        len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' }
      }
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La categoría no puede estar vacía' }
      }
    },
    estado: {
      type: DataTypes.ENUM('Disponible', 'Prestado', 'En mantenimiento'),
      allowNull: false,
      defaultValue: 'Disponible',
      validate: {
        isIn: {
          args: [['Disponible', 'Prestado', 'En mantenimiento']],
          msg: 'El estado debe ser Disponible, Prestado o En mantenimiento'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Equipo',
    tableName: 'Equipos'
  });

  return Equipo;
};
