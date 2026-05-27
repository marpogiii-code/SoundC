import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaPlay, FaPause, FaHeart, FaRetweet, FaShare } from 'react-icons/fa';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { formatTime, formatCount, formatDate } from '../utils/helpers';
import api from '../utils/api';
import '../styles/trackpage.css';

function TrackPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { currentTrack, isPlaying, playTrack, pauseTrack } = usePlayer();
  const [track, setTrack] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  const isCurrentTrack = currentTrack?.id === id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  useEffect(() => {
    Promise.all([
      api.get(`/tracks/${id}`),
      api.get(`/comments/track/${id}`),
    ]).then(([trackData, commentsData]) => {
      setTrack(trackData);
      setComments(commentsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handlePlay = () => {
    if (isTrackPlaying) pauseTrack();
    else playTrack(track, [track]);
  };

  const handleLike = async () => {
    if (!user) return;
    const data = await api.post(`/tracks/${id}/like`);
    setTrack(prev => ({ ...prev, is_liked: data.liked, likes_count: data.likes_count }));
  };

  const handleRepost = async () => {
    if (!user) return;
    await api.post(`/tracks/${id}/repost`);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    const comment = await api.post('/comments', { track_id: id, body: commentText });
    setComments(prev => [comment, ...prev]);
    setCommentText('');
    setTrack(prev => ({ ...prev, comments_count: prev.comments_count + 1 }));
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!track) return <div className="error">Track not found</div>;

  return (
    <div className="track-page">
      <div className="track-hero">
        <div className="track-hero-info">
          <button className="big-play-btn" onClick={handlePlay}>
            {isTrackPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <div>
            <h1>{track.title}</h1>
            <Link to={`/user/${track.username}`} className="artist-name">
              {track.display_name || track.username}
            </Link>
            <div className="track-meta-info">
              {track.genre && <span className="genre-badge">{track.genre}</span>}
              <span>{formatDate(track.created_at)}</span>
              <span>{formatTime(track.duration)}</span>
            </div>
          </div>
        </div>
        <div className="track-hero-cover">
          {track.cover_url ? (
            <img src={track.cover_url} alt={track.title} />
          ) : (
            <div className="cover-placeholder-large">
              <div className="waveform-visual">
                {[...Array(40)].map((_, i) => (
                  <div key={i} className="waveform-bar" style={{ height: `${20 + Math.random() * 60}%` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="track-actions">
        <button className={`action-btn ${track.is_liked ? 'active' : ''}`} onClick={handleLike}>
          <FaHeart /> {formatCount(track.likes_count)}
        </button>
        <button className="action-btn" onClick={handleRepost}>
          <FaRetweet /> {formatCount(track.reposts_count)}
        </button>
        <button className="action-btn" onClick={() => navigator.clipboard.writeText(window.location.href)}>
          <FaShare /> Share
        </button>
      </div>

      <div className="track-content">
        <div className="track-main">
          {track.description && (
            <div className="track-description">
              <p>{track.description}</p>
            </div>
          )}

          <div className="comments-section">
            <h3>{formatCount(track.comments_count)} Comments</h3>

            {user && (
              <form className="comment-form" onSubmit={handleComment}>
                <img src={user.avatar_url || ''} alt="" className="comment-avatar" />
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="submit" disabled={!commentText.trim()}>Post</button>
              </form>
            )}

            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <Link to={`/user/${comment.username}`}>
                    <img src={comment.user_avatar || ''} alt="" className="comment-avatar" />
                  </Link>
                  <div className="comment-body">
                    <div className="comment-header">
                      <Link to={`/user/${comment.username}`} className="comment-author">
                        {comment.display_name || comment.username}
                      </Link>
                      {comment.timestamp_at > 0 && (
                        <span className="comment-time">at {formatTime(comment.timestamp_at)}</span>
                      )}
                    </div>
                    <p>{comment.body}</p>
                    <span className="comment-date">{formatDate(comment.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="track-sidebar">
          <div className="stats-box">
            <div className="stat-item">
              <span className="stat-value">{formatCount(track.plays_count)}</span>
              <span className="stat-label">Plays</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatCount(track.likes_count)}</span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatCount(track.reposts_count)}</span>
              <span className="stat-label">Reposts</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatCount(track.comments_count)}</span>
              <span className="stat-label">Comments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrackPage;
