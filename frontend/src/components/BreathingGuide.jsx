import React, { useState, useEffect, useRef } from 'react';

const PHASES = [
  { name: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose...', color: 'var(--secondary)', animation: 'expand' },
  { name: 'Hold', duration: 4, instruction: 'Hold your breath, feel the calm...', color: 'var(--accent)', animation: 'hold-full' },
  { name: 'Exhale', duration: 4, instruction: 'Exhale gently through your mouth...', color: 'var(--primary)', animation: 'contract' },
  { name: 'Hold', duration: 4, instruction: 'Rest and clear your mind...', color: 'var(--bg-dark)', animation: 'hold-empty' }
];

export default function BreathingGuide() {
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].duration);
  const timerRef = useRef(null);

  const currentPhase = PHASES[phaseIndex];

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Move to next phase
            setPhaseIndex((prevIdx) => {
              const nextIdx = (prevIdx + 1) % PHASES.length;
              return nextIdx;
            });
            return PHASES[(phaseIndex + 1) % PHASES.length].duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhaseIndex(0);
      setSecondsLeft(PHASES[0].duration);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phaseIndex]);

  const toggleGuide = () => {
    setIsActive((prev) => !prev);
  };

  // Determine circle style based on active state and phase
  const getCircleStyle = () => {
    if (!isActive) {
      return {
        transform: 'scale(1)',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'none'
      };
    }

    // Dynamic styles based on box breathing phase
    let scale = 1;
    let background = '';
    let boxShadow = '';
    let border = '';

    const percentDone = (currentPhase.duration - secondsLeft) / currentPhase.duration;

    if (currentPhase.name === 'Inhale') {
      scale = 1 + percentDone * 0.4; // Grows from 1.0 to 1.4
      background = 'rgba(0, 246, 255, 0.1)';
      border = '3px solid var(--secondary)';
      boxShadow = `0 0 ${20 + percentDone * 30}px var(--secondary-glow)`;
    } else if (currentPhase.animation === 'hold-full') {
      scale = 1.4; // Stays large
      background = 'rgba(159, 20, 255, 0.15)';
      border = '3px solid var(--accent)';
      boxShadow = '0 0 50px var(--accent-glow)';
    } else if (currentPhase.name === 'Exhale') {
      scale = 1.4 - percentDone * 0.4; // Shrinks from 1.4 to 1.0
      background = 'rgba(255, 46, 147, 0.1)';
      border = '3px solid var(--primary)';
      boxShadow = `0 0 ${50 - percentDone * 30}px var(--primary-glow)`;
    } else {
      scale = 1.0; // Stays small
      background = 'rgba(255, 255, 255, 0.03)';
      border = '3px solid rgba(255,255,255,0.2)';
      boxShadow = '0 0 10px rgba(255, 255, 255, 0.05)';
    }

    return {
      transform: `scale(${scale})`,
      background,
      border,
      boxShadow,
      transition: currentPhase.name === 'Hold' ? 'all 0.5s ease' : 'transform 1s linear, background 0.5s ease, border-color 0.5s ease'
    };
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
      <div>
        <h3 style={{ color: 'var(--primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span>🧘</span> Deep Breathing Guide
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Calm your nervous system using box breathing. Inhale, hold, exhale, hold.
        </p>
      </div>

      <div style={{ height: '220px', width: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Breathing Circle */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            ...getCircleStyle()
          }}
        >
          {isActive ? (
            <>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: currentPhase.color }}>
                {secondsLeft}s
              </span>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', tracking: '1px', opacity: 0.8 }}>
                {currentPhase.name}
              </span>
            </>
          ) : (
            <span style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-muted)' }}>Ready</span>
          )}
        </div>

        {/* Ambient Ring */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              border: '1px dashed rgba(255,255,255,0.05)',
              zIndex: 1,
              transform: 'scale(1)',
              animation: 'spin-record 20s linear infinite'
            }}
          />
        )}
      </div>

      <div style={{ minHeight: '50px' }}>
        {isActive ? (
          <h4 style={{ color: 'var(--text-main)', fontWeight: '400', transition: 'all 0.5s ease' }}>
            {currentPhase.instruction}
          </h4>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Click start to begin a 4-second box breathing cycle.</p>
        )}
      </div>

      <button
        onClick={toggleGuide}
        className={isActive ? 'neon-btn-secondary' : 'neon-btn-primary'}
        style={{ width: '100%', maxWidth: '200px' }}
      >
        {isActive ? 'Stop Session' : 'Start Session'}
      </button>
    </div>
  );
}
