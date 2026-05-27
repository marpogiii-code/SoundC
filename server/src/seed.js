const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { db, initDB } = require('./db');

initDB();

const users = [
  { username: 'dj_nova', email: 'nova@example.com', display_name: 'DJ Nova', bio: 'Electronic music producer from Berlin' },
  { username: 'acoustic_soul', email: 'soul@example.com', display_name: 'Acoustic Soul', bio: 'Singer-songwriter, guitar lover' },
  { username: 'beat_maker', email: 'beats@example.com', display_name: 'BeatMaker', bio: 'Hip-hop beats and instrumentals' },
  { username: 'indie_wave', email: 'indie@example.com', display_name: 'Indie Wave', bio: 'Indie rock and alternative music' },
  { username: 'chill_vibes', email: 'chill@example.com', display_name: 'Chill Vibes', bio: 'Lo-fi and ambient soundscapes' },
];

const genres = ['Electronic', 'Hip-Hop', 'Rock', 'Pop', 'Jazz', 'Classical', 'R&B', 'Ambient', 'Lo-fi', 'Indie'];

const trackTitles = [
  'Midnight Drive', 'Summer Breeze', 'Urban Jungle', 'Crystal Clear',
  'Deep Blue', 'Sunset Boulevard', 'Northern Lights', 'City Lights',
  'Ocean Waves', 'Mountain High', 'Desert Storm', 'Rainy Days',
  'Golden Hour', 'Starlight', 'Neon Dreams', 'Velvet Touch',
  'Electric Feel', 'Moonlight Sonata Remix', 'Downtown Funk', 'Cosmic Journey'
];

console.log('Seeding database...');

const password = bcrypt.hashSync('password123', 10);
const userIds = [];

for (const user of users) {
  const id = uuidv4();
  userIds.push(id);
  db.prepare(`
    INSERT OR IGNORE INTO users (id, username, email, password, display_name, bio)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, user.username, user.email, password, user.display_name, user.bio);
}

// Create tracks for each user
const trackIds = [];
for (let i = 0; i < trackTitles.length; i++) {
  const id = uuidv4();
  trackIds.push(id);
  const userId = userIds[i % userIds.length];
  const genre = genres[Math.floor(Math.random() * genres.length)];
  const duration = 120 + Math.floor(Math.random() * 240);
  const plays = Math.floor(Math.random() * 10000);
  const likes = Math.floor(Math.random() * 500);

  db.prepare(`
    INSERT INTO tracks (id, user_id, title, description, genre, audio_url, duration, plays_count, likes_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, trackTitles[i], `A ${genre.toLowerCase()} track`, genre, '/uploads/audio/sample.mp3', duration, plays, likes);
}

// Create some playlists
const playlistNames = ['Best of Electronic', 'Chill Playlist', 'Workout Mix', 'Late Night Vibes'];
for (let i = 0; i < playlistNames.length; i++) {
  const id = uuidv4();
  const userId = userIds[i % userIds.length];
  db.prepare(`
    INSERT INTO playlists (id, user_id, title, description, tracks_count)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, playlistNames[i], `A curated playlist of great tracks`, 4);

  // Add tracks to playlist
  for (let j = 0; j < 4; j++) {
    const trackIdx = (i * 4 + j) % trackIds.length;
    db.prepare(`
      INSERT INTO playlist_tracks (id, playlist_id, track_id, position)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), id, trackIds[trackIdx], j + 1);
  }
}

// Create some follows
for (let i = 0; i < userIds.length; i++) {
  for (let j = 0; j < userIds.length; j++) {
    if (i !== j && Math.random() > 0.5) {
      db.prepare('INSERT OR IGNORE INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)').run(uuidv4(), userIds[i], userIds[j]);
      db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(userIds[i]);
      db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(userIds[j]);
    }
  }
}

// Create some comments
const commentBodies = [
  'Great track!', 'Love this beat', 'Amazing production quality',
  'This is fire!', 'Beautiful melody', 'Can\'t stop listening',
  'Masterpiece', 'So smooth', 'Incredible vibes'
];

for (let i = 0; i < 30; i++) {
  const userId = userIds[Math.floor(Math.random() * userIds.length)];
  const trackId = trackIds[Math.floor(Math.random() * trackIds.length)];
  const body = commentBodies[Math.floor(Math.random() * commentBodies.length)];
  db.prepare(`
    INSERT INTO comments (id, user_id, track_id, body, timestamp_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, trackId, body, Math.floor(Math.random() * 180));
}

console.log('Database seeded successfully!');
console.log(`Created ${users.length} users (password: password123)`);
console.log(`Created ${trackTitles.length} tracks`);
console.log(`Created ${playlistNames.length} playlists`);
