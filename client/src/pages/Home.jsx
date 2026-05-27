import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TrackCard from '../components/TrackCard';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/home.css';

function Home() {
  const { user } = useAuth();
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tracks?sort=popular&limit=8'),
      api.get('/tracks?sort=latest&limit=8'),
    ]).then(([popularData, latestData]) => {
      setTrending(popularData.tracks);
      setLatest(latestData.tracks);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Discover & Share Music</h1>
          <p>Upload your tracks, discover new artists, and connect with the music community.</p>
          {!user && (
            <div className="hero-actions">
              <Link to="/auth?mode=register" className="btn btn-primary">Get Started Free</Link>
              <Link to="/discover" className="btn btn-secondary">Explore Music</Link>
            </div>
          )}
          {user && (
            <div className="hero-actions">
              <Link to="/upload" className="btn btn-primary">Upload Track</Link>
              <Link to="/discover" className="btn btn-secondary">Explore Music</Link>
            </div>
          )}
        </div>
        <div className="hero-visual">
          <div className="soundwave">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Trending Tracks</h2>
          <Link to="/discover?sort=popular" className="see-all">See all</Link>
        </div>
        <div className="tracks-grid">
          {trending.map(track => (
            <TrackCard key={track.id} track={track} trackList={trending} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>New & Fresh</h2>
          <Link to="/discover?sort=latest" className="see-all">See all</Link>
        </div>
        <div className="tracks-grid">
          {latest.map(track => (
            <TrackCard key={track.id} track={track} trackList={latest} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
