const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Score = sequelize.define('Score', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  player_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  game_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  answer_given: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  correct: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  time_taken: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
}, {
  tableName: 'scores'
});

module.exports = Score;
