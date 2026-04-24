// src/components/EmployerDashboard.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMetrics } from '../api';
import { API_BASE } from '../api';
import { useLanguage } from '../contexts/LanguageContext';

/* ─── Design tokens — teal/green palette matching screenshot ── */
const C = {
  navy:       '#162B22',   // darkest — ticker + footer bg
  teal:       '#2E7D5E',   // primary CTA buttons
  tealHover:  '#235F48',   // CTA hover
  tealSoft:   '#E6F4EE',   // badge / pill tint
  tealMid:    '#A7D4BC',   // border / subtext on dark bg
  heroBg:     '#E4EEE9',   // hero section pale green-grey
  heroBg2:    '#CEDFD6',   // gradient end
  white:      '#FFFFFF',
  gray50:     '#F9FAFB',
  gray100:    '#F3F4F6',
  gray200:    '#E5E7EB',
  gray400:    '#9CA3AF',
  gray500:    '#6B7280',
  gray700:    '#374151',
  gray900:    '#111827',
  amber:      '#F59E0B',
  amberSoft:  '#FEF3C7',
  amberDark:  '#92400E',
};

/* ─── Inline SVG illustration — housekeeper + family scene ──── */
const HeroIllustration = () => (
  <svg viewBox="0 0 560 400" xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: '100%' }} aria-hidden="true">

    {/* Room bg */}
    <rect width="560" height="400" fill="#D5E8DC" rx="20" />

    {/* Floor */}
    <rect x="0" y="290" width="560" height="110" fill="#C2D9CB" />
    <line x1="0" y1="290" x2="560" y2="290" stroke="#B0CCBA" strokeWidth="1.5" />

    {/* Window */}
    <rect x="150" y="28" width="150" height="170" rx="10" fill="#BFD9F0" opacity="0.55" />
    <rect x="220" y="28" width="4"   height="170" fill="#A0C4E0" opacity="0.5" />
    <rect x="150" y="108" width="150" height="4"  fill="#A0C4E0" opacity="0.5" />

    {/* Curtains */}
    <path d="M150 28 Q128 120 140 210" stroke="#AECFBA" strokeWidth="20" fill="none" strokeLinecap="round" />
    <path d="M300 28 Q322 120 310 210" stroke="#AECFBA" strokeWidth="20" fill="none" strokeLinecap="round" />

    {/* Sofa */}
    <rect x="30"  y="210" width="230" height="85"  rx="18" fill="#E8D5A3" />
    <rect x="30"  y="200" width="230" height="28"  rx="10" fill="#D4BC82" />
    <rect x="30"  y="210" width="28"  height="85"  rx="10" fill="#D4BC82" />
    <rect x="232" y="210" width="28"  height="85"  rx="10" fill="#D4BC82" />

    {/* Plant */}
    <rect x="330" y="256" width="26" height="38" rx="4" fill="#9C7248" />
    <ellipse cx="343" cy="256" rx="16" ry="7" fill="#7A5635" />
    <ellipse cx="327" cy="228" rx="22" ry="30" fill="#4CAF78" opacity="0.9" transform="rotate(-12 327 228)" />
    <ellipse cx="357" cy="226" rx="20" ry="28" fill="#3D9E68" opacity="0.85" transform="rotate(14 357 226)" />
    <ellipse cx="343" cy="218" rx="16" ry="22" fill="#56C487" />

    {/* Seated mother */}
    <ellipse cx="105" cy="240" rx="22" ry="28" fill="#F4A574" />
    <circle  cx="105" cy="206" r="18"           fill="#F4A574" />
    <ellipse cx="105" cy="196" rx="18" ry="12"  fill="#2C160A" />
    {/* Laptop */}
    <rect x="86" y="248" width="46" height="26" rx="4" fill="#CBD5E1" />
    <rect x="88" y="250" width="42" height="20" rx="2" fill="#93C5FD" />

    {/* Child */}
    <ellipse cx="152" cy="246" rx="15" ry="20" fill="#F9C784" />
    <circle  cx="152" cy="224" r="14"           fill="#F9C784" />
    <ellipse cx="152" cy="213" rx="14" ry="9"   fill="#2C160A" />

    {/* ── Housekeeper (foreground, right) ── */}
    {/* Legs / trousers */}
    <rect x="364" y="320" width="20" height="70" rx="8" fill="#4A7C6A" />
    <rect x="390" y="320" width="20" height="70" rx="8" fill="#4A7C6A" />
    {/* Sandals */}
    <ellipse cx="374" cy="390" rx="14" ry="6" fill="#3D3D3D" />
    <ellipse cx="400" cy="390" rx="14" ry="6" fill="#3D3D3D" />
    {/* Body / uniform */}
    <rect x="352" y="240" width="72" height="90" rx="16" fill="#4A90D9" />
    {/* Apron */}
    <rect x="362" y="258" width="50" height="64" rx="8" fill="#5BA8EC" />
    {/* Dupatta/scarf strip */}
    <path d="M352 255 Q345 295 348 335" stroke="#6EC6FF" strokeWidth="12" fill="none" strokeLinecap="round" />
    {/* Head scarf */}
    <ellipse cx="388" cy="202" rx="28" ry="20" fill="#1E5FA8" />
    {/* Face */}
    <circle cx="388" cy="208" r="24" fill="#C8854A" />
    {/* Hair underneath */}
    <ellipse cx="388" cy="192" rx="24" ry="14" fill="#180800" />
    {/* Eyes */}
    <ellipse cx="381" cy="205" rx="3.5" ry="4.5" fill="#180800" />
    <ellipse cx="395" cy="205" rx="3.5" ry="4.5" fill="#180800" />
    {/* Whites */}
    <ellipse cx="381" cy="204" rx="1.5" ry="2" fill="white" opacity="0.5" />
    <ellipse cx="395" cy="204" rx="1.5" ry="2" fill="white" opacity="0.5" />
    {/* Smile */}
    <path d="M381 217 Q388 224 395 217" stroke="#7A4020" strokeWidth="1.5" fill="none" strokeLinecap="round" />

    {/* Right arm holding bucket */}
    <path d="M424 278 Q432 258 428 300" stroke="#C8854A" strokeWidth="10" fill="none" strokeLinecap="round" />
    {/* Bucket */}
    <rect x="424" y="295" width="38" height="36" rx="7" fill="#E040A0" />
    <path d="M424 295 Q443 278 462 295" stroke="#B0006A" strokeWidth="3" fill="none" />
    {/* Bucket items */}
    <rect x="430" y="277" width="6"  height="20" rx="2" fill="#FFEB3B" />
    <rect x="440" y="272" width="6"  height="25" rx="2" fill="#4FC3F7" />
    <rect x="450" y="279" width="6"  height="18" rx="2" fill="#A5D6A7" />

    {/* Shadow */}
    <ellipse cx="392" cy="396" rx="52" ry="8" fill="#000" opacity="0.07" />

    {/* Dot pattern top-right */}
    {[0,1,2,3].flatMap(r =>
      [0,1,2,3].map(c => (
        <circle key={`${r}-${c}`}
          cx={480 + c * 16} cy={36 + r * 16}
          r="2.5" fill="#3D9E68" opacity="0.3" />
      ))
    )}
  </svg>
);

/* ─── Tiny reusable atoms ───────────────────────────────────── */
const Tag = ({ children }) => (
  <span style={{
    display: 'inline-block', background: C.gray100, color: C.gray500,
    fontSize: 11, fontWeight: 600, padding: '3px 10px',
    borderRadius: 99, letterSpacing: '0.02em',
  }}>{children}</span>
);

const StatusPill = ({ label, type }) => {
  const map = {
    progress: { bg: C.amberSoft, color: C.amberDark },
    active:   { bg: C.tealSoft,  color: C.teal },
    neutral:  { bg: C.gray100,   color: C.gray500 },
  };
  const s = map[type] || map.neutral;
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 700,
      padding: '4px 12px', borderRadius: 99, whiteSpace: 'nowrap', letterSpacing: '0.03em',
    }}>{label}</span>
  );
};

const NavButton = ({ label, onClick }) => (
  <button type="button" onClick={onClick} style={{
    background: 'none', border: 'none', color: C.gray500,
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    padding: '8px 14px', borderRadius: 8, fontFamily: 'inherit', transition: 'color 0.15s',
  }}
    onMouseEnter={e => e.currentTarget.style.color = C.navy}
    onMouseLeave={e => e.currentTarget.style.color = C.gray500}
  >{label}</button>
);

/* ─── Step card ─────────────────────────────────────────────── */
const StepCard = ({ number, icon, title, text, accent }) => (
  <div style={{
    background: C.white, border: `1px solid ${C.gray200}`,
    borderRadius: 16, padding: '32px 28px',
    flex: 1, minWidth: 220, position: 'relative', overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: -4, right: 10,
      fontSize: 72, fontWeight: 900, color: accent,
      opacity: 0.06, lineHeight: 1, userSelect: 'none',
    }}>{number}</div>
    <div style={{
      width: 44, height: 44, borderRadius: 12, background: accent + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, marginBottom: 18,
    }}>{icon}</div>
    <div style={{ fontWeight: 700, fontSize: 16, color: C.gray900, marginBottom: 10 }}>{title}</div>
    <div style={{ fontSize: 14, color: C.gray500, lineHeight: 1.75 }}>{text}</div>
  </div>
);

/* ─── Dashboard preview row ─────────────────────────────────── */
const PreviewRow = ({ title, meta, tags, pill, pillType }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 12, padding: '16px 0', borderBottom: `1px solid ${C.gray100}`,
  }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, color: C.gray900, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 11, color: C.gray400, marginBottom: 8 }}>{meta}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {tags.map(t => <Tag key={t}>{t}</Tag>)}
      </div>
    </div>
    <StatusPill label={pill} type={pillType} />
  </div>
);

/* ─── Trust strip item ──────────────────────────────────────── */
const TrustItem = ({ icon, title, sub }) => (
  <div style={{ textAlign: 'center', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontWeight: 700, fontSize: 15, color: C.white, marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13, color: C.tealMid, lineHeight: 1.6, maxWidth: 160, margin: '0 auto' }}>{sub}</div>
  </div>
);

/* ─── Stars + Testimonial card ───────────────────────────────── */
const Stars = () => (
  <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width={16} height={16} viewBox="0 0 24 24" fill={C.amber}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ))}
  </div>
);

const TestimonialCard = ({ quote, name, role, initial, color }) => (
  <div style={{
    background: C.white, border: `1px solid ${C.gray200}`,
    borderRadius: 16, padding: '28px 24px',
    flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column',
  }}>
    <Stars />
    <p style={{ fontSize: 14, color: C.gray700, lineHeight: 1.8, fontStyle: 'italic', flex: 1, marginBottom: 24 }}>
      "{quote}"
    </p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.white, fontWeight: 700, fontSize: 15, flexShrink: 0,
      }}>{initial}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.gray900 }}>{name}</div>
        <div style={{ fontSize: 12, color: C.gray400 }}>{role}</div>
      </div>
    </div>
  </div>
);

/* ─── Main component ────────────────────────────────────────── */
const EmployerDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [riskyEmployers, setRiskyEmployers] = useState([]);
  const latestIncidentRef = useRef(null);
  const { messages, language, setLanguage } = useLanguage();
  const t = (messages && messages.workerDashboard) || {};

  useEffect(() => {
    getMetrics().then(setMetrics).catch(() => {});
  }, []);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/incident-alerts`);
        const data = await res.json();
        if (res.ok) {
          setRiskyEmployers(data.employers || []);
          const recentIncidents = data.recentIncidents || [];
          const newestIncidentId = recentIncidents[0]?._id || null;
          if (latestIncidentRef.current && newestIncidentId && latestIncidentRef.current !== newestIncidentId) {
            alert('🚨 New safety incident reported!');
          }
          latestIncidentRef.current = newestIncidentId;
        }
      } catch (err) {
        console.error('Failed to load safety alerts:', err);
      }
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: C.gray50, minHeight: '100vh', color: C.gray900 }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 768px) {
          .kw-hero-grid    { grid-template-columns: 1fr !important; }
          .kw-hero-right   { display: none !important; }
          .kw-steps-row    { flex-direction: column !important; }
          .kw-trust-strip  { flex-direction: column !important; gap: 32px !important; }
          .kw-testimonials { flex-direction: column !important; }
          .kw-footer-inner { flex-direction: column !important; gap: 36px !important; }
          .kw-footer-links { flex-direction: column !important; gap: 28px !important; }
          .kw-footer-bot   { flex-direction: column !important; gap: 8px !important; text-align: center !important; }
          .kw-nav-hide     { display: none !important; }
        }
      `}</style>

      {/* ── Ticker ── */}
      <div style={{
        background: C.navy, color: C.tealMid, fontSize: 12,
        fontWeight: 500, textAlign: 'center', padding: '8px 0', letterSpacing: '0.03em',
      }}>
        {metrics
          ? `${metrics.workersCount} women onboarded · ${metrics.employersCount} homes reached`
          : 'Voice-first hiring for domestic help · Trusted by homes across India'}
      </div>

      {/* ── Navbar ── */}
      <header style={{
        background: C.white, borderBottom: `1px solid ${C.gray200}`,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1140, margin: '0 auto', padding: '0 28px',
          height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div onClick={() => navigate('/')} style={{
            fontWeight: 800, fontSize: 18, color: C.navy,
            letterSpacing: '0.02em', cursor: 'pointer',
          }}>
            KaamWali<span style={{ color: C.teal }}>.AI</span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="kw-nav-hide"><NavButton label={t.employerDashboardTitle || 'For Employers'} onClick={() => navigate('/for-employers')} /></span>
            <span className="kw-nav-hide">
              <NavButton label="How it works"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} />
            </span>
            <NavButton label="Logout" onClick={() => {
              localStorage.removeItem("userRole");
              localStorage.removeItem("userData");
              navigate('/');
            }} />
            <button type="button" onClick={() => navigate('/feedback')} style={{
              background: C.teal, color: C.white, border: 'none',
              borderRadius: 10, padding: '9px 22px', fontWeight: 700,
              fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '0.02em', marginLeft: 8,
            }}
              onMouseEnter={e => e.currentTarget.style.background = C.tealHover}
              onMouseLeave={e => e.currentTarget.style.background = C.teal}
            >Feedback</button>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${C.gray200}`,
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                marginLeft: '8px',
                fontFamily: 'inherit',
              }}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="te">తెలుగు</option>
              <option value="kn">ಕನ್ನಡ</option>
              <option value="mr">मराठी</option>
            </select>
          </nav>
        </div>
      </header>

      {/* ── HERO — with illustrated background ── */}
      <section style={{
        background: `
  linear-gradient(rgba(22,43,34,0.55), rgba(22,43,34,0.55)),
  url('/src/assets/images/kaam.jpg') center/cover no-repeat
 `,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Soft background blobs */}
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 420, height: 420,
          borderRadius: '50%', background: 'rgba(46,125,94,0.07)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80, width: 320, height: 320,
          borderRadius: '50%', background: 'rgba(46,125,94,0.05)', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 28px' }}>
          <div className="kw-hero-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 0, minHeight: 500, alignItems: 'stretch',
          }}>

            {/* Left — headline + CTA */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', padding: '64px 40px 64px 0', zIndex: 2,
            }}>
              <h1 style={{
                fontSize: 44, fontWeight: 800, color: C.white,
                lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.02em',
              }}>
                {t.employerHeroTitle || 'Hire trusted help for your home, easily'}
              </h1>

              <p style={{
                fontSize: 16, color: C.white, lineHeight: 1.75,
                marginBottom: 28, maxWidth: 420,
              }}>
                {t.employerHeroSubtitle || 'Start as an employer and explore verified domestic workers nearby using filters like city, skills, experience, and salary.'}
              </p>

              {/* Checkmark trust row — exactly as in screenshot */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 32, alignItems: 'center' }}>
                {['Verified Profiles', 'Safe & Secure', '100% Free to Start'].map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                    <svg width={15} height={15} viewBox="0 0 20 20" fill={C.teal}>
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span style={{ color: C.white }}>{label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => navigate('/for-employers')} style={{
                  background: C.teal, color: C.white, border: 'none',
                  borderRadius: 12, padding: '13px 28px',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = C.tealHover}
                  onMouseLeave={e => e.currentTarget.style.background = C.teal}
                >{t.employerDashboardTitle || 'For Employers'}</button>
                <button type="button" onClick={() => navigate('/feedback')} style={{
                  background: 'transparent', color: C.white,
                  border: `2px solid ${C.tealMid}`, borderRadius: 12,
                  padding: '11px 26px', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Feedback</button>
              </div>
            </div>

            {/* Right — illustration behind, dashboard card on top */}
            <div className="kw-hero-right" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>

              
              {/* Floating dashboard card */}
              <div style={{
                position: 'relative', zIndex: 3,
                marginLeft: 'auto', marginTop: 40, marginBottom: 40,
                width: 300,
                background: C.white,
                border: `1px solid ${C.gray200}`,
                borderRadius: 20, padding: 22,
                boxShadow: '0 8px 40px rgba(22,43,34,0.14)',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 14,
                  paddingBottom: 12, borderBottom: `1px solid ${C.gray100}`,
                }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.gray900 }}>Employer dashboard</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.teal, cursor: 'pointer' }}>Employer view</span>
                </div>

                <div style={{ display: 'flex', gap: 5, marginBottom: 2 }}>
                  {['Work type', 'Timing', 'Budget'].map(f => (
                    <span key={f} style={{
                      background: C.gray100, color: C.gray500,
                      fontSize: 10, fontWeight: 500, padding: '3px 9px', borderRadius: 99,
                    }}>{f}</span>
                  ))}
                </div>

                <PreviewRow title={t.employerYourHomeProfile || 'Your home profile'}
                  meta="Complete details to get better matches"
                  tags={['Address', 'Preferences']} pill="In progress" pillType="progress" />
                <PreviewRow title="Active job posts"
                  meta="Requirements you have posted"
                  tags={['Open', 'Matched']} pill="2 active" pillType="active" />
                <PreviewRow title="Saved workers"
                  meta="Workers you hired or liked before"
                  tags={['Trusted', 'Hire again']} pill="0 saved" pillType="neutral" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: C.gray50, padding: '80px 28px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <h2 style={{
            fontWeight: 800, fontSize: 26, color: C.navy,
            marginBottom: 36, letterSpacing: '-0.01em',
          }}>
            {t.employerHowItWorks || 'How KaamWali.AI works for you'}
          </h2>
          <div className="kw-steps-row" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <StepCard number="1" icon="🏠" accent={C.teal}
              title="Start as an employer"
              text="Register as an employer and create your profile. Your details help us personalize worker recommendations for you." />
            <StepCard number="2" icon="🔍" accent="#7C3AED"
              title="Search verified workers"
              text="Search and filter workers by city, skills, area, maximum experience, and expected salary. View worker profiles and resumes easily." />
            <StepCard number="3" icon="⭐" accent="#D97706"
              title="Share feedback"
              text="Give feedback for workers you have hired to help build trust and improve the experience for future employers." />
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section style={{ background: C.navy, padding: '56px 28px' }}>
        <div className="kw-trust-strip" style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap',
        }}>
          <TrustItem icon="✔️" title="Verified Profiles"  sub="Every worker is manually verified" />
          <TrustItem icon="🔒" title={t.employerTrusted || 'Background Checked'} sub={t.employerTrustedByHomes || 'Safe for your home & family'} />
          <TrustItem icon="⭐" title="Employer Ratings"   sub="Real reviews from real families" />
          <TrustItem icon="🎤" title="Voice Onboarded"    sub="No literacy barrier for workers" />
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: C.white, padding: '80px 28px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <h2 style={{
            fontWeight: 800, fontSize: 34, color: C.navy,
            textAlign: 'center', marginBottom: 48, letterSpacing: '-0.01em',
          }}>
            Trusted by families across India
          </h2>
          <div className="kw-testimonials" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <TestimonialCard
              quote="Found Sunita through KaamWali and she's been with us for 8 months. Completely trustworthy — she has keys to our home. The verified profile made all the difference."
              name="Ananya Mehta" role="Working Mother, Delhi" initial="A" color={C.teal} />
            <TestimonialCard
              quote="Hiring a babysitter was always stressful. KaamWali's background check and employer reviews gave us real confidence. Our kids love her!"
              name="Rahul Verma" role="Father of 2, Gurgaon" initial="R" color="#7C3AED" />
            <TestimonialCard
              quote="My caregiver Rekha was found here. The voice-based profile was a great idea — she couldn't type but spoke clearly and her profile was perfect."
              name="Meena Iyer" role="Senior Citizen, Bangalore" initial="M" color="#D97706" />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <section style={{ background: C.white, padding: '0 28px 72px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{
            border: `1px solid ${C.gray200}`,
            borderRadius: 18,
            padding: '24px 28px',
            boxShadow: '0 8px 24px rgba(22,43,34,0.06)',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.navy, marginBottom: 8 }}>
              Safety alerts
            </div>
            <div style={{ fontSize: 14, color: C.gray500, marginBottom: 20 }}>
              Employers with 2 or more incidents, or already blocked, are surfaced here automatically.
            </div>

            {riskyEmployers.length === 0 && (
              <div style={{ fontSize: 14, color: C.gray500 }}>
                No employers with serious incidents right now.
              </div>
            )}

            {riskyEmployers.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {riskyEmployers.map((employer) => (
                  <div
                    key={employer.phone}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16,
                      padding: '14px 16px',
                      borderRadius: 14,
                      background: employer.isBlocked ? '#FEF2F2' : '#FFF7ED',
                      border: `1px solid ${employer.isBlocked ? '#FECACA' : '#FED7AA'}`,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: C.gray900 }}>
                        {employer.name || 'Employer'} ({employer.phone})
                      </div>
                      <div style={{ fontSize: 13, color: C.gray500, marginTop: 4 }}>
                        {employer.city || 'City unavailable'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: employer.isBlocked ? '#B91C1C' : '#C2410C' }}>
                      {employer.safetyIncidents || 0} incident{(employer.safetyIncidents || 0) === 1 ? '' : 's'}
                      {employer.isBlocked ? ' - BLOCKED' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer style={{ background: C.navy, padding: '56px 28px 0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div className="kw-footer-inner" style={{
            display: 'flex', justifyContent: 'space-between', gap: 48,
            paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap',
          }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: C.white, letterSpacing: '0.04em', marginBottom: 14 }}>
                KAAMWALI<span style={{ color: C.tealMid }}>.AI</span>
              </div>
              <p style={{ fontSize: 13, color: C.tealMid, lineHeight: 1.75 }}>
                Connecting trusted domestic workers with families across India — safely, simply, and with dignity.
              </p>
            </div>

            <div className="kw-footer-links" style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
              {[
                { heading: 'Company', links: ['About Us', 'How it Works', 'For Employers', 'For Workers'] },
                { heading: 'Support',  links: ['Contact', 'Privacy Policy', 'Terms of Use', 'Feedback'] },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <div style={{
                    fontWeight: 700, fontSize: 11, color: C.white,
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16,
                  }}>{heading}</div>
                  {links.map(l => (
                    <div key={l} style={{ fontSize: 13, color: C.tealMid, marginBottom: 10, cursor: 'pointer', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = C.white}
                      onMouseLeave={e => e.currentTarget.style.color = C.tealMid}
                    >{l}</div>
                  ))}
                </div>
              ))}

              <div>
                <div style={{
                  fontWeight: 700, fontSize: 11, color: C.white,
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16,
                }}>Language</div>
                <select style={{
                  background: 'rgba(255,255,255,0.08)', color: C.white,
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10, padding: '8px 16px', fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                }}>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Telugu</option>
                  <option>Tamil</option>
                </select>
              </div>
            </div>
          </div>

          <div className="kw-footer-bot" style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '20px 0', flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{ fontSize: 12, color: C.gray500 }}>
              © 2026 KaamWali.AI. Built with ❤️ to empower domestic workers across India.
            </div>
            <div style={{ fontSize: 12, color: C.gray500 }}>Made in India 🇮🇳</div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default EmployerDashboard;
