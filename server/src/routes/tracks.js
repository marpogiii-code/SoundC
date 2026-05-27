const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadAudio, uploadImage } = require('../middleware/upload');

const router = express.Router();

// Get all tracks (feed)
router.get('/', optionalAuth, (req, res) => {
  try {
    const { page = 1, limit = 20, genre, sort = 'latest' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, u.username, u.display_name, u.avatar_url as user_avatar
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      WHERE t.is_public = 1
    `;
    const params = [];

    if (genre) {
      query += ' AND t.genre = ?';
      params.push(genre);
    }

    if (sort === 'popular') {
      query += ' ORDER BY t.plays_count DESC';
    } else if (sort === 'likes') {
      query += ' ORDER BY t.likes_count DESC';
    } else {
      query += ' ORDER BY t.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const tracks = db.prepare(query).all(...params);

    // Add liked status if user is authenticated
    if (req.user) {
      const likedTrackIds = db.prepare(
        'SELECT track_id FROM likes WHERE user_id = ?'
      ).all(req.user.id).map(l => l.track_id);

      tracks.forEach(track => {
        track.is_liked = likedTrackIds.includes(track.id);
      });
    }

    const total = db.prepare('SELECT COUNT(*) as count FROM tracks WHERE is_public = 1').get().count;

    res.json({ tracks, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Get tracks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single track
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const track = db.prepare(`
      SELECT t.*, u.username, u.display_name, u.avatar_url as user_avatar
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    if (req.user) {
      const like = db.prepare('SELECT id FROM likes WHERE user_id = ? AND track_id = ?').get(req.user.id, track.id);
      track.is_liked = !!like;
    }

    res.json(track);
  } catch (err) {
    console.error('Get track error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload track
router.post('/', authenticate, uploadAudio.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { title, description, genre, tags, duration } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const id = uuidv4();
    const audio_url = `/uploads/audio/${req.file.filename}`;

    db.prepare(`
      INSERT INTO tracks (id, user_id, title, description, genre, tags, audio_url, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, title, description || '', genre || '', tags || '', audio_url, duration || 0);

    const track = db.prepare(`
      SELECT t.*, u.username, u.display_name, u.avatar_url as user_avatar
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(id);

    res.status(201).json(track);
  } catch (err) {
    console.error('Upload track error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update track cover
router.post('/:id/cover', authenticate, (req, res, next) => {
  req.uploadType = 'covers';
  next();
}, uploadImage.single('cover'), (req, res) => {
  try {
    const track = db.prepare('SELECT * FROM tracks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found or unauthorized' });
    }

    const cover_url = `/uploads/covers/${req.file.filename}`;
    db.prepare('UPDATE tracks SET cover_url = ? WHERE id = ?').run(cover_url, req.params.id);

    res.json({ cover_url });
  } catch (err) {
    console.error('Update cover error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update track
router.put('/:id', authenticate, (req, res) => {
  try {
    const track = db.prepare('SELECT * FROM tracks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found or unauthorized' });
    }

    const { title, description, genre, tags, is_public } = req.body;
    db.prepare(`
      UPDATE tracks SET title = ?, description = ?, genre = ?, tags = ?, is_public = ?
      WHERE id = ?
    `).run(
      title || track.title,
      description !== undefined ? description : track.description,
      genre !== undefined ? genre : track.genre,
      tags !== undefined ? tags : track.tags,
      is_public !== undefined ? (is_public ? 1 : 0) : track.is_public,
      req.params.id
    );

    const updated = db.prepare(`
      SELECT t.*, u.username, u.display_name, u.avatar_url as user_avatar
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    console.error('Update track error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete track
router.delete('/:id', authenticate, (req, res) => {
  try {
    const track = db.prepare('SELECT * FROM tracks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found or unauthorized' });
    }

    db.prepare('DELETE FROM tracks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Track deleted' });
  } catch (err) {
    console.error('Delete track error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like a track
router.post('/:id/like', authenticate, (req, res) => {
  try {
    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND track_id = ?').get(req.user.id, req.params.id);
    if (existing) {
      // Unlike
      db.prepare('DELETE FROM likes WHERE user_id = ? AND track_id = ?').run(req.user.id, req.params.id);
      db.prepare('UPDATE tracks SET likes_count = likes_count - 1 WHERE id = ?').run(req.params.id);
      return res.json({ liked: false, likes_count: track.likes_count - 1 });
    }

    db.prepare('INSERT INTO likes (id, user_id, track_id) VALUES (?, ?, ?)').run(uuidv4(), req.user.id, req.params.id);
    db.prepare('UPDATE tracks SET likes_count = likes_count + 1 WHERE id = ?').run(req.params.id);

    res.json({ liked: true, likes_count: track.likes_count + 1 });
  } catch (err) {
    console.error('Like track error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Increment play count
router.post('/:id/play', (req, res) => {
  try {
    db.prepare('UPDATE tracks SET plays_count = plays_count + 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Play count error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Repost a track
router.post('/:id/repost', authenticate, (req, res) => {
  try {
    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const existing = db.prepare('SELECT id FROM reposts WHERE user_id = ? AND track_id = ?').get(req.user.id, req.params.id);
    if (existing) {
      db.prepare('DELETE FROM reposts WHERE user_id = ? AND track_id = ?').run(req.user.id, req.params.id);
      db.prepare('UPDATE tracks SET reposts_count = reposts_count - 1 WHERE id = ?').run(req.params.id);
      return res.json({ reposted: false });
    }

    db.prepare('INSERT INTO reposts (id, user_id, track_id) VALUES (?, ?, ?)').run(uuidv4(), req.user.id, req.params.id);
    db.prepare('UPDATE tracks SET reposts_count = reposts_count + 1 WHERE id = ?').run(req.params.id);

    res.json({ reposted: true });
  } catch (err) {
    console.error('Repost error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
