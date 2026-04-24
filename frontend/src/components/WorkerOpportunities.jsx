// src/components/WorkerOpportunities.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:4000'
    : 'https://kaamwali-ai-backend.onrender.com';

const WorkerOpportunities = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { messages } = useLanguage();
  const t = (messages && messages.workerOpportunities) || {};

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    const workerPhone = localStorage.getItem('workerPhone');
    if (!workerPhone) {
      setMessage('Please enter your phone number to view opportunities');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/hire-requests/worker?phone=${workerPhone}`);
      const data = await res.json();
      if (res.ok) {
        setOpportunities(data);
      } else {
        setMessage(data.message || 'Failed to load opportunities');
      }
    } catch (err) {
      setMessage('Server error while loading opportunities');
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId, status) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/hire-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(status === 'accepted' ? '✅ Request accepted!' : '❌ Request declined');
        // Refresh opportunities
        loadOpportunities();
      } else {
        setMessage(data.message || 'Failed to update request');
      }
    } catch (err) {
      setMessage('Server error while updating request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return { text: 'New Opportunity', color: '#059669', bg: '#ECFDF5' };
      case 'accepted': return { text: 'Accepted', color: '#15803D', bg: '#DCFCE7' };
      case 'declined': return { text: 'Declined', color: '#DC2626', bg: '#FEF2F2' };
      default: return { text: status, color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        height: '64px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}>
        <div style={{fontSize:20, fontWeight:800, color:'#111827', letterSpacing:'-0.5px', cursor:'pointer'}} onClick={() => navigate('/worker-dashboard')}>
          KaamWali.AI
        </div>
        <nav style={{display:'flex', gap:0}}>
          <button style={{background:'none', border:'none', fontSize:14, fontWeight:500, color:'#374151', cursor:'pointer', padding:'8px 14px', borderRadius:8, transition:'all 0.15s'}} onClick={() => navigate('/worker-dashboard')} onMouseEnter={(e)=>e.target.style.background='#f0fdf4'} onMouseLeave={(e)=>e.target.style.background='none'}>
            Dashboard
          </button>
          <button style={{background:'none', border:'none', fontSize:14, fontWeight:500, color:'#374151', cursor:'pointer', padding:'8px 14px', borderRadius:8, transition:'all 0.15s'}} onClick={() => navigate('/worker-profile')} onMouseEnter={(e)=>e.target.style.background='#f0fdf4'} onMouseLeave={(e)=>e.target.style.background='none'}>
            My Profile
          </button>
          <button style={{background:'#e5e7eb', border:'none', fontSize:14, fontWeight:500, color:'#374151', cursor:'pointer', padding:'8px 14px', borderRadius:8, transition:'all 0.15s'}} onClick={() => {}} onMouseEnter={(e)=>e.target.style.background='#d1d5db'} onMouseLeave={(e)=>e.target.style.background='#e5e7eb'}>
            Work Opportunities
          </button>
        </nav>
      </div>
      <div className="wd-card">
      <div className="wd-card-header">
        <div className="wd-card-icon wd-card-icon-green">💼</div>
        <div>
          <div className="wd-card-title">Job Opportunities</div>
          <div className="wd-card-subtitle">
            View and respond to hire requests from employers
          </div>
        </div>
      </div>

      {message && (
        <div className={`wd-msg ${message.includes('✅') ? 'wd-msg-success' : message.includes('❌') ? 'wd-msg-error' : 'wd-msg-neutral'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
          Loading opportunities...
        </div>
      ) : opportunities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            No opportunities yet
          </div>
          <div style={{ fontSize: '14px' }}>
            Employers will send you hire requests when they find your profile
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {opportunities.map((opp) => {
            const badge = getStatusBadge(opp.status);
            return (
              <div key={opp._id} style={{
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
                background: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                      {opp.employerName}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6B7280' }}>
                      📞 {opp.employerPhone}
                    </div>
                  </div>
                  <span
                    className="wd-badge"
                    style={{ background: badge.bg, color: badge.color, fontSize: '12px' }}
                  >
                    {badge.text}
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                    <strong>Job Details:</strong> {opp.jobDescription}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                    <strong>Salary:</strong> ₹{opp.salary}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                    <strong>Location:</strong> {opp.location}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                    <strong>Start Date:</strong> {formatDate(opp.startDate)}
                  </div>
                  {opp.notes && (
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      <strong>Notes:</strong> {opp.notes}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '16px' }}>
                  Requested on {formatDate(opp.createdAt)}
                </div>

                {opp.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => respondToRequest(opp._id, 'accepted')}
                      disabled={loading}
                      style={{
                        flex: 1,
                        height: '44px',
                        background: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#15803D'}
                      onMouseOut={e => e.currentTarget.style.background = '#16A34A'}
                    >
                      ✅ Accept
                    </button>
                    <button
                      onClick={() => respondToRequest(opp._id, 'declined')}
                      disabled={loading}
                      style={{
                        flex: 1,
                        height: '44px',
                        background: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#B91C1C'}
                      onMouseOut={e => e.currentTarget.style.background = '#DC2626'}
                    >
                      ❌ Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
};

export default WorkerOpportunities;