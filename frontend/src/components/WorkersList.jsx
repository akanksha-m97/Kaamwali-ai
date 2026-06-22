// frontend/WorkersList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import { useLanguage } from '../contexts/LanguageContext';
import { getFilterOptions } from '../filterOptions';

export default function WorkersList() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const filterOptions = getFilterOptions(language);

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [flipped, setFlipped] = useState({});
  const [contactRequests, setContactRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [filters, setFilters] = useState({
    cityArea: 'kurnool',
    minExp: '',
    maxSalary: '',
    skill: '',
    verification: '', // ← NEW: verification filter
    sortByTrust: 'yes',
  });

  const handleHireClick = (worker) => {
    console.log("Hiring:", worker);
    // later open dialog here
  };

  const loadContactRequests = async () => {
    const userData = localStorage.getItem('userData');
    const employer = userData ? JSON.parse(userData) : null;
    if (!employer || !employer.phone) {
      setContactRequests([]);
      return;
    }

    setRequestsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/contact-requests/employer?phone=${encodeURIComponent(employer.phone)}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      if (res.ok) {
        setContactRequests(data.requests || []);
      } else {
        console.error('Failed to load contact requests:', data.error);
        setContactRequests([]);
      }
    } catch (err) {
      console.error('Error loading contact requests:', err);
      setContactRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRequestContact = async (worker) => {
    const userData = localStorage.getItem('userData');
    const employer = userData ? JSON.parse(userData) : null;
    if (!employer || !employer.phone || !employer.name) {
      alert('Employer data is missing. Please log in again.');
      return;
    }

    setRequestLoading(true);
    setRequestMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/contact-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker._id,
          employerName: employer.name,
          employerPhone: employer.phone,
          employerCity: employer.city || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send contact request');
      }
      setRequestMessage('✅ Contact request sent successfully. Await worker approval to see their contact info.');
    } catch (err) {
      console.error('Contact request failed', err);
      setRequestMessage('❌ Failed to send contact request. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const theme = {
    bg: '#f5f9f7',
    card: '#ffffff',
    primary: '#2E7D5E',
    primaryHover: '#235F48',
    text: '#162B22',
    secondary: '#6B7280',
    border: '#D1E7DD',
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.cityArea) {
        params.append('cityArea', filters.cityArea);
        params.append('q', filters.cityArea);
      }

      if (filters.minExp) params.append('minExp', filters.minExp);
      if (filters.maxSalary) params.append('maxSalary', filters.maxSalary);
      if (filters.skill) params.append('skill', filters.skill);
      
      // ← NEW: verification filter
      if (filters.verification) params.append('verification', filters.verification);

      if (filters.sortByTrust === 'yes') {
        params.append('sortBy', 'trust');
      }

      const url = `${API_BASE}/api/workers?${params.toString()}`;
      console.log('WorkersList fetch URL:', url);
      const res = await fetch(url);

      const data = await res.json();
      setWorkers(data.workers || []);
    } catch (err) {
      console.error('Error fetching workers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    loadContactRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWorkers();
  };

  const handleViewResume = async (worker) => {
    let pdfUrl;

    // if worker has uploaded PDF, use it
    if (worker.uploadedPdfUrl) {
      pdfUrl = worker.uploadedPdfUrl;
    } else {
      // fallback: generate PDF on the server
      try {
        const res = await fetch(
          `${API_BASE}/api/workers/${worker._id}/generate-pdf`,
          { method: 'POST' }
        );
        const data = await res.json();

        if (data.pdfUrl) {
          pdfUrl = data.pdfUrl;
        } else {
          alert('Resume generation failed');
          return;
        }
      } catch (err) {
        console.error('Resume error:', err);
        alert('Error generating resume');
        return;
      }
    }

    // Download the PDF
    const link = document.createElement('a');
    link.href = `${API_BASE}${pdfUrl}`;
    link.download = `worker_${worker.name || worker._id}_resume.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* ===== HEADER ===== */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #E5E7EB',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          maxWidth: 1140, margin: '0 auto', padding: '0 20px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div onClick={() => navigate('/employer-dashboard')} style={{
            fontSize: 20, fontWeight: 800, color: '#0F2F30', cursor: 'pointer', letterSpacing: '0.02em'
          }}>
            KaamWali<span style={{ color: '#2E7D5E' }}>.AI</span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate('/employer-dashboard')}
              style={{
                border: 'none', background: 'transparent', color: '#2E7D5E',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '8px 12px',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#1D5F47'}
              onMouseLeave={e => e.currentTarget.style.color = '#2E7D5E'}
            >
              For Employers
            </button>

            <button
              type="button"
              onClick={() => navigate('/feedback')}
              style={{
                background: '#2E7D5E', color: '#fff', border: 'none',
                borderRadius: 10, padding: '10px 20px', fontWeight: 700,
                fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 18px rgba(46,125,94,0.32)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#235F48'}
              onMouseLeave={e => e.currentTarget.style.background = '#2E7D5E'}
            >
              Feedback
            </button>
          </nav>
        </div>
      </header>

      {/* ===== PAGE CONTENT ===== */}
      <div style={{ background: theme.bg, minHeight: '100vh', paddingBottom: 40 }}>
        <style>{`
          @keyframes flipCard {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(180deg); }
          }
          @keyframes flipCardBack {
            0% { transform: rotateY(180deg); }
            100% { transform: rotateY(0deg); }
          }
          .flip-container {
            perspective: 1000px;
            width: 100%;
            height: 220px;
            cursor: pointer;
          }
          .flip-inner {
            position: relative;
            width: 100%;
            height: 100%;
            transition: transform 0.6s ease;
            transform-style: preserve-3d;
          }
          .flip-inner.flipped {
            transform: rotateY(180deg);
          }
          .flip-front, .flip-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }
          .flip-back {
            transform: rotateY(180deg);
            overflow-y: auto;
          }
        `}</style>

        <div style={{ maxWidth: 1020, margin: '32px auto 0', padding: '0 16px' }}>
          <div style={{
            background: theme.card, border: `1px solid ${theme.border}`,
            borderRadius: 18, boxShadow: '0 12px 30px rgba(10, 40, 25, 0.08)',
            padding: 24, marginBottom: 24,
          }}>
            <h1 style={{
              margin: 0, color: theme.text, fontSize: 24, fontWeight: 800,
              marginBottom: 12,
            }}>
              KaamWali Profiles (For Employers)
            </h1>
            <p style={{ margin: 0, color: theme.secondary, fontSize: 14 }}>
              Filter qualified workers and find the right match quickly. Hover to flip and see more details.
            </p>

            <form
              onSubmit={handleSearch}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', // ← Changed to 3 columns
                gap: 14,
                marginTop: 20,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: theme.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {filterOptions.fieldLabels.city}
                </label>
                <select
                  name="cityArea"
                  value={filters.cityArea}
                  onChange={handleChange}
                  style={{
                    height: 44, borderRadius: 12, border: `1px solid ${theme.border}`,
                    padding: '0 12px', fontSize: 14, color: theme.text,
                    outline: 'none', background: '#fff', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                >
                  {filterOptions.cities.map((item) => (
                    <option key={item.value || 'all-cities'} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: theme.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {filterOptions.fieldLabels.skill}
                </label>
                <select
                  name="skill"
                  value={filters.skill}
                  onChange={handleChange}
                  style={{
                    height: 44, borderRadius: 12, border: `1px solid ${theme.border}`,
                    padding: '0 12px', fontSize: 14, color: theme.text,
                    outline: 'none', background: '#fff', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                >
                  {filterOptions.skills.map((item) => (
                    <option key={item.value || 'all-skills'} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ← NEW: Verification Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: theme.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {filterOptions.fieldLabels.verification}
                </label>
                <select
                  name="verification"
                  value={filters.verification || ''}
                  onChange={handleChange}
                  style={{
                    height: 44, borderRadius: 12, border: `1px solid ${theme.border}`,
                    padding: '0 12px', fontSize: 14, color: theme.text,
                    outline: 'none', background: '#fff', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                >
                  {filterOptions.verification.map((item) => (
                    <option key={item.value || 'any-verification'} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: theme.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Min Experience (years)
                </label>
                <select
                  name="minExp"
                  value={filters.minExp}
                  onChange={handleChange}
                  style={{
                    height: 44, borderRadius: 12, border: `1px solid ${theme.border}`,
                    padding: '0 12px', fontSize: 14, color: theme.text,
                    outline: 'none', background: '#fff', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                >
                  {filterOptions.experience.map((item) => (
                    <option key={item.value || 'any-experience'} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: theme.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {filterOptions.fieldLabels.salary}
                </label>
                <select
                  name="maxSalary"
                  value={filters.maxSalary}
                  onChange={handleChange}
                  style={{
                    height: 44, borderRadius: 12, border: `1px solid ${theme.border}`,
                    padding: '0 12px', fontSize: 14, color: theme.text,
                    outline: 'none', background: '#fff', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                >
                  {filterOptions.salary.map((item) => (
                    <option key={item.value || 'any-salary'} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort by Trust */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: theme.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Sort by Trust
                </label>
                <select
                  name="sortByTrust"
                  value={filters.sortByTrust}
                  onChange={handleChange}
                  style={{
                    height: 44,
                    borderRadius: 12,
                    border: `1px solid ${theme.border}`,
                    padding: '0 12px',
                    fontSize: 14,
                    color: theme.text,
                    outline: 'none',
                    background: '#fff',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = theme.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
                >
                  {filterOptions.sortByTrust.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                style={{
                  gridColumn: '1 / -1', width: '100%', height: 48,
                  marginTop: 3, borderRadius: 12, border: 'none', background: theme.primary,
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 8px 18px rgba(46,125,94,0.25)', transition: 'transform 0.2s ease, background 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = theme.primaryHover; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = theme.primary; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {filterOptions.fieldLabels.search}
              </button>
            </form>
          </div>

          {loading && <p style={{ color: theme.secondary }}>Loading workers...</p>}

          {requestMessage && (
            <div style={{ margin: '16px 0', padding: '14px 18px', borderRadius: 14, background: requestMessage.startsWith('✅') ? '#ECFDF5' : '#FEF3F2', color: requestMessage.startsWith('✅') ? '#166534' : '#B91C1C' }}>
              {requestMessage}
            </div>
          )}

          {/* ===== CONTACT REQUESTS SECTION ===== */}
          {contactRequests.length > 0 && (
            <div style={{
              background: theme.card, border: `1px solid ${theme.border}`,
              borderRadius: 18, boxShadow: '0 12px 30px rgba(10, 40, 25, 0.08)',
              padding: 24, marginBottom: 24,
            }}>
              <h2 style={{
                margin: '0 0 16px 0', color: theme.text, fontSize: 18, fontWeight: 800,
              }}>
                📋 Your Contact Requests ({contactRequests.length})
              </h2>
              <p style={{ margin: '0 0 16px 0', color: theme.secondary, fontSize: 13 }}>
                Track the status of contact requests you've sent to workers.
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {contactRequests.map((req) => {
                  const statusColors = {
                    pending: { bg: '#FEF3C7', color: '#B45309', label: '⏳ Pending' },
                    approved: { bg: '#DCFCE7', color: '#166534', label: '✅ Approved' },
                    rejected: { bg: '#FEE2E2', color: '#B91C1C', label: '❌ Rejected' },
                  };
                  const s = statusColors[req.status] || statusColors.pending;

                  return (
                    <div
                      key={req._id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: 16,
                        alignItems: 'center',
                        padding: 14,
                        borderRadius: 12,
                        border: `1px solid ${theme.border}`,
                        background: '#f9fafb',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: theme.text, marginBottom: 4 }}>
                          {req.workerName || 'Worker'}{req.workerContact && req.status === 'approved' ? ` · ${req.workerContact}` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: theme.secondary }}>
                          Requested on {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{
                        padding: '6px 12px',
                        borderRadius: 99,
                        background: s.bg,
                        color: s.color,
                        fontWeight: 700,
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}>
                        {s.label}
                      </div>

                      {req.status === 'approved' && req.workerContact && (
                        <div style={{
                          padding: '8px 14px',
                          background: '#DCFCE7',
                          color: '#166534',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          textAlign: 'center',
                        }}>
                          Call: {req.workerContact}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

            <p style={{ color: theme.secondary }}>No workers found yet. Ask a worker to create a profile first.</p>
          

          <div style={{ display: 'grid', gap: 14 }}>
            {workers.map((w) => {
              const hasReviews = w.trustMeta && (w.trustMeta.reviewsCount || 0) > 0;
              const displayTrust =
                hasReviews && w.trustScore != null ? Math.round(w.trustScore) : null;

              return (
                <div
                  key={w._id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    border: `1px solid ${theme.border}`,
                    boxShadow: '0 8px 18px rgba(17, 33, 20, 0.08)',
                    height: 220,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="flip-container"
                    onMouseEnter={() => setFlipped({ ...flipped, [w._id]: true })}
                    onMouseLeave={() => setFlipped({ ...flipped, [w._id]: false })}
                    onClick={() => setFlipped({ ...flipped, [w._id]: !flipped[w._id] })}
                    style={{ height: 220 }}
                  >
                    <div className={`flip-inner ${flipped[w._id] ? 'flipped' : ''}`}>
                      {/* ===== FRONT SIDE ===== */}
                      <div
                        className="flip-front"
                        style={{
                          padding: 14,
                          background: '#fff',
                          borderRadius: 16,
                          height: 220,
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          {/* ← UPDATED: Added verification badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <h2
                              style={{
                                margin: 0,
                                color: theme.text,
                                fontSize: 20,
                                fontWeight: 800,
                              }}
                            >
                              {w.name || 'Worker'}
                            </h2>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: w.isHired ? '#FEE2E2' : '#DCFCE7',
                                color: w.isHired ? '#B91C1C' : '#166534',
                              }}
                            >
                              {w.isHired ? 'Hired' : 'Available'}
                            </span>

                            {/* ← NEW: RECOMMENDATION BADGE */}
                            {w.candidateScore && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: w.candidateScore >= 80 ? '#DCFCE7' : w.candidateScore >= 60 ? '#FEF08A' : '#FECACA',
                                  color: w.candidateScore >= 80 ? '#166534' : w.candidateScore >= 60 ? '#B45309' : '#DC2626',
                                }}
                                title={`Recommendation Score: ${Math.round(w.candidateScore)}`}
                              >
                                {w.candidateScore >= 80 ? '🌟 Top Match' : w.candidateScore >= 60 ? '⭐ Recommended' : '✓ Consider'}
                              </span>
                            )}

                            {/* ← VERIFICATION BADGES */}
                            {w.verificationLevel === 'police' && (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: '#DCFCE7',
                                  color: '#166534',
                                  fontWeight: 700,
                                }}
                              >
                                Police Verified
                              </span>
                            )}
                            {w.verificationLevel === 'id' && (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: '#DBEAFE',
                                  color: '#1E40AF',
                                  fontWeight: 700,
                                }}
                              >
                                ID Verified
                              </span>
                            )}
                            {w.employerRiskLevel === 'HIGH' && (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: '#FEE2E2',
                                  color: '#B91C1C',
                                  fontWeight: 700,
                                }}
                              >
                                🚨 Risky Employer
                              </span>
                            )}
                            {w.employerRiskLevel === 'MEDIUM' && (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: '#FEF3C7',
                                  color: '#B45309',
                                  fontWeight: 700,
                                }}
                              >
                                ⚠️ Caution
                              </span>
                            )}
                          </div>

                          <p
                            style={{
                              margin: '3px 0',
                              color: theme.secondary,
                              fontSize: 14,
                              fontWeight: 500,
                            }}
                          >
                            📍 Location: {w.cityArea || 'Location not set'}
                          </p>

                          <p style={{ margin: '3px 0 0', color: theme.secondary, fontSize: 14, fontWeight: 500 }}>
                            ⏱️ Experience: {w.experienceYears != null ? `${w.experienceYears} yrs` : 'NA'}
                          </p>
                        </div>

                        <div style={{
                          marginTop: 8,
                          padding: '6px 10px',
                          background: '#F0F9F6',
                          borderRadius: 8,
                          fontSize: 11,
                          color: theme.primary,
                          fontWeight: 600,
                          textAlign: 'center',
                          letterSpacing: '0.05em',
                        }}>
                          Hover to flip →
                        </div>
                      </div>

                      {/* ===== BACK SIDE ===== */}
                      <div
                        className="flip-back"
                        style={{
                          padding: 14,
                          background: `linear-gradient(135deg, #f5f9f7 0%, #fff 100%)`,
                          borderRadius: 16,
                          height: 220,
                          display: 'flex',
                          flexDirection: 'column',
                          overflowY: 'auto',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 6px 0', color: theme.secondary, fontSize: 13, fontWeight: 500 }}>
                            <strong>Skills:</strong> {w.skills && w.skills.length ? w.skills.slice(0, 2).join(', ') : 'NA'}
                          </p>

                          <p style={{ margin: '0 0 8px 0', color: theme.secondary, fontSize: 13, fontWeight: 500 }}>
                            <strong>Expected Salary:</strong> ₹{w.expectedSalary ? w.expectedSalary : 'NA'}
                          </p>

                          {/* Trust, cluster, rehire, reviews */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px 10px',
                                borderRadius: 999,
                                background: '#E6F4EE',
                                color: theme.primary,
                                fontSize: 12,
                                fontWeight: 700,
                                width: 'fit-content',
                              }}
                              title={
                                w.trustMeta
                                  ? `Rating: ${w.trustMeta.avgRating?.toFixed?.(1) || '--'} ★ · ` +
                                    `Sentiment: ${(w.trustMeta.sentimentScore01 * 100).toFixed(0)}% · ` +
                                    `Consistency: ${(w.trustMeta.consistency * 100).toFixed(0)}% · ` +
                                    `Activity: ${(w.trustMeta.activity * 100).toFixed(0)}%`
                                  : 'Trust Score based on ratings, sentiment, consistency and recent activity'
                              }
                            >
                              ⭐ Trust{' '}
                              {displayTrust !== null ? `${displayTrust}/100` : 'No reviews yet'}
                            </div>

                            {w.trustMeta && (
                              <div style={{ fontSize: 11, color: theme.secondary }}>
                                Segment{' '}
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color:
                                      w.trustMeta.cluster === 'high'
                                        ? '#15803D'
                                        : w.trustMeta.cluster === 'risky'
                                        ? '#B91C1C'
                                        : theme.secondary,
                                  }}
                                >
                                  {w.trustMeta.cluster === 'high'
                                    ? 'Highly trusted'
                                    : w.trustMeta.cluster === 'risky'
                                    ? 'Risky'
                                    : 'Average'}
                                </span>
                                {typeof w.trustMeta.rehireProbability === 'number' && (
                                  <> · Rehire {(w.trustMeta.rehireProbability * 100).toFixed(0)}%</>
                                )}
                              </div>
                            )}

                            {w.trustMeta && (
                              <div style={{ fontSize: 11, color: theme.secondary }}>
                                {w.trustMeta.reviewsCount || 0} review
                                {(w.trustMeta.reviewsCount || 0) === 1 ? '' : 's'}
                              </div>
                            )}

                            {/* Hire history summary */}
                            {Array.isArray(w.hireHistory) && w.hireHistory.length > 0 && (
                              <div style={{ marginTop: 6, fontSize: 11, color: theme.secondary }}>
                                <div>
                                  Past households: {w.hireHistory.length}
                                </div>
                                {(() => {
                                  const last = w.hireHistory[w.hireHistory.length - 1];
                                  const fromStr = last.fromDate
                                    ? new Date(last.fromDate).toLocaleDateString()
                                    : '';
                                  const toStr = last.toDate
                                    ? new Date(last.toDate).toLocaleDateString()
                                    : 'Present';
                                  return (
                                    <div>
                                      Last job: {last.householdName || last.employerName || 'Household'} (
                                      {fromStr} – {toStr})
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* ← NEW: Recommendation Score */}
                            {w.candidateScore && w.cumulativeSafetyScore !== undefined && (
                              <div style={{ 
                                marginTop: 8,
                                padding: '6px 8px',
                                background: '#F0F9F6',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                color: theme.primary,
                                textAlign: 'center',
                              }}>
                                <div>Match Score: {Math.round(w.candidateScore)}/100</div>
                                <div>Safety: {Math.round(w.cumulativeSafetyScore)}/100</div>
                                {typeof w.safetyScore === 'number' && (
                                  <div>Worker Safety Score: {Math.round(w.safetyScore)}/100</div>
                                )}
                                {w.currentEmployerPhone && (
                                  <div>Employer Risk: {w.employerRiskLevel || 'LOW'}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewResume(w)}
                          style={{
                            width: 'auto', marginTop: 2, marginLeft: 'auto',
                            border: 'none', background: theme.primary, color: '#fff',
                            borderRadius: 8, padding: '8px 16px', fontWeight: 700,
                            fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 10px rgba(46,125,94,0.18)',
                            transition: 'background 0.2s ease, transform 0.2s ease',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#235F48';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = theme.primary;
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          View Resume
                        </button>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                          <button
                            style={{
                              padding: '10px 18px',
                              background: '#1f2937',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleHireClick(w)}
                          >
                            Hire this employee
                          </button>
                          <button
                            style={{
                              padding: '10px 18px',
                              background: requestLoading ? '#94a3b8' : '#2563eb',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 600,
                              cursor: requestLoading ? 'not-allowed' : 'pointer',
                            }}
                            onClick={() => handleRequestContact(w)}
                            disabled={requestLoading}
                          >
                            {requestLoading ? 'Sending...' : 'Request contact'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
