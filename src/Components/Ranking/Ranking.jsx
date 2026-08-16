import React, { useEffect, useState } from "react";
import axios from "axios";

var url = process.env.React_App_url;

const MEDALS = {
  0: { emoji:"👑", color:"#FFD700", glow:"0 0 28px rgba(255,215,0,0.55)", bg:"linear-gradient(135deg,#3d2e00,#5a4200)", pulse:"goldPulse", shimmer:"shimmer-gold", label:"GOLD" },
  1: { emoji:"🥈", color:"#C0C0C0", glow:"0 0 22px rgba(192,192,192,0.45)", bg:"linear-gradient(135deg,#1e1e1e,#2e2e2e)", pulse:"silverPulse", shimmer:"shimmer-silver", label:"SILVER" },
  2: { emoji:"🥉", color:"#CD7F32", glow:"0 0 22px rgba(205,127,50,0.45)", bg:"linear-gradient(135deg,#2d1a00,#3d2500)", pulse:"bronzePulse", shimmer:"shimmer-bronze", label:"BRONZE" },
};

const Ranking = () => {
  const [rankings, setRankings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    axios.get(url + "/api/rankings")
      .then(res => { setRankings(res.data.top10 || []); setCurrentUser(res.data.currentUser || null); })
      .catch(err => setError(err.response?.data?.error || "Failed to fetch rankings"));
  }, []);

  const getPodiumOrder = (users) => {
    if (users.length === 0) return [];
    if (users.length === 1) return [users[0]];
    if (users.length === 2) return [users[1], users[0]];
    return [users[1], users[0], users[2]];
  };

  return (
    <div style={{ minHeight:"100vh", width:"100%", background:"linear-gradient(160deg,#0a0014 0%,#0f0025 55%,#080010 100%)", fontFamily:"'Inter',sans-serif", boxSizing:"border-box" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes goldPulse { 0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.35),0 8px 30px rgba(0,0,0,0.5)} 50%{box-shadow:0 0 44px rgba(255,215,0,0.65),0 0 70px rgba(255,215,0,0.2),0 8px 30px rgba(0,0,0,0.5)} }
        @keyframes silverPulse { 0%,100%{box-shadow:0 0 16px rgba(192,192,192,0.25),0 8px 30px rgba(0,0,0,0.5)} 50%{box-shadow:0 0 32px rgba(192,192,192,0.55),0 8px 30px rgba(0,0,0,0.5)} }
        @keyframes bronzePulse { 0%,100%{box-shadow:0 0 16px rgba(205,127,50,0.25),0 8px 30px rgba(0,0,0,0.5)} 50%{box-shadow:0 0 32px rgba(205,127,50,0.55),0 8px 30px rgba(0,0,0,0.5)} }
        @keyframes crownBob { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-7px) rotate(3deg)} }
        @keyframes orb1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(18px,-22px)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-14px,18px)} }
        .shimmer-gold { background:linear-gradient(90deg,#FFD700,#FFF8DC,#FFA500,#FFD700); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite; }
        .shimmer-silver { background:linear-gradient(90deg,#888,#fff,#bbb,#888); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite; }
        .shimmer-bronze { background:linear-gradient(90deg,#CD7F32,#FFB347,#8B4513,#CD7F32); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite; }
        .rank-row { transition: transform 0.2s ease, background 0.2s ease; border-radius:14px; }
        .rank-row:hover { transform:translateX(5px); background:rgba(168,85,247,0.1) !important; }
        @media(max-width:600px){
          .podium-wrap { gap:10px !important; }
          .podium-card { padding:16px 12px !important; }
          .podium-emoji { font-size:32px !important; }
          .podium-name { font-size:13px !important; }
          .podium-stat { font-size:14px !important; }
        }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
        <div style={{ position:"absolute", top:"5%", left:"8%", width:"min(400px,60vw)", height:"min(400px,60vw)", borderRadius:"50%", background:"radial-gradient(circle,rgba(168,85,247,0.18) 0%,transparent 70%)", animation:"orb1 8s infinite ease-in-out" }} />
        <div style={{ position:"absolute", bottom:"8%", right:"5%", width:"min(280px,45vw)", height:"min(280px,45vw)", borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.14) 0%,transparent 70%)", animation:"orb2 10s infinite ease-in-out" }} />
      </div>

      <div style={{ position:"relative", zIndex:1, maxWidth:860, margin:"0 auto", padding:"clamp(24px,5vw,48px) clamp(14px,4vw,24px) 100px" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"clamp(32px,5vw,52px)", animation:"fadeUp 0.5s ease" }}>
          <div style={{ fontSize:10, letterSpacing:6, color:"rgba(168,85,247,0.65)", fontFamily:"'Cinzel',serif", marginBottom:10 }}>GLOBAL LEADERBOARD</div>
          <h1 style={{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:"clamp(26px,6vw,54px)", margin:0, background:"linear-gradient(90deg,#a855f7,#e879f9,#818cf8,#a855f7)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"shimmer 3s linear infinite" }}>
            RANKINGS
          </h1>
          <div style={{ width:50, height:3, background:"linear-gradient(90deg,#a855f7,#6366f1)", borderRadius:99, margin:"14px auto 0", boxShadow:"0 0 10px rgba(168,85,247,0.5)" }} />
        </div>

        {error && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:14, padding:"14px 20px", marginBottom:24, color:"#fca5a5", textAlign:"center", fontSize:14 }}>{error}</div>}

        {rankings.length === 0 && !error && (
          <div style={{ textAlign:"center", color:"rgba(168,85,247,0.4)", fontSize:16, fontFamily:"'Cinzel',serif", letterSpacing:2, marginTop:80 }}>No rankings available yet.</div>
        )}

        {rankings.length >= 1 && (
          <>
            {/* PODIUM */}
            <div className="podium-wrap" style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:"clamp(8px,2vw,20px)", marginBottom:"clamp(32px,5vw,52px)", animation:"fadeUp 0.6s ease 0.1s both" }}>
              {getPodiumOrder(rankings.slice(0, 3)).map((user) => {
                const i = rankings.findIndex(u => u.email === user.email);
                const m = MEDALS[i];
                const isMe = user.email === currentUser?.email;
                const baseH = [130, 100, 80][i];

                return (
                  <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", flex: i===0 ? "0 0 clamp(140px,30vw,210px)" : "0 0 clamp(120px,24vw,175px)" }}>
                    {/* Card */}
                    <div className="podium-card" style={{ width:"100%", background:m.bg, border:`2px solid ${m.color}40`, borderRadius:20, padding:"clamp(16px,3vw,26px) clamp(12px,2vw,18px)", textAlign:"center", position:"relative", animation:`${m.pulse} 2.5s infinite ease-in-out` }}>
                      {isMe && <div style={{ position:"absolute", top:-9, right:-9, background:"linear-gradient(135deg,#a855f7,#6366f1)", color:"#fff", fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:99, fontFamily:"'Cinzel',serif", letterSpacing:1 }}>YOU</div>}
                      <div className="podium-emoji" style={{ fontSize: i===0 ? "clamp(36px,7vw,52px)" : "clamp(28px,5vw,40px)", display:"inline-block", animation: i===0 ? "crownBob 2.5s infinite ease-in-out" : "none" }}>{m.emoji}</div>
                      <div className={`podium-name ${m.shimmer}`} style={{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:`clamp(12px,2vw,${i===0?20:16}px)`, marginTop:8, display:"block" }}>{user.displayName}</div>
                      <div style={{ fontSize:9, color:m.color, fontFamily:"'Cinzel',serif", letterSpacing:2, opacity:0.75, marginTop:3 }}>{m.label}</div>
                      <div style={{ marginTop:12, display:"flex", gap:10, justifyContent:"center" }}>
                        <div style={{ textAlign:"center" }}>
                          <div className="podium-stat" style={{ fontSize:`clamp(14px,3vw,${i===0?20:16}px)`, fontWeight:700, color:"#fff" }}>{user.wins}</div>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.45)", letterSpacing:1, textTransform:"uppercase" }}>Wins</div>
                        </div>
                        <div style={{ width:1, background:"rgba(255,255,255,0.1)" }} />
                        <div style={{ textAlign:"center" }}>
                          <div className="podium-stat" style={{ fontSize:`clamp(14px,3vw,${i===0?20:16}px)`, fontWeight:700, color:m.color }}>{user.winRate}%</div>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.45)", letterSpacing:1, textTransform:"uppercase" }}>Rate</div>
                        </div>
                      </div>
                    </div>
                    {/* Podium base */}
                    <div style={{ width:"100%", height:`clamp(${baseH*0.6}px,${baseH*0.15}vw,${baseH}px)`, minHeight:50, background:`linear-gradient(180deg,${m.color}1a,${m.color}06)`, border:`1px solid ${m.color}25`, borderTop:"none", borderRadius:"0 0 14px 14px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:"clamp(18px,4vw,26px)", color:`${m.color}55` }}>#{i+1}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RANKS 4-10 */}
            {rankings.length > 3 && (
              <div style={{ animation:"fadeUp 0.6s ease 0.2s both" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <span style={{ fontSize:18 }}>🔥</span>
                  <span style={{ fontFamily:"'Cinzel',serif", fontSize:13, letterSpacing:3, color:"rgba(168,85,247,0.8)", textTransform:"uppercase" }}>Other Contenders</span>
                  <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(168,85,247,0.28),transparent)" }} />
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {rankings.slice(3).map((user, i) => {
                    const rank = i + 4;
                    const isMe = user.email === currentUser?.email;
                    return (
                      <div key={rank} className="rank-row"
                        onMouseEnter={() => setHoveredRow(rank)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"clamp(12px,2vw,16px) clamp(14px,2vw,22px)", background: isMe ? "linear-gradient(135deg,rgba(168,85,247,0.14),rgba(99,102,241,0.08))" : "rgba(255,255,255,0.025)", border: isMe ? "1px solid rgba(168,85,247,0.35)" : "1px solid rgba(255,255,255,0.05)", animation:`fadeUp 0.4s ease ${i*45}ms both` }}
                      >
                        <div style={{ display:"flex", alignItems:"center", gap:14, minWidth:0 }}>
                          <div style={{ width:34, height:34, borderRadius:11, background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:13, color:"rgba(168,85,247,0.75)", flexShrink:0 }}>{rank}</div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontWeight:600, fontSize:"clamp(13px,2vw,15px)", color: isMe?"#c084fc":"#e8e0ff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                              {user.displayName}
                              {isMe && <span style={{ marginLeft:7, fontSize:9, background:"rgba(168,85,247,0.18)", color:"#c084fc", padding:"2px 7px", borderRadius:99, fontFamily:"'Cinzel',serif", letterSpacing:1 }}>YOU</span>}
                            </div>
                            <div style={{ fontSize:11, color:"rgba(168,85,247,0.45)", marginTop:2 }}>{user.wins} wins</div>
                          </div>
                        </div>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"clamp(15px,3vw,18px)", color: user.winRate>=70?"#FFD700":user.winRate>=50?"#C0C0C0":"#c084fc", flexShrink:0, marginLeft:12 }}>
                          {user.winRate}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current user outside top 10 */}
            {currentUser && currentUser.rank > 10 && (
              <div style={{ marginTop:28, animation:"fadeUp 0.5s ease" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ fontFamily:"'Cinzel',serif", fontSize:11, letterSpacing:3, color:"rgba(168,85,247,0.6)", textTransform:"uppercase" }}>Your Position</span>
                  <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(168,85,247,0.2),transparent)" }} />
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px clamp(14px,3vw,24px)", borderRadius:18, background:"linear-gradient(135deg,rgba(168,85,247,0.11),rgba(99,102,241,0.07))", border:"1px solid rgba(168,85,247,0.3)", boxShadow:"0 0 28px rgba(168,85,247,0.12)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14, minWidth:0 }}>
                    <div style={{ width:40, height:40, borderRadius:13, background:"linear-gradient(135deg,#a855f7,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:14, color:"#fff", boxShadow:"0 0 14px rgba(168,85,247,0.45)", flexShrink:0 }}>{currentUser.rank}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:"#c084fc" }}>{currentUser.displayName}</div>
                      <div style={{ fontSize:11, color:"rgba(168,85,247,0.45)", marginTop:2 }}>{currentUser.wins} wins</div>
                    </div>
                  </div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:20, color:"#a855f7", flexShrink:0 }}>{currentUser.winRate}%</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Ranking;