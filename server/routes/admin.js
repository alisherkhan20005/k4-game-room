const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateAdmin } = require('../middleware/auth');
require('dotenv').config();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const token = jwt.sign(
      { role: 'admin', timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '8h' }
    );

    res.json({ success: true, token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/verify
router.get('/verify', authenticateAdmin, (req, res) => {
  res.json({ success: true, message: 'Token valid' });
});

module.exports = router;
