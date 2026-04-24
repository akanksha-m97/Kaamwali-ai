export function workerResumeTemplate(worker) {

  const skills = Array.isArray(worker.skills)
    ? worker.skills
    : (worker.skills || "").split(",").map(s => s.trim());

  const employmentHistory = [
    {
      role: "Housekeeper",
      place: "Private Residence",
      period: "2019 – 2023",
      points: [
        "Daily cleaning, mopping, dusting, and laundry",
        "Maintained kitchen hygiene and household supplies"
      ]
    },
    {
      role: "Housekeeper",
      place: "Apartment Services",
      period: "2016 – 2019",
      points: [
        "Cleaning multiple homes on a daily schedule",
        "Assisted elderly clients with daily chores"
      ]
    }
  ];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
    @page {
  size: A4;
  margin: 0;
}
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f5f5f5;
    }
    .page {
  width: 794px;
  height: 1123px;
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
      font-size: 42px;
  letter-spacing: 5px;
      border: 2px solid #000;
      text-align: center;
      padding: 25px;
      margin-bottom: 30px;
    }
    h1 { margin: 0; letter-spacing: 3px; }
    h3 {
      margin-top: 30px;
      font-size: 13px;
      letter-spacing: 2px;
      border-bottom: 1px solid #ccc;
    }
    h2 {
    font-size: 16px;
  letter-spacing: 2.5px;
      border-bottom: 1px solid #000;
    }
    ul { padding-left: 18px; }
    li { margin-bottom: 8px;
      font-size: 16px;
  line-height: 1.7; }
  </style>
</head>

<body>
  <div class="page">
    <div class="left">
      <h3>INFO</h3>
      <p><b>Location</b><br>${worker.cityArea || ""}</p>
      <p><b>Phone</b><br>${worker.emergencyContact || ""}</p>

      <h3>SKILLS</h3>
      ${(worker.skills || []).map(s => `<p>${s}</p>`).join("")}

      <h3>LANGUAGES</h3>
      <p>Hindi</p>
      <p>English</p>
    </div>

    <div class="right">
      <div class="name-box">
        <h1>${worker.name || "HOUSEKEEPER"}</h1>
        <p>HOUSEKEEPER</p>
      </div>

      <h2>PROFILE</h2>
      <p>
        Experienced house worker with ${worker.experienceYears || 0} years of experience.
      </p>

       <h2>EMPLOYMENT HISTORY</h2>
    ${employmentHistory.map(job => `
      <div class="job">
        <div class="job-title">${job.role}, ${job.place}</div>
        <div class="job-meta">${job.period}</div>
        <ul>
          ${job.points.map(p => `<li>${p}</li>`).join("")}
        </ul>
      </div>
    `).join("")}

      <h2>WORK DETAILS</h2>
      <ul>
        <li>Experience: ${worker.experienceYears} years</li>
        <li>Expected Salary: ₹${worker.expectedSalary}</li>
        <li>Work Type: ${worker.workType}</li>
        <li>Days Off: ${worker.daysOff}</li>
      </ul>

      <h2>AVAILABILITY</h2>
      <ul>
        <li>Morning: ${worker.availability?.morning ? "Yes" : "No"}</li>
        <li>Afternoon: ${worker.availability?.afternoon ? "Yes" : "No"}</li>
        <li>Evening: ${worker.availability?.evening ? "Yes" : "No"}</li>
      </ul>
    </div>
  </div>
</body>
</html>
`;
}
