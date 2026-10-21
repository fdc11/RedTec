const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// Inicialización de modelos pasando la instancia configurada de Sequelize
const Usuario = require('./Usuario')(sequelize);
const Equipo = require('./Equipo')(sequelize);
const Prestamo = require('./Prestamo')(sequelize);

const db = {
  Usuario,
  Equipo,
  Prestamo
};

// Ejecución de las asociaciones declaradas en cada modelo
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
