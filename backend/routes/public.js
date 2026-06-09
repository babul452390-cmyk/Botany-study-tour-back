const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only images allowed'));
}});

// Tour info
router.get('/tour-info', (req, res) => {
  const info = db.prepare('SELECT * FROM tour_info ORDER BY id DESC LIMIT 1').get();
  res.json(info || {});
});

// Schedule
router.get('/schedule', (req, res) => {
  const schedule = db.prepare('SELECT * FROM schedule ORDER BY day_number ASC').all();
  res.json(schedule);
});

// Notices
router.get('/notices', (req, res) => {
  const notices = db.prepare('SELECT * FROM notices ORDER BY created_at DESC').all();
  res.json(notices);
});

// Photos
router.get('/photos', (req, res) => {
  const photos = db.prepare(`
    SELECT p.*, u.name as uploader_name 
    FROM photos p LEFT JOIN users u ON p.uploaded_by = u.id 
    ORDER BY p.uploaded_at DESC
  `).all();
  res.json(photos);
});

// Upload photo (any approved user)
router.post('/photos', authMiddleware, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'কোনো ছবি নির্বাচন করা হয়নি' });
  const result = db.prepare('INSERT INTO photos (filename, caption, uploaded_by) VALUES (?,?,?)').run(req.file.filename, req.body.caption || '', req.user.id);
  res.json({ id: result.lastInsertRowid, filename: req.file.filename, message: 'ছবি আপলোড সফল' });
});

// Participants list (approved students)
router.get('/participants', (req, res) => {
  const participants = db.prepare('SELECT id, name, student_id, payment_status FROM users WHERE role = ? AND status = ? ORDER BY name').all('student', 'approved');
  res.json(participants);
});

module.exports = router;
