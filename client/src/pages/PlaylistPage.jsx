import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaPlay, FaTrash } from 'react-icons/fa';
import TrackCard from '../components/TrackCard';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/playlist.css';

function PlaylistPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/playlists/${id}`).then(data => {
      setPlaylist(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handlePlayAll = () => {
    if (playlist?.tracks?.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleRemoveTrack = async (trackId) => {
    await api.delete(`/playlists/${id}/tracks/${trackId}`);
    setPlaylist(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId),
      tracks_count: prev.tracks_count - 1,
    }));
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!playlist) return <div className="error">Playlist not found</div>;

  const isOwner = user?.id === playlist.user_id;

  return (
    <div className="playlist-page">
      <div className="playlist-header">
        <div className="playlist-cover-large">
          {playlist.cover_url ? (
            <img src={playlist.cover_url} alt={playlist.title} />
          ) : (
            <div className="playlist-cover-placeholder-large" />
          )}
        </div>
        <div className="playlist-info">
          <span className="playlist-label">Playlist</span>
          <h1>{playlist.title}</h1>
          <Link to={`/user/${playlist.username}`} className="playlist-author">
            {playlist.display_name || playlist.username}
          </Link>
          <p>{playlist.tracks_count} tracks</p>
          {playlist.description && <p className="playlist-desc">{playlist.description}</p>}
          <button className="play-all-btn" onClick={handlePlayAll} disabled={!playlist.tracks?.length}>
            <FaPlay /> Play All
          </button>
        </div>
      </div>

      <div className="playlist-tracks">
        {playlist.tracks?.map((track, idx) => (
          <div key={track.id} className="playlist-track-item">
            <span className="track-number">{idx + 1}</span>
            <TrackCard track={track} trackList={playlist.tracks} />
            {isOwner && (
              <button className="remove-track-btn" onClick={() => handleRemoveTrack(track.id)}>
                <FaTrash />
              </button>
            )}
          </div>
        ))}
        {(!playlist.tracks || playlist.tracks.length === 0) && (
          <p className="empty-message">This playlist is empty</p>
        )}
      </div>
    </div>
  );
}

export default PlaylistPage;
