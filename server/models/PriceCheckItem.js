const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PriceCheckItem = sequelize.define('PriceCheckItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  event_id: { type: DataTypes.INTEGER, allowNull: false },
  item_name: { type: DataTypes.STRING(150), allowNull: false },
  item_emoji: { type: DataTypes.STRING(10), defaultValue: '🛒' },
  real_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'price_check_items' });

module.exports = PriceCheckItem;
