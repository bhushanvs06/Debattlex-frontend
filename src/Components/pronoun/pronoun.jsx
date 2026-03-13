import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import YouTube from 'react-youtube';

const url = process.env.REACT_APP_URL || 'https://dddeyksxjhwh4.cloudfront.net';

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

  useEffect(() => { if (email) fetchProgress(); }, []);

  useEffect(() => {
    if (result && selectedVideo && email && viewMode === "practice") {
      saveProgress(selectedVideo.videoId, result);
    }
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

    const numChannels = 1, sampleRate = 16000, bytesPerSample = 2;
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
    const s = Math.round(((p.pronunciationScore||0) + (p.understandingScore||0))/2);
    return s >= 85;
  }).length;
  const silverCount = Object.values(userProgress).filter(p => {
    const s = Math.round(((p.pronunciationScore||0) + (p.understandingScore||0))/2);
    return s >= 70 && s < 85;
  }).length;
  const bronzeCount = Object.values(userProgress).filter(p => {
    const s = Math.round(((p.pronunciationScore||0) + (p.understandingScore||0))/2);
    return s >= 50 && s < 70;
  }).length;

  const renderHighlightedTranscription = () => {
    if (!result?.transcription?.trim()) return <em style={{color:'#aaa'}}>No transcription available</em>;
    const words = result.transcription.split(/\s+/);
    const badWords = (result.mistakes || []).map(m => m.word?.toLowerCase());
    return words.map((w, i) => {
      const isBad = badWords.includes(w.toLowerCase().replace(/[^a-z]/gi,''));
      return (
        <span key={i} style={{
          color: isBad ? '#ff6b6b' : '#e0d4ff',
          fontWeight: isBad ? 700 : 400,
          textDecoration: isBad ? 'underline wavy #ff6b6b 2px' : 'none',
          background: isBad ? 'rgba(255,107,107,0.12)' : 'transparent',
          padding: '2px 5px',
          borderRadius: '5px',
          margin: '0 2px'
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
              const score = prog ? Math.round(((prog.pronunciationScore||0) + (prog.understandingScore||0))/2) : 0;
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
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div style={{ fontSize: '6rem', color: badge.color, textShadow: badge.glow, lineHeight: 1 }}>
                  {badge.emoji}
                </div>
                <div style={{ fontSize: '3.5rem', fontWeight: 800, color: badge.color, margin: '0.5rem 0' }}>
                  {avgScore}%
                </div>
                <div style={{ fontSize: '1.5rem', color: '#ddd' }}>{badge.label}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.8rem', color: '#66bb6a' }}>{result?.pronunciationScore || 0}%</div>
                  <div style={{ color: '#aaa', fontSize: '1.1rem' }}>Pronunciation</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.8rem', color: '#42a5f5' }}>{result?.understandingScore || 0}%</div>
                  <div style={{ color: '#aaa', fontSize: '1.1rem' }}>Understanding</div>
                </div>
              </div>

              {result?.pronunciationFeedback && (
                <div style={{ background: 'rgba(102,187,106,0.08)', borderLeft: '6px solid #66bb6a', padding: '1.6rem', borderRadius: '10px', marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#66bb6a', fontSize: '1.4rem' }}>Pronunciation Feedback</h3>
                  <p style={{ margin: 0, lineHeight: 1.7 }}>{result.pronunciationFeedback}</p>
                </div>
              )}

              {result?.understandingFeedback && (
                <div style={{ background: 'rgba(66,165,245,0.08)', borderLeft: '6px solid #42a5f5', padding: '1.6rem', borderRadius: '10px', marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#42a5f5', fontSize: '1.4rem' }}>Understanding Feedback</h3>
                  <p style={{ margin: 0, lineHeight: 1.7 }}>{result.understandingFeedback}</p>
                </div>
              )}

              {result?.transcription && (
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '1.6rem', borderRadius: '10px', marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#e0d4ff', fontSize: '1.3rem' }}>Your Spoken Transcription</h3>
                  <div style={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                    {renderHighlightedTranscription()}
                  </div>
                </div>
              )}

              {result?.mistakes?.length > 0 && (
                <div>
                  <h3 style={{ textAlign: 'center', color: '#ff6b6b', fontSize: '1.5rem', margin: '0 0 1.5rem' }}>
                    Mispronounced Words – Let's Improve
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.4rem' }}>
                    {result.mistakes.map((m, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,107,107,0.08)',
                        border: '1px solid rgba(255,107,107,0.25)',
                        borderLeft: '6px solid #ff6b6b',
                        padding: '1.4rem',
                        borderRadius: '10px'
                      }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffcccc', marginBottom: '0.8rem' }}>
                          {m.word}
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ color: '#ff9999' }}>You said: </span><em>{m.user_pronunciation}</em>
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ color: '#88ddff' }}>Correct: </span><em>{m.correct_pronunciation}</em>
                        </div>
                        <div style={{ color: '#ffcc66', margin: '0.8rem 0 0.5rem' }}>
                          Issue: {m.issue}
                        </div>
                        <div style={{ color: '#aaffaa', lineHeight: 1.5 }}>
                          💡 {m.how_to_correct}
                        </div>
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
                      padding: '1.2rem 3rem',
                      fontSize: '1.3rem',
                      background: 'linear-gradient(135deg, #7c3aed, #ab47bc)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      boxShadow: '0 12px 40px rgba(124,58,237,0.5)'
                    }}
                  >
                    Re-take Challenge
                  </button>
                </div>
              )}
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
