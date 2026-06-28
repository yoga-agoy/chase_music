import React, { useState, useEffect, useRef } from 'react';
import { usePlayback } from '../context/PlaybackContext';
import { useUser } from '../context/UserContext';
import Equalizer from '../components/Equalizer';

const LANGUAGES = [
  { id: 'tamil', name: 'Tamil', flag: '🛕', desc: 'Rhythm, Soul & Melodies', query: 'Tamil hits', gradient: 'linear-gradient(135deg, #f857a6, #ff5858)', color: '#ff5858' },
  { id: 'hindi', name: 'Hindi', flag: '🇮🇳', desc: 'Bollywood Beats & Romance', query: 'Hindi hits', gradient: 'linear-gradient(135deg, #ff9933, #ffffff, #138808)', color: '#ff9933', isLight: true },
  { id: 'malayalam', name: 'Malayalam', flag: '🌴', desc: 'Vibrant, Acoustic & Indie', query: 'Malayalam hits', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)', color: '#38ef7d' },
  { id: 'telugu', name: 'Telugu', flag: '🐘', desc: 'High Energy & Cinematic', query: 'Telugu hits', gradient: 'linear-gradient(135deg, #8a2387, #e94057, #f27121)', color: '#e94057' },
  { id: 'punjabi', name: 'Punjabi', flag: '🌾', desc: 'Bhangra, Pop & Bass', query: 'Punjabi hits', gradient: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', color: '#a6c1ee' },
  { id: 'english', name: 'English', flag: '🇬🇧', desc: 'Billboard Hits & Classics', query: 'English hits', gradient: 'linear-gradient(135deg, #00c6ff, #0072ff)', color: '#00c6ff' }
];

export default function MusicPlayer() {
  const { user, addXp } = useUser();
  const {
    playlist,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    sleepTimer,
    setSleepTimer,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSeek,
    playSpecificTrack,
    loadCustomPlaylist
  } = usePlayback();

  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'lyrics'
  const [lyrics, setLyrics] = useState('');
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [showTimerOptions, setShowTimerOptions] = useState(false);

  // Sync lyrics when currentTrack changes
  useEffect(() => {
    if (currentTrack && activeTab === 'lyrics') {
      fetchLyrics(currentTrack.title, currentTrack.artist);
    }
  }, [currentTrack?.title, currentTrack?.artist, activeTab]);

  const selectLanguage = async (lang) => {
    setSelectedLanguage(lang);
    setLoading(true);
    setLyrics('');

    try {
      const response = await fetch(`http://localhost:5000/api/music/search?term=${encodeURIComponent(lang.query)}`);
      if (!response.ok) throw new Error('Search failed');
      const tracks = await response.json();

      if (tracks && tracks.length > 0) {
        // Load into global playlist and play
        loadCustomPlaylist(tracks, 0);
        addXp(15); // Reward language selection exploration
      }
    } catch (e) {
      console.error('Failed to load language tracks:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLyrics = async (title, artist) => {
    setLoadingLyrics(true);
    try {
      const response = await fetch(`http://localhost:5000/api/music/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
      const data = await response.json();
      setLyrics(data.lyrics || '');
    } catch (e) {
      setLyrics(`Failed to load lyrics for this track.`);
    } finally {
      setLoadingLyrics(false);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleProgressChange = (e) => {
    handleSeek(parseFloat(e.target.value));
  };

  const selectSleepTimer = (seconds) => {
    setSleepTimer(seconds);
    setShowTimerOptions(false);
  };

  const currentLanguageConfig = LANGUAGES.find(l => l.id === selectedLanguage?.id);

  if (!selectedLanguage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Intro Header */}
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            🎵 Music Player
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Choose a language vibe and start playing your favorite regional hits.</p>
        </div>

        {/* Grid of Languages */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {LANGUAGES.map((lang) => (
            <div
              key={lang.id}
              onClick={() => selectLanguage(lang)}
              className="glass-panel glass-panel-hover"
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                padding: '28px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Backglow element */}
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '120px',
                  height: '120px',
                  background: lang.color,
                  filter: 'blur(50px)',
                  opacity: 0.15,
                  zIndex: 0,
                  pointerEvents: 'none'
                }}
              />
              
              <div
                className="flex-center"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: lang.gradient,
                  fontSize: '2rem',
                  color: lang.isLight ? '#000' : '#fff',
                  boxShadow: `0 8px 20px rgba(0,0,0,0.3), 0 0 10px ${lang.color}33`,
                  zIndex: 1
                }}
              >
                {lang.flag}
              </div>

              <div style={{ zIndex: 1 }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                  {lang.name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  {lang.desc}
                </p>
              </div>

              <div 
                style={{ 
                  marginTop: 'auto', 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  color: lang.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 1
                }}
              >
                Tune in ⚡
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setSelectedLanguage(null)}
            className="neon-btn-secondary"
            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem' }}
          >
            ⬅️ Choose Language
          </button>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
              Playing: {selectedLanguage.name} Hits
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Synchronized with global audio player</p>
          </div>
        </div>
        
        <span 
          className="badge" 
          style={{ 
            background: currentLanguageConfig ? `${currentLanguageConfig.color}1a` : 'rgba(255,255,255,0.05)',
            borderColor: currentLanguageConfig ? `${currentLanguageConfig.color}4d` : 'rgba(255,255,255,0.1)',
            color: currentLanguageConfig ? currentLanguageConfig.color : '#fff',
            fontWeight: 'bold',
            textTransform: 'capitalize',
            padding: '6px 14px',
            fontSize: '0.85rem'
          }}
        >
          {selectedLanguage.flag} {selectedLanguage.name}
        </span>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '20px' }}>
          <div className="spin-slow" style={{ fontSize: '3rem' }}>💿</div>
          <h3 style={{ color: '#fff' }}>Loading {selectedLanguage.name} Playlist...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fetching live tracks and prepping player...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Left Column: Player Display & Controls */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '32px' }}>
            
            {/* Spinning Vinyl Record Player */}
            <div 
              style={{ 
                position: 'relative', 
                width: '260px', 
                height: '260px', 
                borderRadius: '50%', 
                background: '#07040d',
                border: '8px solid #161127',
                boxShadow: isPlaying 
                  ? `0 15px 35px rgba(0,0,0,0.6), 0 0 30px ${currentLanguageConfig?.color || 'var(--primary)'}22` 
                  : '0 15px 35px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Vinyl Groves */}
              <div 
                className={`spin-slow ${isPlaying ? '' : 'spin-paused'}`}
                style={{
                  position: 'absolute',
                  width: '244px',
                  height: '244px',
                  borderRadius: '50%',
                  border: '1px double rgba(255,255,255,0.05)',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Vinyl Cover Art (Inner Label) */}
                <div 
                  style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    border: '3px solid #000',
                    background: currentLanguageConfig?.gradient || 'linear-gradient(135deg, var(--primary), var(--accent))',
                    backgroundImage: currentTrack?.coverUrl ? `url(${currentTrack.coverUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    boxShadow: '0 0 10px rgba(0,0,0,0.8)'
                  }}
                >
                  {/* Center Hole */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#07040d',
                      border: '2px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Song Metadata */}
            <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 
                style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 700, 
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}
              >
                {currentTrack ? currentTrack.title : 'No Track Selected'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {currentTrack ? currentTrack.artist : 'Select a track to play'}
              </p>
            </div>

            {/* Equalizer animation */}
            <div style={{ width: '120px', height: '30px' }}>
              <Equalizer isPlaying={isPlaying} barCount={12} />
            </div>

            {/* Seek Slider and Time */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '35px', textAlign: 'right' }}>
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleProgressChange}
                  style={{
                    flex: 1,
                    accentColor: currentLanguageConfig?.color || 'var(--primary)',
                    cursor: 'pointer',
                    height: '5px',
                    borderRadius: '3px',
                    background: 'rgba(255,255,255,0.08)'
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '35px' }}>
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Playback Controls Dashboard */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '8px' }}>
              
              {/* Sleep Timer */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowTimerOptions(!showTimerOptions)}
                  className="neon-btn-secondary"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    borderColor: sleepTimer ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                    color: sleepTimer ? 'var(--primary)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ⏱️ {sleepTimer !== null ? `${formatTime(sleepTimer)}` : 'Timer'}
                </button>

                {showTimerOptions && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      bottom: '45px',
                      left: 0,
                      padding: '8px',
                      width: '130px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      zIndex: 110
                    }}
                  >
                    <button
                      onClick={() => selectSleepTimer(null)}
                      style={{ background: 'none', border: 'none', color: '#fff', padding: '6px', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => selectSleepTimer(15)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', padding: '6px', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      15s (Test)
                    </button>
                    <button
                      onClick={() => selectSleepTimer(300)}
                      style={{ background: 'none', border: 'none', color: '#fff', padding: '6px', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      5 Min
                    </button>
                    <button
                      onClick={() => selectSleepTimer(900)}
                      style={{ background: 'none', border: 'none', color: '#fff', padding: '6px', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      15 Min
                    </button>
                    <button
                      onClick={() => selectSleepTimer(1800)}
                      style={{ background: 'none', border: 'none', color: '#fff', padding: '6px', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      30 Min
                    </button>
                  </div>
                )}
              </div>

              {/* Core Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={handlePrev}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.target.style.color = '#fff'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                  ⏮️
                </button>
                
                <button
                  onClick={handlePlayPause}
                  className="flex-center"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: currentLanguageConfig ? currentLanguageConfig.gradient : 'var(--text-main)',
                    color: currentLanguageConfig?.isLight ? '#000' : '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.4rem',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: isPlaying ? `0 0 15px ${currentLanguageConfig?.color || 'var(--primary)'}66` : 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.08)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>

                <button
                  onClick={handleNext}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.target.style.color = '#fff'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                  ⏭️
                </button>
              </div>

              {/* Volume Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '90px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: currentLanguageConfig?.color || 'var(--secondary)',
                    cursor: 'pointer',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'rgba(255,255,255,0.08)'
                  }}
                />
              </div>

            </div>

          </div>

          {/* Right Column: Queue & Lyrics */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '542px' }}>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <button
                onClick={() => setActiveTab('queue')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'queue' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'queue' ? `2px solid ${currentLanguageConfig?.color || 'var(--secondary)'}` : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                Play Queue ({playlist.length})
              </button>
              <button
                onClick={() => setActiveTab('lyrics')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'lyrics' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'lyrics' ? `2px solid ${currentLanguageConfig?.color || 'var(--secondary)'}` : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                Song Lyrics 📜
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              
              {activeTab === 'queue' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {playlist.map((track, idx) => {
                    const isActive = currentTrack?.url === track.url;
                    
                    return (
                      <div
                        key={track.id || idx}
                        onClick={() => playSpecificTrack(track)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                          border: isActive ? `1px solid ${currentLanguageConfig ? `${currentLanguageConfig.color}4d` : 'rgba(255,46,147,0.3)'}` : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Number or Mini Equalizer */}
                        <div style={{ width: '24px', display: 'flex', justifyContent: 'center', color: isActive ? (currentLanguageConfig?.color || 'var(--secondary)') : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                          {isActive && isPlaying ? (
                            <div style={{ width: '16px', height: '14px' }}>
                              <Equalizer isPlaying={isPlaying} barCount={4} />
                            </div>
                          ) : (
                            idx + 1
                          )}
                        </div>

                        {/* Thumbnail cover */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)',
                            backgroundImage: track.coverUrl ? `url(${track.coverUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />

                        {/* Text Metadata */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: isActive ? '#fff' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {track.title}
                          </h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                            {track.artist}
                          </p>
                        </div>

                        {/* Duration */}
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {track.duration || '3:30'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'lyrics' && (
                <div style={{ padding: '8px 4px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {loadingLyrics ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                      <div className="spin-slow" style={{ fontSize: '2rem' }}>💿</div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading lyrics...</span>
                    </div>
                  ) : lyrics ? (
                    <pre
                      style={{
                        fontFamily: 'inherit',
                        fontSize: '0.95rem',
                        lineHeight: '1.8',
                        color: 'var(--text-main)',
                        whiteSpace: 'pre-wrap',
                        textAlign: 'center',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                      }}
                    >
                      {lyrics}
                    </pre>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No lyrics found for this song.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
