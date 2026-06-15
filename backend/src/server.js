import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/authRoutes.js';
import { isCorpusDatabaseCurrent, seedDatabase } from './database/seed.js';
import passport from './config/passport.js';
import { initializeAutomaton } from './services/automatonManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.FRONTEND_URL) {
  console.error("FATAL ERROR: FRONTEND_URL environment variable is not defined.");
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Ensure uploads directory exists
import fs from 'fs';
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Seed or refresh the corpus database when the built-in/source corpus changes.
if (!isCorpusDatabaseCurrent()) {
  console.log('Corpus database missing or stale, seeding...');
  seedDatabase();
}

// Initialize Aho-Corasick Automaton offline (at server startup)
initializeAutomaton();

// API routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.message === 'Only .mid and .midi files are accepted') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
  }

  res.status(500).json({ error: err.message || 'Internal server error', stack: err.stack });
});

app.listen(PORT, () => {
  console.log(`\n MelodyClaim Backend running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Corpus:       http://localhost:${PORT}/api/corpus\n`);
});