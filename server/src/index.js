const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const trackRoutes = require('./routes/tracks');
const playlistRoutes = require('./routes/playlists');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const audioDir = path.join(uploadDir, 'audio');
const avatarDir = path.join(uploadDir, 'avatars');
const coverDir = path.join(uploadDir, 'covers');

[uploadDir, audioDir, avatarDir, coverDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Serve client build in production
const clientBuild = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback
if (fs.existsSync(clientBuild)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// Initialize database and start server
initDB();

app.listen(PORT, () => {
  console.log(`SoundC server running on port ${PORT}`);
});

module.exports = app;
