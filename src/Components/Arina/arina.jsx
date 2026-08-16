import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, MessageSquare, FileText, Home, Compass, Trophy } from 'lucide-react';
import './Arina.css';
import { useNavigate } from 'react-router-dom' ;
import axios from 'axios';

var url = process.env.React_App_url || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://debattlex-server-main.onrender.com');

const toBoldItalic = (word) => {
  const map = {
    a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠', h: '𝐡', i: '𝐢', j: '𝐣', k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧',
    o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮', v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳',
    A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆', H: '𝐇', I: '𝐈', J: '𝐉', K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍',
    O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓', U: '𝐔', V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙'
  };
  return word.split('').map(c => map[c] || c).join('');
};

const highlightImportant = (text) =>
  text.split(' ').map(word => {
    const stripped = word.replace(/[*#]/g, '');
    return stripped.replace(/[^a-zA-Z]/g, '').toLowerCase() === 'important'
      ? toBoldItalic(stripped) : stripped;
  }).join(' ');

const Arina = () => {
  const [email, setEmail] = useState('');
  const [isMobileMode, setIsMobileMode] = useState(window.innerWidth < 980);

  useEffect(() => {
    const handleResize = () => setIsMobileMode(window.innerWidth < 980);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isMuted, setIsMuted] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [debateTopic, setDebateTopic] = useState('Loading topic...');
  const [userStance, setUserStance] = useState('');
  const [debateType, setDebateType] = useState('');
  const [userTranscripts, setUserTranscripts] = useState([]);
  const [aiTranscripts, setAITranscripts] = useState([]);
  // Summary: grouped per speaker — one block per round, appended each turn
  const [userSummaryPoints, setUserSummaryPoints] = useState([]);
  const [aiSummaryPoints, setAISummaryPoints] = useState([]);
  const [captionLines, setCaptionLines] = useState([]);
  const [captionLineIndex, setCaptionLineIndex] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false); // AI thinking state
  const [currentUserTranscript, setCurrentUserTranscript] = useState('');
  const [userCaption, setUserCaption] = useState('');
  const [latestKey, setLatestKey] = useState('');
  // voicePlan is controlled globally via NavigationBar → localStorage
  // voicePlanRef holds current value for TTS calls; voicePlanDisplay drives UI re-renders
  const voicePlanRef = useRef(localStorage.getItem('voicePlan') || 'Pro');
  const [voicePlanDisplay, setVoicePlanDisplay] = useState(localStorage.getItem('voicePlan') || 'Pro');
  const toggleVoicePlan = () => {
    const newVal = voicePlanRef.current === 'Pro' ? 'Lite' : 'Pro';
    voicePlanRef.current = newVal;
    setVoicePlanDisplay(newVal);
    localStorage.setItem('voicePlan', newVal);
    window.dispatchEvent(new StorageEvent('storage', { key: 'voicePlan', newValue: newVal }));
  };
  // Update ref + display state if NavBar changes the value
  useEffect(() => {
    const sync = () => {
      const v = localStorage.getItem('voicePlan') || 'Pro';
      voicePlanRef.current = v;
      setVoicePlanDisplay(v);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  // Speaking session guard — prevents overlapping TTS chains
  const speakSessionRef = useRef(0);

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const currentSourceRef = useRef(null);
  const videoRef = useRef(null);
  const isMounted = useRef(true);
  const prefetchCacheRef = useRef(new Map());
  const navigate = useNavigate();

  // ── Auto-rotate to landscape on mobile ─────────────────────
  useEffect(() => {
    const lockLandscape = async () => {
      try {
        if (window.screen.orientation && window.screen.orientation.lock) {
          await window.screen.orientation.lock('landscape');
        }
      } catch (err) {
        console.log('Orientation lock not available:', err.message);
      }
    };
    lockLandscape();
    return () => {
      try {
        if (window.screen.orientation && window.screen.orientation.unlock) {
          window.screen.orientation.unlock();
        }
      } catch (err) {}
    };
  }, []);

  // ── Initial Setup ──────────────────────────────────────────
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (!storedEmail) { alert('User email not found. Please log in again.'); navigate('/login'); return; }
    setEmail(storedEmail);
  }, [navigate]);

  useEffect(() => {
    if (!email) return;
    axios.post(url + '/api/fetchEntries', { email })
      .then(res => {
        const entries = res.data.entries || {};
        const keys = Object.keys(entries);
        if (keys.length === 0) { setDebateTopic('No debate found'); return; }
        const oneVsOne = keys
          .filter(k => entries[k].debateType?.toLowerCase() === '1v1')
          .sort((a, b) => new Date(entries[b].createdAt) - new Date(entries[a].createdAt));
        if (oneVsOne.length > 0) {
          const lk = oneVsOne[0];
          const le = entries[lk];
          setLatestKey(lk);
          localStorage.setItem('activeDebateKey', lk);
          setDebateTopic(le.topic || 'Untitled Debate');
          setUserStance(le.stance || '');
          setDebateType(le.debateType || '1v1');
          setUserRole(le.userrole || '');
        } else { setDebateTopic('No 1v1 debate found'); }
      })
      .catch(() => setDebateTopic('Error loading topic'));
  }, [email]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      try { 
        if (currentSourceRef.current) {
          currentSourceRef.current.onended = null;
          currentSourceRef.current.stop(); 
        }
      } catch(e) {}
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────
  const getAudioCtx = async () => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    } catch (e) {
      console.warn('AudioContext error, creating new one:', e);
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playBase64Audio = async (base64Audio) => {
    const ctx = await getAudioCtx();
    const bytes = atob(base64Audio);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return ctx.decodeAudioData(arr.buffer);
  };

  // ── Test Voice ──────────────────────────────────────────────
  const testTTS = async () => {
    try {
      const ttsRes = await axios.post(url + '/api/tts', { text: 'Hello, this is a test. Debattlex speaking.', speaker: 'manisha' });
      const audioBuffer = await playBase64Audio(ttsRes.data.audioBase64);
      const ctx = await getAudioCtx();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err) { console.error('❌ TEST FAILED:', err); }
  };

  const toggleMute = async () => {
    await getAudioCtx();
    // Kill any running audio chain immediately
    speakSessionRef.current += 1;
    prefetchCacheRef.current.clear();
    try {
      if (currentSourceRef.current) {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }
    } catch(e) {}
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    } catch(e) {}
    audioContextRef.current = null;

    if (isSpeaking) {
      setIsSpeaking(false); setCaptionLines([]); setCaptionLineIndex(0); setHighlightedWordIndex(0);
    }
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      const text = currentUserTranscript.trim();
      setCurrentUserTranscript(''); setUserCaption('');
      if (!text) return;
      try {
        setIsThinking(true); // Show thinking animation
        const ai_stance = userStance === 'proposition' ? 'opposition' : 'proposition';
        const aiRes = await axios.post(url + '/api/ask', {
          question: text, topic: debateTopic, stance: ai_stance,
          type: debateType, transcripts: userTranscripts.slice(0, 5),
        });
        setIsThinking(false);
        const aiText = aiRes.data.answer.replace(/[*#]/g, '');
        const updatedAI = [{ speaker: 'AI', text: aiText }, ...aiTranscripts];
        const updatedUser = [...userTranscripts, { speaker: 'You', text }];
        setAITranscripts(updatedAI); setUserTranscripts(updatedUser);

        // Fire-and-forget: summary appends new points each round
        (async () => {
          try {
            const { newUserSummary, newAiSummary } = await updateSummaries(updatedUser, updatedAI, text, aiText);
            const accumulatedUserSummary = [...userSummaryPoints, ...newUserSummary];
            const accumulatedAiSummary = [...aiSummaryPoints, ...newAiSummary];
            await saveDebateProgress(updatedUser, updatedAI, accumulatedUserSummary, accumulatedAiSummary);
          } catch (e) { console.error('Summary bg error:', e); }
        })();

        const lines = aiText.split(/[.?!]\s+/).filter(l => l.trim());
        setCaptionLines(lines); setCaptionLineIndex(0); setHighlightedWordIndex(0);
        // Bump session ID → any in-progress chain will abort itself
        speakSessionRef.current += 1;
        const sid = speakSessionRef.current;
        if (lines.length > 1) prefetchLine(lines, 1);
        speakCaptionLines(lines, 0, sid);
      } catch (err) {
        setIsThinking(false);
        console.error('❌ AI response error:', err);
      }
    }
  };

  const handleHangUp = async () => {
    if (window.confirm('Are you sure you want to hang up?')) {
      const text = currentUserTranscript.trim();
      if (text) {
        try {
          const updatedUser = [...userTranscripts, { speaker: 'You', text }];
          const { newUserSummary } = await updateSummaries(updatedUser, aiTranscripts, text, "");
          const accumulatedUserSummary = [...userSummaryPoints, ...newUserSummary];
          await saveDebateProgress(updatedUser, aiTranscripts, accumulatedUserSummary, aiSummaryPoints);
        } catch (e) {
          console.error("Error saving final transcript:", e);
        }
      }
      speakSessionRef.current += 1;
      prefetchCacheRef.current.clear();
      try { 
        if (currentSourceRef.current) {
          currentSourceRef.current.onended = null;
          currentSourceRef.current.stop(); 
          currentSourceRef.current = null;
        }
      } catch(e) {}
      try {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch(e) {}
      audioContextRef.current = null;
      setIsSpeaking(false); setCaptionLines([]); setIsMuted(true);
      navigate('/Aijudge');
    }
  };

  // ── TTS Fetch + Decode helper ──
  const fetchTTSBuffer = async (text) => {
    const ttsRes = await axios.post(url + '/api/tts', {
      text,
      speaker: 'manisha',
      voicePlan: voicePlanRef.current,
      email
    });
    return playBase64Audio(ttsRes.data.audioBase64);
  };

  // ── Pre-fetch next line while current plays ──
  const prefetchLine = (lines, nextIndex) => {
    if (nextIndex >= lines.length) return;
    const nextLine = lines[nextIndex].replace(/[*#]/g, '');
    const cacheKey = `${nextIndex}_${nextLine.substring(0, 30)}`;
    if (!prefetchCacheRef.current.has(cacheKey)) {
      const promise = fetchTTSBuffer(nextLine).catch(() => null);
      prefetchCacheRef.current.set(cacheKey, promise);
    }
  };

  // ── TTS Playback with session guard (prevents overlap) ──
  const speakCaptionLines = async (lines, index, sessionId) => {
    if (!isMounted.current || index >= lines.length || sessionId !== speakSessionRef.current) {
      if (sessionId === speakSessionRef.current) {
        setIsSpeaking(false);
        prefetchCacheRef.current.clear();
      }
      return;
    }
    const line = lines[index].replace(/[*#]/g, '');
    setCaptionLineIndex(index); setHighlightedWordIndex(0);
    try {
      setIsSpeaking(true);
      const cacheKey = `${index}_${line.substring(0, 30)}`;
      let audioBuffer;
      if (prefetchCacheRef.current.has(cacheKey)) {
        audioBuffer = await prefetchCacheRef.current.get(cacheKey);
        prefetchCacheRef.current.delete(cacheKey);
      } else {
        audioBuffer = await fetchTTSBuffer(line);
      }
      // Session may have changed while awaiting fetch
      if (sessionId !== speakSessionRef.current) { setIsSpeaking(false); return; }
      if (!audioBuffer) { speakCaptionLines(lines, index + 1, sessionId); return; }
      prefetchLine(lines, index + 1);
      const ctx = await getAudioCtx();
      // Stop any previous source before starting new one
      try { if (currentSourceRef.current) { currentSourceRef.current.onended = null; currentSourceRef.current.stop(); } } catch(e) {}
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer; source.connect(ctx.destination);
      currentSourceRef.current = source;
      const words = line.split(' ');
      const durationPerWord = (audioBuffer.duration || 1) * 1000 / Math.max(words.length, 1);
      let wi = 0;
      const interval = setInterval(() => { setHighlightedWordIndex(wi++); if (wi >= words.length) clearInterval(interval); }, durationPerWord);
      // Fallback timeout: if onended never fires (AudioContext suspended), advance anyway
      const fallbackMs = (audioBuffer.duration || 3) * 1000 + 3000;
      let advanced = false;
      const fallbackTimer = setTimeout(() => {
        if (!advanced && sessionId === speakSessionRef.current) {
          advanced = true;
          clearInterval(interval);
          currentSourceRef.current = null;
          speakCaptionLines(lines, index + 1, sessionId);
        }
      }, fallbackMs);
      source.onended = () => {
        if (!advanced) {
          advanced = true;
          clearTimeout(fallbackTimer);
          clearInterval(interval);
          currentSourceRef.current = null;
          speakCaptionLines(lines, index + 1, sessionId);
        }
      };
      source.start();
    } catch (err) { console.error('❌ TTS Error:', err); speakCaptionLines(lines, index + 1, sessionId); }
  };

  // ── Summary: APPEND new points each round (don't replace) ──
  const updateSummaries = async (userData, aiData, latestUserText, latestAiText) => {
    try {
      const res = await axios.post(url + '/api/summarize-transcripts', {
        userTranscripts: [{ text: latestUserText }],
        aiTranscripts: [{ text: latestAiText }],
      });
      if (!res.data) return { newUserSummary: [], newAiSummary: [] };

      // Parse safely — handle both string and array responses
      const parsePoints = (raw) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.filter(p => p && p.trim());
        return raw.split('\n').map(p => p.trim()).filter(p => p);
      };

      const newUserPoints = parsePoints(res.data.userSummary);
      const newAiPoints = parsePoints(res.data.aiSummary);

      // Append — don't replace — so all rounds accumulate
      if (newUserPoints.length) setUserSummaryPoints(prev => [...prev, ...newUserPoints]);
      if (newAiPoints.length) setAISummaryPoints(prev => [...prev, ...newAiPoints]);

      return { newUserSummary: newUserPoints, newAiSummary: newAiPoints };
    } catch (err) {
      console.error('Summary error:', err);
      return { newUserSummary: [], newAiSummary: [] };
    }
  };

  const saveDebateProgress = async (updatedUser, updatedAI, accumulatedUserSummary, accumulatedAiSummary) => {
    if (!latestKey || !email) return;
    try {
      await axios.post(url + '/api/save-transcripts', {
        email, topicKey: latestKey, userRole: userRole.toLowerCase(),
        userTranscripts: updatedUser.map(t => t.text), aiTranscripts: updatedAI.map(t => t.text),
        userSummary: accumulatedUserSummary || userSummaryPoints, aiSummary: accumulatedAiSummary || aiSummaryPoints, userStance,
      });
    } catch (err) { console.error('❌ Save failed:', err); }
  };

  // ── Speech Recognition — only restart when mute state changes ──
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    // Stop any existing instance before creating a new one
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    if (isMuted) return; // Don't start recognition when muted
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    recognitionRef.current = rec;
    let finalAccum = '';
    rec.onresult = event => {
      let final = '', interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        event.results[i].isFinal ? final += t + ' ' : interim += t + ' ';
      }
      if (final) {
        finalAccum += final;
        setCurrentUserTranscript(prev => prev + final);
      }
      setUserCaption((finalAccum + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech') return; // ignore — will auto-restart
      console.warn('SR error:', e.error);
      // For network errors, try restarting after a short delay
      if (e.error === 'network') {
        setTimeout(() => {
          if (!isMuted && recognitionRef.current === rec) {
            try { rec.start(); } catch (_) {}
          }
        }, 1000);
      }
    };
    rec.onend = () => {
      // Auto-restart if still unmuted (handles browser auto-stop)
      if (!isMuted && recognitionRef.current === rec) {
        try { rec.start(); } catch(e) {}
      }
    };
    try { rec.start(); } catch(e) { console.warn('SR start failed:', e); }
    return () => { try { rec.stop(); } catch(e) {} recognitionRef.current = null; };
  }, [isMuted]);

  useEffect(() => {
    if (!videoRef.current) return;
    isSpeaking ? videoRef.current.play().catch(() => { }) : videoRef.current.pause();
  }, [isSpeaking]);

  // ── Caption words renderer ──────────────────────────────────
  const renderAICaption = () => {
    if (!isSpeaking || captionLines.length === 0) return null;
    return (
      <div className="gm-caption-line gm-caption-ai">
        <span className="gm-caption-speaker">AI</span>
        <span>
          {captionLines[captionLineIndex].split(' ').map((word, idx) => {
            let dw = word.replace(/[*#]/g, '');
            if (dw.replace(/[^a-zA-Z]/g, '').toLowerCase() === 'important') dw = toBoldItalic(dw);
            return (
              <span key={idx} style={{
                color: idx === highlightedWordIndex ? '#fbbf24' : '#fff',
                fontWeight: idx === highlightedWordIndex ? 'bold' : 'normal',
                marginRight: '4px',
              }}>{dw}</span>
            );
          })}
        </span>
      </div>
    );
  };

  // ── Summary points renderer (clean grouped look) ──────────
  const renderSummaryPoints = (points, isAI) => {
    if (points.length === 0) {
      return (
        <li className="gm-empty-state" style={{ listStyle: 'none' }}>
          {isAI ? "AI hasn't responded yet." : 'Start speaking to see points.'}
        </li>
      );
    }
    return points.map((pt, idx) => (
      <li key={idx} style={{ listStyle: 'none', marginBottom: '8px', padding: '8px 12px', borderRadius: '8px', background: isAI ? 'rgba(168,85,247,0.08)' : 'rgba(52,211,153,0.08)', borderLeft: `3px solid ${isAI ? '#a855f7' : '#34d399'}`, fontSize: '13px', lineHeight: '1.5', color: 'rgba(255,255,255,0.9)' }}>
        <span style={{ color: isAI ? '#a855f7' : '#34d399', marginRight: '6px', fontWeight: 700 }}>▸</span>
        {highlightImportant(pt.replace(/^[-•\d.]\s*/, ''))}
      </li>
    ));
  };

  const renderAICaptionDesktop = () => {
    if (!isSpeaking || captionLines.length === 0) return null;
    return (
      <>
        AI:{' '}
        {captionLines[captionLineIndex].split(' ').map((word, idx) => {
          let dw = word.replace(/[*#]/g, '');
          if (dw.replace(/[^a-zA-Z]/g, '').toLowerCase() === 'important') dw = toBoldItalic(dw);
          return (
            <span key={idx} style={{
              color: idx === highlightedWordIndex ? 'yellow' : 'white',
              fontWeight: idx === highlightedWordIndex ? 'bold' : 'normal',
              marginRight: '4px',
            }}>{dw}</span>
          );
        })}
      </>
    );
  };

  // ── Thinking dots component ────────────────────────────────
  const ThinkingDots = () => (
    <div className="thinking-overlay">
      <div className="thinking-dots">
        <span></span><span></span><span></span>
      </div>
      <p className="thinking-label">AI is thinking…</p>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────
  if (!isMobileMode) {
    const isUserProp = (userStance || '').toLowerCase() === 'proposition';
    return (
      <div className="arina-container">
        {/* Timer — top left corner on desktop */}
        <div className="desktop-timer-badge">
          <span className="desktop-timer-icon">🎤</span>
          <span>{isThinking ? 'Thinking…' : isMuted ? 'Ready' : 'Listening'}</span>
        </div>

        {/* Voice Plan indicator — read-only, controlled from NavBar */}
        {/* (Toggle is in the sidebar NavigationBar only) */}

        <h3 className="debate-topic-heading">
          Topic: <span className="debate-topic-title">{debateTopic}</span>
        </h3>

        <div className="arina-center">
          <div className="avatar-container" style={{ position: 'relative' }}>
            <video ref={videoRef} className="speaking-video" src="/girl1.mp4" loop muted playsInline />
            {isSpeaking && <div className="gm-speaking-ring" />}
            {isThinking && <ThinkingDots />}
          </div>
          <div className="line-divider"></div>
          <br />
        </div>

        <div className={`transcript-panel left-panel ${showTranscript ? 'open' : ''}`}>
          <div className="panel-header">
            <span className="panel-title">Proposition Summary</span>
            <button onClick={() => setShowTranscript(false)} className="close-btn">×</button>
          </div>
          <div className="panel-body">
            <ul style={{ padding: 0 }}>
              {renderSummaryPoints(isUserProp ? userSummaryPoints : aiSummaryPoints, !isUserProp)}
            </ul>
          </div>
        </div>

        <div className={`transcript-panel right-panel ${showTranscript ? 'open' : ''}`}>
          <div className="panel-header">
            <span className="panel-title">Opposition Summary</span>
            <button onClick={() => setShowTranscript(false)} className="close-btn">×</button>
          </div>
          <div className="panel-body">
            <ul style={{ padding: 0 }}>
              {renderSummaryPoints(isUserProp ? aiSummaryPoints : userSummaryPoints, isUserProp)}
            </ul>
          </div>
        </div>

        {showCaptions && (
          <div className="caption-line global-caption">
            {!isMuted && userCaption && `You: ${userCaption}`}
            {renderAICaptionDesktop()}
          </div>
        )}

        <div className="control-bar-wrapper">
          <div className="control-bar">
            <button onClick={toggleMute} className={`circle-button ${!isMuted ? 'speaking' : 'ready'}`}>
              {isMuted ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
            </button>
            <button onClick={() => setShowTranscript(t => !t)} className={`circle-button ${showTranscript ? 'active' : ''}`}>
              <FileText size={20} color="#fff" />
            </button>
            <button onClick={() => setShowCaptions(c => !c)} className={`circle-button ${showCaptions ? 'active' : ''}`}>CC</button>
            {/* Voice Plan Toggle — right here in the control bar */}
            <button
              onClick={toggleVoicePlan}
              className="circle-button"
              title={`Voice: ${voicePlanDisplay} — click to switch`}
              style={{
                background: voicePlanDisplay === 'Pro' ? 'rgba(168,85,247,0.35)' : 'rgba(251,191,36,0.35)',
                border: voicePlanDisplay === 'Pro' ? '1.5px solid #a855f7' : '1.5px solid #fbbf24',
                color: voicePlanDisplay === 'Pro' ? '#c084fc' : '#fbbf24',
                fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px',
                boxShadow: voicePlanDisplay === 'Pro' ? '0 0 8px rgba(168,85,247,0.4)' : '0 0 8px rgba(251,191,36,0.4)'
              }}
            >
              {voicePlanDisplay === 'Pro' ? '⚡PRO' : '💡LITE'}
            </button>
            <button onClick={handleHangUp} className="circle-button hangup-button">
              <PhoneOff size={20} color="#fff" />
            </button>
            <button onClick={testTTS} className="circle-button" style={{ background: '#10b981' }} title="Test AI Voice">
              <Volume2 size={20} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout
  const isUserPropMobile = (userStance || '').toLowerCase() === 'proposition';
  return (
    <div className="gm-container">
      <div className="gm-topic-bar">
        <span className="gm-topic-label">Topic</span>
        <span className="gm-topic-text">{debateTopic}</span>
        {userStance && (
          <span className="gm-stance-badge">
            You: {userStance.charAt(0).toUpperCase() + userStance.slice(1)}
          </span>
        )}
        {/* Voice plan badge — display only, toggle is in NavBar */}
      </div>

      <div className="gm-main-row">
        <div className="gm-stage">
          <div className="gm-video-wrapper">
            <video ref={videoRef} className="gm-video" src="/girl1.mp4" loop muted playsInline />
            {isSpeaking && <div className="gm-speaking-ring" />}
            {isThinking && (
              <div className="thinking-overlay-mobile">
                <div className="thinking-dots-sm">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="gm-side-panel">
          <div className="gm-info-section">
            <div className="gm-info-title">
              {isUserPropMobile ? 'Opposition Summary' : 'Proposition Summary'}
            </div>
            <ul className="gm-points-list">
              {aiSummaryPoints.length === 0
                ? <li className="gm-empty-state">No points yet.</li>
                : aiSummaryPoints.map((pt, i) => (
                  <li key={i} className={`gm-point-item ${isUserPropMobile ? 'gm-point-ai' : ''}`}>
                    <span className="gm-point-bullet">▸</span>
                    {pt.replace(/^[-•\d.]\s*/, '')}
                  </li>
                ))
              }
            </ul>
          </div>
          <div className="gm-panel-controls">
            <button onClick={toggleMute} className={`gm-ctrl-btn ${!isMuted ? 'gm-btn-active' : 'gm-btn-muted'}`} title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            <button onClick={() => setShowCaptions(s => !s)} className={`gm-ctrl-btn ${showCaptions ? 'gm-btn-active' : ''}`} title="Captions">
              <MessageSquare size={17} />
            </button>
            {/* Voice Plan Toggle — mobile */}
            <button
              onClick={toggleVoicePlan}
              className="gm-ctrl-btn"
              title={`Voice: ${voicePlanDisplay}`}
              style={{
                background: voicePlanDisplay === 'Pro' ? 'rgba(168,85,247,0.35)' : 'rgba(251,191,36,0.35)',
                border: voicePlanDisplay === 'Pro' ? '1.5px solid #a855f7' : '1.5px solid #fbbf24',
                color: voicePlanDisplay === 'Pro' ? '#c084fc' : '#fbbf24',
                fontSize: '8px', fontWeight: 800
              }}
            >
              {voicePlanDisplay === 'Pro' ? '⚡' : '💡'}
            </button>
            <button onClick={testTTS} className="gm-ctrl-btn gm-btn-test" title="Test Voice">
              <Volume2 size={17} />
            </button>
          </div>
        </div>

        <div className="gm-sidebar">
          {/* Voice Plan Toggle — mobile sidebar */}
          <button
            onClick={toggleVoicePlan}
            className="gm-nav-btn"
            title={`Voice: ${voicePlanDisplay}`}
            style={{
              background: voicePlanDisplay === 'Pro' ? 'rgba(168,85,247,0.2)' : 'rgba(251,191,36,0.2)',
              borderColor: voicePlanDisplay === 'Pro' ? 'rgba(168,85,247,0.5)' : 'rgba(251,191,36,0.5)',
              color: voicePlanDisplay === 'Pro' ? '#c084fc' : '#fbbf24'
            }}
          >
            {voicePlanDisplay === 'Pro' ? '⚡' : '💡'}
          </button>
          <button onClick={() => navigate('/overview')} className="gm-nav-btn" title="Dashboard">
            <Home size={17} />
          </button>
          <button onClick={() => navigate('/overview/playground')} className="gm-nav-btn" title="Playground">
            <Compass size={17} />
          </button>
          <button onClick={() => navigate('/overview/ranking')} className="gm-nav-btn" title="Ranking">
            <Trophy size={17} />
          </button>
          <button onClick={handleHangUp} className="gm-nav-btn" style={{ background: 'rgba(220,38,38,0.2)', borderColor: 'rgba(220,38,38,0.5)' }} title="End">
            <PhoneOff size={17} />
          </button>
        </div>
      </div>

      {showCaptions && (
        <div className="gm-caption-bar">
          <div className="gm-caption-overlay">
            {!isMuted && userCaption && (
              <div className="gm-caption-line gm-caption-user">
                <span className="gm-caption-speaker">You</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userCaption}</span>
              </div>
            )}
            {renderAICaption()}
            {!isSpeaking && !userCaption && (
              <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px' }}>
                {isThinking ? '⏳ AI thinking…' : isMuted ? 'Tap mic to speak...' : 'Listening...'}
              </span>
            )}
          </div>
          {debateType && (
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', background: 'rgba(168,85,247,0.2)', color: '#c084fc', borderRadius: '10px', border: '1px solid rgba(168,85,247,0.3)', flexShrink: 0, marginLeft: 'auto' }}>
              {debateType.toUpperCase()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Arina;