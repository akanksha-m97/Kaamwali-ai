import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, resolveMediaUrl } from '../api';
import WorkerHeader from './WorkerHeader';
import { useLanguage } from '../contexts/LanguageContext';

const LANGUAGE_OPTIONS = [
  'Hindi','English','Marathi','Gujarati','Punjabi',
  'Bengali','Tamil','Telugu','Kannada','Malayalam',
  'Odia','Assamese','Urdu','Konkani',
];

const WorkerProfile = ({ onBack }) => {
  const navigate = useNavigate();
  const { language, setLanguage, messages } = useLanguage();
  const t = (messages && messages.profile) || {};

  const [workForm, setWorkForm] = useState({
    experienceYears: '', expectedSalary: '', workType: '',
    daysOff: '', medicalConditions: '', availability: '',
    skills: [], languages: [], otherLanguage: '',
  });

  const [accountData, setAccountData]   = useState(null);
  const [mergedData, setMergedData]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saveStatus, setSaveStatus]     = useState('');
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [resumeStatus, setResumeStatus] = useState(null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue]     = useState('');
  const [uploadMsg, setUploadMsg]       = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showPopup, setShowPopup]           = useState(false);
  const [popupMessage, setPopupMessage]     = useState('');
  const [showPhotoLightbox, setShowPhotoLightbox] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Emergency contact state
  const [emergencyContact, setEmergencyContact] = useState('');
  const [savingEmergency, setSavingEmergency]   = useState(false);

  const photoInputRef = useRef(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userDataStr = localStorage.getItem('userData');
      let account = null;
      if (userDataStr) {
        try { account = JSON.parse(userDataStr); } catch (e) {}
      }

      let worker = null;
      if (account?.phone) {
        try {
          const res = await fetch(`${API_BASE}/api/workers/by-phone/${account.phone}`);
          if (res.ok) { worker = await res.json(); }
        } catch (e) { console.error('Failed to fetch worker data:', e); }
      }

      setAccountData(account);

      const merged = {
        name:     account?.name     || worker?.name     || '',
        phone:    account?.phone    || '',
        email:    account?.email    || worker?.email    || '',
        photoUrl: account?.photoUrl || worker?.photoUrl || '',
        city:     account?.city     || worker?.city     || '',
        _id:               worker?._id,
        trustScore:        worker?.trustScore        || 0,
        verificationLevel: worker?.verificationLevel,
        cityArea:          worker?.cityArea,
        experienceYears:   worker?.experienceYears,
        expectedSalary:    worker?.expectedSalary,
        workType:          worker?.workType,
        daysOff:           worker?.daysOff,
        skills:            worker?.skills            || [],
        languages:         worker?.languages         || [],
        bio:               worker?.bio,
        createdAt:         worker?.createdAt,
        pdfUrl:            worker?.uploadedPdfUrl    || worker?.generatedPdfUrl,
        emergencyContact:  worker?.emergencyContact  || '',
      };

      setMergedData(merged);
      setWorkForm({
        experienceYears:   worker?.experienceYears   || '',
        expectedSalary:    worker?.expectedSalary    || '',
        workType:          worker?.workType          || '',
        daysOff:           worker?.daysOff           || '',
        medicalConditions: worker?.medicalConditions || '',
        availability:      worker?.availability      || '',
        skills:            worker?.skills            || [],
        languages:         worker?.languages         || [],
        otherLanguage:     '',
      });
      setEmailValue(merged.email || '');
      setEmergencyContact(worker?.emergencyContact || '');
      setResumeStatus(worker?._id ? 'found' : 'not_found');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showStatsPopup = (msg = 'Profile updated!') => {
    setPopupMessage(msg); setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleWorkSave = async () => {
    if (!mergedData?._id) { setSaveStatus('error'); setUploadMsg('Worker ID missing — please reload.'); return; }
    try {
      const payload = {
        ...workForm,
        languages: workForm.languages.includes('Other')
          ? [...workForm.languages.filter(l => l !== 'Other'), workForm.otherLanguage].filter(Boolean)
          : workForm.languages,
      };
      delete payload.otherLanguage;
      const res = await fetch(`${API_BASE}/api/workers/${mergedData._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveStatus('success'); setUploadMsg('Work details saved!');
        showStatsPopup('Work details saved!');
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveStatus('error'); setUploadMsg('Save failed: ' + (err.error || res.statusText));
      }
    } catch (err) { setSaveStatus('error'); setUploadMsg('Save failed — server unreachable.'); }
  };

  const handleEmergencyContactSave = async () => {
    if (!mergedData?._id) { showStatsPopup('Worker ID missing'); return; }
    setSavingEmergency(true);
    try {
      const res = await fetch(`${API_BASE}/api/workers/${mergedData._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyContact }),
      });
      if (res.ok) {
        setMergedData(prev => ({ ...prev, emergencyContact }));
        showStatsPopup('Emergency contact saved!');
      } else {
        showStatsPopup('Failed to save emergency contact');
      }
    } catch { showStatsPopup('Save failed — server unreachable.'); }
    finally { setSavingEmergency(false); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true); setUploadMsg('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/workers/${mergedData._id}/upload-photo`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.photoUrl) {
        setMergedData(prev => ({ ...prev, photoUrl: data.photoUrl }));
        setSaveStatus('success'); setUploadMsg('Photo updated!');
        if (accountData?.phone) {
          const updated = { ...accountData, photoUrl: data.photoUrl };
          localStorage.setItem('userData', JSON.stringify(updated));
          setAccountData(updated);
          await fetch(`${API_BASE}/api/users/${accountData.phone}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoUrl: data.photoUrl }),
          }).catch(console.error);
          showStatsPopup('Photo updated!');
        }
      } else { setSaveStatus('error'); setUploadMsg('Error: ' + (data.error || 'Upload failed')); }
    } catch (err) { setSaveStatus('error'); setUploadMsg('Upload failed'); }
    finally { setPhotoUploading(false); }
  };

  const handleEmailSave = async () => {
    if (!accountData?.phone) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${accountData.phone}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue }),
      });
      if (res.ok) {
        setMergedData(prev => ({ ...prev, email: emailValue }));
        const updated = { ...accountData, email: emailValue };
        localStorage.setItem('userData', JSON.stringify(updated));
        setAccountData(updated);
        setEditingEmail(false); setSaveStatus('success'); setUploadMsg('Email updated!');
        showStatsPopup('Email updated!');
      } else { setSaveStatus('error'); setUploadMsg('Failed to update email'); }
    } catch (err) { setSaveStatus('error'); setUploadMsg('Failed to update email'); }
  };

  const generatePdf = async () => {
    if (!mergedData?._id) { alert('Worker ID missing'); return; }
    setPdfLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/workers/${mergedData._id}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      if (!res.ok) { alert('PDF generation failed'); return; }
      const data = await res.json();
      const link = document.createElement('a');
      link.href = `${API_BASE}${data.pdfUrl}`;
      link.download = `worker_${mergedData._id}.pdf`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF generation failed — server unreachable.');
    } finally { setPdfLoading(false); }
  };

  const toggleLanguage = (lang) => {
    setWorkForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  if (loading) return <div style={{ paddingTop: 100, textAlign: 'center' }}><p>Loading profile…</p></div>;
  if (!mergedData) return (
    <div style={{ paddingTop: 100, textAlign: 'center' }}>
      <p>No profile found. Please complete onboarding first.</p>
      <button onClick={() => navigate('/worker-onboard')}
        style={{ marginTop: 16, padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
        Start Onboarding
      </button>
    </div>
  );

  const photoUrl     = resolveMediaUrl(mergedData.photoUrl);
  const initials     = mergedData.name ? mergedData.name.charAt(0).toUpperCase() : 'W';
  const primarySkill = mergedData.skills?.[0] || mergedData.workType || 'Domestic Worker';

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box', marginTop: 4,
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 2 };
  const cardStyle = {
    background: '#fff', borderRadius: 16, padding: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', marginBottom: 20,
  };

  const displayLanguages = [
    ...workForm.languages.filter(l => l !== 'Other'),
    ...(workForm.languages.includes('Other') && workForm.otherLanguage ? [workForm.otherLanguage] : []),
  ];

  return (
    <>
        <WorkerHeader activePath="/worker-profile" />

      {/* PAGE */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px 60px' }}>

        {/* PROFILE HEADER */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%', background: '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                cursor: photoUrl ? 'pointer' : 'default',
              }} onClick={() => photoUrl && setShowPhotoLightbox(true)}>
                {photoUrl
                  ? <img src={photoUrl} alt={mergedData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 34, fontWeight: 700, color: '#6b7280' }}>{initials}</span>}
              </div>
              <button onClick={() => photoInputRef.current?.click()} disabled={photoUploading}
                style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: '#16a34a', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: photoUploading ? 'not-allowed' : 'pointer', fontSize: 14 }}>
                {photoUploading ? '…' : '📷'}
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{mergedData.name || '—'}</h2>
              <p style={{ fontSize: 15, color: '#6b7280', margin: '0 0 10px' }}>{primarySkill}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 13, fontWeight: 600, color: '#166534' }}>
                  Trust Score: {mergedData.trustScore}/100
                </span>
                {mergedData.verificationLevel === 'id' && <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#ECFDF5', color: '#166534' }}>✅ ID Verified</span>}
                {mergedData.verificationLevel === 'police' && <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#FEE2E2', color: '#B91C1C' }}>🔐 Police-verified</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ACCOUNT INFO */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Account Info</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>Phone</p>
              <p style={{ fontSize: 15, color: '#111827', margin: 0 }}>{mergedData.phone || '—'}</p>
            </div>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>🔒 Verified</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>Email</p>
              {editingEmail ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)}
                    style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, flex: 1 }} />
                  <button onClick={handleEmailSave} style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>✓</button>
                  <button onClick={() => { setEditingEmail(false); setEmailValue(mergedData.email || ''); }}
                    style={{ padding: '6px 12px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 15, color: '#111827', margin: 0 }}>{mergedData.email || 'Not set'}</p>
                  <button onClick={() => setEditingEmail(true)} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: '12px 0' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>Location</p>
            <p style={{ fontSize: 15, color: '#111827', margin: 0 }}>{mergedData.cityArea || mergedData.city || '—'}</p>
          </div>
        </div>

        {/* EMERGENCY CONTACT */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Emergency Contact</h3>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px' }}>
            Phone number of a trusted person (family member or friend). Used for safety and verification.
          </p>
          <label style={labelStyle}>Emergency Contact Number</label>
          <textarea
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="e.g. +91 98765 43210 — Ravi Kumar (brother)"
            rows={2}
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
              marginTop: 4, resize: 'vertical', fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={handleEmergencyContactSave}
            disabled={savingEmergency}
            style={{
              marginTop: 12, padding: '10px 22px', background: savingEmergency ? '#d1d5db' : '#16a34a',
              color: '#fff', border: 'none', borderRadius: 8,
              cursor: savingEmergency ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            {savingEmergency ? 'Saving…' : 'Save Emergency Contact'}
          </button>
          {mergedData.emergencyContact && (
            <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0' }}>
              Current: {mergedData.emergencyContact}
            </p>
          )}
        </div>

        {/* WORK DETAILS */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Work Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>

            <div>
              <label style={labelStyle}>Experience (Years)</label>
              <input type="number" value={workForm.experienceYears}
                onChange={(e) => setWorkForm({ ...workForm, experienceYears: e.target.value })} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Expected Monthly Salary (₹)</label>
              <input type="text" value={workForm.expectedSalary}
                onChange={(e) => setWorkForm({ ...workForm, expectedSalary: e.target.value })} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Work Type</label>
              <select value={workForm.workType}
                onChange={(e) => setWorkForm({ ...workForm, workType: e.target.value })} style={inputStyle}>
                <option value="">Select Work Type</option>
                <option value="Part-time">Part-time</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Both">Both</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Days Off per Week</label>
              <input type="text" value={workForm.daysOff}
                onChange={(e) => setWorkForm({ ...workForm, daysOff: e.target.value })} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Availability</label>
              <select value={workForm.availability}
                onChange={(e) => setWorkForm({ ...workForm, availability: e.target.value })} style={inputStyle}>
                <option value="">Select Availability</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Full Day">Full Day</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Medical Conditions <span style={{ fontWeight: 400, color: '#9ca3af' }}>(type "None" if N/A)</span></label>
              <input type="text" value={workForm.medicalConditions}
                onChange={(e) => setWorkForm({ ...workForm, medicalConditions: e.target.value })} style={inputStyle} />
            </div>

          </div>

          {/* SKILLS */}
          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Skills <span style={{ fontWeight: 400, color: '#9ca3af' }}>· from resume (editable)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 8 }}>
              {(workForm.skills || []).map((skill, idx) => (
                <span key={idx} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px', borderRadius: 999,
                  background: '#f0fdf4', border: '1px solid #86efac',
                  fontSize: 13, fontWeight: 600, color: '#166534',
                }}>
                  {skill}
                  <button onClick={() => setWorkForm(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="Add a skill (e.g. Cooking, Cleaning…)"
                id="skillInput"
                style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const val = e.target.value.trim();
                    if (!workForm.skills.includes(val)) {
                      setWorkForm(prev => ({ ...prev, skills: [...prev.skills, val] }));
                    }
                    e.target.value = '';
                  }
                }}
              />
              <button type="button"
                onClick={() => {
                  const input = document.getElementById('skillInput');
                  const val = input?.value?.trim();
                  if (val && !workForm.skills.includes(val)) {
                    setWorkForm(prev => ({ ...prev, skills: [...prev.skills, val] }));
                    if (input) input.value = '';
                  }
                }}
                style={{ padding: '10px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                + Add
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Press Enter or click Add. Click × to remove.</p>
          </div>

          {/* LANGUAGES */}
          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Languages Spoken</label>
            {displayLanguages.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 8 }}>
                {displayLanguages.map(lang => (
                  <span key={lang} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 999,
                    background: '#dcfce7', border: '1px solid #86efac',
                    fontSize: 13, fontWeight: 600, color: '#166534',
                  }}>
                    {lang}
                    <button onClick={() => toggleLanguage(lang === workForm.otherLanguage ? 'Other' : lang)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            {displayLanguages.length === 0 && <p style={{ fontSize: 12, color: '#9ca3af', margin: '6px 0 4px' }}>Tap to select languages</p>}

            <div style={{ position: 'relative' }}>
              <div onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 14, color: '#6b7280' }}>Select languages…</span>
                <span>{showLanguageDropdown ? '▲' : '▼'}</span>
              </div>
              {showLanguageDropdown && (
                <div style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, right: 0, marginTop: 4, border: '1px solid #d1d5db', borderRadius: 8, padding: 12, background: '#fff', maxHeight: 220, overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                  {LANGUAGE_OPTIONS.map(lang => (
                    <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 14 }}>
                      <input type="checkbox" checked={workForm.languages.includes(lang)}
                        onChange={(e) => {
                          if (e.target.checked) setWorkForm(prev => ({ ...prev, languages: [...prev.languages, lang] }));
                          else setWorkForm(prev => ({ ...prev, languages: prev.languages.filter(l => l !== lang) }));
                        }} />
                      {lang}
                    </label>
                  ))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input type="checkbox" checked={workForm.languages.includes('Other')}
                      onChange={(e) => {
                        if (e.target.checked) setWorkForm(prev => ({ ...prev, languages: [...prev.languages, 'Other'] }));
                        else setWorkForm(prev => ({ ...prev, languages: prev.languages.filter(l => l !== 'Other'), otherLanguage: '' }));
                      }} />
                    Other
                  </label>
                  {workForm.languages.includes('Other') && (
                    <input type="text" placeholder="Enter language" value={workForm.otherLanguage}
                      onChange={(e) => setWorkForm(prev => ({ ...prev, otherLanguage: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  )}
                </div>
              )}
            </div>
          </div>

          <button onClick={handleWorkSave} style={{ marginTop: 24, background: '#16a34a', color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
            Save Work Details
          </button>

          {uploadMsg && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: saveStatus === 'error' ? '#fef2f2' : '#ecfdf5',
              color:      saveStatus === 'error' ? '#dc2626' : '#166534',
              border:     saveStatus === 'error' ? '1px solid #fecaca' : '1px solid #a7f3d0',
            }}>{uploadMsg}</div>
          )}
        </div>

        {/* RESUME STATUS */}
        <div style={{ borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          background: resumeStatus === 'found' ? '#f0fdf4' : '#fef3c7',
          border: `1px solid ${resumeStatus === 'found' ? '#86efac' : '#fcd34d'}`,
        }}>
          {resumeStatus === 'found' ? (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#166534', margin: '0 0 6px' }}>✅ Resume Generated</h3>
              <p style={{ fontSize: 13, color: '#166534', margin: '0 0 14px' }}>Your resume has been created from voice onboarding. You can regenerate it anytime.</p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#b45309', margin: '0 0 6px' }}>⚠ No Resume Yet</h3>
              <p style={{ fontSize: 13, color: '#92400e', margin: '0 0 14px' }}>Complete voice onboarding to generate your resume.</p>
            </>
          )}
          <button onClick={generatePdf} disabled={pdfLoading || !mergedData?._id} style={{
            padding: '10px 20px', border: 'none', borderRadius: 8,
            background: (pdfLoading || !mergedData?._id) ? '#d1d5db' : (resumeStatus === 'found' ? '#16a34a' : '#d97706'),
            color: '#fff', cursor: (pdfLoading || !mergedData?._id) ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
          }}>
            {pdfLoading ? 'Generating…' : (resumeStatus === 'found' ? 'Download Resume PDF' : 'Generate Resume')}
          </button>
        </div>

      </div>

      {/* Popup toast */}
      {showPopup && (
        <div style={{ position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: '#fff', padding: '14px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 1000, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
          {popupMessage}
        </div>
      )}

      {/* Lightbox */}
      {showPhotoLightbox && photoUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowPhotoLightbox(false)}>
          <img src={photoUrl} alt={mergedData.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setShowPhotoLightbox(false)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 32, width: 48, height: 48, borderRadius: '50%', cursor: 'pointer' }}>×</button>
        </div>
      )}
    </>
  );
};

export default WorkerProfile;