const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Event = require('../models/Event');

// POST /api/players/join - Player joins event
router.post('/join', async (req, res) => {
  try {
    const { room_code, player_name } = req.body;

    if (!room_code || !player_name) {
      return res.status(400).json({ success: false, message: 'Room code and player name are required' });
    }

    const event = await Event.findOne({
      where: { room_code: room_code.toUpperCase() }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Room not found. Check your code.' });
    }

    if (event.status === 'finished') {
      return res.status(400).json({ success: false, message: 'This event has already ended.' });
    }

    // Avatar colors from K4 palette
    const avatarColors = [
      '#FFB5C8', '#B5EAD7', '#FFDAC1', '#C7CEEA',
      '#FFF1BA', '#B5D5E8', '#E2BED6', '#ACDED8', '#D4B896'
    ];
    const avatar_color = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const player = await Player.create({
      event_id: event.id,
      name: player_name.trim(),
      avatar_color,
      total_score: 0
    });

    res.status(201).json({
      success: true,
      message: 'Joined successfully!',
      data: {
        player_id: player.id,
        player_name: player.name,
        avatar_color: player.avatar_color,
        event_id: event.id,
        event_type: event.event_type,
        celebrant_name: event.celebrant_name,
        room_code: event.room_code
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
