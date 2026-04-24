// components/HireEmployeeDialog.jsx
import React, { useState } from 'react';

const HireEmployeeDialog = ({ open, onClose, worker, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    employerName: '',
    employerPhone: '',
    jobDescription: '',
    salary: '',
    location: '',
    startDate: '',
    notes: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        employerName: '',
        employerPhone: '',
        jobDescription: '',
        salary: '',
        location: '',
        startDate: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error submitting hire request:', error);
    }
  };

  if (!open) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    dialog: {
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    title: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#162B22',
      margin: '0 0 20px 0',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    label: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#374151',
    },
    input: {
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s',
    },
    textarea: {
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      minHeight: '80px',
      resize: 'vertical',
      transition: 'border-color 0.2s',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '20px',
    },
    cancelBtn: {
      padding: '10px 20px',
      background: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    submitBtn: {
      padding: '10px 20px',
      background: '#2E7D5E',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.6 : 1,
      transition: 'background 0.2s',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Hire {worker?.name}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name *</label>
            <input
              type="text"
              name="employerName"
              value={formData.employerName}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Your Phone Number *</label>
            <input
              type="tel"
              name="employerPhone"
              value={formData.employerPhone}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Enter your phone number"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Job Description *</label>
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              style={styles.textarea}
              required
              placeholder="Describe the work needed (cooking, cleaning, childcare, etc.)"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Monthly Salary (₹) *</label>
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Enter monthly salary amount"
              min="1"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Location / Area *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Enter your address or area"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Start Date *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Any special requirements, timing preferences, etc."
            />
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HireEmployeeDialog;