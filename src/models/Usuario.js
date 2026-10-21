const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class Usuario extends Model {
    /**
     * Compara una contraseña en texto plano con el hash almacenado
     */
    async validarPassword(passwordPlana) {
      return bcrypt.compare(passwordPlana, this.password);
    }

    /**
     * Oculta el password al serializar a JSON
     */
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }

    static associate(models) {
      // Relación 1:N con Préstamos
      Usuario.hasMany(models.Prestamo, {
        foreignKey: 'usuarioId',
        as: 'prestamos'
      });

      // Relación N:M con Equipos a través de Préstamos
      Usuario.belongsToMany(models.Equipo, {
        through: models.Prestamo,
        foreignKey: 'usuarioId',
        otherKey: 'equipoId',
        as: 'equiposPrestados'
      });
    }
  }

  Usuario.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre no puede estar vacío' },
        len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { msg: 'El correo electrónico ya está registrado' },
      validate: {
        isEmail: { msg: 'Debe ser un correo electrónico válido' },
        notEmpty: { msg: 'El correo electrónico no puede estar vacío' }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La contraseña no puede estar vacía' }
      }
    },
    rol: {
      type: DataTypes.ENUM('admin', 'usuario'),
      allowNull: false,
      defaultValue: 'usuario',
      validate: {
        isIn: {
          args: [['admin', 'usuario']],
          msg: 'El rol debe ser admin o usuario'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'Usuarios',
    hooks: {
      beforeSave: async (usuario) => {
        if (usuario.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      }
    }
  });

  return Usuario;
};
