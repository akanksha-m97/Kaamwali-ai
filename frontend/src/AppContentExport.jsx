// src/AppContentExport.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Landing from './components/Landing';
import VoiceOnboarding from './components/VoiceOnboarding';
import WorkerProfile from './components/WorkerProfile';
import WorkersList from './components/WorkersList';
import { getMetrics } from './api';

const AppContent = ({ initialMode = 'landing' }) => {
  const [mode, setMode] = useState(initialMode);
  const [worker, setWorker] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // load metrics once
  useEffect(() => {
    getMetrics()
      .then(setMetrics)
      .catch(() => {});
  }, []);

  // sync mode with current route
  useEffect(() => {
    const pathToMode = {
      '/app': 'landing',
      '/worker-onboard': 'worker-onboard',
      '/worker-profile': 'worker-profile',
      '/employers': 'employer'
    };

    const currentMode = pathToMode[location.pathname] || initialMode;
    setMode(currentMode);
  }, [location.pathname, initialMode]);

  const handleWorkerFlowStart = () => {
    setMode('worker-onboard');
    navigate('/worker-onboard');
    setWorker(null);
  };

  const handleEmployerFlowStart = () => {
    setMode('employer');
    navigate('/employers');
  };

  const handleProfileReady = (newWorker) => {
    setWorker(newWorker);
    setMode('worker-profile');
    navigate('/worker-profile');
    getMetrics().then(setMetrics).catch(() => {});
  };

  return (
    <div className="kw-page">
      {/* Shared top navigation + metrics */}
      <header className="kw-nav">
        <div className="kw-logo">KaamWali.AI</div>
        <nav className="kw-nav-links">
          {/* optional shared nav buttons can go here */}
        </nav>
        <div className="topbar-right">
          {metrics ? (
            <span className="topbar-tagline">
              {metrics.workersCount} women onboarded · {metrics.employersCount} homes reached
            </span>
          ) : (
            <span className="topbar-tagline">
              Voice‑first jobs for domestic workers
            </span>
          )}
        </div>
      </header>

      <main className="kw-main">
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

        {mode === 'employer' && (
          <div className="layout">
            <WorkersList />
          </div>
        )}
      </main>
    </div>
  );
};

export default AppContent;
