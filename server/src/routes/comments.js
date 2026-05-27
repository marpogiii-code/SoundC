const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get comments for a track
router.get('/track/:trackId', (req, res) => {
  try {
    const comments = db.prepare(`
      SELECT c.*, u.username, u.display_name, u.avatar_url as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.track_id = ?
      ORDER BY c.created_at DESC
    `).all(req.params.trackId);

    res.json(comments);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment
router.post('/', authenticate, (req, res) => {
  try {
    const { track_id, body, timestamp_at } = req.body;

    if (!track_id || !body) {
      return res.status(400).json({ error: 'Track ID and comment body are required' });
    }

    const track = db.prepare('SELECT id FROM tracks WHERE id = ?').get(track_id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO comments (id, user_id, track_id, body, timestamp_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user.id, track_id, body, timestamp_at || 0);

    db.prepare('UPDATE tracks SET comments_count = comments_count + 1 WHERE id = ?').run(track_id);

    const comment = db.prepare(`
      SELECT c.*, u.username, u.display_name, u.avatar_url as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id);

    res.status(201).json(comment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment
router.delete('/:id', authenticate, (req, res) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE tracks SET comments_count = comments_count - 1 WHERE id = ?').run(comment.track_id);

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
