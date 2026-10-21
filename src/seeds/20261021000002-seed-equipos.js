'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Equipos', [
      {
        id: 1,
        nombre: 'Laptop Dell XPS 13',
        categoria: 'Laptops',
        estado: 'Disponible',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        nombre: 'Laptop Lenovo ThinkPad T14',
        categoria: 'Laptops',
        estado: 'Disponible',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        nombre: 'Proyector Epson Full HD 3500L',
        categoria: 'Audiovisual',
        estado: 'Disponible',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        nombre: 'Cámara Sony Alpha A6400 4K',
        categoria: 'Audiovisual',
        estado: 'Prestado',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        nombre: 'Micrófono Inalámbrico Shure SM58',
        categoria: 'Audiovisual',
        estado: 'Disponible',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        nombre: 'Taladro Percutor Bosch Professional',
        categoria: 'Herramientas',
        estado: 'En mantenimiento',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        nombre: 'Osciloscopio Digital Hantek DSO5102P',
        categoria: 'Herramientas',
        estado: 'Disponible',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 8,
        nombre: 'Estación de Soldadura SMD Baku 878L',
        categoria: 'Herramientas',
        estado: 'Prestado',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Equipos', null, {});
  }
};
