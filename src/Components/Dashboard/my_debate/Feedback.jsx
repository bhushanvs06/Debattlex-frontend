import React, { useEffect, useState } from "react";
import axios from "axios";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

var url = process.env.React_App_url;

/* ── Renders text: bold (**x**) becomes <strong>, numbered lists get badges ── */
const RichText = ({ text }) => {
  if (!text) return <span style={{ color: '#9060c8', fontStyle: 'italic' }}>Not available.</span>;

  const lines = String(text)
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {lines.map((line, i) => {
        const numbered = line.match(/^(\d+)\.\s+(.*)/s);
        const raw = numbered ? numbered[2] : line;

        // parse **bold**
        const parts = raw.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} style={{ color: '#e8e0ff', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
          }
          // remove any stray asterisks
          return part.replace(/\*/g, '');
        });

        return (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {numbered ? (
              <span style={{ minWidth: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 2 }}>
                {numbered[1]}
              </span>
            ) : (
              <span style={{ minWidth: 7, height: 7, borderRadius: '50%', background: '#a855f7', marginTop: 8, flexShrink: 0, boxShadow: '0 0 5px rgba(168,85,247,0.6)' }} />
            )}
            <span style={{ fontSize: 14, color: '#c8b8e8', lineHeight: 1.75, fontFamily: "'Georgia',serif" }}>{parts}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Collapsible section with Show More / Show Less ── */
const CollapsibleBlock = ({ label, text, expandKey, expanded, onToggle, maxLines = 3 }) => {
  if (!text?.trim()) return null;

  const lines = String(text).split(/\n+/).map(l => l.trim()).filter(Boolean);
  const needsToggle = lines.length > maxLines;
  const visible = expanded ? lines : lines.slice(0, maxLines);
  const visibleText = visible.join('\n');

  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "'Cinzel',serif", letterSpacing: 3, color: 'rgba(168,85,247,0.65)', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
        <RichText text={visibleText} />
        {needsToggle && (
          <button
            onClick={onToggle}
            style={{ marginTop: 12, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 99, color: '#a855f7', fontSize: 12, fontWeight: 600, padding: '5px 14px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.2s' }}
          >
            {expanded ? '▲ Show Less' : `▼ Show ${lines.length - maxLines} more lines`}
          </button>
        )}
      </div>
    </div>
  );
};

const FeedbackPage = () => {
  const [entries, setEntries] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) { setError("No user email found"); return; }
    const cacheKey = `debattlex_entries_${email}`;

    const processEntries = (entriesObj) => {
      const entriesArray = Object.entries(entriesObj).map(([key, entry]) => {
        const stance = entry.stance?.toLowerCase() || "proposition";
        const userRoleLower = entry.userrole?.toLowerCase() || "";
        const userTeamData = entry[stance]?.[userRoleLower] || {};

        return {
          key,
          topic: entry.topic || "Untitled Debate",
          stance: entry.stance || "Not specified",
          userrole: entry.userrole || "Not specified",
          winner: entry.winner || "Not determined",
          reason: entry.reason || "",
          userScore: entry.aifeedback?.overall || 0,
          userFeedback: entry.aifeedback || {},
          // ── exact same logic as before ──
          userSummary: Array.isArray(userTeamData.summary)
            ? userTeamData.summary.join("\n")
            : userTeamData.summary || "",
          userTranscript: Array.isArray(userTeamData.transcript)
            ? userTeamData.transcript.join(" ")
            : userTeamData.transcript || "",
        };
      });

      setEntries(entriesArray.reverse());
      setError(null);
    };

    // 1. Try to load from cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        processEntries(parsed.entries || {});
      } catch (e) {
        console.error("Error reading feedback cache:", e);
      }
    }

    // 2. Fetch fresh data from server
    const fetchEntries = async () => {
      try {
        const res = await axios.post(`${url}/api/fetchEntries`, { email });
        localStorage.setItem(cacheKey, JSON.stringify(res.data));
        processEntries(res.data.entries || {});
      } catch (err) {
        console.error("Failed to fetch fresh debate entries:", err);
        if (!cached) {
          setError(err.response?.data?.error || "Failed to fetch debate entries");
          setEntries([]);
        }
      }
    };
    fetchEntries();
  }, []);

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));
  const isWinner = (e) => e.winner?.toLowerCase() === e.stance?.toLowerCase();

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(160deg,#0a0014 0%,#0f0025 55%,#080010 100%)', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes cardIn  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orb1    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(18px,-22px)} }
        @keyframes orb2    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-14px,18px)} }
        .fb-card { transition: box-shadow 0.3s ease; }
        .fb-card:hover { box-shadow: 0 20px 60px rgba(0,0,0,0.55), 0 0 36px rgba(168,85,247,0.16) !important; }
        @media(max-width:700px){ .fb-body-grid { grid-template-columns:1fr !important; } }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '5%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.16) 0%,transparent 70%)', animation: 'orb1 9s infinite ease-in-out' }} />
        <div style={{ position: 'absolute', bottom: '8%', right: '5%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', animation: 'orb2 11s infinite ease-in-out' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: 'clamp(24px,5vw,48px) clamp(14px,4vw,28px) 100px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(28px,5vw,48px)', animation: 'fadeUp 0.5s ease' }}>
          <div style={{ fontSize: 10, letterSpacing: 6, color: 'rgba(168,85,247,0.65)', fontFamily: "'Cinzel',serif", marginBottom: 10 }}>PERFORMANCE REVIEW</div>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 'clamp(24px,5vw,50px)', margin: 0, background: 'linear-gradient(90deg,#a855f7,#e879f9,#818cf8,#a855f7)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 3s linear infinite' }}>
            DEBATE FEEDBACK
          </h1>
          <div style={{ width: 50, height: 3, background: 'linear-gradient(90deg,#a855f7,#6366f1)', borderRadius: 99, margin: '14px auto 0', boxShadow: '0 0 10px rgba(168,85,247,0.5)' }} />
        </div>

        {error && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 14, padding: '14px 20px', marginBottom: 24, color: '#fca5a5', textAlign: 'center', fontSize: 14 }}>{error}</div>}

        {entries.length === 0 && !error && (
          <div style={{ textAlign: 'center', color: 'rgba(168,85,247,0.4)', fontSize: 16, fontFamily: "'Cinzel',serif", letterSpacing: 2, marginTop: 80 }}>No feedback available yet.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {entries.map((entry, idx) => {
            const won = isWinner(entry);
            const scoreColor = entry.userScore >= 7 ? '#4ade80' : entry.userScore >= 5 ? '#fbbf24' : '#f87171';
            const radarData = Object.keys(entry.userFeedback)
              .filter(k => typeof entry.userFeedback[k] === 'number')
              .map(k => ({ subject: k, A: entry.userFeedback[k] }));

            return (
              <div key={entry.key} className="fb-card" style={{ borderRadius: 22, overflow: 'hidden', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(168,85,247,0.13)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', animation: `cardIn 0.5s ease ${idx * 70}ms both` }}>

                {/* ── Top bar ── */}
                <div style={{ padding: 'clamp(16px,3vw,24px) clamp(16px,3vw,28px) 18px', borderBottom: '1px solid rgba(168,85,247,0.08)', background: won ? 'linear-gradient(135deg,rgba(74,222,128,0.06),transparent)' : 'linear-gradient(135deg,rgba(248,113,113,0.06),transparent)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 'clamp(14px,2.5vw,18px)', color: '#e8e0ff', margin: 0, flex: 1 }}>{entry.topic}</h3>
                    <div style={{ padding: '5px 14px', borderRadius: 99, background: won ? 'rgba(74,222,128,0.14)' : 'rgba(248,113,113,0.14)', border: `1px solid ${won ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)'}`, color: won ? '#4ade80' : '#f87171', fontSize: 12, fontWeight: 700, fontFamily: "'Cinzel',serif", letterSpacing: 1, flexShrink: 0 }}>
                      {won ? '🏆 WIN' : '💔 LOSS'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                    {[
                      { label: 'Stance', val: entry.stance, color: '#c084fc' },
                      { label: 'Role',   val: entry.userrole, color: '#60a5fa' },
                      { label: 'Winner', val: entry.winner, color: won ? '#4ade80' : '#f87171' },
                      { label: 'Score',  val: `${entry.userScore}/10`, color: scoreColor },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, background: `${color}12`, border: `1px solid ${color}30`, color, fontSize: 12, fontWeight: 600 }}>
                        <span style={{ opacity: 0.6 }}>{label}:</span>
                        <span style={{ fontWeight: 700 }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Card body ── */}
                <div style={{ padding: 'clamp(16px,3vw,24px) clamp(16px,3vw,28px)' }}>

                  {/* Reason */}
                  {entry.reason && entry.reason !== "No reason provided" && (
                    <div style={{ marginBottom: 24, padding: '14px 18px', background: 'rgba(168,85,247,0.05)', borderLeft: '3px solid rgba(168,85,247,0.45)', borderRadius: '0 12px 12px 0' }}>
                      <div style={{ fontSize: 11, fontFamily: "'Cinzel',serif", letterSpacing: 3, color: 'rgba(168,85,247,0.65)', textTransform: 'uppercase', marginBottom: 10 }}>
                        {won ? 'Why You Won' : 'Why You Lost'}
                      </div>
                      <CollapsibleBlock
                        text={entry.reason}
                        expandKey={`reason${idx}`}
                        expanded={expanded[`reason${idx}`]}
                        onToggle={() => toggle(`reason${idx}`)}
                        maxLines={3}
                      />
                    </div>
                  )}

                  {/* Two-col: text left, radar right */}
                  <div className="fb-body-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: 24, alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>

                      <CollapsibleBlock
                        label="Your Summary"
                        text={entry.userSummary}
                        expandKey={`sum${idx}`}
                        expanded={expanded[`sum${idx}`]}
                        onToggle={() => toggle(`sum${idx}`)}
                        maxLines={4}
                      />

                      <CollapsibleBlock
                        label="Your Transcript"
                        text={entry.userTranscript}
                        expandKey={`trans${idx}`}
                        expanded={expanded[`trans${idx}`]}
                        onToggle={() => toggle(`trans${idx}`)}
                        maxLines={4}
                      />

                      <CollapsibleBlock
                        label="AI Feedback"
                        text={entry.userFeedback?.feedbackText}
                        expandKey={`fb${idx}`}
                        expanded={expanded[`fb${idx}`]}
                        onToggle={() => toggle(`fb${idx}`)}
                        maxLines={4}
                      />
                    </div>

                    {/* Radar */}
                    {radarData.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontFamily: "'Cinzel',serif", letterSpacing: 3, color: 'rgba(168,85,247,0.65)', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>Skill Radar</div>
                        <div style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 16, padding: '10px 4px' }}>
                          <ResponsiveContainer width="100%" height={210}>
                            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                              <PolarGrid stroke="rgba(168,85,247,0.18)" />
                              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#a78bfa' }} />
                              <PolarRadiusAxis tick={{ fontSize: 8, fill: 'rgba(168,85,247,0.4)' }} />
                              <Radar dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;