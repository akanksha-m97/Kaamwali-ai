import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMetrics } from '../api';

const WorkerHeader = ({
  onLogout,
  activePath,
  showLogout = true,
  tryDemoPath = '/worker-onboard',
  logoPath = '/worker-dashboard',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    let mounted = true;

    getMetrics()
      .then((data) => {
        if (mounted) setMetrics(data);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = onLogout || (() => {
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('workerPhone');
    navigate('/');
  });

  const currentPath = activePath || location.pathname;

  const navItems = [
    { label: 'My profile', path: '/worker-profile' },
    { label: 'Work opportunities', path: '/worker-onboard' },
  ];

  return (
    <>
      <style>{`
        .worker-header-topbar {
          background: #1a2e22;
          color: #d1fae5;
          font-size: 12px;
          text-align: center;
          padding: 6px 16px;
           width: 100vw;
  margin-left: calc(50% - 50vw);
        }

        .worker-header-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
           width: 100vw;
  margin-left: calc(50% - 50vw);
          padding: 0 48px;
          min-height: 64px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
        }

        .worker-header-logo {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.5px;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
        }

        .worker-header-logo span {
          color: #16a34a;
        }

        .worker-header-links {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .worker-header-link {
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          padding: 8px 14px;
          border-radius: 8px;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .worker-header-link:hover,
        .worker-header-link.is-active {
          background: #f0fdf4;
          color: #16a34a;
        }

        .worker-header-cta {
          background: #16a34a;
          color: #fff;
          border: none;
          font-size: 14px;
          font-weight: 600;
          padding: 9px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .worker-header-cta:hover {
          background: #15803d;
          transform: translateY(-1px);
        }

        .worker-header-logout {
          background: #fee2e2;
          color: #dc2626;
        }

        @media (max-width: 900px) {
          .worker-header-nav {
            padding: 12px 20px;
            align-items: flex-start;
            flex-direction: column;
          }

          .worker-header-links {
            width: 100%;
            justify-content: flex-start;
          }
        }

        @media (max-width: 580px) {
          .worker-header-topbar {
            padding: 6px 12px;
            line-height: 1.35;
          }

          .worker-header-nav {
            padding: 12px 12px;
          }

          .worker-header-logo {
            font-size: 18px;
          }

          .worker-header-link,
          .worker-header-cta {
            font-size: 13px;
            padding: 8px 10px;
          }
        }
      `}</style>

      <div className="worker-header-topbar">
        {metrics
          ? `${metrics.workersCount} women onboarded · ${metrics.employersCount} homes reached`
          : 'Voice-first jobs for domestic workers'}
      </div>

      <header className="worker-header-nav">
        <div
          className="worker-header-logo"
          onClick={() => navigate(logoPath)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              navigate(logoPath);
            }
          }}
        >
          KaamWali.<span>AI</span>
        </div>

        <nav className="worker-header-links" aria-label="Worker navigation">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`worker-header-link${currentPath === item.path ? ' is-active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
          <button type="button" className="worker-header-cta" onClick={() => navigate(tryDemoPath)}>
            Try demo
          </button>
          {showLogout && (
            <button type="button" className="worker-header-link worker-header-logout" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </header>
    </>
  );
};

export default WorkerHeader;