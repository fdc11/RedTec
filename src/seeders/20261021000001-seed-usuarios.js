'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');

/**
 * Seeder para usuarios iniciales.
 * Cumple con los requisitos académicos:
 * - Admin parametrizado desde ADMIN_EMAIL / ADMIN_PASSWORD del .env con hash bcrypt.
 * - Usuario común de prueba limpio (Carlos Gómez).
 * - Usuario común con préstamo vencido (Lucía Silva) para pruebas de mora (403).
 * - Usuario común con 2 préstamos activos (Marcos Peña) para pruebas de límite de cupo (409).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
    const salt = await bcrypt.genSalt(rounds);

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@redtec.org').toLowerCase().trim();
    const adminPasswordPlain = process.env.ADMIN_PASSWORD || 'Admin123!';
    const passwordAdminHash = await bcrypt.hash(adminPasswordPlain, salt);

    const passwordUserHash = await bcrypt.hash('Usuario123!', salt);
    const ahora = new Date();

    await queryInterface.bulkInsert('Usuarios', [
      {
        id: 1,
        nombre: 'Administrador RedTec',
        email: adminEmail,
        password: passwordAdminHash,
        rol: 'admin',
        createdAt: ahora,
        updatedAt: ahora
      },
      {
        id: 2,
        nombre: 'Carlos Gómez (Usuario Regular)',
        email: 'carlos@redtec.org',
        password: passwordUserHash,
        rol: 'usuario',
        createdAt: ahora,
        updatedAt: ahora
      },
      {
        id: 3,
        nombre: 'Lucía Silva (En Mora)',
        email: 'lucia@redtec.org',
        password: passwordUserHash,
        rol: 'usuario',
        createdAt: ahora,
        updatedAt: ahora
      },
      {
        id: 4,
        nombre: 'Marcos Peña (Con 2 Préstamos)',
        email: 'marcos@redtec.org',
        password: passwordUserHash,
        rol: 'usuario',
        createdAt: ahora,
        updatedAt: ahora
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Usuarios', null, {});
  }
};
