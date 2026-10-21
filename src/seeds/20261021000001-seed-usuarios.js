'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const passwordAdmin = await bcrypt.hash('Admin123!', salt);
    const passwordUser = await bcrypt.hash('Usuario123!', salt);

    await queryInterface.bulkInsert('Usuarios', [
      {
        id: 1,
        nombre: 'Administrador RedTec',
        email: 'admin@redtec.org',
        password: passwordAdmin,
        rol: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        nombre: 'Carlos Gomez',
        email: 'carlos@redtec.org',
        password: passwordUser,
        rol: 'usuario',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        nombre: 'Lucia Silva (Usuario Moroso)',
        email: 'lucia@redtec.org',
        password: passwordUser,
        rol: 'usuario',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Usuarios', null, {});
  }
};
