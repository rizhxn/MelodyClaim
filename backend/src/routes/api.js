import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyseHandler, analyseNotesHandler } from '../controllers/analysisController.js';
import { signupHandler, loginHandler } from '../controllers/authController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configure Multer for MIDI file uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `midi-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMime = [
    'audio/midi',
    'audio/x-midi',
    'application/x-midi',
    'application/octet-stream',
  ];

  if ((ext === '.mid' || ext === '.midi') && allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else if (ext === '.mid' || ext === '.midi') {
    // Some systems report MIDI files with generic mimetype
    cb(null, true);
  } else {
    cb(new Error('Only .mid and .midi files are accepted'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// POST /api/analyse
router.post('/analyse', upload.single('midi'), analyseHandler);

// POST /api/analyse/notes
router.post('/analyse/notes', analyseNotesHandler);

// POST /api/signup
router.post('/signup', signupHandler);

// POST /api/login
router.post('/login', loginHandler);

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/corpus — list all songs in corpus
router.get('/corpus', async (req, res) => {
  try {
    const { getCorpus } = await import('../database/seed.js');
    const corpus = getCorpus();
    res.json({
      count: corpus.length,
      songs: corpus.map(c => ({
        id: c.id,
        songName: c.songName,
        artist: c.artist,
        year: c.year,
        intervalCount: c.intervals.length,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
