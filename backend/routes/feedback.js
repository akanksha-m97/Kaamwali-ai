const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');

router.post('/feedback', async (req, res) => {
  const { employerName, date, emergencyContact, ratings, improvementSuggestions } = req.body;

  if (!employerName || !emergencyContact || !ratings) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Use emergencyContact as primary key
    const worker = await Worker.findOne({ emergencyContact });
    if (!worker) return res.status(404).json({ message: 'Worker not found.' });

    // Add feedback
    worker.feedbacks.push({ employerName, date, ratings, improvementSuggestions });
    await worker.save();

    res.status(200).json({ message: 'Feedback submitted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while submitting feedback.' });
  }
});

module.exports = router;
