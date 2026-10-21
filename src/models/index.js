const { Sequelize } = require('sequelize');
const configData = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = configData[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const Usuario = require('./Usuario')(sequelize);
const Equipo = require('./Equipo')(sequelize);
const Prestamo = require('./Prestamo')(sequelize);

const db = {
  Usuario,
  Equipo,
  Prestamo
};

// Ejecutar asociaciones de cada modelo
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
