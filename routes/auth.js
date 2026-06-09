const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', (req, res) => {
  const { name, student_id, email, phone, password } = req.body;
  if (!name || !student_id || !email || !password) {
    return res.status(400).json({ error: 'সব তথ্য পূরণ করুন' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR student_id = ?').get(email, student_id);
    if (existing) return res.status(409).json({ error: 'ইমেইল বা স্টুডেন্ট আইডি ইতিমধ্যে নিবন্ধিত' });

    const hashed = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, student_id, email, phone, password)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, student_id, email, phone || '', hashed);

    res.status(201).json({ message: 'রেজিস্ট্রেশন সফল! Admin অনুমোদনের জন্য অপেক্ষা করুন।', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'সার্ভার ত্রুটি' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'ইমেইল ও পাসওয়ার্ড দিন' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'ইমেইল বা পাসওয়ার্ড ভুল' });
  }

  if (user.status === 'pending') return res.status(403).json({ error: 'আপনার অ্যাকাউন্ট এখনও অনুমোদিত হয়নি' });
  if (user.status === 'rejected') return res.status(403).json({ error: 'আপনার অ্যাকাউন্ট বাতিল করা হয়েছে' });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, student_id: user.student_id, payment_status: user.payment_status }
  });
});

// Get profile
router.get('/profile', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, student_id, email, phone, role, status, payment_status, payment_amount, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

module.exports = router;
