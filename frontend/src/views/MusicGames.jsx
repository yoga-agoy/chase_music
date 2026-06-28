import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Which legendary artist is known as the 'King of Pop'?",
    options: ["Prince", "Michael Jackson", "Stevie Wonder", "David Bowie"],
    answer: "Michael Jackson",
    xp: 15
  },
  {
    id: 2,
    question: "Which of the following songs is performed by The Weeknd?",
    options: ["Shape of You", "Blinding Lights", "Circles", "Peaches"],
    answer: "Blinding Lights",
    xp: 15
  },
  {
    id: 3,
    question: "Complete the lyric: 'Is this the real life? Is this just ________?'",
    options: ["a dream", "fantasy", "make believe", "illusion"],
    answer: "fantasy",
    xp: 15
  },
  {
    id: 4,
    question: "What was the title of Adele's record-breaking 2015 studio album?",
    options: ["19", "21", "25", "30"],
    answer: "25",
    xp: 15
  },
  {
    id: 5,
    question: "Which band sang the hit track 'Bohemian Rhapsody'?",
    options: ["The Beatles", "Led Zeppelin", "Pink Floyd", "Queen"],
    answer: "Queen",
    xp: 15
  }
];

// Fallback questions if the network/iTunes API fails
const REGIONAL_FALLBACK_QUIZ = {
  hindi: [
    { question: "Who sang 'Kesariya' from Brahmastra?", options: ["Arijit Singh", "Jubin Nautiyal", "Armaan Malik", "Atif Aslam"], answer: "Arijit Singh" },
    { question: "Complete the lyric: 'Kesariya tera ishq hai piya, rang jaaun jo main haath ________'", options: ["lagaaun", "sajaaun", "milaaun", "bulaaun"], answer: "lagaaun" }
  ],
  tamil: [
    { question: "Which movie features the track 'Naan Pizhai'?", options: ["Kaathuvaakula Rendu Kaadhal", "Master", "Doctor", "Don"], answer: "Kaathuvaakula Rendu Kaadhal" },
    { question: "Who composed 'Arabic Kuthu'?", options: ["Anirudh Ravichander", "A. R. Rahman", "Yuvan Shankar Raja", "Harris Jayaraj"], answer: "Anirudh Ravichander" }
  ],
  malayalam: [
    { question: "Which movie features 'Darshana'?", options: ["Hridayam", "Premam", "Kumbalangi Nights", "Bangalore Days"], answer: "Hridayam" },
    { question: "Who composed 'Malare' from Premam?", options: ["Rajesh Murugesan", "Shaan Rahman", "Gopi Sundar", "Sushin Shyam"], answer: "Rajesh Murugesan" }
  ]
};

export default function MusicGames() {
  const { user, addXp } = useUser();
  const [activeTab, setActiveTab] = useState('rhythm'); // 'rhythm', 'quiz', or 'regional'

  // --- General Quiz State ---
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizStatus, setQuizStatus] = useState('');

  // --- Regional Web API Quiz State ---
  const [selectedLanguage, setSelectedLanguage] = useState(null); // 'hindi', 'tamil', 'malayalam'
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [regionalIndex, setRegionalIndex] = useState(0);
  const [regionalSelected, setRegionalSelected] = useState(null);
  const [regionalScore, setRegionalScore] = useState(0);
  const [regionalFinished, setRegionalFinished] = useState(false);
  const [regionalStatus, setRegionalStatus] = useState('');

  // Audio state inside game
  const [clipPlaying, setClipPlaying] = useState(false);
  const gameAudioRef = useRef(null);

  // --- Rhythm Game State & Refs ---
  const [rhythmPlaying, setRhythmPlaying] = useState(false);
  const [rhythmScore, setRhythmScore] = useState(0);
  const [rhythmAccuracy, setRhythmAccuracy] = useState(100);
  const [rhythmFeedback, setRhythmFeedback] = useState('');
  const [rhythmFinished, setRhythmFinished] = useState(false);

  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const notesRef = useRef([]);
  const keysRef = useRef({ s: false, d: false, k: false, l: false });

  // Game metrics
  const hitsRef = useRef(0);
  const totalNotesRef = useRef(0);
  const totalPointsRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);

  // Stop regional clip on unmount or tab change
  useEffect(() => {
    return () => {
      stopClip();
    };
  }, [activeTab]);

  const stopClip = () => {
    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
      gameAudioRef.current = null;
    }
    setClipPlaying(false);
  };

  const playClip = (url) => {
    if (!url) return;
    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
    }
    const audio = new Audio(url);
    audio.volume = 0.5;
    gameAudioRef.current = audio;

    audio.play()
      .then(() => setClipPlaying(true))
      .catch((e) => console.error("Game audio play blocked:", e));

    audio.onended = () => {
      setClipPlaying(false);
    };
  };

  const toggleClip = (url) => {
    if (clipPlaying) {
      stopClip();
    } else {
      playClip(url);
    }
  };

  // --- General Quiz Functions ---
  const handleQuizAnswer = (option) => {
    if (quizSelected) return;
    setQuizSelected(option);

    const correct = option === QUIZ_QUESTIONS[quizIndex].answer;
    if (correct) {
      setQuizScore((prev) => prev + 1);
      setQuizStatus('Correct! +15 XP');
      addXp(15);
    } else {
      setQuizStatus(`Incorrect. The answer was ${QUIZ_QUESTIONS[quizIndex].answer}`);
    }
  };

  const nextQuizQuestion = () => {
    setQuizSelected(null);
    setQuizStatus('');
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      submitScore('quiz', quizScore * 20); // 100 max score
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizSelected(null);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizStatus('');
  };

  // --- Fetch and Generate Regional Questions Dynamically ---
  const initializeRegionalQuiz = async (lang) => {
    setSelectedLanguage(lang);
    setLoadingTracks(true);
    setQuestions([]);
    setRegionalIndex(0);
    setRegionalSelected(null);
    setRegionalScore(0);
    setRegionalFinished(false);
    setRegionalStatus('');
    stopClip();

    // Map language to query keywords
    let searchTerm = 'Bollywood hits';
    if (lang === 'tamil') searchTerm = 'Tamil hits';
    if (lang === 'malayalam') searchTerm = 'Malayalam hits';
    if (lang === 'hindi') searchTerm = 'Hindi hits';

    try {
      const response = await fetch(`http://localhost:5000/api/music/search?term=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Search failed');
      const tracks = await response.json();

      if (!tracks || tracks.length < 4) {
        throw new Error('Not enough tracks returned');
      }

      // Generate 4 dynamic questions from search results
      const generatedQuestions = [];
      const shuffledTracks = [...tracks].sort(() => 0.5 - Math.random());

      for (let i = 0; i < Math.min(5, shuffledTracks.length); i++) {
        const targetTrack = shuffledTracks[i];

        // Pick question type
        const qType = i % 2 === 0 ? 'title' : 'artist';
        let questionText = '';
        let correctAnswer = '';
        let options = [];

        if (qType === 'title') {
          questionText = `Listen to the audio clip. What is the title of this song?`;
          correctAnswer = targetTrack.title;

          // Gather 3 wrong title options
          const wrongOptions = tracks
            .filter(t => t.title !== targetTrack.title)
            .map(t => t.title);
          const uniqueWrong = [...new Set(wrongOptions)].slice(0, 3);
          options = [correctAnswer, ...uniqueWrong].sort(() => 0.5 - Math.random());
        } else {
          questionText = `Listen to the audio clip. Who is the performing artist/singer?`;
          correctAnswer = targetTrack.artist;

          // Gather 3 wrong artist options
          const wrongOptions = tracks
            .filter(t => t.artist !== targetTrack.artist)
            .map(t => t.artist);
          const uniqueWrong = [...new Set(wrongOptions)].slice(0, 3);
          options = [correctAnswer, ...uniqueWrong].sort(() => 0.5 - Math.random());
        }

        generatedQuestions.push({
          id: `dyn_${lang}_${i}`,
          question: questionText,
          audioUrl: targetTrack.previewUrl,
          coverUrl: targetTrack.coverUrl,
          options,
          answer: correctAnswer,
          info: `Track: ${targetTrack.title} | Album: ${targetTrack.album || 'Single'}`
        });
      }

      setQuestions(generatedQuestions);
    } catch (e) {
      console.warn('Dynamic API failed, falling back to static regional questions:', e.message);
      // Load static fallback
      const fallback = REGIONAL_FALLBACK_QUIZ[lang].map((q, idx) => ({
        id: `fb_${lang}_${idx}`,
        question: q.question,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // default sample
        coverUrl: 'https://via.placeholder.com/150',
        options: q.options,
        answer: q.answer,
        info: 'Fallback local question (Offline Mode)'
      }));
      setQuestions(fallback);
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleRegionalAnswer = (option) => {
    if (regionalSelected) return;
    setRegionalSelected(option);

    const correct = option === questions[regionalIndex].answer;
    if (correct) {
      setRegionalScore((prev) => prev + 1);
      setRegionalStatus('Correct! +20 XP 🌟');
      addXp(20);
    } else {
      setRegionalStatus(`Incorrect. Correct answer: ${questions[regionalIndex].answer}`);
    }
  };

  const nextRegionalQuestion = () => {
    stopClip();
    setRegionalSelected(null);
    setRegionalStatus('');
    if (regionalIndex < questions.length - 1) {
      setRegionalIndex((prev) => prev + 1);
    } else {
      setRegionalFinished(true);
      const scorePercent = Math.round((regionalScore / questions.length) * 100);
      submitScore(`quiz_${selectedLanguage}`, scorePercent);
    }
  };

  // --- Rhythm Game Loops & Canvas ---
  const startRhythmGame = () => {
    setRhythmPlaying(true);
    setRhythmScore(0);
    setRhythmAccuracy(100);
    setRhythmFeedback('GET READY!');
    setRhythmFinished(false);

    notesRef.current = [];
    hitsRef.current = 0;
    totalNotesRef.current = 0;
    totalPointsRef.current = 0;
    lastSpawnTimeRef.current = Date.now();

    setTimeout(() => {
      setRhythmFeedback('GO!');
    }, 1000);
  };

  const submitScore = async (gameType, scoreVal, accuracyVal = 100) => {
    const data = {
      userId: user?.id || 1,
      gameType,
      score: scoreVal,
      accuracy: accuracyVal
    };

    try {
      if (user?.isOffline) {
        addXp(Math.max(10, Math.floor(scoreVal / 4)));
        return;
      }

      await fetch('http://localhost:5000/api/games/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      addXp(Math.max(10, Math.floor(scoreVal / 4)));
    }
  };

  // Canvas Game loop
  useEffect(() => {
    if (!rhythmPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width = 400;
    const height = canvas.height = 420;

    const lanesCount = 4;
    const laneWidth = width / lanesCount;
    const keyLabels = ['S', 'D', 'K', 'L'];
    const laneColors = ['#ff2e93', '#9f14ff', '#00f6ff', '#00ff66'];

    const targetY = height - 60;
    const targetThreshold = 25;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['s', 'd', 'k', 'l'].includes(key)) {
        e.preventDefault();
        if (keysRef.current[key]) return;
        keysRef.current[key] = true;

        const laneIndex = ['s', 'd', 'k', 'l'].indexOf(key);
        let noteHitIndex = -1;
        let scoreDiff = 0;
        let accuracyFeedback = 'MISS';

        for (let i = 0; i < notesRef.current.length; i++) {
          const note = notesRef.current[i];
          if (note.lane === laneIndex && !note.hit) {
            const distance = Math.abs(note.y - targetY);
            if (distance < targetThreshold) {
              noteHitIndex = i;
              if (distance < 12) {
                scoreDiff = 100;
                accuracyFeedback = 'PERFECT!';
                hitsRef.current += 1;
              } else {
                scoreDiff = 50;
                accuracyFeedback = 'GOOD';
                hitsRef.current += 0.5;
              }
              break;
            }
          }
        }

        if (noteHitIndex !== -1) {
          notesRef.current[noteHitIndex].hit = true;
          totalPointsRef.current += scoreDiff;
          setRhythmScore(totalPointsRef.current);
          setRhythmFeedback(accuracyFeedback);
          lanesFlashRef.current[laneIndex] = 10;
        } else {
          setRhythmFeedback('MISS');
        }

        updateAccuracy();
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['s', 'd', 'k', 'l'].includes(key)) {
        keysRef.current[key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const lanesFlashRef = { current: [0, 0, 0, 0] };
    const gameStart = Date.now();
    const gameDuration = 30000;

    const updateAccuracy = () => {
      if (totalNotesRef.current === 0) return;
      const acc = Math.round((hitsRef.current / totalNotesRef.current) * 100);
      setRhythmAccuracy(acc);
    };

    const gameLoop = () => {
      const now = Date.now();
      const elapsed = now - gameStart;

      if (elapsed > gameDuration) {
        setRhythmPlaying(false);
        setRhythmFinished(true);
        const finalAcc = totalNotesRef.current === 0 ? 100 : Math.round((hitsRef.current / totalNotesRef.current) * 100);
        submitScore('rhythm', totalPointsRef.current, finalAcc);
        addXp(Math.max(10, Math.floor(totalPointsRef.current / 50)));
        return;
      }

      ctx.fillStyle = '#0f0b1e';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < lanesCount; i++) {
        ctx.fillStyle = keysRef.current[keyLabels[i].toLowerCase()]
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(255,255,255,0.01)';
        ctx.fillRect(i * laneWidth, 0, laneWidth, height);

        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, height);
        ctx.stroke();

        if (lanesFlashRef.current[i] > 0) {
          ctx.fillStyle = `rgba(${i === 0 ? '255,46,147' : i === 1 ? '159,20,255' : i === 2 ? '0,246,255' : '0,255,102'}, ${lanesFlashRef.current[i] / 15})`;
          ctx.fillRect(i * laneWidth, 0, laneWidth, height);
          lanesFlashRef.current[i] -= 1;
        }

        ctx.strokeStyle = laneColors[i];
        ctx.lineWidth = keysRef.current[keyLabels[i].toLowerCase()] ? 4 : 2;
        ctx.shadowBlur = keysRef.current[keyLabels[i].toLowerCase()] ? 15 : 0;
        ctx.shadowColor = laneColors[i];
        ctx.beginPath();
        ctx.arc(i * laneWidth + laneWidth / 2, targetY, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 14px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(keyLabels[i], i * laneWidth + laneWidth / 2, targetY + 35);
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, targetY);
      ctx.lineTo(width, targetY);
      ctx.stroke();

      const timeSinceLastSpawn = now - lastSpawnTimeRef.current;
      if (timeSinceLastSpawn > 750 && Math.random() < 0.8) {
        const randomLane = Math.floor(Math.random() * lanesCount);
        notesRef.current.push({
          lane: randomLane,
          y: -20,
          speed: 4.5,
          hit: false
        });
        totalNotesRef.current += 1;
        lastSpawnTimeRef.current = now;
      }

      for (let i = notesRef.current.length - 1; i >= 0; i--) {
        const note = notesRef.current[i];
        note.y += note.speed;

        if (!note.hit && note.y < height) {
          ctx.fillStyle = laneColors[note.lane];
          ctx.shadowBlur = 12;
          ctx.shadowColor = laneColors[note.lane];
          ctx.beginPath();
          ctx.arc(note.lane * laneWidth + laneWidth / 2, note.y, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        if (note.y > targetY + targetThreshold && !note.hit && !note.missed) {
          note.missed = true;
          setRhythmFeedback('MISS');
          updateAccuracy();
        }

        if (note.y > height + 20) {
          notesRef.current.splice(i, 1);
        }
      }

      ctx.fillStyle = '#fff';
      ctx.font = '14px Outfit';
      ctx.textAlign = 'right';
      ctx.fillText(`Time: ${Math.round((gameDuration - elapsed) / 1000)}s`, width - 15, 25);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [rhythmPlaying]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🎮 Music Games
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Challenge your rhythm and test your knowledge to earn XP and high scores.</p>
        </div>

        {/* Tab Selector */}
        <div className="glass-panel" style={{ display: 'flex', gap: '8px', padding: '6px', borderRadius: '12px' }}>
          <button
            onClick={() => { setActiveTab('rhythm'); setRhythmFinished(false); }}
            className={activeTab === 'rhythm' ? 'neon-btn-primary' : 'neon-btn-secondary'}
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            Beat-Tap Rhythm
          </button>
          <button
            onClick={() => { setActiveTab('quiz'); resetQuiz(); }}
            className={activeTab === 'quiz' ? 'neon-btn-primary' : 'neon-btn-secondary'}
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            Daily Quiz
          </button>
          <button
            onClick={() => { setActiveTab('regional'); setSelectedLanguage(null); }}
            className={activeTab === 'regional' ? 'neon-btn-primary' : 'neon-btn-secondary'}
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
          >
            🇮🇳 Live Regional Web Quiz
          </button>
        </div>
      </div>

      {activeTab === 'rhythm' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {!rhythmPlaying && !rhythmFinished ? (
              <div style={{ height: '420px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <span style={{ fontSize: '3rem' }}>🥁</span>
                <h3 style={{ color: '#fff' }}>Beat-Tap Rhythm Arena</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px', textAlign: 'center' }}>
                  Press keys <strong style={{ color: 'var(--secondary)' }}>S, D, K, L</strong> as the notes align with the glowing circular targets at the bottom.
                </p>
                <button onClick={startRhythmGame} className="neon-btn-primary" style={{ padding: '12px 30px' }}>
                  Start Game
                </button>
              </div>
            ) : rhythmFinished ? (
              <div style={{ height: '420px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <span style={{ fontSize: '3rem' }}>🏆</span>
                <h3 style={{ color: 'var(--primary)' }}>Game Completed!</h3>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Score: {rhythmScore}</p>
                  <p style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>Accuracy: {rhythmAccuracy}%</p>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your score has been registered on the global leaderboard!</p>
                <button onClick={startRhythmGame} className="neon-btn-primary">
                  Play Again
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <canvas
                  ref={canvasRef}
                  style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'block', maxWidth: '100%' }}
                />
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ color: 'var(--secondary)' }}>Rhythm Performance</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Running Score:</span>
                <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{rhythmScore}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Accuracy:</span>
                <strong style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>{rhythmAccuracy}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Timing:</span>
                <span
                  style={{
                    color: rhythmFeedback.includes('PERFECT')
                      ? 'var(--secondary)'
                      : rhythmFeedback.includes('GOOD')
                        ? 'var(--accent)'
                        : rhythmFeedback.includes('MISS')
                          ? 'var(--primary)'
                          : '#fff',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    textShadow: rhythmFeedback.includes('PERFECT') ? '0 0 10px var(--secondary-glow)' : 'none'
                  }}
                >
                  {rhythmFeedback || '--'}
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: '1.4'
              }}
            >
              <h4 style={{ color: '#fff', marginBottom: '4px' }}>How to play:</h4>
              <p>Place your fingers on your keyboard keys:</p>
              <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                <li><strong style={{ color: 'var(--primary)' }}>S</strong> - Leftmost track (Pink)</li>
                <li><strong style={{ color: 'var(--accent)' }}>D</strong> - Inner-left track (Violet)</li>
                <li><strong style={{ color: 'var(--secondary)' }}>K</strong> - Inner-right track (Cyan)</li>
                <li><strong style={{ color: '#00ff66' }}>L</strong> - Rightmost track (Green)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && (
        <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }} className="glass-panel">
          {!quizFinished ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-accent">Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Score: {quizScore * 20}/100</span>
              </div>

              <h3 style={{ color: '#fff', fontSize: '1.25rem', lineHeight: '1.4' }}>
                {QUIZ_QUESTIONS[quizIndex].question}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {QUIZ_QUESTIONS[quizIndex].options.map((option, idx) => {
                  let btnBg = 'rgba(255,255,255,0.03)';
                  let btnBorder = '1px solid rgba(255,255,255,0.08)';
                  let btnColor = 'var(--text-main)';

                  if (quizSelected) {
                    if (option === QUIZ_QUESTIONS[quizIndex].answer) {
                      btnBg = 'rgba(0, 255, 102, 0.15)';
                      btnBorder = '1px solid #00ff66';
                      btnColor = '#00ff66';
                    } else if (option === quizSelected) {
                      btnBg = 'rgba(255, 46, 147, 0.15)';
                      btnBorder = '1px solid var(--primary)';
                      btnColor = 'var(--primary)';
                    } else {
                      btnBg = 'rgba(255,255,255,0.01)';
                      btnBorder = '1px solid rgba(255,255,255,0.03)';
                      btnColor = 'var(--text-dim)';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(option)}
                      disabled={!!quizSelected}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: btnBg,
                        border: btnBorder,
                        color: btnColor,
                        textAlign: 'left',
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        cursor: quizSelected ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{option}</span>
                      {quizSelected && option === QUIZ_QUESTIONS[quizIndex].answer && <span>✔️</span>}
                      {quizSelected && option === quizSelected && option !== QUIZ_QUESTIONS[quizIndex].answer && <span>❌</span>}
                    </button>
                  );
                })}
              </div>

              {quizSelected && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500', color: quizStatus.includes('Correct') ? '#00ff66' : 'var(--primary)' }}>
                    {quizStatus}
                  </span>

                  <button onClick={nextQuizQuestion} className="neon-btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                    {quizIndex === QUIZ_QUESTIONS.length - 1 ? 'Finish Quiz' : 'Next Question ➡️'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center', padding: '20px' }}>
              <span style={{ fontSize: '3rem' }}>📝</span>
              <h3 style={{ color: 'var(--secondary)' }}>Quiz Complete!</h3>
              <div>
                <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>You scored {quizScore} / {QUIZ_QUESTIONS.length} Correct!</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
                  Earned <strong style={{ color: 'var(--primary)' }}>{quizScore * 15} XP</strong> from correct answers.
                </p>
              </div>
              <button onClick={resetQuiz} className="neon-btn-primary" style={{ padding: '10px 24px' }}>
                Retake Quiz
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'regional' && (
        <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          {!selectedLanguage ? (
            /* Language Selector */
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <span style={{ fontSize: '3rem' }}>🌍</span>
                <h3 style={{ color: '#fff', marginTop: '12px' }}>Choose Regional Language Challenge</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Choose a language. The game will load live tracks from public APIs and generate questions dynamically!</p>
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button
                  onClick={() => initializeRegionalQuiz('hindi')}
                  className="neon-btn-primary"
                  style={{ padding: '16px 28px', background: 'linear-gradient(135deg, #ff9933, #ffffff, #138808)', color: '#000', fontWeight: 'bold', borderRadius: '14px', textShadow: 'none', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  Hindi 🇮🇳
                </button>
                <button
                  onClick={() => initializeRegionalQuiz('tamil')}
                  className="neon-btn-primary"
                  style={{ padding: '16px 28px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '14px' }}
                >
                  Tamil 🛕
                </button>
                <button
                  onClick={() => initializeRegionalQuiz('malayalam')}
                  className="neon-btn-primary"
                  style={{ padding: '16px 28px', background: 'linear-gradient(135deg, var(--secondary), var(--bg-dark))', borderRadius: '14px' }}
                >
                  Malayalam 🌴
                </button>
              </div>
            </div>
          ) : loadingTracks ? (
            /* Loader */
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="spin-slow" style={{ fontSize: '2.5rem', display: 'inline-block', marginBottom: '16px' }}>💿</div>
              <h3 style={{ color: '#fff' }}>Fetching Live Tracks...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Generating dynamic quiz questions via API proxy...</p>
            </div>
          ) : !regionalFinished && questions.length > 0 ? (
            /* Quiz Active Question */
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <button
                    onClick={() => setSelectedLanguage(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    ⬅️ Change Language
                  </button>
                  <span className="badge badge-accent" style={{ marginLeft: '12px', textTransform: 'capitalize' }}>
                    {selectedLanguage} Live Challenge
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Question {regionalIndex + 1} of {questions.length}
                </span>
              </div>

              {/* Dynamic Audio Controller Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <img
                  src={questions[regionalIndex].coverUrl || 'https://via.placeholder.com/100'}
                  alt="artwork"
                  style={{ width: '80px', height: '80px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.4)' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>Audio Snippet Player</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Play the 30-second clip below and choose your answer.</p>

                  <button
                    onClick={() => toggleClip(questions[regionalIndex].audioUrl)}
                    className="neon-btn-primary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      alignSelf: 'flex-start',
                      background: clipPlaying ? 'var(--primary)' : 'var(--secondary)',
                      boxShadow: clipPlaying ? '0 0 12px var(--primary-glow)' : '0 0 12px var(--secondary-glow)'
                    }}
                  >
                    {clipPlaying ? '⏸️ Pause Clip' : '▶️ Play Clip'}
                  </button>
                </div>
              </div>

              <h3 style={{ color: '#fff', fontSize: '1.25rem', lineHeight: '1.4' }}>
                {questions[regionalIndex].question}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {questions[regionalIndex].options.map((option, idx) => {
                  let btnBg = 'rgba(255,255,255,0.03)';
                  let btnBorder = '1px solid rgba(255,255,255,0.08)';
                  let btnColor = 'var(--text-main)';

                  if (regionalSelected) {
                    if (option === questions[regionalIndex].answer) {
                      btnBg = 'rgba(0, 255, 102, 0.15)';
                      btnBorder = '1px solid #00ff66';
                      btnColor = '#00ff66';
                    } else if (option === regionalSelected) {
                      btnBg = 'rgba(255, 46, 147, 0.15)';
                      btnBorder = '1px solid var(--primary)';
                      btnColor = 'var(--primary)';
                    } else {
                      btnBg = 'rgba(255,255,255,0.01)';
                      btnBorder = '1px solid rgba(255,255,255,0.03)';
                      btnColor = 'var(--text-dim)';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleRegionalAnswer(option)}
                      disabled={!!regionalSelected}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: btnBg,
                        border: btnBorder,
                        color: btnColor,
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        cursor: regionalSelected ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {regionalSelected && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: regionalStatus.includes('Correct') ? '#00ff66' : 'var(--primary)', display: 'block' }}>
                      {regionalStatus}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      💡 {questions[regionalIndex].info}
                    </span>
                  </div>

                  <button onClick={nextRegionalQuestion} className="neon-btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                    {regionalIndex === questions.length - 1 ? 'Finish Challenge' : 'Next Question ➡️'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Finished screen */
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <span style={{ fontSize: '3rem' }}>👑</span>
              <h3 style={{ color: 'var(--secondary)' }}>Regional Web Challenge Complete!</h3>
              <div>
                <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>
                  You scored {regionalScore} / {questions.length} Correct!
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
                  Earned <strong style={{ color: 'var(--primary)' }}>{regionalScore * 20} XP</strong>.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={() => initializeRegionalQuiz(selectedLanguage)} className="neon-btn-primary" style={{ padding: '10px 24px' }}>
                  Play Again
                </button>
                <button onClick={() => setSelectedLanguage(null)} className="neon-btn-secondary" style={{ padding: '10px 24px' }}>
                  Other Languages
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
