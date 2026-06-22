import React, { useState } from 'react';
import { API_BASE } from '../api';

const SharePoster = ({ worker }) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const workerId = worker?._id || worker?.id;

  // ✅ Exact same logic as WorkerProfile.jsx generatePdf
  const handleGenerateAndSharePDF = async () => {
    if (!workerId) {
      alert('Worker ID missing');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/workers/${workerId}/generate-pdf`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: 'en' }),
        }
      );

      if (!res.ok) {
        alert('PDF generation failed');
        return;
      }

      const data = await res.json();
      const url = `${API_BASE}${data.pdfUrl}`;  // ← same as WorkerProfile

      setPdfUrl(url);

      // Open in new tab
      window.open(url, '_blank');

      // Share on WhatsApp
      const message = `📄 KaamWali.AI – My Worker Profile\n\n${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');

    } catch (err) {
      console.error('PDF generation failed', err);
      alert('Failed to generate PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfUrl) {
      alert('Please generate the PDF first');
      return;
    }
    // ✅ Same download logic as WorkerProfile
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `worker_${workerId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card">
      <h2 className="card-title">Share profile</h2>
      <p className="text-small">Generate a verified PDF to share.</p>

      <button
        className="btn btn-primary"
        onClick={handleGenerateAndSharePDF}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate & Share PDF'}
      </button>

      <button
        className="btn btn-secondary"
        onClick={handleDownloadPDF}
        disabled={!pdfUrl}
        style={{ marginLeft: '10px' }}
      >
        Download PDF
      </button>
    </div>
  );
};

export default SharePoster;