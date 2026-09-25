const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Player = sequelize.define('Player', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  socket_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  avatar_color: {
    type: DataTypes.STRING(20),
    defaultValue: '#FFB5C8'
  },
  total_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'players'
});

module.exports = Player;
