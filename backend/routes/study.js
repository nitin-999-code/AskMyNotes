const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { generateStudyContent } = require('../services/geminiService');

// POST /study/generate  →  generate MCQs + SAQs for a subject
router.post('/generate', async (req, res) => {
  try {
    const { subjectId } = req.body;
    if (!subjectId) return res.status(400).json({ error: 'subjectId is required' });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    if (subject.notes.length === 0) {
      return res.status(400).json({ error: 'Upload notes for this subject before generating study content' });
    }

    const content = await generateStudyContent(subject.name, subject.notes);
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate study content: ' + err.message });
  }
});

module.exports = router;
