const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QuizAnswer = sequelize.define('QuizAnswer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  event_id: { type: DataTypes.INTEGER, allowNull: false },
  question_index: { type: DataTypes.INTEGER, allowNull: false },
  question_text: { type: DataTypes.TEXT, allowNull: true },
  correct_answer: { type: DataTypes.STRING(500), allowNull: false }
}, { tableName: 'quiz_answers' });

module.exports = QuizAnswer;
