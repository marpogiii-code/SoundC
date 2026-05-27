import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaUserPlus, FaUserCheck } from 'react-icons/fa';
import TrackCard from '../components/TrackCard';
import { useAuth } from '../context/AuthContext';
import { formatCount } from '../utils/helpers';
import api from '../utils/api';
import '../styles/profile.css';

function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [likes, setLikes] = useState([]);
  const [activeTab, setActiveTab] = useState('tracks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/users/${username}`),
      api.get(`/users/${username}/tracks`),
      api.get(`/users/${username}/likes`),
    ]).then(([profileData, tracksData, likesData]) => {
      setProfile(profileData);
      setTracks(tracksData);
      setLikes(likesData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    if (!currentUser) return;
    const data = await api.post(`/users/${username}/follow`);
    setProfile(prev => ({
      ...prev,
      is_following: data.following,
      followers_count: prev.followers_count + (data.following ? 1 : -1),
    }));
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return <div className="error">User not found</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-cover" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
          {profile.header_url && <img src={profile.header_url} alt="" />}
        </div>
        <div className="profile-info">
          <div className="profile-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} />
            ) : (
              <div className="avatar-placeholder">{profile.username[0].toUpperCase()}</div>
            )}
          </div>
          <div className="profile-details">
            <h1>{profile.display_name || profile.username}</h1>
            <p className="profile-username">@{profile.username}</p>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-stats">
              <span><strong>{formatCount(profile.followers_count)}</strong> Followers</span>
              <span><strong>{formatCount(profile.following_count)}</strong> Following</span>
              <span><strong>{formatCount(profile.tracks_count)}</strong> Tracks</span>
            </div>
          </div>
          {currentUser && currentUser.username !== username && (
            <button className={`follow-btn ${profile.is_following ? 'following' : ''}`} onClick={handleFollow}>
              {profile.is_following ? <><FaUserCheck /> Following</> : <><FaUserPlus /> Follow</>}
            </button>
          )}
        </div>
      </div>

      <div className="profile-tabs">
        <button className={activeTab === 'tracks' ? 'active' : ''} onClick={() => setActiveTab('tracks')}>
          Tracks ({tracks.length})
        </button>
        <button className={activeTab === 'likes' ? 'active' : ''} onClick={() => setActiveTab('likes')}>
          Likes ({likes.length})
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'tracks' && (
          <div className="tracks-list">
            {tracks.map(track => (
              <TrackCard key={track.id} track={track} trackList={tracks} />
            ))}
            {tracks.length === 0 && <p className="empty-message">No tracks yet</p>}
          </div>
        )}
        {activeTab === 'likes' && (
          <div className="tracks-list">
            {likes.map(track => (
              <TrackCard key={track.id} track={track} trackList={likes} />
            ))}
            {likes.length === 0 && <p className="empty-message">No liked tracks yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
