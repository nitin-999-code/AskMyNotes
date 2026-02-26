const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

// Create uploads folder — use /tmp on Vercel (read-only filesystem)
const uploadsDir = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://ask-my-notes-backend.vercel.app',
      /\.vercel\.app$/,
    ],
  credentials: true,
}));
app.use(express.json());

// ── MongoDB connection caching for serverless ──
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
  });
  isConnected = true;
  console.log('✅ MongoDB connected');
}

// Ensure DB is connected before every request (serverless-safe)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Routes
app.use('/subjects', require('./routes/subjects'));
app.use('/qa', require('./routes/qa'));
app.use('/study', require('./routes/study'));
app.use('/users', require('./routes/users'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', message: 'AskMyNotes API running' }));

// ── Local development: start server normally ──
if (!isVercel) {
  let server;

  connectDB()
    .then(() => {
      server = app.listen(process.env.PORT || 5000, () => {
        console.log(`🚀 Server running on http://localhost:${process.env.PORT || 5000}`);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`❌ Port ${process.env.PORT || 5000} is already in use. Retrying in 2 seconds...`);
          setTimeout(() => {
            server.close();
            server.listen(process.env.PORT || 5000);
          }, 2000);
        } else {
          console.error('❌ Server error:', err.message);
        }
      });
    })
    .catch(err => {
      console.error('❌ MongoDB failed:', err.message);
      process.exit(1);
    });

  // Graceful shutdown
  function shutdown() {
    console.log('🔄 Shutting down gracefully...');
    if (server) {
      server.close(() => {
        mongoose.connection.close(false).then(() => {
          process.exit(0);
        });
      });
    } else {
      process.exit(0);
    }
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Export for Vercel serverless deployment
module.exports = app;
