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
   HIGH-PERFORMANCE TECH DELIBERATION LOADER
   (Extremely lightweight, GPU accelerated, low-end optimized)
───────────────────────────────────────────── */
const PremiumRadarLoader = ({ ecoMode }) => {
  const [loadingPhase, setLoadingPhase] = useState(0);
  const phases = [
    "🎙️ Compiling transcripts...",
    "🧠 Running semantic evaluation...",
    "⚖️ Weighing argument logic...",
    "🔨 Finalizing judge adjudication..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingPhase(prev => (prev + 1) % phases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [phases.length]);

  return (
    <div style={styles.loaderContainer}>
      <div style={{
        ...styles.radarWrapper,
        animation: ecoMode ? 'none' : 'radarSweep 4s linear infinite'
      }}>
        <div style={styles.radarRingOuter} />
        <div style={styles.radarRingMiddle} />
        <div style={styles.radarScanLine} />
        <div style={styles.radarCenterGavel}>⚖️</div>
      </div>
      <div style={styles.loaderStatus}>
        <div style={styles.gavelIconAnimation}>🔨</div>
        <div style={styles.loaderStatusText}>{phases[loadingPhase]}</div>
        <div style={styles.loaderSubtext}>Court is deliberating. Please stand by...</div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   REDESIGNED MAIN COMPONENT WITH LOW-END & GOODPART SUPPORT
───────────────────────────────────────────── */
const AIJudge = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [latestTopic, setLatestTopic] = useState('');
  const [userRole, setUserRole] = useState(null);
  
  // Eco-mode to optimize rendering for low-end devices
  const [ecoMode, setEcoMode] = useState(() => {
    const saved = localStorage.getItem('ai_judge_eco_mode');
    return saved === 'true';
  });

  const email = localStorage.getItem('userEmail');

  const toggleEcoMode = () => {
    setEcoMode(prev => {
      const newVal = !prev;
      localStorage.setItem('ai_judge_eco_mode', String(newVal));
      return newVal;
    });
  };

  const saveAndRetrieveJudgement = async (email, topicKey, judgeResult, userRole) => {
    try {
      await axios.post(url + '/api/save-judgement', {
        email,
        topicKey,
        judgeResult,
        userRole,
      });
    } catch (err) {
      console.error('Error saving judgement:', err);
    }
  };

  useEffect(() => {
    const fetchAndJudge = async () => {
      try {
        const entryRes = await axios.post(url + '/api/fetchEntries', { email });
        const entries = entryRes.data.entries;

        if (!entries || Object.keys(entries).length === 0) {
          setLoading(false);
          return;
        }

        const keys = Object.keys(entries);
        const sortedKeys = keys.sort((a, b) => {
          const dateA = entries[a]?.createdAt ? new Date(entries[a].createdAt) : new Date(0);
          const dateB = entries[b]?.createdAt ? new Date(entries[b].createdAt) : new Date(0);
          return dateB - dateA;
        });

        const activeKey = localStorage.getItem('activeDebateKey');
        const lastKey = (activeKey && entries[activeKey]) ? activeKey : sortedKeys[0];
        const entry = entries[lastKey];
        if (!entry) {
          setLoading(false);
          return;
        }
        const topic = entry.topic;

        setLatestTopic(topic);

        let determinedUserRole = entry.userrole?.toLowerCase() || 'pm';
        setUserRole(determinedUserRole);

        const judgeRes = await axios.post(url + '/api/judge', {
          email,
          topic,
          topicKey: lastKey,
        });
        const raw = judgeRes.data.result;

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
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchAndJudge();
    } else {
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
          backgroundColor: ecoMode ? 'rgba(167,139,250,0.6)' : 'rgba(167,139,250,0.8)',
          borderColor: '#a855f7',
          borderWidth: 1,
          borderRadius: 6,
          barThickness: ecoMode ? 14 : 18,
        },
        {
          label: 'Opposition',
          data: calculateTeamAverage('opposition', oppRoles),
          backgroundColor: ecoMode ? 'rgba(244,114,182,0.6)' : 'rgba(244,114,182,0.8)',
          borderColor: '#ec4899',
          borderWidth: 1,
          borderRadius: 6,
          barThickness: ecoMode ? 14 : 18,
        },
      ],
    };
  };

  const getUserChartData = () => {
    const userData = result?.proposition?.[userRole] || result?.opposition?.[userRole] || {};

    return {
      labels: fields.map(f => f.label),
      datasets: [
        {
          label: `Your Performance (${userRole?.toUpperCase()})`,
          data: fields.map(f => Number(userData[f.key]) || 0),
          backgroundColor: ecoMode ? 'rgba(52,211,153,0.6)' : 'rgba(52,211,153,0.8)',
          borderColor: '#059669',
          borderWidth: 1,
          borderRadius: 6,
          barThickness: ecoMode ? 14 : 18,
        },
      ],
    };
  };

  const getUserFeedbackText = () => {
    return result?.proposition?.[userRole]?.feedbacktext || 
           result?.proposition?.[userRole]?.feedbackText ||
           result?.opposition?.[userRole]?.feedbacktext || 
           result?.opposition?.[userRole]?.feedbackText ||
           'No feedback provided.';
  };

  const getUserGoodPart = () => {
    const userData = result?.proposition?.[userRole] || result?.opposition?.[userRole] || {};
    return userData.goodpart || userData.goodPart || "Your arguments were well-structured and properly delivered.";
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: '#1e1136',
        titleColor: '#fff',
        bodyColor: '#c084fc',
        cornerRadius: 6,
      },
      legend: {
        labels: {
          color: '#e9d5ff',
          font: { family: "'Rajdhani', sans-serif", size: 12 },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#e9d5ff', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: { color: '#e9d5ff', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
        beginAtZero: true,
        max: 10,
      },
    },
    animation: ecoMode ? false : {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  const sumScores = (team) => {
    if (!result?.[team]) return 0;
    return Object.values(result[team]).reduce((sum, roleData) => {
      if (!roleData) return sum;
      const values = Object.entries(roleData)
        .filter(([k]) => k !== 'feedbacktext' && k !== 'feedbackText' && k !== 'goodpart' && k !== 'goodPart')
        .map(([, v]) => Number(v) || 0);
      return sum + values.reduce((a, b) => a + b, 0);
    }, 0);
  };

  const propositionScore = sumScores('proposition');
  const oppositionScore = sumScores('opposition');

  const propositionRoles = ['pm', 'dpm', 'gw'];
  const userIsProp = propositionRoles.includes(userRole);
  const userTeamWinner = (userIsProp && result?.winner === 'Proposition') || (!userIsProp && result?.winner === 'Opposition');

  return (
    <div style={{
      ...styles.pageContainer,
      background: 'radial-gradient(ellipse at 50% 10%, #15082b 0%, #090314 70%, #020105 100%)'
    }}>
      <style>{animationKeyframes}</style>

      {/* ECO MODE FLOATING ACTION BAR */}
      <div style={styles.topBarActions}>
        <button 
          onClick={toggleEcoMode} 
          style={{
            ...styles.ecoToggleBtn,
            background: ecoMode ? '#10b981' : 'rgba(255,255,255,0.06)',
            color: ecoMode ? '#000' : '#fff'
          }}
        >
          {ecoMode ? '🍃 Eco Mode: ON' : '⚡ Eco Mode: OFF'}
        </button>
      </div>

      {/* HEADER TITLE */}
      <header style={styles.header}>
        <h2 style={{
          ...styles.pageTitle,
          textShadow: ecoMode ? 'none' : '0 0 30px rgba(168, 85, 247, 0.4)'
        }}>
          ⚖️ DEBATTLEX AI JUDGE
        </h2>
        <div style={styles.headerLine} />
      </header>

      {loading ? (
        <PremiumRadarLoader ecoMode={ecoMode} />
      ) : result ? (
        <div style={styles.dashboardGrid}>

          {/* MOTION / TOPIC SECTION */}
          <div style={styles.glassCardFull}>
            <div style={styles.cardTopicBadge}>MOTION UNDER DEBATE</div>
            <h3 style={styles.debateTopicTitle}>
              "{latestTopic || 'No topic available'}"
            </h3>
          </div>

          {/* VERDICT & CELEBRATION BLOCK */}
          <div style={{
            ...styles.verdictPanel,
            border: userTeamWinner 
              ? '2px solid rgba(16, 185, 129, 0.4)' 
              : '2px solid rgba(239, 68, 68, 0.4)',
            background: userTeamWinner 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)' 
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
            boxShadow: ecoMode ? 'none' : '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={styles.verdictStatus}>
              {userTeamWinner ? '🏆 DEBATE VICTORY' : '🤝 EXCELLENT EFFORT'}
            </div>
            
            <div style={{
              ...styles.verdictTitle,
              color: userTeamWinner ? '#10b981' : '#f87171'
            }}>
              {userTeamWinner ? 'YOUR TEAM WON!' : 'AI TEAM SECURED RULING'}
            </div>

            <div style={styles.reasonText}>{result.reason}</div>

            {/* Score pills */}
            <div style={styles.scorePillsRow}>
              <div style={{
                ...styles.scorePill,
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.3)'
              }}>
                <span style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px' }}>PROPOSITION SCORE</span>
                <span style={{ color: '#e9d5ff', fontSize: '1.8rem', fontWeight: 700 }}>{propositionScore.toFixed(1)}</span>
              </div>
              <div style={{
                ...styles.scorePill,
                background: 'rgba(244,114,182,0.1)',
                border: '1px solid rgba(244,114,182,0.3)'
              }}>
                <span style={{ color: '#f472b6', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px' }}>OPPOSITION SCORE</span>
                <span style={{ color: '#fce7f3', fontSize: '1.8rem', fontWeight: 700 }}>{oppositionScore.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC SHIELD: STRONGEST ARGUMENT / GOODPART ("google" part) */}
          <div style={{
            ...styles.glassCardFull,
            border: '1px solid rgba(245, 158, 11, 0.3)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(30, 20, 10, 0.3) 100%)',
            animation: ecoMode ? 'none' : 'cardGlowPulse 6s ease-in-out infinite'
          }}>
            <div style={{ ...styles.cardTopicBadge, color: '#fbbf24' }}>🧠 STRONGEST PART OF YOUR ARGUMENT</div>
            <div style={styles.goodPartQuoteContainer}>
              <span style={styles.quoteIcon}>“</span>
              <p style={styles.goodPartQuoteText}>{getUserGoodPart()}</p>
              <span style={{ ...styles.quoteIcon, textAlign: 'right' }}>”</span>
            </div>
          </div>

          {/* TWO COLUMN GRID FOR DETAILED INDIVIDUAL FEEDBACK */}
          <div style={styles.feedbackTwoColumnGrid}>
            
            {/* PERFORMANCE ANALYSIS */}
            <div style={styles.glassCardColumn}>
              <div style={styles.cardTopicBadge}>📈 INDIVIDUAL COACHING</div>
              <div style={styles.userRoleBadge}>YOUR ROLE: {userRole?.toUpperCase()}</div>
              
              <div style={styles.feedbackWrapper}>
                <h4 style={styles.feedbackHeadline}>Judge's Expert Critique:</h4>
                <p style={styles.feedbackContentText}>"{getUserFeedbackText()}"</p>
              </div>

              <div style={ecoMode ? styles.chartContainerEco : styles.chartContainer}>
                <Bar data={getUserChartData()} options={chartOptions} />
              </div>
            </div>

            {/* TEAM SCORE COMPARISONS */}
            <div style={styles.glassCardColumn}>
              <div style={styles.cardTopicBadge}>📊 DEBATE COMPARISON</div>
              <h4 style={styles.feedbackHeadline}>Proposition vs Opposition Breakdown:</h4>
              <p style={styles.feedbackContentText}>
                Average scores calculated across all criteria. Utilize this comparison to spot which debate parameters can be refined.
              </p>

              <div style={ecoMode ? styles.chartContainerEco : styles.chartContainer}>
                <Bar data={getTeamChartData()} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* WIN / LOSE VISUAL EFFECTS */}
          {userTeamWinner ? (
            !ecoMode && <Confetti numberOfPieces={70} opacity={0.6} recycle={false} />
          ) : (
            <div style={styles.lottieWrap}>
              <Lottie animationData={cryAnimation} loop style={{ width: '100%', height: '100%' }} />
            </div>
          )}

        </div>
      ) : (
        <div style={styles.errorBanner}>
          <h3>❌ Adjudication Failed</h3>
          <p>No recorded debate session was found for your email address. Run a debate first!</p>
        </div>
      )}

      {/* DASHBOARD RETURN BAR */}
      <footer style={styles.footer}>
        <button
          onClick={() => navigate('/overview')}
          style={{
            ...styles.returnBtn,
            boxShadow: ecoMode ? 'none' : '0 4px 20px rgba(124, 58, 237, 0.4)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = ecoMode ? 'none' : 'translateY(-2px)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #6d28d9, #7e22ce)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #9333ea)';
          }}
        >
          ⬅ Return to Dashboard
        </button>
      </footer>
    </div>
  );
};

/* ─────────────────────────────────────────────
   STUNNING GLASSMORPHIC STYLING MATRIX
───────────────────────────────────────────── */
const styles = {
  pageContainer: {
    minHeight: '100vh',
    color: '#f5f3ff',
    fontFamily: "'Rajdhani', sans-serif",
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowX: 'hidden'
  },
  topBarActions: {
    width: '100%',
    maxWidth: '1000px',
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '1rem'
  },
  ecoToggleBtn: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Rajdhani', sans-serif",
    transition: 'all 0.3s ease',
    letterSpacing: '1px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  pageTitle: {
    fontFamily: "'Cinzel Decorative', serif",
    fontSize: '2.4rem',
    fontWeight: 900,
    color: '#c084fc',
    margin: 0,
    letterSpacing: '3px'
  },
  headerLine: {
    height: '2px',
    width: '180px',
    background: 'linear-gradient(90deg, transparent, #a855f7, transparent)',
    margin: '8px auto 0'
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2.5rem',
    margin: '5rem 0'
  },
  radarWrapper: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    position: 'relative',
    border: '2px solid rgba(168, 85, 247, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    willChange: 'transform'
  },
  radarRingOuter: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    position: 'absolute',
    border: '1px dashed rgba(245, 158, 11, 0.3)'
  },
  radarRingMiddle: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    position: 'absolute',
    border: '1px solid rgba(168, 85, 247, 0.15)'
  },
  radarScanLine: {
    position: 'absolute',
    width: '50%',
    height: '2px',
    background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.8), transparent)',
    top: '50%',
    left: '50%',
    transformOrigin: '0% 50%',
    transform: 'rotate(0deg)'
  },
  radarCenterGavel: {
    fontSize: '2rem',
    zIndex: 2,
    position: 'absolute'
  },
  loaderStatus: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem'
  },
  gavelIconAnimation: {
    fontSize: '1.8rem',
    animation: 'gavelHitPulse 1.2s ease-in-out infinite'
  },
  loaderStatusText: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#d8b4fe',
    letterSpacing: '1px'
  },
  loaderSubtext: {
    fontSize: '0.85rem',
    color: '#a78bfa',
    opacity: 0.8
  },
  dashboardGrid: {
    width: '100%',
    maxWidth: '1000px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  glassCardFull: {
    background: 'rgba(30, 16, 54, 0.45)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(168, 85, 247, 0.15)',
    borderRadius: '20px',
    padding: '1.6rem 2rem',
    position: 'relative'
  },
  cardTopicBadge: {
    fontSize: '0.75rem',
    letterSpacing: '2px',
    color: '#c084fc',
    fontWeight: 700,
    marginBottom: '0.5rem',
    textTransform: 'uppercase'
  },
  debateTopicTitle: {
    fontSize: '1.4rem',
    color: '#fbbf24',
    margin: 0,
    fontWeight: 600,
    lineHeight: 1.5,
    textAlign: 'center'
  },
  verdictPanel: {
    borderRadius: '20px',
    padding: '2.5rem 2rem',
    textAlign: 'center',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.8rem'
  },
  verdictStatus: {
    fontSize: '0.75rem',
    letterSpacing: '3px',
    color: '#fbbf24',
    fontWeight: 700
  },
  verdictTitle: {
    fontFamily: "'Cinzel Decorative', serif",
    fontSize: '2.2rem',
    fontWeight: 800,
    margin: '0 0 0.5rem 0',
    letterSpacing: '2px'
  },
  reasonText: {
    color: '#e9d5ff',
    lineHeight: 1.8,
    fontSize: '1rem',
    maxWidth: '820px',
    margin: '0 auto'
  },
  scorePillsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    marginTop: '1.5rem',
    flexWrap: 'wrap',
    width: '100%'
  },
  scorePill: {
    borderRadius: '24px',
    padding: '8px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '150px'
  },
  goodPartQuoteContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    width: '100%',
    padding: '0.5rem 0'
  },
  quoteIcon: {
    fontSize: '2.4rem',
    color: 'rgba(251, 191, 36, 0.2)',
    fontFamily: 'serif',
    lineHeight: 0.1,
    flexShrink: 0
  },
  goodPartQuoteText: {
    fontSize: '1.05rem',
    lineHeight: 1.7,
    fontStyle: 'italic',
    color: '#fef08a',
    margin: 0,
    flexGrow: 1
  },
  feedbackTwoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    width: '100%'
  },
  glassCardColumn: {
    background: 'rgba(21, 10, 41, 0.5)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(168, 85, 247, 0.15)',
    borderRadius: '20px',
    padding: '1.6rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '450px'
  },
  userRoleBadge: {
    display: 'inline-block',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '20px',
    padding: '3px 12px',
    fontSize: '0.75rem',
    color: '#10b981',
    fontWeight: 700,
    letterSpacing: '1px',
    alignSelf: 'flex-start',
    marginBottom: '1rem'
  },
  feedbackWrapper: {
    marginBottom: '1.5rem'
  },
  feedbackHeadline: {
    fontSize: '1rem',
    color: '#d8b4fe',
    margin: '0 0 0.5rem 0',
    fontWeight: 700
  },
  feedbackContentText: {
    color: '#c084fc',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    margin: 0,
    fontStyle: 'italic'
  },
  chartContainer: {
    flexGrow: 1,
    height: '240px',
    position: 'relative',
    marginTop: 'auto'
  },
  chartContainerEco: {
    flexGrow: 1,
    height: '240px',
    position: 'relative',
    marginTop: 'auto'
  },
  lottieWrap: {
    width: '160px',
    height: '160px',
    margin: '1.5rem auto 0'
  },
  errorBanner: {
    textAlign: 'center',
    padding: '3rem',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '20px',
    maxWidth: '600px',
    margin: '3rem 0'
  },
  footer: {
    margin: '3rem 0'
  },
  returnBtn: {
    padding: '12px 28px',
    fontSize: '0.95rem',
    fontWeight: 700,
    letterSpacing: '1px',
    color: '#fff',
    background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: "'Rajdhani', sans-serif",
    transition: 'all 0.3s ease'
  }
};

/* ─────────────────────────────────────────────
   HIGH-PERFORMANCE HARDWARE-ACCELERATED KEYFRAMES
───────────────────────────────────────────── */
const animationKeyframes = `
  @keyframes radarSweep {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes gavelHitPulse {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.15) rotate(-20deg); }
  }
  @keyframes cardGlowPulse {
    0%, 100% { border-color: rgba(245, 158, 11, 0.2); }
    50% { border-color: rgba(245, 158, 11, 0.45); }
  }
`;

export default AIJudge;