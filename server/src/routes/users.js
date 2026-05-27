const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

const router = express.Router();

// Get user profile
router.get('/:username', optionalAuth, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, display_name, bio, avatar_url, header_url, followers_count, following_count, created_at
      FROM users WHERE username = ?
    `).get(req.params.username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tracks_count = db.prepare('SELECT COUNT(*) as count FROM tracks WHERE user_id = ?').get(user.id).count;
    user.tracks_count = tracks_count;

    if (req.user) {
      const following = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, user.id);
      user.is_following = !!following;
    }

    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user tracks
router.get('/:username/tracks', optionalAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = `
      SELECT t.*, u.username, u.display_name, u.avatar_url as user_avatar
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      WHERE t.user_id = ?
    `;

    if (!req.user || req.user.id !== user.id) {
      query += ' AND t.is_public = 1';
    }
    query += ' ORDER BY t.created_at DESC';

    const tracks = db.prepare(query).all(user.id);
    res.json(tracks);
  } catch (err) {
    console.error('Get user tracks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user likes
router.get('/:username/likes', (req, res) => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tracks = db.prepare(`
      SELECT t.*, u.username, u.display_name, u.avatar_url as user_avatar
      FROM likes l
      JOIN tracks t ON l.track_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE l.user_id = ? AND t.is_public = 1
      ORDER BY l.created_at DESC
    `).all(user.id);

    res.json(tracks);
  } catch (err) {
    console.error('Get user likes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow/unfollow user
router.post('/:username/follow', authenticate, (req, res) => {
  try {
    const targetUser = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, targetUser.id);

    if (existing) {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user.id, targetUser.id);
      db.prepare('UPDATE users SET followers_count = followers_count - 1 WHERE id = ?').run(targetUser.id);
      db.prepare('UPDATE users SET following_count = following_count - 1 WHERE id = ?').run(req.user.id);
      return res.json({ following: false });
    }

    db.prepare('INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)').run(uuidv4(), req.user.id, targetUser.id);
    db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(targetUser.id);
    db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(req.user.id);

    res.json({ following: true });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile/update', authenticate, (req, res) => {
  try {
    const { display_name, bio } = req.body;
    db.prepare('UPDATE users SET display_name = ?, bio = ? WHERE id = ?').run(
      display_name || '',
      bio || '',
      req.user.id
    );

    const user = db.prepare('SELECT id, username, email, display_name, bio, avatar_url, header_url, followers_count, following_count, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload avatar
router.post('/profile/avatar', authenticate, (req, res, next) => {
  req.uploadType = 'avatars';
  next();
}, uploadImage.single('avatar'), (req, res) => {
  try {
    const avatar_url = `/uploads/avatars/${req.file.filename}`;
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatar_url, req.user.id);
    res.json({ avatar_url });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get followers
router.get('/:username/followers', (req, res) => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followers = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
    `).all(user.id);

    res.json(followers);
  } catch (err) {
    console.error('Get followers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get following
router.get('/:username/following', (req, res) => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const following = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
    `).all(user.id);

    res.json(following);
  } catch (err) {
    console.error('Get following error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
