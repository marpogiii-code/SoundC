import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import TrackCard from '../components/TrackCard';
import api from '../utils/api';
import '../styles/search.css';

function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState({ tracks: [], users: [], playlists: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tracks');

  useEffect(() => {
    if (query) {
      setLoading(true);
      api.get(`/search?q=${encodeURIComponent(query)}`).then(data => {
        setResults(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [query]);

  if (!query) {
    return (
      <div className="search-page">
        <h1>Search</h1>
        <p className="empty-message">Enter a search term to find tracks, artists, and playlists</p>
      </div>
    );
  }

  return (
    <div className="search-page">
      <h1>Results for &quot;{query}&quot;</h1>

      <div className="search-tabs">
        <button className={activeTab === 'tracks' ? 'active' : ''} onClick={() => setActiveTab('tracks')}>
          Tracks ({results.tracks?.length || 0})
        </button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
          Artists ({results.users?.length || 0})
        </button>
        <button className={activeTab === 'playlists' ? 'active' : ''} onClick={() => setActiveTab('playlists')}>
          Playlists ({results.playlists?.length || 0})
        </button>
      </div>

      {loading ? (
        <div className="loading">Searching...</div>
      ) : (
        <div className="search-results">
          {activeTab === 'tracks' && (
            <div className="tracks-list">
              {results.tracks?.map(track => (
                <TrackCard key={track.id} track={track} trackList={results.tracks} />
              ))}
              {results.tracks?.length === 0 && <p className="empty-message">No tracks found</p>}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-grid">
              {results.users?.map(user => (
                <Link to={`/user/${user.username}`} key={user.id} className="user-card">
                  <div className="user-card-avatar">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} />
                    ) : (
                      <div className="avatar-placeholder"><FaUser /></div>
                    )}
                  </div>
                  <h3>{user.display_name || user.username}</h3>
                  <p>@{user.username}</p>
                  <span>{user.followers_count} followers</span>
                </Link>
              ))}
              {results.users?.length === 0 && <p className="empty-message">No artists found</p>}
            </div>
          )}

          {activeTab === 'playlists' && (
            <div className="playlists-grid">
              {results.playlists?.map(playlist => (
                <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="playlist-card">
                  <h3>{playlist.title}</h3>
                  <p>by {playlist.display_name || playlist.username}</p>
                  <span>{playlist.tracks_count} tracks</span>
                </Link>
              ))}
              {results.playlists?.length === 0 && <p className="empty-message">No playlists found</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;
