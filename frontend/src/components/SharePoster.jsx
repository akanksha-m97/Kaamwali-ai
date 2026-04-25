import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';
import { API_BASE } from '../api';

const SharePoster = ({ worker }) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const workerId = worker?._id || worker?.id;

  // Generate PDF and share (client-side)
  const handleGenerateAndSharePDF = async () => {
    if (!workerId) {
      alert('Worker ID missing');
      return;
    }

    try {
      // Create resume HTML
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1>${worker.name}</h1>
          <p><strong>Phone:</strong> ${worker.phone}</p>
          <p><strong>Location:</strong> ${worker.cityArea || 'N/A'}</p>
          <p><strong>Skills:</strong> ${worker.skills?.join(', ') || 'N/A'}</p>
          <p><strong>Experience:</strong> ${worker.yearsOfExperience || 0} years</p>
          <p><strong>Verification:</strong> ${worker.isVerified ? '✅ Verified' : '❌ Not Verified'}</p>
          <p><strong>Trust Score:</strong> ${worker.trustScore || 0}%</p>
          <hr>
          <p><strong>About:</strong> ${worker.bio || 'N/A'}</p>
        </div>
      `;

      // Generate PDF
      const opt = {
        margin: 10,
        filename: `worker_${workerId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      await html2pdf().set(opt).from(element).save();

      // Share on WhatsApp
      const message = `📄 KaamWali.AI – Worker Profile for ${worker.name}`;
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
