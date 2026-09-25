const Player        = require('../models/Player');
const Score         = require('../models/Score');
const Event         = require('../models/Event');
const PriceCheckItem= require('../models/PriceCheckItem');
const QuizAnswer    = require('../models/QuizAnswer');

module.exports = (io, socket) => {

  // ─── Host starts a game ───────────────────────────────────────────
  socket.on('start_game', async ({ room_code, game_name }) => {
    try {
      const event = await Event.findOne({ where: { room_code } });
      if(!event) return;
      await event.update({ current_game: game_name, status: 'active', current_question_index: 0 });
      io.to(room_code).emit('game_started', { game_name, event_type: event.event_type });
      console.log(`🎮 ${game_name} started in ${room_code}`);
    } catch(e) { socket.emit('error', { message: e.message }); }
  });

  // ─── Host sends a question (Who Knows Best) ───────────────────────
  socket.on('next_question', async ({ room_code, question_index, question }) => {
    try {
      const event = await Event.findOne({ where: { room_code } });
      if(!event) return;
      await event.update({ current_question_index: question_index });
      io.to(room_code).emit('question_show', { question_index, question, timestamp: Date.now() });
    } catch(e) { socket.emit('error', { message: e.message }); }
  });

  // ─── Player submits a text answer ─────────────────────────────────
  socket.on('submit_answer', async ({ player_id, event_id, game_name, question_index, answer, is_correct }) => {
    try {
      let score   = 0;
      let correct = false;

      if(game_name === 'emojinary') {
        correct = !!is_correct;
        score   = correct ? 150 : 0;
      } else if(game_name === 'word_scramble') {
        correct = !!is_correct;
        score   = correct ? 100 : 0;
      } else if(game_name === 'who_knows_best') {
        const qa = await QuizAnswer.findOne({ where: { event_id, question_index } });
        if(qa) {
          const ca = qa.correct_answer.toLowerCase().replace(/[^a-z0-9]/g,'');
          const pa = (answer||'').toLowerCase().replace(/[^a-z0-9]/g,'');
          correct = ca===pa || ca.includes(pa) || pa.includes(ca);
          score   = correct ? 100 : 0;
        } else {
          // no pre-defined answer — give points for attempting
          score = answer?.trim() ? 50 : 0;
          correct = !!answer?.trim();
        }
      }

      await Score.create({ player_id, event_id, game_name, score, answer_given: String(answer||''), correct });

      if(score > 0) {
        const player = await Player.findByPk(player_id);
        if(player) {
          const newTotal = (player.total_score||0) + score;
          await player.update({ total_score: newTotal });
          socket.emit('score_update', { player_id, total_score: newTotal });
        }
      }

      socket.emit('answer_received', { correct, score, question_index });
      await broadcastLeaderboard(io, event_id);
    } catch(e) { socket.emit('error', { message: e.message }); }
  });

  // ─── Player submits a price ────────────────────────────────────────
  socket.on('submit_price', async ({ player_id, event_id, item_index, item_name, guessed_price }) => {
    try {
      const priceItem = await PriceCheckItem.findOne({ where: { event_id, display_order: item_index } });
      let score = 5;
      let difference = null;

      if(priceItem && priceItem.real_price != null) {
        const real = parseFloat(priceItem.real_price);
        const guess= parseFloat(guessed_price);
        difference  = Math.abs(real - guess);
        const pct   = difference / real;

        if(difference === 0)    score = 300;
        else if(difference <=1) score = 200;
        else if(difference <=3) score = 150;
        else if(pct <= 0.05)    score = 120;
        else if(pct <= 0.10)    score = 100;
        else if(pct <= 0.20)    score = 75;
        else if(pct <= 0.30)    score = 50;
        else                    score = 10;
      }

      await Score.create({ player_id, event_id, game_name:'price_check', score, answer_given:String(guessed_price), correct: difference===0 });
      const player = await Player.findByPk(player_id);
      if(player) {
        const newTotal = (player.total_score||0) + score;
        await player.update({ total_score: newTotal });
        socket.emit('score_update', { player_id, total_score: newTotal });
      }

      socket.emit('price_result', { score, difference: difference?.toFixed(2), item_name });
      await broadcastLeaderboard(io, event_id);
    } catch(e) { socket.emit('error', { message: e.message }); }
  });

  // ─── Host ends a single game ──────────────────────────────────────
  socket.on('end_game', async ({ room_code, game_name }) => {
    try {
      const event = await Event.findOne({ where: { room_code } });
      if(!event) return;
      const players = await Player.findAll({
        where: { event_id: event.id, is_active: true },
        order: [['total_score','DESC']],
        attributes: ['id','name','total_score','avatar_color']
      });
      io.to(room_code).emit('game_ended', { game_name, scores: players });
      console.log(`🏁 ${game_name} ended in ${room_code}`);
    } catch(e) { socket.emit('error', { message: e.message }); }
  });

  // ─── Host ends entire event ───────────────────────────────────────
  socket.on('end_event', async ({ room_code }) => {
    try {
      const event = await Event.findOne({ where: { room_code } });
      if(!event) return;
      await event.update({ status: 'finished' });
      const players = await Player.findAll({
        where: { event_id: event.id, is_active: true },
        order: [['total_score','DESC']],
        attributes: ['id','name','total_score','avatar_color']
      });
      io.to(room_code).emit('final_results', { scores: players });
      console.log(`🎉 Event finished in ${room_code}`);
    } catch(e) { socket.emit('error', { message: e.message }); }
  });
};

async function broadcastLeaderboard(io, event_id) {
  const event = await Event.findByPk(event_id);
  if(!event) return;
  const players = await Player.findAll({
    where: { event_id, is_active: true },
    order: [['total_score','DESC']],
    attributes: ['id','name','total_score','avatar_color']
  });
  io.to(event.room_code).emit('players_updated', { players });
}
