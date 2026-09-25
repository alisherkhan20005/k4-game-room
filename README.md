# K4 Game Room — Kreate 4

Interactive multiplayer event platform for Bridal & Baby Shower events.

## 🚀 Quick Start

### 1. Setup Database
Create a MySQL database named `k4_game_room`, then configure `.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=k4_game_room
DB_USER=your_user
DB_PASSWORD=your_password
ADMIN_PASSWORD=kreate4admin
JWT_SECRET=your_secret_here
```

### 2. Install & Run
```bash
npm install
npm start           # production
npm run dev         # development (auto-restart)
```

### 3. Access
- **Player Join:** `http://localhost:3000`
- **Admin Panel:** `http://localhost:3000/admin/login.html`

---

## 🎮 Games

| # | Game | Type |
|---|------|------|
| 1 | First Impressions (Ice Breaker Bingo) | Player-local |
| 2 | Price Check | Live scoring |
| 3 | Who Knows Best | Host-controlled Q&A |
| 4 | Emoji-nary | Self-paced |
| 5 | Word Scramble | Self-paced |

Both **Bridal Shower** and **Baby Shower** variants are included.

---

## 🎛️ How to Host

1. Log in at `/admin/login.html`
2. Create Event → choose type, enter celebrant name
3. Share the **Room Code** with guests
4. From Game Control → set prices (Price Check) → launch games
5. For Who Knows Best: send questions one at a time
6. End each game to show live leaderboard
7. End Event for final podium & confetti 🎉

---

## 🌐 Deploy to Railway

1. Push to GitHub
2. Create Railway project → connect repo
3. Add environment variables in Railway dashboard
4. Add a MySQL plugin in Railway
5. Set `DATABASE_URL` from Railway MySQL

---

## 🏗️ Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JS
- **Backend:** Node.js + Express
- **Real-time:** Socket.io
- **Database:** MySQL + Sequelize ORM
- **Deployment:** Railway

---

Built with ❤️ for Kreate 4
