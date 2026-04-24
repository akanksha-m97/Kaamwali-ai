import React, { useState } from 'react';
import { API_BASE } from '../api';

const SharePoster = ({ worker }) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const workerId = worker?._id || worker?.id;

  // Generate PDF and share
  const handleGenerateAndSharePDF = async () => {
    if (!workerId) {
      alert('Worker ID missing');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/workers/${workerId}/generate-pdf`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('PDF generation failed');

      const data = await res.json();
      const url = data.pdfUrl.startsWith('http') ? data.pdfUrl : `${API_BASE}${data.pdfUrl}`;

      // 1️⃣ Save PDF URL in state for download button
      setPdfUrl(url);

      // 2️⃣ Open PDF in new tab
      window.open(url, '_blank');

      // 3️⃣ Share on WhatsApp
      const message = `📄 KaamWali.AI – Worker Profile\n\n${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } catch (err) {
      console.error('PDF generation failed', err);
      alert('Failed to generate PDF.');
    }
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (!pdfUrl) {
      alert("Please generate the PDF first");
      return;
    }

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `worker_${workerId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card">
      <h2 className="card-title">Share profile</h2>

      <p className="text-small">
        Generate a verified PDF to share.
      </p>

      <button
        className="btn btn-primary"
        onClick={handleGenerateAndSharePDF}
      >
        Generate & Share PDF
      </button>

      <button
        className="btn btn-secondary"
        onClick={handleDownloadPDF}
        disabled={!pdfUrl}
        style={{ marginLeft: "10px" }}
      >
        Download PDF
      </button>
    </div>
  );
};

export default SharePoster;
