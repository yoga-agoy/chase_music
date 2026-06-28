import React, { useState, useEffect, useRef } from 'react';

const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Rainfall', icon: '🌧️', url: 'https://www.soundjay.com/nature/sounds/rain-07.mp3' },
  { id: 'ocean', name: 'Ocean Waves', icon: '🌊', url: 'https://www.soundjay.com/nature/sounds/ocean-wave-1.mp3' },
  { id: 'forest', name: 'Forest Birds', icon: '🌲', url: 'https://www.soundjay.com/nature/sounds/forest-1.mp3' },
  { id: 'fire', name: 'Campfire', icon: '🪵', url: 'https://www.soundjay.com/nature/sounds/fire-1.mp3' }
];

export default function SoundMixer() {
  const [activeSounds, setActiveSounds] = useState({});
  const [volumes, setVolumes] = useState({
    rain: 0.3,
    ocean: 0.3,
    forest: 0.3,
    fire: 0.3
  });

  const audiosRef = useRef({});

  // Clean up on unmount
  useEffect(() => {
    return () => {
      Object.values(audiosRef.current).forEach((audio) => {
        audio.pause();
      });
    };
  }, []);

  const toggleSound = (id, url) => {
    const isCurrentlyActive = !!activeSounds[id];
    
    if (!audiosRef.current[id]) {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = volumes[id];
      audiosRef.current[id] = audio;
    }

    if (isCurrentlyActive) {
      audiosRef.current[id].pause();
      setActiveSounds((prev) => ({ ...prev, [id]: false }));
    } else {
      audiosRef.current[id].play()
        .then(() => {
          setActiveSounds((prev) => ({ ...prev, [id]: true }));
        })
        .catch((e) => console.error(`Error playing ambient sound ${id}:`, e));
    }
  };

  const handleVolumeChange = (id, newVolume) => {
    setVolumes((prev) => ({ ...prev, [id]: newVolume }));
    if (audiosRef.current[id]) {
      audiosRef.current[id].volume = newVolume;
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ color: 'var(--secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎧</span> Ambient Sound Mixer
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Layer calming nature loops with your music to create your perfect stress-relief zone.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {AMBIENT_SOUNDS.map((sound) => {
          const isActive = !!activeSounds[sound.id];
          return (
            <div 
              key={sound.id}
              className="glass-panel" 
              style={{
                padding: '16px',
                background: isActive ? 'rgba(0, 246, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                border: isActive ? '1px solid rgba(0, 246, 255, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{sound.icon}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{sound.name}</span>
                </span>
                
                <button
                  onClick={() => toggleSound(sound.id, sound.url)}
                  className={isActive ? 'neon-btn-primary' : 'neon-btn-secondary'}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    boxShadow: isActive ? '0 0 10px rgba(255, 46, 147, 0.2)' : 'none'
                  }}
                >
                  {isActive ? 'Active' : 'Muted'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔈</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volumes[sound.id]}
                  disabled={!isActive}
                  onChange={(e) => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: 'var(--secondary)',
                    opacity: isActive ? 1 : 0.4,
                    cursor: isActive ? 'pointer' : 'default',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'rgba(255,255,255,0.1)'
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔊</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
