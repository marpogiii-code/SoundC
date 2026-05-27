import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaCloudUploadAlt, FaUser, FaSignOutAlt, FaMusic } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import '../styles/header.css';

function Header() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <FaMusic className="logo-icon" />
          <span>SoundC</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/discover">Discover</Link>
          {user && <Link to="/library">Library</Link>}
        </nav>

        <form className="search-form" onSubmit={handleSearch}>
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search for tracks, artists, playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="header-actions">
          {user ? (
            <>
              <Link to="/upload" className="upload-btn">
                <FaCloudUploadAlt /> Upload
              </Link>
              <div className="user-menu-wrapper">
                <button className="user-avatar-btn" onClick={() => setShowMenu(!showMenu)}>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} />
                  ) : (
                    <FaUser />
                  )}
                  <span>{user.display_name || user.username}</span>
                </button>
                {showMenu && (
                  <div className="dropdown-menu">
                    <Link to={`/user/${user.username}`} onClick={() => setShowMenu(false)}>
                      <FaUser /> Profile
                    </Link>
                    <button onClick={() => { logout(); setShowMenu(false); }}>
                      <FaSignOutAlt /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/auth" className="btn-signin">Sign In</Link>
              <Link to="/auth?mode=register" className="btn-signup">Create Account</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
