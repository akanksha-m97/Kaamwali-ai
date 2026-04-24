// frontend/src/components/VoiceOnboarding.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { API_BASE, completeWorkerProfile, getMetrics } from '../api';
import { useLanguage } from '../contexts/LanguageContext';

// ── Save your illustration as: src/assets/images/worker-illustration.png ──
import workerIllustration from '../assets/images/worker-illustration.png';

const NUMERIC_FIELDS = ['age', 'experienceYears', 'expectedSalary'];
const NON_NUMERIC_FIELDS = [
  'name','skills','availability','workType','daysOff',
  'medicalConditions','willingLateOrTravel','previousEmployerRef',
  'comfortableWithFamilies','comfortableWithPets',
];
const isNumericAnswer = (v) => /^[0-9]+$/.test(v.trim());
const hasDigits       = (v) => /\d/.test(v);
const isValidPhone10  = (v) => v.replace(/\D/g,'').length === 10;

const G = {
  dark:      '#1a3c34',
  main:      '#2d7a4f',
  light:     '#e8f5ee',
  lighter:   '#f0f7f3',
  pageBg:    '#f5f5f0',
  white:     '#ffffff',
  border:    '#d0e8d8',
  text:      '#0f2419',
  textMid:   '#3d5a47',
  textMuted: '#7a9488',
  danger:    '#b91c1c',
};

const KF = `
  @keyframes kw-spin   { to { transform: rotate(360deg); } }
  @keyframes kw-ripple { 0%{transform:scale(.85);opacity:.5} 100%{transform:scale(1.65);opacity:0} }
  @keyframes kw-bar    { 0%,100%{transform:scaleY(.25)} 50%{transform:scaleY(1)} }
  @keyframes kw-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .kw-fade   { animation: kw-fadein .3s ease both; }
  .kw-spin   { animation: kw-spin .9s linear infinite; }
  .kw-bar    { transform-origin:center; animation: kw-bar .9s ease-in-out infinite; }
  .kw-ripple { position:absolute;border-radius:50%;border:2px solid ${G.main};animation:kw-ripple 1.8s ease-out infinite; }
  .kw-primary:hover { background:#152f28 !important; }
  .kw-back:hover    { background:${G.light} !important; }
  textarea:focus    { border-color:${G.main} !important; box-shadow:0 0 0 3px rgba(45,122,79,.1) !important; outline:none; }
  @media(max-width:860px){
    .kw-grid { grid-template-columns:1fr !important; }
    .kw-left { min-height:320px !important; }
  }
`;

/* ── Sound bars ── */
const SoundBars = ({ active }) => {
  const heights = [4,8,14,20,28,34,28,20,14,8,4];
  return (
    <div style={{display:'flex',alignItems:'center',gap:3,height:36}}>
      {heights.map((h,i) => (
        <div key={i} className={active?'kw-bar':''} style={{
          width:4, borderRadius:4,
          background: active ? G.main : '#c4ddd0',
          height: h,
          animationDelay:`${i*0.08}s`,
          transition:'background .3s',
        }}/>
      ))}
    </div>
  );
};

/* ── Mic with ripple ── */
const MicSection = ({ listening, onToggle, disabled, hi }) => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
    <div style={{display:'flex',alignItems:'center',gap:20}}>
      <SoundBars active={listening}/>
      <div style={{position:'relative',width:130,height:130,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        {listening && <>
          <div className="kw-ripple" style={{width:130,height:130,animationDelay:'0s'}}/>
          <div className="kw-ripple" style={{width:130,height:130,animationDelay:'0.65s'}}/>
          <div className="kw-ripple" style={{width:130,height:130,animationDelay:'1.3s'}}/>
        </>}
        <div style={{position:'relative',zIndex:1,width:130,height:130,borderRadius:'50%',background:'#dceede',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <button type="button" onClick={onToggle} disabled={disabled} style={{
            width:96,height:96,borderRadius:'50%',background:G.dark,border:'none',
            cursor:disabled?'not-allowed':'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:listening?`0 0 0 5px ${G.main},0 8px 28px rgba(26,60,52,.45)`:'0 6px 22px rgba(26,60,52,.4)',
            transition:'box-shadow .3s',
          }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="11" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
          </button>
        </div>
      </div>
      <SoundBars active={listening}/>
    </div>

    <p style={{fontSize:13,color:G.textMuted,margin:0,textAlign:'center'}}>
      {listening?(hi?'सुन रहे हैं… रोकने के लिए दोबारा टैप करें':'Listening… tap again to stop'):(hi?'बोलने के लिए माइक टैप करें':'Tap the mic to start speaking')}
    </p>

    <div style={{display:'flex',alignItems:'center',gap:8,background:G.light,border:`1px solid ${G.border}`,borderRadius:24,padding:'9px 20px'}}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.main} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
      <span style={{fontSize:13,color:G.textMid,fontWeight:500}}>
        {hi?'हम आपकी प्राइवेसी को महत्व देते हैं। आपका डेटा सुरक्षित है।':'We value your privacy. Your data is safe with us.'}
      </span>
    </div>
  </div>
);

/* ── Trust badges ── */
const TrustBadges = ({ hi }) => (
  <div style={{display:'flex',background:'rgba(255,255,255,0.85)',backdropFilter:'blur(8px)',borderTop:`1.5px solid ${G.border}`,padding:'16px 24px'}}>
    {[
      { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, l1:hi?'100% सेफ':'100% Safe', l2:hi?'& वेरिफाइड':'& Verified' },
      { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, l1:hi?'ट्रेनिंग &':'Training &', l2:hi?'सपोर्ट':'Support' },
      { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, l1:hi?'बेहतर नौकरी,':'Better Jobs,', l2:hi?'बेहतर जीवन':'Better Lives' },
    ].map((t,i)=>(
      <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'0 4px',borderRight:i<2?`1px solid ${G.border}`:'none'}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:G.light,border:`1.5px solid ${G.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          {t.icon}
        </div>
        <div style={{textAlign:'center',lineHeight:1.3}}>
          <span style={{fontSize:11,fontWeight:700,color:G.textMid,display:'block'}}>{t.l1}</span>
          <span style={{fontSize:11,fontWeight:700,color:G.textMid,display:'block'}}>{t.l2}</span>
        </div>
      </div>
    ))}
  </div>
);

/* ════ MAIN COMPONENT ════ */
const VoiceOnboarding = ({ onProfileReady }) => {
  const navigate = useNavigate();
  const { language, messages } = useLanguage();
  const { listening, text, setText, startListening, stopListening } = useSpeechToText(language);
  const v  = messages?.voiceOnboarding || {};
  const q  = messages?.questions       || {};
  const t  = messages?.workerDashboard || {};
  const hi = language === 'hi';
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    getMetrics().then(setMetrics).catch(() => {});
  }, []);

  const [step,                setStep]                = useState('initial');
  const [sessionId,           setSessionId]           = useState(null);
  const [draft,               setDraft]               = useState(null);
  const [currentField,        setCurrentField]        = useState(null);
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState('');
  const [initialMissingCount, setInitialMissingCount] = useState(0);
  const [fieldHistory,        setFieldHistory]        = useState([]);

  const handleProfileComplete = async (sessId, latestDraft) => {
    try {
      setStep('finalizing');
      const worker = await completeWorkerProfile(sessId||sessionId, latestDraft||draft);
      onProfileReady(worker);
    } catch(err) {
      console.error(err);
      const msg = hi?'प्रोफ़ाइल बनाने में समस्या आई।':'Error creating profile.';
      setError(msg); alert(msg); setStep('asking');
    }
  };

  const startInitialDraft = async () => {
    if (!text.trim()) { alert(hi?'कृपया पहले कुछ बोलें।':'Please speak some details first.'); return; }
    try {
      setLoading(true); setError('');
      const res  = await fetch(`${API_BASE}/api/profile/start`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
      const data = await res.json();
      setSessionId(data.sessionId); setDraft(data.draft);
      setInitialMissingCount((data.missingFields||[]).length);
      if (data.missingFields?.length>0) {
        setCurrentField(data.missingFields[0]); setFieldHistory([data.missingFields[0]]);
        setStep('asking'); setText('');
      } else { await handleProfileComplete(data.sessionId,data.draft); }
    } catch(e) { console.error(e); setError(hi?'सर्वर में दिक्कत है।':'Server error – please try again.'); }
    finally { setLoading(false); }
  };

  const askNextField = async () => {
    const answer = text.trim();
    if (!answer)                   { alert(hi?'कृपया जवाब दें।':'Please answer using your voice first.'); return; }
    if (!sessionId||!currentField) { alert(hi?'सेशन में दिक्कत है।':'Session error, please restart.'); return; }
    if (NUMERIC_FIELDS.includes(currentField)&&!isNumericAnswer(answer))    { alert(hi?'सिर्फ नंबर में जवाब दें।':'Please use numbers only.'); return; }
    if (NON_NUMERIC_FIELDS.includes(currentField)&&hasDigits(answer))       { alert(hi?'सिर्फ शब्दों में जवाब दें।':'Please use words only.'); return; }
    if (currentField==='emergencyContact'&&!isValidPhone10(answer))         { alert(hi?'10 अंकों का नंबर बताएं।':'Please say a 10-digit phone number.'); return; }
    try {
      setLoading(true); setError('');
      const res  = await fetch(`${API_BASE}/api/profile/answer`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,field:currentField,answerText:answer})});
      const data = await res.json();
      setDraft(data.draft);
      if (initialMissingCount===0) setInitialMissingCount((data.missingFields||[]).length);
      setText('');
      if (data.missingFields?.length>0) {
        const next=data.missingFields[0]; setCurrentField(next); setFieldHistory(p=>[...p,next]);
      } else { await handleProfileComplete(data.sessionId,data.draft); }
    } catch(e) { console.error(e); setError(hi?'सर्वर में दिक्कत है।':'Server error – please try again.'); }
    finally { setLoading(false); }
  };

  const goToPreviousField = () => {
    setFieldHistory(prev=>{
      if (prev.length<=1) return prev;
      const next=prev.slice(0,-1); const pf=next[next.length-1]; setCurrentField(pf);
      const val=draft?.[pf]; setText(val==null?'':Array.isArray(val)?val.join(', '):String(val));
      return next;
    });
  };

  const total = initialMissingCount||1;
  const done  = fieldHistory.length;
  const pct   = Math.min(Math.round((done/total)*100),100);
  const totalSteps = initialMissingCount>0 ? initialMissingCount+1 : 4;

  /* ── LEFT PANEL: step badge on top, illustration fills rest ── */
  const LeftPanel = ({ stepNum }) => (
    <div className="kw-left" style={{
      background: G.lighter,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Step badge — only text content on left */}
      <div style={{padding:'18px 20px 0'}}>
        <div style={{
          display:'inline-flex',alignItems:'center',
          background:G.white,border:`1.5px solid ${G.border}`,
          borderRadius:20,padding:'6px 16px',
          fontSize:13,fontWeight:600,color:G.main,
        }}>
          {hi?`स्टेप ${stepNum} / ${totalSteps}`:`Step ${stepNum} of ${totalSteps}`}
        </div>
      </div>

      {/* Illustration fills ALL remaining space */}
      <div style={{
        flex:1,
        display:'flex',
        alignItems:'flex-end',
        justifyContent:'center',
        minHeight:0,
      }}>
        <img
          src={workerIllustration}
          alt="Worker illustration"
          style={{
            width:'100%',
            height:'100%',
            objectFit:'cover',
            objectPosition:'center bottom',
            display:'block',
          }}
        />
      </div>

    </div>
  );

  /* ── Shared textarea ── */
  const SpokenTextArea = ({ label }) => (
    <div style={{marginTop:14}}>
      <p style={{fontSize:12,fontWeight:700,color:G.text,margin:'0 0 6px'}}>
        {label||(hi?'आपका बोला हुआ टेक्स्ट':'Your spoken text')}
      </p>
      <textarea
        value={text}
        onChange={e=>setText(e.target.value)}
        maxLength={1000}
        placeholder={hi?'आपका बोला हुआ टेक्स्ट यहाँ दिखेगा।':'Your spoken text will appear here so you can review it before continuing.'}
        style={{
          width:'100%',minHeight:100,fontSize:14,lineHeight:1.5,
          padding:'14px 16px',border:`1.5px solid ${G.border}`,
          borderRadius:12,color:G.text,background:G.lighter,
          fontFamily:'inherit',resize:'vertical',boxSizing:'border-box',
          transition:'border-color .2s,box-shadow .2s',
        }}
      />
      <div style={{textAlign:'right',fontSize:12,color:G.textMuted,marginTop:4}}>
        {text.length} / 1000
      </div>
      {error&&<p style={{color:G.danger,fontSize:13,margin:'4px 0 0'}}>{error}</p>}
    </div>
  );

  /* ── RIGHT PANEL wrapper ── */
  const RightPanel = ({ children, onAction, actionLabel, actionLoading, showBack, onBack, backDisabled }) => (
    <div style={{background:G.white,display:'flex',flexDirection:'column',padding:'20px 40px 20px'}}>
      <div style={{flex:1}}>{children}</div>
      <div style={{marginTop:16,display:'flex',gap:12}}>
        {showBack && (
          <button type="button" className="kw-back" onClick={onBack}
            disabled={actionLoading||backDisabled}
            style={{
              background:G.lighter,color:G.textMid,
              border:`1.5px solid ${G.border}`,borderRadius:14,
              padding:'14px 24px',fontSize:15,fontWeight:600,
              cursor:(actionLoading||backDisabled)?'not-allowed':'pointer',
              opacity:(actionLoading||backDisabled)?.45:1,flexShrink:0,
            }}>
            {hi?'← पीछे':'← Back'}
          </button>
        )}
        <button type="button" className="kw-primary" onClick={onAction}
          disabled={actionLoading}
          style={{
            flex:1,background:G.dark,color:G.white,border:'none',
            borderRadius:14,padding:'14px 16px',fontSize:16,fontWeight:700,
            cursor:actionLoading?'not-allowed':'pointer',
            opacity:actionLoading?.7:1,
            display:'flex',alignItems:'center',justifyContent:'center',gap:12,
            transition:'background .15s',letterSpacing:'0.01em',
          }}>
          {actionLoading
            ?(hi?'प्रोसेस हो रहा है…':'Processing…')
            :<>{actionLabel}<span style={{fontSize:22,lineHeight:1}}>→</span></>}
        </button>
      </div>
    </div>
  );

  /* ══ initial ══ */
  const renderInitial = () => (
    <>
      <LeftPanel stepNum={1}/>
      <RightPanel onAction={startInitialDraft} actionLabel={hi?'आगे बढ़ें':'Continue'} actionLoading={loading} showBack={false}>
        <div className="kw-fade">
          <h2 style={{fontSize:26,fontWeight:800,color:G.text,textAlign:'center',margin:'0 0 6px'}}>
            {hi?'बोलें और बताएं':'Tap and speak'}
          </h2>
          <p style={{fontSize:14,color:G.textMuted,textAlign:'center',margin:'0 0 24px'}}>
            {hi?'आपकी आवाज़ हमें आपको बेहतर समझने में मदद करती है।':'Your voice helps us understand you better.'}
          </p>
          <MicSection listening={listening} disabled={loading} onToggle={listening?stopListening:startListening} hi={hi}/>
          <SpokenTextArea/>
        </div>
      </RightPanel>
    </>
  );

  /* ══ asking ══ */
  const renderAsking = () => (
    <>
      <LeftPanel stepNum={done+1}/>
      <RightPanel onAction={askNextField} actionLabel={hi?'आगे':'Continue'} actionLoading={loading} showBack={true} onBack={goToPreviousField} backDisabled={fieldHistory.length<=1}>
        <div className="kw-fade">
          <div style={{marginBottom:18}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:G.textMuted,marginBottom:6}}>
              <span>{hi?`स्टेप ${done} / ${total}`:`Step ${done} of ${total}`}</span>
              <span style={{color:G.main,fontWeight:600}}>{pct}%</span>
            </div>
            <div style={{background:G.light,borderRadius:99,height:8}}>
              <div style={{background:G.main,borderRadius:99,height:8,width:`${pct}%`,transition:'width .4s ease'}}/>
            </div>
          </div>
          <h2 style={{fontSize:24,fontWeight:800,color:G.text,textAlign:'center',margin:'0 0 6px'}}>
            {hi?'जवाब बोलकर दें':'Tap and speak'}
          </h2>
          <p style={{fontSize:13,color:G.textMuted,textAlign:'center',margin:'0 0 16px'}}>
            {hi?'आपकी आवाज़ हमें आपको बेहतर समझने में मदद करती है।':'Your voice helps us understand you better.'}
          </p>
          <MicSection listening={listening} disabled={loading} onToggle={listening?stopListening:startListening} hi={hi}/>
            <div style={{background:G.light,border:`1px solid ${G.border}`,borderRadius:12,padding:'10px 14px',margin:'14px 0 0'}}>
            <p style={{fontSize:11,fontWeight:700,color:G.main,textTransform:'uppercase',letterSpacing:'0.07em',margin:'0 0 6px'}}>{hi?'सवाल':'Question'}</p>
            <p style={{fontSize:15,fontWeight:600,color:G.text,margin:0,lineHeight:1.45}}>{q[currentField]||''}</p>
          </div>
          <SpokenTextArea label={hi?'आपका जवाब':'Your spoken text'}/>
        </div>
      </RightPanel>
    </>
  );

  /* ══ finalizing ══ */
  const renderFinalizing = () => (
    <>
      <LeftPanel stepNum={totalSteps}/>
      <div style={{background:G.white,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 40px'}}>
        <div className="kw-fade" style={{textAlign:'center'}}>
          <div style={{width:48,height:48,borderRadius:'50%',border:`4px solid ${G.light}`,borderTopColor:G.main,margin:'0 auto 16px'}} className="kw-spin"/>
          <h3 style={{fontSize:20,fontWeight:800,color:G.text,marginBottom:8}}>
            {v.finalizingTitle||(hi?'आपकी प्रोफ़ाइल बन रही है…':'Creating your profile…')}
          </h3>
          <p style={{fontSize:14,color:G.textMuted,lineHeight:1.7,maxWidth:300,margin:'0 auto'}}>
            {v.finalizingSub||(hi?'हम आपके जवाबों को एक साफ़ प्रोफ़ाइल में डाल रहे हैं।':"We're turning your answers into a clear profile employers will love.")}
          </p>
          {error&&<p style={{color:G.danger,fontSize:13,marginTop:16}}>{error}</p>}
        </div>
      </div>
    </>
  );

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:G.pageBg,fontFamily:"system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",color:G.text}}>
      <style>{KF}</style>

      {/* Topbar */}
      <div style={{background:'#1a2e22',color:'#d1fae5',fontSize:12,textAlign:'center',padding:'6px 16px'}}>
        {metrics
          ? `${metrics.workersCount} ${t.taglineWorkersCount || 'women onboarded'} · ${metrics.employersCount} ${t.taglineEmployersCount || 'homes reached'}`
          : (t.tagline || '25 women onboarded · 0 homes reached')}
      </div>

      {/* Nav */}
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 48px',height:64,background:'#fff',borderBottom:'1px solid #e5e7eb',position:'sticky',top:0,zIndex:10,boxShadow:'0 1px 6px rgba(0,0,0,0.04)'}}>
        <div style={{fontSize:20,fontWeight:800,color:'#111827',letterSpacing:'-0.5px',cursor:'pointer'}} onClick={()=>navigate('/worker-dashboard')}>
          KaamWali.<span style={{color:'#16a34a'}}>AI</span>
        </div>
      </header>

      {/* Main two-col card */}
      <div style={{flex:1,padding:'12px 20px 16px'}}>
        <div className="kw-grid" style={{
          display:'grid',
          gridTemplateColumns:'1.4fr 1.1fr',
          minHeight:'calc(100vh - 134px)',
          background:G.white,
          borderRadius:20,
          border:`1px solid ${G.border}`,
          overflow:'hidden',
          boxShadow:'0 2px 24px rgba(26,60,52,.08)',
        }}>
          {step==='initial'    && renderInitial()}
          {step==='asking'     && renderAsking()}
          {step==='finalizing' && renderFinalizing()}
        </div>
      </div>
    </div>
  );
};

export default VoiceOnboarding;
