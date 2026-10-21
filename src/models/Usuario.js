const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class Usuario extends Model {
    /**
     * Compara una contraseña proporcionada en texto plano contra el hash almacenado en la BD.
     * @param {string} passwordPlana - Contraseña ingresada por el usuario.
     * @returns {Promise<boolean>} Verdadero si la contraseña coincide con el hash.
     */
    async validarPassword(passwordPlana) {
      return bcrypt.compare(passwordPlana, this.password);
    }

    /**
     * Define las relaciones del modelo Usuario.
     * @param {object} models - Diccionario de todos los modelos registrados en el ORM.
     */
    static associate(models) {
      // Relación 1:N: Un usuario puede tener múltiples registros de préstamos históricos y activos.
      // onDelete: RESTRICT impide eliminar un usuario si existen préstamos vinculados a él.
      Usuario.hasMany(models.Prestamo, {
        foreignKey: 'usuarioId',
        as: 'prestamos',
        onDelete: 'RESTRICT'
      });

      // Relación N:M: Usuario con Equipos a través de la tabla intermedia Prestamos.
      // unique: false permite que un mismo usuario pueda volver a pedir el mismo equipo en diferentes fechas.
      Usuario.belongsToMany(models.Equipo, {
        through: {
          model: models.Prestamo,
          unique: false
        },
        foreignKey: 'usuarioId',
        otherKey: 'equipoId',
        as: 'equipos',
        onDelete: 'RESTRICT'
      });
    }
  }

  Usuario.init(
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
          notEmpty: { msg: 'El nombre no puede estar vacío.' }
        }
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: { msg: 'El correo electrónico ya está registrado.' },
        set(value) {
          // Normalización automática a minúsculas y eliminación de espacios en blanco
          this.setDataValue('email', value ? value.trim().toLowerCase() : value);
        },
        validate: {
          isEmail: { msg: 'Debe ingresar un formato de correo electrónico válido.' },
          notEmpty: { msg: 'El correo electrónico no puede estar vacío.' }
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'La contraseña es obligatoria.' }
        }
      },
      rol: {
        type: DataTypes.ENUM('admin', 'usuario'),
        allowNull: false,
        defaultValue: 'usuario',
        validate: {
          isIn: {
            args: [['admin', 'usuario']],
            msg: 'El rol debe ser estrictamente admin o usuario.'
          }
        }
      }
    },
    {
      sequelize,
      modelName: 'Usuario',
      tableName: 'Usuarios',
      // defaultScope: Excluye el campo password de manera global en todas las consultas por defecto.
      // Garantiza que ninguna respuesta devuelva accidentalmente el hash de la contraseña.
      defaultScope: {
        attributes: { exclude: ['password'] }
      },
      // Scope específico para el proceso de autenticación/login donde sí se requiere verificar el hash.
      scopes: {
        withPassword: {
          attributes: { include: ['password'] }
        }
      },
      hooks: {
        // Encripta la contraseña de forma asíncrona antes de guardar si fue modificada o creada
        beforeSave: async (usuario) => {
          if (usuario.changed('password')) {
            const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
            const salt = await bcrypt.genSalt(rounds);
            usuario.password = await bcrypt.hash(usuario.password, salt);
          }
        }
      }
    }
  );

  return Usuario;
};
