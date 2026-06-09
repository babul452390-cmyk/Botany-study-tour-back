require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/public'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Botany Tour API running 🌿' }));

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    app.get('*', (req, res) => res.sendFile(path.join(frontendBuild, 'index.html')));
  }
}

app.listen(PORT, () => {
  console.log(`🌿 Botany Tour Server running on port ${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
});
