import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './Components/login/Login';
import List from './Components/dropdown/List';
import Dashboard from './Components/Dashboard/Dash';
import Api from './Components/apitest';
import Arina from './Components/Arina/arina';
import MyDebates from "./Components/Dashboard/my_debate/MyDebates.jsx";
import FeedbackPage from './Components/Dashboard/my_debate/Feedback.jsx';
import AIJudge from './Components/Aijudge/Aijudge.jsx';
import TalkingAvatar from './Components/Arina/avatar/TalkingAvatar.jsx';
import DebateRoom from './Components/Arina/arina3v3.jsx';
import DebatePrep1 from './Components/Caseprep/DebatePrep1.jsx';
import Ranking from './Components/Ranking/Ranking.jsx';
import IntroWebsite from './Components/Intro/intro.jsx';
import PronunciationJudge from './Components/pronoun/pronoun.jsx';
import Hangout from './Components/Hangout/Hangout.jsx';
import NavigationBar from './Components/NavigationBar/NavigationBar.jsx';

const SIDEBAR_PATHS = [
  '/overview',
  '/overview/playground',
  '/overview/ranking',
  '/overview/hangout',
  '/overview/feedbackpage',
];

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
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginSuccess = (user) => {
    localStorage.setItem("userEmail", user.email);
    setIsLoggedIn(true);
    navigate("/overview");
  };

  const showSidebar = isLoggedIn && SIDEBAR_PATHS.includes(location.pathname.toLowerCase());

  const routes = (
    <Routes>
      {/* Public */}
      <Route path="/"      element={<IntroWebsite />} />
      <Route path="/intro" element={<IntroWebsite />} />
      <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />

      {/* Sidebar pages */}
      <Route path="/overview"              element={isLoggedIn ? <Dashboard />          : <Navigate to="/login" />} />
      <Route path="/overview/playground"   element={isLoggedIn ? <PronunciationJudge /> : <Navigate to="/login" />} />
      <Route path="/overview/ranking"      element={isLoggedIn ? <Ranking />            : <Navigate to="/login" />} />
      <Route path="/overview/hangout"      element={isLoggedIn ? <Hangout />            : <Navigate to="/login" />} />
      <Route path="/overview/feedbackpage" element={isLoggedIn ? <FeedbackPage />       : <Navigate to="/login" />} />

      {/* Full-screen pages */}
      <Route path="/list"        element={isLoggedIn ? <List />         : <Navigate to="/login" />} />
      <Route path="/arina"       element={isLoggedIn ? <Arina />        : <Navigate to="/login" />} />
      <Route path="/api"         element={isLoggedIn ? <Api />          : <Navigate to="/login" />} />
      <Route path="/aijudge"     element={isLoggedIn ? <AIJudge />      : <Navigate to="/login" />} />
      <Route path="/talkai"      element={isLoggedIn ? <TalkingAvatar textToSpeak="That's a very interesting argument you made. Let me explain..." /> : <Navigate to="/login" />} />
      <Route path="/arina3v3"    element={isLoggedIn ? <DebateRoom />   : <Navigate to="/login" />} />
      <Route path="/caseprep"    element={isLoggedIn ? <DebatePrep1 />  : <Navigate to="/login" />} />
      <Route path="/my-debates"  element={isLoggedIn ? <MyDebates />    : <Navigate to="/login" />} />
    </Routes>
  );

  return showSidebar ? <SidebarLayout>{routes}</SidebarLayout> : <>{routes}</>;
}

export default App;