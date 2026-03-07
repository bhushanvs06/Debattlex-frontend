import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import Lottie from 'lottie-react';
import Confetti from 'react-confetti';
import cryAnimation from './cry.json';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
const url = process.env.React_App_url;

/* ─────────────────────────────────────────────
   DEBATE ARENA LOADING ANIMATION
───────────────────────────────────────────── */
const DebateArenaLoader = ({ teamSize = 3 }) => {
  const [phase, setPhase] = useState('debate'); // debate → thinking → gavel → done
  const [gavelHit, setGavelHit] = useState(false);
  const [showSpark, setShowSpark] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState({ side: 'prop', idx: 0 });

  useEffect(() => {
    // Cycle through speakers based on teamSize
    let speakerInterval = setInterval(() => {
      setActiveSpeaker(prev => {
        const maxIdx = teamSize - 1;
        const nextIdx = prev.idx >= maxIdx ? 0 : prev.idx + 1;
        const nextSide = prev.idx >= maxIdx ? (prev.side === 'prop' ? 'opp' : 'prop') : prev.side;
        return { side: nextSide, idx: nextIdx };
      });
    }, 700);

    // Phase transitions
    const t1 = setTimeout(() => {
      clearInterval(speakerInterval);
      setPhase('thinking');
    }, 4500);
    const t2 = setTimeout(() => setPhase('gavel'), 7000);
    const t3 = setTimeout(() => { setGavelHit(true); setShowSpark(true); }, 7400);
    const t4 = setTimeout(() => setShowSpark(false), 7900);

    return () => {
      clearInterval(speakerInterval);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, []);

  const propDebaters = [
    { label: 'PM', color: '#a78bfa', delay: '0s' },
    { label: 'DPM', color: '#8b5cf6', delay: '0.15s' },
    { label: 'GW', color: '#7c3aed', delay: '0.3s' },
  ];
  const oppDebaters = [
    { label: 'LO', color: '#f472b6', delay: '0s' },
    { label: 'DLO', color: '#ec4899', delay: '0.15s' },
    { label: 'OW', color: '#db2777', delay: '0.3s' },
  ];

  const speechBubbles = [
    "This motion stands!", "Evidence proves…", "My point is clear!",
    "Rebuttal time!", "Logic demands…", "Consider this…",
  ];

  return (
    <div style={styles.arenaWrapper}>
      <style>{keyframes}</style>

      {/* ── ARENA TITLE ── */}
      <div style={styles.arenaTitle}>
        <span style={styles.arenaTitleText}>⚖️ DEBATE ARENA</span>
        <div style={styles.arenaTitleUnderline} />
      </div>

      {/* ── MAIN STAGE ── */}
      <div style={styles.stage}>

        {/* PROPOSITION SIDE */}
        <div style={styles.teamBox}>
          <div style={styles.teamBadgeProp}>PROPOSITION</div>
          <div style={styles.debatersRow}>
            {propDebaters.map((d, i) => (
              <DebaterFigure
                key={d.label}
                label={d.label}
                color={d.color}
                isActive={activeSpeaker.side === 'prop' && activeSpeaker.idx === i && phase === 'debate'}
                facing="right"
                bubble={speechBubbles[i]}
                entranceDelay={`${i * 0.2}s`}
              />
            ))}
          </div>
          <div style={{ ...styles.podium, background: 'linear-gradient(135deg, #4c1d95, #2e1065)' }} />
        </div>

        {/* CENTRE: VS + JUDGE */}
        <div style={styles.centre}>
          <div style={styles.vsText}>VS</div>

          {/* Judge figure */}
          <div style={styles.judgeContainer}>
            <div style={styles.judgeLabel}>JUDGE</div>
            <JudgeFigure phase={phase} gavelHit={gavelHit} showSpark={showSpark} />
            {phase === 'thinking' && <ThinkingBubble />}
            {phase === 'gavel' && !gavelHit && (
              <div style={styles.rulingText}>ORDER!</div>
            )}
            {gavelHit && (
              <div style={styles.verdictBanner}>
                VERDICT<br />
                <span style={styles.verdictSub}>IN PROGRESS…</span>
              </div>
            )}
          </div>
        </div>

        {/* OPPOSITION SIDE */}
        <div style={styles.teamBox}>
          <div style={styles.teamBadgeOpp}>OPPOSITION</div>
          <div style={styles.debatersRow}>
            {oppDebaters.map((d, i) => (
              <DebaterFigure
                key={d.label}
                label={d.label}
                color={d.color}
                isActive={activeSpeaker.side === 'opp' && activeSpeaker.idx === i && phase === 'debate'}
                facing="left"
                bubble={speechBubbles[i + 3]}
                entranceDelay={`${i * 0.2 + 0.1}s`}
              />
            ))}
          </div>
          <div style={{ ...styles.podium, background: 'linear-gradient(135deg, #831843, #500724)' }} />
        </div>
      </div>

      {/* ── LOADING BAR ── */}
      <div style={styles.loadingBarOuter}>
        <div style={styles.loadingBarInner} />
      </div>
      <div style={styles.loadingPhaseText}>
        {phase === 'debate' && '🎙️ Debaters presenting arguments…'}
        {phase === 'thinking' && '🧠 Judge deliberating…'}
        {phase === 'gavel' && (gavelHit ? '🔨 Order in the court!' : '⚖️ Reaching verdict…')}
      </div>
    </div>
  );
};

/* ── DEBATER FIGURE ── */
const DebaterFigure = ({ label, color, isActive, facing, bubble, entranceDelay }) => (
  <div style={{ ...styles.debaterWrap, animationDelay: entranceDelay }}>
    {isActive && (
      <div style={{ ...styles.speechBubble, [facing === 'right' ? 'right' : 'left']: '-110px' }}>
        {bubble}
      </div>
    )}
    <svg width="52" height="90" viewBox="0 0 52 90"
      style={{
        animation: isActive ? 'debaterTalk 0.35s ease-in-out infinite alternate' : 'none',
        filter: isActive ? `drop-shadow(0 0 8px ${color})` : 'none',
        transform: facing === 'left' ? 'scaleX(-1)' : 'none',
        transition: 'filter 0.3s',
      }}>
      {/* Head */}
      <circle cx="26" cy="12" r="10" fill={color} />
      {/* Eyes */}
      <circle cx="22" cy="11" r="1.5" fill="#1a0a2e" />
      <circle cx="30" cy="11" r="1.5" fill="#1a0a2e" />
      {/* Mouth */}
      <path d={isActive ? "M22 16 Q26 20 30 16" : "M22 16 Q26 18 30 16"} stroke="#1a0a2e" strokeWidth="1.5" fill="none" />
      {/* Body */}
      <rect x="18" y="24" width="16" height="28" rx="4" fill={color} opacity="0.9" />
      {/* Left arm */}
      <line x1="18" y1="28" x2="6" y2={isActive ? "38" : "44"} stroke={color} strokeWidth="4" strokeLinecap="round" />
      {/* Right arm */}
      <line x1="34" y1="28" x2="46" y2={isActive ? "38" : "44"} stroke={color} strokeWidth="4" strokeLinecap="round" />
      {/* Left leg */}
      <line x1="22" y1="52" x2="18" y2="78" stroke={color} strokeWidth="4" strokeLinecap="round" />
      {/* Right leg */}
      <line x1="30" y1="52" x2="34" y2="78" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
    <div style={{ ...styles.debaterLabel, color }}>{label}</div>
  </div>
);

/* ── JUDGE FIGURE ── */
const JudgeFigure = ({ phase, gavelHit }) => (
  <svg width="70" height="120" viewBox="0 0 70 120"
    style={{
      animation: phase === 'thinking' ? 'judgeThink 1.8s ease-in-out infinite' :
        gavelHit ? 'gavelStrike 0.3s ease-out forwards' : 'none',
      filter: 'drop-shadow(0 0 14px #facc15)',
    }}>
    {/* Wig / hat */}
    <ellipse cx="35" cy="10" rx="18" ry="8" fill="#f5f5dc" />
    <rect x="17" y="8" width="36" height="6" rx="2" fill="#f5f5dc" />
    {/* Head */}
    <circle cx="35" cy="22" r="13" fill="#fde68a" />
    {/* Eyes */}
    <circle cx="30" cy="21" r="2" fill="#1a0a2e" />
    <circle cx="40" cy="21" r="2" fill="#1a0a2e" />
    {/* Glasses */}
    <rect x="25" y="18" width="10" height="7" rx="2" fill="none" stroke="#92400e" strokeWidth="1.5" />
    <rect x="35" y="18" width="10" height="7" rx="2" fill="none" stroke="#92400e" strokeWidth="1.5" />
    <line x1="35" y1="21.5" x2="35" y2="21.5" stroke="#92400e" strokeWidth="1.5" />
    {/* Mouth */}
    <path d={phase === 'thinking' ? "M29 30 Q35 28 41 30" : "M29 30 Q35 34 41 30"} stroke="#92400e" strokeWidth="1.5" fill="none" />
    {/* Robe body */}
    <rect x="20" y="36" width="30" height="44" rx="5" fill="#1e1b4b" />
    {/* Gold collar */}
    <path d="M20 40 Q35 52 50 40" stroke="#facc15" strokeWidth="2.5" fill="none" />
    {/* Gavel arm */}
    <line x1="50" y1="42"
      x2={gavelHit ? "52" : "62"}
      y2={gavelHit ? "72" : "32"}
      stroke="#fde68a" strokeWidth="5" strokeLinecap="round"
      style={{ transformOrigin: '50px 42px', transition: 'all 0.2s' }}
    />
    {/* Gavel head */}
    <rect
      x={gavelHit ? "42" : "56"}
      y={gavelHit ? "68" : "22"}
      width="18" height="10" rx="3" fill="#92400e"
      style={{ transition: 'all 0.2s' }}
    />
    {/* Left arm */}
    <line x1="20" y1="44" x2="8" y2="60" stroke="#1e1b4b" strokeWidth="5" strokeLinecap="round" />
    {/* Left legs */}
    <line x1="28" y1="80" x2="24" y2="108" stroke="#1e1b4b" strokeWidth="5" strokeLinecap="round" />
    <line x1="42" y1="80" x2="46" y2="108" stroke="#1e1b4b" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

/* ── THINKING BUBBLE ── */
const ThinkingBubble = () => (
  <div style={styles.thinkBubble}>
    <div style={styles.thinkDot} />
    <div style={{ ...styles.thinkDot, animationDelay: '0.2s' }} />
    <div style={{ ...styles.thinkDot, animationDelay: '0.4s' }} />
  </div>
);

/* ─────────────────────────────────────────────
   KEYFRAME CSS (injected via <style>)
───────────────────────────────────────────── */
const keyframes = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Rajdhani:wght@400;600;700&display=swap');

  @keyframes debaterTalk {
    from { transform: rotate(-4deg) translateY(0px); }
    to   { transform: rotate(4deg) translateY(-3px); }
  }
  @keyframes debaterEntrance {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes judgeThink {
    0%   { transform: rotate(-3deg) translateY(0); }
    50%  { transform: rotate(3deg) translateY(-6px); }
    100% { transform: rotate(-3deg) translateY(0); }
  }
  @keyframes gavelStrike {
    0%   { transform: rotate(0deg); }
    40%  { transform: rotate(20deg) scale(1.1); }
    70%  { transform: rotate(-5deg) scale(0.95); }
    100% { transform: rotate(0deg) scale(1); }
  }
  @keyframes thinkPulse {
    0%,100% { opacity:0.3; transform: scale(0.8); }
    50%     { opacity:1;   transform: scale(1.2); }
  }
  @keyframes loadingBar {
    0%   { width: 0%; }
    100% { width: 100%; }
  }
  @keyframes vsGlow {
    0%,100% { text-shadow: 0 0 20px #facc15, 0 0 40px #f59e0b; }
    50%     { text-shadow: 0 0 40px #facc15, 0 0 80px #f59e0b, 0 0 120px #fde68a; }
  }
  @keyframes verdictPop {
    0%   { opacity:0; transform: scale(0.5) rotate(-10deg); }
    60%  { transform: scale(1.15) rotate(3deg); }
    100% { opacity:1; transform: scale(1) rotate(0deg); }
  }
  @keyframes sparkle {
    0%   { opacity:0; transform: scale(0); }
    30%  { opacity:1; transform: scale(1.4); }
    100% { opacity:0; transform: scale(0.5); }
  }
  @keyframes podiumRise {
    from { transform: scaleY(0); transform-origin: bottom; }
    to   { transform: scaleY(1); transform-origin: bottom; }
  }
  @keyframes titleGlow {
    0%,100% { letter-spacing: 4px; opacity: 0.9; }
    50%     { letter-spacing: 7px; opacity: 1; }
  }
  @keyframes resultCardIn {
    from { opacity:0; transform: translateY(30px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes scoreCount {
    from { transform: scale(0.7); opacity:0; }
    to   { transform: scale(1); opacity:1; }
  }
  @keyframes winnerReveal {
    0%   { opacity:0; filter: blur(20px); transform: scale(0.8); }
    100% { opacity:1; filter: blur(0); transform: scale(1); }
  }
  @keyframes phaseTextFade {
    0%,100% { opacity:0.6; }
    50%     { opacity:1; }
  }
  @keyframes gavelBang {
    0%   { transform: translateY(0) rotate(0deg); }
    30%  { transform: translateY(-20px) rotate(-30deg); }
    60%  { transform: translateY(8px) rotate(15deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }
  @keyframes sparkBurst {
    0%   { opacity:1; transform: scale(0.5) rotate(0deg); }
    100% { opacity:0; transform: scale(2.5) rotate(45deg); }
  }
  @keyframes floatUp {
    0%   { transform: translateY(0) scale(1); opacity:1; }
    100% { transform: translateY(-30px) scale(0.7); opacity:0; }
  }
  @keyframes badgePulse {
    0%,100% { box-shadow: 0 0 0px transparent; }
    50%     { box-shadow: 0 0 20px currentColor; }
  }
`;

/* ─────────────────────────────────────────────
   STYLES OBJECT
───────────────────────────────────────────── */
const styles = {
  arenaWrapper: {
    width: '100%',
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1rem',
  },
  arenaTitle: {
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
  arenaTitleText: {
    fontFamily: "'Cinzel Decorative', serif",
    fontSize: '2rem',
    color: '#facc15',
    animation: 'titleGlow 2s ease-in-out infinite',
    display: 'block',
    letterSpacing: '4px',
    textShadow: '0 0 30px #f59e0b, 0 2px 8px rgba(0,0,0,0.8)',
  },
  arenaTitleUnderline: {
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #facc15, transparent)',
    marginTop: '0.5rem',
    borderRadius: '2px',
  },
  stage: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '0',
    width: '100%',
    minHeight: '260px',
    background: 'linear-gradient(180deg, rgba(15,5,36,0) 0%, rgba(15,5,36,0.8) 100%)',
    borderRadius: '20px',
    padding: '2rem 1rem 0',
    position: 'relative',
    border: '1px solid rgba(250,204,21,0.15)',
    boxShadow: 'inset 0 -4px 40px rgba(0,0,0,0.6)',
  },
  teamBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  teamBadgeProp: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: '0.85rem',
    letterSpacing: '3px',
    color: '#a78bfa',
    border: '1px solid #a78bfa',
    padding: '3px 14px',
    borderRadius: '20px',
    animation: 'badgePulse 2s ease-in-out infinite',
  },
  teamBadgeOpp: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: '0.85rem',
    letterSpacing: '3px',
    color: '#f472b6',
    border: '1px solid #f472b6',
    padding: '3px 14px',
    borderRadius: '20px',
    animation: 'badgePulse 2s ease-in-out infinite',
  },
  debatersRow: {
    display: 'flex',
    gap: '1.2rem',
    alignItems: 'flex-end',
  },
  debaterWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    animation: 'debaterEntrance 0.6s ease-out forwards',
    opacity: 0,
  },
  debaterLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: '0.75rem',
    letterSpacing: '2px',
    marginTop: '4px',
  },
  podium: {
    width: '100%',
    height: '16px',
    borderRadius: '8px 8px 0 0',
    animation: 'podiumRise 0.5s ease-out',
    opacity: 0.7,
  },
  centre: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    padding: '0 1.5rem',
    minWidth: '160px',
  },
  vsText: {
    fontFamily: "'Cinzel Decorative', serif",
    fontSize: '2.5rem',
    fontWeight: 900,
    color: '#facc15',
    animation: 'vsGlow 1.5s ease-in-out infinite',
    lineHeight: 1,
    marginBottom: '0.5rem',
  },
  judgeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    position: 'relative',
  },
  judgeLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: '0.8rem',
    letterSpacing: '3px',
    color: '#facc15',
    textShadow: '0 0 10px #facc15',
  },
  thinkBubble: {
    display: 'flex',
    gap: '5px',
    background: 'rgba(255,255,255,0.12)',
    borderRadius: '20px',
    padding: '6px 12px',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  thinkDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#facc15',
    animation: 'thinkPulse 0.8s ease-in-out infinite',
  },
  rulingText: {
    fontFamily: "'Cinzel Decorative', serif",
    fontSize: '1.2rem',
    color: '#fde68a',
    animation: 'vsGlow 0.5s ease-in-out infinite',
  },
  verdictBanner: {
    fontFamily: "'Cinzel Decorative', serif",
    fontSize: '1rem',
    color: '#facc15',
    textAlign: 'center',
    animation: 'verdictPop 0.4s ease-out forwards',
    background: 'rgba(250,204,21,0.12)',
    border: '1px solid rgba(250,204,21,0.4)',
    padding: '6px 14px',
    borderRadius: '10px',
    lineHeight: 1.4,
  },
  verdictSub: {
    fontSize: '0.65rem',
    letterSpacing: '2px',
    color: '#fde68a',
  },
  speechBubble: {
    position: 'absolute',
    top: '-30px',
    background: 'rgba(255,255,255,0.95)',
    color: '#1a0a2e',
    fontSize: '0.65rem',
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
    zIndex: 10,
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    animation: 'floatUp 0.7s ease-out forwards',
  },
  loadingBarOuter: {
    width: '80%',
    height: '5px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  loadingBarInner: {
    height: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #facc15, #ec4899)',
    borderRadius: '10px',
    animation: 'loadingBar 8s linear forwards',
  },
  loadingPhaseText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    color: '#d8b4fe',
    letterSpacing: '1px',
    animation: 'phaseTextFade 1.2s ease-in-out infinite',
  },
};

/* ─────────────────────────────────────────────
   RESULT CARD WRAPPER (animated entrance)
───────────────────────────────────────────── */
const ResultCard = ({ children, delay = '0s', style = {} }) => (
  <div style={{
    background: 'rgba(44, 19, 82, 0.75)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(192,132,252,0.22)',
    borderRadius: '20px',
    padding: '2rem',
    width: '100%',
    maxWidth: '1000px',
    animation: `resultCardIn 0.6s ease-out ${delay} both`,
    opacity: 0,
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    ...style,
  }}>
    {children}
  </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT (ALL ORIGINAL LOGIC PRESERVED)
───────────────────────────────────────────── */
const AIJudge = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [latestTopic, setLatestTopic] = useState('');
  const [latestKey, setLatestKey] = useState('');
  const [userRole, setUserRole] = useState(null);

  const email = localStorage.getItem('userEmail');

  const saveAndRetrieveJudgement = async (email, topicKey, judgeResult, userRole) => {
    try {
      const response = await axios.post(url+'/api/save-judgement', {
        email,
        topicKey,
        judgeResult,
        userRole,
      });

      if (response.status === 200) {
        const judgementData = {
          email,
          topicKey,
          judgeResult,
          userRole,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(`judgement_${topicKey}`, JSON.stringify(judgementData));
        console.log('Saved to localStorage:', judgementData);

        const judgementKeys = Object.keys(localStorage).filter(key => key.startsWith('judgement_'));
        judgementKeys.forEach(key => {
          const data = localStorage.getItem(key);
          if (data) {
            console.log(`Retrieved judgement data for ${key}:`, JSON.parse(data));
          }
        });
      } else {
        console.error('Error saving judgement:', response.data.error);
      }
    } catch (err) {
      console.error('Error in saveAndRetrieveJudgement:', err);
    }
  };

  useEffect(() => {
    const fetchAndJudge = async () => {
      try {
        // Fetch entries
        const entryRes = await axios.post(url+'/api/fetchEntries', { email });
        const entries = entryRes.data.entries;
        console.log('Entries response:', entries);

        if (!entries || Object.keys(entries).length === 0) {
          console.error('No entries found for email:', email);
          setLoading(false);
          return;
        }

        const keys = Object.keys(entries);
        const lastKey = keys[keys.length - 1];
        const entry = entries[lastKey];
        const topic = entry.topic;

        setLatestKey(lastKey);
        setLatestTopic(topic);

        // Get userrole from entry
        let determinedUserRole = entry.userrole?.toLowerCase();
        console.log('userrole from entry:', determinedUserRole);

        if (!determinedUserRole || !['pm', 'dpm', 'gw', 'lo', 'dlo', 'ow'].includes(determinedUserRole)) {
          console.error('Invalid or missing userrole in entry:', determinedUserRole);
          setLoading(false);
          return;
        }

        setUserRole(determinedUserRole);
        console.log('Final userRole set:', determinedUserRole);

        // Fetch judgement
        const judgeRes = await axios.post(url+'/api/judge', {
          email,
          topic,
        });
        const raw = judgeRes.data.result;
        console.log('Raw judge result:', raw);

        const normalizeKeys = (obj = {}) => {
          const newObj = {};
          for (const key in obj) {
            newObj[key.toLowerCase()] = typeof obj[key] === 'number' ? obj[key] : obj[key] ?? 0;
          }
          return newObj;
        };

        const fixedResult = {
          ...raw,
          proposition: {
            pm: normalizeKeys(raw.pm || {}),
            dpm: normalizeKeys(raw.dpm || {}),
            gw: normalizeKeys(raw.gw || {}),
          },
          opposition: {
            lo: normalizeKeys(raw.lo || {}),
            dlo: normalizeKeys(raw.dlo || {}),
            ow: normalizeKeys(raw.ow || {}),
          },
          winner: raw.winner || 'Unknown',
          reason: raw.reason || 'No reason provided',
          userRole: determinedUserRole,
        };

        console.log('Fixed result:', fixedResult);
        console.log('User data for role', determinedUserRole, ':', fixedResult.proposition[determinedUserRole] || fixedResult.opposition[determinedUserRole]);
        setResult(fixedResult);

        const judgeResult = {
          winner: raw.winner,
          reason: raw.reason,
          pm: raw.pm,
          dpm: raw.dpm,
          gw: raw.gw,
          lo: raw.lo,
          dlo: raw.dlo,
          ow: raw.ow,
        };

        await saveAndRetrieveJudgement(email, lastKey, judgeResult, determinedUserRole);
      } catch (err) {
        console.error('Judging failed:', err);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchAndJudge();
    } else {
      console.error('No email found in localStorage');
      setLoading(false);
    }
  }, [email]);

  const fields = [
    { label: 'Logic', key: 'logic' },
    { label: 'Clarity', key: 'clarity' },
    { label: 'Relevance', key: 'relevance' },
    { label: 'Persuasiveness', key: 'persuasiveness' },
    { label: 'Depth', key: 'depth' },
    { label: 'Evidence Usage', key: 'evidenceusage' },
    { label: 'Emotional Appeal', key: 'emotionalappeal' },
    { label: 'Rebuttal Strength', key: 'rebuttalstrength' },
    { label: 'Structure', key: 'structure' },
    { label: 'Overall', key: 'overall' },
  ];

  const getTeamChartData = () => {
    const propRoles = ['pm', 'dpm', 'gw'];
    const oppRoles = ['lo', 'dlo', 'ow'];

    const calculateTeamAverage = (team, roles) => {
      return fields.map(field => {
        const scores = roles
          .map(role => result?.[team]?.[role]?.[field.key] ?? 0)
          .filter(score => score > 0);
        return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      });
    };

    return {
      labels: fields.map(f => f.label),
      datasets: [
        {
          label: 'Proposition',
          data: calculateTeamAverage('proposition', propRoles),
          backgroundColor: 'rgba(167,139,250,0.8)',
          borderColor: '#a855f7',
          borderWidth: 1,
          borderRadius: 8,
          barThickness: 18,
          categoryPercentage: 0.6,
          barPercentage: 0.9,
        },
        {
          label: 'Opposition',
          data: calculateTeamAverage('opposition', oppRoles),
          backgroundColor: 'rgba(244,114,182,0.8)',
          borderColor: '#ec4899',
          borderWidth: 1,
          borderRadius: 8,
          barThickness: 18,
          categoryPercentage: 0.6,
          barPercentage: 0.9,
        },
      ],
    };
  };

  const getUserChartData = () => {
    console.log('Using userRole for graph:', userRole);
    const userData = result?.proposition?.[userRole] || result?.opposition?.[userRole] || {};

    return {
      labels: fields.map(f => f.label),
      datasets: [
        {
          label: `Your Scores (${userRole?.toUpperCase() || 'Unknown'})`,
          data: fields.map(f => Number(userData[f.key]) || 0),
          backgroundColor: 'rgba(52,211,153,0.8)',
          borderColor: '#059669',
          borderWidth: 1,
          borderRadius: 8,
          barThickness: 18,
        },
      ],
    };
  };

  const getUserFeedbackText = () => {
    console.log('Fetching feedback for userRole:', userRole);
    return result?.proposition?.[userRole]?.feedbacktext || 
           result?.opposition?.[userRole]?.feedbacktext || 
           'No feedback provided.';
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (ctx) {
            const value = ctx.raw;
            return `${ctx.dataset.label}: ${value === 0 ? 'Undefined' : value.toFixed(1)}`;
          },
        },
        backgroundColor: '#2b1a44',
        titleColor: '#f5f3ff',
        bodyColor: '#d8b4fe',
        borderColor: '#a855f7',
        borderWidth: 1,
        cornerRadius: 8,
      },
      legend: {
        labels: {
          color: '#e9d5ff',
          font: { size: 13 },
          boxWidth: 20,
          padding: 20,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#f5f3ff', font: { size: 12 } },
        grid: { color: 'rgba(59,7,100,0.6)' },
      },
      y: {
        ticks: {
          color: '#f5f3ff',
          font: { size: 12 },
          callback: function (value) {
            return value === 0 ? 'Undefined' : value;
          },
        },
        grid: { color: 'rgba(59,7,100,0.6)' },
        beginAtZero: true,
        max: 10,
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
    },
  };

  const sumScores = (team) => {
    if (!result?.[team]) return 0;
    return Object.values(result[team]).reduce((sum, roleData) => {
      if (!roleData) return sum;
      const values = Object.entries(roleData)
        .filter(([k]) => k !== 'feedbacktext')
        .map(([, v]) => Number(v) || 0);
      return sum + values.reduce((a, b) => a + b, 0);
    }, 0);
  };

  const propositionScore = sumScores('proposition');
  const oppositionScore = sumScores('opposition');

  return (
    <div style={{
      background: 'radial-gradient(ellipse at 20% 20%, #1a0a2e 0%, #0f0524 60%, #080212 100%)',
      minHeight: '100vh',
      color: '#f5f3ff',
      fontFamily: "'Rajdhani', sans-serif",
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <style>{keyframes}</style>

      {/* PAGE TITLE */}
      <h2 style={{
        fontFamily: "'Cinzel Decorative', serif",
        fontSize: '2.2rem',
        color: '#c084fc',
        marginBottom: '1.5rem',
        textAlign: 'center',
        textShadow: '0 0 30px rgba(192,132,252,0.6)',
        letterSpacing: '3px',
      }}>
        ⚖️ AI Debate Judge
      </h2>

      {loading ? (
        /* ── LOADING: ARENA ANIMATION ── */
        <DebateArenaLoader />
      ) : result ? (
        /* ── RESULTS DISPLAY ── */
        <div style={{
          width: '100%',
          maxWidth: '1100px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}>
          {/* TOPIC */}
          <ResultCard delay="0s">
            <p style={{
              fontSize: '0.75rem',
              letterSpacing: '3px',
              color: '#a78bfa',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
              fontWeight: 700,
            }}>Motion</p>
            <h3 style={{
              fontSize: '1.4rem',
              color: '#facc15',
              textAlign: 'center',
              fontWeight: 600,
              lineHeight: 1.5,
              margin: 0,
              textShadow: '0 0 20px rgba(250,204,21,0.3)',
            }}>
              "{latestTopic || 'No topic available'}"
            </h3>
          </ResultCard>

          {/* WINNER BANNER */}
          <div style={{
            width: '100%',
            maxWidth: '1000px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(236,72,153,0.3))',
            border: '2px solid rgba(250,204,21,0.5)',
            borderRadius: '20px',
            padding: '1.5rem 2rem',
            textAlign: 'center',
            animation: 'winnerReveal 0.8s ease-out 0.2s both',
            opacity: 0,
            boxShadow: '0 0 60px rgba(250,204,21,0.15), 0 8px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              fontSize: '0.75rem',
              letterSpacing: '4px',
              color: '#facc15',
              marginBottom: '0.5rem',
              fontWeight: 700,
            }}>🏆 WINNER</div>
            <div style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: '2.5rem',
              color: '#fde68a',
              textShadow: '0 0 40px #facc15, 0 0 80px rgba(250,204,21,0.4)',
              letterSpacing: '3px',
            }}>
              {result.winner}
            </div>

            {/* Score pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(167,139,250,0.2)',
                border: '1px solid #a78bfa',
                borderRadius: '30px',
                padding: '8px 24px',
                animation: 'scoreCount 0.5s ease-out 0.6s both',
                opacity: 0,
              }}>
                <span style={{ color: '#a78bfa', fontSize: '0.75rem', letterSpacing: '2px', display: 'block' }}>PROPOSITION</span>
                <span style={{ color: '#e9d5ff', fontSize: '1.8rem', fontWeight: 700 }}>{propositionScore.toFixed(1)}</span>
              </div>
              <div style={{
                background: 'rgba(244,114,182,0.2)',
                border: '1px solid #f472b6',
                borderRadius: '30px',
                padding: '8px 24px',
                animation: 'scoreCount 0.5s ease-out 0.7s both',
                opacity: 0,
              }}>
                <span style={{ color: '#f472b6', fontSize: '0.75rem', letterSpacing: '2px', display: 'block' }}>OPPOSITION</span>
                <span style={{ color: '#fce7f3', fontSize: '1.8rem', fontWeight: 700 }}>{oppositionScore.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* TEAM CHART */}
          <ResultCard delay="0.3s">
            <h3 style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: '1.1rem',
              color: '#facc15',
              marginBottom: '0.5rem',
              letterSpacing: '2px',
            }}>
              Proposition vs Opposition
            </h3>
            <p style={{ color: '#9c6fce', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              Average scores across all criteria
            </p>
            <div style={{ height: '300px' }}>
              <Bar data={getTeamChartData()} options={options} />
            </div>
          </ResultCard>

          {/* YOUR SCORES CHART */}
          <ResultCard delay="0.5s" style={{ borderColor: 'rgba(52,211,153,0.3)' }}>
            <small style={{ fontSize: '0.75rem', color: '#6ee7b7', marginBottom: '0.5rem', display: 'block', letterSpacing: '1px' }}>
              ℹ️ If your scores are incorrect, ensure your email is assigned to the correct role (PM, DPM, GW, LO, DLO, OW).
            </small>
            <h3 style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: '1.1rem',
              color: '#34d399',
              marginBottom: '0.5rem',
              letterSpacing: '2px',
            }}>
              Your Performance
            </h3>
            <div style={{
              display: 'inline-block',
              background: 'rgba(52,211,153,0.15)',
              border: '1px solid #34d399',
              borderRadius: '20px',
              padding: '3px 14px',
              fontSize: '0.8rem',
              color: '#34d399',
              letterSpacing: '2px',
              marginBottom: '1rem',
              fontWeight: 700,
            }}>
              ROLE: {userRole?.toUpperCase() || 'Unknown'}
            </div>

            {/* Feedback quote */}
            <div style={{
              background: 'rgba(52,211,153,0.07)',
              border: '1px solid rgba(52,211,153,0.2)',
              borderLeft: '3px solid #34d399',
              borderRadius: '0 12px 12px 0',
              padding: '1rem 1.2rem',
              marginBottom: '1.5rem',
              fontStyle: 'italic',
              color: '#a7f3d0',
              lineHeight: 1.6,
              fontSize: '0.95rem',
            }}>
              "{getUserFeedbackText()}"
            </div>

            <div style={{ height: '300px' }}>
              <Bar data={getUserChartData()} options={options} />
            </div>
          </ResultCard>

          {/* REASON */}
          <ResultCard delay="0.7s">
            <h3 style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: '1.1rem',
              color: '#facc15',
              marginBottom: '1rem',
              letterSpacing: '2px',
            }}>
              Judge's Reasoning
            </h3>
            <div style={{
              color: '#e9d5ff',
              lineHeight: 1.8,
              fontSize: '1rem',
              borderLeft: '3px solid rgba(250,204,21,0.4)',
              paddingLeft: '1.2rem',
            }}>
              {result.reason}
            </div>
          </ResultCard>

          {/* WIN / LOSE ANIMATION */}
          {result.winner === 'User' ? (
            <Confetti />
          ) : (
            <div style={{
              width: 220,
              height: 220,
              margin: '0 auto',
              animation: 'resultCardIn 0.6s ease-out 0.9s both',
              opacity: 0,
            }}>
              <Lottie animationData={cryAnimation} loop />
            </div>
          )}
        </div>
      ) : (
        <p style={{ color: '#f87171', fontSize: '1.1rem' }}>Failed to judge this debate.</p>
      )}

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate('/overview')}
        style={{
          marginTop: '2.5rem',
          marginBottom: '2rem',
          padding: '0.85rem 2rem',
          fontSize: '1rem',
          fontWeight: 700,
          fontFamily: "'Rajdhani', sans-serif",
          letterSpacing: '2px',
          color: '#fff',
          background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(147,51,234,0.4)',
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #6d28d9, #7e22ce)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(147,51,234,0.6)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #9333ea)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(147,51,234,0.4)';
        }}
      >
        ⬅ Return to Dashboard
      </button>
    </div>
  );
};

export default AIJudge;