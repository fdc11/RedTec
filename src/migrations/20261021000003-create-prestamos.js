'use strict';

/**
 * Migración para la tabla 'Prestamos'.
 * Implementa claves foráneas con onDelete: 'RESTRICT'
 * e índice compuesto en (usuarioId, fechaDevolucionReal) para optimizar
 * las consultas de verificación de mora y límites de cupo.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Prestamos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      equipoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Equipos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      fechaPrestamo: {
        type: Sequelize.DATE,
        allowNull: false
      },
      fechaDevolucionEsperada: {
        type: Sequelize.DATE,
        allowNull: false
      },
      fechaDevolucionReal: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Creación explícita del índice compuesto en (usuarioId, fechaDevolucionReal)
    await queryInterface.addIndex('Prestamos', ['usuarioId', 'fechaDevolucionReal'], {
      name: 'idx_prestamos_usuario_devolucion_real'
    });
  },

  async down(queryInterface, Sequelize) {
    // En MySQL, dropTable elimina la tabla junto con sus índices y restricciones asociadas
    await queryInterface.dropTable('Prestamos');
  }
};
