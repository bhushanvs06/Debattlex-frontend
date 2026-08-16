import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, MessageSquare } from 'lucide-react';
import './Mentor.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const url = process.env.React_App_url;

const Mentor = () => {
  const [email, setEmail] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);   // true = mic recording
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voicePlan, setVoicePlan] = useState('Pro');
  const [userCaption, setUserCaption] = useState('');
  const [captionLines, setCaptionLines] = useState([]);
  const [captionLineIndex, setCaptionLineIndex] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(0);
  const [statusLabel, setStatusLabel] = useState('Connecting...');
  // eslint-disable-next-line no-unused-vars
  const [hasGreeted, setHasGreeted] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [mentorNotes, setMentorNotes] = useState([]);

  // Video call redesign states
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Refs — never trigger re-renders
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const currentSourceRef = useRef(null);
  const videoRef = useRef(null);
  const isMounted = useRef(true);
  const speakerIndexRef = useRef(0);
  const accumulatedRef = useRef('');   // accumulates final transcript without re-render loops
  const interimRef = useRef('');
  const emailRef = useRef('');
  const voicePlanRef = useRef('Pro');

  const navigate = useNavigate();

  // Keep refs in sync
  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { voicePlanRef.current = voicePlan; }, [voicePlan]);

  // ─── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    const localSpeakerIndexRef = speakerIndexRef;
    return () => {
      isMounted.current = false;
      localSpeakerIndexRef.current++;
      stopRecognition();
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auth check ──────────────────────────────────────────────────
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (!storedEmail) {
      alert('Please log in again.');
      navigate('/login');
      return;
    }
    setEmail(storedEmail);

    // Fetch initial mentor notes
    axios.get(url + '/api/mentor-notes')
      .then(res => {
        setMentorNotes(res.data.mentorNotes || []);
      })
      .catch(err => {
        console.warn("Failed to fetch initial mentor notes:", err);
      });
  }, [navigate]);

  // ── Start call only when user clicks the start button ───────────────────
  const handleStartCall = async () => {
    if (!email) return;
    setIsCallStarted(true);
    setHasGreeted(true);

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    // Do NOT play any starting greeting audio/TTS. Start listening immediately!
    accumulatedRef.current = '';
    interimRef.current = '';
    setUserCaption('');
    setChatHistory([]);
    setCaptionLines([]);

    const rec = buildRecognition();
    if (rec) {
      recognitionRef.current = rec;
      try { rec.start(); } catch (_) { }
    }
    setIsMicOn(true);
    setStatusLabel('Listening... click mic to send');
  };

  // ─── Video sync with speaking ────────────────────────────────────
  useEffect(() => {
    if (!videoRef.current) return;
    if (isSpeaking) {
      videoRef.current.play().catch(() => { });
    } else {
      videoRef.current.pause();
    }
  }, [isSpeaking]);

  // ─── Helpers ─────────────────────────────────────────────────────
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const stopAudio = () => {
    if (currentSourceRef.current) {
      try { currentSourceRef.current.onended = null; currentSourceRef.current.stop(); } catch (_) { }
      currentSourceRef.current = null;
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) { }
    }
  };

  // ─── Build recognition object (once) ────────────────────────────
  const buildRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let finalChunk = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += t + ' ';
        } else {
          interim += t;
        }
      }
      if (finalChunk) accumulatedRef.current += finalChunk;
      interimRef.current = interim;
      setUserCaption((accumulatedRef.current + interim).trim());
    };

    // Auto-restart recognition if it stops while mic is still ON
    rec.onend = () => {
      if (isMounted.current && recognitionRef.current === rec) {
        // Only restart if we haven't stopped intentionally
        // We signal intentional stop by setting recognitionRef.current = null first
        try { rec.start(); } catch (_) { }
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return; // ignore — will auto-restart
      console.warn('Recognition error:', e.error);
    };

    return rec;
  }, []);

  // ─── Toggle Mic ──────────────────────────────────────────────────
  const toggleMic = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    if (!isMicOn) {
      // ── START LISTENING ──
      // If AI is speaking, stop it first
      if (isSpeaking) {
        speakerIndexRef.current++;
        stopAudio();
        setIsSpeaking(false);
        setCaptionLines([]);
      }

      accumulatedRef.current = '';
      interimRef.current = '';
      setUserCaption('');
      setStatusLabel('Listening... click again to send');

      const rec = buildRecognition();
      if (rec) {
        recognitionRef.current = rec;
        try { rec.start(); } catch (_) { }
      }
      setIsMicOn(true);

    } else {
      // ── STOP LISTENING & SEND ──
      // Mark recognition as intentionally stopped
      const rec = recognitionRef.current;
      recognitionRef.current = null;  // prevent auto-restart in onend
      if (rec) try { rec.stop(); } catch (_) { }

      const text = (accumulatedRef.current + interimRef.current).trim();
      accumulatedRef.current = '';
      interimRef.current = '';
      setIsMicOn(false);

      if (!text) {
        setStatusLabel('Nothing heard. Click mic to try again.');
        return;
      }

      setUserCaption(text);
      const updatedHistory = [...chatHistory, { role: 'user', content: text }];
      setChatHistory(updatedHistory);
      await sendToMentor(text, updatedHistory);
    }
  };

  // ─── Fast base64 decoder (10x faster on low-end devices) ────────
  const fastBase64ToBuffer = (b64) => {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf.buffer;
  };

  // ─── Fire a single TTS request, return base64 or null ────────────
  const fetchMentorTTS = async (text) => {
    try {
      const res = await axios.post(url + '/api/tts', {
        text,
        speaker: 'ritu',
        voicePlan: voicePlanRef.current,
        role: 'ai_1v1',
        email: emailRef.current,
      });
      return res.data?.audioBase64 || null;
    } catch { return null; }
  };

  // ─── Send text to AI mentor ──────────────────────────────────────
  const sendToMentor = async (text, currentHistory = chatHistory) => {
    try {
      setIsThinking(true);
      setStatusLabel('Mentor is thinking...');

      const aiRes = await axios.post(url + '/api/mentor-chat', {
        question: text,
        chatHistory: currentHistory
      });
      const aiText = (aiRes.data.response || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/[*#]/g, '')
        .trim();

      if (aiRes.data.mentorNotes) {
        setMentorNotes(aiRes.data.mentorNotes);
      }

      if (!aiText) {
        setIsThinking(false);
        setStatusLabel('Click mic to speak');
        return;
      }

      // Add AI response to conversation history
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiText }]);

      // Split into natural sentences
      const lines = aiText
        .split(/(?<=[.?!])\s+/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

      setCaptionLines(lines);
      setCaptionLineIndex(0);
      setHighlightedWordIndex(0);
      setIsThinking(false);
      setStatusLabel('Mentor is speaking...');

      const expectedIndex = ++speakerIndexRef.current;

      // 🚀 Kick off ALL sentences' TTS in parallel immediately
      const audioCache = {};
      lines.forEach((ln, i) => {
        audioCache[i] = fetchMentorTTS(ln.replace(/[*#]/g, '').trim());
      });
      // Await line 0 so playback starts instantly
      audioCache[0] = await audioCache[0];

      // Start speaking — remaining lines resolve in the background
      await speakLines(lines, 0, expectedIndex, audioCache);

    } catch (err) {
      console.error('Mentor chat error:', err);
      setIsThinking(false);
      setStatusLabel('Error — click mic to try again');
    }
  };

  // ─── Parallel-cache TTS playback ────────────────────────────────
  const speakLines = async (lines, index, expectedIndex, audioCache = {}) => {
    // Stop if unmounted, stale session, or past the end of lines
    if (!isMounted.current || index >= lines.length || speakerIndexRef.current !== expectedIndex) {
      if (speakerIndexRef.current === expectedIndex && index >= lines.length) {
        // All lines done — auto-start mic so user can speak immediately
        setIsSpeaking(false);
        setCaptionLines([]);
        accumulatedRef.current = '';
        interimRef.current = '';
        setUserCaption('');
        setStatusLabel('Your turn — listening...');
        const rec = buildRecognition();
        if (rec) {
          recognitionRef.current = rec;
          try { rec.start(); } catch (_) { }
        }
        setIsMicOn(true);
      } else if (speakerIndexRef.current === expectedIndex) {
        setIsSpeaking(false);
        setStatusLabel('Click mic to speak');
        setCaptionLines([]);
      }
      return;
    }

    const line = lines[index].replace(/[*#]/g, '').trim();
    if (!line) {
      speakLines(lines, index + 1, expectedIndex, audioCache);
      return;
    }

    setCaptionLineIndex(index);
    setHighlightedWordIndex(0);
    setIsSpeaking(true);

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      // Await the pre-fetched promise (or resolved value) from cache
      let b64 = audioCache[index] instanceof Promise
        ? await audioCache[index]
        : audioCache[index];

      // Fallback: fetch live if cache missed
      if (!b64 || b64.length < 100) {
        b64 = await fetchMentorTTS(line);
      }

      if (!b64 || b64.length < 100) {
        // Skip silently to next line
        speakLines(lines, index + 1, expectedIndex, audioCache);
        return;
      }

      if (speakerIndexRef.current !== expectedIndex) return;

      // Fast decode
      const audioBuffer = await ctx.decodeAudioData(fastBase64ToBuffer(b64));
      if (speakerIndexRef.current !== expectedIndex) return;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentSourceRef.current = source;

      // Word highlight timing
      const words = line.split(' ');
      const msPerWord = (audioBuffer.duration * 1000) / Math.max(words.length, 1);
      let wi = 0;
      const interval = setInterval(() => {
        setHighlightedWordIndex(wi++);
        if (wi >= words.length) clearInterval(interval);
      }, msPerWord);

      source.onended = () => {
        clearInterval(interval);
        currentSourceRef.current = null;
        if (speakerIndexRef.current === expectedIndex) {
          const isLastLine = index + 1 >= lines.length;
          if (isLastLine) {
            // 🎤 Mentor finished speaking — auto-activate mic
            setIsSpeaking(false);
            setCaptionLines([]);
            accumulatedRef.current = '';
            interimRef.current = '';
            setUserCaption('');
            setStatusLabel('Your turn — listening...');
            const rec = buildRecognition();
            if (rec) {
              recognitionRef.current = rec;
              try { rec.start(); } catch (_) { }
            }
            setIsMicOn(true);
          } else {
            speakLines(lines, index + 1, expectedIndex, audioCache);
          }
        } else {
          setIsSpeaking(false);
          setStatusLabel('Click mic to speak');
        }
      };

      source.start();
    } catch (err) {
      console.error('TTS error:', err);
      if (speakerIndexRef.current === expectedIndex) {
        speakLines(lines, index + 1, expectedIndex, audioCache);
      }
    }
  };

  // ─── Test voice ──────────────────────────────────────────────────
  const testTTS = async () => {
    const greeting = "Hello! I am your personal AI debate mentor. I'm here to help you grow and become a stronger debater!";
    setCaptionLines([greeting]);
    setCaptionLineIndex(0);
    setStatusLabel('Playing test voice...');
    const idx = ++speakerIndexRef.current;
    const b64 = await fetchMentorTTS(greeting);
    await speakLines([greeting], 0, idx, { 0: b64 });
  };

  // ─── Hang up ─────────────────────────────────────────────────────
  const handleHangUp = () => {
    if (window.confirm('Leave the mentor session?')) {
      speakerIndexRef.current++;
      stopRecognition();
      recognitionRef.current = null;
      stopAudio();
      setIsSpeaking(false);
      setIsMicOn(false);
      setCaptionLines([]);
      navigate('/overview');
    }
  };

  if (!isCallStarted) {
    return (
      <div className="mentor-container call-prep-screen">
        <h3 className="mentor-topic-heading">
          Your Personal <span className="mentor-topic-title">AI Mentor</span>
        </h3>

        <div className="mentor-welcome-card call-prep-card">
          <div className="mentor-welcome-icon call-prep-avatar">👤</div>
          <h2 className="mentor-welcome-title">AI Coaching Session</h2>
          <p className="mentor-welcome-subtitle">
            Connect with your friendly AI Mentor for active voice coaching, real-time debates, and speech metrics in a high-fidelity video call environment.
          </p>
          <div className="call-prep-controls">
            <button onClick={handleStartCall} className="mentor-start-call-btn join-call-btn">
              Join Call
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mentor-container call-active-screen ${isChatOpen ? 'drawer-expanded' : ''}`}>
      {/* 🚀 Main Video Call Canvas */}
      <div className="mentor-call-stage">

        {/* Call status banner */}
        <div className="meet-status-banner">
          <span className="meet-room-name">✦ AI MENTOR CALL</span>
          <span className="meet-badge-dot" />
          <span className="meet-room-status">{statusLabel}</span>
        </div>

        {/* Call Grid holding primary and user tiles */}
        <div className="meet-call-grid">

          {/* AI Mentor Remote Tile */}
          <div className={`meet-video-tile mentor-tile ${isSpeaking ? 'speaking-active' : ''}`}>
            <video ref={videoRef} className="menspeaking-video" src="/girl1.mp4" loop muted playsInline />

            {/* Status indicator pill on tile */}
            <div className="tile-badge-top-left">
              <span className={`status-dot status-${isThinking ? 'thinking' : isSpeaking ? 'speaking' : isMicOn ? 'listening' : 'idle'}`} />
              <span className="tile-badge-text">
                {isThinking ? 'Mentor formulating thoughts...' : isSpeaking ? 'Mentor speaking...' : isMicOn ? 'Listening to you...' : 'Connected'}
              </span>
            </div>

            <div className="tile-badge-bottom-left">
              <span>✦ AI Mentor</span>
            </div>

            {/* Overlaid Closed Captions (Subtitles) inside Video Frame */}
            {isSpeaking && captionLines.length > 0 && (
              <div className="mentor-closed-captions">
                <span className="closed-captions-label">Mentor: </span>
                <span className="closed-captions-text">
                  {captionLines[captionLineIndex]?.split(' ').map((word, idx) => (
                    <span
                      key={idx}
                      style={{
                        color: idx === highlightedWordIndex ? '#fbbf24' : 'rgba(255, 255, 255, 0.95)',
                        fontWeight: idx === highlightedWordIndex ? 'bold' : 'normal',
                        marginRight: '4px',
                        transition: 'color 0.08s ease'
                      }}
                    >
                      {word.replace(/[*#]/g, '')}
                    </span>
                  ))}
                </span>
              </div>
            )}

            {/* User Live Spoken Caption Overlay inside AI Video Frame */}
            {isMicOn && userCaption && (
              <div className="user-closed-captions">
                <span className="user-captions-label">🎙 You: </span>
                <span className="user-captions-text">{userCaption}</span>
              </div>
            )}

            {/* Thinking brain animation inside Video Frame */}
            {isThinking && (
              <div className="tile-thinking-overlay">
                <div className="thought-bubble-chain">
                  <div className="thought-dot dot-1" />
                  <div className="thought-dot dot-2" />
                  <div className="thought-dot dot-3" />
                  <div className="thought-cloud">
                    <div className="thought-cloud-inner">
                      <div className="brain-icon">🧠</div>
                      <div className="thinking-label">Mentor is preparing speech...</div>
                      <div className="thinking-wave">
                        <span /><span /><span /><span /><span />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="thinking-ring" />
              </div>
            )}
          </div>

          {/* User Self-View PIP Tile (Frosted Glass Profile Card with Voice Pulse) */}
          <div className={`meet-video-tile user-pip-tile ${isMicOn && !isSpeaking && !isThinking ? 'speaking-active' : ''}`}>
            <div className="user-avatar-fallback">
              <div className="fallback-initial">
                <span>{email ? email.substring(0, 2).toUpperCase() : 'ME'}</span>
              </div>
              {isMicOn && !isSpeaking && !isThinking && (
                <div className="user-voice-pulsing-rings">
                  <span className="pulse-ring ring-1" />
                  <span className="pulse-ring ring-2" />
                  <span className="pulse-ring ring-3" />
                </div>
              )}
            </div>
            <div className="tile-badge-bottom-left mini-badge">
              <span>You (Bhushan)</span>
            </div>
          </div>
        </div>

        {/* ── Control Bar Wrapper ── */}
        <div className="meet-control-bar-wrapper">
          <div className="meet-control-bar">
            {/* Lite/Pro Voice Plan Pill Badge */}
            <button
              onClick={() => setVoicePlan(v => v === 'Pro' ? 'Lite' : 'Pro')}
              className={`meet-pill-btn ${voicePlan === 'Pro' ? 'plan-pro' : 'plan-lite'}`}
              title={`Switch to ${voicePlan === 'Pro' ? 'Lite (Bulbul v2)' : 'Pro (Bulbul v3)'}`}
            >
              {voicePlan === 'Pro' ? '✦ Pro (V3)' : '◇ Lite (V2)'}
            </button>

            <span className="meet-divider" />

            {/* Mic Toggle Button */}
            <button
              onClick={toggleMic}
              className={`meet-circle-btn ${isMicOn ? 'mic-active' : 'mic-muted'}`}
              title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            {/* Chat/Transcript Toggle Button */}
            <button
              onClick={() => setIsChatOpen(o => !o)}
              className={`meet-circle-btn chat-toggle-btn ${isChatOpen ? 'chat-active' : 'chat-inactive'}`}
              title="Toggle meeting drawer"
            >
              <MessageSquare size={20} />
            </button>

            {/* Voice Tester Button */}
            <button
              onClick={testTTS}
              className="meet-circle-btn test-voice-btn"
              title="Test Voice Quality"
            >
              <Volume2 size={20} />
            </button>

            <span className="meet-divider" />

            {/* Hangup Red Button */}
            <button
              onClick={handleHangUp}
              className="meet-circle-btn meet-hangup-btn"
              title="Leave call"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Slideable Sidebar Insights Panel (Google Meet style) ── */}
      <div className={`meet-insights-drawer ${isChatOpen ? 'drawer-open' : ''}`}>
        <div className="drawer-header">
          <h4 className="drawer-title">Coaching & Live Logs</h4>
          <button onClick={() => setIsChatOpen(false)} className="drawer-close-btn">&times;</button>
        </div>

        <div className="drawer-body">
          {/* Coaching notes section */}
          <div className="drawer-section notes-section">
            <h5 className="section-title">Saved Insights</h5>
            <div className="section-content">
              {mentorNotes.length === 0 ? (
                <div>
                  <p className="insights-empty-text" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: '12px' }}>
                    No long-term insights saved yet.
                  </p>
                  <ul className="insights-list">
                    <li className="insight-bullet">🌱 Active Voice Coaching session</li>
                    <li className="insight-bullet">🔊 Synthesis: {voicePlan === 'Pro' ? 'Sarvam Bulbul V3 (Pro)' : 'Sarvam Bulbul V2 (Lite)'}</li>
                  </ul>
                </div>
              ) : (
                <ul className="insights-list">
                  {mentorNotes.map((note, idx) => (
                    <li key={idx} className="insight-bullet" style={{ color: '#e8e0ff', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '8px' }}>
                      💡 {note}
                    </li>
                  ))}
                  <li className="insight-bullet" style={{ opacity: 0.6 }}>🌱 Call session active</li>
                </ul>
              )}
            </div>
          </div>

          {/* Transcript logs section */}
          <div className="drawer-section logs-section">
            <h5 className="section-title">Live Call Transcript</h5>
            <div className="section-content transcript-list">
              {chatHistory.length === 0 ? (
                <p className="transcript-empty-text">Say something to populate the transcript logs.</p>
              ) : (
                chatHistory.map((msg, index) => (
                  <div key={index} className={`meet-chat-msg ${msg.role}`}>
                    <span className="msg-sender">{msg.role === 'user' ? 'You' : 'AI Mentor'}</span>
                    <div className="msg-bubble">
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mentor;
