const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'tour.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    payment_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tour_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    total_fee REAL NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_number INTEGER NOT NULL,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    activities TEXT NOT NULL,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    caption TEXT,
    uploaded_by INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );
`);

// Insert default admin
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (name, student_id, email, phone, password, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('Admin', 'ADMIN001', 'admin@botanytour.com', '01700000000', hashedPassword, 'admin', 'approved');
  console.log('✅ Default admin created: email=admin@botanytour.com, pass=admin123');
}

// Insert sample tour info
const tourExists = db.prepare('SELECT id FROM tour_info').get();
if (!tourExists) {
  db.prepare(`
    INSERT INTO tour_info (title, destination, start_date, end_date, total_fee, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'Botany 51 Batch Industrial Study Tour',
    'Sundarbans & Cox\'s Bazar',
    '2024-12-20',
    '2024-12-25',
    3500,
    'বোটানি বিভাগের ৫১তম ব্যাচের শিল্প অধ্যয়ন সফর। আমরা সুন্দরবনের প্রাকৃতিক বনজ সম্পদ এবং কক্সবাজারের উপকূলীয় উদ্ভিদ সম্পর্কে গবেষণা করব।'
  );
}

// Insert sample schedule
const scheduleExists = db.prepare('SELECT id FROM schedule').get();
if (!scheduleExists) {
  const scheduleData = [
    [1, '2024-12-20', 'যাত্রা শুরু', 'ঢাকা থেকে রওনা, বাসে ভ্রমণ', 'ঢাকা'],
    [2, '2024-12-21', 'সুন্দরবন পরিদর্শন', 'ম্যানগ্রোভ বন গবেষণা, বন্যপ্রাণী পর্যবেক্ষণ', 'সুন্দরবন'],
    [3, '2024-12-22', 'উপকূলীয় উদ্ভিদ গবেষণা', 'সামুদ্রিক উদ্ভিদ নমুনা সংগ্রহ', 'কক্সবাজার'],
    [4, '2024-12-23', 'ইন্ডাস্ট্রি ভিজিট', 'ফার্মাসিউটিক্যাল কোম্পানি পরিদর্শন', 'কক্সবাজার'],
    [5, '2024-12-24', 'সেমিনার ও উপস্থাপনা', 'গবেষণা ফলাফল উপস্থাপন, দলীয় আলোচনা', 'কক্সবাজার'],
    [6, '2024-12-25', 'প্রত্যাবর্তন', 'ঢাকার উদ্দেশ্যে রওনা', 'ঢাকা']
  ];
  const insertSchedule = db.prepare('INSERT INTO schedule (day_number, date, title, activities, location) VALUES (?, ?, ?, ?, ?)');
  scheduleData.forEach(row => insertSchedule.run(...row));
}

// Insert sample notices
const noticeExists = db.prepare('SELECT id FROM notices').get();
if (!noticeExists) {
  db.prepare(`INSERT INTO notices (title, content, priority) VALUES (?, ?, ?)`).run(
    'ট্যুর রেজিস্ট্রেশন শুরু হয়েছে',
    'বোটানি ৫১ ব্যাচের সকল শিক্ষার্থীদের জানানো যাচ্ছে যে ইন্ডাস্ট্রিয়াল স্টাডি ট্যুরের জন্য রেজিস্ট্রেশন শুরু হয়েছে। অতিসত্বর রেজিস্ট্রেশন করুন।',
    'high'
  );
  db.prepare(`INSERT INTO notices (title, content, priority) VALUES (?, ?, ?)`).run(
    'পেমেন্ট নির্দেশিকা',
    'ট্যুর ফি ৳৩,৫০০ টাকা। পেমেন্ট করার পর রশিদ সংরক্ষণ করুন এবং Admin কে জানান।',
    'normal'
  );
}

module.exports = db;
