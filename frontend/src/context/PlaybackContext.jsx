import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const PlaybackContext = createContext();

export const usePlayback = () => useContext(PlaybackContext);

export const PlaybackProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([
    { id: 1, title: 'Dreamy Lofi Chill', artist: 'Lofi Producer', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: '6:12' },
    { id: 2, title: 'Midnight Coffee', artist: 'Jazz Cafe', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: '7:05' },
    { id: 3, title: 'Focus Flow', artist: 'Study Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: '5:02' },
    { id: 4, title: 'Sleepy Ocean Waves', artist: 'Nature Ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', duration: '5:18' }
  ]);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [sleepTimer, setSleepTimer] = useState(null); // time remaining in seconds
  const [isFading, setIsFading] = useState(false);

  const audioRef = useRef(new Audio());
  const timerIntervalRef = useRef(null);

  const currentTrack = playlist[currentTrackIndex] || null;

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Sync audio source
  useEffect(() => {
    if (currentTrack) {
      const wasPlaying = isPlaying;
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
      
      if (wasPlaying) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((e) => {
            console.warn("Audio autoplay blocked or failed:", e.message);
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(false);
      }
    }
  }, [currentTrackIndex]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex]);

  // Handle sleep timer countdown
  useEffect(() => {
    if (sleepTimer !== null) {
      if (sleepTimer > 0) {
        timerIntervalRef.current = setInterval(() => {
          setSleepTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timerIntervalRef.current);
              triggerVolumeFadeOut();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sleepTimer]);

  const triggerVolumeFadeOut = () => {
    setIsFading(true);
    let currentVol = audioRef.current.volume;
    const fadeInterval = setInterval(() => {
      if (currentVol > 0.05) {
        currentVol -= 0.05;
        audioRef.current.volume = Math.max(0, currentVol);
      } else {
        clearInterval(fadeInterval);
        audioRef.current.pause();
        audioRef.current.volume = volume; // reset volume
        setIsPlaying(false);
        setSleepTimer(null);
        setIsFading(false);
        console.log('Sleep timer: playback stopped after fade-out.');
      }
    }, 200); // fade out over 2 seconds
  };

  const handlePlayPause = () => {
    if (!currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error('Play failed:', e));
    }
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  };

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const playSpecificTrack = (track) => {
    const existingIndex = playlist.findIndex((t) => t.url === track.url);
    if (existingIndex !== -1) {
      setCurrentTrackIndex(existingIndex);
    } else {
      const newPlaylist = [...playlist, { ...track, id: Date.now() }];
      setPlaylist(newPlaylist);
      setCurrentTrackIndex(newPlaylist.length - 1);
    }
    setIsPlaying(true);
  };

  const loadCustomPlaylist = (tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    setPlaylist(tracks);
    setCurrentTrackIndex(startIndex);
    setIsPlaying(true);
  };

  return (
    <PlaybackContext.Provider
      value={{
        playlist,
        setPlaylist,
        currentTrack,
        currentTrackIndex,
        isPlaying,
        setIsPlaying,
        currentTime,
        duration,
        volume,
        setVolume,
        sleepTimer,
        setSleepTimer,
        isFading,
        handlePlayPause,
        handleNext,
        handlePrev,
        handleSeek,
        playSpecificTrack,
        loadCustomPlaylist,
        audioElement: audioRef.current
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};
