const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/subjects', require('./routes/subjects'));
app.use('/qa', require('./routes/qa'));
app.use('/study', require('./routes/study'));
app.use('/users', require('./routes/users'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', message: 'AskMyNotes API running' }));

// Connect MongoDB → Start Server
let server;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server = app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT || 5000}`);
    });

    // Handle port already in use gracefully (don't crash nodemon)
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

// Graceful shutdown — ensures nodemon can restart cleanly without EADDRINUSE
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

// Export for Vercel serverless deployment
module.exports = app;
