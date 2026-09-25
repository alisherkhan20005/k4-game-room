const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const Event = require('../models/Event');
const Player = require('../models/Player');
const Score = require('../models/Score');
const PriceCheckItem = require('../models/PriceCheckItem');
const QuizAnswer = require('../models/QuizAnswer');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Generate unique 6-character room code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// POST /api/events/create - Create new event (admin only)
router.post('/create', authenticateAdmin, async (req, res) => {
  try {
    const { event_type, celebrant_name, host_password } = req.body;

    if (!event_type || !celebrant_name || !host_password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Generate unique room code
    let room_code;
    let isUnique = false;
    while (!isUnique) {
      room_code = generateRoomCode();
      const existing = await Event.findOne({ where: { room_code } });
      if (!existing) isUnique = true;
    }

    const hashedPassword = await bcrypt.hash(host_password, 10);

    const event = await Event.create({
      room_code,
      event_type,
      celebrant_name,
      host_password: hashedPassword,
      status: 'waiting'
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        id: event.id,
        room_code: event.room_code,
        event_type: event.event_type,
        celebrant_name: event.celebrant_name,
        status: event.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/all - Get all events (admin)
router.get('/all', authenticateAdmin, async (req, res) => {
  try {
    const events = await Event.findAll({
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['host_password'] }
    });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/:room_code - Get event by room code (public join)
router.get('/:room_code', async (req, res) => {
  try {
    const event = await Event.findOne({
      where: { room_code: req.params.room_code.toUpperCase() },
      attributes: { exclude: ['host_password'] }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found. Check your room code.' });
    }

    if (event.status === 'finished') {
      return res.status(400).json({ success: false, message: 'This event has ended.' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/events/:id/status - Update event status (admin)
router.put('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, current_game } = req.body;
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await event.update({ status, current_game });
    res.json({ success: true, message: 'Event updated', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/events/:id/prices - Host saves price check answers
router.post('/:id/prices', authenticateAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    const event_id = req.params.id;

    // Delete existing prices for this event
    await PriceCheckItem.destroy({ where: { event_id } });

    // Insert new prices
    const priceItems = items.map(item => ({ ...item, event_id }));
    await PriceCheckItem.bulkCreate(priceItems);

    res.json({ success: true, message: 'Prices saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/events/:id/quiz-answers - Host saves quiz correct answers
router.post('/:id/quiz-answers', authenticateAdmin, async (req, res) => {
  try {
    const { answers } = req.body;
    const event_id = req.params.id;

    await QuizAnswer.destroy({ where: { event_id } });

    const quizAnswers = answers.map(a => ({ ...a, event_id }));
    await QuizAnswer.bulkCreate(quizAnswers);

    res.json({ success: true, message: 'Quiz answers saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/events/:id/leaderboard - Get event leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const players = await Player.findAll({
      where: { event_id: req.params.id, is_active: true },
      order: [['total_score', 'DESC']],
      attributes: ['id', 'name', 'total_score', 'avatar_color']
    });

    res.json({ success: true, data: players });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/events/:id - Delete event (admin)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Event.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
