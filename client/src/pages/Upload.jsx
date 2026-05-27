import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaMusic } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/upload.css';

const GENRES = ['Electronic', 'Hip-Hop', 'Rock', 'Pop', 'Jazz', 'Classical', 'R&B', 'Ambient', 'Lo-fi', 'Indie', 'Other'];

function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const coverRef = useRef(null);

  const [file, setFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleCoverChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setCoverFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an audio file');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Get audio duration
      const audio = new Audio();
      const duration = await new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
        audio.addEventListener('error', () => resolve(0));
        audio.src = URL.createObjectURL(file);
      });

      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('genre', genre);
      formData.append('tags', tags);
      formData.append('duration', Math.round(duration));

      const track = await api.post('/tracks', formData);

      // Upload cover if selected
      if (coverFile) {
        const coverForm = new FormData();
        coverForm.append('cover', coverFile);
        await api.post(`/tracks/${track.id}/cover`, coverForm);
      }

      navigate(`/track/${track.id}`);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <h1>Upload Your Track</h1>

      {!file ? (
        <div className="upload-dropzone" onClick={() => fileRef.current.click()}>
          <FaCloudUploadAlt className="upload-icon" />
          <h2>Drag & drop your audio file here</h2>
          <p>or click to browse</p>
          <p className="upload-hint">MP3, WAV, OGG, FLAC, M4A, AAC (max 50MB)</p>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="upload-form-grid">
            <div className="upload-cover-section">
              <div className="cover-upload" onClick={() => coverRef.current.click()}>
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover" />
                ) : (
                  <div className="cover-placeholder-upload">
                    <FaMusic />
                    <span>Upload Cover</span>
                  </div>
                )}
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="upload-details">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Track title"
                />
              </div>

              <div className="form-group">
                <label>Genre</label>
                <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                  <option value="">Select genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your track..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Comma-separated tags"
                />
              </div>

              <div className="selected-file">
                <FaMusic /> {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="form-actions">
                <button type="button" onClick={() => setFile(null)} className="btn-cancel">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-upload">
                  {uploading ? 'Uploading...' : 'Upload Track'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default Upload;
