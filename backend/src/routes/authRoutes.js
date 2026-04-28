import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/db.js';
import { requireAuth } from '../middleware/auth.js';
import passport from '../config/passport.js';

const router = express.Router();

// ══════════════════════════════════════════════════════════════
// Email/Password Authentication
// ══════════════════════════════════════════════════════════════

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  const displayName = name; // alias

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, display_name, role)
      VALUES (?, ?, ?, 'user')
    `).run(email, passwordHash, displayName || email.split('@')[0]);

    const userId = result.lastInsertRowid;

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email, role: 'user' },
      process.env.JWT_SECRET || 'melodyclaim_jwt_secret_change_in_production',
      { expiresIn: '7d' }
    );

    // Return user data + token
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        displayName: displayName || email.split('@')[0],
        role: 'user'
      }
    });

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error during signup' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'melodyclaim_jwt_secret_change_in_production',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        avatarUrl: user.avatar_url
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me — verify token and return current user
router.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
});

// ══════════════════════════════════════════════════════════════
// OAuth Routes
// ══════════════════════════════════════════════════════════════

// Google OAuth
router.get('/google', (req, res, next) => {
  const cid = process.env.GOOGLE_CLIENT_ID;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  if (!cid || cid === 'your_google_client_id_here' || cid === 'dummy_id') {
    return res.redirect(`${frontendUrl}/login?error=Google_OAuth_Client_ID_Missing_In_.env`);
  }
  next();
}, passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed` }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET || 'melodyclaim_jwt_secret_change_in_production',
      { expiresIn: '7d' }
    );
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  }
);

// GitHub OAuth
router.get('/github', (req, res, next) => {
  const cid = process.env.GITHUB_CLIENT_ID;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  if (!cid || cid === 'your_github_client_id_here' || cid === 'dummy_id') {
    return res.redirect(`${frontendUrl}/login?error=GitHub_OAuth_Client_ID_Missing_In_.env`);
  }
  next();
}, passport.authenticate('github', { 
  scope: ['user:email'],
  session: false 
}));

router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed` }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET || 'melodyclaim_jwt_secret_change_in_production',
      { expiresIn: '7d' }
    );
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  }
);

export default router;
