import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as AreaTooltip,
  ResponsiveContainer, PolarGrid, PolarAngleAxis, RadarChart, Radar, Legend, PieChart, Pie, Cell
} from 'recharts';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

var url = process.env.React_App_url;

const Debate = () => {
  const [data, setData] = useState([]);
  const [userData, setUserData] = useState(null);
  const email = localStorage.getItem("userEmail");
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      alert("User not logged in");
      navigate("/login");
      return;
    }

    axios.post(url + "/api/fetchEntries", { email })
      .then((res) => {
        const entriesObj = res.data.entries;
        const entriesArray = Object.entries(entriesObj).map(([topicKey, entryData]) => {
          const topic = topicKey.toLowerCase();
          let category = 'Other';
          if (topic.includes("climate") || topic.includes("pollution") || topic.includes("environment")) category = 'Environment';
          else if (topic.includes("education") || topic.includes("school") || topic.includes("university")) category = 'Education';
          else if (topic.includes("technology") || topic.includes("ai") || topic.includes("machine")) category = 'Technology';
          else if (topic.includes("economy") || topic.includes("poverty") || topic.includes("jobs")) category = 'Economics';
          else if (topic.includes("spiritual") || topic.includes("religion") || topic.includes("faith")) category = 'Spirituality';
          else if (topic.includes("social") || topic.includes("rights") || topic.includes("gender")) category = 'Social Issues';

          return {
            ...entryData,
            topicKey,
            topicCategory: category,
            topic: topicKey.replace(/_/g, ' ')
          };
        });

        setData(entriesArray);
        if (entriesArray.length === 0) return;

        let wins = 0;
        entriesArray.forEach(entry => {
          const stance = entry.stance?.toLowerCase();
          const winner = entry.winner?.toLowerCase() || entry.aiJudgeFeedback?.winner?.toLowerCase();
          if (stance && winner && stance === winner) wins++;
        });

        setUserData({
          name: res.data.displayName || 'User',
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          level: entriesArray[0].type || 'Beginner',
          totalDebates: entriesArray.length,
          winRate: Math.round((wins / entriesArray.length) * 100),
          currentStreak: 0
        });
      })
      .catch((err) => console.error("Error fetching entries:", err));
  }, [email, navigate]);

  const categoryColors = {
    Environment: '#34d399', Education: '#60a5fa', Technology: '#a78bfa',
    Economics: '#fbbf24', Spirituality: '#c084fc', 'Social Issues': '#f87171', Other: '#d1d5db'
  };

  const topicCounts = {};
  data.forEach((entry) => {
    const category = entry.topicCategory || 'Other';
    topicCounts[category] = (topicCounts[category] || 0) + 1;
  });
  const topicData = Object.entries(topicCounts).map(([name, value]) => ({
    name, value, color: categoryColors[name] || '#ccc'
  }));

  const performanceData = data.map((entry, index) => {
    const userRole = entry.userrole?.toLowerCase();
    const winner = entry.aiJudgeFeedback?.winner?.toLowerCase();
    const userStance = ['pm', 'dpm', 'gw'].includes(userRole) ? 'proposition' : 'opposition';
    const userWon = userStance === winner;
    return { name: `Debate ${index + 1}`, win: userWon ? 1 : 0, loss: userWon ? 0 : 1 };
  });

  const skills = ['logic', 'clarity', 'relevance', 'persuasiveness', 'depth', 'evidenceUsage', 'emotionalAppeal', 'rebuttalStrength', 'structure'];
  const roleFeedbacks = [];
  data.forEach(entry => {
    const role = entry.userrole?.toLowerCase();
    const side = entry.stance?.toLowerCase();
    const fb = entry?.[side]?.[role]?.aifeedback;
    if (fb) roleFeedbacks.push(fb);
  });
  const skillAverages = skills.map(skill => {
    const values = roleFeedbacks.map(fb => fb[skill] || 0);
    const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;
    return { subject: skill.charAt(0).toUpperCase() + skill.slice(1), A: parseFloat(avg), fullMark: 10 };
  });

  if (!userData) {
    return (
      <div className="loading-screen">
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          .loading-screen {
            min-height: 100vh;
            background: linear-gradient(160deg,#0a0014,#0f0025,#080010);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 16px;
          }
        `}</style>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(168,85,247,0.2)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <div style={{ color: 'rgba(168,85,247,0.6)', fontFamily: 'serif', letterSpacing: 3, fontSize: 12, animation: 'pulse 1.5s infinite' }}>LOADING</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap');

        /* ── Animations ── */
        @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes cardIn    { from{opacity:0;transform:translateY(28px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(18px,-22px)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-14px,18px)} }
        @keyframes avatarRing { 0%,100%{opacity:.7} 50%{opacity:1} }

        /* ── Override dashboard bg ── */
        .debate-dashboard {
          background: transparent !important;
          position: relative;
        }
        .main-content {
          background: linear-gradient(160deg,#0a0014 0%,#0f0025 55%,#080010 100%) !important;
          min-height: 100vh;
        }

        /* ── Header card ── */
        .dashboard-header {
          background: rgba(255,255,255,0.03) !important;
          border: 1px solid rgba(168,85,247,0.18) !important;
          border-radius: 22px !important;
          box-shadow: 0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(168,85,247,0.08) !important;
          backdrop-filter: blur(12px) !important;
          animation: fadeUp 0.5s ease both !important;
        }

        /* ── User name shimmer ── */
        .user-name {
          background: linear-gradient(90deg,#a855f7,#e879f9,#818cf8,#a855f7) !important;
          background-size: 200% auto !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          animation: shimmer 3s linear infinite !important;
          font-family: 'Cinzel', serif !important;
        }

        /* ── Avatar glow ring ── */
        .avatar-container img {
          border: 3px solid transparent !important;
          background: linear-gradient(#0a0014,#0a0014) padding-box,
                      linear-gradient(135deg,#a855f7,#6366f1,#e879f9) border-box !important;
          animation: avatarRing 3s infinite ease-in-out !important;
        }

        /* ── Level badge ── */
        .level-badge {
          background: linear-gradient(135deg,#7c3aed,#a855f7) !important;
          box-shadow: 0 0 14px rgba(168,85,247,0.5) !important;
          font-family: 'Cinzel', serif !important;
          letter-spacing: 1px !important;
        }

        /* ── Stat numbers ── */
        .stat-number {
          background: linear-gradient(135deg,#c084fc,#818cf8) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          font-family: 'Cinzel', serif !important;
        }

        /* ── Chart cards ── */
        .chart-container {
          background: rgba(255,255,255,0.03) !important;
          border: 1px solid rgba(168,85,247,0.12) !important;
          border-radius: 20px !important;
          box-shadow: 0 6px 28px rgba(0,0,0,0.35) !important;
          transition: transform 0.25s ease, box-shadow 0.25s ease !important;
          animation: cardIn 0.5s ease both !important;
        }
        .chart-container:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 18px 50px rgba(0,0,0,0.5), 0 0 28px rgba(168,85,247,0.15) !important;
        }
        .chart-container:nth-child(1) { animation-delay: 0.1s !important; }
        .chart-container:nth-child(2) { animation-delay: 0.18s !important; }
        .chart-container:nth-child(3) { animation-delay: 0.26s !important; }
        .chart-container:nth-child(4) { animation-delay: 0.34s !important; }

        /* ── Chart titles ── */
        .chart-title {
          color: rgba(168,85,247,0.8) !important;
          font-family: 'Cinzel', serif !important;
          letter-spacing: 2px !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
        }

        /* ── Start debate button ── */
        .start-debate-btn {
          background: linear-gradient(135deg,#7c3aed,#a855f7) !important;
          border: none !important;
          box-shadow: 0 6px 24px rgba(124,58,237,0.45) !important;
          font-family: 'Cinzel', serif !important;
          letter-spacing: 1px !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .start-debate-btn:hover {
          transform: translateY(-2px) scale(1.04) !important;
          box-shadow: 0 14px 38px rgba(124,58,237,0.6) !important;
        }

        /* ── Activity items ── */
        .activity-item {
          border-radius: 12px !important;
          transition: all 0.2s ease !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
        }
        .activity-item:hover {
          background: rgba(168,85,247,0.08) !important;
          border-color: rgba(168,85,247,0.2) !important;
          transform: translateX(4px) !important;
        }
        .activity-icon.win  { background: rgba(74,222,128,0.15) !important; border: 1px solid rgba(74,222,128,0.35) !important; color: #4ade80 !important; border-radius: 10px !important; }
        .activity-icon.loss { background: rgba(248,113,113,0.15) !important; border: 1px solid rgba(248,113,113,0.35) !important; color: #f87171 !important; border-radius: 10px !important; }

        /* ── Legend dots ── */
        .legend-color {
          border-radius: 50% !important;
          box-shadow: 0 0 5px currentColor !important;
        }
        .legend-item { transition: opacity 0.2s; }
        .legend-item:hover { opacity: 0.8; }

        /* ── Quick stats items ── */
        .stat-item {
          background: rgba(168,85,247,0.07) !important;
          border: 1px solid rgba(168,85,247,0.15) !important;
          border-radius: 14px !important;
          padding: 10px 16px !important;
          transition: all 0.2s !important;
        }
        .stat-item:hover {
          background: rgba(168,85,247,0.14) !important;
          border-color: rgba(168,85,247,0.35) !important;
        }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '5%', left: '8%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.16) 0%,transparent 70%)', animation: 'orbFloat1 9s infinite ease-in-out' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', animation: 'orbFloat2 11s infinite ease-in-out' }} />
      </div>

      <div className="main-content" style={{ marginLeft: 0, width: '100%', minHeight: '100vh', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}>
        <div className="debate-dashboard">
          <div className="dashboard-header">
            <div className="user-profile">
              <div className="avatar-container">
                <img src={userData.avatar} alt="User Avatar" className="user-avatar" />
                <div className="level-badge">{userData.level}</div>
              </div>
              <div className="user-info">
                <h1 className="user-name">{userData.name}</h1>
                <div className="quick-stats">
                  <div className="stat-item">
                    <span className="stat-number">{userData.totalDebates}</span>
                    <span className="stat-label">Total Debates</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{userData.winRate}%</span>
                    <span className="stat-label">Win Rate</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{userData.currentStreak}</span>
                    <span className="stat-label">Current Streak</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="start-debate-btn" onClick={() => navigate("/list")}>⚡ Start New Debate</button>
          </div>

          <div className="stats-grid">
            <div className="chart-container">
              <h3 className="chart-title">Win/Loss Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="winGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(168,85,247,0.6)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(168,85,247,0.6)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <AreaTooltip contentStyle={{ background: 'rgba(15,0,37,0.95)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, color: '#e8e0ff' }} />
                  <Area type="monotone" dataKey="win" stackId="1" stroke="#10b981" strokeWidth={2} fill="url(#winGrad)" />
                  <Area type="monotone" dataKey="loss" stackId="1" stroke="#ef4444" strokeWidth={2} fill="url(#lossGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Debate Topics by Category</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={topicData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                    {topicData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="legend">
                {topicData.map((item, index) => (
                  <div key={index} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Skill Scores</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart outerRadius={90} data={skillAverages}>
                  <PolarGrid stroke="rgba(168,85,247,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(168,85,247,0.7)', fontSize: 10 }} />
                  <Radar name="User" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.35} strokeWidth={2} />
                  <Legend wrapperStyle={{ color: 'rgba(200,180,255,0.6)', fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container activity-feed">
              <h3 className="chart-title">Recent Activity</h3>
              <div className="activity-list">
                {data.slice(0, 4).map((entry, idx) => (
                  <div className="activity-item" key={idx}>
                    <div className={`activity-icon ${entry.aiJudgeFeedback?.winner === "User" ? 'win' : 'loss'}`}>
                      {entry.aiJudgeFeedback?.winner === "User" ? 'W' : 'L'}
                    </div>
                    <div className="activity-details">
                      <span className="activity-title">
                        {entry.aiJudgeFeedback?.winner === "User" ? 'Won' : 'Lost'} debate on "{entry.topic}"
                      </span>
                      <span className="activity-time">Just now</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Debate;