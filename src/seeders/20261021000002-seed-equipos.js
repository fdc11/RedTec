'use strict';

/**
 * Seeder para 8 equipos de ejemplo que cubren laptops, audiovisual y herramientas.
 * Incluye descripciones completas y al menos uno 'En mantenimiento'.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const ahora = new Date();

    await queryInterface.bulkInsert('Equipos', [
      {
        id: 1,
        nombre: 'Laptop Dell XPS 13',
        categoria: 'Laptops',
        descripcion: 'Ultrabook de alta gama con procesador Intel Core i7, 16GB RAM y SSD de 512GB. Ideal para desarrollo y diseño.',
        estado: 'Disponible',
        createdAt: ahora,
        updatedAt: ahora
      },
      {
        id: 2,
        nombre: 'Laptop Lenovo ThinkPad T14',
        categoria: 'Laptops',
        descripcion: 'Laptop profesional con AMD Ryzen 7 PRO, 16GB RAM y chasis reforzado de grado militar para trabajo en campo.',
        estado: 'Disponible',
        createdAt: ahora,
        updatedAt: ahora
      },
      {
        id: 3,
        nombre: 'Proyector Epson Full HD 3500L',
        categoria: 'Audiovisual',
        descripcion: 'Proyector de alta definición con brillo de 3500 lúmenes y conectividad HDMI para capacitaciones y eventos.',
        estado: 'Disponible',
        createdAt: ahora,
        updatedAt: ahora
      },
      {
        id: 4,
        nombre: 'Cámara Sony Alpha A6400 4K',
        categoria: 'Audiovisual',
        descripcion: 'Cámara mirrorless con sensor APS-C de 24.2 MP y lente 16-50mm. Grabación 4K para cobertura de talleres.',
        estado: 'Prestado', // Asignado a Lucía Silva (en mora)
        createdAt: ahora,
        updatedAt: ahora
      },
      {
        id: 5,
        nombre: 'Micrófono Inalámbrico Shure SM58',
        categoria: 'Audiovisual',
        descripcion: 'Sistema de micrófono dinámico vocal inalámbrico UHF con receptor de diversidad para conferencias.',
        estado: 'Disponible',
        createdAt: ahora,
        updatedAt: ahora
      },
      {
        id: 6,
        nombre: 'Taladro Percutor Bosch Professional',
        categoria: 'Herramientas',
        descripcion: 'Taladro percutor de 750W con mandril de 13mm para perforación de mampostería, madera y metal.',
        estado: 'En mantenimiento', // Requisito académico: Al menos uno en mantenimiento
        createdAt: ahora,
        updatedAt: ahora
      },
      {
        id: 7,
        nombre: 'Osciloscopio Digital Hantek DSO5102P',
        categoria: 'Herramientas',
        descripcion: 'Osciloscopio digital de 2 canales, ancho de banda de 100MHz y tasa de muestreo de 1GSa/s.',
        estado: 'Prestado', // Asignado a Marcos Peña (1er préstamo activo)
        createdAt: ahora,
        updatedAt: ahora
      },
      {
        id: 8,
        nombre: 'Estación de Soldadura SMD Baku 878L',
        categoria: 'Herramientas',
        descripcion: 'Estación de retrabajo 2 en 1 con cautín térmico cerámico y pistola de aire caliente para microelectrónica.',
        estado: 'Prestado', // Asignado a Marcos Peña (2do préstamo activo)
        createdAt: ahora,
        updatedAt: ahora
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Equipos', null, {});
  }
};
