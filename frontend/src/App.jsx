// src/App.jsx
import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate
} from 'react-router-dom';
import './styles/main.css';

import Landing from './components/Landing';
import VoiceOnboarding from './components/VoiceOnboarding';
import WorkerProfile from './components/WorkerProfile';
import WorkersList from './components/WorkersList';
import AuthPage from './components/AuthPage';
import WorkerDashboard from './components/WorkerDashboard';
import EmployerDashboard from './components/EmployerDashboard';
import Feedback from './components/Feedback';
import { getMetrics } from './api';
import { LanguageProvider } from './contexts/LanguageContext';

/* ---------- MAIN APP CONTENT (after login) ---------- */

const AppContent = () => {
  const [mode, setMode] = useState('landing');
  const [worker, setWorker] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMetrics()
      .then(setMetrics)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const pathToMode = {
      '/app': 'landing',
      '/worker-onboard': 'worker-onboard',
      '/worker-profile': 'worker-profile'
    };

    if (pathToMode[window.location.pathname]) {
      setMode(pathToMode[window.location.pathname]);
    }
  }, []);

  const handleWorkerFlowStart = () => {
    setMode('worker-onboard');
    navigate('/worker-onboard');
    setWorker(null);
  };

  const handleEmployerFlowStart = () => {
    navigate('/');
  };

  const handleProfileReady = (newWorker) => {
    setWorker(newWorker);
    setMode('worker-profile');
    navigate('/worker-profile');
    getMetrics().then(setMetrics).catch(() => {});
  };

  return (
    <div>
      <header className="topbar">
        <div className="topbar-logo">KaamWali.AI</div>
        <div className="topbar-right">
          {metrics ? (
            <span className="topbar-tagline">
              {metrics.workersCount} women onboarded · {metrics.employersCount} homes reached
            </span>
          ) : (
            <span className="topbar-tagline">Voice-first jobs for domestic workers</span>
          )}
        </div>
      </header>

      <main className="page">
        {mode === 'landing' && (
          <Landing
            onWorkerClick={handleWorkerFlowStart}
            onEmployerClick={handleEmployerFlowStart}
          />
        )}

        {mode === 'worker-onboard' && (
          <div className="layout">
            <VoiceOnboarding onProfileReady={handleProfileReady} />
          </div>
        )}

        {mode === 'worker-profile' && (
          <div className="layout">
            <WorkerProfile
              worker={worker}
              onBack={() => {
                setMode('worker-onboard');
                navigate('/worker-onboard');
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
};

/* ---------- ROUTES: AUTH FIRST, THEN APP ---------- */

const AppRoutes = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('userData');
    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('userData');
      return null;
    }
  });
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole'));

  const handleAuthSuccess = (role, user) => {
    setUserRole(role);
    setCurrentUser(user || null);

    localStorage.setItem('userRole', role);
    if (user) {
      localStorage.setItem('userData', JSON.stringify(user));
    } else {
      localStorage.removeItem('userData');
    }

    if (role === 'worker') {
      navigate('/worker-dashboard');
    } else if (role === 'employer') {
      navigate('/employer-dashboard');
    }
  };

  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<AuthPage onAuthSuccess={handleAuthSuccess} />} />

        <Route
          path="/worker-dashboard"
          element={
            userRole === 'worker'
              ? <WorkerDashboard user={currentUser} />
              : <AuthPage onAuthSuccess={handleAuthSuccess} />
          }
        />

        <Route
          path="/employer-dashboard"
          element={
            userRole === 'employer'
              ? <EmployerDashboard user={currentUser} />
              : <AuthPage onAuthSuccess={handleAuthSuccess} />
          }
        />

        <Route path="/for-employers" element={<WorkersList />} />
        <Route path="/feedback" element={<Feedback />} />

        <Route path="/app" element={<AppContent />} />
        <Route path="/worker-onboard" element={<AppContent />} />
        <Route path="/worker-profile" element={<AppContent />} />

        <Route path="*" element={<AuthPage onAuthSuccess={handleAuthSuccess} />} />
      </Routes>
    </LanguageProvider>
  );
};

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
