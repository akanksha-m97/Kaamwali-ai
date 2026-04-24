import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from '../contexts/LanguageContext';

export default function Feedback() {
  const navigate = useNavigate();
  const { messages } = useLanguage();
  const t = (messages && messages.workerDashboard) || {};

  const [ratings, setRatings] = useState({
    workQuality: 0,
    reliability: "",
    attentionToDetail: 0,
    professionalism: 0,
    skillCompetence: 0,
    overallSatisfaction: "",
  });

  const [improvementSuggestions, setImprovementSuggestions] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [date, setDate] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  
  // 🔥 Changed from housekeeperRole to housekeeperName
  const [housekeeperName, setHousekeeperName] = useState("");
  const [workerRole, setWorkerRole] = useState("");

  const handleRatingChange = (question, value) => {
    setRatings((prev) => ({ ...prev, [question]: value }));
  };

  // 🔥 Auto-fill worker name when phone is entered
  useEffect(() => {
    if (!emergencyContact || emergencyContact.length < 10) {
      setHousekeeperName("");
      setWorkerRole("");
      return;
    }

    const fetchWorkerByPhone = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/workers/by-phone/${emergencyContact}`);
        
        if (!res.ok) {
          setHousekeeperName("");
          setWorkerRole("");
          return;
        }

        const data = await res.json();
        setHousekeeperName(data.name || "");
        setWorkerRole(data.role || "");
      } catch (err) {
        console.error("Error fetching worker:", err);
        setHousekeeperName("");
        setWorkerRole("");
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchWorkerByPhone, 500);
    return () => clearTimeout(timeoutId);
  }, [emergencyContact]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!employerName) {
      alert(t.feedbackErrorName || "Please enter your name.");
      return;
    }

    if (!emergencyContact) {
      alert(t.feedbackErrorPhone || "Please enter worker phone number.");
      return;
    }

    if (!housekeeperName) {
      alert(t.feedbackErrorNotFound || "Worker not found with this phone number. Please verify.");
      return;
    }

    // Check if at least some ratings are filled
    const hasRatings = Object.values(ratings).some(val => val !== "" && val !== 0);
    if (!hasRatings) {
      alert(t.feedbackErrorRatings || "Please provide at least one rating.");
      return;
    }

    const payload = {
      employerName,
      date: date || new Date().toISOString().split('T')[0],
      emergencyContact,
      ratings,
      improvementSuggestions,
    };

    console.log("Submitting feedback:", payload);

    try {
      const res = await fetch("http://localhost:4000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || t.feedbackError || "Something went wrong!");
        return;
      }

      alert((t.feedbackSuccess || 'Feedback submitted successfully for {name}!').replace('{name}', data.workerName));
      
      // Reset form
      setRatings({
        workQuality: 0,
        reliability: "",
        attentionToDetail: 0,
        professionalism: 0,
        skillCompetence: 0,
        overallSatisfaction: "",
      });
      setImprovementSuggestions("");
      setEmployerName("");
      setDate("");
      setEmergencyContact("");
      setHousekeeperName("");
      setWorkerRole("");

    } catch (err) {
      console.error("Submit error:", err);
      alert(t.feedbackServerError || "Server error while submitting feedback. Please try again.");
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#E4EEE9",
      backgroundImage: "linear-gradient(180deg, #E4EEE9 0%, #CEDFD6 52%, #F9FAFB 100%)",
      padding: "40px 20px 80px",
      fontFamily: "Inter, Arial, sans-serif",
      color: "#102a43",
    },
    hero: {
      maxWidth: "1150px",
      margin: "0 auto",
      padding: "34px 28px",
      borderRadius: "14px",
      background: "linear-gradient(135deg, #2E7D5E 0%, #A7D4BC 100%)",
      color: "#ffffff",
      boxShadow: "0 12px 35px rgba(46, 125, 94, 0.28)",
      textAlign: "center",
      marginBottom: "-24px",
    },
    card: {
      maxWidth: "920px",
      margin: "-20px auto 0",
      backgroundColor: "#fff",
      borderRadius: "14px",
      border: "1px solid rgba(167, 212, 188, 0.5)",
      boxShadow: "0 10px 24px rgba(46, 125, 94, 0.14)",
      padding: "38px 34px",
    },
    sectionTitle: {
      fontSize: "22px",
      fontWeight: "700",
      marginBottom: "22px",
      color: "#1b4d3f",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gridAutoRows: "auto",
      gap: "18px",
      marginBottom: "24px",
    },
    inputBox: {
      display: "flex",
      flexDirection: "column",
      fontSize: "13px",
      color: "#333",
    },
    input: {
      marginTop: "8px",
      padding: "12px",
      borderRadius: "12px",
      border: "1px solid #dbeafe",
      fontSize: "14px",
      backgroundColor: "#fff",
      color: "#0f172a",
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
    },
    inputReadonly: {
      marginTop: "8px",
      padding: "12px",
      borderRadius: "12px",
      border: "1px solid #dbeafe",
      fontSize: "14px",
      backgroundColor: "#f8fafc",
      color: "#64748b",
      boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.04)",
    },
    progressBar: {
      height: 4,
      borderRadius: 3,
      backgroundColor: "#e5f1ea",
      overflow: "hidden",
      marginBottom: 22,
    },
    progressInner: {
      height: "100%",
      width: "50%",
      backgroundColor: "#2E7D5E",
    },
    question: {
      marginBottom: "23px",
    },
    questionText: {
      fontSize: "14px",
      marginBottom: "10px",
      color: "#333",
    },
    starButton: (active) => ({
      cursor: "pointer",
      fontSize: "30px",
      color: active ? "#2E7D5E" : "#cbd5e1",
      marginRight: "8px",
      border: "none",
      background: "none",
      padding: 0,
      lineHeight: 1,
    }),
    options: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
    numberButton: (active) => ({
      width: "38px",
      height: "38px",
      borderRadius: "50%",
      border: "2px solid #333",
      backgroundColor: active ? "#111827" : "#fff",
      color: active ? "#fff" : "#111827",
      cursor: "pointer",
      fontWeight: "bold",
    }),
    optionButton: (active) => ({
      padding: "8px 14px",
      borderRadius: "20px",
      border: "2px solid #333",
      backgroundColor: active ? "#111827" : "#fff",
      color: active ? "#fff" : "#111827",
      cursor: "pointer",
      fontSize: "13px",
    }),
    textarea: {
      width: "100%",
      minHeight: "130px",
      padding: "12px",
      fontSize: "14px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      resize: "vertical",
      lineHeight: "1.4",
    },
    submit: {
      marginTop: "30px",
      backgroundColor: "#111827",
      color: "#fff",
      padding: "12px 40px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: "bold",
      display: "block",
      marginLeft: "auto",
      marginRight: "auto",
    },
  };

  const StarRating = ({ question }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          style={styles.starButton(ratings[question] >= n)}
          onClick={() => handleRatingChange(question, n)}
          aria-label={`${question} star ${n}`}
        >
          {ratings[question] >= n ? '★' : '☆'}
        </button>
      ))}
    </div>
  );

  const OptionButtons = ({ question, options }) => (
    <div style={styles.options}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          style={styles.optionButton(ratings[question] === opt)}
          onClick={() => handleRatingChange(question, opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* ===== HEADER ===== */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1140,
          margin: '0 auto',
          padding: '0 24px',
          height: 62,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div onClick={() => navigate('/')} style={{
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: 18,
            color: '#0d2e59',
            letterSpacing: '0.02em',
          }}>
            KaamWali<span style={{ color: '#2E7D5E' }}>.AI</span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => navigate('/employer-dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2E7D5E',
                fontSize: 14,
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 8,
              }}
            >
              {t.landingForEmployers}
            </button>
            <button
              type="button"
              onClick={() => navigate('/feedback')}
              style={{
                background: '#2E7D5E',
                border: 'none',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                padding: '8px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: '0 6px 14px rgba(46, 125, 94, 0.35)',
              }}
            >
              Feedback
            </button>
          </nav>
        </div>
      </header>

      {/* ===== PAGE ===== */}
      <div style={styles.page}>
        <div style={styles.hero}>
          <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>
            {t.feedbackPageTitle}
          </h2>
          <p style={{ margin: "10px 0 0", fontSize: "15px", opacity: 0.95 }}>
            {t.feedbackPageSubtitle}
          </p>
        </div>

        <div style={styles.card}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#102a43' }}>{t.feedbackFormTitle}</div>
            <div style={{ fontSize: 14, color: '#52606d', marginTop: 6 }}>
              {t.feedbackFormSubtitle}
            </div>
          </div>
          <div style={styles.progressBar}>
            <div style={styles.progressInner} />
          </div>

          <div style={styles.grid}>
            <div style={styles.inputBox}>
              {t.employerNameLabel}
              <input
                style={styles.input}
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
                placeholder={t.employerNamePlaceholder}
              />
            </div>

            <div style={styles.inputBox}>
              {t.housekeeperPhoneLabel}
              <input
                style={styles.input}
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder={t.housekeeperPhonePlaceholder}
              />
            </div>

            <div style={styles.inputBox}>
              {t.dateLabel}
              <input
                type="date"
                style={styles.input}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div style={styles.inputBox}>
              {t.housekeeperNameLabel}
              <input
                style={styles.inputReadonly}
                value={housekeeperName}
                readOnly
                placeholder={t.housekeeperNameAutoFill}
              />
            </div>
          </div>

          {/* 🔥 Optional: Show role below name */}
          {workerRole && (
            <div style={{ marginBottom: "20px", fontSize: "13px", color: "#666" }}>
              {t.roleLabel}: <strong>{workerRole}</strong>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.question}>
              <p style={styles.questionText}>
                {t.professionalismQuestion}
              </p>
              <StarRating question="professionalism" />
            </div>

            <div style={styles.question}>
              <p style={styles.questionText}>
                {t.skillsQuestion}
              </p>
              <StarRating question="skillCompetence" />
            </div>

            <div style={styles.question}>
              <p style={styles.questionText}>
                {t.workQualityQuestion}
              </p>
              <StarRating question="workQuality" />
            </div>

            <div style={styles.question}>
              <p style={styles.questionText}>
                {t.reliabilityQuestion}
              </p>
              <OptionButtons
                question="reliability"
                options={[t.reliabilityAlways, t.reliabilitySometimes, t.reliabilityRarely]}
              />
            </div>

            <div style={styles.question}>
              <p style={styles.questionText}>
                {t.attentionDetailQuestion}
              </p>
              <StarRating question="attentionToDetail" />
            </div>

            <div style={styles.question}>
              <p style={styles.questionText}>{t.overallSatisfactionQuestion}</p>
              <OptionButtons
                question="overallSatisfaction"
                options={[
                  t.satisfactionVery,
                  t.satisfactionYes,
                  t.satisfactionNeutral,
                  t.satisfactionNo,
                ]}
              />
            </div>

            <div style={styles.question}>
              <p style={styles.questionText}>{t.suggestionsLabel}</p>
              <textarea
                style={styles.textarea}
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                placeholder={t.suggestionsPlaceholder}
              />
            </div>

            <button type="submit" style={styles.submit}>
              {t.submitFeedbackButton}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}