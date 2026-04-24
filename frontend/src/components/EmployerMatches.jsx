// components/EmployerMatches.jsx
import React, { useState, useEffect } from 'react';
import HireEmployeeDialog from './HireEmployeeDialog';

const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:4000'
    : 'https://kaamwali-ai-backend.onrender.com';

const EmployerMatches = ({ workers: propWorkers, city: propCity }) => {
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [hireLoading, setHireLoading] = useState(false);
  const [workers, setWorkers] = useState(propWorkers || []);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState(propCity || 'kurnool');
  const [filters, setFilters] = useState({
    cityArea: 'kurnool',
    minExp: '',
    maxSalary: '',
    skill: '',
    verification: '',
    sortByTrust: 'yes',
  });

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
      if (filters.verification) params.append('verification', filters.verification);

      if (filters.sortByTrust === 'yes') {
        params.append('sortBy', 'trust');
      }

      const url = `${API_BASE}/api/workers?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setWorkers(data.workers || []);
      setCity(filters.cityArea);
    } catch (err) {
      console.error('Error fetching workers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propWorkers) {
      fetchWorkers();
    }
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

  const handleHireClick = (worker) => {
    setSelectedWorker(worker);
    setHireDialogOpen(true);
  };

  const handleHireSubmit = async (hireData) => {
    if (!selectedWorker) return;
    setHireLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/hire-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerPhone: selectedWorker.emergencyContact,        // IMPORTANT: worker identifier
          employerName: hireData.employerName,
          employerPhone: hireData.employerPhone,
          jobDescription: hireData.jobDescription,
          salary: hireData.salary,
          location: hireData.location || city,
          startDate: hireData.startDate,
          notes: hireData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send hire request');
      }

      alert(
        'Hire request sent successfully! The worker will see your details under their Opportunities.'
      );
      setHireDialogOpen(false);
      setSelectedWorker(null);
    } catch (error) {
      console.error('Error sending hire request:', error);
      alert('Failed to send hire request. Please try again.');
    } finally {
      setHireLoading(false);
    }
  };
  const styles = {
    wrapper: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '0 16px 32px',
      marginTop: '20px',
    },
    card: {
      background: '#ffffff',
      borderRadius: '18px',
      padding: '28px',
      boxShadow: '0 12px 28px rgba(14, 34, 21, 0.12)',
      border: '1px solid rgba(46, 125, 94, 0.15)',
    },
    title: {
      fontSize: '24px',
      fontWeight: 800,
      margin: '0 0 20px',
      color: '#162B22',
    },
    emptyState: {
      textAlign: 'center',
      padding: '32px 24px',
      color: '#6b7280',
      fontSize: '15px',
    },
    workerRow: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '20px',
      padding: '20px',
      borderBottom: '1px solid #e5e7eb',
      alignItems: 'center',
      borderRadius: '12px',
    },
    workerInfo: {},
    workerName: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#162B22',
      margin: '0 0 6px',
    },
    workerDetail: {
      fontSize: '13px',
      color: '#4a6356',
      margin: '4px 0',
      lineHeight: 1.5,
    },
    workerPhone: {
      fontSize: '12px',
      color: '#9ca3af',
      fontStyle: 'italic',
      marginTop: '8px',
    },
    contactBtn: {
      padding: '10px 18px',
      background: '#2E7D5E',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 600,
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'box-shadow 0.2s',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 10px rgba(46, 125, 94, 0.2)',
      position: 'relative',
      zIndex: 10,
    },
    badge: {
      display: 'inline-block',
      background: '#e6f4ee',
      color: '#2E7D5E',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      marginRight: '6px',
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={{
          margin: 0,
          color: '#162B22',
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 12,
        }}>
          KaamWali Profiles (For Employers)
        </h1>
        <p style={{
          margin: 0,
          color: '#6B7280',
          fontSize: 14,
        }}>
          Filter qualified workers and find the right match quickly. Click "Hire this employee" to send a job request.
        </p>

        <form onSubmit={handleSearch} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 14,
          marginTop: 20,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#162B22',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              City / Area
            </label>
            <input
              name="cityArea"
              value={filters.cityArea}
              onChange={handleChange}
              placeholder="Bhiwani"
              style={{
                height: 44,
                borderRadius: 12,
                border: `1px solid #D1E7DD`,
                padding: '0 12px',
                fontSize: 14,
                color: '#162B22',
                outline: 'none',
                background: '#fff',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#162B22',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Skill
            </label>
            <input
              name="skill"
              value={filters.skill}
              onChange={handleChange}
              placeholder="Cooking"
              style={{
                height: 44,
                borderRadius: 12,
                border: `1px solid #D1E7DD`,
                padding: '0 12px',
                fontSize: 14,
                color: '#162B22',
                outline: 'none',
                background: '#fff',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#162B22',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Verification Level
            </label>
            <select
              name="verification"
              value={filters.verification || ''}
              onChange={handleChange}
              style={{
                height: 44,
                borderRadius: 12,
                border: `1px solid #D1E7DD`,
                padding: '0 12px',
                fontSize: 14,
                color: '#162B22',
                outline: 'none',
                background: '#fff',
                transition: 'border-color 0.2s',
              }}
            >
              <option value="">Any</option>
              <option value="id">ID Verified</option>
              <option value="police">Police Verified</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#162B22',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Min Experience (years)
            </label>
            <input
              name="minExp"
              value={filters.minExp}
              onChange={handleChange}
              type="number"
              placeholder="0"
              style={{
                height: 44,
                borderRadius: 12,
                border: `1px solid #D1E7DD`,
                padding: '0 12px',
                fontSize: 14,
                color: '#162B22',
                outline: 'none',
                background: '#fff',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#162B22',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Max Salary
            </label>
            <input
              name="maxSalary"
              value={filters.maxSalary}
              onChange={handleChange}
              type="number"
              placeholder="5000"
              style={{
                height: 44,
                borderRadius: 12,
                border: `1px solid #D1E7DD`,
                padding: '0 12px',
                fontSize: 14,
                color: '#162B22',
                outline: 'none',
                background: '#fff',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#162B22',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Sort by Trust
            </label>
            <select
              name="sortByTrust"
              value={filters.sortByTrust}
              onChange={handleChange}
              style={{
                height: 44,
                borderRadius: 12,
                border: `1px solid #D1E7DD`,
                padding: '0 12px',
                fontSize: 14,
                color: '#162B22',
                outline: 'none',
                background: '#fff',
                transition: 'border-color 0.2s',
              }}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </form>

        <button
          type="submit"
          onClick={handleSearch}
          style={{
            marginTop: 20,
            padding: '12px 24px',
            background: '#2E7D5E',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Search workers
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading workers...</div>
      ) : (
        <div>
          {workers.length === 0 ? (
            <div style={styles.card}>
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                No workers found - try different filters.
              </div>
            </div>
          ) : (
            workers.map((w) => (
              <div
                key={w.id || w._id}
                style={styles.workerRow}
              >
                <div style={styles.workerInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{ ...styles.workerName, margin: 0 }}>{w.name}</p>
                    {w.candidateScore && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background:
                            w.candidateScore >= 80 ? '#DCFCE7' : w.candidateScore >= 60 ? '#FEF08A' : '#FECACA',
                          color:
                            w.candidateScore >= 80 ? '#166534' : w.candidateScore >= 60 ? '#B45309' : '#DC2626',
                        }}
                      >
                        {w.candidateScore >= 80 ? 'Top Match' : w.candidateScore >= 60 ? 'Recommended' : 'Consider'}
                      </span>
                    )}
                    {w.verificationLevel === 'police' && (
                      <span
                        style={{
                          ...styles.badge,
                          background: '#DCFCE7',
                          color: '#166534'
                        }}
                      >
                        Police Verified
                      </span>
                    )}
                    {w.verificationLevel === 'id' && (
                      <span
                        style={{
                          ...styles.badge,
                          background: '#DBEAFE',
                          color: '#1E40AF'
                        }}
                      >
                        ID Verified
                      </span>
                    )}
                    {w.employerRiskLevel === 'HIGH' && (
                      <span
                        style={{
                          ...styles.badge,
                          background: '#FEE2E2',
                          color: '#B91C1C'
                        }}
                      >
                        🚨 Risky Employer
                      </span>
                    )}
                    {w.employerRiskLevel === 'MEDIUM' && (
                      <span
                        style={{
                          ...styles.badge,
                          background: '#FEF3C7',
                          color: '#B45309'
                        }}
                      >
                        ⚠️ Caution
                      </span>
                    )}
                  </div>

                  <p style={styles.workerDetail}>
                    📍 Location: {w.cityArea || 'Location not set'}
                  </p>
                  <p style={styles.workerDetail}>
                    ⏱️ Experience: {w.experienceYears != null ? `${w.experienceYears} yrs` : 'NA'}
                  </p>
                  <p style={styles.workerDetail}>
                    💰 Expected Salary: ₹{w.expectedSalary ? w.expectedSalary : 'NA'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleHireClick(w)}
                    style={styles.contactBtn}
                    className="hire-btn"
                  >
                    Hire this employee
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {hireDialogOpen && (
        <HireEmployeeDialog
          open={hireDialogOpen}
          onClose={() => {
            setHireDialogOpen(false);
            setSelectedWorker(null);
          }}
          worker={selectedWorker}
          onSubmit={handleHireSubmit}
          loading={hireLoading}
        />
      )}
    </div>
  );
};

export default EmployerMatches;
