import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaMusic } from 'react-icons/fa';
import TrackCard from '../components/TrackCard';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/library.css';

function Library() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [activeTab, setActiveTab] = useState('playlists');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    Promise.all([
      api.get(`/playlists?user_id=${user.id}`),
      api.get(`/users/${user.username}/likes`),
    ]).then(([playlistsData, likesData]) => {
      setPlaylists(playlistsData);
      setLikedTracks(likesData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, navigate]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;
    const playlist = await api.post('/playlists', { title: newPlaylistTitle });
    setPlaylists(prev => [playlist, ...prev]);
    setNewPlaylistTitle('');
    setShowCreateModal(false);
  };

  if (!user) return null;
  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="library-page">
      <h1>Your Library</h1>

      <div className="library-tabs">
        <button className={activeTab === 'playlists' ? 'active' : ''} onClick={() => setActiveTab('playlists')}>
          Playlists
        </button>
        <button className={activeTab === 'likes' ? 'active' : ''} onClick={() => setActiveTab('likes')}>
          Liked Tracks ({likedTracks.length})
        </button>
      </div>

      {activeTab === 'playlists' && (
        <div className="playlists-section">
          <button className="create-playlist-btn" onClick={() => setShowCreateModal(true)}>
            <FaPlus /> New Playlist
          </button>

          <div className="playlists-grid">
            {playlists.map(playlist => (
              <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="playlist-card">
                <div className="playlist-cover">
                  {playlist.cover_url ? (
                    <img src={playlist.cover_url} alt={playlist.title} />
                  ) : (
                    <div className="playlist-cover-placeholder"><FaMusic /></div>
                  )}
                </div>
                <h3>{playlist.title}</h3>
                <p>{playlist.tracks_count} tracks</p>
              </Link>
            ))}
          </div>

          {playlists.length === 0 && (
            <p className="empty-message">No playlists yet. Create one!</p>
          )}
        </div>
      )}

      {activeTab === 'likes' && (
        <div className="tracks-list">
          {likedTracks.map(track => (
            <TrackCard key={track.id} track={track} trackList={likedTracks} />
          ))}
          {likedTracks.length === 0 && <p className="empty-message">No liked tracks yet</p>}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create Playlist</h2>
            <form onSubmit={handleCreatePlaylist}>
              <input
                type="text"
                placeholder="Playlist name"
                value={newPlaylistTitle}
                onChange={e => setNewPlaylistTitle(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Library;
