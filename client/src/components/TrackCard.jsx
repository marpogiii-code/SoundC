import { Link } from 'react-router-dom';
import { FaPlay, FaPause, FaHeart, FaComment, FaRetweet } from 'react-icons/fa';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { formatCount, formatTime, formatDate } from '../utils/helpers';
import api from '../utils/api';
import '../styles/trackcard.css';

function TrackCard({ track, trackList = [], onLikeToggle }) {
  const { currentTrack, isPlaying, playTrack, pauseTrack } = usePlayer();
  const { user } = useAuth();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlayClick = () => {
    if (isTrackPlaying) {
      pauseTrack();
    } else {
      playTrack(track, trackList);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const data = await api.post(`/tracks/${track.id}/like`);
      if (onLikeToggle) onLikeToggle(track.id, data.liked, data.likes_count);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  return (
    <div className={`track-card ${isCurrentTrack ? 'active' : ''}`}>
      <div className="track-cover" onClick={handlePlayClick}>
        {track.cover_url ? (
          <img src={track.cover_url} alt={track.title} />
        ) : (
          <div className="cover-placeholder">
            <div className="cover-wave" />
          </div>
        )}
        <div className="play-overlay">
          {isTrackPlaying ? <FaPause /> : <FaPlay />}
        </div>
      </div>

      <div className="track-info">
        <Link to={`/user/${track.username}`} className="track-artist">
          {track.display_name || track.username}
        </Link>
        <Link to={`/track/${track.id}`} className="track-title">
          {track.title}
        </Link>
        <div className="track-meta">
          {track.genre && <span className="track-genre">{track.genre}</span>}
          <span className="track-date">{formatDate(track.created_at)}</span>
        </div>
        <div className="track-stats">
          <span className="stat plays">{formatCount(track.plays_count)} plays</span>
          <button className={`stat-btn ${track.is_liked ? 'liked' : ''}`} onClick={handleLike}>
            <FaHeart /> {formatCount(track.likes_count)}
          </button>
          <span className="stat"><FaComment /> {formatCount(track.comments_count)}</span>
          <span className="stat"><FaRetweet /> {formatCount(track.reposts_count)}</span>
        </div>
      </div>

      <div className="track-duration">{formatTime(track.duration)}</div>
    </div>
  );
}

export default TrackCard;
