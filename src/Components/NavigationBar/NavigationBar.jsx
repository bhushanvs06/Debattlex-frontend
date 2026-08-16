import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './nav.css'
const NAV_ITEMS = [
  {
    label: 'Overview',
    path: '/overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Playground',
    path: '/overview/playground',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <polygon points="5,3 19,12 5,21" />
      </svg>
    ),
  },
  {
    label: 'Ranking',
    path: '/overview/ranking',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
      </svg>
    ),
  },
  {
    label: 'Mentor',
    path: '/overview/mentor',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M22 10L12 5 2 10l10 5 10-5z" />
        <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    path: '/overview/profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: 'Feedback',
    path: '/overview/feedbackpage',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Hangout',
    path: '/overview/hangout',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const LOGOUT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const SIDEBAR_COLLAPSED_WIDTH = 64;
export const SIDEBAR_EXPANDED_WIDTH = 220;

const NavigationBar = ({ onWidthChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [voicePlan, setVoicePlan] = useState(() => localStorage.getItem('voicePlan') || 'Pro');

  const toggleVoicePlan = () => {
    const newVal = voicePlan === 'Pro' ? 'Lite' : 'Pro';
    setVoicePlan(newVal);
    localStorage.setItem('voicePlan', newVal);
    // Dispatch synthetic storage event so same-tab listeners (debate views) sync immediately
    window.dispatchEvent(new StorageEvent('storage', { key: 'voicePlan', newValue: newVal }));
  };

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (onWidthChange) {
      onWidthChange(isMobile ? 0 : collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed, isMobile]);

  const activeNav = NAV_ITEMS.find(
    item => location.pathname.toLowerCase() === item.path.toLowerCase()
  )?.label || 'Overview';

  const handleNav = (item) => navigate(item.path);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  /* ─────────────── MOBILE BOTTOM NAV ─────────────── */
  if (isMobile) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap');
          @keyframes tabPop { 0%{transform:translateY(0) scale(1)} 40%{transform:translateY(-6px) scale(1.18)} 100%{transform:translateY(0) scale(1)} }
          @keyframes tabGlow { 0%,100%{filter:drop-shadow(0 0 4px rgba(168,85,247,.5))} 50%{filter:drop-shadow(0 0 12px rgba(168,85,247,1))} }
          @keyframes bottomIn { from{transform:translateY(100%)} to{transform:translateY(0)} }
          .mob-tab { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; padding:10px 0 8px; background:none; border:none; cursor:pointer; color:rgba(180,150,255,.55); transition:color .2s; position:relative; gap:4px; }
          .mob-tab.active { color:#c084fc; }
          .mob-tab.active .mob-icon { animation: tabPop .4s ease, tabGlow 2s infinite .4s; }
          .mob-tab:active .mob-icon { animation: tabPop .3s ease; }
          .mob-active-pip { position:absolute; top:6px; left:50%; transform:translateX(-50%); width:20px; height:3px; border-radius:99px; background:linear-gradient(90deg,#a855f7,#6366f1); box-shadow:0 0 8px #a855f799; }
        `}</style>

        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'stretch',
          background: 'linear-gradient(180deg, rgba(15,0,35,.95) 0%, rgba(10,0,25,.98) 100%)',
          borderTop: '1px solid rgba(168,85,247,.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 1000,
          animation: 'bottomIn .35s cubic-bezier(.34,1.56,.64,1)',
          boxShadow: '0 -8px 32px rgba(0,0,0,.5)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeNav === item.label;
            return (
              <button key={item.label} className={`mob-tab${isActive ? ' active' : ''}`} onClick={() => handleNav(item)}>
                {isActive && <div className="mob-active-pip" />}
                <span className="mob-icon">{item.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: isActive ? 700 : 500, letterSpacing: '.3px' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
          <button className="mob-tab" onClick={toggleVoicePlan}>
            <span className="mob-icon" style={{
              color: voicePlan === 'Pro' ? '#c084fc' : '#fbbf24',
              filter: voicePlan === 'Pro' ? 'drop-shadow(0 0 3px rgba(168,85,247,.6))' : 'drop-shadow(0 0 3px rgba(251,191,36,.6))'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: voicePlan === 'Pro' ? '#c084fc' : '#fbbf24', textTransform: 'uppercase' }}>
              {voicePlan} Voice
            </span>
          </button>
          <button className="mob-tab" onClick={handleLogout}>
            <span className="mob-icon" style={{ color: 'rgba(239,150,150,.7)' }}>{LOGOUT_ICON}</span>
            <span style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(239,150,150,.7)' }}>Logout</span>
          </button>
        </nav>
      </>
    );
  }

  /* ─────────────── DESKTOP SIDEBAR ─────────────── */
  const w = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;500;600&display=swap');
        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1);opacity:.3} 50%{transform:translate(10px,-16px) scale(1.2);opacity:.5} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1);opacity:.2} 50%{transform:translate(-8px,14px) scale(1.1);opacity:.4} }
        @keyframes shimmerLogo { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes activeGlow { 0%,100%{box-shadow:0 0 10px rgba(168,85,247,.4),inset 0 0 10px rgba(168,85,247,.1)} 50%{box-shadow:0 0 22px rgba(168,85,247,.7),inset 0 0 18px rgba(168,85,247,.2)} }
        @keyframes iconPop { 0%,100%{transform:scale(1)} 40%{transform:scale(1.22)} }
        @keyframes tooltipSlide { from{opacity:0;transform:translateY(-50%) translateX(-6px)} to{opacity:1;transform:translateY(-50%) translateX(0)} }
        @keyframes staggerIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes logoutPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.3)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
        @keyframes sidebarIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes divPulse { 0%,100%{opacity:.15} 50%{opacity:.45} }

        .nb-item { position:relative; display:flex; align-items:center; width:100%; border:none; border-radius:12px; background:transparent; color:rgba(190,160,255,.6); font-family:'Inter',sans-serif; font-size:14px; font-weight:500; cursor:pointer; overflow:hidden; transition:color .2s, background .2s, transform .15s; }
        .nb-item:hover { color:#fff; background:rgba(168,85,247,.12); transform:translateX(2px); }
        .nb-item:hover .nb-icon-wrap { animation:iconPop .35s ease; }
        .nb-item.active { color:#fff; background:linear-gradient(135deg, rgba(168,85,247,.25), rgba(99,102,241,.18)); animation:activeGlow 2.5s infinite ease-in-out; }
        .nb-item.active .nb-icon-wrap { animation:iconPop .4s ease; color:#c084fc; filter:drop-shadow(0 0 5px rgba(192,132,252,.8)); }
        .nb-active-line { position:absolute; left:0; top:50%; transform:translateY(-50%); width:3px; height:55%; border-radius:0 3px 3px 0; background:linear-gradient(180deg,#a855f7,#6366f1); box-shadow:0 0 8px #a855f799; }
        .nb-tooltip { position:absolute; left:calc(100% + 12px); top:50%; transform:translateY(-50%); background:rgba(18,0,40,.97); border:1px solid rgba(168,85,247,.3); color:#fff; padding:6px 12px; border-radius:9px; font-size:12px; font-weight:600; white-space:nowrap; pointer-events:none; z-index:9999; animation:tooltipSlide .18s ease; box-shadow:0 6px 20px rgba(0,0,0,.5); }
        .nb-tooltip::before { content:''; position:absolute; right:100%; top:50%; transform:translateY(-50%); border:5px solid transparent; border-right-color:rgba(168,85,247,.3); }
        .nb-logout { position:relative; overflow:hidden; width:100%; border:1px solid rgba(239,68,68,.25); border-radius:12px; background:rgba(239,68,68,.07); color:rgba(255,140,140,.8); font-family:'Inter',sans-serif; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
        .nb-logout:hover { background:rgba(239,68,68,.18); color:#fff; border-color:rgba(239,68,68,.5); animation:logoutPulse 1s infinite; transform:translateY(-1px); }
        .nb-chevron { background:rgba(168,85,247,.1); border:1px solid rgba(168,85,247,.2); border-radius:8px; color:rgba(190,160,255,.6); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; flex-shrink:0; }
        .nb-chevron:hover { background:rgba(168,85,247,.22); color:#fff; }
      `}</style>

      <aside style={{
        width: w,
        minWidth: w,
        maxWidth: w,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0e0022 0%, #130035 55%, #0a0018 100%)',
        borderRight: '1px solid rgba(168,85,247,.1)',
        overflow: 'visible',
        position: 'relative',
        transition: 'width .3s cubic-bezier(.4,0,.2,1), min-width .3s cubic-bezier(.4,0,.2,1), max-width .3s cubic-bezier(.4,0,.2,1)',
        animation: 'sidebarIn .4s ease',
        zIndex: 100,
        flexShrink: 0,
      }}>
        {/* Ambient orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
          <div style={{ position: 'absolute', top: '8%', left: '15%', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,.3) 0%, transparent 70%)', animation: 'orb1 7s infinite ease-in-out' }} />
          <div style={{ position: 'absolute', bottom: '25%', right: '5%', width: 70, height: 70, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,.25) 0%, transparent 70%)', animation: 'orb2 9s infinite ease-in-out' }} />
        </div>

        {/* HEADER */}
        <div style={{ padding: collapsed ? '20px 0 16px' : '22px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          {collapsed ? (
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "#0f0f13",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 18px rgba(147,51,234,0.45)",
                border: "1px solid rgba(168,85,247,0.25)",
                cursor: "pointer",
                transition: "all 0.25s ease"
              }}
              onClick={() => setCollapsed(false)}
            >
              <img
                src="/logo.png"
                alt="Debattlex"
                style={{
                  width: "75%",
                  height: "75%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 8px rgba(168,85,247,0.7))"
                }}
              />
            </div>
          ) : (
            <>
              <div>
                <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 18, background: 'linear-gradient(90deg,#a855f7 0%,#e879f9 40%,#818cf8 70%,#a855f7 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmerLogo 3s linear infinite', letterSpacing: '1px' }}>
                  DEBATTLEX
                </div>
                <div style={{ fontSize: 9, color: 'rgba(168,85,247,.55)', letterSpacing: '3px', marginTop: 1, fontFamily: "'Cinzel',serif" }}>ARENA</div>
              </div>
              <button className="nb-chevron" style={{ width: 28, height: 28 }} onClick={() => setCollapsed(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ margin: collapsed ? '0 10px 12px' : '0 14px 12px', height: 1, background: 'linear-gradient(90deg,transparent,rgba(168,85,247,.35),transparent)', animation: 'divPulse 3s infinite', flexShrink: 0 }} />

        {/* NAV */}
        <nav style={{ flex: 1, padding: collapsed ? '0 8px' : '0 10px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', overflowX: 'visible', position: 'relative', zIndex: 1 }}>
          {NAV_ITEMS.map((item, idx) => {
            const isActive = activeNav === item.label;
            return (
              <button
                key={item.label}
                className={`nb-item${isActive ? ' active' : ''}`}
                style={{ padding: collapsed ? '12px 0' : '11px 12px', justifyContent: collapsed ? 'center' : 'flex-start', gap: 11, animation: `staggerIn .35s ease ${idx * 55}ms both` }}
                onClick={() => handleNav(item)}
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {isActive && <div className="nb-active-line" />}
                <span className="nb-icon-wrap" style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {collapsed && isActive && (
                  <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 16, height: 3, borderRadius: 99, background: 'linear-gradient(90deg,#a855f7,#6366f1)', boxShadow: '0 0 6px #a855f7' }} />
                )}
                {collapsed && hoveredItem === item.label && <div className="nb-tooltip">{item.label}</div>}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ margin: collapsed ? '12px 10px 10px' : '12px 14px 10px', height: 1, background: 'linear-gradient(90deg,transparent,rgba(168,85,247,.25),transparent)', animation: 'divPulse 3s infinite 1s', flexShrink: 0 }} />

        {/* VOICE PLAN TOGGLE */}
        <div style={{ padding: collapsed ? '0 8px' : '0 10px', marginBottom: 8, flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <button
            onClick={toggleVoicePlan}
            className="nb-item"
            style={{
              padding: collapsed ? '12px 0' : '11px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 11,
              border: '1px dashed rgba(168,85,247,.25)',
              background: 'rgba(168,85,247,.03)'
            }}
            onMouseEnter={() => setHoveredItem('voiceplan')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span style={{
              flexShrink: 0,
              display: 'flex',
              color: voicePlan === 'Pro' ? '#c084fc' : '#fbbf24',
              filter: voicePlan === 'Pro' ? 'drop-shadow(0 0 4px rgba(168,85,247,.7))' : 'drop-shadow(0 0 4px rgba(251,191,36,.7))'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </span>
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Voice Plan</span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: voicePlan === 'Pro' ? 'rgba(168,85,247,0.25)' : 'rgba(251,191,36,0.25)',
                  color: voicePlan === 'Pro' ? '#c084fc' : '#fbbf24',
                  border: voicePlan === 'Pro' ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(251,191,36,0.4)',
                  letterSpacing: '1px'
                }}>
                  {voicePlan.toUpperCase()}
                </span>
              </div>
            )}
            {collapsed && hoveredItem === 'voiceplan' && (
              <div className="nb-tooltip">Voice: {voicePlan}</div>
            )}
          </button>
        </div>

        {/* Divider */}
        <div style={{ margin: collapsed ? '0 10px 10px' : '0 14px 10px', height: 1, background: 'linear-gradient(90deg,transparent,rgba(168,85,247,.25),transparent)', animation: 'divPulse 3s infinite 1s', flexShrink: 0 }} />

        {/* LOGOUT */}
        <div style={{ padding: collapsed ? '0 8px 20px' : '0 10px 20px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <button
            className="nb-logout"
            style={{ gap: collapsed ? 0 : 9, padding: collapsed ? '11px 0' : '11px 14px', justifyContent: 'center' }}
            onClick={handleLogout}
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {LOGOUT_ICON}
            {!collapsed && <span>Logout</span>}
            {collapsed && hoveredItem === 'logout' && <div className="nb-tooltip">Logout</div>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default NavigationBar;