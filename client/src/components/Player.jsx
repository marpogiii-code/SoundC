import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '../utils/helpers';
import '../styles/player.css';

function Player() {
  const { currentTrack, isPlaying, currentTime, duration, togglePlay, seekTo, playNext, playPrev, setVolume } = usePlayer();
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);

  if (!currentTrack) return null;

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seekTo(percent * duration);
  };

  const handleVolume = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const vol = Math.max(0, Math.min(1, percent));
    setVolumeState(vol);
    setVolume(vol);
    setMuted(vol === 0);
  };

  const toggleMute = () => {
    if (muted) {
      setVolume(volume || 0.5);
      setMuted(false);
    } else {
      setVolume(0);
      setMuted(true);
    }
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player">
      <div className="player-controls">
        <button onClick={playPrev} className="player-btn">
          <FaStepBackward />
        </button>
        <button onClick={togglePlay} className="player-btn play-btn">
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button onClick={playNext} className="player-btn">
          <FaStepForward />
        </button>
      </div>

      <div className="player-progress">
        <span className="time">{formatTime(currentTime)}</span>
        <div className="progress-bar" onClick={handleSeek}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="time">{formatTime(duration)}</span>
      </div>

      <div className="player-track-info">
        <div className="track-cover-mini">
          {currentTrack.cover_url ? (
            <img src={currentTrack.cover_url} alt="" />
          ) : (
            <div className="cover-placeholder-mini" />
          )}
        </div>
        <div className="track-details">
          <Link to={`/track/${currentTrack.id}`} className="track-title-link">
            {currentTrack.title}
          </Link>
          <Link to={`/user/${currentTrack.username}`} className="track-artist-link">
            {currentTrack.display_name || currentTrack.username}
          </Link>
        </div>
      </div>

      <div className="player-volume">
        <button onClick={toggleMute} className="player-btn">
          {muted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        <div className="volume-bar" onClick={handleVolume}>
          <div className="volume-fill" style={{ width: `${muted ? 0 : volume * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export default Player;
