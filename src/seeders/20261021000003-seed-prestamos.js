'use strict';

/**
 * Seeder para préstamos de demostración académica:
 * 1. Préstamo vencido en mora para Lucía Silva (Usuario 3, Equipo 4):
 *    Fecha esperada en el pasado y fechaDevolucionReal = null.
 *    Permite probar que verificarMora responde 403 Forbidden.
 * 2. Dos préstamos activos para Marcos Peña (Usuario 4, Equipos 7 y 8):
 *    Permite probar que verificarLimite responde 409 Conflict ante un 3er intento.
 * 3. Préstamo histórico devuelto para Carlos Gómez (Usuario 2, Equipo 1):
 *    Demuestra que los préstamos devueltos no bloquean al usuario.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const ahora = new Date();

    // Préstamo devuelto (hace 20 días a hace 10 días)
    const fechaPrestamoHistorico = new Date(ahora.getTime() - 20 * 24 * 60 * 60 * 1000);
    const fechaEsperadaHistorica = new Date(ahora.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fechaRealHistorica = new Date(ahora.getTime() - 11 * 24 * 60 * 60 * 1000);

    // Préstamo en mora para Lucía (venció hace 5 días)
    const fechaPrestamoMora = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);
    const fechaEsperadaMora = new Date(ahora.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Préstamos activos regulares para Marcos (vencen dentro de 7 y 14 días)
    const fechaPrestamoActivo1 = new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fechaEsperadaActiva1 = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

    const fechaPrestamoActivo2 = new Date(ahora.getTime() - 1 * 24 * 60 * 60 * 1000);
    const fechaEsperadaActiva2 = new Date(ahora.getTime() + 14 * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('Prestamos', [
      {
        id: 1,
        usuarioId: 2, // Carlos Gómez (préstamo ya devuelto, libre de cupo y mora)
        equipoId: 1,
        fechaPrestamo: fechaPrestamoHistorico,
        fechaDevolucionEsperada: fechaEsperadaHistorica,
        fechaDevolucionReal: fechaRealHistorica,
        createdAt: fechaPrestamoHistorico,
        updatedAt: fechaRealHistorica
      },
      {
        id: 2,
        usuarioId: 3, // Lucía Silva (préstamo vencido activo -> Dispara 403 por mora)
        equipoId: 4,
        fechaPrestamo: fechaPrestamoMora,
        fechaDevolucionEsperada: fechaEsperadaMora,
        fechaDevolucionReal: null,
        createdAt: fechaPrestamoMora,
        updatedAt: fechaPrestamoMora
      },
      {
        id: 3,
        usuarioId: 4, // Marcos Peña (1er préstamo activo)
        equipoId: 7,
        fechaPrestamo: fechaPrestamoActivo1,
        fechaDevolucionEsperada: fechaEsperadaActiva1,
        fechaDevolucionReal: null,
        createdAt: fechaPrestamoActivo1,
        updatedAt: fechaPrestamoActivo1
      },
      {
        id: 4,
        usuarioId: 4, // Marcos Peña (2do préstamo activo -> Dispara 409 por límite de 2)
        equipoId: 8,
        fechaPrestamo: fechaPrestamoActivo2,
        fechaDevolucionEsperada: fechaEsperadaActiva2,
        fechaDevolucionReal: null,
        createdAt: fechaPrestamoActivo2,
        updatedAt: fechaPrestamoActivo2
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Prestamos', null, {});
  }
};
