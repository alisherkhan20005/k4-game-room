const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { sequelize, connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const initSockets = require('./sockets/index');

// Models (must import before associations)
const Event = require('./models/Event');
const Player = require('./models/Player');
const Score = require('./models/Score');
const PriceCheckItem = require('./models/PriceCheckItem');
const QuizAnswer = require('./models/QuizAnswer');

// ─── Sequelize Associations ───────────────────────────────────────────
Event.hasMany(Player, { foreignKey: 'event_id', onDelete: 'CASCADE' });
Player.belongsTo(Event, { foreignKey: 'event_id' });

Event.hasMany(Score, { foreignKey: 'event_id', onDelete: 'CASCADE' });
Score.belongsTo(Event, { foreignKey: 'event_id' });

Player.hasMany(Score, { foreignKey: 'player_id', onDelete: 'CASCADE' });
Score.belongsTo(Player, { foreignKey: 'player_id' });

Event.hasMany(PriceCheckItem, { foreignKey: 'event_id', onDelete: 'CASCADE' });
PriceCheckItem.belongsTo(Event, { foreignKey: 'event_id' });

Event.hasMany(QuizAnswer, { foreignKey: 'event_id', onDelete: 'CASCADE' });
QuizAnswer.belongsTo(Event, { foreignKey: 'event_id' });

// Routes
const adminRoutes = require('./routes/admin');
const eventRoutes = require('./routes/events');
const gameRoutes = require('./routes/games');
const playerRoutes = require('./routes/players');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: { origin: process.env.NODE_ENV === 'production' ? false : '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Rate limit
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Static files
const clientPublic = path.join(__dirname, '../client/public');
app.use(express.static(clientPublic));
app.use('/css', express.static(path.join(__dirname, '../client/css')));
app.use('/js',  express.static(path.join(__dirname, '../client/js')));

// API Routes
app.use('/api/admin',   adminRoutes);
app.use('/api/events',  eventRoutes);
app.use('/api/games',   gameRoutes);
app.use('/api/players', playerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'K4 Game Room is running!', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Admin redirect
app.get('/admin',  (req, res) => res.redirect('/admin/login.html'));
app.get('/admin/', (req, res) => res.redirect('/admin/login.html'));

// SPA catch-all
app.get('*', (req, res) => res.sendFile(path.join(clientPublic, 'index.html')));

// Error handler
app.use(errorHandler);

// Sockets
initSockets(io);

// Boot
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`\n🚀 K4 Game Room running on port ${PORT}`);
      console.log(`🎮 Players:  http://localhost:${PORT}/`);
      console.log(`🎛️  Admin:    http://localhost:${PORT}/admin\n`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
};

startServer();
