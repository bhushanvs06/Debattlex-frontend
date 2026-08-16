import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Notebook, Home, FileText, MessageSquare } from 'lucide-react';
import './Arina.css';
import { useNavigate } from 'react-router-dom';

var url = process.env.React_App_url;

const toBoldItalic = (word) => {
  const map = {
    a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠',
    h: '𝐡', i: '𝐢', j: '𝐣', k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧',
    o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮',
    v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐯', z: '𝐳',
    A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆',
    H: '𝐇', I: '𝐈', J: '𝐉', K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍',
    O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓', U: '𝐔',
    V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙'
  };
  return word.split('').map(c => map[c] || c).join('');
};

const DebateUI = () => {
  const [isMobileMode, setIsMobileMode] = useState(window.innerWidth < 980);
  const [showTranscript, setShowTranscript] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobileMode(window.innerWidth < 980);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isMuted, setIsMuted] = useState(true);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [captionLines, setCaptionLines] = useState([]);
  const [captionLineIndex, setCaptionLineIndex] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [propSummary, setPropSummary] = useState([]);
  const [oppSummary, setOppSummary] = useState([]);
  const [transcripts, setTranscripts] = useState({});
  const [userTranscript, setUserTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [triggerNextAISpeech, setTriggerNextAISpeech] = useState(false);
  const [userData, setUserData] = useState(null);
  const [allSpeakers, setAllSpeakers] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [introCountdown, setIntroCountdown] = useState(3); // snappy countdown
  const [debateStarted, setDebateStarted] = useState(false);
  const [isNoteTakerOpen, setIsNoteTakerOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [userStance, setUserStance] = useState('');
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
  // Speech generation lock — prevents overlapping AI speech API calls
  const speechLockRef = useRef(false);
  const savePromiseRef = useRef(Promise.resolve());
  const hasSavedThisTurnRef = useRef(false);

  useEffect(() => {
    hasSavedThisTurnRef.current = false;
  }, [currentSpeakerIndex]);

  const [isThinking, setIsThinking] = useState(false); // AI fetching speech
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
      } catch (err) {
        // Ignore unlock errors
      }
    };
  }, []);

  const recognitionRef = useRef(null);
  const currentAudioRef = useRef(null);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const prefetchCacheRef = useRef(new Map());
  const [allPrep, setAllPrep] = useState({
    PM: "",
    DPM: "",
    GW: "",
    LO: "",
    DLO: "",
    OW: ""
  });

  const voiceMap = {
    PM: 'rahul',       // Male — bulbul:v3 compatible
    DPM: 'rohan',     // Male — bulbul:v3 compatible
    GW: 'amit',       // Male — bulbul:v3 compatible
    LO: 'priya',      // Female — bulbul:v3 compatible
    DLO: 'ritu',      // Female — bulbul:v3 compatible
    OW: 'neha'        // Female — bulbul:v3 compatible
  };

  const propVideoMap = {
    PM: '/boy1.mp4',
    DPM: '/boy2.mp4',
    GW: '/boy3.mp4'
  };

  const oppVideoMap = {
    LO: '/girl1.mp4',
    DLO: '/girl2.mp4',
    OW: '/girl3.mp4'
  };

  const saveToMongo = async ({ transcript, summary, speaker }) => {
    try {
      const team = speaker.team.toLowerCase() === 'prop' ? 'proposition' : 'opposition';

      const allKeys = Object.keys(userData.entries || {});
      const latestKey = allKeys
        .filter(k => userData.entries[k].debateType === '3v3')
        .sort((a, b) => new Date(userData.entries[b].createdAt) - new Date(userData.entries[a].createdAt))[0];

      if (!latestKey) {
        console.warn("No 3v3 debate entry found for saving.");
        return;
      }

      console.log("Saving transcript & summary to backend:", {
        email: userData.email,
        topicSlug: latestKey,
        team,
        role: speaker.role.toLowerCase(),
        transcript: transcript.substring(0, 100) + "...",
        summary: summary
      });

      const res = await fetch(url + "/api/saveRoleTranscript", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: userData.email,
          topicSlug: latestKey,
          team,
          role: speaker.role.toLowerCase(),
          transcript,
          summary: Array.isArray(summary) ? summary : [summary]
        })
      });

      const result = await res.json();
      if (!res.ok) {
        console.error("Save failed:", result.message || result.error);
      } else {
        console.log("✅ Successfully saved to backend:", result.message);
      }
    } catch (error) {
      console.error("Error saving to backend:", error);
    }
  };

  const saveUserTurnSpeech = (tempTranscript, tempSpeaker) => {
    if (!tempTranscript || !tempTranscript.trim()) return Promise.resolve();
    if (hasSavedThisTurnRef.current) return savePromiseRef.current;
    hasSavedThisTurnRef.current = true;

    const cleanText = tempTranscript.trim();
    const savePromise = (async () => {
      try {
        const latestKey = Object.keys(userData?.entries || {})
          .filter(k => userData.entries[k].debateType === '3v3')
          .sort((a, b) => new Date(userData.entries[b].createdAt) - new Date(userData.entries[a].createdAt))[0];

        if (!latestKey) return;

        const res = await fetch(url + "/api/generateSummary", {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            transcript: cleanText, 
            role: tempSpeaker.role, 
            team: tempSpeaker.team.toLowerCase() === 'prop' ? 'proposition' : 'opposition', 
            topic,
            email: userData?.email
          })
        });

        let summaryPoints = ["Debater spoke on the motion."];
        if (res.ok) {
          const data = await res.json();
          summaryPoints = Array.isArray(data.summary) ? data.summary : [data.summary || ''];
        }

        const labeled = summaryPoints.map(point => `${tempSpeaker.role}: ${point}`);
        if (tempSpeaker.team.toLowerCase() === 'prop') {
          setPropSummary(prev => [...labeled, ...prev]);
        } else {
          setOppSummary(prev => [...labeled, ...prev]);
        }

        await saveToMongo({
          transcript: cleanText,
          summary: summaryPoints,
          speaker: tempSpeaker
        });
      } catch (err) {
        console.error('Error saving user speech:', err);
      }
    })();

    savePromiseRef.current = savePromise;
    return savePromise;
  };

  useEffect(() => {
    const fetchData = async () => {
      const storedEmail = localStorage.getItem("userEmail");
      if (!storedEmail) {
        alert("User email not found. Please log in again.");
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(url + `/api/getUserDebateData?email=${storedEmail}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const user = await res.json();
        setUserData(user);

        const entries = user.entries || {};
        const latest3v3Key = Object.keys(entries)
          .filter(key => entries[key].debateType === "3v3")
          .sort((a, b) => new Date(entries[b].createdAt) - new Date(entries[a].createdAt))[0];

        if (latest3v3Key) {
          localStorage.setItem('activeDebateKey', latest3v3Key);
        }

        const entry = entries[latest3v3Key];
        const topic = entry.topic;
        const stance = entry.stance;
        setUserStance(stance);
        const userrole = entry.userrole?.toUpperCase();
        setUserRole(userrole);

        const proposition = entry.proposition;
        const opposition = entry.opposition;

        // Load existing summaries on mount from database entry
        const initialPropSummary = [];
        if (proposition) {
          const roles = ['pm', 'dpm', 'gw'];
          roles.forEach(r => {
            if (proposition[r] && proposition[r].summary) {
              const summaryArr = Array.isArray(proposition[r].summary)
                ? proposition[r].summary
                : [proposition[r].summary];
              summaryArr.forEach(pt => {
                if (pt && pt.trim()) {
                  initialPropSummary.push(`${r.toUpperCase()}: ${pt}`);
                }
              });
            }
          });
        }
        setPropSummary(initialPropSummary);

        const initialOppSummary = [];
        if (opposition) {
          const roles = ['lo', 'dlo', 'ow'];
          roles.forEach(r => {
            if (opposition[r] && opposition[r].summary) {
              const summaryArr = Array.isArray(opposition[r].summary)
                ? opposition[r].summary
                : [opposition[r].summary];
              summaryArr.forEach(pt => {
                if (pt && pt.trim()) {
                  initialOppSummary.push(`${r.toUpperCase()}: ${pt}`);
                }
              });
            }
          });
        }
        setOppSummary(initialOppSummary);

        const allPreps = {
          PM: proposition?.pm?.prep || "",
          DPM: proposition?.dpm?.prep || "",
          GW: proposition?.gw?.prep || "",
          LO: opposition?.lo?.prep || "",
          DLO: opposition?.dlo?.prep || "",
          OW: opposition?.ow?.prep || ""
        };
        setAllPrep(allPreps);

        const propMembers = Object.keys(proposition).map(role => ({
          name: role.toUpperCase() === userrole ? user.displayName.toUpperCase() : `${role.toUpperCase()} (AI)`,
          role: role.toUpperCase(),
          team: 'prop',
          prep: proposition[role]?.prep || "",
          avatar: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 90)}.jpg`,
          video: propVideoMap[role.toUpperCase()]
        }));

        const oppMembers = Object.keys(opposition).map(role => ({
          name: role.toUpperCase() === userrole ? user.displayName.toUpperCase() : `${role.toUpperCase()} (AI)`,
          role: role.toUpperCase(),
          team: 'opp',
          prep: opposition[role]?.prep || "",
          avatar: `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 90)}.jpg`,
          video: oppVideoMap[role.toUpperCase()]
        }));

        const roleOrder = ["PM", "LO", "DPM", "DLO", "GW", "OW"];
        const speakers = roleOrder.map(role =>
          (stance === 'proposition')
            ? propMembers.find(m => m.role === role) || oppMembers.find(m => m.role === role)
            : oppMembers.find(m => m.role === role) || propMembers.find(m => m.role === role)
        ).filter(Boolean);

        setAllSpeakers(speakers);

        // Fetch notes from backend using GET
        try {
          const notesRes = await fetch(
            `${url}/api/fetchNotes?email=${encodeURIComponent(storedEmail)}&topic=${encodeURIComponent(topic)}&topicSlug=${encodeURIComponent(latest3v3Key)}&team=${encodeURIComponent(stance)}&role=${encodeURIComponent(userrole.toLowerCase())}`,
            {
              method: 'GET',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          const notesData = await notesRes.json();
          if (notesRes.ok && notesData.notes) {
            setNotes(notesData.notes);
            console.log("✅ Notes fetched successfully:", notesData.notes);
          } else {
            console.warn("No notes found or error fetching notes:", notesData.message);
            setNotes('');
          }
        } catch (err) {
          console.error("Error fetching notes:", err);
          setNotes('');
        }
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (allSpeakers.length === 0) return;

    const countdown = setInterval(() => {
      setIntroCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          setDebateStarted(true);
          setTriggerNextAISpeech(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [allSpeakers]);

  const currentSpeaker = allSpeakers.length > 0 ? allSpeakers[currentSpeakerIndex] : null;
  const topic = Object.values(userData?.entries || {})
    .filter(e => e.debateType === '3v3')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.topic || 'Loading...';
  const userName = userData?.displayName?.toUpperCase() || '';
  const isUserTurn = currentSpeaker?.name === userName;

  // Keep a ref to latest userTranscript so the timer doesn't restart on every speech fragment
  const userTranscriptRef = useRef('');
  useEffect(() => { userTranscriptRef.current = userTranscript; }, [userTranscript]);

  useEffect(() => {
    if (!currentSpeaker || !debateStarted) return;
    const timer = setInterval(() => {
      // For AI turns, only count down when the AI is actually speaking (audio playing).
      // This prevents timer expiration during network lag/TTS generation/thinking.
      if (!isUserTurn && !isSpeaking) return;

      setTimeLeft(prev => {
        if (prev <= 1) {
          // Kill audio chain
          speakSessionRef.current += 1;
          speechLockRef.current = false;
          try {
            if (currentAudioRef.current) {
              currentAudioRef.current.onended = null;
              currentAudioRef.current.stop();
            }
          } catch(e) {}
          currentAudioRef.current = null;
          // Force close and recreate AudioContext to guarantee silence
          try {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
              audioContextRef.current.close();
            }
          } catch(e) {}
          audioContextRef.current = null;
          if (videoRef.current) videoRef.current.pause();

          const latestTranscript = userTranscriptRef.current;
          if (isUserTurn && latestTranscript && latestTranscript.trim()) {
            saveUserTurnSpeech(latestTranscript, currentSpeaker);
            setUserTranscript('');
          }

          try { if (recognitionRef.current) recognitionRef.current.stop(); } catch(e) {}
          setCaptionLines([]);
          setCaptionLineIndex(0);
          setHighlightedWordIndex(0);
          setIsMuted(true);
          setIsSpeaking(false);
          setIsThinking(false);
          nextSpeaker();
          return 60;
        }

        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentSpeakerIndex, isUserTurn, debateStarted, isThinking, isSpeaking]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    if (isUserTurn && debateStarted) {
      setIsMuted(false);
      try {
        recognition.start();
      } catch (err) {
        console.warn("Recognition already started");
      }
      let fullTranscript = '';

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            fullTranscript += transcript + ' ';
          } else {
            interim += transcript;
          }
        }
        const combined = (fullTranscript + interim).trim();
        const lines = combined ? combined.split(/[.?!]\s+/).filter(line => line.trim() !== '') : [];
        setCaptionLines(lines);
        setCaptionLineIndex(lines.length > 0 ? lines.length - 1 : 0);
        setHighlightedWordIndex(0);
        setUserTranscript(combined);
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        recognition.stop();
      };
    } else {
      recognition.stop();
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [currentSpeakerIndex, debateStarted]);

  useEffect(() => {
    if (triggerNextAISpeech && currentSpeaker && !isUserTurn && debateStarted) {
      // Start AI speech immediately — no artificial delay
      generateAISpeech(currentSpeaker);
      setTriggerNextAISpeech(false);
    }
  }, [triggerNextAISpeech, currentSpeakerIndex, debateStarted]);

  async function hangupclick() {
    // Kill any running audio chain
    speakSessionRef.current += 1;
    speechLockRef.current = false;
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.onended = null;
        currentAudioRef.current.stop();
      }
    } catch(e) {}
    currentAudioRef.current = null;
    // Force close AudioContext to guarantee silence
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    } catch(e) {}
    audioContextRef.current = null;
    if (videoRef.current) videoRef.current.pause();
    setIsSpeaking(false);

    // Save user transcript if it's user's turn
    if (isUserTurn && userTranscript.trim()) {
      try {
        await saveUserTurnSpeech(userTranscript, currentSpeaker);
      } catch(e) { console.error('Error saving user speech on hangup:', e); }
      setUserTranscript('');
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    // Wait for any background saves to complete before navigating
    setCaptionLines(["Saving progress, navigating..."]);
    setCaptionLineIndex(0);
    setHighlightedWordIndex(0);
    await savePromiseRef.current;
    navigate('/aijudge');
  }

  const nextSpeaker = () => {
    // Kill any running audio chain immediately
    speakSessionRef.current += 1;
    speechLockRef.current = false;

    if (isUserTurn && userTranscript.trim()) {
      saveUserTurnSpeech(userTranscript, currentSpeaker);
      setUserTranscript('');
    }
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.onended = null;
        currentAudioRef.current.stop();
      }
    } catch(e) {}
    currentAudioRef.current = null;
    // Force close AudioContext to guarantee no lingering audio
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    } catch(e) {}
    audioContextRef.current = null;
    if (videoRef.current) videoRef.current.pause();
    if (recognitionRef.current && isUserTurn) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    setIsSpeaking(false);
    setIsThinking(false);
    setIsMuted(true);
    prefetchCacheRef.current.clear();

    const nextIndex = currentSpeakerIndex + 1;

    if (nextIndex >= allSpeakers.length) {
      setCaptionLines(["Debate completed! Navigating to AI Judge..."]);
      setCaptionLineIndex(0);
      setHighlightedWordIndex(0);
      // Auto-navigate after 5 seconds once debate is fully complete and saved
      (async () => {
        await savePromiseRef.current;
        setTimeout(() => {
          navigate('/aijudge');
        }, 5000);
      })();
      return;
    }

    setCurrentSpeakerIndex(nextIndex);
    setTimeLeft(60);
    setCaptionLines([]);
    setCaptionLineIndex(0);
    setHighlightedWordIndex(0);
    setTriggerNextAISpeech(true);
  };

  // ── AudioContext helper (shared, reusable) ──
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

  // ── Fetch TTS audio and decode to AudioBuffer ──
  const fetchTTSBuffer = async (line, speakerRole) => {
    const speakerVoice = voiceMap[speakerRole] || 'manisha';
    const cleanLine = (line || '').trim();
    if (!cleanLine) return null;
    try {
      const res = await fetch(url + '/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          text: cleanLine,
          speaker: speakerVoice,
          voicePlan: voicePlanRef.current,
          role: speakerRole,
          email: userData?.email
        })
      });
      if (!res.ok) {
        console.warn(`TTS API returned ${res.status} for line: "${cleanLine.substring(0,40)}..."`);
        return null;
      }
      const response = await res.json();
      const base64Audio = response.audioBase64;
      if (!base64Audio) return null;

      const byteCharacters = atob(base64Audio);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const ctx = await getAudioCtx();
      return await ctx.decodeAudioData(byteArray.buffer.slice(0));
    } catch (err) {
      console.error('fetchTTSBuffer error:', err);
      return null;
    }
  };

  // ── Pre-fetch next line while current plays ──
  const prefetchLine = (lines, nextIndex, speakerRole) => {
    if (nextIndex >= lines.length) return;
    const nextLine = (lines[nextIndex] || '').replace(/[*#]/g, '').trim();
    if (!nextLine) return;
    const cacheKey = `${nextIndex}_${nextLine.substring(0, 30)}`;
    if (!prefetchCacheRef.current.has(cacheKey)) {
      const promise = fetchTTSBuffer(nextLine, speakerRole).catch(() => null);
      prefetchCacheRef.current.set(cacheKey, promise);
    }
  };

  // speakerRole passed as explicit param to avoid stale closure reads
  const speakText = async (lines, index, sessionId, speakerRole) => {
    // Session guard — abort if session changed
    if (sessionId !== speakSessionRef.current) return;

    if (index >= lines.length || !lines[index]) {
      // Chain complete — all lines spoken
      if (sessionId === speakSessionRef.current) {
        setIsSpeaking(false);
        if (videoRef.current) videoRef.current.pause();
        prefetchCacheRef.current.clear();
        // If this was the LAST speaker, auto-navigate to judge
        if (currentSpeakerIndex >= allSpeakers.length - 1) {
          setCaptionLines(["Debate completed! Navigating to AI Judge..."]);
          setCaptionLineIndex(0);
          setHighlightedWordIndex(0);
          (async () => {
            await savePromiseRef.current;
            setTimeout(() => navigate('/aijudge'), 5000);
          })();
        } else {
          // Automatically advance to next speaker when AI finishes
          nextSpeaker();
        }
      }
      return;
    }

    const line = (lines[index] || '').replace(/[*#]/g, '').trim();
    if (!line) {
      // Empty line — skip to next
      if (sessionId === speakSessionRef.current) {
        speakText(lines, index + 1, sessionId, speakerRole);
      }
      return;
    }

    setCaptionLineIndex(index);
    setHighlightedWordIndex(0);

    try {
      // Check prefetch cache first, otherwise fetch now
      const cacheKey = `${index}_${line.substring(0, 30)}`;
      let audioBuffer;
      if (prefetchCacheRef.current.has(cacheKey)) {
        audioBuffer = await prefetchCacheRef.current.get(cacheKey);
        prefetchCacheRef.current.delete(cacheKey);
      } else {
        audioBuffer = await fetchTTSBuffer(line, speakerRole);
      }

      // Re-check session after async fetch
      if (sessionId !== speakSessionRef.current) return;

      if (!audioBuffer) {
        // TTS failed for this line — skip to next
        speakText(lines, index + 1, sessionId, speakerRole);
        return;
      }

      // Prefetch next line immediately, passing role explicitly
      prefetchLine(lines, index + 1, speakerRole);

      // Ensure AudioContext is running before playing
      const ctx = await getAudioCtx();

      // Stop any lingering audio before starting
      try {
        if (currentAudioRef.current) {
          currentAudioRef.current.onended = null;
          currentAudioRef.current.stop();
        }
      } catch(e) {}

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentAudioRef.current = source;

      const words = line.split(' ').length;
      const duration = audioBuffer.duration;
      const timePerWord = (duration * 1000) / Math.max(words, 1);

      let wordIndex = 0;
      const interval = setInterval(() => {
        if (sessionId !== speakSessionRef.current) {
          clearInterval(interval);
          return;
        }
        setHighlightedWordIndex(wordIndex);
        wordIndex++;
        if (wordIndex >= words) clearInterval(interval);
      }, timePerWord);

      source.start();
      setIsSpeaking(true);
      if (videoRef.current) videoRef.current.play().catch(() => {});

      // Fallback timer: if onended never fires, advance after duration + buffer
      const fallbackMs = (duration || 3) * 1000 + 4000;
      let advanced = false;

      const advanceToNext = () => {
        if (advanced) return;
        advanced = true;
        clearInterval(interval);
        clearInterval(watchdog);
        setHighlightedWordIndex(0);
        if (sessionId === speakSessionRef.current) {
          speakText(lines, index + 1, sessionId, speakerRole);
        } else {
          setIsSpeaking(false);
          if (videoRef.current) videoRef.current.pause();
        }
      };

      const fallbackTimer = setTimeout(advanceToNext, fallbackMs);

      // Watchdog: keep AudioContext alive — resume if suspended
      const watchdog = setInterval(async () => {
        if (advanced || sessionId !== speakSessionRef.current) {
          clearInterval(watchdog);
          return;
        }
        try {
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
        } catch(e) {}
      }, 500);

      source.onended = () => {
        clearTimeout(fallbackTimer);
        advanceToNext();
      };
    } catch (err) {
      console.error('speakText error:', err);
      // Don't get stuck — skip to next line on any error
      if (sessionId === speakSessionRef.current) {
        speakText(lines, index + 1, sessionId, speakerRole);
      }
    }
  };

  const generateAISpeech = async (speaker) => {
    // Speech generation lock — prevent overlapping LLM calls
    if (speechLockRef.current) {
      console.warn('generateAISpeech skipped — another generation is in-flight');
      return;
    }
    speechLockRef.current = true;
    const expectedIndex = currentSpeakerIndex;

    try {
      setIsThinking(true);
      const previousPropSummary = propSummary.join('\n');
      const previousOppSummary = oppSummary.join('\n');
      const previousSummaries = `Proposition summaries:\n${previousPropSummary}\n\nOpposition summaries:\n${previousOppSummary}`;

      const currentTopicSlug = topic
        ?.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '_') || '';

      const prepForRole = allPrep[speaker.role?.toUpperCase()] || "";

      const payload = {
        email: userData?.email,
        role: speaker.role?.toLowerCase(),
        team: speaker.team === 'prop' ? 'prop' : 'opp',
        topic: topic || 'Untitled Debate',
        topicSlug: currentTopicSlug,
        prep: prepForRole,
        previousSummaries: previousSummaries.trim() || ""
      };

      const res = await fetch(`${url}/api/generateAISpeech`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'unknown');
        throw new Error(`AISpeech API error ${res.status}: ${errText.substring(0, 100)}`);
      }

      const data = await res.json();
      setIsThinking(false);
      speechLockRef.current = false;

      // Guard: speaker may have changed during the await
      if (currentSpeakerIndex !== expectedIndex) return;

      if (!data.transcript || typeof data.transcript !== 'string' || data.transcript.trim().length < 10) {
        console.warn('AI returned empty/short transcript, skipping...');
        nextSpeaker();
        return;
      }

      setTranscripts(prev => ({
        ...prev,
        [speaker.role]: data.transcript
      }));

      const lines = data.transcript
        .split(/[.?!]\s+/)
        .filter(line => line.trim() !== '')
        .map(line => line.trim());

      if (lines.length === 0) {
        console.warn('No speakable lines extracted, skipping...');
        nextSpeaker();
        return;
      }

      setCaptionLines(lines);
      setCaptionLineIndex(0);
      setHighlightedWordIndex(0);

      // Bump session ID so any previous chain aborts
      speakSessionRef.current += 1;
      const sid = speakSessionRef.current;
      const roleForChain = speaker.role;

      // Pre-warm AudioContext so first play is instant
      await getAudioCtx();

      // Prefetch line 1 while line 0 is being fetched/played
      if (lines.length > 1) {
        prefetchLine(lines, 1, roleForChain);
      }

      speakText(lines, 0, sid, roleForChain);

      // Fire-and-forget: summary runs in background, does NOT block audio
      generateSummary(data.transcript, speaker).catch(err => console.error('Summary bg error:', err));

    } catch (err) {
      setIsThinking(false);
      speechLockRef.current = false;
      console.error('Error in generateAISpeech:', err);
      setCaptionLines(['AI speech generation failed. Skipping speaker...']);
      setCaptionLineIndex(0);
      setHighlightedWordIndex(0);
      // Auto-skip after 3 seconds on failure
      setTimeout(() => {
        if (currentSpeakerIndex === expectedIndex) {
          nextSpeaker();
        }
      }, 3000);
    }
  };

  const generateSummary = async (text, speaker) => {
    try {
      const res = await fetch(url + "/api/generateSummary", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          transcript: text, 
          role: speaker.role, 
          team: speaker.team, 
          topic,
          email: userData?.email
        })
      });

      if (!res.ok) return;

      const data = await res.json();

      if (!Array.isArray(data.summary)) return;

      const labeled = data.summary.map(point => `${speaker.role}: ${point}`);
      if (speaker.team === 'prop') {
        setPropSummary(prev => [...labeled, ...prev]);
      } else {
        setOppSummary(prev => [...labeled, ...prev]);
      }

      await saveToMongo({ transcript: text, summary: data.summary, speaker });
    } catch (err) {
      console.error('Summary error:', err);
    }
  };

  const toggleNoteTaker = () => {
    setIsNoteTakerOpen(!isNoteTakerOpen);
  };

  if (!userData || allSpeakers.length === 0 || !currentSpeaker) {
    return <div className="loading">⏳ Loading Debate...</div>;
  }

  if (!debateStarted) {
    return (
      <div className="countdown-screen">
        <h2>🧠 Debate on: <em>{topic}</em></h2>
        <h1>⏳ Starting in {introCountdown} second{introCountdown !== 1 ? 's' : ''}...</h1>
      </div>
    );
  }

  const currentLine = captionLines[captionLineIndex] || '';

  const renderWord = (word, idx, highlightIdx) => {
    let displayWord = word.replace(/[*#]/g, '');
    const clean = displayWord.replace(/[^a-zA-Z]/g, '');
    if (clean.toLowerCase() === "important") {
      displayWord = toBoldItalic(displayWord);
    }
    const isHighlight = (idx === highlightIdx) && !isUserTurn;
    return (
      <span
        key={idx}
        style={{
          color: isHighlight ? 'yellow' : 'white',
          fontWeight: isHighlight ? 'bold' : 'normal',
          marginRight: '4px',
        }}
      >
        {displayWord}
      </span>
    );
  };

  const oppositeTeam = (userStance || '').toLowerCase() === 'proposition' ? 'opp' : 'prop';
  const oppositeTeamLabel = oppositeTeam === 'opp' ? 'Opposition' : 'Proposition';
  const oppositeSummaryPoints = oppositeTeam === 'opp' ? oppSummary : propSummary;
  const oppositeSpeakers = allSpeakers.filter(p => p.team === oppositeTeam);

  if (!isMobileMode) {
    return (
      <div className="arina-container">
        {/* Timer — top left corner on desktop */}
        <div className="desktop-timer-badge">
          <span className="desktop-timer-icon">⏱️</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{timeLeft}s</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginLeft: '4px' }}>
            {isUserTurn ? '· Your turn' : isThinking ? '· Thinking…' : '· AI speaking'}
          </span>
        </div>

        {/* Voice plan is toggled from the NavigationBar sidebar only */}

        <h3 className="debate-topic-heading">
          Topic: <span className="debate-topic-title">{topic}</span>
        </h3>

        <div className="arina-center">
          <div className="avatar-container" style={{ position: 'relative' }}>
            {!isUserTurn ? (
              <video
                ref={videoRef}
                src={currentSpeaker.video}
                className="speaking-video"
                loop
                muted
                playsInline
              />
            ) : (
              <div className="speaking-video" style={{ position: 'relative', overflow: 'hidden' }}>
                <img
                  src={currentSpeaker.avatar}
                  alt={currentSpeaker.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
                />
                <div style={{
                  position: 'absolute', bottom: '12px', right: '12px',
                  background: 'rgba(16, 185, 129, 0.9)', borderRadius: '50%',
                  width: '40px', height: '40px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  animation: 'pulse-mic 1.5s infinite', zIndex: 20
                }}>
                  <Mic size={20} color="#fff" />
                </div>
              </div>
            )}
            {!isUserTurn && isSpeaking && <div className="gm-speaking-ring" />}
            {isUserTurn && <div className="gm-speaking-ring" />}
            {/* Thinking animation — shows while AI generates speech */}
            {isThinking && !isUserTurn && (
              <div className="thinking-overlay">
                <div className="thinking-dots">
                  <span></span><span></span><span></span>
                </div>
                <p className="thinking-label">AI is thinking…</p>
              </div>
            )}
          </div>
          <h2 style={{ marginTop: '16px' }}>{currentSpeaker.name}</h2>
          <div className="role-tag" style={{ marginTop: '8px' }}>{currentSpeaker.role} Speaking</div>
        </div>

        <div className={`transcript-panel left-panel ${showTranscript ? 'open' : ''}`}>
          <div className="panel-header">
            <span className="panel-title">Proposition Summary</span>
            <button onClick={() => setShowTranscript(false)} className="close-btn">×</button>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 65px)', padding: '16px', overflow: 'hidden' }}>
            <ul style={{ flex: 1, overflowY: 'auto', listStyle: 'none', padding: 0 }}>
              {propSummary.length === 0 ? (
                <li className="gm-empty-state">No Proposition summary points yet.</li>
              ) : (
                propSummary.map((point, i) => (
                  <li key={i} className="gm-point-item">
                    <span className="gm-point-bullet">▸</span>
                    {point}
                  </li>
                ))
              )}
            </ul>
            <div className="team-avatars">
              {allSpeakers.filter(p => p.team === 'prop').map((spk, i) => (
                <div className={`avatar-box ${spk.name === currentSpeaker.name ? 'active-speaker' : ''}`} key={i}>
                  <img src={spk.avatar} alt={spk.name} />
                  <div className="role-label">{spk.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`transcript-panel right-panel ${showTranscript ? 'open' : ''}`}>
          <div className="panel-header">
            <span className="panel-title">Opposition Summary</span>
            <button onClick={() => setShowTranscript(false)} className="close-btn">×</button>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 65px)', padding: '16px', overflow: 'hidden' }}>
            <ul style={{ flex: 1, overflowY: 'auto', listStyle: 'none', padding: 0 }}>
              {oppSummary.length === 0 ? (
                <li className="gm-empty-state">No Opposition summary points yet.</li>
              ) : (
                oppSummary.map((point, i) => (
                  <li key={i} className="gm-point-item gm-point-ai">
                    <span className="gm-point-bullet">▸</span>
                    {point}
                  </li>
                ))
              )}
            </ul>
            <div className="team-avatars">
              {allSpeakers.filter(p => p.team === 'opp').map((spk, i) => (
                <div className={`avatar-box ${spk.name === currentSpeaker.name ? 'active-speaker' : ''}`} key={i}>
                  <img src={spk.avatar} alt={spk.name} />
                  <div className="role-label">{spk.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showCaptions && currentLine && (
          <div className="caption-line global-caption">
            <strong>{isUserTurn ? 'You' : currentSpeaker.role}: </strong>
            {currentLine.split(' ').map((word, idx) => renderWord(word, idx, highlightedWordIndex))}
          </div>
        )}

        <div className="control-bar-wrapper">
          <div className="control-bar">
            <button className={`circle-button ${!isMuted ? 'speaking' : 'ready'}`} disabled style={{ pointerEvents: 'none' }}>
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button onClick={() => setShowTranscript(t => !t)} className={`circle-button ${showTranscript ? 'active' : ''}`}>
              <FileText size={20} color="#fff" />
            </button>

            <button onClick={() => setShowCaptions(c => !c)} className={`circle-button ${showCaptions ? 'active' : ''}`}>CC</button>
            
            <button onClick={toggleNoteTaker} className={`circle-button ${isNoteTakerOpen ? 'active' : ''}`}>
              <Notebook size={20} />
            </button>

            {/* Voice Plan Toggle — in the control bar */}
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

            <button onClick={() => hangupclick()} className="circle-button hangup-button">
              <PhoneOff size={20} color="#fff" />
            </button>

            <button className="circle-button" onClick={nextSpeaker} style={{ background: '#10b981' }} title="Next Speaker">
              ➡️
            </button>
          </div>
        </div>

        <div className={`note-taker-panel ${isNoteTakerOpen ? 'open' : ''}`}>
          <div className="note-taker-header">
            <h2>Notes</h2>
            <button onClick={toggleNoteTaker} className="close-note-taker-btn" aria-label="Close note taker">
              <Notebook size={18} />
            </button>
          </div>
          <textarea
            className="note-taker-textarea"
            style={{ height: '70%' }}
            value={notes}
            readOnly
            placeholder="No notes available..."
          />
        </div>
      </div>
    );
  }

  // Mobile View
  return (
    <div className="gm-container">
      {/* ── TOPIC BAR ── */}
      <div className="gm-topic-bar">
        <span className="gm-topic-label">Topic</span>
        <span className="gm-topic-text">{topic}</span>
        {userStance && (
          <span className="gm-stance-badge">
            You: {userStance.charAt(0).toUpperCase() + userStance.slice(1)} ({userRole})
          </span>
        )}
        {/* Voice plan toggled from NavigationBar only */}
      </div>

      {/* ── MAIN ROW ── */}
      <div className="gm-main-row">
        {/* LEFT: Video Stage */}
        <div className="gm-stage">
          <div className="gm-video-wrapper">
            {!isUserTurn ? (
              <video ref={videoRef} className="gm-video" src={currentSpeaker.video} loop muted playsInline />
            ) : (
              <div className="gm-video" style={{ position: 'relative', overflow: 'hidden' }}>
                <img
                  src={currentSpeaker.avatar}
                  alt={currentSpeaker.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(16, 185, 129, 0.95)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                  animation: 'pulse-mic 1.5s infinite',
                  zIndex: 20
                }}>
                  <Mic size={16} color="#fff" />
                </div>
              </div>
            )}
            {!isUserTurn && isSpeaking && <div className="gm-speaking-ring" />}
            {isUserTurn && <div className="gm-speaking-ring" />}
          </div>
          
          <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 10 }}>
            <span style={{ fontWeight: 'bold' }}>{currentSpeaker.name}</span>
            <span style={{ color: '#c084fc' }}>{currentSpeaker.role}</span>
            <span style={{ color: '#fbbf24' }}>⏱️ {timeLeft}s</span>
          </div>
        </div>

        {/* MIDDLE: Info panel */}
        <div className="gm-side-panel">
          <div className="gm-info-section" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="gm-info-title">
              {oppositeTeamLabel} Summary
            </div>
            <ul className="gm-points-list" style={{ flex: 1, overflowY: 'auto', marginBottom: '8px' }}>
              {oppositeSummaryPoints.length === 0 ? (
                <li className="gm-empty-state">No points yet.</li>
              ) : (
                oppositeSummaryPoints.map((pt, i) => (
                  <li key={i} className={`gm-point-item ${oppositeTeam === 'opp' ? 'gm-point-ai' : ''}`} style={{ fontSize: '10px', padding: '6px 8px' }}>
                    <span className="gm-point-bullet">▸</span>
                    {pt}
                  </li>
                ))
              )}
            </ul>
            <div className="team-avatars" style={{ display: 'flex', justifyContent: 'space-around', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', flexShrink: 0 }}>
              {oppositeSpeakers.map((spk, i) => (
                <div className={`avatar-box ${spk.name === currentSpeaker.name ? 'active-speaker' : ''}`} key={i} style={{ transform: 'none' }}>
                  <img src={spk.avatar} alt={spk.name} style={{ width: '32px', height: '32px', border: oppositeTeam === 'opp' ? '2px solid #a855f7' : '2px solid #34d399', margin: 0 }} />
                  <div className="role-label" style={{ fontSize: '8px', padding: '1px 3px', minWidth: 'unset', marginTop: '2px' }}>{spk.role}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="gm-panel-controls">
            <button className={`gm-ctrl-btn ${!isMuted ? 'gm-btn-active' : 'gm-btn-muted'}`} title="Mic status" style={{ width: '34px', height: '34px' }} disabled>
              {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <button onClick={() => setShowCaptions(!showCaptions)} className={`gm-ctrl-btn ${showCaptions ? 'gm-btn-active' : ''}`} title="Captions" style={{ width: '34px', height: '34px' }}>
              <MessageSquare size={14} />
            </button>
            <button onClick={toggleNoteTaker} className="gm-ctrl-btn" title="Toggle Notes" style={{ width: '34px', height: '34px' }}>
              <Notebook size={14} />
            </button>
            {/* Voice Plan Toggle — mobile 3v3 */}
            <button
              onClick={toggleVoicePlan}
              className="gm-ctrl-btn"
              title={`Voice: ${voicePlanDisplay}`}
              style={{
                width: 'auto', height: '34px', padding: '0 6px',
                background: voicePlanDisplay === 'Pro' ? 'rgba(168,85,247,0.35)' : 'rgba(251,191,36,0.35)',
                border: voicePlanDisplay === 'Pro' ? '1.5px solid #a855f7' : '1.5px solid #fbbf24',
                color: voicePlanDisplay === 'Pro' ? '#c084fc' : '#fbbf24',
                fontSize: '9px', fontWeight: 800
              }}
            >
              {voicePlanDisplay === 'Pro' ? '⚡PRO' : '💡LITE'}
            </button>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="gm-sidebar">
          <button onClick={nextSpeaker} className="gm-nav-btn" style={{ background: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,0.5)', color: '#34d399' }} title="Next Speaker">
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>➡️</span>
          </button>
          {/* Voice Plan Toggle — mobile sidebar */}
          <button
            onClick={toggleVoicePlan}
            className="gm-nav-btn"
            title={`Voice: ${voicePlanDisplay}`}
            style={{
              width: 'auto', padding: '0 6px',
              background: voicePlanDisplay === 'Pro' ? 'rgba(168,85,247,0.2)' : 'rgba(251,191,36,0.2)',
              borderColor: voicePlanDisplay === 'Pro' ? 'rgba(168,85,247,0.5)' : 'rgba(251,191,36,0.5)',
              color: voicePlanDisplay === 'Pro' ? '#c084fc' : '#fbbf24',
              fontSize: '9px', fontWeight: 800
            }}
          >
            {voicePlanDisplay === 'Pro' ? '⚡PRO' : '💡LITE'}
          </button>
          <button onClick={() => navigate('/overview')} className="gm-nav-btn" title="Dashboard">
            <Home size={17} />
          </button>
          <button onClick={toggleNoteTaker} className="gm-nav-btn" title="Notes">
            <Notebook size={17} />
          </button>
          <button onClick={() => hangupclick()} className="gm-nav-btn" style={{ background: 'rgba(220,38,38,0.2)', borderColor: 'rgba(220,38,38,0.5)' }} title="End">
            <PhoneOff size={17} />
          </button>
        </div>
      </div>

      {/* ── MOBILE CAPTION BAR ── */}
      {showCaptions && (
        <div className="gm-caption-bar">
          <div className="gm-caption-overlay">
            {currentLine && (
              <div className={`gm-caption-line ${isUserTurn ? 'gm-caption-user' : 'gm-caption-ai'}`}>
                <span className="gm-caption-speaker">{isUserTurn ? 'You' : currentSpeaker.role}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentLine.split(" ").map((word, idx) => renderWord(word, idx, highlightedWordIndex))}
                </span>
              </div>
            )}
            {!currentLine && (
              <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px' }}>
                {isUserTurn ? 'Speak now...' : 'Waiting for speaker...'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Note Taker Panel (Mobile Overlay) */}
      <div className={`note-taker-panel ${isNoteTakerOpen ? 'open' : ''}`}>
        <div className="note-taker-header">
          <h2>Notes</h2>
          <button onClick={toggleNoteTaker} className="close-note-taker-btn" aria-label="Close note taker">
            <Notebook size={18} />
          </button>
        </div>
        <textarea
          className="note-taker-textarea"
          value={notes}
          readOnly
          placeholder="No notes available..."
        />
      </div>
    </div>
  );
};

export default DebateUI;