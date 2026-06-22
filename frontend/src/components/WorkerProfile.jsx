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

// Fields to display as info boxes (label, key, type)
const PROFILE_FIELDS = [
  { label: 'Experience (Years)',         key: 'experienceYears',   type: 'number' },
  { label: 'Expected Monthly Salary (₹)',key: 'expectedSalary',    type: 'text'   },
  { label: 'Work Type',                  key: 'workType',          type: 'select',
    options: ['Part-time','Full-Time','Both'] },
  { label: 'Days Off / Week',            key: 'daysOff',           type: 'text'   },
  { label: 'Availability',              key: 'availability',      type: 'select',
    options: ['Morning','Afternoon','Evening','Full Day','Flexible'] },
  { label: 'Medical Conditions',        key: 'medicalConditions', type: 'text'   },
  { label: 'City / Area',               key: 'cityArea',          type: 'text'   },
  { label: 'Bio',                        key: 'bio',               type: 'textarea'},
];

// ── small helpers ──────────────────────────────────────────────
const cardStyle = {
  background: '#fff', borderRadius: 16, padding: 24,
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  border: '1px solid #f3f4f6', marginBottom: 20,
};
const labelStyle = {
  fontSize: 12, fontWeight: 700, color: '#6b7280',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: 4,
};
const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db',
  borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
  fontFamily: 'inherit',
};

// ── single editable field box ──────────────────────────────────
const FieldBox = ({ field, value, onSave }) => {
  const [editing, setEditing]   = useState(false);
  const [localVal, setLocalVal] = useState(value ?? '');
  const [saving, setSaving]     = useState(false);

  // keep in sync when parent value changes
  useEffect(() => { setLocalVal(value ?? ''); }, [value]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(field.key, localVal);
    setSaving(false);
    setEditing(false);
  };

  const display = (localVal !== '' && localVal !== null && localVal !== undefined)
    ? String(localVal) : '—';

  return (
    <div style={{
      background: '#f9fafb', borderRadius: 12, padding: '14px 16px',
      border: '1px solid #e5e7eb', position: 'relative',
    }}>
      <label style={labelStyle}>{field.label}</label>

      {editing ? (
        <div style={{ marginTop: 4 }}>
          {field.type === 'select' ? (
            <select
              value={localVal}
              onChange={e => setLocalVal(e.target.value)}
              style={inputStyle}
            >
              <option value="">— select —</option>
              {field.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              value={localVal}
              onChange={e => setLocalVal(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          ) : (
            <input
              type={field.type}
              value={localVal}
              onChange={e => setLocalVal(e.target.value)}
              style={inputStyle}
            />
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={handleSave} disabled={saving}
              style={{
                padding: '6px 14px', background: '#16a34a', color: '#fff',
                border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600,
              }}
            >
              {saving ? 'Saving…' : '✓ Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setLocalVal(value ?? ''); }}
              style={{
                padding: '6px 12px', background: '#e5e7eb', color: '#374151',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 15, color: display === '—' ? '#9ca3af' : '#111827', fontWeight: display === '—' ? 400 : 500 }}>
            {display}
          </span>
          <button
            onClick={() => setEditing(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 15, color: '#9ca3af', padding: '2px 4px',
              lineHeight: 1,
            }}
            title="Edit"
          >
            ✏️
          </button>
        </div>
      )}
    </div>
  );
};

// ── chip list (skills / languages) editable box ────────────────
const ChipListBox = ({ label, items = [], allOptions, onSave }) => {
  const [editing, setEditing]     = useState(false);
  const [localItems, setLocalItems] = useState(items);
  const [saving, setSaving]         = useState(false);
  const [newItem, setNewItem]        = useState('');

  useEffect(() => { setLocalItems(items); }, [items]);

  const toggle = (val) => {
    setLocalItems(prev =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    );
  };

  const addCustom = () => {
    const v = newItem.trim();
    if (v && !localItems.includes(v)) setLocalItems(prev => [...prev, v]);
    setNewItem('');
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(localItems);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#9ca3af' }}
          >✏️</button>
        )}
      </div>

      {/* Display chips */}
      {!editing && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {localItems.length === 0
            ? <span style={{ fontSize: 14, color: '#9ca3af' }}>—</span>
            : localItems.map(s => (
              <span key={s} style={{
                padding: '4px 12px', borderRadius: 999, background: '#f0fdf4',
                border: '1px solid #86efac', fontSize: 13, fontWeight: 600, color: '#166534',
              }}>{s}</span>
            ))
          }
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <>
          {allOptions && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {allOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => toggle(opt)}
                  style={{
                    padding: '4px 12px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                    border: '1px solid',
                    background: localItems.includes(opt) ? '#dcfce7' : '#f3f4f6',
                    borderColor: localItems.includes(opt) ? '#86efac' : '#d1d5db',
                    color: localItems.includes(opt) ? '#166534' : '#374151',
                    fontWeight: localItems.includes(opt) ? 600 : 400,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          {/* Custom chip add */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder={`Add custom ${label.toLowerCase()}…`}
              style={{ ...inputStyle, marginTop: 0, flex: 1 }}
            />
            <button
              onClick={addCustom}
              style={{ padding: '8px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >+ Add</button>
          </div>
          {/* Selected items with remove */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {localItems.map(s => (
              <span key={s} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 999,
                background: '#dcfce7', border: '1px solid #86efac',
                fontSize: 13, fontWeight: 600, color: '#166534',
              }}>
                {s}
                <button
                  onClick={() => setLocalItems(prev => prev.filter(x => x !== s))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: 15, lineHeight: 1, padding: 0 }}
                >×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave} disabled={saving}
              style={{ padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
            >{saving ? 'Saving…' : '✓ Save'}</button>
            <button
              onClick={() => { setEditing(false); setLocalItems(items); }}
              style={{ padding: '8px 14px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
            >Cancel</button>
          </div>
        </>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
const WorkerProfile = ({ onBack }) => {
  const navigate   = useNavigate();
  const { language } = useLanguage();

  const [worker,       setWorker]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [popup,        setPopup]        = useState('');
  const [pdfLoading,   setPdfLoading]   = useState(false);

  // photo
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);

  // lightbox
  const [lightbox, setLightbox] = useState(false);

  // emergency contact editing
  const [ecPhone,         setEcPhone]         = useState('');
  const [ecLookupName,    setEcLookupName]    = useState('');
  const [ecLookupStatus,  setEcLookupStatus]  = useState(''); // ''|'loading'|'found'|'not_found'
  const [ecSaving,        setEcSaving]        = useState(false);

  // email editing
  const [editingEmail,  setEditingEmail]  = useState(false);
  const [emailValue,    setEmailValue]    = useState('');

  const showPopup = (msg) => {
    setPopup(msg);
    setTimeout(() => setPopup(''), 3000);
  };

  // ── fetch worker ─────────────────────────────────────────────
  const fetchWorker = async () => {
    try {
      setLoading(true);
      const userDataStr = localStorage.getItem('userData');
      const account = userDataStr ? JSON.parse(userDataStr) : null;
      if (!account?.phone) return;

      const cleanPhone = account.phone.replace(/\D/g, '');

      // 1) by-phone — may return partial record
      const r1 = await fetch(`${API_BASE}/api/workers/by-phone/${cleanPhone}`);
      if (!r1.ok) {
        console.warn('[WorkerProfile] by-phone fetch failed', r1.status);
        return;
      }
      let partial = await r1.json();
      console.log('[WorkerProfile] by-phone partial:', partial);

      // 2) always fetch full record by _id so every saved field is present
      let w = partial;
      const workerId = partial?._id || partial?.id;
      if (workerId) {
        try {
          const r2 = await fetch(`${API_BASE}/api/workers/${workerId}`);
          if (r2.ok) {
            const full = await r2.json();
            console.log('[WorkerProfile] full record:', full);
            // full record wins for every key that is non-null/non-empty
            w = { ...partial, ...full };
          } else {
            console.warn('[WorkerProfile] full record fetch failed', r2.status);
          }
        } catch (e2) {
          console.warn('[WorkerProfile] full record fetch error', e2);
        }
      }

      // 3) normalise availability (object → string)
      const rawAvail = w.availability || w.availabilityDetail;
      if (rawAvail && typeof rawAvail === 'object') {
        const { morning, afternoon, evening, days } = rawAvail;
        if (morning && afternoon && evening)      w.availability = 'Full Day';
        else if (morning)                         w.availability = 'Morning';
        else if (afternoon)                       w.availability = 'Afternoon';
        else if (evening)                         w.availability = 'Evening';
        else                                      w.availability = days === 'Flexible' ? 'Flexible' : '';
      }

      // 4) resolve all possible PDF URL field names the backend might use
      w.pdfUrl = w.pdfUrl || w.generatedPdfUrl || w.uploadedPdfUrl || w.resumeUrl || '';

      // 5) name: prefer worker doc (set during onboarding), fall back to login account
      //    Then always ensure phone comes from login (authoritative)
      w.name     = w.name     || account.name     || '';
      w.phone    = account.phone;                          // always login phone
      w.email    = w.email    || account.email    || '';
      w.photoUrl = w.photoUrl || account.photoUrl || '';

      // 6) also save name back to localStorage so it's available on next load
      if (w.name && !account.name) {
        localStorage.setItem('userData', JSON.stringify({ ...account, name: w.name }));
      }

      console.log('[WorkerProfile] final worker state:', w);
      setWorker(w);
      setEcPhone(w.emergencyContact || account.phone || '');
      setEmailValue(w.email || '');
    } catch (e) {
      console.error('[WorkerProfile] fetchWorker error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorker(); }, []);

  // ── debounced emergency-contact lookup ───────────────────────
  useEffect(() => {
    const phone = ecPhone.replace(/\D/g,'');
    // Don't look up if it's the worker's own login number
    const account = JSON.parse(localStorage.getItem('userData') || '{}');
    if (phone === account?.phone?.replace(/\D/g,'')) {
      setEcLookupName(account.name || '');
      setEcLookupStatus(account.name ? 'found' : '');
      return;
    }
    if (phone.length < 10) { setEcLookupName(''); setEcLookupStatus(''); return; }
    setEcLookupStatus('loading');
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/workers/by-phone/${phone}`);
        if (res.ok) {
          const data = await res.json();
          setEcLookupName(data.name || '');
          setEcLookupStatus(data.name ? 'found' : 'not_found');
        } else { setEcLookupName(''); setEcLookupStatus('not_found'); }
      } catch { setEcLookupName(''); setEcLookupStatus('not_found'); }
    }, 500);
    return () => clearTimeout(id);
  }, [ecPhone]);

  // ── patch a single field → save + regenerate PDF ─────────────
  const patchField = async (key, value) => {
    if (!worker?._id) { showPopup('Worker ID missing'); return; }
    try {
      const res = await fetch(`${API_BASE}/api/workers/${worker._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      // Optimistically update local state, then re-fetch to confirm
      setWorker(prev => ({ ...prev, [key]: value }));
      showPopup('Saved! Regenerating resume…');
      await regeneratePdf(worker._id);
    } catch (e) {
      console.error('[patchField] error:', e);
      showPopup('Save failed — ' + e.message);
    }
  };

  // ── patch chip-list field (skills / languages) ───────────────
  const patchList = async (key, list) => {
    if (!worker?._id) { showPopup('Worker ID missing'); return; }
    try {
      const res = await fetch(`${API_BASE}/api/workers/${worker._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: list }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      setWorker(prev => ({ ...prev, [key]: list }));
      showPopup('Saved! Regenerating resume…');
      await regeneratePdf(worker._id);
    } catch (e) {
      console.error('[patchList] error:', e);
      showPopup('Save failed — ' + e.message);
    }
  };

  // ── regenerate PDF (silent — called after every save) ────────
  const regeneratePdf = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/workers/${id}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorker(prev => ({ ...prev, pdfUrl: data.pdfUrl }));
        showPopup('Resume updated!');
      }
    } catch { /* silently ignore */ }
  };

  // ── manual download ──────────────────────────────────────────
  const downloadPdf = async () => {
    if (!worker?._id) return;
    setPdfLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/workers/${worker._id}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      if (!res.ok) { alert('PDF generation failed'); return; }
      const data = await res.json();
      const link = document.createElement('a');
      link.href = `${API_BASE}${data.pdfUrl}`;
      link.download = `worker_${worker._id}.pdf`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      setWorker(prev => ({ ...prev, pdfUrl: data.pdfUrl }));
    } catch { alert('PDF generation failed'); }
    finally { setPdfLoading(false); }
  };

  // ── photo upload ─────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !worker?._id) return;
    setPhotoUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res  = await fetch(`${API_BASE}/api/workers/${worker._id}/upload-photo`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.photoUrl) {
        setWorker(prev => ({ ...prev, photoUrl: data.photoUrl }));
        const account = JSON.parse(localStorage.getItem('userData') || '{}');
        const updated = { ...account, photoUrl: data.photoUrl };
        localStorage.setItem('userData', JSON.stringify(updated));
        showPopup('Photo updated!');
      }
    } catch { showPopup('Photo upload failed'); }
    finally { setPhotoUploading(false); }
  };

  // ── email save ───────────────────────────────────────────────
  const saveEmail = async () => {
    const account = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!account?.phone) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${account.phone}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue }),
      });
      if (!res.ok) throw new Error();
      setWorker(prev => ({ ...prev, email: emailValue }));
      const updated = { ...account, email: emailValue };
      localStorage.setItem('userData', JSON.stringify(updated));
      setEditingEmail(false);
      showPopup('Email updated!');
    } catch { showPopup('Email update failed'); }
  };

  // ── emergency contact save ───────────────────────────────────
  const saveEmergencyContact = async () => {
    if (!worker?._id) return;
    setEcSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/workers/${worker._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyContact: ecPhone }),
      });
      if (!res.ok) throw new Error();
      setWorker(prev => ({ ...prev, emergencyContact: ecPhone }));
      showPopup('Emergency contact saved!');
    } catch { showPopup('Save failed'); }
    finally { setEcSaving(false); }
  };

  // ─────────────────────────────────────────────────────────────
  if (loading) return <div style={{ paddingTop: 100, textAlign: 'center' }}><p>Loading profile…</p></div>;
  if (!worker)  return (
    <div style={{ paddingTop: 100, textAlign: 'center' }}>
      <p>No profile found. Please complete onboarding first.</p>
      <button onClick={() => navigate('/worker-onboard')}
        style={{ marginTop: 16, padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
        Start Onboarding
      </button>
    </div>
  );

  const photoUrl     = resolveMediaUrl(worker.photoUrl);
  const initials     = worker.name ? worker.name.charAt(0).toUpperCase() : 'W';
  const primarySkill = worker.skills?.[0] || worker.workType || 'Domestic Worker';
  const pdfUrl = worker.pdfUrl || worker.uploadedPdfUrl || worker.generatedPdfUrl || worker.resumeUrl || '';

  return (
    <>
      <WorkerHeader activePath="/worker-profile" />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px 80px' }}>

        {/* ── PROFILE HEADER ─────────────────────────────────── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: 88, height: 88, borderRadius: '50%', background: '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', border: '3px solid #fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: photoUrl ? 'pointer' : 'default',
                }}
                onClick={() => photoUrl && setLightbox(true)}
              >
                {photoUrl
                  ? <img src={photoUrl} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 34, fontWeight: 700, color: '#6b7280' }}>{initials}</span>}
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                style={{
                  position: 'absolute', bottom: -4, right: -4, width: 28, height: 28,
                  borderRadius: '50%', background: '#16a34a', border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: photoUploading ? 'not-allowed' : 'pointer', fontSize: 14,
                }}
              >{photoUploading ? '…' : '📷'}</button>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </div>

            {/* Name / role / badges */}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{worker.name || '—'}</h2>
              <p style={{ fontSize: 15, color: '#6b7280', margin: '0 0 10px' }}>{primarySkill}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 13, fontWeight: 600, color: '#166534' }}>
                  Trust Score: {worker.trustScore || 0}/100
                </span>
                {worker.verificationLevel === 'id'     && <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#ECFDF5', color: '#166534' }}>✅ ID Verified</span>}
                {worker.verificationLevel === 'police' && <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#FEE2E2', color: '#B91C1C' }}>🔐 Police-verified</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── ACCOUNT INFO ───────────────────────────────────── */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Account Info</h3>

          {/* Phone — read-only, same as login */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>Phone</p>
              <p style={{ fontSize: 15, color: '#111827', margin: 0 }}>{worker.phone || '—'}</p>
            </div>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>🔒 Verified</span>
          </div>

          {/* Email — editable */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>Email</p>
              {editingEmail ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="email" value={emailValue} onChange={e => setEmailValue(e.target.value)}
                    style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, flex: 1 }} />
                  <button onClick={saveEmail} style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>✓</button>
                  <button onClick={() => { setEditingEmail(false); setEmailValue(worker.email || ''); }}
                    style={{ padding: '6px 12px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 15, color: '#111827', margin: 0 }}>{worker.email || 'Not set'}</p>
                  <button onClick={() => setEditingEmail(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>✏️</button>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div style={{ padding: '12px 0' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>Location</p>
            <p style={{ fontSize: 15, color: '#111827', margin: 0 }}>{worker.cityArea || worker.city || '—'}</p>
          </div>
        </div>

        {/* ── EMERGENCY CONTACT ──────────────────────────────── */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Emergency Contact</h3>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px' }}>
            Phone number of a trusted person. Auto-filled with your login number — change if needed.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            <div>
              <label style={{ ...labelStyle, textTransform: 'none', fontSize: 13, fontWeight: 600, color: '#374151' }}>Phone Number</label>
              <input
                type="tel"
                value={ecPhone}
                onChange={e => setEcPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                style={{ ...inputStyle, marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, textTransform: 'none', fontSize: 13, fontWeight: 600, color: '#374151' }}>Name (auto-filled)</label>
              <div style={{ position: 'relative', marginTop: 4 }}>
                <input
                  readOnly
                  value={ecLookupName}
                  placeholder={
                    ecLookupStatus === 'loading'   ? 'Looking up…' :
                    ecLookupStatus === 'not_found' ? 'Not found in system' :
                    'Enter phone to auto-fill'
                  }
                  style={{
                    ...inputStyle,
                    background: ecLookupStatus === 'found' ? '#f0fdf4' : '#f9fafb',
                    color: ecLookupStatus === 'found' ? '#166534' : '#9ca3af',
                    fontWeight: ecLookupStatus === 'found' ? 600 : 400,
                    borderColor: ecLookupStatus === 'found' ? '#86efac' : ecLookupStatus === 'not_found' ? '#fca5a5' : '#d1d5db',
                  }}
                />
                {ecLookupStatus === 'loading'   && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12 }}>⏳</span>}
                {ecLookupStatus === 'found'     && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>✅</span>}
                {ecLookupStatus === 'not_found' && ecPhone.replace(/\D/g,'').length >= 10 && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>❌</span>}
              </div>
            </div>
          </div>

          {ecLookupStatus === 'not_found' && ecPhone.replace(/\D/g,'').length >= 10 && (
            <p style={{ fontSize: 12, color: '#dc2626', margin: '6px 0 0' }}>
              No worker found with this number. You can still save it as a contact.
            </p>
          )}

          <button
            onClick={saveEmergencyContact} disabled={ecSaving}
            style={{
              marginTop: 14, padding: '10px 22px',
              background: ecSaving ? '#d1d5db' : '#16a34a',
              color: '#fff', border: 'none', borderRadius: 8,
              cursor: ecSaving ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >{ecSaving ? 'Saving…' : 'Save Emergency Contact'}</button>

          {worker.emergencyContact && (
            <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0' }}>
              Saved: {worker.emergencyContact}
            </p>
          )}
        </div>

        {/* ── PROFILE DETAILS (fetched, inline-editable) ────── */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Profile Details</h3>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 18px' }}>
            Fetched from your voice onboarding. Edit any field — changes save instantly and update your resume.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {PROFILE_FIELDS.map(field => (
              <div key={field.key} style={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
                <FieldBox
                  field={field}
                  value={worker[field.key]}
                  onSave={(key, val) => patchField(key, val)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── SKILLS ─────────────────────────────────────────── */}
        <ChipListBox
          label="Skills"
          items={worker.skills || []}
          allOptions={null}
          onSave={list => patchList('skills', list)}
        />

        {/* ── LANGUAGES ──────────────────────────────────────── */}
        <ChipListBox
          label="Languages Spoken"
          items={worker.languages || []}
          allOptions={LANGUAGE_OPTIONS}
          onSave={list => patchList('languages', list)}
        />

        {/* ── RESUME ─────────────────────────────────────────── */}
        <div style={{
          borderRadius: 16, padding: 24, marginBottom: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          background: pdfUrl ? '#f0fdf4' : '#fef3c7',
          border: `1px solid ${pdfUrl ? '#86efac' : '#fcd34d'}`,
        }}>
          {pdfUrl ? (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#166534', margin: '0 0 6px' }}>✅ Resume Ready</h3>
              <p style={{ fontSize: 13, color: '#166534', margin: '0 0 14px' }}>
                Your resume updates automatically whenever you edit any profile field.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#b45309', margin: '0 0 6px' }}>⚠ No Resume Yet</h3>
              <p style={{ fontSize: 13, color: '#92400e', margin: '0 0 14px' }}>Complete voice onboarding to generate your resume.</p>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={downloadPdf} disabled={pdfLoading || !worker?._id}
              style={{
                padding: '10px 20px', border: 'none', borderRadius: 8,
                background: (pdfLoading || !worker?._id) ? '#d1d5db' : (pdfUrl ? '#16a34a' : '#d97706'),
                color: '#fff',
                cursor: (pdfLoading || !worker?._id) ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 600,
              }}
            >{pdfLoading ? 'Generating…' : (pdfUrl ? '⬇ Download Resume' : 'Generate Resume')}</button>

            {pdfUrl && (
              <a
                href={`${API_BASE}${pdfUrl.startsWith('/') ? pdfUrl : '/' + pdfUrl}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid #86efac',
                  background: '#fff', color: '#166534', fontSize: 14, fontWeight: 600,
                  textDecoration: 'none', display: 'inline-block',
                }}
              >👁 View Resume</a>
            )}
          </div>

          {pdfUrl && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Resume Preview</p>
              <iframe
                src={`${API_BASE}${pdfUrl.startsWith('/') ? pdfUrl : '/' + pdfUrl}`}
                title="Resume Preview"
                style={{ width: '100%', height: 520, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff' }}
              />
            </div>
          )}
        </div>

      </div>{/* end page */}

      {/* ── Toast popup ──────────────────────────────────────── */}
      {popup && (
        <div style={{
          position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)',
          background: '#16a34a', color: '#fff', padding: '14px 24px',
          borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}>{popup}</div>
      )}

      {/* ── Photo lightbox ───────────────────────────────────── */}
      {lightbox && photoUrl && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setLightbox(false)}
        >
          <img src={photoUrl} alt={worker.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(false)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 32, width: 48, height: 48, borderRadius: '50%', cursor: 'pointer' }}>×</button>
        </div>
      )}
    </>
  );
};

export default WorkerProfile;