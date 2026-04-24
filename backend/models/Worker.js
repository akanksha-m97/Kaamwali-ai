const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  employerName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  ratings: {
    workQuality: Number,
    reliability: String,
    attentionToDetail: String,
    professionalism: String,
    skillCompetence: String,
    overallSatisfaction: String,
  },
  improvementSuggestions: String,
});

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emergencyContact: { type: String, required: true, unique: true }, // primary key
  role: String,
  feedbacks: [feedbackSchema],
});

module.exports = mongoose.model('Worker', workerSchema);
