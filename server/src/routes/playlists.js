const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get user playlists
router.get('/', optionalAuth, (req, res) => {
  try {
    const { user_id } = req.query;
    let query = `
      SELECT p.*, u.username, u.display_name, u.avatar_url as user_avatar
      FROM playlists p
      JOIN users u ON p.user_id = u.id
    `;
    const params = [];

    if (user_id) {
      query += ' WHERE p.user_id = ?';
      params.push(user_id);
      if (!req.user || req.user.id !== user_id) {
        query += ' AND p.is_public = 1';
      }
    } else {
      query += ' WHERE p.is_public = 1';
    }

    query += ' ORDER BY p.created_at DESC';
    const playlists = db.prepare(query).all(...params);
    res.json(playlists);
  } catch (err) {
    console.error('Get playlists error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single playlist with tracks
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const playlist = db.prepare(`
      SELECT p.*, u.username, u.display_name, u.avatar_url as user_avatar
      FROM playlists p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const tracks = db.prepare(`
      SELECT t.*, u.username, u.display_name, u.avatar_url as user_avatar, pt.position
      FROM playlist_tracks pt
      JOIN tracks t ON pt.track_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE pt.playlist_id = ?
      ORDER BY pt.position ASC
    `).all(req.params.id);

    res.json({ ...playlist, tracks });
  } catch (err) {
    console.error('Get playlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create playlist
router.post('/', authenticate, (req, res) => {
  try {
    const { title, description, is_public } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO playlists (id, user_id, title, description, is_public)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user.id, title, description || '', is_public !== false ? 1 : 0);

    const playlist = db.prepare(`
      SELECT p.*, u.username, u.display_name
      FROM playlists p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(id);

    res.status(201).json(playlist);
  } catch (err) {
    console.error('Create playlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add track to playlist
router.post('/:id/tracks', authenticate, (req, res) => {
  try {
    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found or unauthorized' });
    }

    const { track_id } = req.body;
    const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(track_id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const maxPos = db.prepare('SELECT MAX(position) as max FROM playlist_tracks WHERE playlist_id = ?').get(req.params.id);
    const position = (maxPos.max || 0) + 1;

    db.prepare('INSERT INTO playlist_tracks (id, playlist_id, track_id, position) VALUES (?, ?, ?, ?)').run(uuidv4(), req.params.id, track_id, position);
    db.prepare('UPDATE playlists SET tracks_count = tracks_count + 1 WHERE id = ?').run(req.params.id);

    res.json({ message: 'Track added to playlist' });
  } catch (err) {
    console.error('Add track to playlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove track from playlist
router.delete('/:id/tracks/:trackId', authenticate, (req, res) => {
  try {
    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found or unauthorized' });
    }

    db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(req.params.id, req.params.trackId);
    db.prepare('UPDATE playlists SET tracks_count = tracks_count - 1 WHERE id = ?').run(req.params.id);

    res.json({ message: 'Track removed from playlist' });
  } catch (err) {
    console.error('Remove track error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete playlist
router.delete('/:id', authenticate, (req, res) => {
  try {
    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found or unauthorized' });
    }

    db.prepare('DELETE FROM playlists WHERE id = ?').run(req.params.id);
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    console.error('Delete playlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
