import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

const MOODS = [
  { score: 1, label: 'Stressed / Sad', emoji: '😭', color: '#ff2e93' },
  { score: 2, label: 'Tired / Low', emoji: '😕', color: '#9f14ff' },
  { score: 3, label: 'Neutral', emoji: '😐', color: '#8e88a5' },
  { score: 4, label: 'Relaxed / Peaceful', emoji: '😌', color: '#00f6ff' },
  { score: 5, label: 'Energized / Happy', emoji: '😄', color: '#00ff66' }
];

export default function MoodTracker() {
  const { user, addXp } = useUser();
  const [selectedScore, setSelectedScore] = useState(3);
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.isOffline) {
        const saved = JSON.parse(localStorage.getItem('mock_mood_logs') || '[]');
        setHistory(saved.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at)));
      } else {
        const response = await fetch(`http://localhost:5000/api/mood/history/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      }
    } catch (e) {
      console.warn('Failed to load mood history from backend, falling back to local:', e.message);
      const saved = JSON.parse(localStorage.getItem('mock_mood_logs') || '[]');
      setHistory(saved.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    setStatus('Logging...');

    const logData = {
      userId: user?.id || 1,
      score: selectedScore,
      notes: notes
    };

    try {
      if (user?.isOffline) {
        // Mock save
        const saved = JSON.parse(localStorage.getItem('mock_mood_logs') || '[]');
        saved.push({
          id: Date.now(),
          score: selectedScore,
          notes,
          logged_at: new Date().toISOString()
        });
        localStorage.setItem('mock_mood_logs', JSON.stringify(saved));
        addXp(15);
        setStatus('Logged locally! +15 XP.');
        setNotes('');
        fetchHistory();
      } else {
        const response = await fetch('http://localhost:5000/api/mood/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logData)
        });
        if (response.ok) {
          addXp(15);
          setStatus('Logged to cloud! +15 XP.');
          setNotes('');
          fetchHistory();
        } else {
          throw new Error('Server error logging mood');
        }
      }
    } catch (e) {
      console.warn('Offline logging triggered:', e.message);
      const saved = JSON.parse(localStorage.getItem('mock_mood_logs') || '[]');
      saved.push({
        id: Date.now(),
        score: selectedScore,
        notes,
        logged_at: new Date().toISOString()
      });
      localStorage.setItem('mock_mood_logs', JSON.stringify(saved));
      addXp(15);
      setStatus('Saved offline! +15 XP.');
      setNotes('');
      fetchHistory();
    }

    setTimeout(() => setStatus(''), 4000);
  };

  // Render Custom SVG line chart based on mood history
  const renderMoodChart = () => {
    if (history.length < 2) {
      return (
        <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Log mood at least twice to see your emotional trends graph.</p>
        </div>
      );
    }

    // Use up to the 7 most recent logs, in chronological order
    const chartLogs = [...history].slice(0, 7).reverse();
    const width = 500;
    const height = 150;
    const padding = 20;

    const points = chartLogs.map((log, index) => {
      const x = padding + (index / (chartLogs.length - 1)) * (width - padding * 2);
      // y=5 is top, y=1 is bottom -> map 5 to padding, 1 to height-padding
      const y = padding + ((5 - log.score) / 4) * (height - padding * 2);
      return { x, y, score: log.score, date: new Date(log.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
    });

    // Create line path string
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="glass-panel" style={{ padding: '16px', background: 'rgba(0, 0, 0, 0.2)' }}>
        <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '12px' }}>Weekly Emotional Flow</h4>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Horizontal Grid lines */}
          {[1, 2, 3, 4, 5].map((val) => {
            const y = padding + ((5 - val) / 4) * (height - padding * 2);
            return (
              <line
                key={val}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
            );
          })}

          {/* Line connecting points */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0px 0px 8px var(--secondary-glow))' }}
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="var(--bg-dark)"
                stroke={p.score >= 4 ? '#00ff66' : p.score <= 2 ? '#ff2e93' : '#00f6ff'}
                strokeWidth="3"
              />
              <text
                x={p.x}
                y={height - 2}
                fill="var(--text-muted)"
                fontSize="8"
                textAnchor="middle"
                fontFamily="Outfit"
              >
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          📊 Mood Tracker
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Keep tabs on your well-being. Understanding patterns helps promote mindfulness.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', alignItems: 'start' }}>
        {/* Logger form */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ color: 'var(--secondary)' }}>How are you feeling right now?</h3>
          
          <form onSubmit={handleSubmitLog} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Emojis selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              {MOODS.map((mood) => {
                const isSelected = selectedScore === mood.score;
                return (
                  <button
                    key={mood.score}
                    type="button"
                    onClick={() => setSelectedScore(mood.score)}
                    className="glass-panel"
                    style={{
                      flex: 1,
                      padding: '16px 8px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(0, 246, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? `2px solid ${mood.color}` : '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.05)' : 'none',
                      boxShadow: isSelected ? `0 0 15px ${mood.color}40` : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.8rem' }}>{mood.emoji}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? '#fff' : 'var(--text-muted)', textAlign: 'center', height: '24px', display: 'flex', alignItems: 'center' }}>
                      {mood.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>Add a reflection note (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What triggered this feeling today? (e.g. work project, quiet walk, nice track)"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--secondary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: '500' }}>{status}</span>
              <button type="submit" className="neon-btn-primary" style={{ padding: '10px 24px' }}>
                Log Mood (+15 XP)
              </button>
            </div>
          </form>
        </div>

        {/* Visual Charts and History log list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Chart */}
          {renderMoodChart()}

          {/* History list */}
          <div className="glass-panel" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '12px' }}>History Logs</h4>
            
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading logs...</p>
            ) : history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No logged moods yet. Complete a check-in on the left!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map((log) => {
                  const mData = MOODS.find((m) => m.score === log.score) || { emoji: '😐', color: '#fff' };
                  return (
                    <div
                      key={log.id}
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '1.4rem' }}>{mData.emoji}</span>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ fontSize: '0.85rem', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {log.notes || 'Logged feeling'}
                          </p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(log.logged_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <span 
                        style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 'bold', 
                          color: mData.color,
                          border: `1px solid ${mData.color}40`,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: `${mData.color}15`
                        }}
                      >
                        Score: {log.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
