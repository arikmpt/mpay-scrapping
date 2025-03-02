'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Robots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      transId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      transDate: {
        type: Sequelize.STRING,
        allowNull: true
      },
      bankName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      accountName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      bankFrom: {
        type: Sequelize.STRING,
        allowNull: true
      },
      branch: {
        type: Sequelize.STRING,
        allowNull: true
      },
      amount: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Robots');
  }
};