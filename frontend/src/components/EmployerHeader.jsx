import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMetrics } from '../api';

const EmployerHeader = ({ activePath }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    getMetrics().then(setMetrics).catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    navigate('/');
  };

  return (
    <>
      <div
        style={{
          background: '#162b22',
          color: '#8bd3b5',
          fontSize: 12,
          textAlign: 'center',
          padding: '8px 0',
        }}
      >
        {metrics
          ? `${metrics.workersCount} women onboarded · ${metrics.employersCount} homes reached`
          : 'Voice-first hiring for domestic help'}
      </div>

      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: '0 auto',
            padding: '0 28px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            onClick={() => navigate('/employer-dashboard')}
            style={{
              fontWeight: 800,
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            KaamWali<span style={{ color: '#16a34a' }}>.AI</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <button
              onClick={() => navigate('/for-employers')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: activePath === '/for-employers' ? '700' : '500',
              }}
            >
              Employer dashboard
            </button>

            <button
              onClick={() =>
                document
                  .getElementById('how-it-works')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              How it works
            </button>

            <button
              onClick={handleLogout}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>

            <button
              onClick={() => navigate('/feedback')}
              style={{
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '9px 22px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Feedback
            </button>

            <select
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}
            >
              <option>English</option>
              <option>हिंदी</option>
              <option>తెలుగు</option>
              <option>मराठी</option>
            </select>
          </div>
        </div>
      </header>
    </>
  );
};

export default EmployerHeader;