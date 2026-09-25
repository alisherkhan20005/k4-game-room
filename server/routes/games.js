const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const PriceCheckItem = require('../models/PriceCheckItem');

// GET /api/games/:room_code/:game_name
router.get('/:room_code/:game_name', async (req, res) => {
  try {
    const { room_code, game_name } = req.params;

    const event = await Event.findOne({
      where: { room_code: room_code.toUpperCase() },
      attributes: ['id', 'event_type', 'celebrant_name']
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const eventType = event.event_type;
    const celebrantName = event.celebrant_name;
    let gameData;

    switch (game_name) {
      case 'who_knows_best': {
        const d = require(`../data/${eventType}/who-knows-best`);
        gameData = {
          ...d,
          title: (d.title || '').replace(/\[CELEBRANT\]/g, celebrantName),
          subtitle: (d.subtitle || '').replace(/\[CELEBRANT\]/g, celebrantName),
          questions: d.questions.map(q => ({
            ...q,
            text: q.text.replace(/\[CELEBRANT\]/g, celebrantName)
          }))
        };
        break;
      }
      case 'emojinary': {
        gameData = require(`../data/${eventType}/emojinary`);
        break;
      }
      case 'price_check': {
        const base = require(`../data/${eventType}/price-check`);
        const saved = await PriceCheckItem.findAll({
          where: { event_id: event.id },
          order: [['display_order', 'ASC']]
        });
        gameData = {
          ...base,
          title: (base.title || '').replace(/\[CELEBRANT\]/g, celebrantName),
          subtitle: (base.subtitle || '').replace(/\[CELEBRANT\]/g, celebrantName),
          label: base.insert_label || base.label || celebrantName,
          items: saved.length > 0
            ? saved.map(i => ({ name: i.item_name, emoji: i.item_emoji, real_price: i.real_price }))
            : base.items.map(i => ({ ...i, real_price: i.real_price || 0 }))
        };
        break;
      }
      case 'first_impressions': {
        const d = require(`../data/${eventType}/first-impressions`);
        // Normalise: expose as 'clues' regardless of internal key
        gameData = {
          title: d.title,
          subtitle: d.subtitle,
          instructions: d.instructions || 'Tap a square when you find someone who matches. Get 5 in a row and show the host!',
          clues: d.clues || d.grid || []
        };
        break;
      }
      case 'word_scramble': {
        gameData = require(`../data/${eventType}/word-scramble`);
        break;
      }
      default:
        return res.status(400).json({ success: false, message: 'Invalid game name' });
    }

    res.json({
      success: true,
      data: {
        game_name,
        event_type: eventType,
        celebrant_name: celebrantName,
        game: gameData
      }
    });
  } catch (error) {
    console.error('Games route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
