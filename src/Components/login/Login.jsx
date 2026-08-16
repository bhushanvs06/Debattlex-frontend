import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { auth, googleProvider } from '../../config/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, PhoneAuthProvider, linkWithCredential, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

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


/* ════════════════════════════════════════════════
   LOGIN PAGE  — zero logic changes below this line
════════════════════════════════════════════════ */
const LoginPage = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode]                 = useState('google'); // 'google' | 'phone' | 'otp'
  const [firebaseUser, setFirebaseUser]         = useState(null);
  const [phoneNumber, setPhoneNumber]           = useState('');
  const [countryCode, setCountryCode]           = useState('+91');
  const [otpCode, setOtpCode]                   = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const [otpCountdown, setOtpCountdown]         = useState(0);
  const [loading, setLoading]                   = useState(false);
  const [errorMsg, setErrorMsg]                 = useState('');
  const [successMsg, setSuccessMsg]             = useState('');

  // const url = 'https://debattlex.onrender.com'
  var url = process.env.React_App_url;
  console.log(url);

  const navigate = useNavigate();

  // ReCAPTCHA cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (authMode === 'otp' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [authMode, otpCountdown]);

  /* visual-only states */
  useEffect(() => { injectKeyframes(); }, []);
  const [btnHov, setBtnHov] = useState(false);

  // Check if Firebase is configured
  const isFirebaseConfigured = !!process.env.REACT_APP_FIREBASE_API_KEY;

  // Handle redirect result on mount
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setLoading(true);
          const user = result.user;
          const response = await axios.post(`${url}/api/check-google-user`, { email: user.email });
          
          if (response.data.exists) {
            localStorage.setItem("userEmail", user.email);
            if (response.data.token) {
              localStorage.setItem("token", response.data.token);
            }
            onLoginSuccess(response.data.user || { email: user.email, displayName: user.displayName });
            navigate('/overview');
          } else {
            setFirebaseUser(user);
            setAuthMode('phone');
          }
        }
      } catch (err) {
        console.error("Google Redirect result error:", err);
        setErrorMsg(err.message || "Failed to complete Google sign-in redirect");
      } finally {
        setLoading(false);
      }
    };
    handleRedirect();
  }, [navigate, onLoginSuccess, url]);

  /* ── Google Sign-in Handler ── */
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in database
      const response = await axios.post(`${url}/api/check-google-user`, { email: user.email });
      
      if (response.data.exists) {
        // User exists: Login directly
        localStorage.setItem("userEmail", user.email);
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        onLoginSuccess(response.data.user || { email: user.email, displayName: user.displayName });
        navigate('/overview');
      } else {
        // New User: Prompt for phone verification
        setFirebaseUser(user);
        setAuthMode('phone');
        setLoading(false);
      }
    } catch (err) {
      console.warn("Google Popup Sign-in failed, trying redirect fallback:", err);
      // Fallback to redirect if popup is blocked or environment restricts it
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/operation-not-supported-in-this-environment' ||
        err.code === 'auth/request-had-invalid-authentication-credentials'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          console.error("Google Redirect Sign-In error:", redirectErr);
          setErrorMsg(redirectErr.message || "Failed to initiate redirect sign-in");
          setLoading(false);
        }
      } else {
        setErrorMsg(err.message || "Failed to sign in with Google");
        setLoading(false);
      }
    }
  };

  /* ── Send Phone OTP Handler ── */
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMsg("Please enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const fullPhoneNumber = countryCode + phoneNumber.replace(/\D/g, '');

    try {
      // Always clear any previous verifier to avoid stale state
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (_) {}
        window.recaptchaVerifier = null;
      }

      // Use 'normal' (visible) reCAPTCHA — renders inline in DOM, no popup/iframe needed.
      // This completely avoids Cross-Origin-Opener-Policy blocking issues.
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: async (recaptchaToken) => {
          // reCAPTCHA solved — now send the OTP
          try {
            const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
            setConfirmationResult(confirmation);
            setAuthMode('otp');
            setOtpCountdown(60);
            setSuccessMsg(`OTP code sent to ${fullPhoneNumber}`);
          } catch (smsErr) {
            console.error("Error sending OTP after reCAPTCHA:", smsErr);
            let friendlyMessage = smsErr.message || "Failed to send OTP. Please try again.";
            if (smsErr.code === 'auth/billing-not-enabled' || smsErr.message?.includes('BILLING_NOT_ENABLED')) {
              friendlyMessage = "Firebase SMS billing is not enabled. For free local testing, add a Test Phone Number in Firebase Console → Authentication → Sign-in method → Phone.";
            }
            setErrorMsg(friendlyMessage);
            if (window.recaptchaVerifier) {
              try { window.recaptchaVerifier.clear(); } catch (_) {}
              window.recaptchaVerifier = null;
            }
          } finally {
            setLoading(false);
          }
        },
        'expired-callback': () => {
          setErrorMsg("reCAPTCHA expired. Please try again.");
          setLoading(false);
          if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch (_) {}
            window.recaptchaVerifier = null;
          }
        }
      });

      // Render the widget into #recaptcha-container — user will see and solve it
      await window.recaptchaVerifier.render();
      // Loading stays true until the callback above resolves
    } catch (err) {
      console.error("Error initializing reCAPTCHA:", err);
      let friendlyMessage = err.message || "Failed to start verification. Please try again.";
      if (err.code === 'auth/billing-not-enabled' || err.message?.includes('BILLING_NOT_ENABLED')) {
        friendlyMessage = "Firebase SMS billing is not enabled. For free local testing, add a Test Phone Number in Firebase Console → Authentication → Sign-in method → Phone.";
      } else if (err.code === 'auth/missing-client-identifier' || err.code === 'auth/app-not-authorized') {
        friendlyMessage = "Domain not authorized. Add localhost:3000 to Authorized Domains in Firebase Console → Authentication → Settings.";
      }
      setErrorMsg(friendlyMessage);
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (_) {}
        window.recaptchaVerifier = null;
      }
      setLoading(false);
    }
  };

  /* ── Verify Phone OTP & Complete Signup ── */
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg("Please enter the 6-digit verification code");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Verify and link phone number to Google user
      const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otpCode);
      await linkWithCredential(firebaseUser, credential);

      // 2. Retrieve verified idToken
      const idToken = await firebaseUser.getIdToken(true);

      // 3. Register user on backend
      const res = await axios.post(`${url}/api/signup-google`, { idToken });

      if (res.data.user) {
        localStorage.setItem("userEmail", res.data.user.email);
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }
        onLoginSuccess(res.data.user);
        navigate('/list');
      } else {
        setErrorMsg("Failed to register. Please try again.");
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      setErrorMsg(err.response?.data?.error || err.message || "Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    await handleSendOtp();
  };

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
                  {authMode === 'google' ? 'Secure Login' : authMode === 'phone' ? 'Phone Verification' : 'Verify OTP'}
                </span>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div style={{
                  color: '#ff6b6b',
                  fontSize: 13,
                  background: 'rgba(255, 107, 107, 0.12)',
                  border: '1px solid rgba(255, 107, 107, 0.25)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  marginBottom: 20,
                  textAlign: 'center',
                  lineHeight: '1.4'
                }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Success messages */}
              {successMsg && (
                <div style={{
                  color: '#3ee86f',
                  fontSize: 13,
                  background: 'rgba(62, 232, 111, 0.12)',
                  border: '1px solid rgba(62, 232, 111, 0.25)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  marginBottom: 20,
                  textAlign: 'center'
                }}>
                  ✅ {successMsg}
                </div>
              )}

              {/* Main Content Area */}
              {!isFirebaseConfigured ? (
                /* ── MISSING CONFIG WARNING ── */
                <div style={{ color: '#ff6b6b', padding: '10px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>⚠️</div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', color: '#fff', marginBottom: 8, fontSize: 16 }}>Firebase Config Required</h3>
                  <p style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5, marginBottom: 15 }}>
                    Please add your Firebase keys to the frontend <code>.env</code> file:
                  </p>
                  <div style={{
                    background: 'rgba(0,0,0,0.4)',
                    padding: '10px 14px',
                    borderRadius: 10,
                    textAlign: 'left',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: '#bc6cff',
                    lineHeight: '1.6',
                    overflowX: 'auto',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    REACT_APP_FIREBASE_API_KEY=...<br />
                    REACT_APP_FIREBASE_AUTH_DOMAIN=...<br />
                    REACT_APP_FIREBASE_PROJECT_ID=...
                  </div>
                  <p style={{ fontSize: 11, color: '#666', marginTop: 15 }}>
                    Restart the React dev server after saving changes.
                  </p>
                </div>
              ) : authMode === 'google' ? (
                /* ── STEP 1: GOOGLE SIGN-IN ── */
                <div>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    onMouseEnter={() => setBtnHov(true)}
                    onMouseLeave={() => setBtnHov(false)}
                    style={{
                      width: '100%',
                      padding: '15px 16px',
                      background: btnHov
                        ? 'linear-gradient(135deg, #4285F4, #357ae8)'
                        : 'rgba(255,255,255,0.06)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 15,
                      fontFamily: 'Inter, sans-serif',
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginBottom: 20,
                      boxShadow: btnHov
                        ? '0 8px 32px rgba(66, 133, 244, 0.35)'
                        : '0 4px 20px rgba(0,0,0,0.15)',
                      transform: btnHov && !loading ? 'translateY(-2px)' : 'none',
                      transition: 'all .3s cubic-bezier(.23,1,.32,1)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {loading ? 'Processing...' : 'Sign in with Google'}
                    </span>
                  </button>
                  <p style={{ fontSize: 13, color: '#999', lineHeight: 1.6, margin: '0 auto', maxWidth: '340px' }}>
                    Sign in with Google to continue. New accounts will require a phone OTP verification step.
                  </p>
                </div>
              ) : authMode === 'phone' ? (
                /* ── STEP 2: PHONE INPUT ── */
                <div>
                  <p style={{ fontSize: 13, color: '#aaa', marginBottom: 20, lineHeight: '1.5' }}>
                    A phone verification code will be sent to secure your new account.
                  </p>
                  
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      style={{
                        padding: '13px 14px',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        fontSize: 15,
                        fontFamily: 'Inter, sans-serif',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="+91" style={{ background: '#0e0026' }}>🇮🇳 +91</option>
                      <option value="+1" style={{ background: '#0e0026' }}>🇺🇸 +1</option>
                      <option value="+44" style={{ background: '#0e0026' }}>🇬🇧 +44</option>
                      <option value="+61" style={{ background: '#0e0026' }}>🇦🇺 +61</option>
                      <option value="+971" style={{ background: '#0e0026' }}>🇦🇪 +971</option>
                    </select>
                    
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      style={{
                        flex: 1,
                        padding: '13px 18px',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.03)',
                        color: '#fff',
                        fontSize: 15,
                        fontFamily: 'Inter, sans-serif',
                        outline: 'none',
                        caretColor: '#bc6cff',
                        boxShadow: 'none',
                        transition: 'border-color .3s, background .3s'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    onMouseEnter={() => setBtnHov(true)}
                    onMouseLeave={() => setBtnHov(false)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: btnHov
                        ? 'linear-gradient(135deg, #bc6cff, #7b2cbf)'
                        : 'linear-gradient(135deg, #9d4edd, #5a189a)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 15,
                      fontFamily: 'Inter, sans-serif',
                      borderRadius: 14,
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginBottom: 18,
                      boxShadow: btnHov
                        ? '0 8px 32px rgba(188,108,255,.5)'
                        : '0 4px 20px rgba(157,78,221,.35)',
                      transform: btnHov && !loading ? 'translateY(-2px)' : 'none',
                      transition: 'all .3s ease'
                    }}
                  >
                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                  </button>

                  <button
                    onClick={() => { setAuthMode('google'); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#76a9fa',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* ── STEP 3: OTP VERIFICATION ── */
                <div>
                  <p style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>
                    Please enter the 6-digit code sent to your phone number.
                  </p>

                  <div style={{ marginBottom: 20 }}>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="••••••"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      style={{
                        width: '100%',
                        padding: '14px 10px',
                        textAlign: 'center',
                        letterSpacing: otpCode ? '8px' : '4px',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        borderRadius: 14,
                        border: '1px solid #bc6cff',
                        background: 'rgba(188,108,255,0.07)',
                        color: '#fff',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    onMouseEnter={() => setBtnHov(true)}
                    onMouseLeave={() => setBtnHov(false)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: btnHov
                        ? 'linear-gradient(135deg, #bc6cff, #7b2cbf)'
                        : 'linear-gradient(135deg, #9d4edd, #5a189a)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 15,
                      fontFamily: 'Inter, sans-serif',
                      borderRadius: 14,
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginBottom: 18,
                      boxShadow: btnHov
                        ? '0 8px 32px rgba(188,108,255,.5)'
                        : '0 4px 20px rgba(157,78,221,.35)',
                      transform: btnHov && !loading ? 'translateY(-2px)' : 'none',
                      transition: 'all .3s ease'
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Verify & Create Account'}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '0 4px' }}>
                    <button
                      onClick={() => { setAuthMode('phone'); setErrorMsg(''); setSuccessMsg(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#aaa',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0
                      }}
                    >
                      Change Number
                    </button>

                    <button
                      onClick={handleResendOtp}
                      disabled={otpCountdown > 0 || loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: otpCountdown > 0 ? '#555' : '#76a9fa',
                        cursor: otpCountdown > 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        textDecoration: otpCountdown > 0 ? 'none' : 'underline',
                        padding: 0
                      }}
                    >
                      {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
              )}

              {/* reCAPTCHA Container — visible widget renders here inline (no popup) */}
              <div id="recaptcha-container" style={{ margin: '12px auto', display: 'flex', justifyContent: 'center' }}></div>

              {/* bottom accent */}
              <div style={{
                marginTop: 28, height: 2, borderRadius: 999,
                background: 'linear-gradient(90deg, transparent, rgba(188,108,255,.5), transparent)',
              }} />
              <div style={{
                marginTop: 10, fontSize: 10, letterSpacing: '.25em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)', fontWeight: 600,
              }}>Train Your Voice. Build Your Power.</div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;