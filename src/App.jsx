import './App.css';
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRV540TGRQ-rh5ggQZIjpceWkBtztku1cuqMzKT0gnJf6m_IG5bGd874o2tS5T0pBX3GDHKsLH78MXM/pub?gid=0&single=true&output=csv";

function App() {
  const [view, setView] = useState('landing');
  const [allData, setAllData] = useState([]);
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSet, setSelectedSet] = useState(1);
  const [mode, setMode] = useState('specific');
  const [reviewDepth, setReviewDepth] = useState(10);
  const [toggles, setToggles] = useState({ gpc: true, decodable: true, hfw: true, morpheme: false, sentence: false });

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      complete: (res) => setAllData(res.data)
    });
  }, []);

  const playAudio = (url) => { if (url) new Audio(url).play(); };

  // --- DYNAMIC SET DISCOVERY ---
  // This looks at every row in your sheet and finds unique Set numbers
  const availableSets = [...new Set(allData.map(item => Number(item.Set)).filter(s => s > 0))].sort((a, b) => a - b);
  
  // Categorise them into your curriculum tiers
  const foundationSets = availableSets.filter(s => s >= 1 && s <= 13);
  const level1Sets = availableSets.filter(s => s >= 14 && s <= 26);
  const level2Sets = availableSets.filter(s => s >= 27 && s <= 36);

  // Find the ceiling for General Revision
  const maxSetAvailable = Math.max(...availableSets, 0);

  const startSession = () => {
    const categoryOrder = ['gpc', 'decodable', 'hfw', 'morpheme', 'sentence'];
    let finalDeck = [];

    categoryOrder.forEach(cat => {
      if (toggles[cat]) {
        const pool = allData.filter(item => {
          const itemSet = Number(item.Set);
          const itemCat = (item.Category || "").toLowerCase().trim();
          const matchesSet = mode === 'general' ? itemSet <= selectedSet : itemSet === selectedSet;
          return matchesSet && itemCat === cat;
        });
        const sliced = [...pool].sort(() => Math.random() - 0.5).slice(0, reviewDepth);
        finalDeck = [...finalDeck, ...sliced];
      }
    });

    if (finalDeck.length > 0) {
      setDeck(finalDeck);
      setCurrentIndex(0);
      setView('drill');
    } else {
      alert("No cards found for this set!");
    }
  };

  // --- RENDERING ---

  if (view === 'landing') {
    return (
      <>
        <div className="app-banner"><h1>Drill Deck Plus</h1></div>
        <div className="container">
          
          {/* GENERAL REVISION SECTION */}
          <div className="glass-card">
            <button 
              className="btn-matching-style" 
              style={{padding:'20px'}} 
              onClick={() => { 
                setMode('general'); 
                setSelectedSet(maxSetAvailable); // Dynamically hits the highest set
                setView('config'); 
              }}
            >
              🚀 Jump to General Revision (Sets 1-{maxSetAvailable})
            </button>
          </div>

          {/* FOUNDATION SECTION */}
          <div className="glass-card">
            <h3 style={{textAlign:'left', fontWeight:'600', marginBottom:'20px'}}>Foundation Sets</h3>
            <div className="grid">
              {foundationSets.map((setNum) => (
                <button key={setNum} onClick={() => { setMode('specific'); setSelectedSet(setNum); setView('config'); }}>
                  Set {setNum}
                </button>
              ))}
            </div>
          </div>

          {/* LEVEL 1 SECTION - Only appears if data exists */}
          {level1Sets.length > 0 && (
            <div className="glass-card">
              <h3 style={{textAlign:'left', fontWeight:'600', marginBottom:'20px'}}>Level 1 Sets</h3>
              <div className="grid">
                {level1Sets.map((setNum) => (
                  <button key={setNum} onClick={() => { setMode('specific'); setSelectedSet(setNum); setView('config'); }}>
                    Set {setNum}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LEVEL 2 SECTION - Only appears if data exists */}
          {level2Sets.length > 0 && (
            <div className="glass-card">
              <h3 style={{textAlign:'left', fontWeight:'600', marginBottom:'20px'}}>Level 2 Sets</h3>
              <div className="grid">
                {level2Sets.map((setNum) => (
                  <button key={setNum} onClick={() => { setMode('specific'); setSelectedSet(setNum); setView('config'); }}>
                    Set {setNum}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </>
    );
  }

  if (view === 'config') {
    return (
      <div className="container">
        <button className="btn-home-corner" onClick={() => setView('landing')}>🏠 Home</button>
        <h2 style={{marginTop:'40px', fontWeight:'700'}}>{mode === 'general' ? `General Revision: Sets 1-${selectedSet}` : `Specific Practise: Set ${selectedSet}`}</h2>
        <div className="glass-card">
          <p style={{fontWeight:'600'}}>Revision Depth (per component):</p>
          <div className="selector-grid">
            <button className={`chip-btn ${reviewDepth === 5 ? 'active' : ''}`} onClick={() => setReviewDepth(5)}>Snap Review (5)</button>
            <button className={`chip-btn ${reviewDepth === 10 ? 'active' : ''}`} onClick={() => setReviewDepth(10)}>Deep Dive (10)</button>
          </div>
        </div>
        <div className="glass-card">
          <p style={{fontWeight:'600'}}>Include Components:</p>
          <div className="selector-grid">
            {Object.keys(toggles).map(cat => (
              <button key={cat} className={`chip-btn ${toggles[cat] ? 'active' : ''}`} onClick={() => setToggles({...toggles, [cat]: !toggles[cat]})}>
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="btn-start" style={{marginTop:'40px'}} onClick={startSession}>Start Session →</button>
        </div>
      </div>
    );
  }

  if (view === 'drill') {
    const card = deck[currentIndex];
    const itemCat = card.Category?.toLowerCase().trim();
    const isGPC = itemCat === 'gpc';

    return (
      <div className="container">
        <button className="btn-home-corner" onClick={() => setView('landing')}>🏠 Home</button>
        <div className="card-wrapper">
          <button className="card-tab back-tab" onClick={() => setView('config')}>← Back</button>
          {card.ExplainerURL && (
            <a href={card.ExplainerURL} target="_blank" rel="noreferrer" className="card-tab teach-tab">
              Teach Me 👩‍🏫
            </a>
          )}
          <div className={`white-card ${itemCat}`}>
            {card.ImageURL ? (
              <img src={card.ImageURL} alt="drill" className="card-content-img" />
            ) : (
              <p className="card-content-text">{card.DisplayName}</p>
            )}
            <div className="audio-row">
              {isGPC ? (
                <>
                  {card.AudioMain && <button className="btn-audio" onClick={() => playAudio(card.AudioMain)}>Grapheme ✏️</button>}
                  {card.AudioSound && <button className="btn-audio" onClick={() => playAudio(card.AudioSound)}>Phoneme 👂</button>}
                </>
              ) : (
                card.AudioMain && <button className="btn-audio" onClick={() => playAudio(card.AudioMain)}>hear word👂</button>
              )}
            </div>
          </div>
        </div>
        <div className="drill-nav-controls">
          <button className="nav-btn-edge" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}>← Prev</button>
          <div style={{fontWeight:'700', color:'#999'}}>{currentIndex + 1} / {deck.length}</div>
          <button className="nav-btn-edge" onClick={() => {
            if (currentIndex < deck.length - 1) setCurrentIndex(currentIndex + 1);
            else setView('finished');
          }}>Next →</button>
        </div>
      </div>
    );
  }

  if (view === 'finished') {
    return (
      <div className="container">
        <div className="glass-card" style={{padding:'70px 20px'}}>
            <span className="success-star">🌟</span>
            <h2 style={{fontWeight:'700', fontSize:'2.4rem'}}>Great Job!</h2>
            <p style={{marginBottom:'40px'}}>Session Complete.</p>
            <button className="btn-start" onClick={() => setView('landing')}>Home</button>
        </div>
      </div>
    );
  }
  return null;
}

export default App;