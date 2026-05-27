const express = require('express');
const { db } = require('../db');

const router = express.Router();

// Search tracks and users
router.get('/', (req, res) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = `%${q}%`;
    const results = {};

    if (type === 'all' || type === 'tracks') {
      results.tracks = db.prepare(`
        SELECT t.*, u.username, u.display_name, u.avatar_url as user_avatar
        FROM tracks t
        JOIN users u ON t.user_id = u.id
        WHERE t.is_public = 1 AND (t.title LIKE ? OR t.description LIKE ? OR t.genre LIKE ? OR t.tags LIKE ?)
        ORDER BY t.plays_count DESC
        LIMIT 20
      `).all(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (type === 'all' || type === 'users') {
      results.users = db.prepare(`
        SELECT id, username, display_name, avatar_url, followers_count
        FROM users
        WHERE username LIKE ? OR display_name LIKE ?
        ORDER BY followers_count DESC
        LIMIT 20
      `).all(searchTerm, searchTerm);
    }

    if (type === 'all' || type === 'playlists') {
      results.playlists = db.prepare(`
        SELECT p.*, u.username, u.display_name
        FROM playlists p
        JOIN users u ON p.user_id = u.id
        WHERE p.is_public = 1 AND (p.title LIKE ? OR p.description LIKE ?)
        ORDER BY p.tracks_count DESC
        LIMIT 20
      `).all(searchTerm, searchTerm);
    }

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
