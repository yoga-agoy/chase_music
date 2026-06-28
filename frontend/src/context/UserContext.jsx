import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

const BACKEND_URL = 'http://localhost:5000/api';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [xpNotification, setXpNotification] = useState(null);

  // Check localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('moodtunes_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    setLoading(false);
  }, []);

  // Sync user state with backend / localStorage
  const loginUser = async (username) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (!response.ok) throw new Error('Authentication failed');
      const data = await response.json();
      
      setUser(data);
      localStorage.setItem('moodtunes_user', JSON.stringify(data));
      return data;
    } catch (e) {
      console.error(e.message);
      // Fallback local user if backend is offline
      const mockUser = {
        id: 999,
        username: username,
        xp: 120,
        level: 2,
        isOffline: true
      };
      setUser(mockUser);
      localStorage.setItem('moodtunes_user', JSON.stringify(mockUser));
      return mockUser;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('moodtunes_user');
  };

  // Add XP and trigger beautiful floating visual indicator
  const addXp = async (amount) => {
    if (!user) return;
    
    // Show visual pop-up
    setXpNotification(`+${amount} XP`);
    setTimeout(() => setXpNotification(null), 3000);

    if (user.isOffline) {
      const updatedXp = user.xp + amount;
      const updatedLevel = Math.floor(updatedXp / 100) + 1;
      const updated = {
        ...user,
        xp: updatedXp,
        level: updatedLevel
      };
      setUser(updated);
      localStorage.setItem('moodtunes_user', JSON.stringify(updated));
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/add-xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, xpToAdd: amount })
      });
      if (response.ok) {
        const data = await response.json();
        setUser((prev) => {
          const updated = {
            ...prev,
            xp: data.xp,
            level: data.level
          };
          localStorage.setItem('moodtunes_user', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.error('Error adding XP to backend:', e.message);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        loginUser,
        logoutUser,
        addXp,
        xpNotification
      }}
    >
      {children}
      
      {/* Floating XP Alert Indicator */}
      {xpNotification && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 'bold',
            boxShadow: '0 0 20px rgba(255, 46, 147, 0.4)',
            zIndex: 1000,
            animation: 'float-particle 3s ease-out forwards',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⭐</span> {xpNotification}
        </div>
      )}
    </UserContext.Provider>
  );
};
