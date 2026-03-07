import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

/* ─── tiny style injector (keyframes only) ─── */
const injectKeyframes = () => {
  if (document.getElementById('dbx-kf')) return;
  const s = document.createElement('style');
  s.id = 'dbx-kf';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;500;600;700&display=swap');
    @keyframes dbxSpin    { to { transform: rotate(360deg);  } }
    @keyframes dbxSpinR   { to { transform: rotate(-360deg); } }
    @keyframes dbxShimmer { to { background-position: 200% center; } }
    @keyframes dbxCardIn  { from { opacity:0; transform:translateY(40px) scale(.95); } to { opacity:1; transform:none; } }
    @keyframes dbxPulse   { 0%,100%{ transform:scale(1); opacity:.7; } 50%{ transform:scale(1.12); opacity:1; } }
    @keyframes dbxFloat   { 0%,100%{ transform:translate(-50%,-50%) scale(1);   }
                             50%   { transform:translate(-50%,-50%) scale(1.08); } }
    @keyframes dbxBlink   { 0%,100%{ opacity:1; } 50%{ opacity:.15; } }
    @keyframes dbxSlide   { from{ opacity:0; transform:translateY(-10px); } to{ opacity:1; transform:none; } }
    @keyframes dbxGlow    { 0%,100%{ opacity:.25; } 50%{ opacity:.5; } }
    @keyframes dbxOrbit   { to { transform: rotate(360deg) translateX(110px) rotate(-360deg); } }
    @keyframes dbxSweep   { 0%{ transform:translateX(-150%); } 100%{ transform:translateX(150%); } }
    @keyframes dbxBorderFlow {
      0%   { background-position: 0%   50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0%   50%; }
    }
  `;
  document.head.appendChild(s);
};

/* ─── Particle canvas behind the card ─── */
const ParticleCanvas = () => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext('2d');
    let W, H, particles = [], raf;

    const resize = () => {
      W = c.width  = c.offsetWidth;
      H = c.height = c.offsetHeight;
    };

    const init = () => {
      resize();
      particles = Array.from({ length: 55 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.4 + .3,
        vx: (Math.random() - .5) * .25,
        vy: (Math.random() - .5) * .25,
        o: Math.random() * .5 + .15,
        tw: Math.random() * Math.PI * 2,
        ts: Math.random() * .012 + .004,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.tw += p.ts;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const o = p.o * (.5 + .5 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(188,108,255,${o})`;
        ctx.fill();
      });

      // draw faint connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(157,78,221,${.12 * (1 - dist/80)})`;
            ctx.lineWidth = .6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    init(); draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      borderRadius: '27px', zIndex: 0, pointerEvents: 'none',
    }} />
  );
};

/* ─── Spinning hex logo ─── */
const HexLogo = () => (
  <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 20px' }}>
    {[
      { size: 72, color: '#bc6cff', dur: '5s',  anim: 'dbxSpin'  },
      { size: 54, color: '#9d4edd', dur: '3.5s', anim: 'dbxSpinR' },
      { size: 36, color: '#7b2cbf', dur: '2.5s', anim: 'dbxSpin'  },
    ].map((r, i) => (
      <div key={i} style={{
        position: 'absolute', top: '50%', left: '50%',
        width: r.size, height: r.size,
        marginTop: -r.size / 2, marginLeft: -r.size / 2,
        border: `2px solid ${r.color}`,
        clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
        animation: `${r.anim} ${r.dur} linear infinite`,
        boxShadow: `0 0 14px ${r.color}60`,
      }} />
    ))}
    {/* center core */}
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      width: 18, height: 18, marginTop: -9, marginLeft: -9,
      background: 'linear-gradient(135deg, #bc6cff, #5a189a)',
      clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
      animation: 'dbxPulse 2s ease-in-out infinite',
    }} />
  </div>
);

/* ─── Orbiting dot decorations ─── */
const OrbitDots = () => (
  <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, zIndex: 0, pointerEvents: 'none' }}>
    {[
      { color: '#bc6cff', delay: '0s',   dur: '8s'  },
      { color: '#9d4edd', delay: '-3s',  dur: '12s' },
      { color: '#7b2cbf', delay: '-6s',  dur: '10s' },
    ].map((d, i) => (
      <div key={i} style={{
        position: 'absolute', top: 0, left: 0,
        width: 6, height: 6, borderRadius: '50%',
        background: d.color,
        boxShadow: `0 0 8px ${d.color}`,
        animation: `dbxOrbit ${d.dur} linear ${d.delay} infinite`,
        transformOrigin: '0 0',
      }} />
    ))}
  </div>
);

/* ─── Styled input (focus state only, no logic change) ─── */
const Field = ({ type, placeholder, value, onChange, name, focused, setFocused }) => (
  <div style={{ position: 'relative', marginBottom: 14 }}>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(name)}
      onBlur={() => setFocused('')}
      style={{
        width: '100%', padding: '13px 18px',
        borderRadius: 14,
        border: `1px solid ${focused === name ? '#bc6cff' : 'rgba(255,255,255,0.08)'}`,
        background: focused === name ? 'rgba(188,108,255,0.07)' : 'rgba(255,255,255,0.03)',
        color: '#fff', fontSize: 15,
        fontFamily: 'Inter, sans-serif',
        outline: 'none', caretColor: '#bc6cff',
        boxShadow: focused === name
          ? '0 0 0 3px rgba(188,108,255,0.15), 0 4px 20px rgba(188,108,255,0.1)'
          : 'none',
        transition: 'border-color .3s, box-shadow .3s, background .3s',
      }}
    />
    {/* animated bottom line */}
    <div style={{
      position: 'absolute', bottom: 0, left: '50%',
      transform: 'translateX(-50%)',
      height: 2, borderRadius: 999,
      width: focused === name ? '70%' : '0%',
      background: 'linear-gradient(90deg, transparent, #bc6cff, transparent)',
      transition: 'width .4s cubic-bezier(.23,1,.32,1)',
    }} />
  </div>
);

/* ════════════════════════════════════════════════
   LOGIN PAGE  — zero logic changes below this line
════════════════════════════════════════════════ */
const LoginPage = ({ onLoginSuccess }) => {
  const [mode, setMode]               = useState('login');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage]         = useState('');

  // const url = 'https://debattlex.onrender.com'
  var url = process.env.React_App_url;
  console.log(url);

  const navigate = useNavigate();

  /* ── original handleSubmit — untouched ── */
  const handleSubmit = async () => {
    const endpoint = mode === 'signup' ? '/api/signup' : '/api/login';
    const fullURL  = `${url}${endpoint}`;
    const payload  = mode === 'signup'
      ? { email, password, displayName }
      : { email, password };

    try {
      const res = await axios.post(fullURL, payload);
      console.log((url, `${endpoint} hiiii`));
      setMessage(res.data.message);

      if (res.data.user) {
        localStorage.setItem("userEmail", res.data.user.email);
        if (res.data.token) localStorage.setItem("token", res.data.token);
        onLoginSuccess(res.data.user);
        if (mode === 'signup') navigate('/list');
      } else {
        onLoginSuccess({ email });
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  /* visual-only states */
  useEffect(() => { injectKeyframes(); }, []);
  const [btnHov, setBtnHov]       = useState(false);
  const [switchHov, setSwitchHov] = useState(false);
  const [focused, setFocused]     = useState('');

  return (
    <div className="login-page" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif',
      background: `
        radial-gradient(ellipse at 15% 15%, rgba(90,24,154,.45) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 85%, rgba(188,108,255,.2) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 0%,  rgba(60,9,108,.35)  0%, transparent 60%),
        linear-gradient(135deg, #07020f 0%, #0d001a 100%)
      `,
      overflow: 'hidden', position: 'relative',
    }}>

      {/* large ambient blobs */}
      {[
        { top:'10%', left:'10%', size:'500px', color:'rgba(90,24,154,.25)',  delay:'0s'  },
        { top:'80%', left:'80%', size:'400px', color:'rgba(188,108,255,.15)', delay:'2s' },
        { top:'70%', left:'5%',  size:'300px', color:'rgba(60,9,108,.3)',    delay:'1s'  },
      ].map((b, i) => (
        <div key={i} style={{
          position: 'fixed', top: b.top, left: b.left,
          width: b.size, height: b.size, borderRadius: '50%',
          background: `radial-gradient(circle, ${b.color}, transparent 70%)`,
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none', zIndex: 0,
          animation: `dbxGlow 4s ease-in-out ${b.delay} infinite`,
        }} />
      ))}

      {/* card container with orbiting dots */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 430,
        animation: 'dbxCardIn .75s cubic-bezier(.23,1,.32,1) both',
      }}>
        <OrbitDots />

        {/* glowing animated border */}
        <div style={{
          borderRadius: 30, padding: 2,
          background: 'linear-gradient(135deg, rgba(188,108,255,.7), rgba(90,24,154,.4), rgba(188,108,255,.7))',
          backgroundSize: '200% 200%',
          animation: 'dbxBorderFlow 3s ease infinite',
          boxShadow: '0 0 80px rgba(123,44,191,.35), 0 24px 80px rgba(0,0,0,.7)',
        }}>

          {/* inner card */}
          <div style={{
            borderRadius: 29, padding: '44px 38px',
            background: 'linear-gradient(160deg, rgba(14,0,38,.98), rgba(7,2,15,1))',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            textAlign: 'center', color: '#e0e0e0',
            position: 'relative', overflow: 'hidden',
          }}>

            <ParticleCanvas />

            {/* content above canvas */}
            <div style={{ position: 'relative', zIndex: 1 }}>

              <HexLogo />

              {/* brand title */}
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: '1.6rem', letterSpacing: '-.02em', marginBottom: 6,
                background: 'linear-gradient(135deg, #f0d0ff, #bc6cff, #9d4edd)',
                backgroundSize: '200%',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'dbxShimmer 2.5s linear infinite',
              }}>DEBATTLEX</div>

              {/* live badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 999, marginBottom: 24,
                border: '1px solid rgba(188,108,255,.25)',
                background: 'rgba(188,108,255,.07)',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#bc6cff',
                  animation: 'dbxBlink 1.5s ease-in-out infinite',
                }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.35em', textTransform: 'uppercase', color: '#d49eff' }}>
                  {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
                </span>
              </div>

              {/* mode tab switcher — replaces plain h2 */}
              <div style={{
                display: 'flex', background: 'rgba(255,255,255,.04)',
                borderRadius: 14, padding: 4, marginBottom: 28,
                border: '1px solid rgba(255,255,255,.06)',
              }}>
                {['login', 'signup'].map(m => (
                  <div key={m}
                    onClick={() => { setMode(m); setMessage(''); }}
                    style={{
                      flex: 1, textAlign: 'center', padding: '10px 0',
                      borderRadius: 11, cursor: 'pointer',
                      fontSize: 13, fontWeight: 700,
                      fontFamily: 'Inter, sans-serif',
                      background: mode === m
                        ? 'linear-gradient(135deg,#9d4edd,#5a189a)' : 'transparent',
                      color: mode === m ? '#fff' : 'rgba(255,255,255,.3)',
                      boxShadow: mode === m ? '0 4px 16px rgba(157,78,221,.35)' : 'none',
                      transition: 'all .35s cubic-bezier(.23,1,.32,1)',
                    }}>
                    {m === 'login' ? '🔑 Login' : '✨ Sign Up'}
                  </div>
                ))}
              </div>

              {/* ── ORIGINAL INPUTS — same value/onChange ── */}
              {mode === 'signup' && (
                <Field type="text" placeholder="Full Name" value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  name="name" focused={focused} setFocused={setFocused} />
              )}

              <Field type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)}
                name="email" focused={focused} setFocused={setFocused} />

              <Field type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)}
                name="password" focused={focused} setFocused={setFocused} />

              {/* ── ORIGINAL BUTTON — same onClick={handleSubmit}, same text ── */}
              <button
                onClick={handleSubmit}
                onMouseEnter={() => setBtnHov(true)}
                onMouseLeave={() => setBtnHov(false)}
                style={{
                  width: '100%', padding: '14px',
                  background: btnHov
                    ? 'linear-gradient(135deg, #bc6cff, #7b2cbf)'
                    : 'linear-gradient(135deg, #9d4edd, #5a189a)',
                  color: 'white', fontWeight: 'bold', fontSize: 16,
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: 14, border: 'none', cursor: 'pointer',
                  marginBottom: 15,
                  boxShadow: btnHov
                    ? '0 8px 32px rgba(188,108,255,.5)'
                    : '0 4px 20px rgba(157,78,221,.35)',
                  transform: btnHov ? 'translateY(-2px)' : 'none',
                  transition: 'background .3s, box-shadow .3s, transform .2s',
                  position: 'relative', overflow: 'hidden',
                }}>
                {/* shimmer sweep on hover */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)',
                  animation: btnHov ? 'dbxSweep .6s ease' : 'none',
                  pointerEvents: 'none',
                }} />
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {mode === 'signup' ? 'Create Account' : 'Login'}
                </span>
              </button>

              {/* ── ORIGINAL MESSAGE — same #3ee86f ── */}
              <p style={{
                color: '#3ee86f', margin: '10px 0', fontSize: 13,
                minHeight: 20,
                animation: message ? 'dbxSlide .3s ease' : 'none',
              }}>{message}</p>

              {/* ── ORIGINAL TOGGLE — same onClick ── */}
              <p style={{ fontSize: 14, color: '#aaa' }}>
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                  onMouseEnter={() => setSwitchHov(true)}
                  onMouseLeave={() => setSwitchHov(false)}
                  style={{
                    background: 'none', border: 'none',
                    color: switchHov ? '#bc6cff' : '#76a9fa',
                    cursor: 'pointer', fontWeight: 'bold',
                    textDecoration: 'underline', padding: 0,
                    transition: 'color .2s',
                  }}>
                  {mode === 'signup' ? 'Login' : 'Sign Up'}
                </button>
              </p>

              {/* bottom accent */}
              <div style={{
                marginTop: 28, height: 2, borderRadius: 999,
                background: 'linear-gradient(90deg, transparent, rgba(188,108,255,.5), transparent)',
              }} />
              <div style={{
                marginTop: 10, fontSize: 10, letterSpacing: '.25em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,.15)', fontWeight: 600,
              }}>Train Your Voice. Build Your Power.</div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;