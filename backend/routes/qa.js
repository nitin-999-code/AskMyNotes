const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { answerQuestion } = require('../services/geminiService');

// POST /qa/ask  →  ask a question about one subject's notes
router.post('/ask', async (req, res) => {
  try {
    const { subjectId, question, history } = req.body;
    if (!subjectId || !question) return res.status(400).json({ error: 'subjectId and question are required' });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    if (subject.notes.length === 0) {
      return res.json({
        notFound: true,
        answer: `No notes uploaded for "${subject.name}" yet. Please upload files first.`,
        confidence: 'Low',
        sourceFiles: [],
        evidenceSnippets: []
      });
    }

    const result = await answerQuestion(subject.name, question, subject.notes, history);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
