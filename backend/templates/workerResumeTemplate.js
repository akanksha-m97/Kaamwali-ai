export function workerResumeTemplate(worker) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: A4; margin: 0; }
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f5f5f5;
    }
    .page {
      width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      background: white;
      display: flex;
      box-sizing: border-box;
    }
    .left {
      width: 30%;
      background: #f0f0f0;
      padding: 30px;
      font-size: 14px;
    }
    .right {
      width: 70%;
      padding: 40px;
    }
    .name-box {
      font-size: 36px;
      letter-spacing: 5px;
      border: 2px solid #000;
      text-align: center;
      padding: 25px;
      margin-bottom: 30px;
    }
    h1 { margin: 0; letter-spacing: 3px; font-size: 36px; }
    h3 {
      margin-top: 30px;
      font-size: 13px;
      letter-spacing: 2px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
    }
    h2 {
      font-size: 16px;
      letter-spacing: 2.5px;
      border-bottom: 1px solid #000;
      margin-top: 24px;
      padding-bottom: 4px;
    }
    ul { padding-left: 18px; margin: 8px 0; }
    li { margin-bottom: 8px; font-size: 14px; line-height: 1.7; }
    p { font-size: 14px; line-height: 1.6; margin: 6px 0; }
  </style>
</head>
<body>
  <div class="page">
    <div class="left">
      <h3>INFO</h3>
      <p><b>Location</b><br>${worker.cityArea || '—'}</p>
      <p><b>Phone</b><br>${worker.emergencyContact || '—'}</p>
      ${worker.email ? `<p><b>Email</b><br>${worker.email}</p>` : ''}

      <h3>SKILLS</h3>
      ${(worker.skills || []).map(s => `<p>${s}</p>`).join('') || '<p>—</p>'}

      <h3>LANGUAGES</h3>
      ${(worker.languages && worker.languages.length
        ? worker.languages.map(l => `<p>${l}</p>`).join('')
        : '<p>Hindi</p><p>English</p>'
      )}

      ${worker.expectedSalary ? `<h3>EXPECTED SALARY</h3><p>₹${worker.expectedSalary}/month</p>` : ''}
      ${worker.workType ? `<h3>WORK TYPE</h3><p>${worker.workType}</p>` : ''}
    </div>

    <div class="right">
      <div class="name-box">
        <h1>${(worker.name || 'WORKER').toUpperCase()}</h1>
        <p style="margin:8px 0 0; font-size:14px; letter-spacing:3px; color:#555;">
          ${(worker.skills && worker.skills[0] ? worker.skills[0] : 'DOMESTIC WORKER').toUpperCase()}
        </p>
      </div>

      <h2>PROFILE</h2>
      <p>
        ${worker.bio
          ? worker.bio
          : `Experienced domestic worker with ${worker.experienceYears || 0} years of experience${worker.cityArea ? ` based in ${worker.cityArea}` : ''}. ${worker.skills && worker.skills.length ? 'Skilled in ' + worker.skills.join(', ') + '.' : ''}`
        }
      </p>

      <h2>WORK DETAILS</h2>
      <ul>
        <li>Experience: ${worker.experienceYears || '—'} years</li>
        ${worker.expectedSalary ? `<li>Expected Salary: ₹${worker.expectedSalary}/month</li>` : ''}
        ${worker.workType ? `<li>Work Type: ${worker.workType}</li>` : ''}
        ${worker.daysOff ? `<li>Days Off: ${worker.daysOff}</li>` : ''}
        ${worker.medicalConditions ? `<li>Medical Conditions: ${worker.medicalConditions}</li>` : ''}
      </ul>

      <h2>AVAILABILITY</h2>
      <ul>
        <li>Morning: ${worker.availability?.morning ? 'Yes' : 'No'}</li>
        <li>Afternoon: ${worker.availability?.afternoon ? 'Yes' : 'No'}</li>
        <li>Evening: ${worker.availability?.evening ? 'Yes' : 'No'}</li>
        ${worker.availability?.days ? `<li>Days: ${worker.availability.days}</li>` : ''}
      </ul>

      ${worker.trustScore != null ? `
      <h2>TRUST & VERIFICATION</h2>
      <ul>
        <li>Trust Score: ${worker.trustScore}/100</li>
        ${worker.verificationLevel === 'id' ? '<li>✅ ID Verified</li>' : ''}
        ${worker.verificationLevel === 'police' ? '<li>🔐 Police Verified</li>' : ''}
        <li>Emergency Contact: ${worker.emergencyContact ? 'Added' : 'Not added'}</li>
      </ul>` : ''}
    </div>
  </div>
</body>
</html>
`;
}