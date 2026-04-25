// components/WorkerProfile.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SharePoster from './SharePoster';
import { API_BASE, resolveMediaUrl } from '../api';

const WorkerProfile = ({ worker: initialWorker, onBack }) => {
  const navigate = useNavigate();
  const [worker, setWorker] = useState(initialWorker);
  const [uploadMsg, setUploadMsg] = useState('');

  if (!worker) return null;

  const createdDate = worker.createdAt
    ? new Date(worker.createdAt).toLocaleDateString()
    : 'Today';

  const lastUpdated =
    worker.reliabilitySignals?.lastUpdated &&
    new Date(worker.reliabilitySignals.lastUpdated).toLocaleDateString();
  const photoUrl = resolveMediaUrl(worker.photoUrl);

 const generatePdf = async () => {
  if (!worker?._id) {
    alert("Worker ID missing");
    return;
  }

  const res = await fetch(
    `${API_BASE}/api/workers/${worker._id}/generate-pdf`,
    { method: "POST" }
  );

  if (!res.ok) {
    alert("PDF generation failed");
    return;
  }

  const data = await res.json();
  const url = `${API_BASE}${data.pdfUrl}`;

  // ✅ THIS PART WAS MISSING
  const link = document.createElement("a");
  link.href = url;
  link.download = `worker_${worker._id}.pdf`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handlePDFUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file); // must match upload.single('file')

  try {
    const res = await fetch(
      `${API_BASE}/api/workers/${worker._id}/upload-pdf`,
      {
        method: 'POST',
        body: formData, // no Content-Type header
      }
    );
    const data = await res.json();
    if (data.pdfUrl) {
      setUploadMsg('PDF uploaded successfully.');
      console.log('Uploaded PDF URL:', data.pdfUrl);
    } else {
      setUploadMsg('Error: ' + (data.error || 'Something went wrong'));
    }
  } catch (err) {
    console.error(err);
    setUploadMsg('Upload failed');
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
          <button style={{background:'#e5e7eb', border:'none', fontSize:14, fontWeight:500, color:'#374151', cursor:'pointer', padding:'8px 14px', borderRadius:8, transition:'all 0.15s'}} onClick={() => {}} onMouseEnter={(e)=>e.target.style.background='#d1d5db'} onMouseLeave={(e)=>e.target.style.background='#e5e7eb'}>
            My Profile
          </button>
          <button style={{background:'none', border:'none', fontSize:14, fontWeight:500, color:'#374151', cursor:'pointer', padding:'8px 14px', borderRadius:8, transition:'all 0.15s'}} onClick={() => navigate('/worker-onboard')} onMouseEnter={(e)=>e.target.style.background='#f0fdf4'} onMouseLeave={(e)=>e.target.style.background='none'}>
            Work Opportunities
          </button>
        </nav>
      </div>
      <div className="grid-two">
      {/* LEFT: core profile */}
      <div className="card">
        <button className="link-small" onClick={onBack}>
          ← Record again
        </button>

        <div className="profile-header">
          {/* Profile photo / avatar */}
          <div className="profile-photo">
            {photoUrl ? (
              <img src={photoUrl} alt={worker.name} />
            ) : (
              <div className="profile-avatar-placeholder">
                {worker.name?.[0] || 'W'}
              </div>
            )}
          </div>

          <div>
            <h2 className="card-title">{worker.name}</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div>
                <p className="chip chip-trust">
                  Trust Score
                  <span className="chip-score">{worker.trustScore}</span>
                  <span className="chip-text">/ 100</span>
                </p>
              </div>
              {worker.verificationLevel === 'id' && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#ECFDF5',
                    color: '#166534',
                  }}
                >
                  ✅ ID Verified
                </span>
              )}
              {worker.verificationLevel === 'police' && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#FEE2E2',
                    color: '#B91C1C',
                  }}
                >
                  🔐 Police‑verified
                </span>
              )}
              {worker.safetyIncidents > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#FEE2E2',
                    color: '#B91C1C',
                  }}
                >
                  {worker.safetyIncidents} safety incident{worker.safetyIncidents === 1 ? '' : 's'}
                </span>
              )}
            </div>

            <p className="text-small">
              <span className="badge-verified">Verified voice profile</span> ·
              Joined: {createdDate}
            </p>
            <p className="text-small">
                    Location: {worker.cityArea || 'Not specified'}
            </p>     
            <p className="text-small">
              Experience: {worker.experienceYears} years
            </p>
          </div>
        </div>

        {/* PDF Upload */}
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Upload your profile PDF (optional)
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePDFUpload}
            style={{ display: 'block', marginTop: 6, fontSize: 12 }}
          />
          {uploadMsg && (
            <div style={{ marginTop: 4, fontSize: 12, color: '#6B7280' }}>{uploadMsg}</div>
          )}
        </div>

        {/* Voice introduction */}
        <div className="section">
          <p className="section-title">Voice Introduction</p>
          <p className="text-small">
            Language: Hindi · Tone: Polite · Duration: ~12 sec
          </p>
          {/* <p className="text-small">
            Employers can trust how she speaks, not just what is written.
          </p> */}
          {/* <button className="btn-small btn-outline" disabled>
            ▶ Play sample (demo)
          </button> */}
        </div>

        {/* AI Summary */}
        {/* <div className="section">
          <p className="section-title">AI Summary</p>
          <p className="bio-text">
            {worker.aiSummary ||
              'This worker has experience in daily household cleaning and basic cooking assistance, communicates politely, and is available for flexible work in her local area.'}
          </p>
        </div> */}

        {/* Experience proof */}
        <div className="section">
          <p className="section-title">Experience (Voice‑inferred)</p>
          <ul className="list">
            {(worker.experienceDetail || []).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
          <p className="text-small subtle">
            Experience inferred from voice interview responses.
          </p>
        </div>

        {/* Skill depth */}
        <div className="section">
          <p className="section-title">Skills & Depth</p>
          <p className="text-small">
            Skills: {worker.skills?.join(', ') || 'Not specified'}
          </p>
          {worker.skillDepth?.housekeeping && (
            <>
              <p className="text-small">Housekeeping includes:</p>
              <ul className="list">
                {worker.skillDepth.housekeeping.map((s, i) => (
                  <li key={i}>✔ {s}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Availability intelligence */}
        <div className="section">
          <p className="section-title">Availability</p>
          <p className="text-small">
            Morning:{' '}
            {worker.availabilityDetail?.morning ? '✔' : '❌'} · Afternoon:{' '}
            {worker.availabilityDetail?.afternoon ? '✔' : '❌'} · Evening:{' '}
            {worker.availabilityDetail?.evening ? '✔' : '❌'}
          </p>
          <p className="text-small">
            Days: {worker.availabilityDetail?.days || 'Flexible'} · Emergency
            work: {worker.availabilityDetail?.emergency ? 'Yes' : 'No'}
          </p>
        </div>

        {/* Language & communication */}
        <div className="section">
          <p className="section-title">Languages & Communication</p>
          <ul className="list">
            <li>
              Hindi –{' '}
              {worker.languageProfile?.hindi ||
                'Fluent (voice verified)'}
            </li>
            <li>
              English –{' '}
              {worker.languageProfile?.english ||
                'Basic (self-declared)'}
            </li>
          </ul>
          <ul className="list">
            <li>✔ Understands instructions clearly</li>
            <li>✔ Speaks politely</li>
          </ul>
        </div>

        {/* Personality & reliability */}
        <div className="section">
          <p className="section-title">Personality Indicators</p>
          <ul className="list">
            {(worker.personalityIndicators || []).map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ul>
          <p className="text-small subtle">
            Indicators inferred from voice tone and responses (not final
            judgments).
          </p>
        </div>

        {/* <div className="section">
          <p className="section-title">Reliability Signals</p>
          <ul className="list">
            <li>✔ Responds clearly</li>
            <li>✔ Completed voice onboarding</li>
            <li>
              Profile last updated:{' '}
              {lastUpdated || createdDate}
            </li>
          </ul>
        </div> */}

        {/* Trust Score guidance */}
        <div className="section">
          <p className="section-title">Improve Trust Score</p>
          <p className="text-small">
            Current: {worker.trustScore} / 100
          </p>
          {/* <ul className="list">
            <li>+10 – Add a clear profile photo</li>
            <li>+15 – Complete full voice interview</li>
            <li>+10 – Receive one positive review</li>
          </ul> */}
        </div>

        {/* Safety & emergency */}
        <div className="section">
          <p className="section-title">Safety & Preferences</p>
          <ul className="list">
            <li>
                 Emergency contact: {worker.emergencyContact ? 'Added' : 'Not added'}
            </li>
            <li>
              Comfortable working with families:{' '}
              {worker.safety?.worksWithFamilies ? 'Yes' : 'Yes'}
            </li>
            <li>
              Comfortable with pets:{' '}
              {worker.safety?.comfortableWithPets ? 'Yes' : 'No'}
            </li>
          </ul>
        </div>

        {/* Raw bio */}
        <div className="bio-box">
          <p className="bio-title">Full Voice Transcript</p>
          <p className="bio-text">{worker.bio}</p>
        </div>
      </div>
       {/* <button onClick={generatePdf}>
  Generate & Download PDF
</button> */}

      {/* RIGHT: Share block */}
      {worker && <SharePoster worker={worker} />}
    </div>
    </>
  );
};

export default WorkerProfile;
