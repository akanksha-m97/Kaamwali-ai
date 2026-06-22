// src/components/WorkerDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getMetrics } from '../api';
import WorkerHeader from './WorkerHeader';
import { useLanguage } from '../contexts/LanguageContext';
import kaamImage from '../assets/images/kaam.jpg';

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics]     = useState(null);
  const [workerData, setWorkerData] = useState(null);
  const [status, setStatus]       = useState('unknown');
  const [loading, setLoading]     = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [form, setForm] = useState({
    workerPhone: '', employerName: '', employerPhone: '', householdName: '', fromDate: '',
  });
  const [verifyForm, setVerifyForm] = useState({ workerPhone: '', docType: 'id' });
  const [message, setMessage]           = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');


  const { messages } = useLanguage();
  const t = (messages && messages.workerDashboard) || {};

  useEffect(() => {
    getMetrics().then(setMetrics).catch(() => {});
    let savedPhone = localStorage.getItem('workerPhone');
    
    // Fallback to userData.phone if workerPhone not set yet
    if (!savedPhone) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          savedPhone = user.phone;
        } catch (e) {
          // ignore parse error
        }
      }
    }
    
    if (savedPhone) {
      setForm(prev => ({ ...prev, workerPhone: savedPhone }));
      setVerifyForm(prev => ({ ...prev, workerPhone: savedPhone }));
      loadWorkerStatus(savedPhone);
      loadContactRequests(savedPhone);  // Query with login phone
    }
  }, []);

  const loadWorkerStatus = async (phone) => {
    try {
      const res  = await fetch(`${API_BASE}/api/workers/by-phone/${phone}`);
      const data = await res.json();
      if (res.ok && data.name) { 
        setWorkerData(data); 
        setStatus(data.isHired ? 'hired' : 'available'); 
      }
    } catch (err) { console.error('Status load error:', err); }
  };

  // ── Safety form ──
  const [safetyForm, setSafetyForm]       = useState({ employerPhone: '', issueType: 'Harassment/Abuse', description: '' });
  const [safetyMessage, setSafetyMessage] = useState('');
  const [safetyLoading, setSafetyLoading] = useState(false);

  const [contactRequests, setContactRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsMessage, setRequestsMessage] = useState('');

  const handleSafetyChange = (e) => setSafetyForm({ ...safetyForm, [e.target.name]: e.target.value });

  const formatRequestDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const loadContactRequests = async (phone) => {
    if (!phone) return;
    setRequestsLoading(true);
    setRequestsMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/contact-requests/worker?phone=${encodeURIComponent(phone)}&status=all`);
      const data = await res.json();
      if (res.ok) {
        setContactRequests(data.contactRequests || []);
      } else {
        setRequestsMessage(data.error || 'Failed to load contact requests');
      }
    } catch (err) {
      setRequestsMessage('Server error while loading contact requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  const respondToContactRequest = async (requestId, status) => {
    setRequestsLoading(true);
    setRequestsMessage('');
    try {
      const phone = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')).phone : '';
      const res = await fetch(`${API_BASE}/api/contact-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, workerPhone: phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setRequestsMessage(status === 'approved' ? '✅ Request approved' : '❌ Request rejected');
        loadContactRequests(phone);
      } else {
        setRequestsMessage(data.error || 'Failed to update request');
      }
    } catch (err) {
      setRequestsMessage('Server error while updating request');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleUnsafe = async () => {
    setSafetyLoading(true); setSafetyMessage('');
    try {
      const phone = localStorage.getItem('workerPhone') || '';
      const res = await fetch(`${API_BASE}/api/worker/safety-alert`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerPhone: phone, urgent: true }),
      });
      setSafetyMessage(res.ok ? '✅ Emergency alert sent to your contact!' : '❌ Could not send alert. Call 112 immediately.');
    } catch { setSafetyMessage('❌ No connection. Please call 112 immediately.'); }
    finally { setSafetyLoading(false); }
  };

  const handleSafetyReport = async () => {
    if (!safetyForm.description.trim()) { setSafetyMessage('❌ Please describe the issue.'); return; }
    setSafetyLoading(true); setSafetyMessage('');
    try {
      const phone = localStorage.getItem('workerPhone') || '';
      const res = await fetch(`${API_BASE}/api/worker/report-issue`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerPhone: phone, ...safetyForm }),
      });
      if (res.ok) { setSafetyMessage('✅ Incident reported. Our team will review it.'); setSafetyForm({ employerPhone: '', issueType: 'Harassment/Abuse', description: '' }); }
      else setSafetyMessage('❌ Failed to submit. Please try again.');
    } catch { setSafetyMessage('❌ Server error. Please try again later.'); }
    finally { setSafetyLoading(false); }
  };

  // ── Smart ID Verification (Google Vision backend) ──
  const [scanResult, setScanResult]     = useState(null);
  const [scanLoading, setScanLoading]   = useState(false);
  const [scanError, setScanError]       = useState('');
  const [scanProgress, setScanProgress] = useState('');
  const scanFileRef = useRef(null);
  const verifiedPhone = localStorage.getItem('workerPhone') || '';

  const scanIdDocument = async (file) => {
    if (!file) return;

    // Client-side validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
    if (!allowed.includes(file.type)) {
      setScanError('❌ Please upload a JPG, PNG, or WEBP image of your ID.'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setScanError('❌ File too large. Please upload under 5MB.'); return;
    }

    setScanLoading(true); setScanResult(null); setScanError('');
    setScanProgress('Uploading document...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setScanProgress('Scanning with Google Vision...');
      const res  = await fetch(`${API_BASE}/api/verify-doc`, { method: 'POST', body: formData });
      setScanProgress('Analyzing...');
      const data = await res.json();

      if (!res.ok) { setScanError(`❌ ${data.message || 'Server error.'}`); return; }

      setScanResult(data);

      if (data.success) {
        setWorkerData(prev => ({ ...(prev || {}), verificationLevel: 'id', verifiedName: data.extractedName }));
        if (verifiedPhone) {
          fetch(`${API_BASE}/api/worker/verify`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workerPhone: verifiedPhone, docType: data.detectedDocType, fileUrl: '' }),
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('verify-doc error:', err);
      setScanError('❌ Network error. Please check your connection.');
    } finally { setScanLoading(false); setScanProgress(''); }
  };

  // ── Other handlers ──
  const handleChange       = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleVerifyChange = (e) => setVerifyForm({ ...verifyForm, [e.target.name]: e.target.value });
  const handleFileChange   = (e) => { const f = e.target.files?.[0]; if (f) uploadVerification(f); };

  const callSelfHire = async () => {
    setLoading(true); setMessage('');
    try {
      const res  = await fetch(`${API_BASE}/api/worker/self-hire`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyContact: form.workerPhone, employerName: form.employerName, employerPhone: form.employerPhone || undefined, householdName: form.householdName || undefined, fromDate: form.fromDate || new Date().toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) setMessage(data.message || 'Failed to update hire status');
      else { setStatus('hired'); setMessage('✅ Marked as hired for this household.'); localStorage.setItem('workerPhone', form.workerPhone); }
    } catch { setMessage('❌ Server error while marking hired.'); }
    finally { setLoading(false); }
  };

  const callSelfRelease = async () => {
    setLoading(true); setMessage('');
    try {
      const res  = await fetch(`${API_BASE}/api/worker/self-release`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyContact: form.workerPhone, endDate: new Date().toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) setMessage(data.message || 'Failed to update availability');
      else { setStatus('available'); setMessage('✅ You are now marked as available for new work.'); }
    } catch { setMessage('❌ Server error.'); }
    finally { setLoading(false); }
  };

  const uploadVerification = async (file) => {
    if (!file || !verifyForm.workerPhone) { setVerifyMessage('❌ Please enter phone number'); return; }
    setVerifyLoading(true); setVerifyMessage('');
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('phone', verifyForm.workerPhone); fd.append('docType', verifyForm.docType);
      const uploadRes  = await fetch(`${API_BASE}/api/upload/verification`, { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.fileUrl) { setVerifyMessage(`❌ ${uploadData.message || 'Upload failed'}`); return; }
      const res  = await fetch(`${API_BASE}/api/worker/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerPhone: verifyForm.workerPhone, docType: verifyForm.docType, fileUrl: uploadData.fileUrl }),
      });
      const data = await res.json();
      if (!res.ok) setVerifyMessage(`❌ ${data.message || 'Verification failed'}`);
      else { setVerifyMessage('✅ Document uploaded successfully!'); setWorkerData(prev => ({ ...(prev||{}), verificationLevel: data.verificationLevel })); localStorage.setItem('workerPhone', verifyForm.workerPhone); if (fileInputRef.current) fileInputRef.current.value = ''; }
    } catch { setVerifyMessage('❌ Server error.'); }
    finally { setVerifyLoading(false); }
  };

  const getVerificationBadge = (level) => {
    switch (level) {
      case 'police': return { text: 'Police Verified', color: '#166534', bg: '#DCFCE7' };
      case 'id':     return { text: 'ID Verified',     color: '#15803D', bg: '#ECFDF5' };
      case 'phone':  return { text: 'Phone Verified',  color: '#059669', bg: '#F0FDF4' };
      default:       return { text: 'Not Verified',    color: '#DC2626', bg: '#FEF2F2' };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('workerPhone');
    navigate('/');
  };

  const statusLabel = status === 'hired' ? 'Hired (currently working)' : status === 'available' ? 'Available for work' : 'Status unknown';
  const statusColor = status === 'hired' ? '#B91C1C' : status === 'available' ? '#166534' : '#6B7280';
  const statusBg    = status === 'hired' ? '#FEE2E2' : status === 'available' ? '#DCFCE7' : '#E5E7EB';

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .wd-topbar { background: #1a2e22; color: #d1fae5; font-size: 12px; text-align: center; padding: 6px 16px; }
        .wd-page { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8faf8; min-height: 100vh; color: #111827; }
        .wd-nav { display:flex; align-items:center; justify-content:space-between; padding:0 48px; height:64px; background:#fff; border-bottom:1px solid #e5e7eb; position:sticky; top:0; z-index:100; box-shadow:0 1px 6px rgba(0,0,0,0.04); }
        .wd-logo { font-size:20px; font-weight:800; color:#111827; letter-spacing:-0.5px; }
        .wd-logo span { color:#16a34a; }
        .wd-nav-links { display:flex; align-items:center; gap:8px; }
        .wd-nav-link { background:none; border:none; font-size:14px; font-weight:500; color:#374151; cursor:pointer; padding:8px 14px; border-radius:8px; transition:all 0.15s; }
        .wd-nav-link:hover { background:#f0fdf4; color:#16a34a; }
        .wd-nav-cta { background:#16a34a; color:#fff; border:none; font-size:14px; font-weight:600; padding:9px 20px; border-radius:8px; cursor:pointer; transition:all 0.15s; }
        .wd-nav-cta:hover { background:#15803d; transform:translateY(-1px); }
        .wd-hero { position:relative; display:flex; align-items:center; justify-content:space-between; gap:48px; padding:40px 48px 48px; background:linear-gradient(rgba(22,43,34,0.55), rgba(22,43,34,0.55)), url('${kaamImage}') center/cover no-repeat; overflow:hidden; min-height:360px; }
        .wd-hero-left { position:relative; max-width:520px; z-index:1; }
        .wd-hero-eyebrow { display:inline-flex; align-items:center; gap:6px; background:rgba(22,163,74,0.25); color:#86efac; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:4px 12px; border-radius:999px; margin-bottom:16px; }
        .wd-hero-title { font-size:clamp(28px,4vw,42px); font-weight:800; line-height:1.18; color:#fff; margin-bottom:16px; letter-spacing:-0.5px; }
        .wd-hero-subtitle { font-size:15px; color:#d1fae5; line-height:1.65; margin-bottom:32px; opacity:0.9; }
        .wd-hero-trust { display:flex; gap:20px; margin-bottom:28px; flex-wrap:wrap; }
        .wd-hero-trust-item { display:flex; align-items:center; gap:6px; font-size:13px; color:#d1fae5; font-weight:500; }
        .wd-hero-trust-dot { width:6px; height:6px; border-radius:50%; background:#4ade80; }
        .wd-hero-actions { display:flex; gap:12px; flex-wrap:wrap; }
        .wd-hero-right { position:relative; z-index:1; flex-shrink:0; }
        .wd-preview-card { background:#fff; border-radius:16px; padding:20px 22px; width:300px; box-shadow:0 20px 50px rgba(0,0,0,0.35); }
        .wd-preview-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .wd-preview-title { font-size:13px; font-weight:700; color:#111827; }
        .wd-preview-badge { font-size:11px; font-weight:600; color:#16a34a; background:#f0fdf4; padding:3px 10px; border-radius:999px; border:1px solid #bbf7d0; }
        .wd-filter-row { display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap; }
        .wd-filter-pill { background:#f3f4f6; color:#6b7280; font-size:11px; font-weight:600; padding:4px 10px; border-radius:999px; }
        .wd-preview-row { padding:10px 0; border-top:1px solid #f3f4f6; display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
        .wd-preview-row-name { font-size:12px; font-weight:700; color:#111827; margin-bottom:2px; }
        .wd-preview-row-meta { font-size:11px; color:#9ca3af; margin-bottom:5px; }
        .wd-preview-tags { display:flex; gap:4px; flex-wrap:wrap; }
        .wd-preview-tag { background:#f3f4f6; color:#6b7280; font-size:10px; padding:2px 7px; border-radius:4px; }
        .wd-status-pill { font-size:11px; font-weight:700; padding:3px 9px; border-radius:999px; white-space:nowrap; flex-shrink:0; }
        .wd-status-amber { background:#fef3c7; color:#b45309; }
        .wd-status-green { background:#dcfce7; color:#166534; }
        .wd-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; font-size:14px; font-weight:600; padding:11px 22px; border-radius:9px; cursor:pointer; transition:all 0.15s; border:2px solid transparent; }
        .wd-btn-primary { background:#16a34a; color:#fff; border-color:#16a34a; }
        .wd-btn-primary:hover { background:#15803d; transform:translateY(-1px); box-shadow:0 4px 12px rgba(22,163,74,0.35); }
        .wd-btn-primary:disabled { opacity:0.65; cursor:not-allowed; transform:none; }
        .wd-btn-outline { background:transparent; color:#fff; border-color:rgba(255,255,255,0.55); }
        .wd-btn-outline:hover { background:rgba(255,255,255,0.1); border-color:#fff; }
        .wd-btn-outline-dark { background:transparent; color:#16a34a; border-color:#16a34a; width:100%; }
        .wd-btn-outline-dark:hover { background:#f0fdf4; }
        .wd-btn-outline-dark:disabled { opacity:0.65; cursor:not-allowed; }
        .wd-btn-full { width:100%; }
        .wd-main { max-width:1100px; margin:0 auto; padding:0 24px 80px; }
        .wd-section { margin-top:64px; }
        .wd-card { background:#fff; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.05); padding:28px; border:1px solid #f3f4f6; }
        .wd-cards-row { display:grid; grid-template-columns:1fr 1fr; gap:24px; align-items:start; max-width:960px; margin:0 auto; }
        .wd-cards-col { display:flex; flex-direction:column; gap:24px; }
        @media (max-width:860px) { .wd-cards-row { grid-template-columns:1fr; } }
        .wd-card-header { display:flex; align-items:center; gap:14px; margin-bottom:20px; }
        .wd-card-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:18px; font-weight:800; }
        .wd-card-icon-blue { background:#dbeafe; color:#1d4ed8; }
        .wd-card-icon-green { background:#dcfce7; color:#15803d; }
        .wd-card-title { font-size:18px; font-weight:800; color:#111827; margin-bottom:3px; }
        .wd-card-subtitle { font-size:13px; color:#6b7280; line-height:1.45; }
        .wd-badge { display:inline-flex; align-items:center; padding:5px 14px; border-radius:999px; font-size:12px; font-weight:700; margin-bottom:20px; }
        .wd-field { display:flex; flex-direction:column; gap:6px; }
        .wd-label { font-size:13px; font-weight:600; color:#374151; }
        .wd-input, .wd-select { height:44px; border-radius:10px; border:1.5px solid #e5e7eb; padding:0 14px; font-size:14px; background:#fafafa; color:#111827; transition:border-color 0.15s,box-shadow 0.15s; outline:none; width:100%; }
        .wd-input:focus, .wd-select:focus { border-color:#16a34a; box-shadow:0 0 0 3px rgba(22,163,74,0.12); background:#fff; }
        .wd-input::placeholder { color:#9ca3af; }
        .wd-form-stack { display:flex; flex-direction:column; gap:14px; }
        .wd-divider { border:none; border-top:1px solid #f3f4f6; margin:20px 0; }
        .wd-sub-label { font-size:13px; font-weight:700; color:#111827; margin-bottom:3px; }
        .wd-sub-desc { font-size:12px; color:#6b7280; margin-bottom:10px; }
        .wd-upload-btn { width:100%; height:48px; border-radius:10px; border:2px dashed #d1d5db; background:#f9fafb; color:#6b7280; font-size:14px; font-weight:500; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .wd-upload-btn:hover:not(:disabled) { border-color:#16a34a; background:#f0fdf4; color:#16a34a; }
        .wd-upload-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .wd-msg { padding:11px 16px; border-radius:10px; font-size:13px; font-weight:500; text-align:center; }
        .wd-msg-success { background:#ecfdf5; color:#166534; border:1px solid #a7f3d0; }
        .wd-msg-error { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
        .wd-msg-neutral { color:#6b7280; font-size:12px; margin-top:4px; }
        .wd-how-title { font-size:26px; font-weight:800; color:#111827; margin-bottom:32px; text-align:center; }
        .wd-steps-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .wd-step-card { background:#fff; border-radius:16px; border:1px solid #f3f4f6; padding:28px 24px; box-shadow:0 10px 25px rgba(0,0,0,0.05); position:relative; }
        .wd-step-num { position:absolute; top:20px; right:20px; font-size:48px; font-weight:900; color:#f0fdf4; line-height:1; pointer-events:none; user-select:none; }
        .wd-step-icon { width:40px; height:40px; border-radius:12px; background:#16a34a; color:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; margin-bottom:16px; }
        .wd-step-title { font-size:15px; font-weight:700; color:#111827; margin-bottom:8px; }
        .wd-step-text { font-size:13px; color:#6b7280; line-height:1.6; }
        .wd-trust-strip { margin-top:64px; background:#1a2e22; padding:48px; }
        .wd-trust-grid { max-width:900px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); gap:32px; text-align:center; }
        .wd-trust-item-icon { font-size:28px; margin-bottom:10px; }
        .wd-trust-item-label { font-size:14px; font-weight:700; color:#fff; margin-bottom:4px; }
        .wd-trust-item-desc { font-size:12px; color:#86efac; line-height:1.45; }
        .wd-footer { background:#1a2e22; padding:56px 48px 0; }
        .wd-footer-top { display:grid; grid-template-columns:1.8fr 1fr 1fr 1fr; gap:48px; padding-bottom:40px; border-bottom:1px solid rgba(255,255,255,0.08); }
        .wd-footer-logo { font-size:20px; font-weight:800; color:#fff; letter-spacing:-0.5px; margin-bottom:12px; }
        .wd-footer-logo span { color:#4ade80; }
        .wd-footer-tagline { font-size:13px; color:#86efac; line-height:1.65; opacity:0.85; }
        .wd-footer-col-title { font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9ca3af; margin-bottom:16px; }
        .wd-footer-link { display:block; font-size:13px; color:#d1fae5; text-decoration:none; margin-bottom:10px; opacity:0.8; cursor:pointer; background:none; border:none; padding:0; text-align:left; transition:opacity 0.15s; }
        .wd-footer-link:hover { opacity:1; }
        .wd-footer-select { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff; padding:7px 12px; font-size:13px; outline:none; margin-top:4px; cursor:pointer; }
        .wd-footer-bottom { display:flex; align-items:center; justify-content:space-between; padding:20px 0; font-size:12px; color:#6b7280; }
        @keyframes wd-spin { to { transform: rotate(360deg); } }
        @media (max-width:900px) {
          .wd-nav { padding:0 20px; } .wd-hero { flex-direction:column; padding:48px 20px 56px; align-items:flex-start; }
          .wd-hero-right { width:100%; } .wd-preview-card { width:100%; } .wd-steps-grid { grid-template-columns:1fr; }
          .wd-trust-grid { grid-template-columns:repeat(2,1fr); } .wd-footer-top { grid-template-columns:1fr 1fr; gap:32px; }
          .wd-main { padding:0 16px 60px; } .wd-trust-strip { padding:40px 20px; } .wd-footer { padding:40px 20px 0; }
        }
        @media (max-width:580px) {
          .wd-trust-grid { grid-template-columns:1fr 1fr; } .wd-footer-top { grid-template-columns:1fr; }
          .wd-nav-links { gap:4px; } .wd-nav-link { padding:8px 10px; font-size:13px; }
        }
      `}</style>

      {/* Topbar */}
      <div className="wd-topbar">
        {metrics
          ? `${metrics.workersCount} ${t.taglineWorkersCount || 'women onboarded'} · ${metrics.employersCount} ${t.taglineEmployersCount || 'homes reached'}`
          : (t.tagline || '25 women onboarded · 0 homes reached')}
      </div>

      <div className="wd-page">
        {/* Navbar */}
        <header className="wd-nav">
          <div className="wd-logo">KaamWali.<span>AI</span></div>
          <nav className="wd-nav-links">
            <button className="wd-nav-link" onClick={() => navigate('/worker-profile')}>{t.myProfile || 'My Profile'}</button>
            <button className="wd-nav-link" onClick={() => navigate('/worker-onboard')}>{t.workOpportunities || 'Work Opportunities'}</button>
            <button className="wd-nav-cta"  onClick={() => navigate('/worker-onboard')}>{t.tryDemo || 'Try Demo'}</button>
            <button className="wd-nav-link" onClick={handleLogout} style={{ background: '#fee2e2', color: '#dc2626' }}>{t.logout || 'Logout'}</button>
          </nav>
        </header>

        {/* Hero */}
        <section className="wd-hero">
          <div className="wd-hero-left">
            <div className="wd-hero-eyebrow"><span>🌿</span> For Domestic Workers</div>
            <h1 className="wd-hero-title">{t.heroTitle || 'Voice-first hiring for domestic workers'}</h1>
            <p className="wd-hero-subtitle">{t.heroSubtitle || 'Keep your profile updated, improve your trust score, and discover better work opportunities in nearby areas.'}</p>
            <div className="wd-hero-trust">
              {['Verified Profiles', 'Safe & Secure', '100% Free to Join'].map(label => (
                <div className="wd-hero-trust-item" key={label}><div className="wd-hero-trust-dot" />{label}</div>
              ))}
            </div>
            <div className="wd-hero-actions">
              <button className="wd-btn wd-btn-primary" onClick={() => navigate('/worker-onboard')}>{t.startVoice || 'Start Voice Onboarding'}</button>
              <button className="wd-btn wd-btn-outline" onClick={() => navigate('/worker-profile')}>{t.viewProfile || 'View my Profile'}</button>
            </div>
          </div>

          <div className="wd-hero-right">
            <div className="wd-preview-card">
              <div className="wd-preview-header">
                <div className="wd-preview-title">{t.dashboardTitle || 'KaamWali.AI Dashboard'}</div>
                <span className="wd-preview-badge">{t.workerView || 'Worker view'}</span>
              </div>
              <div className="wd-preview-row">
  <div>
    <div className="wd-preview-row-name">
      Welcome, {workerData?.name || 'Worker'} 👋
    </div>
  </div>
</div>

<div className="wd-preview-row">
  <div>
    <div className="wd-preview-row-name">📍 Location</div>
    <div className="wd-preview-row-meta">
     {JSON.parse(localStorage.getItem('userData') || '{}')?.city || 'Not added'}
    </div>
  </div>
</div>

<div className="wd-preview-row">
  <div>
    <div className="wd-preview-row-name">🧹 Skills</div>
    <div className="wd-preview-row-meta">
      {workerData?.skills?.length
        ? workerData.skills.join(', ')
        : 'Not added'}
    </div>
  </div>
</div>

<div className="wd-preview-row">
  <div>
    <div className="wd-preview-row-name">⭐ Trust Score</div>
    <div className="wd-preview-row-meta">
      {workerData?.trustScore || 0}/100
    </div>
  </div>
</div>
            </div>
          </div>
        </section>

        <main className="wd-main">
          <section className="wd-section">
            <div className="wd-cards-row">

              {/* ── LEFT COLUMN ── */}
              <div className="wd-cards-col">

                {/* ── Verify Identity Card ── */}
                <div className="wd-card">
                  <div className="wd-card-header">
                    <div className="wd-card-icon wd-card-icon-blue">ID</div>
                    <div>
                      <div className="wd-card-title">Verify Your Identity</div>
                      <div className="wd-card-subtitle">Upload a clear photo of your govt. ID. Our system will scan and extract your name instantly.</div>
                    </div>
                  </div>

                  {/* Read-only phone */}
                  <div className="wd-field" style={{ marginBottom: 16 }}>
                    <label className="wd-label">Your phone number</label>
                    <div style={{ position: 'relative' }}>
                      <input value={verifiedPhone} readOnly className="wd-input"
                        style={{ background: '#f3f4f6', color: '#6b7280', paddingRight: 72 }}
                        placeholder="Not set — complete profile first" />
                      <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:11, fontWeight:700, color:'#16a34a', background:'#dcfce7', padding:'2px 8px', borderRadius:999 }}>
                        {verifiedPhone ? 'Saved' : 'Not set'}
                      </span>
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input ref={scanFileRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display:'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) scanIdDocument(f); e.target.value=''; }} />

                  {/* Idle: upload zone */}
                  {!scanResult && !scanLoading && (
                    <>
                      <button type="button" onClick={() => { setScanError(''); scanFileRef.current?.click(); }}
                        style={{ width:'100%', minHeight:110, border:'2px dashed #d1d5db', borderRadius:12, background:'#f9fafb', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.15s', marginBottom:8 }}
                        onMouseOver={e=>{ e.currentTarget.style.borderColor='#16a34a'; e.currentTarget.style.background='#f0fdf4'; }}
                        onMouseOut={e=>{ e.currentTarget.style.borderColor='#d1d5db'; e.currentTarget.style.background='#f9fafb'; }}>
                        <span style={{ fontSize:28 }}>🪪</span>
                        <span style={{ fontSize:14, fontWeight:700, color:'#374151' }}>Upload Government ID</span>
                        <span style={{ fontSize:12, color:'#9ca3af' }}>Aadhaar · PAN · Voter ID · Passport · Driving Licence</span>
                        <span style={{ fontSize:11, color:'#9ca3af' }}>JPG / PNG / WEBP · Max 5MB</span>
                      </button>
                      {scanError && <div className="wd-msg wd-msg-error">{scanError}</div>}
                    </>
                  )}

                  {/* Loading */}
                  {scanLoading && (
                    <div style={{ width:'100%', minHeight:110, borderRadius:12, background:'#f0fdf4', border:'2px dashed #16a34a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #bbf7d0', borderTopColor:'#16a34a', animation:'wd-spin 0.8s linear infinite' }} />
                      <span style={{ fontSize:14, fontWeight:600, color:'#166534' }}>{scanProgress || 'Scanning document...'}</span>
                      <span style={{ fontSize:12, color:'#6b7280' }}>Google Vision is reading your ID</span>
                    </div>
                  )}

                  {/* Result */}
                  {scanResult && !scanLoading && (
                    <div style={{ borderRadius:12, overflow:'hidden', border:`2px solid ${scanResult.success ? '#86efac' : '#fca5a5'}` }}>
                      {/* Header */}
                      <div style={{ background: scanResult.success ? '#16a34a' : '#dc2626', padding:'14px 18px', display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:22 }}>{scanResult.success ? '✅' : '❌'}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:15, fontWeight:800, color:'#fff' }}>
                            {scanResult.success ? 'Identity Verified' : 'Verification Failed'}
                          </div>
                          <div style={{ fontSize:12, color:'rgba(255,255,255,0.85)' }}>
                            {scanResult.success ? `Valid ${scanResult.detectedDocType} detected` : scanResult.message}
                          </div>
                        </div>
                      </div>

                      {/* Extracted details */}
                      {scanResult.success && (
                        <div style={{ background:'#f0fdf4', padding:'16px 18px' }}>
                          {[
                            { label:'Full Name',      value: scanResult.extractedName,   big: true },
                            { label:'Document Type',  value: scanResult.detectedDocType, badge: true },
                            { label:'ID Number',      value: scanResult.maskedIdNumber,  mono: true },
                            { label:'Date of Birth',  value: scanResult.dob },
                            { label:'Gender',         value: scanResult.gender },
                          ].filter(r => r.value).map(row => (
                            <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #dcfce7' }}>
                              <span style={{ fontSize:11, color:'#6b7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{row.label}</span>
                              {row.badge
                                ? <span style={{ fontSize:12, fontWeight:700, color:'#166534', background:'#dcfce7', padding:'3px 10px', borderRadius:999 }}>{row.value}</span>
                                : <span style={{ fontSize: row.big ? 16 : 13, fontWeight: row.big ? 800 : 600, color:'#111827', fontFamily: row.mono ? 'monospace' : 'inherit' }}>{row.value}</span>
                              }
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Re-scan */}
                      <div style={{ background:'#fff', padding:'10px 18px', borderTop:'1px solid #f3f4f6' }}>
                        <button type="button" className="wd-upload-btn" style={{ height:36, fontSize:13 }}
                          onClick={() => { setScanResult(null); setScanError(''); }}>
                          🔄 Upload a different ID
                        </button>
                      </div>
                    </div>
                  )}
                </div>{/* end verify card */}

                {/* ── Report Safety Issue Card ── */}
                <div className="wd-card">
                  <div className="wd-card-header">
                    <div className="wd-card-icon" style={{ background:'#fee2e2', color:'#dc2626', fontSize:20 }}>⚠️</div>
                    <div>
                      <div className="wd-card-title">Report Safety Issue</div>
                      <div className="wd-card-subtitle">Report harassment, abuse, fraud, or safety concerns</div>
                    </div>
                  </div>

                  <div style={{ background:'#fff1f2', border:'1px solid #fecaca', borderRadius:12, padding:'14px 16px', marginBottom:18 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#dc2626', marginBottom:4 }}>🚨 Need immediate help?</div>
                    <div style={{ fontSize:13, color:'#b91c1c', marginBottom:12, lineHeight:1.5 }}>Tap once to alert your emergency contact.</div>
                    <button type="button" disabled={safetyLoading} onClick={handleUnsafe}
                      style={{ width:'100%', height:46, background: safetyLoading ? '#f87171' : '#dc2626', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor: safetyLoading ? 'not-allowed' : 'pointer' }}
                      onMouseOver={e=>{ if(!safetyLoading) e.currentTarget.style.background='#b91c1c'; }}
                      onMouseOut={e=>{ if(!safetyLoading) e.currentTarget.style.background='#dc2626'; }}>
                      {safetyLoading ? '⏳ Sending...' : '🆘 I feel unsafe'}
                    </button>
                  </div>

                  <div className="wd-form-stack">
                    <div className="wd-field">
                      <label className="wd-label">Employer / Person phone number</label>
                      <input name="employerPhone" value={safetyForm.employerPhone} onChange={handleSafetyChange} placeholder="Phone of person involved" className="wd-input" />
                    </div>
                    <div className="wd-field">
                      <label className="wd-label">Issue type</label>
                      <select name="issueType" value={safetyForm.issueType} onChange={handleSafetyChange} className="wd-select">
                        <option>Harassment/Abuse</option><option>Fraud/Cheating</option>
                        <option>Safety Concern</option><option>Wage Theft</option><option>Other</option>
                      </select>
                    </div>
                    <div className="wd-field">
                      <label className="wd-label">Detailed description</label>
                      <textarea name="description" value={safetyForm.description} onChange={handleSafetyChange}
                        placeholder="Please describe what happened..." className="wd-input"
                        style={{ height:100, padding:'12px 14px', resize:'vertical', lineHeight:1.5 }} />
                    </div>
                    {safetyMessage && <div className={`wd-msg ${safetyMessage.includes('✅') ? 'wd-msg-success' : 'wd-msg-error'}`}>{safetyMessage}</div>}
                    <button type="button" disabled={safetyLoading} onClick={handleSafetyReport}
                      style={{ width:'100%', height:46, background: safetyLoading ? '#f87171' : '#dc2626', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor: safetyLoading ? 'not-allowed' : 'pointer', opacity: safetyLoading ? 0.7 : 1 }}
                      onMouseOver={e=>{ if(!safetyLoading) e.currentTarget.style.background='#b91c1c'; }}
                      onMouseOut={e=>{ if(!safetyLoading) e.currentTarget.style.background='#dc2626'; }}>
                      {safetyLoading ? '⏳ Submitting...' : 'Report Incident'}
                    </button>
                  </div>
                </div>{/* end safety card */}

              </div>{/* end left col */}

              {/* ── RIGHT COLUMN ── */}
              <div className="wd-cards-col">
                <div className="wd-card">
                  <div className="wd-card-header">
                    <div className="wd-card-icon wd-card-icon-green">📅</div>
                    <div>
                      <div className="wd-card-title">Your Availability</div>
                      <div className="wd-card-subtitle">Update whether you are currently hired or free for new work.</div>
                    </div>
                  </div>

                  <span className="wd-badge" style={{ background:statusBg, color:statusColor }}>
                    Status: {statusLabel}
                  </span>

                  <div className="wd-form-stack">
                    <div className="wd-field">
                      <label className="wd-label">Your phone number (same as emergency contact)</label>
                      <input name="workerPhone" value={form.workerPhone} onChange={handleChange} placeholder="Your phone" className="wd-input" />
                    </div>
                    <hr className="wd-divider" />
                    <div><div className="wd-sub-label">Mark myself as currently hired</div><div className="wd-sub-desc">Fill this when you start working at a new household.</div></div>
                    <input name="employerName"  value={form.employerName}  onChange={handleChange} placeholder="Employer name"              className="wd-input" />
                    <input name="employerPhone" value={form.employerPhone} onChange={handleChange} placeholder="Employer phone (optional)"  className="wd-input" />
                    <input name="householdName" value={form.householdName} onChange={handleChange} placeholder="Household name (optional)"  className="wd-input" />
                    <input type="date" name="fromDate" value={form.fromDate} onChange={handleChange} className="wd-input" />
                    <button type="button" onClick={callSelfHire} disabled={loading} className="wd-btn wd-btn-primary wd-btn-full">
                      {loading ? 'Updating...' : 'Mark myself as hired at this household'}
                    </button>
                    <hr className="wd-divider" />
                    <div><div className="wd-sub-label">Mark job done / I am free now</div><div className="wd-sub-desc">Use this when you stop working at your current household.</div></div>
                    <button type="button" onClick={callSelfRelease} disabled={loading} className="wd-btn wd-btn-outline-dark">
                      {loading ? 'Updating...' : 'Mark myself as available for new work'}
                    </button>
                    {message && <div className="wd-msg-neutral">{message}</div>}
                  </div>
                </div>

                <div className="wd-card">
                  <div className="wd-card-header">
                    <div className="wd-card-icon wd-card-icon-blue">📩</div>
                    <div>
                      <div className="wd-card-title">Contact Requests</div>
                      <div className="wd-card-subtitle">Review incoming employer requests to share your contact details.</div>
                    </div>
                  </div>

                  {requestsMessage && <div className={`wd-msg ${requestsMessage.includes('✅') ? 'wd-msg-success' : requestsMessage.includes('❌') ? 'wd-msg-error' : 'wd-msg-neutral'}`} style={{ marginBottom: 14 }}>{requestsMessage}</div>}

                  {requestsLoading ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#555' }}>Loading requests…</div>
                  ) : contactRequests.length === 0 ? (
                    <div style={{ padding: '18px 14px', borderRadius: 12, background: '#f8fafc', color: '#334155' }}>
                      No contact requests yet. Employers will send a request when they want to contact you directly.
                    </div>
                  ) : (
                    <div className="wd-request-list">
                      {contactRequests.map(req => (
                        <div className="wd-request-item" key={req._id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontWeight: 700, marginBottom: 4 }}>{req.employerName || 'Employer'}</div>
                              <div style={{ fontSize: 13, color: '#475569' }}>Phone: {req.employerPhone}</div>
                              <div style={{ fontSize: 13, color: '#475569' }}>City: {req.employerCity || 'N/A'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div className={`wd-badge`} style={{ background: req.status === 'approved' ? '#dcfce7' : req.status === 'rejected' ? '#fee2e2' : '#f8fafc', color: req.status === 'approved' ? '#166534' : req.status === 'rejected' ? '#b91c1c' : '#475569' }}>
                                {req.status.toUpperCase()}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{formatRequestDate(req.createdAt)}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, color: '#334155', marginTop: 10 }}>
                            Requested contact for: {req.workerName || 'your profile'}
                          </div>
                          {req.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                              <button type="button" className="wd-btn wd-btn-success" onClick={() => respondToContactRequest(req._id, 'approved')} disabled={requestsLoading}>
                                Approve
                              </button>
                              <button type="button" className="wd-btn wd-btn-outline-dark" onClick={() => respondToContactRequest(req._id, 'rejected')} disabled={requestsLoading}>
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>{/* end right col */}

            </div>
          </section>

          {/* How it works */}
          <section id="how-it-works" className="wd-section">
            <h2 className="wd-how-title">{t.howItWorks || 'How KaamWali.AI works for you'}</h2>
            <div className="wd-steps-grid">
              {[
                { num:'1', title:t.step1Title||"Speak, don't type",       text:t.step1Text||'You answer simple questions in your native language using your voice.' },
                { num:'2', title:t.step2Title||'Profile and trust score', text:t.step2Text||'KaamWali.AI turns your answers into a clear profile with a growing trust score.' },
                { num:'3', title:t.step3Title||'Homes find you',          text:t.step3Text||'Nearby homes discover you by area and skills and contact you directly.' },
              ].map(step => (
                <div className="wd-step-card" key={step.num}>
                  <div className="wd-step-num">{step.num}</div>
                  <div className="wd-step-icon">{step.num}</div>
                  <div className="wd-step-title">{step.title}</div>
                  <p className="wd-step-text">{step.text}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Trust strip */}
        <div className="wd-trust-strip">
          <div className="wd-trust-grid">
            {[
              { icon:'✅', label:'Verified Profiles',   desc:'Every worker is manually verified' },
              { icon:'🔒', label:'Background Checked',  desc:'Safe for your home & family' },
              { icon:'⭐', label:'Employer Ratings',    desc:'Real reviews from real families' },
              { icon:'🎙️', label:'Voice Onboarded',     desc:'No literacy barrier for workers' },
            ].map(item => (
              <div key={item.label}>
                <div className="wd-trust-item-icon">{item.icon}</div>
                <div className="wd-trust-item-label">{item.label}</div>
                <div className="wd-trust-item-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="wd-footer">
          <div className="wd-footer-top">
            <div>
              <div className="wd-footer-logo">KAAMWALI.<span>AI</span></div>
              <p className="wd-footer-tagline">Connecting trusted domestic workers with families across India — safely, simply, and with dignity.</p>
            </div>
            <div>
              <div className="wd-footer-col-title">Company</div>
              {['About Us','How it Works','For Employers','For Workers'].map(l => <span key={l} className="wd-footer-link">{l}</span>)}
            </div>
            <div>
              <div className="wd-footer-col-title">Support</div>
              {['Contact','Privacy Policy','Terms of Use','Feedback'].map(l => <span key={l} className="wd-footer-link">{l}</span>)}
            </div>
            <div>
              <div className="wd-footer-col-title">Language</div>
              <select className="wd-footer-select">
                <option>English</option><option>हिन्दी</option><option>தமிழ்</option><option>తెలుగు</option>
              </select>
            </div>
          </div>
          <div className="wd-footer-bottom">
            <span>© 2026 KaamWali.AI. Built with ❤️ to empower domestic workers across India.</span>
            <span>Made in India 🇮🇳</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default WorkerDashboard;
