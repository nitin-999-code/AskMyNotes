const mongoose = require('mongoose');

// Each "note" is one uploaded file — we store the full extracted text
const noteSchema = new mongoose.Schema({
  filename: String,
  text: String,          // full extracted text from PDF or TXT
  uploadedAt: { type: Date, default: Date.now }
});

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  userId: { type: String, required: true, index: true },  // Clerk user ID — links subject to owner
  notes: [noteSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', subjectSchema);
