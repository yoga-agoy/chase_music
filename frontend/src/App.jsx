import React, { useState } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { PlaybackProvider, usePlayback } from './context/PlaybackContext';
import MusicPlayer from './views/MusicPlayer';
import MoodTracker from './views/MoodTracker';
import MusicGames from './views/MusicGames';
import SocialHub from './views/SocialHub';
import Leaderboard from './views/Leaderboard';
import AudioPlayer from './components/AudioPlayer';

function AppContent() {
  const { user, loginUser, logoutUser } = useUser();
  const [activeView, setActiveView] = useState('music');
  const [usernameInput, setUsernameInput] = useState('');
  const [authError, setAuthError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    
    try {
      await loginUser(usernameInput.trim());
      setAuthError('');
    } catch (err) {
      setAuthError('Failed to connect to backend server. Operating in local mode.');
    }
  };

  // If user is not logged in, render the Login Screen
  if (!user) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'radial-gradient(circle at 50% 50%, #1e1140 0%, #07040d 80%)'
        }}
      >
        <div 
          className="glass-panel" 
          style={{ 
            width: '100%', 
            maxWidth: '420px', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 246, 255, 0.15)',
            border: '1px solid rgba(0, 246, 255, 0.2)'
          }}
        >
          <div>
            <h1 
              className="glow-text-primary"
              style={{
                fontFamily: 'Outfit',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#fff',
                marginBottom: '8px',
                letterSpacing: '-0.5px'
              }}
            >
              🎵 MoodTunes
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Your space for music, relaxation, games, and friends.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label htmlFor="username" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Choose a listener username
              </label>
              <input
                id="username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. LofiChiller"
                required
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--secondary)';
                  e.target.style.boxShadow = '0 0 10px rgba(0, 246, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {authError && (
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>
                {authError}
              </span>
            )}

            <button type="submit" className="neon-btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
              Enter Lounge 🚀
            </button>
          </form>

          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            Enter any name to instantly create or resume your profile.
          </p>
        </div>
      </div>
    );
  }

  // Navigation link helper
  const navItem = (id, icon, label) => {
    const isActive = activeView === id;
    return (
      <button
        onClick={() => setActiveView(id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          padding: '12px 16px',
          background: isActive ? 'rgba(0, 246, 255, 0.08)' : 'transparent',
          border: 'none',
          borderLeft: isActive ? '4px solid var(--secondary)' : '4px solid transparent',
          color: isActive ? '#fff' : 'var(--text-muted)',
          fontSize: '0.95rem',
          fontWeight: isActive ? 600 : 500,
          textAlign: 'left',
          cursor: 'pointer',
          borderRadius: '0 8px 8px 0',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.target.style.background = 'rgba(255,255,255,0.02)';
            e.target.style.color = '#fff';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.target.style.background = 'transparent';
            e.target.style.color = 'var(--text-muted)';
          }
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Sidebar Navigation */}
      <div
        style={{
          width: '250px',
          background: 'rgba(11, 8, 19, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: '90px',
          left: 0,
          zIndex: 10,
          padding: '24px 0'
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 24px', marginBottom: '32px' }}>
          <h1 
            style={{ 
              fontSize: '1.6rem', 
              fontWeight: 800, 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              letterSpacing: '-0.5px' 
            }}
          >
            <span style={{ textShadow: '0 0 10px var(--primary)' }}>🎵</span> MoodTunes
          </h1>
        </div>

        {/* Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {navItem('music', '🎵', 'Music Player')}
          {navItem('mood', '📊', 'Mood Tracker')}
          {navItem('games', '🎮', 'Music Games')}
          {navItem('social', '👥', 'Social Hub')}
          {navItem('leaderboard', '🏆', 'Leaderboard')}
        </nav>

        {/* User Card */}
        <div style={{ padding: '0 16px', marginTop: 'auto' }}>
          <div 
            className="glass-panel" 
            style={{ 
              padding: '14px', 
              borderRadius: '12px', 
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                👤 {user.username}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>Level {user.level}</span>
                <span>{user.xp} XP</span>
              </div>
            </div>
            
            <button
              onClick={logoutUser}
              style={{
                background: 'none',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted)',
                padding: '6px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = 'var(--text-muted)'; }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main 
        style={{ 
          flex: 1, 
          marginLeft: '250px', 
          padding: '40px',
          maxWidth: '1200px',
          marginRight: 'auto'
        }}
      >
        {activeView === 'music' && <MusicPlayer />}
        {activeView === 'mood' && <MoodTracker />}
        {activeView === 'games' && <MusicGames />}
        {activeView === 'social' && <SocialHub />}
        {activeView === 'leaderboard' && <Leaderboard />}
      </main>

      {/* Floating Audio Player */}
      <AudioPlayer />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <PlaybackProvider>
        <AppContent />
      </PlaybackProvider>
    </UserProvider>
  );
}
