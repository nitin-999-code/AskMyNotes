const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Subject = require('../models/Subject');
const { extractText } = require('../services/pdfParser');

// Store uploads temporarily — use /tmp on Vercel (read-only filesystem)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../uploads/');

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max per file
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.txt'].includes(ext)) cb(null, true);
    else cb(new Error('Only PDF or TXT files are allowed'));
  }
});

// Helper — get userId from header or query
function getUserId(req) {
  return req.headers['x-user-id'] || req.query.userId || null;
}

// GET /subjects  →  list subjects for this user only
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'userId required' });

    const subjects = await Subject.find({ userId }, 'name notes.filename createdAt').lean();
    const result = subjects.map(s => ({
      _id: s._id,
      name: s.name,
      fileNames: s.notes.map(n => n.filename),
      noteCount: s.notes.length,
      createdAt: s.createdAt
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /subjects  →  create a new subject for this user (max 3 per user)
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'userId required' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'Subject name is required' });

    const count = await Subject.countDocuments({ userId });
    if (count >= 3) return res.status(400).json({ error: 'Maximum 3 subjects allowed' });

    const subject = await Subject.create({ name: name.trim(), userId, notes: [] });
    res.status(201).json({
      _id: subject._id,
      name: subject.name,
      fileNames: [],
      noteCount: 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /subjects/:id/upload  →  upload PDF/TXT files for a subject
router.post('/:id/upload', upload.array('files', 10), async (req, res) => {
  const results = [];

  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'userId required' });

    const subject = await Subject.findOne({ _id: req.params.id, userId });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    for (const file of req.files) {
      try {
        const text = await extractText(file.path, file.originalname);
        subject.notes.push({ filename: file.originalname, text });
        results.push({ filename: file.originalname, status: 'ok', chars: text.length });
      } catch (err) {
        results.push({ filename: file.originalname, status: 'error', error: err.message });
      } finally {
        fs.unlink(file.path, () => { }); // delete temp file
      }
    }

    await subject.save();
    res.json({ uploaded: results, noteCount: subject.notes.length });
  } catch (err) {
    for (const file of req.files || []) fs.unlink(file.path, () => { });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /subjects/:id  →  delete a subject (owned by this user)
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'userId required' });

    const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deleted', _id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /subjects/:id  →  rename a subject (owned by this user)
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'userId required' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'Subject name is required' });

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId },
      { name: name.trim() },
      { new: true }
    );
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ _id: subject._id, name: subject.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
