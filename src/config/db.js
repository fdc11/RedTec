require('dotenv').config();
const { Sequelize } = require('sequelize');

/**
 * REGLA DURA: Falla al arrancar si falta JWT_SECRET o variables de BD.
 * Esta validación temprana evita que la aplicación se ejecute en un estado inseguro o con datos nulos.
 */
const variablesRequeridas = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_NAME',
  'DB_USER'
];

const faltantes = variablesRequeridas.filter((varName) => !process.env[varName]);

if (faltantes.length > 0) {
  console.error(`❌ ERROR CRÍTICO DE CONFIGURACIÓN: Faltan variables obligatorias en .env: ${faltantes.join(', ')}`);
  console.error('Por favor, revise su archivo .env o copie los valores desde .env.example.');
  process.exit(1);
}

/**
 * Instancia central de Sequelize para la conexión ORM con MySQL.
 * Se desactiva el logging de SQL en consola para mantener las respuestas limpias.
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false
    }
  }
);

module.exports = sequelize;
