import React, { useState } from 'react';
import './styles.css';

const EmployerSearch = ({ onSearch }) => {
  const [city, setCity] = useState('Bhiwani');
  const [skill, setSkill] = useState('cooking');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(city, skill);
  };

  const styles = {
    wrapper: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e6f4ee, #f5f9f7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px 16px',
    },
    card: {
      background: '#ffffff',
      borderRadius: '20px',
      padding: '32px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '680px',
      border: '1px solid rgba(46, 125, 94, 0.15)',
    },
    title: {
      fontSize: '28px',
      fontWeight: 800,
      margin: '0 0 8px',
      textAlign: 'center',
      color: '#162B22',
    },
    subtitle: {
      fontSize: '14px',
      color: '#4a6356',
      margin: '0 0 24px',
      textAlign: 'center',
    },
    fieldsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '14px',
      marginBottom: '20px',
    },
    field: {
      display: 'flex',
      flexDirection: 'column',
    },
    label: {
      fontSize: '13px',
      fontWeight: 700,
      color: '#162B22',
      marginBottom: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
    },
    select: {
      padding: '12px',
      borderRadius: '12px',
      border: '1.5px solid #d4e8df',
      background: '#fff',
      color: '#162B22',
      fontSize: '14px',
      fontWeight: 500,
      outline: 'none',
      cursor: 'pointer',
      transition: 'border-color 0.2s ease',
    },
    button: {
      width: '100%',
      padding: '14px 18px',
      background: '#2E7D5E',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      fontWeight: 700,
      fontSize: '15px',
      cursor: 'pointer',
      boxShadow: '0 6px 16px rgba(46, 125, 94, 0.28)',
      transition: 'transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease',
    },
  };

  return (
    <div style={styles.wrapper}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h2 style={styles.title}>Find a trusted worker</h2>
        <p style={styles.subtitle}>Search by city and skill to see available matches</p>

        <div style={styles.fieldsGrid}>
          <label style={styles.field}>
            <span style={styles.label}>City</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={styles.select}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2E7D5E';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d4e8df';
              }}
            >
              <option value="Bhiwani">Bhiwani</option>
              <option value="Delhi">Delhi</option>
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Required skill</span>
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              style={styles.select}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2E7D5E';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d4e8df';
              }}
            >
              <option value="cooking">Cooking</option>
              <option value="cleaning">Cleaning</option>
              <option value="babysitting">Babysitting</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          style={styles.button}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 24px rgba(46, 125, 94, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 125, 94, 0.28)';
          }}
        >
          Show matching workers
        </button>
      </form>
    </div>
  );
};

export default EmployerSearch;
