'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Robot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Robot.init({
    transId: DataTypes.STRING,
    transDate: DataTypes.STRING,
    bankName: DataTypes.STRING,
    accountName: DataTypes.STRING,
    bankFrom: DataTypes.STRING,
    branch: DataTypes.STRING,
    amount: DataTypes.STRING,
    notes: DataTypes.STRING,
    type: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Robot',
  });
  return Robot;
};