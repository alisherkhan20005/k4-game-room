const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  room_code: {
    type: DataTypes.STRING(6),
    unique: true,
    allowNull: false
  },
  event_type: {
    type: DataTypes.ENUM('bridal', 'baby'),
    allowNull: false
  },
  celebrant_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  host_password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('waiting', 'active', 'finished'),
    defaultValue: 'waiting'
  },
  current_game: {
    type: DataTypes.STRING(50),
    defaultValue: null
  },
  current_question_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'events'
});

module.exports = Event;
