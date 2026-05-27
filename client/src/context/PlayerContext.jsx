import { createContext, useContext, useState, useRef } from 'react';
import api from '../utils/api';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(new Audio());

  const playTrack = (track, trackList = []) => {
    if (currentTrack?.id !== track.id) {
      audioRef.current.src = track.audio_url;
      setCurrentTrack(track);
      setQueue(trackList.length > 0 ? trackList : [track]);
      api.post(`/tracks/${track.id}/play`).catch(() => {});
    }
    audioRef.current.play();
    setIsPlaying(true);
  };

  const pauseTrack = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const playNext = () => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    playTrack(queue[nextIndex], queue);
  };

  const playPrev = () => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    playTrack(queue[prevIndex], queue);
  };

  const setVolume = (vol) => {
    audioRef.current.volume = vol;
  };

  // Audio event listeners
  audioRef.current.ontimeupdate = () => setCurrentTime(audioRef.current.currentTime);
  audioRef.current.onloadedmetadata = () => setDuration(audioRef.current.duration);
  audioRef.current.onended = () => playNext();

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      queue,
      isPlaying,
      currentTime,
      duration,
      playTrack,
      pauseTrack,
      togglePlay,
      seekTo,
      playNext,
      playPrev,
      setVolume,
      audioRef,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}
