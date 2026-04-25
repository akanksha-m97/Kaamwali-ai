// frontend/src/components/AuthPage.jsx
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE } from '../api';
import { sendOtp as firebaseSendOtp, verifyOtp as firebaseVerifyOtp } from '../firebaseAuth';

const initialFormData = {
  name: '',
  phone: '',
  email: '',
  city: '',
  password: '',
  otp: '',
};

const initialSignupStep = 'details';

const AuthPage = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login');
  const [userType, setUserType] = useState('worker');
  const [formData, setFormData] = useState(initialFormData);
  const [signupStep, setSignupStep] = useState(initialSignupStep);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const isDevMode = import.meta.env.DEV === true;
  const { language, setLanguage, messages, loadingTranslations } = useLanguage();

  const isWorker = userType === 'worker';
  const t = (messages && messages.auth) || {};

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetSignupFlow = () => {
    setSignupStep(initialSignupStep);
    setStatusMessage('');
    setDevOtp('');
    setFormData((prev) => ({ ...prev, otp: '' }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setStatusMessage('');
    if (nextMode === 'signup') {
      setSignupStep(initialSignupStep);
    }
  };

  const sendOtp = async () => {
    try {
      const otp = await firebaseSendOtp(formData.phone);
      setDevOtp(isDevMode && otp ? String(otp) : '');

      // Auto-fill OTP in the form
      setFormData((prev) => ({ ...prev, otp: String(otp) }));

      setSignupStep('otp');
      setStatusMessage('OTP sent to your phone (check console for auto-filled OTP)');
    } catch (err) {
      setStatusMessage(err.message || 'Failed to send OTP');
    }
  };

  const verifyOtp = async () => {
    try {
      await firebaseVerifyOtp(formData.otp);
      setSignupStep('password');
      setStatusMessage('Phone verified!');
    } catch (err) {
      setStatusMessage('Invalid OTP');
    }
  };

  const setPassword = async () => {
    const res = await fetch(`${API_BASE}/api/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formData.phone,
        password: formData.password,
        role: userType,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to set password');
    }
    setStatusMessage('Account created successfully. Please log in.');
    setMode('login');
    setSignupStep(initialSignupStep);
    setFormData((prev) => ({
      ...prev,
      password: '',
      otp: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage('');

    try {
      if (mode === 'signup') {
        if (signupStep === 'details') {
          await sendOtp();
        } else if (signupStep === 'otp') {
          await verifyOtp();
        } else {
          await setPassword();
        }
      } else {
        const res = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formData.phone,
            password: formData.password,
            role: userType,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.user) {
          throw new Error(data.error || data.message || 'Login failed');
        }

        setStatusMessage('Login success!');
        onAuthSuccess(data.user.role || userType, data.user);
      }
    } catch (err) {
      setStatusMessage(err.message || 'Error connecting to server');
    } finally {
      setSubmitting(false);
    }
  };

  const signupButtonLabel =
    signupStep === 'details'
      ? 'Send OTP'
      : signupStep === 'otp'
      ? 'Verify OTP'
      : 'Set Password';

  return (
    <>
      <style>{`
        .kw-auth-shell {
          display: flex;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        }

        .kw-auth-left {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: #ffffff;
          position: relative;
        }

        .kw-auth-content {
          width: 100%;
          max-width: 480px;
        }

        .kw-language-selector-inline {
          margin-bottom: 20px;
          text-align: left;
        }

        .kw-language-dropdown {
          padding: 10px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 24px;
          background: white;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .kw-language-dropdown:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .kw-logo {
          display: inline-block;
          padding: 12px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 1.5px;
          border-radius: 28px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          margin-bottom: 40px;
        }

        .kw-heading {
          font-size: 36px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 32px;
          line-height: 1.2;
        }

        .kw-role-toggle {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .kw-role-btn {
          flex: 1;
          padding: 14px 24px;
          border: none;
          border-radius: 28px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          background: #f5f5f5;
          color: #666;
          transition: all 0.3s ease;
        }

        .kw-role-btn:hover {
          background: #ebebeb;
        }

        .kw-role-btn.kw-active {
          background: #1a1a2e;
          color: white;
          box-shadow: 0 4px 12px rgba(26, 26, 46, 0.25);
        }

        .kw-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 32px;
          border-bottom: 2px solid #f0f0f0;
        }

        .kw-tab {
          flex: 1;
          padding: 14px 0;
          border: none;
          background: none;
          font-size: 16px;
          font-weight: 500;
          color: #999;
          cursor: pointer;
          position: relative;
          transition: color 0.3s ease;
        }

        .kw-tab:hover {
          color: #666;
        }

        .kw-tab.kw-active {
          color: #1a1a2e;
        }

        .kw-tab.kw-active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: #1a1a2e;
        }

        .kw-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .kw-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .kw-label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .kw-input {
          padding: 16px 20px;
          border: 1px solid #e0e0e0;
          border-radius: 28px;
          font-size: 15px;
          outline: none;
          background: #fafafa;
          transition: all 0.2s ease;
        }

        .kw-input:focus {
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .kw-input::placeholder {
          color: #aaa;
        }

        .kw-forgot {
          text-align: right;
          margin-top: -8px;
        }

        .kw-forgot-link {
          background: none;
          border: none;
          color: #667eea;
          font-size: 14px;
          cursor: pointer;
          font-weight: 500;
          text-decoration: none;
        }

        .kw-forgot-link:hover {
          text-decoration: underline;
        }

        .kw-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .kw-checkbox-row input[type="checkbox"] {
          margin-top: 3px;
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #1a1a2e;
        }

        .kw-checkbox-row label {
          font-size: 14px;
          color: #555;
          line-height: 1.5;
          cursor: pointer;
        }

        .kw-submit, .kw-secondary {
          padding: 18px;
          border: none;
          border-radius: 28px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.3s ease;
        }

        .kw-submit {
          background: #1a1a2e;
          color: white;
          box-shadow: 0 4px 12px rgba(26, 26, 46, 0.3);
        }

        .kw-submit:hover {
          background: #2d2d44;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(26, 26, 46, 0.4);
        }

        .kw-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .kw-status {
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          background: #eef2ff;
          color: #3730a3;
        }

        .kw-otp-debug {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 20px;
          background: #e0f2fe;
          border: 1px solid #7dd3fc;
          color: #0369a1;
          font-size: 15px;
          margin-top: 10px;
          word-break: break-word;
        }

        .kw-otp-debug strong {
          font-weight: 700;
          color: #0c4a6e;
        }

        .kw-auth-right {
          flex: 1;
          padding: 0;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          overflow: hidden;
        }

        .kw-image-wrapper {
          width: 100%;
          height: 100%;
          border-radius: 0;
          overflow: hidden;
          box-shadow: none;
        }

        .kw-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @media (max-width: 968px) {
          .kw-auth-shell {
            flex-direction: column;
          }

          .kw-auth-right {
            display: none;
          }

          .kw-heading {
            font-size: 28px;
          }
        }

        @media (max-width: 480px) {
          .kw-auth-left {
            padding: 20px;
          }

          .kw-role-btn {
            font-size: 14px;
            padding: 12px 16px;
          }

          .kw-logo {
            font-size: 14px;
            padding: 10px 24px;
          }
        }
      `}</style>

      <div className="kw-auth-shell">
        <div className="kw-auth-left">
          <div className="kw-auth-content">
            <div className="kw-logo">{t.logo || 'KaamWali.AI'}</div>

            <h1 className="kw-heading">
              {mode === 'login' ? t.welcomeBack : t.createAccount}
            </h1>

            <div className="kw-language-selector-inline">
              <select
                className="kw-language-dropdown"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="te">తెలుగు</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="mr">मराठी</option>
                <option value="bn">বাংলা</option>
              </select>
              {loadingTranslations && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
                  Loading language...
                </div>
              )}
            </div>

            <div className="kw-role-toggle">
              <button
                type="button"
                className={`kw-role-btn ${isWorker ? 'kw-active' : ''}`}
                onClick={() => {
                  setUserType('worker');
                  resetSignupFlow();
                }}
              >
                {t.iAmWorker}
              </button>
              <button
                type="button"
                className={`kw-role-btn ${!isWorker ? 'kw-active' : ''}`}
                onClick={() => {
                  setUserType('employer');
                  resetSignupFlow();
                }}
              >
                {t.iAmEmployer}
              </button>
            </div>

            <div className="kw-tabs">
              <button
                type="button"
                className={`kw-tab ${mode === 'login' ? 'kw-active' : ''}`}
                onClick={() => switchMode('login')}
              >
                {t.login}
              </button>
              <button
                type="button"
                className={`kw-tab ${mode === 'signup' ? 'kw-active' : ''}`}
                onClick={() => switchMode('signup')}
              >
                {t.signup}
              </button>
            </div>

            <form className="kw-form" onSubmit={handleSubmit}>
              {mode === 'login' ? (
                <>
                  <div className="kw-field">
                    <label className="kw-label">{t.emailPhone}</label>
                    <input
                      name="phone"
                      type="text"
                      className="kw-input"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t.emailPhonePlaceholder}
                      required
                    />
                  </div>

                  <div className="kw-field">
                    <label className="kw-label">{t.password}</label>
                    <input
                      name="password"
                      type="password"
                      className="kw-input"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t.passwordPlaceholder}
                      required
                    />
                  </div>

                  <div className="kw-forgot">
                    <button type="button" className="kw-forgot-link">
                      {t.forgotPassword}
                    </button>
                  </div>

                  <button type="submit" className="kw-submit" disabled={submitting}>
                    {submitting ? 'Please wait...' : t.loginButton}
                  </button>
                </>
              ) : (
                <>
                  {signupStep === 'details' && (
                    <>
                      <div className="kw-field">
                        <label className="kw-label">{t.name}</label>
                        <input
                          name="name"
                          type="text"
                          className="kw-input"
                          placeholder={isWorker ? t.fullNamePlaceholder : t.namePlaceholder}
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="kw-field">
                        <label className="kw-label">{t.phoneNumber || 'Phone number'}</label>
                        <input
                          name="phone"
                          type="tel"
                          className="kw-input"
                          placeholder={t.phonePlaceholder}
                          value={formData.phone}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      {!isWorker && (
                        <div className="kw-field">
                          <label className="kw-label">{t.email}</label>
                          <input
                            name="email"
                            type="email"
                            className="kw-input"
                            placeholder={t.emailPlaceholder}
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      )}

                      <div className="kw-field">
                        <label className="kw-label">{isWorker ? t.cityArea : t.city}</label>
                        <input
                          name="city"
                          type="text"
                          className="kw-input"
                          placeholder={isWorker ? t.cityAreaPlaceholder : t.cityPlaceholder}
                          value={formData.city}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="kw-checkbox-row">
                        <input type="checkbox" id={isWorker ? 'worker-consent' : 'employer-consent'} required />
                        <label htmlFor={isWorker ? 'worker-consent' : 'employer-consent'}>
                          {isWorker ? t.workerConsent : t.employerConsent}
                        </label>
                      </div>
                    </>
                  )}

                  {signupStep === 'otp' && (
                    <>
                      <div className="kw-field">
                        <label className="kw-label">Enter OTP</label>
                        <input
                          name="otp"
                          type="text"
                          className="kw-input"
                          placeholder="6-digit OTP"
                          value={formData.otp}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      {devOtp && (
                        <div className="kw-otp-debug">
                          <span>Your OTP</span>
                          <strong>{devOtp}</strong>
                        </div>
                      )}
                    </>
                  )}

                  {signupStep === 'password' && (
                    <div className="kw-field">
                      <label className="kw-label">{t.password}</label>
                      <input
                        name="password"
                        type="password"
                        className="kw-input"
                        placeholder={t.passwordMin}
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}

                  <button type="submit" className="kw-submit" disabled={submitting}>
                    {submitting ? 'Please wait...' : signupButtonLabel}
                  </button>

                  {signupStep === 'otp' && (
                    <button
                      type="button"
                      className="kw-secondary"
                      disabled={submitting}
                      onClick={async () => {
                        setSubmitting(true);
                        try {
                          await sendOtp();
                        } catch (err) {
                          setStatusMessage(err.message || 'Failed to resend OTP');
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      Resend OTP
                    </button>
                  )}
                </>
              )}
            </form>

            {statusMessage && <div className="kw-status" style={{ marginTop: 16 }}>{statusMessage}</div>}
            <div id="recaptcha-container"></div>
          </div>
        </div>

        <div className="kw-auth-right">
          <div className="kw-image-wrapper">
            <img
              src="/src/assets/images/auth.jpeg"
              alt="KaamWali.AI"
              className="kw-image"
            />
          </div>
        </div>
      </div>
    </>
  );
};
export default AuthPage;
