import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

const BADGES = [
  { id: 'pioneer', name: 'MoodTunes Pioneer', desc: 'Welcome to the relaxing universe of MoodTunes.', icon: '🎵', requirement: (xp) => true, color: 'var(--secondary)' },
  { id: 'master', name: 'Melody Master', desc: 'Listen to tracks to tune your emotional frequency.', icon: '🎧', requirement: (xp) => xp >= 50, color: 'var(--primary)' },
  { id: 'zen', name: 'Zen Master', desc: 'Log gratitude or complete a deep breathing session.', icon: '🧘', requirement: (xp) => xp >= 100, color: 'var(--accent)' },
  { id: 'quiz', name: 'Quiz Champion', desc: 'Score points in the daily music trivia quiz.', icon: '🧠', requirement: (xp) => xp >= 180, color: '#00ff66' },
  { id: 'rhythm', name: 'Rhythm Hero', desc: 'Complete a rhythm beat-tapping session.', icon: '⚡', requirement: (xp) => xp >= 250, color: '#ffb700' },
  { id: 'social', name: 'Social Listener', desc: 'Join a synchronized room and listen with friends.', icon: '🤝', requirement: (xp) => xp >= 350, color: '#ff00aa' }
];

export default function Leaderboard() {
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState({
    rhythm: [],
    quiz: [],
    xp: []
  });
  const [leaderboardTab, setLeaderboardTab] = useState('xp'); // 'xp', 'rhythm', 'quiz'
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      if (user?.isOffline) {
        // Fallback mock data
        setLeaderboard({
          xp: [
            { username: user.username, xp: user.xp, level: user.level },
            { username: 'LofiGuru', xp: 580, level: 6 },
            { username: 'BeatMaker', xp: 420, level: 5 },
            { username: 'YogaCalm', xp: 310, level: 4 },
            { username: 'RetroSynth', xp: 190, level: 2 }
          ],
          rhythm: [
            { username: 'BeatMaker', score: 1200, accuracy: 96.5 },
            { username: 'LofiGuru', score: 1050, accuracy: 92.0 },
            { username: user.username, score: 850, accuracy: 88.0 },
            { username: 'RetroSynth', score: 500, accuracy: 80.0 }
          ],
          quiz: [
            { username: 'LofiGuru', score: 100 },
            { username: 'YogaCalm', score: 80 },
            { username: user.username, score: 60 },
            { username: 'RetroSynth', score: 40 }
          ]
        });
        return;
      }

      const response = await fetch('http://localhost:5000/api/games/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.warn('Leaderboard API offline, falling back to local simulation:', e.message);
      // Fallback
      setLeaderboard({
        xp: [
          { username: user?.username || 'Guest', xp: user?.xp || 120, level: user?.level || 2 },
          { username: 'LofiGuru', xp: 580, level: 6 },
          { username: 'BeatMaker', xp: 420, level: 5 },
          { username: 'YogaCalm', xp: 310, level: 4 },
          { username: 'RetroSynth', xp: 190, level: 2 }
        ],
        rhythm: [
          { username: 'BeatMaker', score: 1200, accuracy: 96.5 },
          { username: 'LofiGuru', score: 1050, accuracy: 92.0 },
          { username: user?.username || 'Guest', score: 850, accuracy: 88.0 },
          { username: 'RetroSynth', score: 500, accuracy: 80.0 }
        ],
        quiz: [
          { username: 'LofiGuru', score: 100 },
          { username: 'YogaCalm', score: 80 },
          { username: user?.username || 'Guest', score: 60 },
          { username: 'RetroSynth', score: 40 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  // Calculate XP stats
  const currentXp = user?.xp || 0;
  const userLevel = user?.level || 1;
  const xpInCurrentLevel = currentXp % 100;
  const xpNeededForNextLevel = 100 - xpInCurrentLevel;
  const levelPercent = xpInCurrentLevel; // because 100 XP per level

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🏆 Rewards & Leaderboard
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Level up by relaxing, playing rhythm games, logging mood, and earning custom achievements.</p>
      </div>

      {/* Profile & XP Progress */}
      <div 
        className="glass-panel"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 17, 39, 0.7), rgba(255, 46, 147, 0.03))',
          border: '1px solid rgba(255, 46, 147, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 'bold' }}>
              👤 {user?.username || 'Guest Listener'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>MoodTunes Member</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)', textShadow: '0 0 10px var(--primary-glow)' }}>
              Lvl {userLevel}
            </span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{currentXp} Total XP</p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Progress to Level {userLevel + 1}</span>
            <span>{xpInCurrentLevel}/100 XP ({xpNeededForNextLevel} XP needed)</span>
          </div>
          <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div 
              style={{
                width: `${levelPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                borderRadius: '6px',
                boxShadow: '0 0 10px var(--secondary-glow)',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Badges Cabinet & Global Rankings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', alignItems: 'start' }}>
        {/* Badges Cabinet */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ color: 'var(--secondary)' }}>🏆 Achievement Badges Cabinet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Earn XP milestones across relaxation and games to unlock glowing badges.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {BADGES.map((badge) => {
              const unlocked = badge.requirement(currentXp);
              return (
                <div
                  key={badge.id}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    background: unlocked ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.3)',
                    border: unlocked ? `1px solid ${badge.color}40` : '1px solid rgba(255,255,255,0.02)',
                    opacity: unlocked ? 1 : 0.4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'center',
                    borderRadius: '12px',
                    boxShadow: unlocked ? `0 0 12px ${badge.color}25` : 'none',
                    transition: 'all 0.3s'
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: unlocked ? `linear-gradient(135deg, ${badge.color}, var(--bg-dark))` : 'rgba(255,255,255,0.03)',
                      fontSize: '1.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: unlocked ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: unlocked ? `0 0 10px ${badge.color}` : 'none'
                    }}
                  >
                    {badge.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: unlocked ? '#fff' : 'var(--text-muted)' }}>{badge.name}</h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.2' }}>{badge.desc}</p>
                  </div>
                  <span 
                    style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      color: unlocked ? '#00ff66' : 'var(--text-dim)',
                      marginTop: 'auto'
                    }}
                  >
                    {unlocked ? '✅ Unlocked' : '🔒 Locked'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Leaderboards */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <h3 style={{ color: 'var(--accent)' }}>🥇 Global Leaderboard</h3>
            
            {/* Table Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px' }}>
              <button 
                onClick={() => setBoardTab('xp')}
                style={{ background: leaderboardTab === 'xp' ? 'var(--accent)' : 'none', border: 'none', color: '#fff', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
              >
                XP
              </button>
              <button 
                onClick={() => setBoardTab('rhythm')}
                style={{ background: leaderboardTab === 'rhythm' ? 'var(--accent)' : 'none', border: 'none', color: '#fff', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Rhythm
              </button>
              <button 
                onClick={() => setBoardTab('quiz')}
                style={{ background: leaderboardTab === 'quiz' ? 'var(--accent)' : 'none', border: 'none', color: '#fff', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Quiz
              </button>
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading standings...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px' }}>Rank</th>
                  <th style={{ padding: '8px 4px' }}>Listener</th>
                  {leaderboardTab === 'xp' && <th style={{ padding: '8px 4px', textAlign: 'right' }}>Level (XP)</th>}
                  {leaderboardTab === 'rhythm' && <th style={{ padding: '8px 4px', textAlign: 'right' }}>Score (Acc)</th>}
                  {leaderboardTab === 'quiz' && <th style={{ padding: '8px 4px', textAlign: 'right' }}>Score</th>}
                </tr>
              </thead>
              <tbody>
                {(leaderboard[leaderboardTab] || []).map((row, idx) => {
                  const isUser = row.username === user?.username;
                  return (
                    <tr 
                      key={idx} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background: isUser ? 'rgba(0, 246, 255, 0.05)' : 'none',
                        color: isUser ? 'var(--secondary)' : '#fff'
                      }}
                    >
                      <td style={{ padding: '10px 4px', fontWeight: 'bold' }}>
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`}
                      </td>
                      <td style={{ padding: '10px 4px', fontWeight: isUser ? 'bold' : 'normal' }}>
                        {row.username} {isUser && ' (You)'}
                      </td>
                      
                      {leaderboardTab === 'xp' && (
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '500' }}>
                          Lvl {row.level} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({row.xp} XP)</span>
                        </td>
                      )}
                      {leaderboardTab === 'rhythm' && (
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '500' }}>
                          {row.score} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({row.accuracy}%)</span>
                        </td>
                      )}
                      {leaderboardTab === 'quiz' && (
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '500' }}>
                          {row.score} pts
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
