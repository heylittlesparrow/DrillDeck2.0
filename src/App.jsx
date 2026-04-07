import './App.css';import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

// 1. PASTE YOUR PUBLISHED CSV URL BELOW (Inside the quotes)
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRV540TGRQ-rh5ggQZIjpceWkBtztku1cuqMzKT0gnJf6m_IG5bGd874o2tS5T0pBX3GDHKsLH78MXM/pub?gid=0&single=true&output=csv";

function App() {
  const [reviewDepth, setReviewDepth] = useState(10);
  const [mode, setMode] = useState('specific');
  const [allData, setAllData] = useState([]);
  const [view, setView] = useState('landing'); 
  const [selectedSet, setSelectedSet] = useState(null);
  const [toggles, setToggles] = useState({ gpc: true, decodable: true, hfw: true, morpheme: false, sentence: false });
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch data on load
  useEffect(() => {
    if (CSV_URL !== "PASTE_YOUR_LINK_HERE") {
      Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: (results) => {
          console.log("Data loaded:", results.data);
          setAllData(results.data);
        },
        error: (error) => console.error("Error loading CSV:", error)
      });
    }
  }, []);

  // Logic to build the session deck
 const startSession = () => {
    let sessionPool = [];
    const setsToInclude = mode === 'general' 
      ? allData.filter(row => parseInt(row.Set) <= selectedSet) 
      : allData.filter(row => parseInt(row.Set) === selectedSet);

    const order = ['gpc', 'decodable', 'hfw', 'morpheme', 'sentence'];

    // Determine the cap: 
    // If Specific mode: cap is 10. 
    // If General mode: use the reviewDepth (5 or 10).
    const limit = mode === 'general' ? reviewDepth : 10;

    order.forEach(cat => {
      if (toggles[cat]) {
        let catItems = setsToInclude.filter(row => row.Category && row.Category.toLowerCase() === cat);
        
        // Shuffle the available cards for this category
        catItems = catItems.sort(() => 0.5 - Math.random());
        
        // Apply the limit to EVERY category now
        catItems = catItems.slice(0, limit);
        
        sessionPool = [...sessionPool, ...catItems];
      }
    });

    if (sessionPool.length > 0) {
      setDeck(sessionPool);
      setCurrentIndex(0);
      setView('practice');
    } else {
      alert("No cards found! Ensure your Set and Category columns match your toggles.");
    }
  };

  const playAudio = (url) => {
    // 1. Check if the URL actually exists
    if (!url || url.trim() === "") {
      console.error("❌ AUDIO ERROR: The URL is empty or undefined. Check your Google Sheet headers!");
      alert("I can't find an audio link for this card. Check your spreadsheet headers!");
      return;
    }

    console.log("🔊 Attempting to play:", url);

    const audio = new Audio(url);
    
    audio.play().catch(error => {
      console.error("🚫 PLAYBACK BLOCKED:", error);
      console.log("Hint: This usually means the file doesn't exist at that link or the format is wrong.");
    });
  };

  // --- VIEWS ---

// --- PHASE 1: LANDING PAGE ---
  if (view === 'landing') {
    return (
      <div className="container">
        <h1>Drill Deck 2.0</h1>
        <button 
          className="btn-general" 
          onClick={() => { setMode('general'); setSelectedSet(13); setView('config'); }}
        >
          🚀 Jump to General Revision (Up to Set 13)
        </button>

        <hr style={{ margin: '30px 0', opacity: 0.2 }} />

        <section>
          <h2 style={{ marginBottom: '20px' }}>Practise a Specific Set:</h2>
          <h3 style={{ color: '#666', fontSize: '1rem', textAlign: 'left' }}>Foundation Sets</h3>
          <div className="grid">
            {[...Array(13)].map((_, i) => (
              <button key={i} onClick={() => { setMode('specific'); setSelectedSet(i + 1); setView('config'); }}>
                Set {i + 1}
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // --- PHASE 2: CONFIGURATION PAGE ---
  if (view === 'config') {
    return (
      <div className="container">
        <button className="btn-home" onClick={() => setView('landing')}>🏠 Home</button>
        
        <h2>{mode === 'general' ? `General Revision (Up to Set ${selectedSet})` : `Specific Practise: Set ${selectedSet}`}</h2>

        {mode === 'general' && (
          <div style={{ marginBottom: '30px' }}>
            <p>Choose Revision Depth:</p>
            <div className="depth-selector">
              <button className={reviewDepth === 5 ? 'active' : ''} onClick={() => setReviewDepth(5)}>Snap Review</button>
              <button className={reviewDepth === 10 ? 'active' : ''} onClick={() => setReviewDepth(10)}>Deep Dive</button>
            </div>
          </div>
        )}

        <p>Select components to include:</p>
        <div className="config-box">
          {Object.keys(toggles).map(cat => (
            (cat !== 'morpheme' || selectedSet >= 11) && (
              <div key={cat} className="toggle-row">
                <label className="switch">
                  <input type="checkbox" checked={toggles[cat]} onChange={() => setToggles({...toggles, [cat]: !toggles[cat]})} />
                  <span className="slider"></span>
                </label>
                <span className="toggle-label">{cat.toUpperCase()}</span>
              </div>
            )
          ))}
        </div>
        <br />
        <button className="btn-start" onClick={startSession}>Start Session</button>
      </div>
    );
  }

  // --- PHASE 3: PRACTICE (FLASHCARDS) ---
  if (view === 'practice') {
    const currentCard = deck[currentIndex];

    return (
      <div className="container">
        {/* Home is now isolated for top-left positioning */}
        <button className="btn-home-corner" onClick={() => setView('landing')} title="Home">
          🏠
        </button>

        {/* This row sits directly above the card and matches its width */}
        <div className="card-controls-top">
          <button className="btn-secondary" onClick={() => setView('config')}>
            ← Back
          </button>

          {currentCard?.ExplainerURL && currentCard.ExplainerURL.trim() !== "" && (
            <a 
              href={currentCard.ExplainerURL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-teach"
            >
              Teach Me 👩‍🏫
            </a>
          )}
        </div>

        {currentCard ? (
          <div className={`card-container card-${currentCard.Category.toLowerCase()}`}>
            <img src={currentCard.ImageURL} alt="Flashcard" className="flashcard-image" />
            
            <div className="audio-section">
              {currentCard.AudioMain && currentCard.AudioMain.trim() !== "" && (
                <button className="btn-audio" onClick={() => playAudio(currentCard.AudioMain)}>
                  {currentCard.Category.toLowerCase() === 'gpc' ? 'Letter Name' : 'Play Word'}
                </button>
              )}

              {currentCard.Category.toLowerCase() === 'gpc' && currentCard.AudioSound && currentCard.AudioSound.trim() !== "" && (
                <button className="btn-audio" onClick={() => playAudio(currentCard.AudioSound)}>Sound</button>
              )}
            </div>
          </div>
        ) : <p>Loading cards...</p>}

        <div className="nav-controls">
          <button onClick={() => setCurrentIndex(c => c - 1)} disabled={currentIndex === 0}>← Prev</button>
          <span className="counter">{currentIndex + 1} / {deck.length}</span>
          <button onClick={() => {
            if (currentIndex === deck.length - 1) { setView('finished'); } 
            else { setCurrentIndex(c => c + 1); }
          }}>
            {currentIndex === deck.length - 1 ? 'Finish! 🎉' : 'Next →'}
          </button>
        </div>
      </div>
    );
  }

  // --- PHASE 4: SUCCESS SCREEN ---
  if (view === 'finished') {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <h1 style={{ fontSize: '4rem' }}>🌟</h1>
        <h2>Great Job!</h2>
        <p>You finished your session of <strong>{deck.length}</strong> cards.</p>
        <div style={{ marginTop: '30px' }}>
          <button className="btn-start" onClick={() => setView('config')}>Practise Again</button>
          <button onClick={() => setView('landing')} style={{ marginLeft: '10px', padding: '20px 30px' }}>Home</button>
        </div>
      </div>
    );
  }
}

export default App;