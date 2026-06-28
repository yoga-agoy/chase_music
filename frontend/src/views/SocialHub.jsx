import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { usePlayback } from '../context/PlaybackContext';

export default function SocialHub() {
  const { user, addXp } = useUser();
  const { playSpecificTrack } = usePlayback();

  // --- Playlists State ---
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackArtist, setNewTrackArtist] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [playlistStatus, setPlaylistStatus] = useState('');

  // --- Chat Room State ---
  const [messages, setMessages] = useState([
    { id: 1, sender: 'System DJ', text: 'Welcome to the MoodTunes Listening lounge! Connect with friends to listen together.', timestamp: Date.now() - 60000, system: true }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sharedTrack, setSharedTrack] = useState({
    title: 'Dreamy Lofi Chill',
    artist: 'Lofi Producer',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    isPlaying: false
  });

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- WebSocket Connection ---
  useEffect(() => {
    if (!user) return;

    // Connect to Node.js backend WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // For local dev, backend runs on port 5000
    const socketUrl = `ws://localhost:5000`;
    
    console.log(`Connecting to WebSocket at ${socketUrl}...`);
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      // Send join event
      socket.send(JSON.stringify({
        type: 'join',
        username: user.username,
        userId: user.id
      }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message.type);

        if (message.type === 'chat_message') {
          setMessages((prev) => [...prev, {
            id: Date.now() + Math.random(),
            sender: message.sender,
            text: message.text,
            timestamp: message.timestamp,
            system: message.system
          }]);
        } else if (message.type === 'sync_playback') {
          setSharedTrack(message.track);
        } else if (message.type === 'playlist_updated') {
          // Refresh playlists lists if updated by someone else
          fetchPlaylists();
          if (selectedPlaylist && selectedPlaylist.id === message.playlistId) {
            fetchPlaylistDetail(message.playlistId);
          }
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    socket.onerror = (e) => {
      console.warn('WebSocket connection error, using local mock updates:', e.message);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (socket) socket.close();
    };
  }, [user, selectedPlaylist]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Playlist APIs ---
  const fetchPlaylists = async () => {
    try {
      if (user?.isOffline) {
        const localPlaylists = JSON.parse(localStorage.getItem('mock_playlists') || '[]');
        setPlaylists(localPlaylists);
        return;
      }
      const response = await fetch('http://localhost:5000/api/playlists');
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      }
    } catch (e) {
      console.warn('Playlist fallback to local storage:', e.message);
      const localPlaylists = JSON.parse(localStorage.getItem('mock_playlists') || '[]');
      setPlaylists(localPlaylists);
    }
  };

  const fetchPlaylistDetail = async (id) => {
    try {
      if (user?.isOffline) {
        const localPlaylists = JSON.parse(localStorage.getItem('mock_playlists') || '[]');
        const p = localPlaylists.find((x) => x.id === id);
        setSelectedPlaylist(p || null);
        return;
      }
      const response = await fetch(`http://localhost:5000/api/playlists/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPlaylist(data);
      }
    } catch (e) {
      console.error('Failed to fetch details:', e);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const data = {
      name: newPlaylistName,
      creatorId: user?.id || 1
    };

    try {
      if (user?.isOffline) {
        const local = JSON.parse(localStorage.getItem('mock_playlists') || '[]');
        const newP = {
          id: Date.now(),
          name: newPlaylistName,
          creator_name: user?.username || 'Guest',
          track_count: 0,
          tracks: []
        };
        local.push(newP);
        localStorage.setItem('mock_playlists', JSON.stringify(local));
        addXp(20);
        setNewPlaylistName('');
        fetchPlaylists();
        return;
      }

      const response = await fetch('http://localhost:5000/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        addXp(20);
        setNewPlaylistName('');
        fetchPlaylists();
      }
    } catch (e) {
      console.error(e);
      // Offline fallback
      const local = JSON.parse(localStorage.getItem('mock_playlists') || '[]');
      const newP = {
        id: Date.now(),
        name: newPlaylistName,
        creator_name: user?.username || 'Guest',
        track_count: 0,
        tracks: []
      };
      local.push(newP);
      localStorage.setItem('mock_playlists', JSON.stringify(local));
      addXp(20);
      setNewPlaylistName('');
      fetchPlaylists();
    }
  };

  const handleAddTrack = async (e) => {
    e.preventDefault();
    if (!newTrackTitle.trim() || !newTrackArtist.trim() || !selectedPlaylist) return;

    const trackData = {
      title: newTrackTitle,
      artist: newTrackArtist,
      url: newTrackUrl.trim() || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: '3:45',
      addedBy: user?.id || 1
    };

    try {
      if (user?.isOffline) {
        const local = JSON.parse(localStorage.getItem('mock_playlists') || '[]');
        const pIdx = local.findIndex((x) => x.id === selectedPlaylist.id);
        if (pIdx !== -1) {
          local[pIdx].tracks = local[pIdx].tracks || [];
          local[pIdx].tracks.push({
            id: Date.now(),
            added_by_name: user?.username || 'Guest',
            ...trackData
          });
          local[pIdx].track_count = local[pIdx].tracks.length;
          localStorage.setItem('mock_playlists', JSON.stringify(local));
          addXp(10);
          setNewTrackTitle('');
          setNewTrackArtist('');
          setNewTrackUrl('');
          fetchPlaylistDetail(selectedPlaylist.id);
          fetchPlaylists();
        }
        return;
      }

      const response = await fetch(`http://localhost:5000/api/playlists/${selectedPlaylist.id}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData)
      });
      if (response.ok) {
        addXp(10);
        setNewTrackTitle('');
        setNewTrackArtist('');
        setNewTrackUrl('');
        fetchPlaylistDetail(selectedPlaylist.id);
        fetchPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Send Chat Message ---
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat',
        text: chatInput
      }));
    } else {
      // Mock local chat message if offline
      setMessages((prev) => [...prev, {
        id: Date.now(),
        sender: user?.username || 'Guest',
        text: chatInput,
        timestamp: Date.now()
      }]);
      // Automated reply from mock bot
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          sender: 'System DJ',
          text: `WebSocket is currently in local offline mode. Setting up live connections requires running backend server.`,
          timestamp: Date.now(),
          system: true
        }]);
      }, 1000);
    }

    setChatInput('');
  };

  // Listen together button click
  const listenTogether = () => {
    // Add track to local player
    playSpecificTrack(sharedTrack);
    addXp(10);
    
    // Broadcast player control to websocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'control_playback',
        track: sharedTrack,
        isPlaying: true,
        progress: 0
      }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          👥 Social Hub
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Create collaborative playlists, join the listening room, and chat with friends in real-time.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Shared Room & Chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Synchronized listening room */}
          <div 
            className="glass-panel" 
            style={{ 
              background: 'linear-gradient(135deg, rgba(22,17,39,0.7), rgba(0,246,255,0.04))',
              border: '1px solid rgba(0, 246, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                className="spin-slow"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--secondary), var(--accent))',
                  boxShadow: '0 0 15px var(--secondary-glow)',
                  fontSize: '1.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}
              >
                💿
              </div>
              <div>
                <span className="badge badge-secondary" style={{ marginBottom: '4px', fontSize: '0.7rem' }}>Now Sharing In Room</span>
                <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 'bold' }}>{sharedTrack.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{sharedTrack.artist}</p>
              </div>
            </div>

            <button onClick={listenTogether} className="neon-btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🎵 Join Listen
            </button>
          </div>

          {/* Group Chat */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
            <h3 style={{ color: '#fff', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💬</span> Room Chat Lounge
            </h3>

            {/* Messages box */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map((msg) => {
                if (msg.system) {
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px' }}>
                        🤖 {msg.text}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.sender === user?.username;
                return (
                  <div 
                    key={msg.id} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      alignSelf: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px', marginLeft: '4px', marginRight: '4px' }}>
                      {msg.sender}
                    </span>
                    <div 
                      style={{ 
                        background: isMe ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'rgba(255, 255, 255, 0.05)',
                        border: isMe ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              />
              <button type="submit" className="neon-btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Playlists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {selectedPlaylist ? (
            /* Selected Playlist Detail */
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div>
                  <button 
                    onClick={() => setSelectedPlaylist(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}
                  >
                    ⬅️ Back to Playlists
                  </button>
                  <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedPlaylist.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Created by {selectedPlaylist.creator_name}</p>
                </div>
                <span className="badge badge-primary">{selectedPlaylist.tracks?.length || 0} Tracks</span>
              </div>

              {/* Tracks list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {(!selectedPlaylist.tracks || selectedPlaylist.tracks.length === 0) ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>This playlist is empty. Add a track below!</p>
                ) : (
                  selectedPlaylist.tracks.map((track, index) => (
                    <div
                      key={track.id || index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          onClick={() => {
                            playSpecificTrack(track);
                            addXp(5);
                            setSharedTrack(track);
                            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                              socketRef.current.send(JSON.stringify({
                                type: 'control_playback',
                                track,
                                isPlaying: true,
                                progress: 0
                              }));
                            }
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                        >
                          ▶️
                        </button>
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{track.title}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{track.artist}</p>
                        </div>
                      </div>
                      
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Added by {track.added_by_name || 'Guest'}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Add track form */}
              <form onSubmit={handleAddTrack} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>➕ Add collaborative track</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Track Title"
                    value={newTrackTitle}
                    onChange={(e) => setNewTrackTitle(e.target.value)}
                    required
                    style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                  <input
                    type="text"
                    placeholder="Artist"
                    value={newTrackArtist}
                    onChange={(e) => setNewTrackArtist(e.target.value)}
                    required
                    style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Audio URL (Optional, defaults to lofi mp3)"
                  value={newTrackUrl}
                  onChange={(e) => setNewTrackUrl(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                />
                <button type="submit" className="neon-btn-primary" style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', alignSelf: 'flex-end' }}>
                  Add to Playlist (+10 XP)
                </button>
              </form>
            </div>
          ) : (
            /* Playlists List */
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ color: '#fff', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                📁 Collaborative Playlists
              </h3>

              {/* Playlists grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {playlists.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>No playlists yet. Create the first one below!</p>
                ) : (
                  playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() => fetchPlaylistDetail(playlist.id)}
                      className="glass-panel-hover"
                      style={{
                        cursor: 'pointer',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>📁 {playlist.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created by {playlist.creator_name || 'System'}</span>
                      </div>
                      <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>
                        {playlist.track_count || 0} Tracks
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Create playlist form */}
              <form onSubmit={handleCreatePlaylist} style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <input
                  type="text"
                  placeholder="New Playlist Name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <button type="submit" className="neon-btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  Create (+20 XP)
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
