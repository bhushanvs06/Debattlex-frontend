import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';

var url = process.env.React_App_url;

const contentLibrary = [
  { id: 1, videoId: "Udap-5rVWeM", title: "Why does happiness slip away so easily?", speaker: "Jaya Row", meta: "795K views • Jan 2024", shortDesc: "Uncover the secret to lasting joy.", summary: "Why does happiness slip away so easily? Uncover the secret to lasting joy..." },
  { id: 2, videoId: "sKvMxZ284AA", title: "From Village Girl to UPSC AIR-50", speaker: "Surabhi Gautam", meta: "TEDx Talk", shortDesc: "Knowledge is the only art of recognition.", summary: "Surabhi Gautam was born in an orthodox village... AIR-1 IES & AIR-50 UPSC." },
  { id: 3, videoId: "VU7VIcd_i68", title: "The Power of One Bold Decision", speaker: "Spoorthi Vishwas", meta: "TEDx Talk", shortDesc: "One courageous decision can break monotony.", summary: "Spoorthi Vishwas on self as taskmaster and courage..." },
  { id: 4, videoId: "u4ZoJKF_VuA", title: "Start With Why", speaker: "Simon Sinek", meta: "TEDxPugetSound", shortDesc: "How great leaders inspire action.", summary: "Simon Sinek explains the Golden Circle..." },
  { id: 5, videoId: "xp0O2vi8DX4", title: "How Expectations Drive Change", speaker: "Tali Sharot", meta: "TEDxCambridge", shortDesc: "Science of motivation.", summary: "Tali Sharot on three key ingredients for change..." },
  { id: 6, videoId: "GXy__kBVq1M", title: "The Happiness Advantage", speaker: "Shawn Achor", meta: "TEDxBloomington", shortDesc: "Train brain for positivity.", summary: "Shawn Achor shows happiness fuels success..." },
  { id: 7, videoId: "vVsXO9brK7M", title: "Know Your Life Purpose in 5 Minutes", speaker: "Adam Leipzig", meta: "TEDxMalibu", shortDesc: "5-question formula.", summary: "Adam Leipzig's 5-question purpose exercise..." },
  { id: 8, videoId: "amJhgx_IfdU", title: "Workplaces Are Failing Caregivers", speaker: "Samantha Brady", meta: "TEDx 2024", shortDesc: "Support for caregivers.", summary: "Samantha Brady on caregiver-friendly policies..." },
  { id: 9, videoId: "BbsPhgAGdIE", title: "What You Don't Know About Sharks", speaker: "Mikki McComb-Kobza", meta: "TEDx 2024", shortDesc: "Sharks are heroes.", summary: "Mikki McComb-Kobza busts shark myths..." },
  { id: 10, videoId: "KTejqeu00G0", title: "5 Reasons You Look Bad in Photos", speaker: "Teri Hofford", meta: "TEDxWinnipeg", shortDesc: "Why you hate photos of yourself.", summary: "Teri Hofford on photo confidence..." }
];

const getBadge = (avg) => {
  if (avg >= 85) return { emoji: "🥇", label: "GOLD LEGEND", color: "#FFD700", glow: "0 0 30px #FFD70088, 0 0 60px #FFD70044", border: "linear-gradient(135deg, #FFD700, #FFA500, #FFD700)", bg: "linear-gradient(135deg, #3d2e00, #5a4200)" };
  if (avg >= 70) return { emoji: "🥈", label: "SILVER STAR", color: "#C0C0C0", glow: "0 0 30px #C0C0C088, 0 0 60px #C0C0C044", border: "linear-gradient(135deg, #C0C0C0, #888, #C0C0C0)", bg: "linear-gradient(135deg, #1e1e1e, #2e2e2e)" };
  if (avg >= 50) return { emoji: "🥉", label: "BRONZE HERO", color: "#CD7F32", glow: "0 0 30px #CD7F3288, 0 0 60px #CD7F3244", border: "linear-gradient(135deg, #CD7F32, #8B4513, #CD7F32)", bg: "linear-gradient(135deg, #2d1a00, #3d2500)" };
  return { emoji: "✅", label: "COMPLETED", color: "#4ade80", glow: "0 0 20px #4ade8044", border: "linear-gradient(135deg, #4ade80, #22c55e)", bg: "linear-gradient(135deg, #001a0d, #002916)" };
};

const PronunciationJudge = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userProgress, setUserProgress] = useState({});
  const [todayCount, setTodayCount] = useState(0);
  const [viewMode, setViewMode] = useState("practice");

  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();
  const email = localStorage.getItem("userEmail");

  const fetchProgress = async () => {
    if (!email) return;
    try {
      const res = await axios.post(`${url}/get-user-progress`, { email });
      const progress = res.data.videoProgress || {};
      setUserProgress(progress);
      const today = new Date().toDateString();
      const count = Object.values(progress).filter(p =>
        new Date(p.completedAt).toDateString() === today
      ).length;
      setTodayCount(count);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => { fetchProgress(); }, []);

  useEffect(() => {
    if (result && selectedVideo && email && viewMode === "practice") {
      saveProgress(selectedVideo.videoId, result);
    }
  }, [result]);

  const saveProgress = async (videoId, resultData) => {
    try {
      await axios.post(`${url}/save-video-progress`, {
        email, videoId,
        pronunciationScore: resultData.pronunciationScore || 0,
        understandingScore: resultData.understandingScore || 0,
        transcription: resultData.transcription || "",
        pronunciationFeedback: resultData.pronunciationFeedback || "",
        understandingFeedback: resultData.understandingFeedback || "",
        mistakes: resultData.mistakes || [],
        completedAt: Date.now()
      });
      fetchProgress();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      audioChunksRef.current = [];
      processor.onaudioprocess = (e) => {
        audioChunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(audioContext.destination);
      setRecording(true);
      setResult(null);
    } catch (err) {
      alert("Mic access denied. Please allow permission.");
    }
  };

  const stop = () => {
    if (!recording) return;
    setRecording(false);
    if (processorRef.current) processorRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    setLoading(true);
    const wavBlob = createWavBlob();
    if (wavBlob) send(wavBlob);
    else setLoading(false);
  };

  const toggleRecording = () => recording ? stop() : start();

  const createWavBlob = () => {
    const chunks = audioChunksRef.current;
    if (chunks.length === 0) { alert("No audio detected. Speak after start."); return null; }
    let totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const audioData = new Float32Array(totalLength);
    let offset = 0;
    chunks.forEach(chunk => { audioData.set(chunk, offset); offset += chunk.length; });
    const sampleRate = 44100;
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);
    const writeString = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    writeString(0, 'RIFF'); view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(8, 'WAVE'); writeString(12, 'fmt '); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    writeString(36, 'data'); view.setUint32(40, audioData.length * 2, true);
    let off2 = 44;
    for (let i = 0; i < audioData.length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(off2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off2 += 2;
    }
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const send = async (wavBlob) => {
    try {
      const fd = new FormData();
      fd.append('audio', wavBlob, 'recording.wav');
      fd.append('summary', selectedVideo.summary);
      const res = await axios.post(`${url}/evaluate-pronunciation-and-understanding`, fd);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Server error. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (video) => {
    const prog = userProgress[video.videoId];
    setSelectedVideo(video);
    if (prog) { setResult(prog); setViewMode("previous"); setVideoEnded(true); }
    else { setResult(null); setViewMode("practice"); setVideoEnded(false); }
  };

  const startReTake = () => { setViewMode("practice"); setResult(null); setVideoEnded(true); };
  const backToGallery = () => { setSelectedVideo(null); setResult(null); setViewMode("practice"); setVideoEnded(false); };

  const avgScore = result ? Math.round((result.pronunciationScore + result.understandingScore) / 2) : 0;
  const isLegend = avgScore >= 85;

  const renderHighlightedTranscription = () => {
    if (!result || typeof result.transcription !== 'string' || !result.transcription.trim())
      return <span style={{ color: '#888', fontStyle: 'italic' }}>No transcription yet...</span>;
    const words = result.transcription.split(/\s+/).filter(Boolean);
    const mistakeWords = Array.isArray(result.mistakes)
      ? result.mistakes.filter(m => m?.word).map(m => m.word.toLowerCase().trim()) : [];
    return words.map((word, i) => {
      const isBad = mistakeWords.includes(word.toLowerCase().replace(/[^a-z]/g, ''));
      return (
        <span key={i} title={isBad ? "Mispronounced" : ""}
          style={{ color: isBad ? '#ff6b6b' : '#e8e0ff', fontWeight: isBad ? 700 : 400,
            textDecoration: isBad ? 'underline wavy #ff6b6b 2px' : 'none',
            background: isBad ? 'rgba(255,107,107,0.15)' : 'transparent',
            padding: '2px 5px', borderRadius: '5px' }}>
          {word}{' '}
        </span>
      );
    });
  };

  const completedCount = Object.keys(userProgress).length;
  const goldCount = Object.values(userProgress).filter(p => (p.avgScore || Math.round((p.pronunciationScore + p.understandingScore) / 2)) >= 85).length;
  const silverCount = Object.values(userProgress).filter(p => { const s = p.avgScore || Math.round((p.pronunciationScore + p.understandingScore) / 2); return s >= 70 && s < 85; }).length;
  const bronzeCount = Object.values(userProgress).filter(p => { const s = p.avgScore || Math.round((p.pronunciationScore + p.understandingScore) / 2); return s >= 50 && s < 70; }).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0014', fontFamily: "'Georgia', serif", color: '#e8e0ff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

        @keyframes popIn { 0% { opacity:0; transform:scale(0.7) translateY(30px); } 100% { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes bob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-14px); } }
        @keyframes legendBounce { 0% { transform:scale(1) rotate(-8deg); } 100% { transform:scale(1.18) rotate(8deg); } }
        @keyframes fadeSlideUp { 0% { opacity:0; transform:translateY(24px); } 100% { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes rotateIn { 0% { transform: rotate(-180deg) scale(0); opacity:0; } 100% { transform: rotate(0) scale(1); opacity:1; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        @keyframes goldGlow { 0%,100% { box-shadow: 0 0 20px #FFD70066; } 50% { box-shadow: 0 0 50px #FFD700aa, 0 0 80px #FFD70055; } }
        @keyframes silverGlow { 0%,100% { box-shadow: 0 0 20px #C0C0C066; } 50% { box-shadow: 0 0 50px #C0C0C0aa; } }
        @keyframes bronzeGlow { 0%,100% { box-shadow: 0 0 20px #CD7F3266; } 50% { box-shadow: 0 0 50px #CD7F32aa; } }
        @keyframes cardHover { 0% { transform: translateY(0) scale(1); } 100% { transform: translateY(-12px) scale(1.03); } }
        @keyframes starFloat { 0%,100% { transform: translateY(0) rotate(0deg); opacity:0.7; } 50% { transform: translateY(-20px) rotate(180deg); opacity:1; } }

        .medal-card { transition: transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s ease; }
        .medal-card:hover { transform: translateY(-14px) scale(1.04) !important; }

        .gold-card { animation: goldGlow 2.5s infinite ease-in-out; }
        .silver-card { animation: silverGlow 2.5s infinite ease-in-out; }
        .bronze-card { animation: bronzeGlow 2.5s infinite ease-in-out; }

        .shimmer-text {
          background: linear-gradient(90deg, #FFD700 0%, #FFF8DC 40%, #FFA500 60%, #FFD700 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .silver-text {
          background: linear-gradient(90deg, #888 0%, #fff 40%, #bbb 60%, #888 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .bronze-text {
          background: linear-gradient(90deg, #CD7F32 0%, #FFB347 40%, #8B4513 60%, #CD7F32 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }

        .circular-progress { position: relative; height: 150px; width: 150px; border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: rotateIn 1s ease; }
        .circular-progress::before { content: ""; position: absolute; height: 126px; width: 126px; border-radius: 50%; background: #0a0014; }
        .progress-value { position: relative; font-size: 32px; font-weight: 700; z-index: 1; font-family: 'Cinzel', serif; }

        .rec-btn { transition: all 0.2s; }
        .rec-btn:hover:not(:disabled) { transform: scale(1.06); }
        .rec-btn:active:not(:disabled) { transform: scale(0.97); }

        .stat-orb { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 20px 32px; text-align: center; backdrop-filter: blur(10px); }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0014; }
        ::-webkit-scrollbar-thumb { background: #4a0080; border-radius: 3px; }
      `}</style>

      {/* Ambient background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, #2d004d33 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, #00003388 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>

        {!selectedVideo ? (
          <>
            {/* HEADER */}
            <div style={{ textAlign: 'center', marginBottom: '56px', animation: 'fadeSlideUp 0.7s ease' }}>
              <div style={{ fontSize: '13px', letterSpacing: '6px', color: '#9060c8', textTransform: 'uppercase', marginBottom: '16px', fontFamily: "'Cinzel', serif" }}>
                Debattlex Playground
              </div>
              <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.1, margin: 0, color: '#fff' }}>
                🎮 THE ARENA
              </h1>
              <p style={{ fontSize: '18px', color: '#a080c8', marginTop: '16px', fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: '22px' }}>
                Watch · Speak · Earn Your Medal
              </p>

              {/* Trophy shelf */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '32px', flexWrap: 'wrap' }}>
                {[
                  { emoji: '🥇', label: 'Gold', count: goldCount, cls: 'shimmer-text', color: '#FFD700' },
                  { emoji: '🥈', label: 'Silver', count: silverCount, cls: 'silver-text', color: '#C0C0C0' },
                  { emoji: '🥉', label: 'Bronze', count: bronzeCount, cls: 'bronze-text', color: '#CD7F32' },
                  { emoji: '✅', label: 'Done', count: completedCount, cls: '', color: '#4ade80' },
                ].map(({ emoji, label, count, cls, color }) => (
                  <div key={label} className="stat-orb">
                    <div style={{ fontSize: '32px' }}>{emoji}</div>
                    <div className={cls} style={{ fontSize: '26px', fontWeight: 700, fontFamily: "'Cinzel', serif", color: cls ? undefined : color }}>{count}</div>
                    <div style={{ fontSize: '12px', color: '#7050a0', letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Daily progress */}
              <div style={{ marginTop: '32px', maxWidth: '500px', margin: '32px auto 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#9060c8', fontSize: '14px', fontFamily: "'Cinzel', serif", letterSpacing: '2px' }}>DAILY QUEST</span>
                  <span style={{ color: '#e8e0ff', fontWeight: 700, fontFamily: "'Cinzel', serif" }}>{todayCount} / 10</span>
                </div>
                <div style={{ height: '10px', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ width: `${(todayCount / 10) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #6a1b9a, #FFD700)', borderRadius: '999px', transition: 'width 1.2s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 0 12px #FFD70066' }} />
                </div>
              </div>
            </div>

            {/* CARD GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '28px' }}>
              {contentLibrary.map((video, idx) => {
                const prog = userProgress[video.videoId];
                const completed = !!prog;
                const score = prog ? (prog.avgScore || Math.round(((prog.pronunciationScore || 0) + (prog.understandingScore || 0)) / 2)) : 0;
                const badge = completed ? getBadge(score) : null;

                return (
                  <div
                    key={video.id}
                    className={`medal-card ${completed ? (score >= 85 ? 'gold-card' : score >= 70 ? 'silver-card' : score >= 50 ? 'bronze-card' : '') : ''}`}
                    onClick={() => handleVideoSelect(video)}
                    style={{
                      borderRadius: '22px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: completed ? badge.bg : 'rgba(255,255,255,0.03)',
                      border: completed ? `2px solid ${badge.color}44` : '2px solid rgba(255,255,255,0.08)',
                      animation: `fadeSlideUp 0.5s ease ${idx * 60}ms both`,
                      position: 'relative',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={`https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`}
                        alt={video.title}
                        style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s', filter: completed ? 'none' : 'brightness(0.85)' }}
                        onError={e => e.target.src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,0,20,0.8) 100%)' }} />

                      {completed && (
                        <div style={{
                          position: 'absolute', top: '14px', left: '14px',
                          padding: '6px 16px', borderRadius: '50px', fontFamily: "'Cinzel', serif",
                          fontSize: '12px', fontWeight: 700, letterSpacing: '1px',
                          background: badge.color, color: '#000',
                          boxShadow: badge.glow,
                        }}>
                          {badge.emoji} {badge.label}
                        </div>
                      )}

                      {completed && (
                        <div style={{ position: 'absolute', bottom: '12px', right: '14px', fontSize: '28px', fontFamily: "'Cinzel', serif", fontWeight: 900, color: badge.color, textShadow: badge.glow }}>
                          {score}%
                        </div>
                      )}

                      {!completed && (
                        <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(0,0,0,0.6)', borderRadius: '50px', padding: '4px 12px', fontSize: '12px', color: '#9060c8', fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
                          UNLOCKED
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#fff', fontFamily: "'Cinzel', serif", fontWeight: 700, lineHeight: 1.3 }}>{video.title}</h3>
                      <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#9070b8', fontFamily: "'Crimson Text', serif", fontStyle: 'italic' }}>{video.shortDesc}</p>
                      <div style={{ fontSize: '12px', color: '#6040a0', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif" }}>{video.speaker}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          // VIDEO + FEEDBACK VIEW
          <div style={{ maxWidth: '960px', margin: '0 auto', animation: 'fadeSlideUp 0.5s ease' }}>
            <button onClick={backToGallery} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFD700', fontSize: '18px', fontFamily: "'Cinzel', serif", letterSpacing: '2px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '10px', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              ← BACK TO ARENA
            </button>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(22px, 4vw, 40px)', color: '#fff', margin: '0 0 8px' }}>{selectedVideo.title}</h1>
              <p style={{ color: '#9060c8', fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: '20px' }}>{selectedVideo.speaker}</p>
            </div>

            <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', marginBottom: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <YouTube videoId={selectedVideo.videoId} opts={{ height: '480', width: '100%', playerVars: { modestbranding: 1 } }} onStateChange={(e) => e.data === 0 && setVideoEnded(true)} />
            </div>

            {/* RESULTS */}
            {(viewMode === "previous" || result) ? (
              <div>
                {/* Medal banner */}
                {(() => {
                  const badge = getBadge(avgScore);
                  return (
                    <div style={{
                      textAlign: 'center', padding: '40px', borderRadius: '24px',
                      background: badge.bg, border: `2px solid ${badge.color}44`,
                      boxShadow: badge.glow, marginBottom: '40px',
                      animation: 'fadeSlideUp 0.6s ease'
                    }}>
                      <div style={{ fontSize: '80px', animation: isLegend ? 'legendBounce 0.8s infinite alternate' : 'bob 2.5s infinite ease-in-out', display: 'inline-block' }}>{badge.emoji}</div>
                      <div className={avgScore >= 85 ? 'shimmer-text' : avgScore >= 70 ? 'silver-text' : avgScore >= 50 ? 'bronze-text' : ''}
                        style={{ fontSize: '36px', fontFamily: "'Cinzel', serif", fontWeight: 900, marginTop: '12px', color: avgScore < 50 ? '#4ade80' : undefined }}>
                        {badge.label}
                      </div>
                      <div style={{ fontSize: '64px', fontFamily: "'Cinzel', serif", fontWeight: 900, color: badge.color, textShadow: badge.glow, marginTop: '8px' }}>
                        {avgScore}%
                      </div>
                      <div style={{ color: '#9060c8', fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: '18px' }}>
                        {isLegend ? "Extraordinary performance — you're an elite debater!" : avgScore >= 70 ? "Strong work — keep pushing for gold!" : avgScore >= 50 ? "A solid effort — bronze is just the beginning!" : "Completed — every attempt makes you sharper!"}
                      </div>
                    </div>
                  );
                })()}

                {/* Circular score gauges */}
                {typeof result.pronunciationScore === 'number' && typeof result.understandingScore === 'number' && (
                  <div style={{ display: 'flex', gap: '50px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
                    {[
                      { score: result.pronunciationScore, label: '🔊 Pronunciation', color: '#4ade80' },
                      { score: result.understandingScore, label: '🧠 Understanding', color: '#60a5fa' },
                    ].map(({ score, label, color }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div className="circular-progress" style={{ background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.05) 0deg)` }}>
                          <span className="progress-value" style={{ color }}>{score}%</span>
                        </div>
                        <div style={{ color, fontSize: '16px', fontFamily: "'Cinzel', serif", letterSpacing: '1px', marginTop: '12px' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Feedback sections */}
                {[
                  { key: 'pronunciationFeedback', label: 'Pronunciation Feedback', color: '#4ade80', icon: '🔊' },
                  { key: 'understandingFeedback', label: 'Understanding Feedback', color: '#60a5fa', icon: '🧠' },
                ].map(({ key, label, color, icon }) => result[key] && (
                  <div key={key} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}33`, borderRadius: '18px', padding: '28px', marginBottom: '24px', animation: 'fadeSlideUp 0.6s ease' }}>
                    <h3 style={{ color, fontFamily: "'Cinzel', serif", fontSize: '18px', letterSpacing: '2px', marginBottom: '14px' }}>{icon} {label.toUpperCase()}</h3>
                    <p style={{ color: '#c8b8e8', lineHeight: '1.8', fontSize: '17px', fontFamily: "'Crimson Text', serif", margin: 0 }}>{result[key]}</p>
                  </div>
                ))}

                {/* Transcription */}
                {result.transcription && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '28px', marginBottom: '32px', animation: 'fadeSlideUp 0.7s ease' }}>
                    <h3 style={{ color: '#e8e0ff', fontFamily: "'Cinzel', serif", fontSize: '16px', letterSpacing: '2px', marginBottom: '16px' }}>📝 YOUR TRANSCRIPTION</h3>
                    <div style={{ lineHeight: '2', fontSize: '17px', fontFamily: "'Crimson Text', serif" }}>
                      {renderHighlightedTranscription()}
                    </div>
                  </div>
                )}

                {/* Mistakes */}
                {Array.isArray(result.mistakes) && result.mistakes.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ color: '#ff6b6b', fontFamily: "'Cinzel', serif", fontSize: '18px', letterSpacing: '2px', textAlign: 'center', marginBottom: '24px' }}>
                      😅 MISPRONOUNCED WORDS — LET'S FIX THEM
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
                      {result.mistakes.map((m, i) => (
                        <div key={i} style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.25)', borderLeft: '5px solid #ff6b6b', borderRadius: '16px', padding: '22px', animation: `popIn 0.5s ease ${i * 80}ms both` }}>
                          <div style={{ color: '#ffcccc', fontFamily: "'Cinzel', serif", fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>❌ {m.word || 'Unknown'}</div>
                          <div style={{ fontSize: '14px', lineHeight: '1.7', fontFamily: "'Crimson Text', serif" }}>
                            <div style={{ color: '#ff9999' }}>Heard: <em>{m.user_pronunciation || 'N/A'}</em></div>
                            <div style={{ color: '#a5f3fc' }}>Correct: <em>{m.correct_pronunciation || 'N/A'}</em></div>
                            <div style={{ color: '#fbbf24', marginTop: '8px' }}>Issue: {m.issue || 'Unspecified'}</div>
                            <div style={{ color: '#86efac', marginTop: '6px' }}>💡 {m.how_to_correct || 'Practice carefully'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewMode === "previous" && (
                  <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button onClick={startReTake} className="rec-btn" style={{ padding: '18px 56px', fontSize: '18px', borderRadius: '999px', background: 'linear-gradient(135deg, #6a1b9a, #c026d3)', color: 'white', border: 'none', fontFamily: "'Cinzel', serif", letterSpacing: '2px', cursor: 'pointer', boxShadow: '0 12px 40px rgba(192,38,211,0.4)' }}>
                      🔄 RE-TAKE THE TEST
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {!videoEnded ? (
                  <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,215,0,0.05)', borderRadius: '24px', border: '2px dashed rgba(255,215,0,0.3)' }}>
                    <div style={{ fontSize: '72px', animation: 'bob 2.5s infinite ease-in-out', display: 'inline-block' }}>🎥</div>
                    <h2 style={{ color: '#FFD700', fontFamily: "'Cinzel', serif", fontSize: '26px', letterSpacing: '2px', marginTop: '20px' }}>WATCH TILL THE END TO UNLOCK YOUR MIC</h2>
                    <p style={{ color: '#9060c8', fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: '18px' }}>Your medal awaits...</p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#fff', fontFamily: "'Cinzel', serif", fontSize: '28px', letterSpacing: '2px', marginBottom: '36px' }}>🎤 YOUR TURN — SPEAK LIKE A CHAMPION</h2>
                    <button onClick={toggleRecording} disabled={loading} className="rec-btn"
                      style={{
                        padding: '24px 72px', fontSize: '22px', borderRadius: '9999px',
                        background: loading ? 'rgba(255,255,255,0.1)' : recording ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #6a1b9a, #c026d3)',
                        color: 'white', border: 'none',
                        fontFamily: "'Cinzel', serif", letterSpacing: '2px',
                        boxShadow: loading ? 'none' : recording ? '0 12px 40px rgba(239,68,68,0.5)' : '0 12px 40px rgba(192,38,211,0.5)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        animation: recording ? 'pulse 1s infinite' : 'none',
                      }}
                    >
                      {loading ? "🤖 ANALYZING..." : recording ? "⏹ STOP RECORDING" : "🎙 START RECORDING"}
                    </button>
                    {recording && (
                      <p style={{ color: '#ff6b6b', fontFamily: "'Crimson Text', serif", fontStyle: 'italic', marginTop: '16px', fontSize: '18px', animation: 'pulse 1.5s infinite' }}>
                        Recording in progress...
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationJudge;