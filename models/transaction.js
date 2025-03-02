'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Transaction.init({
    transactionDate: DataTypes.STRING,
    transactionId: DataTypes.STRING,
    accountName: DataTypes.STRING,
    accountNumber: DataTypes.STRING,
    username: DataTypes.STRING,
    refNo: DataTypes.STRING,
    fundMethod: DataTypes.STRING,
    credit: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  return Transaction;
};