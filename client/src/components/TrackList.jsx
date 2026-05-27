import { useState } from 'react';
import TrackCard from './TrackCard';

function TrackList({ tracks: initialTracks, title }) {
  const [tracks, setTracks] = useState(initialTracks);

  const handleLikeToggle = (trackId, liked, likesCount) => {
    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, is_liked: liked, likes_count: likesCount } : t
    ));
  };

  // Update tracks when prop changes
  if (initialTracks !== tracks && JSON.stringify(initialTracks) !== JSON.stringify(tracks)) {
    setTracks(initialTracks);
  }

  return (
    <div className="track-list">
      {title && <h2 className="section-title">{title}</h2>}
      {tracks.map(track => (
        <TrackCard
          key={track.id}
          track={track}
          trackList={tracks}
          onLikeToggle={handleLikeToggle}
        />
      ))}
      {tracks.length === 0 && (
        <p className="empty-message">No tracks found</p>
      )}
    </div>
  );
}

export default TrackList;
