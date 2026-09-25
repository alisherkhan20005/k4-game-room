const Player = require('../models/Player');
const Score = require('../models/Score');
const Event = require('../models/Event');
const PriceCheckItem = require('../models/PriceCheckItem');
const QuizAnswer = require('../models/QuizAnswer');

module.exports = (io, socket) => {

  // Host starts a game
  socket.on('start_game', async ({ room_code, game_name }) => {
    try {
      const event = await Event.findOne({ where: { room_code } });
      if (!event) return;
      await event.update({ current_game: game_name, status: 'active', current_question_index: 0 });
      io.to(room_code).emit('game_started', { game_name, event_type: event.event_type });
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  // Host sends next question
  socket.on('next_question', async ({ room_code, question_index, question }) => {
    try {
      const event = await Event.findOne({ where: { room_code } });
      if (!event) return;
      await event.update({ current_question_index: question_index });
      io.to(room_code).emit('question_show', { question_index, question, timestamp: Date.now() });
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  // Player submits answer
  socket.on('submit_answer', async ({ player_id, event_id, game_name, question_index, answer, is_correct }) => {
    try {
      let score = 0;
      let correct = false;

      if (game_name === 'emojinary') {
        correct = is_correct === true;
        score = correct ? 150 : 0;
      } else if (game_name === 'word_scramble') {
        correct = is_correct === true;
        score = correct ? 100 : 0;
      } else if (game_name === 'who_knows_best') {
        const quizAnswer = await QuizAnswer.findOne({ where: { event_id, question_index } });
        if (quizAnswer) {
          const ca = quizAnswer.correct_answer.toLowerCase().trim();
          const pa = (answer || '').toLowerCase().trim();
          correct = ca === pa || ca.includes(pa) || pa.includes(ca);
        } else {
          // No answer set by host yet — give points anyway for participation
          correct = true;
        }
        score = correct ? 100 : 0;
      } else {
        // Default — give points
        correct = true;
        score = 100;
      }

      // Always save score record
      await Score.create({
        player_id,
        event_id,
        game_name,
        score,
        answer_given: String(answer || ''),
        correct,
        time_taken: 0
      });

      // Always update player total
      if (score > 0) {
        const player = await Player.findByPk(player_id);
        if (player) {
          await player.update({ total_score: (player.total_score || 0) + score });
        }
      }

      socket.emit('answer_received', { correct, score, question_index });

      // Broadcast leaderboard update
      const event = await Event.findByPk(event_id);
      if (event) {
        const players = await Player.findAll({
          where: { event_id, is_active: true },
          order: [['total_score', 'DESC']],
          attributes: ['id', 'name', 'total_score', 'avatar_color']
        });
        io.to(event.room_code).emit('leaderboard_update', { players });
      }
    } catch (e) {
      console.error('submit_answer error:', e.message);
      socket.emit('error', { message: e.message });
    }
  });

  // Player submits price guess
  socket.on('submit_price', async ({ player_id, event_id, item_index, item_name, guessed_price }) => {
    try {
      const priceItem = await PriceCheckItem.findOne({
        where: { event_id, display_order: item_index }
      });

      let score = 10;
      let difference = 0;

      if (priceItem && parseFloat(priceItem.real_price) > 0) {
        const real = parseFloat(priceItem.real_price);
        const guess = parseFloat(guessed_price);
        difference = Math.abs(real - guess);
        const pct = difference / real;

        if (difference === 0)   score = 200;
        else if (pct <= 0.05)   score = 175;
        else if (pct <= 0.10)   score = 150;
        else if (pct <= 0.20)   score = 100;
        else if (pct <= 0.30)   score = 50;
        else                    score = 10;
      } else {
        // No price set — give participation points
        score = 50;
      }

      await Score.create({
        player_id,
        event_id,
        game_name: 'price_check',
        score,
        answer_given: String(guessed_price),
        correct: difference === 0,
        time_taken: 0
      });

      const player = await Player.findByPk(player_id);
      if (player) {
        await player.update({ total_score: (player.total_score || 0) + score });
      }

      socket.emit('price_result', { score, difference, item_name });

      const event = await Event.findByPk(event_id);
      if (event) {
        const players = await Player.findAll({
          where: { event_id, is_active: true },
          order: [['total_score', 'DESC']],
          attributes: ['id', 'name', 'total_score', 'avatar_color']
        });
        io.to(event.room_code).emit('leaderboard_update', { players });
      }
    } catch (e) {
      console.error('submit_price error:', e.message);
      socket.emit('error', { message: e.message });
    }
  });

  // Host ends a game
  socket.on('end_game', async ({ room_code, game_name }) => {
    try {
      const event = await Event.findOne({ where: { room_code } });
      if (!event) return;
      const players = await Player.findAll({
        where: { event_id: event.id, is_active: true },
        order: [['total_score', 'DESC']],
        attributes: ['id', 'name', 'total_score', 'avatar_color']
      });
      io.to(room_code).emit('game_ended', { game_name, players });
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  // Host ends entire event
  socket.on('end_event', async ({ room_code }) => {
    try {
      const event = await Event.findOne({ where: { room_code } });
      if (!event) return;
      await event.update({ status: 'finished' });
      const players = await Player.findAll({
        where: { event_id: event.id, is_active: true },
        order: [['total_score', 'DESC']],
        attributes: ['id', 'name', 'total_score', 'avatar_color']
      });
      io.to(room_code).emit('event_finished', { players });
    } catch (e) { socket.emit('error', { message: e.message }); }
  });
};
