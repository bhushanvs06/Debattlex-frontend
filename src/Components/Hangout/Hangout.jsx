import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const url = "dddeyksxjhwh4.cloudfront.net/video-call/"; 
const socket = io(url, { autoConnect: false });

function addRipple(e) {
  const btn = e.currentTarget;
  const span = document.createElement("span");
  const d = Math.max(btn.clientWidth, btn.clientHeight);
  const r = btn.getBoundingClientRect();
  Object.assign(span.style, {
    position:"absolute", borderRadius:"50%", pointerEvents:"none",
    width:d+"px", height:d+"px",
    left:(e.clientX-r.left-d/2)+"px", top:(e.clientY-r.top-d/2)+"px",
    background:"rgba(192,132,252,0.35)",
    transform:"scale(0)", opacity:"1",
    transition:"transform 0.5s ease, opacity 0.5s ease",
  });
  btn.appendChild(span);
  requestAnimationFrame(() => { span.style.transform="scale(4)"; span.style.opacity="0"; });
  setTimeout(() => span.remove(), 600);
}

function getInitials(str) {
  if (!str) return "?";
  const clean = str.split("@")[0];
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0]+parts[1][0]).toUpperCase();
  return clean.slice(0,2).toUpperCase();
}

function useRotate(speed = 1) {
  const [deg, setDeg] = useState(0);
  const raf = useRef(null);
  const prev = useRef(null);
  useEffect(() => {
    const tick = (ts) => {
      if (prev.current !== null) setDeg(d => (d + (ts - prev.current) * 0.06 * speed) % 360);
      prev.current = ts;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [speed]);
  return deg;
}

function useBreath() {
  const [s, setS] = useState(1);
  const raf = useRef(null);
  useEffect(() => {
    const tick = (ts) => { setS(1 + Math.sin(ts / 800) * 0.04); raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  return s;
}

function useFloat() {
  const [y, setY] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const tick = (ts) => { setY(Math.sin(ts / 900) * 8); raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  return y;
}

function useFadeUp() {
  const [o, setO] = useState(0);
  const [y, setY] = useState(18);
  useEffect(() => {
    const t1 = setTimeout(() => setO(1), 10);
    const t2 = setTimeout(() => setY(0), 10);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return { opacity: o, transform: `translateY(${y}px)`, transition: "opacity 0.5s ease, transform 0.5s ease" };
}

function useTravelDot() {
  const [x, setX] = useState(-12);
  const [op, setOp] = useState(0);
  useEffect(() => {
    let start = null;
    const dur = 1400;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = ((ts - start) % dur) / dur;
      setX(p * 180 - 12);
      setOp(p < 0.08 ? p / 0.08 : p > 0.92 ? (1 - p) / 0.08 : 1);
      requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  return { x, op };
}

function Btn({ base, hov, act, onClick, title, children }) {
  const [h, setH] = useState(false);
  const [a, setA] = useState(false);
  const s = { ...base, ...(h ? hov : {}), ...(a ? act : {}), position:"relative", overflow:"hidden", outline:"none", cursor:"pointer" };
  return (
    <button title={title} style={s}
      onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => { setH(false); setA(false); }}
      onMouseDown={() => setA(true)} onMouseUp={() => setA(false)}>
      {children}
    </button>
  );
}

function SpinRing({ size, inset, colors, speed = 1, children }) {
  const deg = useRotate(speed);
  return (
    <div style={{ position:"relative", width:size, height:size, isolation:"isolate" }}>
      <div style={{ position:"absolute", inset:-inset, borderRadius:"50%", background:`conic-gradient(from ${deg}deg, ${colors})`, zIndex:0 }} />
      <div style={{ position:"absolute", inset:inset+2, borderRadius:"50%", background:"#130030", zIndex:1 }} />
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2 }}>
        {children}
      </div>
    </div>
  );
}

const CamOnIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.276L20 10V14l-4.553 2.276L15 14V10z"/><rect x="1" y="5" width="14" height="14" rx="2"/></svg>;
const CamOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.276L20 10V14l-4.553 2.276L15 14V10z"/><rect x="1" y="5" width="14" height="14" rx="2"/><line x1="2" y1="2" x2="22" y2="22" stroke="#c084fc" strokeWidth="2.5"/></svg>;
const MicOnIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const MicOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/><line x1="2" y1="2" x2="22" y2="22" stroke="#c084fc" strokeWidth="2.5"/></svg>;
const HangupIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.13 12.7 19.79 19.79 0 012.06 4.11 2 2 0 014.05 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
const SearchIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const UsersIcon  = () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;

function BounceD({ color }) {
  const [sc, setSc] = useState(0.35);
  useEffect(() => {
    const id = setInterval(() => setSc(0.35 + Math.abs(Math.sin(Date.now()/300)) * 0.65), 50);
    return () => clearInterval(id);
  }, []);
  return <span style={{ width:8, height:8, borderRadius:"50%", background:color, transform:`scale(${sc})`, display:"inline-block", transition:"transform 0.05s" }} />;
}

export default function Hangout() {
  const [status, setStatus]           = useState("idle");
  const [micOn,  setMicOn]            = useState(true);
  const [camOn,  setCamOn]            = useState(true);
  const [remoteCamOn, setRemoteCamOn] = useState(true);
  const [peerId, setPeerId]           = useState(null);
  const [error,  setError]            = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [searching, setSearching]     = useState(false);

  const navigate       = useNavigate();
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef          = useRef(null);
  const streamRef      = useRef(null);
  const videoTrackRef  = useRef(null);
  const timerRef       = useRef(null);

  const userEmail    = typeof localStorage !== "undefined" ? (localStorage.getItem("userEmail") || "You") : "You";
  const userInitials = getInitials(userEmail);

  const isIdle      = status === "idle" && !searching;
  const isMatching  = status === "waiting" || status === "connecting";
  const isConnected = status === "connected";

  const orbDeg = useRotate(1);
  const breath = useBreath();
  const floatY = useFloat();
  const fadeUp = useFadeUp();
  const { x: dotX, op: dotOp } = useTravelDot();

  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isConnected]);

  useEffect(() => () => { cleanup(); socket.disconnect(); }, []);

  const fmt = s => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  const initMedia = async () => {
    setError(null); setSearching(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:{ echoCancellation:true, noiseSuppression:true } });
      streamRef.current     = stream;
      videoTrackRef.current = stream.getVideoTracks()[0] ?? null;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      socket.connect();
      socket.on("waiting", () => setStatus("waiting"));
      socket.on("peer-matched", ({ peerId: mid, role }) => {
        setPeerId(mid); setStatus("connecting");
        const pc = new RTCPeerConnection({ iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}] });
        pcRef.current = pc;
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        pc.ontrack = ev => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = ev.streams[0];
            remoteVideoRef.current.play().catch(console.error);
            ev.streams[0].getVideoTracks().forEach(t => {
              t.onmute   = () => setRemoteCamOn(false);
              t.onunmute = () => setRemoteCamOn(true);
              t.addEventListener("ended", () => setRemoteCamOn(false));
            });
          }
        };
        pc.onicecandidate = ev => ev.candidate && socket.emit("ice-candidate",{ to:mid, candidate:ev.candidate });
        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState==="connected"||pc.iceConnectionState==="completed") setStatus("connected");
          if (pc.iceConnectionState==="failed"||pc.iceConnectionState==="disconnected") handleHangup();
        };
        if (role==="caller") pc.createOffer().then(o=>pc.setLocalDescription(o)).then(()=>socket.emit("offer",{to:mid,offer:pc.localDescription}));
      });
      socket.on("offer", ({ from, offer }) =>
        pcRef.current.setRemoteDescription(offer).then(()=>pcRef.current.createAnswer()).then(a=>pcRef.current.setLocalDescription(a)).then(()=>socket.emit("answer",{to:from,answer:pcRef.current.localDescription}))
      );
      socket.on("answer",        ({ answer })    => pcRef.current?.setRemoteDescription(answer));
      socket.on("ice-candidate", ({ candidate }) => pcRef.current?.addIceCandidate(candidate));
      socket.on("hangup", handleHangup);
      socket.emit("join-queue");
    } catch (err) {
      setError(err.name+": "+err.message); setSearching(false); setStatus("idle");
    }
  };

  const toggleCam = useCallback((e) => {
    addRipple(e);
    const track = videoTrackRef.current;
    if (!track) return;
    const next = !camOn;
    track.enabled = next;
    setCamOn(next);
    if (next && localVideoRef.current && streamRef.current) {
      if (localVideoRef.current.srcObject !== streamRef.current)
        localVideoRef.current.srcObject = streamRef.current;
      localVideoRef.current.play().catch(()=>{});
    }
  }, [camOn]);

  const toggleMic = useCallback((e) => {
    addRipple(e);
    const t = streamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !micOn; setMicOn(v => !v); }
  }, [micOn]);

  const handleHangup = useCallback(() => {
    cleanup(); if (peerId) socket.emit("hangup",{to:peerId});
    setStatus("idle"); setSearching(false); setPeerId(null); navigate("/overview/hangout");
  }, [peerId, navigate]);

  const handleCancel = useCallback(() => {
    cleanup(); socket.disconnect();
    setStatus("idle"); setSearching(false); setPeerId(null); setError(null);
  }, []);

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close(); pcRef.current = null;
    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const C = {
    bg:"#0a0014", card:"rgba(18,0,38,0.92)", surface:"#1a0035",
    border:"rgba(139,92,246,0.3)", purple:"#7c3aed", violet:"#8b5cf6",
    pink:"#c084fc", fuchsia:"#e879f9", green:"#34d399", red:"#f87171",
    txt:"#ede9fe", txt2:"#a78bfa",
  };

  const ctrlBase = (off) => ({
    width:52, height:52, borderRadius:"50%", border:"none",
    background: off ? "rgba(192,132,252,0.15)" : "rgba(139,92,246,0.1)",
    outline: off ? "1.5px solid rgba(192,132,252,0.4)" : `1.5px solid ${C.border}`,
    color: off ? C.pink : C.txt,
    display:"flex", alignItems:"center", justifyContent:"center",
    flexShrink:0, transition:"all 0.2s ease",
  });

  return (
    <div style={{ width:"100%", height:"100vh", overflow:"hidden", background:C.bg, position:"relative", fontFamily:"'Inter','Google Sans','Segoe UI',sans-serif", WebkitFontSmoothing:"antialiased" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>

      {/* Mesh background */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:`radial-gradient(ellipse 70% 55% at 15% 15%,rgba(124,58,237,0.18) 0%,transparent 60%),radial-gradient(ellipse 55% 45% at 85% 85%,rgba(232,121,249,0.12) 0%,transparent 60%),radial-gradient(ellipse 40% 35% at 50% 50%,rgba(139,92,246,0.07) 0%,transparent 70%)` }} />

      <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", zIndex:1 }}>

        {/* ══ IDLE ══ */}
        {isIdle && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"clamp(28px,5vw,52px) clamp(24px,5vw,60px)", position:"relative", ...fadeUp, maxWidth:480, width:"92%" }}>
            <div style={{ position:"absolute", inset:0, borderRadius:32, background:C.card, border:`1px solid ${C.border}`, backdropFilter:"blur(28px)", zIndex:-1, boxShadow:"0 25px 80px rgba(0,0,0,0.8),inset 0 1px 0 rgba(139,92,246,0.1),0 0 40px rgba(124,58,237,0.3)" }} />

            {/* Spinning orb */}
            <div style={{ position:"relative", width:120, height:120, marginBottom:32 }}>
              <div style={{ position:"absolute", inset:-3, borderRadius:"50%", background:`conic-gradient(from ${orbDeg}deg,#7c3aed,#c084fc,#e879f9,#8b5cf6,#7c3aed)` }} />
              <div style={{ position:"absolute", inset:5, borderRadius:"50%", background:C.surface }} />
              <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:`linear-gradient(135deg,#1a0035,#120028)`, display:"flex", alignItems:"center", justifyContent:"center", transform:`scale(${breath})` }}>
                <UsersIcon />
              </div>
            </div>

            <div style={{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:"clamp(20px,4vw,28px)", color:C.txt, letterSpacing:"-0.3px", marginBottom:10, background:"linear-gradient(90deg,#a855f7 0%,#e879f9 40%,#818cf8 70%,#a855f7 100%)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"shimmer 3s linear infinite" }}>
              Debate Hangout
            </div>
            <p style={{ fontSize:15, color:C.txt2, lineHeight:1.7, maxWidth:340, marginBottom:32, fontStyle:"italic" }}>
              Practice debates, sharpen arguments, and grow together in a live session.
            </p>

            <div style={{ display:"flex", gap:20, marginBottom:36, flexWrap:"wrap", justifyContent:"center" }}>
              {[["#34d399","HD Video"],["#8b5cf6","Live Audio"],["#e879f9","Instant Match"]].map(([bg,lbl])=>(
                <div key={lbl} style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, fontWeight:500, color:C.txt2 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:bg, boxShadow:`0 0 8px ${bg}`, flexShrink:0 }} />{lbl}
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:14, padding:"14px 20px", marginBottom:20, color:"#fca5a5", fontSize:14, width:"100%", boxSizing:"border-box" }}>{error}</div>
            )}

            <Btn
              base={{ display:"flex", alignItems:"center", gap:12, background:`linear-gradient(135deg,${C.purple},${C.violet})`, color:"white", border:"none", padding:"16px 40px", borderRadius:9999, fontSize:16, fontWeight:700, fontFamily:"'Cinzel',serif", letterSpacing:"1px", boxShadow:"0 6px 28px rgba(124,58,237,0.5)", transition:"all 0.28s ease" }}
              hov={{ transform:"translateY(-3px) scale(1.04)", boxShadow:"0 14px 44px rgba(124,58,237,0.65)" }}
              act={{ transform:"translateY(0) scale(0.97)" }}
              onClick={initMedia}
            >
              <span style={{ display:"flex", alignItems:"center", transform:`scale(${breath})` }}><SearchIcon /></span>
              <span>Find a Partner</span>
            </Btn>
          </div>
        )}

        {/* ══ MATCHMAKING ══ */}
        {isMatching && (
          <div style={{ textAlign:"center", color:"white", position:"relative", padding:"clamp(28px,5vw,48px) clamp(24px,5vw,56px)", ...fadeUp, maxWidth:560, width:"92%" }}>
            <div style={{ position:"absolute", inset:0, borderRadius:28, background:C.card, border:`1px solid ${C.border}`, backdropFilter:"blur(24px)", zIndex:-1, boxShadow:"0 25px 80px rgba(0,0,0,0.8),0 0 40px rgba(124,58,237,0.3)" }} />

            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:52, marginBottom:40 }}>
              {[{ label:"You", dir:1 }, { label:"Co-Learner", dir:-1 }].map(({ label, dir }, i) => (
                <div key={label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                  <div style={{ transform:`translateY(${floatY * dir}px)` }}>
                    <SpinRing size={96} inset={4} colors={i===0?"#7c3aed,#c084fc,#e879f9,#7c3aed":"#e879f9,#8b5cf6,#7c3aed,#e879f9"} speed={i===0?1:-1}>
                      <span style={{ fontSize:40 }}>👤</span>
                    </SpinRing>
                  </div>
                  <p style={{ fontSize:11, fontWeight:700, color:C.txt2, letterSpacing:2, textTransform:"uppercase", margin:0 }}>{label}</p>
                </div>
              ))}
            </div>

            {/* connector line with dot */}
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:180, height:2, background:"rgba(139,92,246,0.15)", borderRadius:2 }}>
              <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(to right,#c084fc 0,#c084fc 12px,transparent 12px,transparent 24px)" }} />
              <div style={{ position:"absolute", width:12, height:12, background:C.fuchsia, borderRadius:"50%", top:-5, left:dotX, opacity:dotOp, boxShadow:`0 0 16px ${C.fuchsia}` }} />
            </div>

            <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:20, color:C.txt, marginBottom:6 }}>
              {status==="waiting" ? "Finding your debate partner…" : "Establishing connection…"}
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"center", margin:"18px 0 34px" }}>
              {[C.violet, C.pink, C.fuchsia].map((color, i) => <BounceD key={i} color={color} />)}
            </div>
            <button style={{ background:"transparent", color:C.txt2, border:`1.5px solid ${C.border}`, padding:"10px 34px", borderRadius:9999, fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"'Inter',sans-serif" }} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        )}

        {/* ══ VIDEO CALL ══ */}
        <div style={{ position:"absolute", inset:0, background:"#06000e", overflow:"hidden", display:isConnected?"block":"none" }}>
          {/* Remote video */}
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width:"100%", height:"100%", objectFit:"cover", display:remoteCamOn?"block":"none" }} />

          {!remoteCamOn && (
            <div style={{ position:"absolute", inset:0, zIndex:3, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"radial-gradient(ellipse at center,#1a0035 0%,#06000e 100%)" }}>
              <div style={{ transform:`scale(${breath})` }}>
                <SpinRing size={120} inset={5} colors="#7c3aed,#c084fc,#e879f9,#7c3aed" speed={0.7}>
                  <span style={{ fontSize:48, fontWeight:700, color:C.txt, zIndex:2 }}>C</span>
                </SpinRing>
              </div>
              <div style={{ fontSize:18, fontWeight:600, color:C.txt, marginTop:20, fontFamily:"'Cinzel',serif" }}>Co-Learner</div>
              <div style={{ fontSize:13, color:C.txt2, marginTop:6, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:C.green, transform:`scale(${breath})`, display:"inline-block" }} />
                Camera off
              </div>
            </div>
          )}

          {/* Vignette */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:2, background:"radial-gradient(ellipse at center,transparent 35%,rgba(6,0,14,0.55) 100%)" }} />

          {/* Remote label */}
          {remoteCamOn && (
            <div style={{ position:"absolute", bottom:88, left:24, background:"rgba(6,0,14,0.75)", backdropFilter:"blur(8px)", color:C.txt, padding:"4px 14px", borderRadius:9999, fontSize:13, fontWeight:500, zIndex:10, border:`1px solid ${C.border}` }}>Co-Learner</div>
          )}

          {/* Local PiP */}
          <video ref={localVideoRef} autoPlay playsInline muted style={{ position:"absolute", bottom:"clamp(80px,12vw,92px)", right:"clamp(10px,2vw,24px)", width:"clamp(110px,22vw,200px)", height:"clamp(74px,15vw,134px)", objectFit:"cover", borderRadius:14, border:"2px solid rgba(139,92,246,0.4)", boxShadow:"0 10px 40px rgba(0,0,0,0.7),0 0 30px rgba(124,58,237,0.4)", zIndex:10, background:C.surface, opacity:camOn?1:0, transition:"opacity 0.3s ease" }} />
          {!camOn && (
            <div style={{ position:"absolute", bottom:"clamp(80px,12vw,92px)", right:"clamp(10px,2vw,24px)", width:"clamp(110px,22vw,200px)", height:"clamp(74px,15vw,134px)", borderRadius:14, border:"2px solid rgba(139,92,246,0.3)", background:C.surface, zIndex:11, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:`linear-gradient(135deg,${C.purple},${C.fuchsia})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, color:"white", transform:`scale(${breath})`, boxShadow:"0 0 24px rgba(124,58,237,0.5)", fontFamily:"'Cinzel',serif" }}>
                {userInitials}
              </div>
              <div style={{ fontSize:12, fontWeight:500, color:C.txt2 }}>You</div>
            </div>
          )}
          <div style={{ position:"absolute", bottom:234, right:24, background:"rgba(6,0,14,0.75)", backdropFilter:"blur(8px)", color:C.txt, padding:"4px 14px", borderRadius:9999, fontSize:13, fontWeight:500, zIndex:12, border:`1px solid ${C.border}` }}>You</div>

          {/* Live pill */}
          <div style={{ position:"absolute", top:20, left:"50%", transform:"translateX(-50%)", background:"rgba(6,0,14,0.8)", backdropFilter:"blur(12px)", border:`1px solid ${C.border}`, color:C.green, fontSize:11, fontWeight:700, letterSpacing:"1.5px", padding:"5px 18px", borderRadius:9999, zIndex:20, fontFamily:"'Cinzel',serif" }}>● LIVE</div>

          {/* Timer */}
          <div style={{ position:"absolute", top:20, right:24, background:"rgba(6,0,14,0.8)", backdropFilter:"blur(10px)", border:`1px solid ${C.border}`, color:C.txt2, fontSize:12, fontWeight:600, letterSpacing:"1.4px", padding:"5px 16px", borderRadius:9999, zIndex:20, fontFamily:"'Cinzel',serif" }}>{fmt(callDuration)}</div>

          {/* Controls bar */}
          <div style={{ position:"absolute", bottom:"clamp(10px,2vw,20px)", left:"50%", transform:"translateX(-50%)", background:"rgba(6,0,14,0.92)", backdropFilter:"blur(28px) saturate(180%)", border:`1px solid ${C.border}`, padding:"10px clamp(14px,3vw,24px)", borderRadius:9999, display:"flex", alignItems:"center", gap:"clamp(6px,1.5vw,10px)", boxShadow:`0 8px 40px rgba(0,0,0,0.7),0 0 40px rgba(124,58,237,0.35)`, zIndex:30, whiteSpace:"nowrap" }}>
            <Btn base={ctrlBase(!camOn)} hov={{ background:"rgba(139,92,246,0.25)", transform:"translateY(-3px) scale(1.08)" }} act={{ transform:"scale(0.94)" }} onClick={toggleCam} title={camOn?"Turn off camera":"Turn on camera"}>
              {camOn ? <CamOnIcon /> : <CamOffIcon />}
            </Btn>
            <Btn base={ctrlBase(!micOn)} hov={{ background:"rgba(139,92,246,0.25)", transform:"translateY(-3px) scale(1.08)" }} act={{ transform:"scale(0.94)" }} onClick={toggleMic} title={micOn?"Mute mic":"Unmute mic"}>
              {micOn ? <MicOnIcon /> : <MicOffIcon />}
            </Btn>
            <div style={{ width:1, height:32, background:C.border, margin:"0 4px", flexShrink:0 }} />
            <Btn
              base={{ width:58, height:58, borderRadius:"50%", border:"none", outline:"1.5px solid rgba(248,113,113,0.45)", background:"rgba(248,113,113,0.15)", color:"#fca5a5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s ease" }}
              hov={{ background:"#f87171", color:"white", transform:"translateY(-4px) scale(1.1)", boxShadow:"0 12px 36px rgba(248,113,113,0.5)" }}
              act={{ transform:"scale(0.94)" }}
              onClick={(e) => { addRipple(e); handleHangup(); }} title="End call"
            >
              <HangupIcon />
            </Btn>
          </div>
        </div>

      </div>
    </div>
  );
}