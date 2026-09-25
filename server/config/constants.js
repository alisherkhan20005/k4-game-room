module.exports = {
  // Game names
  GAMES: {
    WHO_KNOWS_BEST: 'who_knows_best',
    EMOJI_NARY: 'emojinary',
    PRICE_CHECK: 'price_check',
    FIRST_IMPRESSIONS: 'first_impressions',
    WORD_SCRAMBLE: 'word_scramble'
  },

  // Event types
  EVENT_TYPES: {
    BRIDAL: 'bridal',
    BABY: 'baby'
  },

  // Session status
  STATUS: {
    WAITING: 'waiting',
    ACTIVE: 'active',
    FINISHED: 'finished'
  },

  // Scoring
  POINTS: {
    WHO_KNOWS_BEST: 100,
    EMOJI_NARY: 150,
    PRICE_CHECK: 200,
    WORD_SCRAMBLE: 100,
    SPEED_BONUS: 50
  },

  // Room code length
  ROOM_CODE_LENGTH: 6,

  // Max players per room
  MAX_PLAYERS: 50,

  // JWT expiry
  JWT_EXPIRY: '8h'
};
