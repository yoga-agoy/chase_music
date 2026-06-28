import React, { useState } from 'react';
import { usePlayback } from '../context/PlaybackContext';
import Equalizer from './Equalizer';

export default function AudioPlayer() {
  const {
    currentTrack,
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
    handleSeek
  } = usePlayback();

  const [showTimerOptions, setShowTimerOptions] = useState(false);

  if (!currentTrack) return null;

  // Format time (e.g. 125 -> 2:05)
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

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '90px',
        background: 'rgba(15, 11, 30, 0.85)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100,
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* 1. Album Art / Title / Equalizer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '30%', minWidth: '240px' }}>
        <div
          className={`flex-center ${isPlaying ? 'spin-slow' : 'spin-slow spin-paused'}`}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            boxShadow: isPlaying ? '0 0 15px var(--primary-glow)' : 'none',
            fontSize: '1.5rem',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          🎵
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', flex: 1 }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {currentTrack.title}
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {currentTrack.artist}
          </p>
        </div>
        <div style={{ width: '60px', height: '30px' }}>
          <Equalizer isPlaying={isPlaying} barCount={8} />
        </div>
      </div>

      {/* 2. Audio Control Buttons & Progress bar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '40%' }}>
        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={handlePrev}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            ⏮️
          </button>
          
          <button
            onClick={handlePlayPause}
            className="flex-center"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--text-main)',
              color: 'var(--bg-darker)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: isPlaying ? '0 0 10px rgba(255,255,255,0.4)' : 'none'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.08)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          <button
            onClick={handleNext}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            ⏭️
          </button>
        </div>

        {/* Seek Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '30px', textAlign: 'right' }}>
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
              accentColor: 'var(--primary)',
              cursor: 'pointer',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.1)'
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '30px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Volume and Sleep Timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '30%', justifyContent: 'flex-end', minWidth: '220px' }}>
        {/* Sleep Timer */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowTimerOptions(!showTimerOptions)}
            className="neon-btn-secondary"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              borderColor: sleepTimer ? 'var(--primary)' : 'rgba(0, 246, 255, 0.3)',
              color: sleepTimer ? 'var(--primary)' : 'var(--secondary)',
              boxShadow: sleepTimer ? '0 0 8px rgba(255, 46, 147, 0.2)' : 'none'
            }}
          >
            ⏱️ {sleepTimer !== null ? `${formatTime(sleepTimer)}` : 'Sleep Timer'}
          </button>

          {showTimerOptions && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                bottom: '45px',
                right: 0,
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

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
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
              accentColor: 'var(--secondary)',
              cursor: 'pointer',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.1)'
            }}
          />
        </div>
      </div>
    </div>
  );
}
