import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import YouTube from 'react-youtube';

const url = process.env.REACT_APP_URL || 'http://localhost:5000';

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
  if (avg >= 85) return { emoji: "🥇", label: "GOLD LEGEND", color: "#FFD700", glow: "0 0 30px #FFD70088, 0 0 60px #FFD70044" };
  if (avg >= 70) return { emoji: "🥈", label: "SILVER STAR", color: "#C0C0C0", glow: "0 0 30px #C0C0C088, 0 0 60px #C0C0C044" };
  if (avg >= 50) return { emoji: "🥉", label: "BRONZE HERO", color: "#CD7F32", glow: "0 0 30px #CD7F3288, 0 0 60px #CD7F3244" };
  return { emoji: "✅", label: "COMPLETED", color: "#4ade80", glow: "0 0 20px #4ade8044" };
};

const PronunciationJudge = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recordTime, setRecordTime] = useState(0);
  const [userProgress, setUserProgress] = useState({});
  const [todayCount, setTodayCount] = useState(0);
  const [viewMode, setViewMode] = useState("practice");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const email = localStorage.getItem("userEmail");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (email) fetchProgress(); }, []);

  useEffect(() => {
    if (result && selectedVideo && email && viewMode === "practice") {
      saveProgress(selectedVideo.videoId, result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const fetchProgress = async () => {
    try {
      const res = await axios.post(`${url}/get-user-progress`, { email });
      const progress = res.data.videoProgress || {};
      setUserProgress(progress);
      const today = new Date().toDateString();
      setTodayCount(Object.values(progress).filter(p => new Date(p.completedAt).toDateString() === today).length);
    } catch (err) {
      console.error("Progress fetch error:", err);
    }
  };

  const saveProgress = async (videoId, data) => {
    try {
      await axios.post(`${url}/save-video-progress`, {
        email, videoId,
        pronunciationScore: data.pronunciationScore || 0,
        understandingScore: data.understandingScore || 0,
        transcription: data.transcription || "",
        pronunciationFeedback: data.pronunciationFeedback || "",
        understandingFeedback: data.understandingFeedback || "",
        mistakes: data.mistakes || [],
        completedAt: Date.now()
      });
      fetchProgress();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = e => e.data.size > 0 && chunksRef.current.push(e.data);

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (webmBlob.size < 6000) {
          alert("Recording too short or silent. Speak 8+ seconds.");
          cleanup();
          return;
        }
        setLoading(true);
        try {
          const wavBlob = await convertToProperWav(webmBlob);
          await sendToServer(wavBlob);
        } catch (err) {
          alert("Audio processing failed.");
        } finally {
          setLoading(false);
          cleanup();
        }
      };

      mediaRecorder.start(200);
      setRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => setRecordTime(t => t + 0.2), 200);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  async function convertToProperWav(webmBlob) {
    const arrayBuffer = await webmBlob.arrayBuffer();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await ctx.decodeAudioData(arrayBuffer);

    const offline = new OfflineAudioContext(1, decoded.duration * 16000, 16000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();

    const sampleRate = 16000, bytesPerSample = 2;
    const dataLen = rendered.length * bytesPerSample;
    const buf = new ArrayBuffer(44 + dataLen);
    const view = new DataView(buf);

    const write = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    write(0, 'RIFF'); view.setUint32(4, 36 + dataLen, true);
    write(8, 'WAVE'); write(12, 'fmt '); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    write(36, 'data'); view.setUint32(40, dataLen, true);

    let offset = 44;
    for (let i = 0; i < rendered.length; i++) {
      const s = Math.max(-1, Math.min(1, rendered.getChannelData(0)[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([buf], { type: 'audio/wav' });
  }

  async function sendToServer(wavBlob) {
    const formData = new FormData();
    formData.append('audio', wavBlob, 'speech.wav');
    formData.append('summary', selectedVideo.summary);

    try {
      const res = await axios.post(`${url}/evaluate-pronunciation-and-understanding`, formData);
      setResult(res.data);
    } catch (err) {
      alert("Evaluation failed – check server.");
      console.error(err);
    }
  }

  const toggleRecording = () => {
    if (loading) return;
    recording ? stopRecording() : startRecording();
  };

  const handleVideoSelect = (video) => {
    const prog = userProgress[video.videoId];
    setSelectedVideo(video);
    if (prog) {
      setResult(prog);
      setViewMode("previous");
      setVideoEnded(true);
    } else {
      setResult(null);
      setViewMode("practice");
      setVideoEnded(false);
    }
  };

  const avgScore = result ? Math.round(((result.pronunciationScore || 0) + (result.understandingScore || 0)) / 2) : 0;
  const badge = getBadge(avgScore);

  const completedCount = Object.keys(userProgress).length;
  const goldCount = Object.values(userProgress).filter(p => {
    const s = Math.round(((p.pronunciationScore || 0) + (p.understandingScore || 0)) / 2);
    return s >= 85;
  }).length;
  const silverCount = Object.values(userProgress).filter(p => {
    const s = Math.round(((p.pronunciationScore || 0) + (p.understandingScore || 0)) / 2);
    return s >= 70 && s < 85;
  }).length;
  const bronzeCount = Object.values(userProgress).filter(p => {
    const s = Math.round(((p.pronunciationScore || 0) + (p.understandingScore || 0)) / 2);
    return s >= 50 && s < 70;
  }).length;

  const mistakeMap = useMemo(() => {
    const map = {};
    (result?.mistakes || []).forEach(m => {
      if (m.word) map[m.word.toLowerCase().replace(/[^a-z]/gi, '')] = m;
    });
    return map;
  }, [result?.mistakes]);

  const renderHighlightedTranscription = () => {
    if (!result?.transcription?.trim()) return <em style={{ color: '#aaa' }}>No transcription available</em>;
    const words = result.transcription.split(/\s+/);
    return words.map((w, i) => {
      const cleaned = w.toLowerCase().replace(/[^a-z]/gi, '');
      const mistake = mistakeMap[cleaned];
      if (mistake) {
        return (
          <span key={i} style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '4px',
            margin: '3px 2px',
            position: 'relative'
          }}>
            <span style={{
              color: '#ff6b6b',
              fontWeight: 700,
              background: 'rgba(255,107,107,0.15)',
              borderBottom: '2.5px solid #ff6b6b',
              padding: '2px 6px',
              borderRadius: '4px',
              cursor: 'help',
              transition: 'background 0.2s'
            }}
            title={`Issue: ${mistake.issue || 'Mispronounced'}\nTip: ${mistake.how_to_correct || ''}`}
            >
              {w}
            </span>
            <span style={{
              fontSize: '0.72em',
              color: '#7df3c0',
              background: 'rgba(125,243,192,0.1)',
              border: '1px solid rgba(125,243,192,0.3)',
              padding: '1px 7px',
              borderRadius: '99px',
              fontWeight: 600,
              fontStyle: 'italic',
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
              lineHeight: 1.4
            }}>
              ✓ {mistake.correct_pronunciation || cleaned}
            </span>
          </span>
        );
      }
      return (
        <span key={i} style={{
          color: '#d4ccf0',
          padding: '2px 3px',
          margin: '0 1px'
        }}>
          {w}
        </span>
      );
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f001a 0%, #1a0033 100%)',
      color: '#e8e0ff',
      padding: '24px 16px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {!selectedVideo ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.8rem)', margin: '0 0 1rem', color: '#fff', fontWeight: 800 }}>
              Pronunciation Arena
            </h1>
            <p style={{ color: '#bb86fc', fontSize: '1.25rem', margin: '0 0 1.5rem' }}>
              Watch • Speak • Earn Medals
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              {[
                { emoji: '🥇', label: 'Gold', count: goldCount, color: '#FFD700' },
                { emoji: '🥈', label: 'Silver', count: silverCount, color: '#C0C0C0' },
                { emoji: '🥉', label: 'Bronze', count: bronzeCount, color: '#CD7F32' },
                { emoji: '✅', label: 'Completed', count: completedCount, color: '#4ade80' }
              ].map(item => (
                <div key={item.label} style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${item.color}30`,
                  borderRadius: '16px',
                  padding: '1rem 1.8rem',
                  minWidth: '140px',
                  textAlign: 'center',
                  backdropFilter: 'blur(8px)'
                }}>
                  <div style={{ fontSize: '2.2rem' }}>{item.emoji}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: item.color }}>{item.count}</div>
                  <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '4px' }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ maxWidth: '400px', margin: '0 auto 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.95rem' }}>
                <span>Daily Goal</span>
                <span style={{ color: '#bb86fc' }}>{todayCount} / 10</span>
              </div>
              <div style={{ height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((todayCount / 10) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #7c3aed, #bb86fc)',
                  transition: 'width 0.6s ease'
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', maxWidth: '1400px', margin: '0 auto' }}>
            {contentLibrary.map(video => {
              const prog = userProgress[video.videoId];
              const score = prog ? Math.round(((prog.pronunciationScore || 0) + (prog.understandingScore || 0)) / 2) : 0;
              const badge = prog ? getBadge(score) : null;
              return (
                <div
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  style={{
                    background: prog ? badge.bg : 'rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: prog ? `2px solid ${badge.color}50` : '1px solid rgba(255,255,255,0.12)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: prog ? badge.glow : 'none'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                    alt={video.title}
                    style={{ width: '100%', height: '170px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', lineHeight: 1.3 }}>{video.title}</h3>
                    <p style={{ margin: '0 0 10px', color: '#ccc', fontSize: '0.92rem' }}>{video.shortDesc}</p>
                    {prog && (
                      <div style={{ color: badge.color, fontWeight: 700, fontSize: '1.1rem' }}>
                        {score}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <button
            onClick={() => setSelectedVideo(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#bb86fc',
              fontSize: '1.25rem',
              marginBottom: '1.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ← Back to Arena
          </button>

          <h2 style={{ textAlign: 'center', margin: '0 0 0.6rem', fontSize: '2.2rem' }}>
            {selectedVideo.title}
          </h2>
          <p style={{ textAlign: 'center', color: '#bb86fc', margin: '0 0 2rem', fontSize: '1.15rem' }}>
            {selectedVideo.speaker}
          </p>

          <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
            <YouTube
              videoId={selectedVideo.videoId}
              opts={{ width: '100%', height: '520', playerVars: { modestbranding: 1 } }}
              onStateChange={e => e.data === 0 && setVideoEnded(true)}
            />
          </div>

          {(viewMode === "previous" || result) ? (
            <div style={{ marginTop: '3rem' }}>
              {/* ── Hero Badge ── */}
              <div style={{
                textAlign: 'center',
                marginBottom: '2.8rem',
                padding: '2.5rem 1.5rem',
                background: `radial-gradient(ellipse at 50% 0%, ${badge.color}18 0%, transparent 70%)`,
                borderRadius: '24px'
              }}>
                <div style={{
                  fontSize: '5.5rem',
                  lineHeight: 1,
                  filter: `drop-shadow(0 0 24px ${badge.color}66)`,
                  animation: 'badgePulse 2s ease-in-out infinite'
                }}>
                  {badge.emoji}
                </div>
                <div style={{
                  fontSize: 'clamp(2.8rem, 5vw, 3.8rem)',
                  fontWeight: 800,
                  color: badge.color,
                  margin: '0.4rem 0 0.2rem',
                  letterSpacing: '-1px',
                  textShadow: `0 0 40px ${badge.color}44`
                }}>
                  {avgScore}%
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  color: '#bbb',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}>{badge.label}</div>
              </div>

              {/* ── Score Gauges ── */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '3rem',
                marginBottom: '3rem',
                flexWrap: 'wrap'
              }}>
                {[
                  { label: 'Pronunciation', score: result?.pronunciationScore || 0, color: '#66bb6a', gradEnd: '#2e7d32' },
                  { label: 'Understanding', score: result?.understandingScore || 0, color: '#42a5f5', gradEnd: '#1565c0' }
                ].map(item => (
                  <div key={item.label} style={{
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '1.8rem 2.5rem',
                    minWidth: '180px'
                  }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 1rem' }}>
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none"
                          stroke={item.color}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${item.score * 2.64} 264`}
                          transform="rotate(-90 50 50)"
                          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${item.color}88)` }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: item.color
                      }}>{item.score}</div>
                    </div>
                    <div style={{ color: '#ccc', fontSize: '0.95rem', fontWeight: 500 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Gradient Divider ── */}
              <div style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(187,134,252,0.4), transparent)',
                margin: '0 auto 2.5rem',
                maxWidth: '500px'
              }} />

              {/* ── Feedback Cards ── */}
              {result?.pronunciationFeedback && (
                <div style={{
                  background: 'rgba(102,187,106,0.06)',
                  border: '1px solid rgba(102,187,106,0.2)',
                  borderLeft: '5px solid #66bb6a',
                  padding: '1.5rem 1.8rem',
                  borderRadius: '14px',
                  marginBottom: '1.5rem',
                  backdropFilter: 'blur(8px)'
                }}>
                  <h3 style={{ margin: '0 0 0.8rem', color: '#66bb6a', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🗣️</span> Pronunciation Feedback
                  </h3>
                  <p style={{ margin: 0, lineHeight: 1.75, color: '#d0e8d0', fontSize: '0.98rem' }}>{result.pronunciationFeedback}</p>
                </div>
              )}

              {result?.understandingFeedback && (
                <div style={{
                  background: 'rgba(66,165,245,0.06)',
                  border: '1px solid rgba(66,165,245,0.2)',
                  borderLeft: '5px solid #42a5f5',
                  padding: '1.5rem 1.8rem',
                  borderRadius: '14px',
                  marginBottom: '1.5rem',
                  backdropFilter: 'blur(8px)'
                }}>
                  <h3 style={{ margin: '0 0 0.8rem', color: '#42a5f5', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🧠</span> Understanding Feedback
                  </h3>
                  <p style={{ margin: 0, lineHeight: 1.75, color: '#c0d8f0', fontSize: '0.98rem' }}>{result.understandingFeedback}</p>
                </div>
              )}

              {/* ── Transcription with Inline Corrections ── */}
              {result?.transcription && (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '1.8rem',
                  borderRadius: '16px',
                  marginBottom: '2rem',
                  marginTop: '1.5rem'
                }}>
                  <h3 style={{
                    margin: '0 0 0.5rem',
                    color: '#e0d4ff',
                    fontSize: '1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>📝</span> Your Transcription
                  </h3>
                  <p style={{ margin: '0 0 1rem', color: '#888', fontSize: '0.82rem' }}>
                    <span style={{ color: '#ff6b6b' }}>Red words</span> were mispronounced · <span style={{ color: '#7df3c0' }}>green badges</span> show the correct pronunciation
                  </p>
                  <div style={{
                    lineHeight: 2.2,
                    fontSize: '1.08rem',
                    flexWrap: 'wrap',
                    display: 'flex',
                    alignItems: 'baseline'
                  }}>
                    {renderHighlightedTranscription()}
                  </div>
                </div>
              )}

              {/* ── Mispronounced Word Cards ── */}
              {result?.mistakes?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,107,107,0.3))' }} />
                    <h3 style={{ color: '#ff8a80', fontSize: '1.15rem', margin: 0, whiteSpace: 'nowrap' }}>
                      ⚠️ Words to Practice ({result.mistakes.length})
                    </h3>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, transparent, rgba(255,107,107,0.3))' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {result.mistakes.map((m, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,107,107,0.05)',
                        border: '1px solid rgba(255,107,107,0.15)',
                        borderRadius: '14px',
                        padding: '1.3rem 1.5rem',
                        transition: 'transform 0.2s, border-color 0.2s',
                        cursor: 'default'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.15)'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.9rem' }}>
                          <span style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            color: '#ffcccc',
                            textDecoration: 'line-through',
                            textDecorationColor: '#ff6b6b88'
                          }}>
                            {m.word}
                          </span>
                          <span style={{ color: '#555', fontSize: '1.2rem' }}>→</span>
                          <span style={{
                            fontSize: '1rem',
                            color: '#7df3c0',
                            fontWeight: 600,
                            fontStyle: 'italic',
                            background: 'rgba(125,243,192,0.1)',
                            padding: '2px 10px',
                            borderRadius: '99px',
                            border: '1px solid rgba(125,243,192,0.25)'
                          }}>
                            {m.correct_pronunciation}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.7rem' }}>
                          <span style={{
                            fontSize: '0.8rem',
                            background: 'rgba(255,150,150,0.12)',
                            color: '#ffaaaa',
                            padding: '3px 10px',
                            borderRadius: '6px'
                          }}>You: {m.user_pronunciation}</span>
                          {m.issue && <span style={{
                            fontSize: '0.8rem',
                            background: 'rgba(255,204,102,0.12)',
                            color: '#ffcc66',
                            padding: '3px 10px',
                            borderRadius: '6px'
                          }}>{m.issue}</span>}
                        </div>
                        {m.how_to_correct && (
                          <div style={{
                            color: '#b0b8c0',
                            fontSize: '0.88rem',
                            lineHeight: 1.55,
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            paddingTop: '0.6rem',
                            marginTop: '0.3rem'
                          }}>
                            💡 {m.how_to_correct}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === "previous" && (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                  <button
                    onClick={() => { setViewMode("practice"); setResult(null); setVideoEnded(true); }}
                    style={{
                      padding: '1rem 2.8rem',
                      fontSize: '1.15rem',
                      background: 'linear-gradient(135deg, #7c3aed, #ab47bc)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      boxShadow: '0 8px 32px rgba(124,58,237,0.45)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 44px rgba(124,58,237,0.6)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.45)'; }}
                  >
                    🔄 Re-take Challenge
                  </button>
                </div>
              )}

              {/* Keyframes injected inline */}
              <style>{`
                @keyframes badgePulse {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.06); }
                }
              `}</style>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
              {videoEnded ? (
                <>
                  <h2 style={{ marginBottom: '2rem', fontSize: '2rem', color: '#fff' }}>
                    Your Turn – Speak Clearly!
                  </h2>
                  <button
                    onClick={toggleRecording}
                    disabled={loading}
                    style={{
                      padding: '1.5rem 5rem',
                      fontSize: '1.5rem',
                      borderRadius: '999px',
                      background: recording ? '#f44336' : loading ? '#616161' : 'linear-gradient(135deg, #7c3aed, #ab47bc)',
                      color: 'white',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: recording ? '0 0 40px rgba(244,67,54,0.7)' : '0 12px 40px rgba(124,58,237,0.6)',
                      transition: 'all 0.3s'
                    }}
                  >
                    {loading ? "Analyzing..." : recording ? `Stop (${recordTime.toFixed(1)} s)` : "🎤 Start Speaking"}
                  </button>
                  {recording && (
                    <p style={{ color: '#ff8a80', marginTop: '1.2rem', fontSize: '1.2rem' }}>
                      Recording • Speak naturally
                    </p>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '1.5rem', color: '#ffd54f' }}>
                  Watch the full video to unlock recording
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PronunciationJudge;
