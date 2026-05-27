# SoundC - Music Streaming Platform

A full-stack SoundCloud-like music streaming application built with React, Express, and SQLite.

## Features

- **User Authentication** - Register, login, JWT-based sessions
- **Track Upload & Playback** - Upload audio files (MP3, WAV, OGG, FLAC, M4A, AAC) with cover art
- **Audio Player** - Global persistent player with play/pause, seek, volume, next/prev controls
- **Discover Feed** - Browse tracks by genre, sort by latest/popular/most liked
- **User Profiles** - View artist profiles, tracks, and liked tracks
- **Social Features** - Follow/unfollow users, like tracks, repost tracks
- **Comments** - Comment on tracks with timestamp support
- **Playlists** - Create and manage playlists, add/remove tracks
- **Search** - Search tracks, artists, and playlists
- **Library** - Personal library with playlists and liked tracks

## Tech Stack

- **Frontend**: React 18, React Router, Vite
- **Backend**: Express.js, better-sqlite3, JWT auth
- **Storage**: SQLite database, local file system for uploads
- **Styling**: Custom CSS with CSS variables (SoundCloud-inspired theme)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Install all dependencies
npm run install:all

# Seed the database with sample data
cd server && npm run seed && cd ..

# Start development servers (frontend + backend)
npm run dev
```

### Development URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Demo Accounts

After seeding, you can log in with any of these accounts (password: `password123`):

| Email | Username |
|-------|----------|
| nova@example.com | dj_nova |
| soul@example.com | acoustic_soul |
| beats@example.com | beat_maker |
| indie@example.com | indie_wave |
| chill@example.com | chill_vibes |

## API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Tracks
- `GET /api/tracks` - List tracks (query: page, limit, genre, sort)
- `GET /api/tracks/:id` - Get track
- `POST /api/tracks` - Upload track (multipart/form-data)
- `PUT /api/tracks/:id` - Update track
- `DELETE /api/tracks/:id` - Delete track
- `POST /api/tracks/:id/like` - Toggle like
- `POST /api/tracks/:id/play` - Increment play count
- `POST /api/tracks/:id/repost` - Toggle repost

### Users
- `GET /api/users/:username` - Get profile
- `GET /api/users/:username/tracks` - Get user tracks
- `GET /api/users/:username/likes` - Get liked tracks
- `POST /api/users/:username/follow` - Toggle follow
- `PUT /api/users/profile/update` - Update profile

### Playlists
- `GET /api/playlists` - List playlists
- `GET /api/playlists/:id` - Get playlist with tracks
- `POST /api/playlists` - Create playlist
- `POST /api/playlists/:id/tracks` - Add track to playlist
- `DELETE /api/playlists/:id/tracks/:trackId` - Remove track
- `DELETE /api/playlists/:id` - Delete playlist

### Comments
- `GET /api/comments/track/:trackId` - Get comments
- `POST /api/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment

### Search
- `GET /api/search?q=query&type=all|tracks|users|playlists` - Search

## Project Structure

```
SoundC/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React context (Auth, Player)
│   │   ├── pages/        # Page components
│   │   ├── styles/       # CSS files
│   │   └── utils/        # API helpers
│   └── index.html
├── server/               # Express backend
│   └── src/
│       ├── middleware/   # Auth, upload middleware
│       ├── routes/       # API routes
│       ├── db.js         # Database setup
│       ├── index.js      # Server entry
│       └── seed.js       # Database seeder
└── package.json          # Root package (monorepo scripts)
```

## Production Build

```bash
npm run build   # Builds the React frontend
npm start       # Starts the production server (serves API + static frontend)
```
