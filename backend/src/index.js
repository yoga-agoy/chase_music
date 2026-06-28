import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import db, { initializeDatabase } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(cors({
  origin: '*', // For demo purposes, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// --- Database Auto-initialization and seeding ---
let dbInitialized = false;

// Simple track library to preseed when database starts
const PRESEEDED_TRACKS = [
  { title: 'Dreamy Lofi Chill', artist: 'Lofi Producer', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: '6:12' },
  { title: 'Midnight Coffee', artist: 'Jazz Cafe', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: '7:05' },
  { title: 'Focus Flow', artist: 'Study Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: '5:02' },
  { title: 'Sleepy Ocean Waves', artist: 'Nature Ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', duration: '5:18' }
];

async function seedDefaultData() {
  try {
    // 1. Create a system user if none exists
    const users = await db.query('SELECT * FROM users LIMIT 1');
    let systemUserId = 1;
    if (users.length === 0) {
      await db.query(
        "INSERT INTO users (id, username, password, xp, level) VALUES (1, 'MoodTunesDJ', 'system_dj', 1000, 10)"
      );
      console.log('System DJ user seeded.');
    } else {
      systemUserId = users[0].id;
    }

    // 2. Create a default playlist if none exists
    const playlists = await db.query('SELECT * FROM playlists LIMIT 1');
    let playlistId = 1;
    if (playlists.length === 0) {
      const res = await db.query(
        "INSERT INTO playlists (name, creator_id, is_collaborative) VALUES ('Lofi Relaxation Station', ?, true)",
        [systemUserId]
      );
      playlistId = res.insertId;
      console.log('Default playlist seeded.');

      // 3. Add default tracks to it
      for (const track of PRESEEDED_TRACKS) {
        await db.query(
          "INSERT INTO playlist_tracks (playlist_id, title, artist, url, duration, added_by) VALUES (?, ?, ?, ?, ?, ?)",
          [playlistId, track.title, track.artist, track.url, track.duration, systemUserId]
        );
      }
      console.log('Default tracks added to playlist.');
    }
  } catch (err) {
    console.error('Error seeding default data:', err.message);
  }
}

// --- Express API Routes ---

// 1. Authentication (Auto Register & Login for ease of use)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Find or create user automatically (seamless demo experience)
    let rows = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    let user;

    if (rows.length === 0) {
      const insertResult = await db.query(
        'INSERT INTO users (username, password, xp, level) VALUES (?, ?, 0, 1)',
        [username, password || 'default_pass']
      );
      const newUserId = insertResult.insertId;
      const selectResult = await db.query('SELECT * FROM users WHERE id = ?', [newUserId]);
      user = selectResult[0];
      console.log(`Registered new user: ${username}`);
    } else {
      user = rows[0];
      console.log(`Logged in user: ${username}`);
    }

    res.json({
      id: user.id,
      username: user.username,
      xp: user.xp,
      level: user.level,
      created_at: user.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update XP and Level Up Check
app.post('/api/auth/add-xp', async (req, res) => {
  const { userId, xpToAdd } = req.body;
  if (!userId || !xpToAdd) {
    return res.status(400).json({ error: 'userId and xpToAdd are required' });
  }

  try {
    const users = await db.query('SELECT xp, level, username FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentXp = users[0].xp + xpToAdd;
    // Simple level up algorithm: every 100 XP is a level
    const nextLevel = Math.floor(currentXp / 100) + 1;
    const oldLevel = users[0].level;

    await db.query('UPDATE users SET xp = ?, level = ? WHERE id = ?', [currentXp, nextLevel, userId]);

    res.json({
      userId,
      xp: currentXp,
      level: nextLevel,
      leveledUp: nextLevel > oldLevel,
      message: nextLevel > oldLevel ? `Level Up! You are now level ${nextLevel}!` : `Added ${xpToAdd} XP.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Mood Logs
app.post('/api/mood/log', async (req, res) => {
  const { userId, score, notes } = req.body;
  if (!userId || !score) {
    return res.status(400).json({ error: 'userId and score are required' });
  }

  try {
    await db.query('INSERT INTO mood_logs (user_id, score, notes) VALUES (?, ?, ?)', [userId, score, notes || '']);

    // Reward mood tracking with 15 XP
    const users = await db.query('SELECT xp, level FROM users WHERE id = ?', [userId]);
    let xpInfo = {};
    if (users.length > 0) {
      const newXp = users[0].xp + 15;
      const nextLevel = Math.floor(newXp / 100) + 1;
      await db.query('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, nextLevel, userId]);
      xpInfo = { xp: newXp, level: nextLevel, leveledUp: nextLevel > users[0].level };
    }

    res.json({ success: true, message: 'Mood logged successfully! Earned 15 XP.', ...xpInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mood/history/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const logs = await db.query(
      'SELECT id, score, notes, logged_at FROM mood_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 30',
      [userId]
    );
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Playlists (Collaborative)
app.get('/api/playlists', async (req, res) => {
  try {
    const playlists = await db.query(`
      SELECT p.*, u.username as creator_name, COUNT(t.id) as track_count
      FROM playlists p
      JOIN users u ON p.creator_id = u.id
      LEFT JOIN playlist_tracks t ON p.id = t.playlist_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/playlists', async (req, res) => {
  const { name, creatorId } = req.body;
  if (!name || !creatorId) {
    return res.status(400).json({ error: 'name and creatorId are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO playlists (name, creator_id, is_collaborative) VALUES (?, ?, true)',
      [name, creatorId]
    );
    // Award playlist creation with 20 XP
    const users = await db.query('SELECT xp, level FROM users WHERE id = ?', [creatorId]);
    if (users.length > 0) {
      const newXp = users[0].xp + 20;
      const nextLevel = Math.floor(newXp / 100) + 1;
      await db.query('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, nextLevel, creatorId]);
    }
    res.json({ id: result.insertId, name, creator_id: creatorId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/playlists/:playlistId', async (req, res) => {
  const { playlistId } = req.params;
  try {
    const playlists = await db.query('SELECT * FROM playlists WHERE id = ?', [playlistId]);
    if (playlists.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const tracks = await db.query(`
      SELECT pt.*, u.username as added_by_name
      FROM playlist_tracks pt
      JOIN users u ON pt.added_by = u.id
      WHERE pt.playlist_id = ?
      ORDER BY pt.added_at ASC
    `, [playlistId]);

    res.json({
      ...playlists[0],
      tracks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/playlists/:playlistId/tracks', async (req, res) => {
  const { playlistId } = req.params;
  const { title, artist, url, duration, addedBy } = req.body;

  if (!title || !artist || !addedBy) {
    return res.status(400).json({ error: 'title, artist, and addedBy are required' });
  }

  try {
    await db.query(
      'INSERT INTO playlist_tracks (playlist_id, title, artist, url, duration, added_by) VALUES (?, ?, ?, ?, ?, ?)',
      [playlistId, title, artist, url || '', duration || '3:30', addedBy]
    );

    // Reward adding track with 10 XP
    const users = await db.query('SELECT xp, level FROM users WHERE id = ?', [addedBy]);
    if (users.length > 0) {
      const newXp = users[0].xp + 10;
      const nextLevel = Math.floor(newXp / 100) + 1;
      await db.query('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, nextLevel, addedBy]);
    }

    // Broadcast playlist change to all listening WS clients
    broadcastToAll({
      type: 'playlist_updated',
      playlistId: parseInt(playlistId)
    });

    res.json({ success: true, message: 'Track added! Earned 10 XP.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Music Games & Leaderboard
app.post('/api/games/score', async (req, res) => {
  const { userId, gameType, score, accuracy } = req.body;
  if (!userId || !gameType || score === undefined) {
    return res.status(400).json({ error: 'userId, gameType, and score are required' });
  }

  try {
    await db.query(
      'INSERT INTO high_scores (user_id, game_type, score, accuracy) VALUES (?, ?, ?, ?)',
      [userId, gameType, score, accuracy || 100.0]
    );

    // Dynamic XP Reward: score/10 for rhythm game, or flat 50 for quiz
    const xpReward = gameType === 'rhythm' ? Math.max(10, Math.floor(score / 50)) : Math.floor(score);
    const users = await db.query('SELECT xp, level FROM users WHERE id = ?', [userId]);
    let xpInfo = {};

    if (users.length > 0) {
      const newXp = users[0].xp + xpReward;
      const nextLevel = Math.floor(newXp / 100) + 1;
      await db.query('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, nextLevel, userId]);
      xpInfo = { xp: newXp, level: nextLevel, leveledUp: nextLevel > users[0].level };
    }

    res.json({
      success: true,
      message: `Score recorded! Earned ${xpReward} XP.`,
      xpEarned: xpReward,
      ...xpInfo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games/leaderboard', async (req, res) => {
  try {
    const rhythmLeaderboard = await db.query(`
      SELECT hs.score, hs.accuracy, hs.played_at, u.username
      FROM high_scores hs
      JOIN users u ON hs.user_id = u.id
      WHERE hs.game_type = 'rhythm'
      ORDER BY hs.score DESC, hs.accuracy DESC
      LIMIT 10
    `);

    const quizLeaderboard = await db.query(`
      SELECT hs.score, hs.played_at, u.username
      FROM high_scores hs
      JOIN users u ON hs.user_id = u.id
      WHERE hs.game_type = 'quiz'
      ORDER BY hs.score DESC
      LIMIT 10
    `);

    const overallXpLeaderboard = await db.query(`
      SELECT username, xp, level
      FROM users
      ORDER BY xp DESC
      LIMIT 10
    `);

    res.json({
      rhythm: rhythmLeaderboard,
      quiz: quizLeaderboard,
      xp: overallXpLeaderboard
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. External Web APIs Proxies (Deezer primary, iTunes fallback, & Lyrics.ovh)
app.get('/api/music/search', async (req, res) => {
  const { term } = req.query;
  if (!term) {
    return res.status(400).json({ error: 'Search term is required' });
  }

  try {
    // Attempt 1: Deezer API (returns universal MP3 streams and HTTPS artwork)
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(term)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const tracks = data.data.map((track) => ({
          id: track.id,
          title: track.title,
          artist: track.artist.name,
          album: track.album.title,
          previewUrl: track.preview ? track.preview.replace('http://', 'https://') : null, // Ensure HTTPS
          coverUrl: track.album.cover_medium ? track.album.cover_medium.replace('http://', 'https://') : null,
          duration: track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '3:30'
        })).filter(t => t.previewUrl);

        if (tracks.length > 0) {
          console.log(`Successfully fetched ${tracks.length} tracks from Deezer for query: ${term}`);
          return res.json(tracks);
        }
      }
    }
  } catch (deezerError) {
    console.warn('Deezer API fetch failed or was blocked, trying iTunes fallback:', deezerError.message);
  }

  // Attempt 2: Fallback to iTunes Search API
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=25`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`iTunes API returned status ${response.status}`);
    }
    const data = await response.json();

    const tracks = (data.results || []).map((track) => ({
      id: track.trackId,
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      previewUrl: track.previewUrl ? track.previewUrl.replace('http://', 'https://') : null, // Ensure HTTPS
      coverUrl: track.artworkUrl100 ? track.artworkUrl100.replace('http://', 'https://') : null,
      duration: track.trackTimeMillis ? `${Math.floor(track.trackTimeMillis / 60000)}:${Math.floor((track.trackTimeMillis % 60000) / 1000).toString().padStart(2, '0')}` : '3:30'
    })).filter(t => t.previewUrl);

    console.log(`Fetched ${tracks.length} tracks from iTunes fallback for query: ${term}`);
    res.json(tracks);
  } catch (err) {
    console.error('All music search proxies failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve tracks' });
  }
});

app.get('/api/music/lyrics', async (req, res) => {
  const { artist, title } = req.query;
  if (!artist || !title) {
    return res.status(400).json({ error: 'artist and title are required' });
  }

  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Lyrics API returned status ${response.status}`);
    }
    const data = await response.json();
    res.json({ lyrics: data.lyrics || '' });
  } catch (err) {
    console.warn(`Lyrics.ovh failed for ${artist} - ${title}, using fallback dummy generator:`, err.message);
    // Provide a neat mock lyric set matching the query so the game is always playable!
    res.json({
      lyrics: `(This is a calming placeholder lyrics loop for ${title} by ${artist})\nLa la la... Ooh yeah...\nFeel the rhythm, let it go...\nTake a deep breath and relax...\nLet the healing music flow...`
    });
  }
});

// Create Server
const server = createServer(app);

// --- WebSocket Live listening and Group Chat Room ---
const wss = new WebSocketServer({ server });

// Current shared room playback state (synchronized for social hub)
let currentSharedTrack = {
  title: 'Dreamy Lofi Chill',
  artist: 'Lofi Producer',
  url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  isPlaying: false,
  progress: 0,
  updatedAt: Date.now()
};

// Keep track of connected clients
const clients = new Map(); // ws -> { username, id }

function broadcastToAll(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New client connected to WebSocket room');
  clients.set(ws, { username: 'Anonymous Listener', id: Math.random().toString(36).substr(2, 9) });

  // Send current track state and welcoming message
  ws.send(JSON.stringify({
    type: 'sync_playback',
    track: currentSharedTrack
  }));

  ws.on('message', (messageBuffer) => {
    try {
      const data = JSON.parse(messageBuffer.toString());
      console.log('WS Message received:', data.type);

      switch (data.type) {
        case 'join':
          clients.set(ws, { username: data.username, id: data.userId });
          // Broadcast user joined
          broadcastToAll({
            type: 'chat_message',
            sender: 'System DJ',
            text: `${data.username} joined the relaxation lounge.`,
            timestamp: Date.now(),
            system: true
          });
          break;

        case 'chat':
          const clientInfo = clients.get(ws);
          broadcastToAll({
            type: 'chat_message',
            sender: clientInfo.username,
            text: data.text,
            timestamp: Date.now()
          });
          break;

        case 'control_playback':
          // Admin or collaborative playback controls
          currentSharedTrack = {
            ...currentSharedTrack,
            title: data.track.title,
            artist: data.track.artist,
            url: data.track.url,
            isPlaying: data.isPlaying,
            progress: data.progress,
            updatedAt: Date.now()
          };
          broadcastToAll({
            type: 'sync_playback',
            track: currentSharedTrack,
            controlledBy: clients.get(ws)?.username || 'Someone'
          });
          break;

        default:
          break;
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e.message);
    }
  });

  ws.on('close', () => {
    const clientInfo = clients.get(ws);
    console.log(`${clientInfo?.username || 'Client'} disconnected`);
    if (clientInfo && clientInfo.username !== 'Anonymous Listener') {
      broadcastToAll({
        type: 'chat_message',
        sender: 'System DJ',
        text: `${clientInfo.username} left the lounge.`,
        timestamp: Date.now(),
        system: true
      });
    }
    clients.delete(ws);
  });
});

// Startup Server
async function startServer() {
  try {
    await initializeDatabase();
    await seedDefaultData();
    dbInitialized = true;

    server.listen(port, () => {
      console.log(`========================================`);
      console.log(`MoodTunes server running on port ${port}`);
      console.log(`WebSockets listening on ws://localhost:${port}`);
      console.log(`========================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
