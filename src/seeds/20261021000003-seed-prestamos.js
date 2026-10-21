'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const ahora = new Date();

    // Préstamo devuelto (hace 20 días a hace 10 días)
    const fechaPrestamoHistorico = new Date(ahora.getTime() - 20 * 24 * 60 * 60 * 1000);
    const fechaEsperadaHistorica = new Date(ahora.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fechaRealHistorica = new Date(ahora.getTime() - 11 * 24 * 60 * 60 * 1000);

    // Préstamo vencido en mora para Lucia (usuario 3, equipo 4)
    const fechaPrestamoMora = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);
    const fechaEsperadaMora = new Date(ahora.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Préstamo activo regular para Carlos (usuario 2, equipo 8)
    const fechaPrestamoActivo = new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fechaEsperadaActiva = new Date(ahora.getTime() + 5 * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('Prestamos', [
      {
        id: 1,
        usuarioId: 2,
        equipoId: 1,
        fechaPrestamo: fechaPrestamoHistorico,
        fechaDevolucionEsperada: fechaEsperadaHistorica,
        fechaDevolucionReal: fechaRealHistorica,
        createdAt: fechaPrestamoHistorico,
        updatedAt: fechaRealHistorica
      },
      {
        id: 2,
        usuarioId: 3,
        equipoId: 4,
        fechaPrestamo: fechaPrestamoMora,
        fechaDevolucionEsperada: fechaEsperadaMora,
        fechaDevolucionReal: null,
        createdAt: fechaPrestamoMora,
        updatedAt: fechaPrestamoMora
      },
      {
        id: 3,
        usuarioId: 2,
        equipoId: 8,
        fechaPrestamo: fechaPrestamoActivo,
        fechaDevolucionEsperada: fechaEsperadaActiva,
        fechaDevolucionReal: null,
        createdAt: fechaPrestamoActivo,
        updatedAt: fechaPrestamoActivo
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Prestamos', null, {});
  }
};
