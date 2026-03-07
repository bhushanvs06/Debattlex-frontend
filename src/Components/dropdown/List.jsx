import React, { useState, useEffect } from "react";
import Stepper, { Step } from "../React_bits/Card/Stepper";
import axios from "axios";
import "./List.css";
import { useNavigate } from "react-router-dom";
import ProfileCard from "../React_bits/ProfileCard/ProfileCard";

var url = process.env.React_App_url;

// ── SVG Icons ──────────────────────────────────────
const SproutIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 56V28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 40C32 40 20 36 18 24C18 24 30 20 36 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
    <path d="M32 34C32 34 42 28 46 18C46 18 36 12 28 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
    <circle cx="32" cy="56" r="4" fill="currentColor" fillOpacity="0.3"/>
  </svg>
);

const FlameIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 8C32 8 44 20 44 32C44 38.627 38.627 44 32 44C25.373 44 20 38.627 20 32C20 26 24 20 24 20C24 20 24 28 30 30C28 24 32 8 32 8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
    <path d="M32 44C32 44 26 40 26 34C26 34 30 36 32 36C34 36 38 34 38 34C38 40 32 44 32 44Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="32" cy="54" r="3" fill="currentColor" fillOpacity="0.3"/>
    <path d="M29 54 L35 54" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CrownIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 44L14 20L28 34L32 14L36 34L50 20L56 44H8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
    <rect x="8" y="44" width="48" height="6" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3"/>
    <circle cx="32" cy="14" r="3" fill="currentColor"/>
    <circle cx="14" cy="20" r="2.5" fill="currentColor"/>
    <circle cx="50" cy="20" r="2.5" fill="currentColor"/>
  </svg>
);

const ArenaOne = () => (
  <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="lb-arena-svg">
    {/* Platform */}
    <rect x="10" y="70" width="60" height="20" rx="4" fill="rgba(251,191,36,0.15)" stroke="rgba(251,191,36,0.5)" strokeWidth="1.5"/>
    <rect x="90" y="70" width="60" height="20" rx="4" fill="rgba(148,163,184,0.15)" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5"/>
    {/* Podiums */}
    <rect x="30" y="52" width="20" height="18" rx="3" fill="rgba(251,191,36,0.2)" stroke="rgba(251,191,36,0.6)" strokeWidth="1.5"/>
    <rect x="110" y="52" width="20" height="18" rx="3" fill="rgba(148,163,184,0.2)" stroke="rgba(148,163,184,0.6)" strokeWidth="1.5"/>
    {/* Figures */}
    <circle cx="40" cy="38" r="8" fill="rgba(251,191,36,0.3)" stroke="rgba(251,191,36,0.8)" strokeWidth="1.5"/>
    <path d="M34 52 Q40 46 46 52" stroke="rgba(251,191,36,0.8)" strokeWidth="1.5" fill="none"/>
    <circle cx="120" cy="38" r="8" fill="rgba(148,163,184,0.3)" stroke="rgba(148,163,184,0.8)" strokeWidth="1.5"/>
    <path d="M114 52 Q120 46 126 52" stroke="rgba(148,163,184,0.8)" strokeWidth="1.5" fill="none"/>
    {/* VS */}
    <text x="80" y="58" textAnchor="middle" fill="rgba(192,132,252,0.9)" fontSize="14" fontWeight="bold" fontFamily="serif">VS</text>
    {/* Speech lines */}
    <path d="M50 38 L68 38" stroke="rgba(251,191,36,0.4)" strokeWidth="1" strokeDasharray="3,3"/>
    <path d="M110 38 L92 38" stroke="rgba(148,163,184,0.4)" strokeWidth="1" strokeDasharray="3,3"/>
    {/* Labels */}
    <text x="40" y="96" textAnchor="middle" fill="rgba(251,191,36,0.8)" fontSize="8" fontFamily="serif">PROP</text>
    <text x="120" y="96" textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="8" fontFamily="serif">OPP</text>
  </svg>
);

const ArenaThree = () => (
  <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="lb-arena-svg">
    {/* Platform bars */}
    <rect x="5" y="78" width="90" height="16" rx="3" fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5"/>
    <rect x="105" y="78" width="90" height="16" rx="3" fill="rgba(148,163,184,0.12)" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5"/>
    {/* Proposition speakers */}
    {[18, 50, 82].map((x, i) => (
      <g key={`p${i}`}>
        <rect x={x - 10} y="58" width="20" height="20" rx="2" fill="rgba(251,191,36,0.15)" stroke="rgba(251,191,36,0.5)" strokeWidth="1"/>
        <circle cx={x} cy="42" r="7" fill="rgba(251,191,36,0.25)" stroke="rgba(251,191,36,0.7)" strokeWidth="1.5"/>
        <path d={`M${x-5} 58 Q${x} 52 ${x+5} 58`} stroke="rgba(251,191,36,0.6)" strokeWidth="1.2" fill="none"/>
      </g>
    ))}
    {/* Opposition speakers */}
    {[118, 150, 182].map((x, i) => (
      <g key={`o${i}`}>
        <rect x={x - 10} y="58" width="20" height="20" rx="2" fill="rgba(148,163,184,0.15)" stroke="rgba(148,163,184,0.5)" strokeWidth="1"/>
        <circle cx={x} cy="42" r="7" fill="rgba(148,163,184,0.25)" stroke="rgba(148,163,184,0.7)" strokeWidth="1.5"/>
        <path d={`M${x-5} 58 Q${x} 52 ${x+5} 58`} stroke="rgba(148,163,184,0.6)" strokeWidth="1.2" fill="none"/>
      </g>
    ))}
    {/* VS divider */}
    <line x1="100" y1="20" x2="100" y2="100" stroke="rgba(192,132,252,0.3)" strokeWidth="1" strokeDasharray="4,4"/>
    <text x="100" y="14" textAnchor="middle" fill="rgba(192,132,252,0.9)" fontSize="12" fontWeight="bold" fontFamily="serif">VS</text>
    {/* Labels */}
    <text x="50" y="102" textAnchor="middle" fill="rgba(251,191,36,0.8)" fontSize="7" fontFamily="serif">PROPOSITION BENCH</text>
    <text x="150" y="102" textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="7" fontFamily="serif">OPPOSITION BENCH</text>
    {/* Role labels */}
    {['PM','DPM','GW'].map((r, i) => (
      <text key={r} x={18 + i*32} y="72" textAnchor="middle" fill="rgba(251,191,36,0.6)" fontSize="6" fontFamily="serif">{r}</text>
    ))}
    {['LO','DLO','OW'].map((r, i) => (
      <text key={r} x={118 + i*32} y="72" textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="6" fontFamily="serif">{r}</text>
    ))}
  </svg>
);

const roleData = {
  pm:  { label: "Prime Minister",    abbr: "PM",  desc: "Opens the debate, defines the motion, sets the narrative.", order: "1st Speaker", color: "gold" },
  dpm: { label: "Deputy P.M.",       abbr: "DPM", desc: "Reinforces the case, rebuts opposition's opening.", order: "3rd Speaker", color: "gold" },
  gw:  { label: "Govt. Whip",        abbr: "GW",  desc: "Summarises the bench, responds to opposition whip.", order: "5th Speaker", color: "gold" },
  lo:  { label: "Leader of Opp.",    abbr: "LO",  desc: "Challenges the motion, sets the opposition narrative.", order: "2nd Speaker", color: "silver" },
  dlo: { label: "Deputy L.O.",       abbr: "DLO", desc: "Builds the opposition case, rebuts government.", order: "4th Speaker", color: "silver" },
  ow:  { label: "Opposition Whip",   abbr: "OW",  desc: "Closes for opposition, crystallises the debate.", order: "6th Speaker", color: "silver" },
};

// ── Component ──────────────────────────────────────
function List({ onStepperComplete }) {
  const [type, setType]           = useState("");
  const [topic, setTopic]         = useState("");
  const [debateType, setDebateType] = useState("");
  const [stance, setStance]       = useState("");
  const [userrole, setRole]       = useState("");
  const [email, setEmail]         = useState("");
  const [loadingTopic, setLoadingTopic] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (!storedEmail) {
      alert("User email not found. Please log in again.");
      navigate("/login");
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  const generateTopic = async () => {
    if (!topic.trim()) { alert("Type at least a keyword for your interest first."); return; }
    setLoadingTopic(true);
    try {
      const res = await fetch(url + "/api/generate-debate-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interest: topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unknown error");
      setTopic(data.generatedTopic);
    } catch (err) {
      console.error("Error generating topic:", err);
      alert("Could not generate topic. Try again.");
    } finally {
      setLoadingTopic(false);
    }
  };

  const handleFinalSubmit = async () => {
    let finalRole = userrole;
    if (debateType === "1v1") {
      if (stance === "proposition")  finalRole = "pm";
      else if (stance === "opposition") finalRole = "lo";
    }
    if (!type || !topic || !debateType || !stance || !finalRole) {
      alert("Please complete all fields before proceeding.");
      return;
    }
    const entry = { type, topic, debateType, stance, userrole: finalRole };
    console.log(entry);
    try {
      await axios.post(url + "/api/userdata", { email, entry });
      if (onStepperComplete) onStepperComplete();
      if (debateType === "1v1")      navigate("/arina");
      else if (debateType === "3v3") navigate("/caseprep");
    } catch (err) {
      console.error("Error saving stepper data:", err.response?.data || err.message);
      alert("Something went wrong while saving your data.");
    }
  };

  const getRoles = () => {
    if (stance === "proposition") return ["pm", "dpm", "gw"];
    if (stance === "opposition")  return ["lo", "dlo", "ow"];
    return [];
  };

  const levelConfig = {
    beginner:     { icon: <SproutIcon />, tag: "Learner Debater",    desc: "Building fundamentals, learning structure and argumentation basics." },
    intermediate: { icon: <FlameIcon />,  tag: "Confident Debater",  desc: "Solid grasp of mechanics, developing rebuttal and POI skills." },
    advanced:     { icon: <CrownIcon />,  tag: "Master Debater",     desc: "Tournament-ready with sharp rhetoric, strategy and delivery." },
  };

  return (
    <div className="main-box" >
      <Stepper
        initialStep={1}
        onStepChange={(step) => {
          if (step === 2 && !type)       { alert("Please select participant type.");            return false; }
          if (step === 3 && !topic)      { alert("Please enter a debate topic or generate one."); return false; }
          if (step === 4 && !debateType) { alert("Please select debate type.");                 return false; }
          if (step === 5 && !stance)     { alert("Please select your stance.");                 return false; }
          return true;
        }}
        onFinalStepCompleted={handleFinalSubmit}
        backButtonText="Previous"
        nextButtonText="Next"
      >

        {/* ── Step 1: Participant Type ── */}
        <Step>
          <h2 className="lb-step-title">Participant Type</h2>
          <p className="lb-step-sub">Choose your experience level to calibrate the debate difficulty.</p>
          <div className="lb-level-grid">
            {["beginner", "intermediate", "advanced"].map((level) => (
              <button
                key={level}
                type="button"
                className={`lb-level-card ${type === level ? "lb-level-card--active" : ""}`}
                onClick={() => setType(level)}
              >
                <div className={`lb-level-icon lb-level-icon--${level}`}>
                  {levelConfig[level].icon}
                </div>
                <div className="lb-level-badge">{levelConfig[level].tag}</div>
                <div className="lb-level-name">{level.charAt(0).toUpperCase() + level.slice(1)}</div>
                <p className="lb-level-desc">{levelConfig[level].desc}</p>
                {type === level && <div className="lb-level-check">✓ Selected</div>}
                <div className="lb-card-glow" />
              </button>
            ))}
          </div>
        </Step>

        {/* ── Step 2: Debate Topic ── */}
        <Step>
          <h2 className="lb-step-title">Debate Topic</h2>
          <p className="lb-step-sub">Enter a keyword or theme — let the arena forge your motion.</p>
          <div className="lb-topic-layout">
            <div className="lb-topic-input-col">
              <label className="lb-input-label">Your interest or keyword</label>
              <input
                type="text"
                placeholder="e.g. climate policy, social media, AI ethics…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                className="lb-text-input"
              />
              <button
                type="button"
                onClick={generateTopic}
                disabled={loadingTopic}
                className="lb-ai-btn"
              >
                <span className="lb-ai-btn-shimmer" />
                <span className="lb-ai-btn-icon">⚡</span>
                {loadingTopic ? "Forging motion…" : "Generate with AI"}
              </button>
            </div>
            <div className="lb-topic-display">
              <div className="lb-topic-display-label">Motion</div>
              {topic
                ? <p className="lb-topic-display-text">"{topic}"</p>
                : <p className="lb-topic-display-empty">Your motion will appear here…</p>
              }
              <div className="lb-topic-display-orb" />
            </div>
          </div>
        </Step>

        {/* ── Step 3: Debate Type ── */}
        <Step>
          <h2 className="lb-step-title">Format</h2>
          <p className="lb-step-sub">Select the arena format — a duel or a full bench battle.</p>
          <div className="lb-format-grid">
            {["1v1", "3v3"].map((dt) => (
              <label key={dt} className={`lb-format-card ${debateType === dt ? "lb-format-card--active" : ""}`}>
                <input
                  type="radio"
                  name="debateType"
                  value={dt}
                  checked={debateType === dt}
                  onChange={(e) => setDebateType(e.target.value)}
                  required
                  className="lb-hidden-radio"
                />
                <div className="lb-format-arena">
                  {dt === "1v1" ? <ArenaOne /> : <ArenaThree />}
                </div>
                <div className="lb-format-meta">
                  <span className="lb-format-name">{dt}</span>
                  <span className="lb-format-desc">
                    {dt === "1v1" ? "Single speaker per side — pure 1-on-1 clash" : "Three speakers per side — full parliamentary bench"}
                  </span>
                </div>
                {debateType === dt && <div className="lb-format-selected-ring" />}
                <div className="lb-card-glow" />
              </label>
            ))}
          </div>
        </Step>

        {/* ── Step 4: Stance ── */}
        <Step>
          <h2 className="lb-step-title">Choose Your Side</h2>
          <p className="lb-step-sub">Every great debate needs two sides. Which do you stand for?</p>
          <div className="lb-stance-grid">

            {/* Proposition */}
            <label className={`lb-stance-card lb-stance-card--prop ${stance === "proposition" ? "lb-stance-card--active" : ""}`}>
              <input
                type="radio"
                name="stance"
                value="proposition"
                checked={stance === "proposition"}
                onChange={(e) => setStance(e.target.value)}
                required
                className="lb-hidden-radio"
              />
              <div className="lb-stance-emblem lb-stance-emblem--prop">
                <svg viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4"/>
                  <circle cx="40" cy="40" r="22" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
                  {/* Torch flame */}
                  <path d="M40 18C40 18 48 26 48 34C48 40.627 44.418 44 40 44C35.582 44 32 40.627 32 34C32 28 36 22 36 22C36 22 36 28 40 30C38 26 40 18 40 18Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5"/>
                  {/* Handle */}
                  <rect x="37" y="44" width="6" height="14" rx="2" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.2"/>
                  {/* Rays */}
                  {[0,45,90,135,180,225,270,315].map((deg, i) => (
                    <line key={i}
                      x1={40 + 26 * Math.cos(deg * Math.PI / 180)}
                      y1={40 + 26 * Math.sin(deg * Math.PI / 180)}
                      x2={40 + 32 * Math.cos(deg * Math.PI / 180)}
                      y2={40 + 32 * Math.sin(deg * Math.PI / 180)}
                      stroke="currentColor" strokeWidth="1.5" opacity="0.5"
                    />
                  ))}
                </svg>
              </div>
              <div className="lb-stance-content">
                <div className="lb-stance-name">Proposition</div>
                <div className="lb-stance-latin">Pro Motione</div>
                <p className="lb-stance-desc">You affirm the motion. Build the case, defend the claim, light the torch of change.</p>
                <ul className="lb-stance-traits">
                  <li>Opens the debate</li>
                  <li>Defines the motion</li>
                  <li>Carries the burden of proof</li>
                </ul>
              </div>
              {stance === "proposition" && <div className="lb-stance-selected">✦ YOUR SIDE</div>}
              <div className="lb-card-glow" />
            </label>

            {/* Opposition */}
            <label className={`lb-stance-card lb-stance-card--opp ${stance === "opposition" ? "lb-stance-card--active" : ""}`}>
              <input
                type="radio"
                name="stance"
                value="opposition"
                checked={stance === "opposition"}
                onChange={(e) => setStance(e.target.value)}
                required
                className="lb-hidden-radio"
              />
              <div className="lb-stance-emblem lb-stance-emblem--opp">
                <svg viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4"/>
                  <circle cx="40" cy="40" r="22" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
                  {/* Shield */}
                  <path d="M40 20L54 26V38C54 46.837 47.732 55.03 40 58C32.268 55.03 26 46.837 26 38V26L40 20Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M40 28L48 32V38C48 43.523 44.418 48.515 40 50C35.582 48.515 32 43.523 32 38V32L40 28Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1"/>
                  {/* Cross on shield */}
                  <line x1="40" y1="32" x2="40" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
                  <line x1="34" y1="38" x2="46" y2="38" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
                </svg>
              </div>
              <div className="lb-stance-content">
                <div className="lb-stance-name">Opposition</div>
                <div className="lb-stance-latin">Contra Motionem</div>
                <p className="lb-stance-desc">You challenge the motion. Dismantle arguments, raise the shield, guard against change.</p>
                <ul className="lb-stance-traits">
                  <li>Responds to proposition</li>
                  <li>Challenges definitions</li>
                  <li>Defends the status quo</li>
                </ul>
              </div>
              {stance === "opposition" && <div className="lb-stance-selected">✦ YOUR SIDE</div>}
              <div className="lb-card-glow" />
            </label>

          </div>
        </Step>

        {/* ── Step 5 (Conditional): Role ── */}
        {debateType === "3v3" && (
          <Step>
            <h2 className="lb-step-title">Your Role</h2>
            <p className="lb-step-sub">
              {stance === "proposition" ? "Proposition bench — pick your speaker slot." : "Opposition bench — pick your speaker slot."}
            </p>
            <div className="lb-role-grid">
              {getRoles().map((r) => {
                const rd = roleData[r];
                return (
                  <label
                    key={r}
                    className={`lb-role-card lb-role-card--${rd.color} ${userrole === r ? "lb-role-card--active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={userrole === r}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      className="lb-hidden-radio"
                    />
                    <div className="lb-role-abbr">{rd.abbr}</div>
                    <div className="lb-role-order">{rd.order}</div>
                    <div className="lb-role-label">{rd.label}</div>
                    <p className="lb-role-desc">{rd.desc}</p>
                    {/* Speaker podium visual */}
                    <div className="lb-role-podium">
                      <div className="lb-role-podium-figure" />
                      <div className="lb-role-podium-stand" />
                    </div>
                    {userrole === r && <div className="lb-role-selected">✦ SELECTED</div>}
                    <div className="lb-card-glow" />
                  </label>
                );
              })}
            </div>
          </Step>
        )}
      </Stepper>
    </div>
  );
}

export default List;