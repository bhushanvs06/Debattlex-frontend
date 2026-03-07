import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileText, PhoneOff, Volume2 } from 'lucide-react';
import './Arina.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

var url = process.env.React_App_url;

const toBoldItalic = (word) => {
  const map = {
    a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠',
    h: '𝐡', i: '𝐢', j: '𝐣', k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧',
    o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮',
    v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳',
    A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆',
    H: '𝐇', I: '𝐈', J: '𝐉', K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍',
    O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓', U: '𝐔',
    V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙'
  };
  return word.split('').map(c => map[c] || c).join('');
};

const highlightImportant = (text) => {
  return text.split(' ').map(word => {
    const strippedWord = word.replace(/[\*#]/g, '');
    const clean = strippedWord.replace(/[^a-zA-Z]/g, '');
    return clean.toLowerCase() === 'important' ? toBoldItalic(strippedWord) : strippedWord;
  }).join(' ');
};

const Arina = () => {
  const [email, setEmail] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [debateTopic, setDebateTopic] = useState('Loading topic...');
  const [userStance, setUserStance] = useState('');
  const [debateType, setDebateType] = useState('');
  const [userTranscripts, setUserTranscripts] = useState([]);
  const [aiTranscripts, setAITranscripts] = useState([]);
  const [userSummaryPoints, setUserSummaryPoints] = useState([]);
  const [aiSummaryPoints, setAISummaryPoints] = useState([]);
  const [captionLines, setCaptionLines] = useState([]);
  const [captionLineIndex, setCaptionLineIndex] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUserTranscript, setCurrentUserTranscript] = useState('');
  const [userCaption, setUserCaption] = useState('');

  const [latestKey, setLatestKey] = useState(''); // ← ADDED FOR SAVING (only this state)

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const currentSourceRef = useRef(null);
  const videoRef = useRef(null);
  const isMounted = useRef(true);
  const navigate = useNavigate();

  // ====================== INITIAL SETUP ======================
 useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (!storedEmail) {
      alert('User email not found. Please log in again.');
      navigate('/login');
      return;
    }
    setEmail(storedEmail);
  }, [navigate]);

  useEffect(() => {
    if (!email) return;

    axios.post(url + '/api/fetchEntries', { email })
      .then(res => {
        const entries = res.data.entries || {};
        const keys = Object.keys(entries);

        if (keys.length === 0) {
          setDebateTopic('No debate found');
          return;
        }

        const oneVsOneEntries = keys
          .filter(key => entries[key].debateType?.toLowerCase() === '1v1')
          .sort((a, b) => new Date(entries[b].createdAt) - new Date(entries[a].createdAt));

        if (oneVsOneEntries.length > 0) {
          const latestKey = oneVsOneEntries[0];
          const latestEntry = entries[latestKey];
          console.log("Latest 1v1 entry loaded:", {
            key: latestKey,
            topic: latestEntry.topic,
            stance: latestEntry.stance,
            userrole: latestEntry.userrole,
            createdAt: latestEntry.createdAt
          });

          setLatestKey(latestKey); // ← ADDED FOR SAVING
          setDebateTopic(latestEntry.topic || 'Untitled Debate');
          setUserStance(latestEntry.stance || '');
          setDebateType(latestEntry.debateType || '1v1');
          setUserRole(latestEntry.userrole || '');
        } else {
          setDebateTopic('No 1v1 debate found');
        }
      })
      .catch(err => {
        console.error('❌ Fetch entry error:', err);
        setDebateTopic('Error loading topic');
      });
  }, [email]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (currentSourceRef.current) currentSourceRef.current.stop();
    };
  }, []);

  // ====================== TEST VOICE BUTTON ======================
  const testTTS = async () => {
    // ... exactly your original code (unchanged)
    console.log('🧪 === TEST TTS STARTED ===');
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

      const testText = "Hello, this is a test. Can you hear the AI voice clearly now? This is Debattlex speaking.";

      const ttsRes = await axios.post(url + '/api/tts', { text: testText ,  speaker: "manisha"});
      const base64Audio = ttsRes.data.audioBase64;

      if (!base64Audio || base64Audio.length < 100) throw new Error('No audio received');

      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const arrayBuffer = new Uint8Array(byteNumbers).buffer;

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      currentSourceRef.current = source;

      source.onended = () => console.log('✅ Test audio finished');
      source.start();
      console.log('▶️ TEST AUDIO PLAYING — YOU SHOULD HEAR VOICE NOW!');
    } catch (err) {
      console.error('❌ TEST FAILED:', err.message || err);
    }
  };

  // ====================== MIC TOGGLE ======================
  const toggleMute = async () => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

    if (isSpeaking) {
      if (currentSourceRef.current) {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }
      setIsSpeaking(false);
      setCaptionLines([]);
      setCaptionLineIndex(0);
      setHighlightedWordIndex(0);
    }

    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (newMuted) {
      const text = currentUserTranscript.trim();
      setCurrentUserTranscript('');
      setUserCaption('');
      if (!text) return;

      try {
        const ai_stance = userStance === 'proposition' ? 'opposition' : 'proposition';
        const aiRes = await axios.post(url + '/api/ask', {
          question: text,
          topic: debateTopic,
          stance: ai_stance,
          type: debateType,
          transcripts: userTranscripts.slice(0, 5),
        });

        const aiText = aiRes.data.answer.replace(/[\*#]/g, '');
        const aiEntry = { speaker: 'AI', text: aiText };
        const updatedAI = [aiEntry, ...aiTranscripts];
        setAITranscripts(updatedAI);

        const updatedUser = [...userTranscripts, { speaker: 'You', text: text }];
        setUserTranscripts(updatedUser);

        const summaryResult = await updateSummaries(updatedUser, updatedAI); // ← ADDED FOR SAVING (now awaits return value)
        await saveDebateProgress(updatedUser, updatedAI, summaryResult.userSummaryArr, summaryResult.aiSummaryArr); // ← ADDED FOR SAVING

        const lines = aiText.split(/[.?!]\s+/).filter(l => l.trim());
        setCaptionLines(lines);
        setCaptionLineIndex(0);
        setHighlightedWordIndex(0);
        speakCaptionLines(lines, 0);
      } catch (err) {
        console.error('❌ AI response error:', err);
      }
    }
  };

  const handleHangUp = () => {
    if (window.confirm('Are you sure you want to hang up?')) {
      if (currentSourceRef.current) currentSourceRef.current.stop();
      setIsSpeaking(false);
      setCaptionLines([]);
      setIsMuted(true);
      navigate('/Aijudge');
    }
  };

  // ====================== TTS PLAYBACK ======================
  const speakCaptionLines = async (lines, index) => {
    // ... exactly your original code (unchanged)
    if (!isMounted.current || index >= lines.length) {
      setIsSpeaking(false);
      return;
    }

    const line = lines[index].replace(/[\*#]/g, '');
    setCaptionLineIndex(index);
    setHighlightedWordIndex(0);

    try {
      setIsSpeaking(true);

      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

      console.log(`🎤 Sending line ${index + 1} to backend for TTS: "${line.substring(0, 60)}..."`);

      const ttsRes = await axios.post(url + '/api/tts', { text: line });
      const base64Audio = ttsRes.data.audioBase64;

      if (!base64Audio || base64Audio.length < 100) throw new Error('No valid audio');

      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const arrayBuffer = new Uint8Array(byteNumbers).buffer;

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      currentSourceRef.current = source;

      const words = line.split(' ');
      const durationPerWord = (audioBuffer.duration || 1) * 1000 / words.length;
      let wordIndex = 0;
      const interval = setInterval(() => {
        setHighlightedWordIndex(wordIndex);
        wordIndex++;
        if (wordIndex >= words.length) clearInterval(interval);
      }, durationPerWord);

      source.onended = () => {
        clearInterval(interval);
        currentSourceRef.current = null;
        speakCaptionLines(lines, index + 1);
      };

      source.start();
      console.log(`▶️ AI VOICE PLAYING for line ${index + 1}`);
    } catch (error) {
      console.error('❌ TTS Error:', error);
      speakCaptionLines(lines, index + 1);
    }
  };

  const toggleTranscript = () => setShowTranscript(!showTranscript);
  const toggleCaptions = () => setShowCaptions(!showCaptions);

  const updateSummaries = async (userData, aiData) => {
    try {
      const limitedUser = userData.slice(0, 5);
      const limitedAi = aiData.slice(0, 5);

      const res = await axios.post(url + '/api/summarize-transcripts', {
        userTranscripts: limitedUser,
        aiTranscripts: limitedAi,
      });

      const userSummaryArr = res.data.userSummary.split('\n').map(p => p.trim()).filter(p => p);
      const aiSummaryArr = res.data.aiSummary.split('\n').map(p => p.trim()).filter(p => p);

      setUserSummaryPoints(userSummaryArr);
      setAISummaryPoints(aiSummaryArr);

      return { userSummaryArr, aiSummaryArr }; // ← ADDED FOR SAVING (so we can save them)
    } catch (err) {
      console.error('Summary error:', err);
      return { userSummaryArr: [], aiSummaryArr: [] };
    }
  };

  // ====================== NEW: SAVE TO DYNAMODB (exactly what you asked for) ======================
  const saveDebateProgress = async (updatedUser, updatedAI, userSummaryArr, aiSummaryArr) => {
    if (!latestKey || !email) return;
    try {
      await axios.post(url + '/api/save-transcripts', {
        email,
        topicKey: latestKey,
        userRole: userRole.toLowerCase(),
        userTranscripts: updatedUser.map(t => t.text),
        aiTranscripts: updatedAI.map(t => t.text),
        userSummary: userSummaryArr,
        aiSummary: aiSummaryArr,
        userStance,
      });
      console.log('✅ Saved transcripts & summaries to DynamoDB');
    } catch (err) {
      console.error('❌ Save failed:', err);
    }
  };

  // ====================== SPEECH RECOGNITION & VIDEO ======================
  useEffect(() => {
    // ... exactly your original code (unchanged)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = event => {
      let final = '', interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        event.results[i].isFinal ? final += t + ' ' : interim += t + ' ';
      }
      if (final) setCurrentUserTranscript(prev => prev + final);
      setUserCaption((currentUserTranscript + final + interim).trim());
    };

    !isMuted ? recognition.start() : recognition.stop();
    return () => recognition.stop();
  }, [isMuted, currentUserTranscript]);

  useEffect(() => {
    if (!videoRef.current) return;
    isSpeaking ? videoRef.current.play().catch(() => {}) : videoRef.current.pause();
  }, [isSpeaking]);
  return (
    <div className="arina-container">
      <h3 className="debate-topic-heading">
        Topic: <span className="debate-topic-title">{debateTopic}</span>
      </h3>

      <div className="arina-center">
        <div className="avatar-container">
          <video ref={videoRef} className="speaking-video" src="/girl1.mp4" loop muted playsInline />
        </div>
        <div className="line-divider"></div>
        <br />
      </div>

      <div className={`transcript-panel left-panel ${showTranscript ? 'open' : ''}`}>
        <div className="panel-header"><span className="panel-title">Your Points</span><button onClick={toggleTranscript} className="close-btn">×</button></div>
        <div className="panel-body">
          <ul>{userSummaryPoints.map((point, idx) => <li key={idx}>{highlightImportant(point.replace(/^[-•]\s*/, ''))}</li>)}</ul>
        </div>
      </div>

      <div className={`transcript-panel right-panel ${showTranscript ? 'open' : ''}`}>
        <div className="panel-header"><span className="panel-title">AI's Responses</span><button onClick={toggleTranscript} className="close-btn">×</button></div>
        <div className="panel-body">
          <ul>{aiSummaryPoints.map((point, idx) => <li key={idx}>{highlightImportant(point.replace(/^[-•]\s*/, ''))}</li>)}</ul>
        </div>
      </div>

      {showCaptions && (
        <div className="caption-line global-caption">
          {!isMuted && userCaption && `You: ${userCaption}`}
          {isSpeaking && captionLines.length > 0 && (
            <>AI:{' '}
              {captionLines[captionLineIndex].split(' ').map((word, idx) => {
                let displayWord = word.replace(/[\*#]/g, '');
                const clean = displayWord.replace(/[^a-zA-Z]/g, '');
                if (clean.toLowerCase() === 'important') displayWord = toBoldItalic(displayWord);
                return <span key={idx} style={{ color: idx === highlightedWordIndex ? 'yellow' : 'white', fontWeight: idx === highlightedWordIndex ? 'bold' : 'normal', marginRight: '4px' }}>{displayWord}</span>;
              })}
            </>
          )}
        </div>
      )}

      <div className="control-bar-wrapper">
        <div className="control-bar">
          <button onClick={toggleMute} className={`circle-button ${!isMuted ? 'speaking' : 'ready'}`}>
            {isMuted ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
          </button>
          <button onClick={toggleTranscript} className={`circle-button ${showTranscript ? 'active' : ''}`}><FileText size={20} color="#fff" /></button>
          <button onClick={toggleCaptions} className="circle-button">CC</button>
          <button onClick={handleHangUp} className="circle-button hangup-button"><PhoneOff size={20} color="#fff" /></button>
          <button onClick={testTTS} className="circle-button" style={{ background: '#10b981' }} title="Test AI Voice">
            <Volume2 size={20} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Arina;