const Player = require('../models/Player');
const Score = require('../models/Score');
const Event = require('../models/Event');
const PriceCheckItem = require('../models/PriceCheckItem');
const QuizAnswer = require('../models/QuizAnswer');

module.exports = (io, socket) => {

  // ─── Host starts a game ───────────────────────────────────────────
  socket.on('start_game', async ({ room_code, game_name }) => {
    try {
      const event = await Event.findOne({ where: { room_code } });
      if (!event) return;
      await event.update({ current_game: game_name, status: 'active', current_question_index: 0 });
      io.to(room_code).emit('game_started', { game_name, event_type: event.event_type });
      console.log(`🎮 ${game_name} started in ${room_code}`);
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  // ─── Host sends a question (Who Knows Best) ───────────────────────
  socket.on('next_question', async ({ room_code, question_index, question }) => {
    try {
      const event = await Event.findOne({ where: { room_code } });
      if (!event) return;
      await event.update({ current_question_index: question_index });
      io.to(room_code).emit('question_show', { question_index, question, timestamp: Date.now() });
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  // ─── Player submits a text answer (WKB / Emojinary / Word Scramble)
  socket.on('submit_answer', async ({ player_id, event_id, game_name, question_index, answer, is_correct, points }) => {
    try {
      // For emojinary and word_scramble the client already checked correctness
      let score = 0;
      let correct = false;

      if (game_name === 'emojinary' || game_name === 'word_scramble') {
        // Trust client-side result (answers checked locally against game data)
        correct = !!is_correct;
        score = correct ? (game_name === 'emojinary' ? 150 : 100) : 0;
      } else if (game_name === 'who_knows_best') {
        const quizAnswer = await QuizAnswer.findOne({ where: { event_id, question_index } });
        if (quizAnswer) {
          const ca = quizAnswer.correct_answer.toLowerCase().trim();
          const pa = (answer || '').toLowerCase().trim();
          correct = ca === pa || ca.includes(pa) || pa.includes(ca);
          score = correct ? 100 : 0;
        }
      }

      // Persist score record
      await Score.create({ player_id, event_id, game_name, score, answer_given: String(answer), correct });

      // Update running total
      if (score > 0) {
        const player = await Player.findByPk(player_id);
        if (player) await player.update({ total_score: player.total_score + score });
      }

      socket.emit('answer_received', { correct, score, question_index });

      // Broadcast updated leaderboard to the room
      const event = await Event.findByPk(event_id);
      if (event) {
        const players = await Player.findAll({
          where: { event_id, is_active: true },
          order: [['total_score', 'DESC']],
          attributes: ['id', 'name', 'total_score', 'avatar_color']
        });
        io.to(event.room_code).emit('leaderboard_update', { players });
      }
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  // ─── Player submits a price guess ────────────────────────────────
  socket.on('submit_price', async ({ player_id, event_id, item_index, item_name, guessed_price }) => {
    try {
      const priceItem = await PriceCheckItem.findOne({ where: { event_id, display_order: item_index } });
      let score = 10;
      let difference = null;

      if (priceItem && parseFloat(priceItem.real_price) > 0) {
        const real = parseFloat(priceItem.real_price);
        const guess = parseFloat(guessed_price);
        difference = Math.abs(real - guess);
        const pct = difference / real;

        if (difference === 0)     score = 200;
        else if (pct <= 0.05)     score = 175;
        else if (pct <= 0.10)     score = 150;
        else if (pct <= 0.20)     score = 100;
        else if (pct <= 0.30)     score = 50;
        else                      score = 10;

        await Score.create({
          player_id, event_id,
          game_name: 'price_check',
          score,
          answer_given: String(guessed_price),
          correct: difference === 0
        });

        const player = await Player.findByPk(player_id);
        if (player) await player.update({ total_score: player.total_score + score });
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
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  // ─── Host ends a single game → show interim leaderboard ──────────
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
      console.log(`🏁 ${game_name} ended in ${room_code}`);
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  // ─── Host ends entire event → final podium ───────────────────────
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
      console.log(`🎉 Event finished in ${room_code}`);
    } catch (e) { socket.emit('error', { message: e.message }); }
  });
};
