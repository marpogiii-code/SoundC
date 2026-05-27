import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Player from './components/Player';
import Home from './pages/Home';
import Discover from './pages/Discover';
import TrackPage from './pages/TrackPage';
import Profile from './pages/Profile';
import Upload from './pages/Upload';
import Search from './pages/Search';
import Library from './pages/Library';
import PlaylistPage from './pages/PlaylistPage';
import Auth from './pages/Auth';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/track/:id" element={<TrackPage />} />
          <Route path="/user/:username" element={<Profile />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </main>
      <Player />
    </div>
  );
}

export default App;
