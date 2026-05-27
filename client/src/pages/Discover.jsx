import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TrackCard from '../components/TrackCard';
import api from '../utils/api';
import '../styles/discover.css';

const GENRES = ['All', 'Electronic', 'Hip-Hop', 'Rock', 'Pop', 'Jazz', 'Classical', 'R&B', 'Ambient', 'Lo-fi', 'Indie'];

function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'All');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('sort', sort);
    params.set('page', page);
    params.set('limit', 20);
    if (selectedGenre !== 'All') params.set('genre', selectedGenre);

    api.get(`/tracks?${params.toString()}`).then(data => {
      setTracks(data.tracks);
      setTotal(data.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedGenre, sort, page]);

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (genre === 'All') params.delete('genre');
    else params.set('genre', genre);
    setSearchParams(params);
  };

  return (
    <div className="discover-page">
      <h1>Discover</h1>

      <div className="discover-filters">
        <div className="genre-tabs">
          {GENRES.map(genre => (
            <button
              key={genre}
              className={`genre-tab ${selectedGenre === genre ? 'active' : ''}`}
              onClick={() => handleGenreChange(genre)}
            >
              {genre}
            </button>
          ))}
        </div>

        <div className="sort-options">
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
            <option value="latest">Latest</option>
            <option value="popular">Most Played</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading tracks...</div>
      ) : (
        <>
          <div className="tracks-list">
            {tracks.map(track => (
              <TrackCard key={track.id} track={track} trackList={tracks} />
            ))}
          </div>
          {tracks.length === 0 && <p className="empty-message">No tracks found</p>}
          {total > 20 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span>Page {page} of {Math.ceil(total / 20)}</span>
              <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Discover;
