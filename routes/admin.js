const express = require('express');
const db = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, adminOnly);

// Get all students
router.get('/students', (req, res) => {
  const students = db.prepare('SELECT id, name, student_id, email, phone, status, payment_status, payment_amount, created_at FROM users WHERE role = ?').all('student');
  res.json(students);
});

// Update student status (approve/reject)
router.patch('/students/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE users SET status = ? WHERE id = ? AND role = ?').run(status, req.params.id, 'student');
  res.json({ message: 'Status updated' });
});

// Update payment status
router.patch('/students/:id/payment', (req, res) => {
  const { payment_status, payment_amount } = req.body;
  db.prepare('UPDATE users SET payment_status = ?, payment_amount = ? WHERE id = ?').run(payment_status, payment_amount || 0, req.params.id);
  res.json({ message: 'Payment updated' });
});

// Get dashboard stats
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('student');
  const approved = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ?').get('student', 'approved');
  const pending = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ?').get('student', 'pending');
  const paid = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND payment_status = ?').get('student', 'paid');
  const totalRevenue = db.prepare('SELECT SUM(payment_amount) as total FROM users WHERE role = ?').get('student');

  res.json({
    total: total.count,
    approved: approved.count,
    pending: pending.count,
    paid: paid.count,
    totalRevenue: totalRevenue.total || 0
  });
});

// Update tour info
router.put('/tour-info', (req, res) => {
  const { title, destination, start_date, end_date, total_fee, description } = req.body;
  const existing = db.prepare('SELECT id FROM tour_info').get();
  if (existing) {
    db.prepare(`UPDATE tour_info SET title=?, destination=?, start_date=?, end_date=?, total_fee=?, description=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).run(title, destination, start_date, end_date, total_fee, description, existing.id);
  } else {
    db.prepare(`INSERT INTO tour_info (title, destination, start_date, end_date, total_fee, description) VALUES (?,?,?,?,?,?)`).run(title, destination, start_date, end_date, total_fee, description);
  }
  res.json({ message: 'Tour info updated' });
});

// Schedule CRUD
router.post('/schedule', (req, res) => {
  const { day_number, date, title, activities, location } = req.body;
  const result = db.prepare('INSERT INTO schedule (day_number, date, title, activities, location) VALUES (?,?,?,?,?)').run(day_number, date, title, activities, location);
  res.json({ id: result.lastInsertRowid, message: 'Schedule added' });
});

router.put('/schedule/:id', (req, res) => {
  const { day_number, date, title, activities, location } = req.body;
  db.prepare('UPDATE schedule SET day_number=?, date=?, title=?, activities=?, location=? WHERE id=?').run(day_number, date, title, activities, location, req.params.id);
  res.json({ message: 'Schedule updated' });
});

router.delete('/schedule/:id', (req, res) => {
  db.prepare('DELETE FROM schedule WHERE id = ?').run(req.params.id);
  res.json({ message: 'Schedule deleted' });
});

// Notices CRUD
router.post('/notices', (req, res) => {
  const { title, content, priority } = req.body;
  const result = db.prepare('INSERT INTO notices (title, content, priority, created_by) VALUES (?,?,?,?)').run(title, content, priority || 'normal', req.user.id);
  res.json({ id: result.lastInsertRowid, message: 'Notice posted' });
});

router.put('/notices/:id', (req, res) => {
  const { title, content, priority } = req.body;
  db.prepare('UPDATE notices SET title=?, content=?, priority=? WHERE id=?').run(title, content, priority, req.params.id);
  res.json({ message: 'Notice updated' });
});

router.delete('/notices/:id', (req, res) => {
  db.prepare('DELETE FROM notices WHERE id = ?').run(req.params.id);
  res.json({ message: 'Notice deleted' });
});

// Photos
router.delete('/photos/:id', (req, res) => {
  const photo = db.prepare('SELECT filename FROM photos WHERE id = ?').get(req.params.id);
  if (photo) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../uploads', photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
  }
  res.json({ message: 'Photo deleted' });
});

module.exports = router;
