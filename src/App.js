import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import NavigationBar from './Components/NavigationBar/NavigationBar.jsx';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Route-level code splitting — lazy-load every page component so each route
// is downloaded only when it is first visited (Requirements 1.1, 1.2, 1.6).
// NavigationBar and SidebarLayout are NOT lazy — they are always present on
// sidebar routes and must be ready before any child page mounts.
// ---------------------------------------------------------------------------
const LoginPage       = React.lazy(() => import('./Components/login/Login'));
const List            = React.lazy(() => import('./Components/dropdown/List'));
const Dashboard       = React.lazy(() => import('./Components/Dashboard/Dash'));
const Profile         = React.lazy(() => import('./Components/Dashboard/Profile'));
const Api             = React.lazy(() => import('./Components/apitest'));
const Arina           = React.lazy(() => import('./Components/Arina/arina'));
const MyDebates       = React.lazy(() => import('./Components/Dashboard/my_debate/MyDebates.jsx'));
const FeedbackPage    = React.lazy(() => import('./Components/Dashboard/my_debate/Feedback.jsx'));
const AIJudge         = React.lazy(() => import('./Components/Aijudge/Aijudge.jsx'));
const TalkingAvatar   = React.lazy(() => import('./Components/Arina/avatar/TalkingAvatar.jsx'));
const DebateRoom      = React.lazy(() => import('./Components/Arina/arina3v3.jsx'));
const DebatePrep1     = React.lazy(() => import('./Components/Caseprep/DebatePrep1.jsx'));
const Ranking         = React.lazy(() => import('./Components/Ranking/Ranking.jsx'));
const IntroWebsite    = React.lazy(() => import('./Components/Intro/intro.jsx'));
const PronunciationJudge = React.lazy(() => import('./Components/pronoun/pronoun.jsx'));
const Hangout         = React.lazy(() => import('./Components/Hangout/Hangout.jsx'));
const Mentor          = React.lazy(() => import('./Components/Mentor/Mentor.jsx'));

// ---------------------------------------------------------------------------
// Global Axios request interceptor to automatically attach Authorization header
// ---------------------------------------------------------------------------
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Global window.fetch override to automatically attach Authorization header
// IMPORTANT: Only attach to our own backend API, NOT to Firebase/Google APIs
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  const url = typeof resource === 'string' ? resource : resource?.url || '';
  const isOwnBackend = url.startsWith(process.env.React_App_url || 'http://localhost:5000');
  const token = localStorage.getItem('token');
  if (token && isOwnBackend) {
    config = config || {};
    config.headers = config.headers || {};
    if (config.headers instanceof Headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else if (Array.isArray(config.headers)) {
      // Skip array header manipulation
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return originalFetch(resource, config);
};

const SIDEBAR_PATHS = [
  '/overview',
  '/overview/playground',
  '/overview/ranking',
  '/overview/hangout',
  '/overview/feedbackpage',
  '/overview/profile',
  '/overview/mentor',
];

// ---------------------------------------------------------------------------
// AppLoadingFallback — full-screen purple spinner shown while a lazy chunk
// is loading (Requirement 1.3). Defined inline so no extra import is needed.
// ---------------------------------------------------------------------------
const AppLoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100vw',
      height: '100vh',
      background: '#0a0014',
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: '4px solid rgba(168, 85, 247, 0.2)',
        borderTopColor: '#a855f7',
        animation: 'appSpinner 0.75s linear infinite',
      }}
    />
    <style>{`
      @keyframes appSpinner {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const SidebarLayout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (isMobile) {
    // Mobile: full screen content, bottom nav floats on top
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0014' }}>
        {/* Content scrolls, with padding at bottom so it clears the nav bar */}
        <div style={{ width: '100%', height: '100%', overflowY: 'auto', paddingBottom: '70px', boxSizing: 'border-box' }}>
          {children}
        </div>
        {/* Bottom nav floats fixed */}
        <NavigationBar />
      </div>
    );
  }

  // Desktop: sidebar left + content right
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0014' }}>
      {/* Sidebar — width is self-managed inside NavigationBar via its own state */}
      <NavigationBar />

      {/* Content — flex:1 + minWidth:0 fills all remaining space dynamically */}
      <div style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("userEmail"));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hasEmail = !!localStorage.getItem("userEmail");
    if (isLoggedIn !== hasEmail) {
      setIsLoggedIn(hasEmail);
    }
  }, [location.pathname, isLoggedIn]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLoginSuccess = (user) => {
    localStorage.setItem("userEmail", user.email);
    setIsLoggedIn(true);
    navigate("/overview");
  };

  const showSidebar = isLoggedIn && SIDEBAR_PATHS.includes(location.pathname.toLowerCase());

  // Wrap the Routes tree in React.Suspense so lazy-loaded chunks show the
  // fallback spinner while downloading (Requirement 1.3).
  const routes = (
    <React.Suspense fallback={<AppLoadingFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<IntroWebsite />} />
        <Route path="/intro" element={<IntroWebsite />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/overview" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />

        {/* Sidebar pages */}
        <Route path="/overview" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/overview/playground" element={isLoggedIn ? <PronunciationJudge /> : <Navigate to="/login" />} />
        <Route path="/overview/ranking" element={isLoggedIn ? <Ranking /> : <Navigate to="/login" />} />
        <Route path="/overview/hangout" element={isLoggedIn ? <Hangout /> : <Navigate to="/login" />} />
        <Route path="/overview/feedbackpage" element={isLoggedIn ? <FeedbackPage /> : <Navigate to="/login" />} />
        <Route path="/overview/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/overview/mentor" element={isLoggedIn ? <Mentor /> : <Navigate to="/login" />} />

        {/* Full-screen pages */}
        <Route path="/list" element={isLoggedIn ? <List /> : <Navigate to="/login" />} />
        <Route path="/arina" element={isLoggedIn ? <Arina /> : <Navigate to="/login" />} />
        <Route path="/api" element={isLoggedIn ? <Api /> : <Navigate to="/login" />} />
        <Route path="/aijudge" element={isLoggedIn ? <AIJudge /> : <Navigate to="/login" />} />
        <Route path="/talkai" element={isLoggedIn ? <TalkingAvatar textToSpeak="That's a very interesting argument you made. Let me explain..." /> : <Navigate to="/login" />} />
        <Route path="/arina3v3" element={isLoggedIn ? <DebateRoom /> : <Navigate to="/login" />} />
        <Route path="/caseprep" element={isLoggedIn ? <DebatePrep1 /> : <Navigate to="/login" />} />
        <Route path="/my-debates" element={isLoggedIn ? <MyDebates /> : <Navigate to="/login" />} />
      </Routes>
    </React.Suspense>
  );

  const offlineBar = !isOnline && (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', backgroundColor: '#ef4444', color: 'white',
      textAlign: 'center', padding: '10px', zIndex: 9999, fontWeight: 'bold'
    }}>
      No Internet Connection. Please check your network.
    </div>
  );

  return (
    <>
      {offlineBar}
      {showSidebar ? <SidebarLayout>{routes}</SidebarLayout> : <>{routes}</>}
    </>
  );
}

export default App;
