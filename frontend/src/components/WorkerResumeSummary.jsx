import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SharePoster from './SharePoster';
import { API_BASE, resolveMediaUrl } from '../api';

const normalizeWorker = (worker) => {
  if (!worker) return null;
  const availability = worker.availabilityDetail || worker.availability || {};
  return {
    ...worker,
    availabilityDetail: {
      morning: availability.morning ?? false,
      afternoon: availability.afternoon ?? false,
      evening: availability.evening ?? false,
      days: availability.days || 'Flexible',
      emergency: availability.emergency ?? false,
    },
    personalityIndicators: worker.personalityIndicators || [
      'Speaks clearly and politely',
      'Completed full voice onboarding',
    ],
    experienceDetail: worker.experienceDetail || (
      worker.experienceYears
        ? [`${worker.experienceYears} years of domestic work experience`]
        : []
    ),
  };
};

const WorkerResumeSummary = ({ worker: workerProp, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [worker, setWorker] = useState(() => {
    const direct = normalizeWorker(workerProp || location.state?.worker);
    if (direct) return direct;
    try {
      const saved = sessionStorage.getItem('completedWorker');
      return saved ? normalizeWorker(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });
  const [uploadMsg, setUploadMsg] = useState('');

  if (!worker) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <p>No profile found. Please complete voice onboarding first.</p>
        <button type="button" onClick={() => navigate('/worker-onboard')}
          style={{ marginTop: 16, padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Start Voice Onboarding
        </button>
      </div>
    );
  }

  const createdDate = worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : 'Today';
  const handleBack = onBack || (() => navigate('/worker-onboard'));
  const photoUrl = resolveMediaUrl(worker.photoUrl);
  const initials = worker.name ? worker.name.charAt(0).toUpperCase() : 'W';

  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !worker._id) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/workers/${worker._id}/upload-pdf`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.pdfUrl) {
        setUploadMsg('PDF uploaded successfully.');
        setWorker(prev => ({ ...prev, uploadedPdfUrl: data.pdfUrl }));
      } else {
        setUploadMsg(`Error: ${data.error || 'Something went wrong'}`);
      }
    } catch (err) {
      setUploadMsg('Upload failed');
    }
  };

  const sectionTitle = {
    fontSize: 13, fontWeight: 700, color: '#374151',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    margin: '20px 0 8px', borderBottom: '1px solid #f3f4f6', paddingBottom: 6,
  };

  return (
    // Outer wrapper: full viewport width, no overflow clipping
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>

      {/* NAVBAR — full width, not constrained by any parent */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 64, background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        width: '100%', boxSizing: 'border-box',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        flexShrink: 0,
      }}>
        <div
          style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', cursor: 'pointer' }}
          onClick={() => navigate('/worker-dashboard')}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/worker-dashboard')}
        >
          KaamWali.<span style={{ color: '#16a34a' }}>AI</span>
        </div>
        <nav style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => navigate('/worker-dashboard')}
            style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: '#6b7280', cursor: 'pointer', padding: '8px 14px', borderRadius: 8 }}>
            Dashboard
          </button>
          <button type="button" onClick={() => navigate('/worker-resume')}
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 14, fontWeight: 600, color: '#16a34a', cursor: 'pointer', padding: '8px 14px', borderRadius: 8 }}>
            My Profile
          </button>
          <button type="button" onClick={() => navigate('/worker-onboard')}
            style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: '#6b7280', cursor: 'pointer', padding: '8px 14px', borderRadius: 8 }}>
            Work Opportunities
          </button>
        </nav>
      </div>

      {/* CONTENT — two columns, fills remaining height */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 24,
        width: '100%',
        boxSizing: 'border-box',
        padding: '24px 32px',
        flex: 1,
      }}>
        {/* LEFT — profile card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
          <button type="button" onClick={handleBack}
            style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 20 }}>
            ← Record again
          </button>

          {/* Profile header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0,
            }}>
              {photoUrl
                ? <img src={photoUrl} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 28, fontWeight: 700, color: '#6b7280' }}>{initials}</span>}
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>{worker.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 999, background: '#f0fdf4',
                  border: '1px solid #bbf7d0', fontSize: 13, fontWeight: 600, color: '#166534',
                }}>
                  Trust Score <strong>{worker.trustScore ?? 0}</strong> / 100
                </span>
                {worker.verificationLevel === 'id' && (
                  <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#ECFDF5', color: '#166534' }}>✅ ID Verified</span>
                )}
                {worker.verificationLevel === 'police' && (
                  <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#FEE2E2', color: '#B91C1C' }}>🔐 Police-verified</span>
                )}
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 0' }}>
                <span style={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 600, padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>Verified voice profile</span>
                {' · '}Joined: {createdDate}
              </p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '3px 0 0' }}>Location: {worker.cityArea || 'Not specified'}</p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '3px 0 0' }}>Experience: {worker.experienceYears ?? '—'} years</p>
            </div>
          </div>

          {/* PDF upload */}
          <div style={{ padding: '12px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px', color: '#374151' }}>Upload your profile PDF (optional)</p>
            <input type="file" accept="application/pdf" onChange={handlePDFUpload} style={{ fontSize: 12 }} />
            {uploadMsg && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{uploadMsg}</p>}
          </div>

          <div style={sectionTitle}>Voice Introduction</div>
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>Language: Hindi · Tone: Polite · Duration: ~12 sec</p>

          <div style={sectionTitle}>Experience (Voice-inferred)</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {worker.experienceDetail.map((item, idx) => (
              <li key={idx} style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>{item}</li>
            ))}
          </ul>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Experience inferred from voice interview responses.</p>

          <div style={sectionTitle}>Skills & Depth</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(worker.skills || []).length > 0
              ? worker.skills.map((s, i) => (
                  <span key={i} style={{ padding: '4px 12px', background: '#f3f4f6', borderRadius: 999, fontSize: 13, color: '#374151', fontWeight: 500 }}>{s}</span>
                ))
              : <span style={{ fontSize: 14, color: '#6b7280' }}>Not specified</span>}
          </div>

          <div style={sectionTitle}>Availability</div>
          <p style={{ fontSize: 14, color: '#374151', margin: '0 0 4px' }}>
            Morning: {worker.availabilityDetail.morning ? '✔' : '✘'} · Afternoon: {worker.availabilityDetail.afternoon ? '✔' : '✘'} · Evening: {worker.availabilityDetail.evening ? '✔' : '✘'}
          </p>
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>
            Days: {worker.availabilityDetail.days} · Emergency work: {worker.availabilityDetail.emergency ? 'Yes' : 'No'}
          </p>

          <div style={sectionTitle}>Languages & Communication</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {(worker.languages && worker.languages.length > 0)
              ? worker.languages.map((lang, i) => (
                  <li key={i} style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>{lang}</li>
                ))
              : (
                <>
                  <li style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>Hindi – {worker.languageProfile?.hindi || 'Fluent (voice verified)'}</li>
                  <li style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>English – {worker.languageProfile?.english || 'Basic (self-declared)'}</li>
                </>
              )
            }
            <li style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>✔ Understands instructions clearly</li>
            <li style={{ fontSize: 14, color: '#374151' }}>✔ Speaks politely</li>
          </ul>

          <div style={sectionTitle}>Personality Indicators</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {worker.personalityIndicators.map((p, idx) => (
              <li key={idx} style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>{p}</li>
            ))}
          </ul>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Indicators inferred from voice tone and responses (not final judgments).</p>

          <div style={sectionTitle}>Improve Trust Score</div>
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>Current: {worker.trustScore ?? 0} / 100</p>

          <div style={sectionTitle}>Safety & Preferences</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>Emergency contact: {worker.emergencyContact ? 'Added' : 'Not added'}</li>
            <li style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>Comfortable working with families: {worker.safety?.worksWithFamilies !== false ? 'Yes' : 'No'}</li>
            <li style={{ fontSize: 14, color: '#374151' }}>Comfortable with pets: {worker.safety?.comfortableWithPets ? 'Yes' : 'No'}</li>
          </ul>

          {worker.bio && (
            <>
              <div style={sectionTitle}>Full Voice Transcript</div>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, background: '#f9fafb', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}>{worker.bio}</p>
            </>
          )}
        </div>

        {/* RIGHT — share poster */}
        <div>
          <SharePoster worker={worker} />
        </div>
      </div>
    </div>
  );
};

export default WorkerResumeSummary;