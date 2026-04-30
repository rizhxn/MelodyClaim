import jwt from 'jsonwebtoken';
import db from '../database/db.js';

/**
 * Middleware that checks for valid JWT token in Authorization header.
 * If valid, attaches user object to req.user and continues.
 * If invalid or missing, returns 401.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch current user data from database
    const user = db.prepare(`
      SELECT id, email, display_name, role, avatar_url, auth_provider, google_id, github_id, last_login_at, created_at
      FROM users 
      WHERE id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      avatarUrl: user.avatar_url,
      authProvider: user.auth_provider,
      googleLinked: Boolean(user.google_id),
      githubLinked: Boolean(user.github_id),
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at
    };

    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Optional auth — doesn't block if no token, but attaches user if valid token exists
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, email, display_name, role, avatar_url, auth_provider, google_id, github_id, last_login_at, created_at FROM users WHERE id = ?').get(decoded.id);
    req.user = user ? {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      avatarUrl: user.avatar_url,
      authProvider: user.auth_provider,
      googleLinked: Boolean(user.google_id),
      githubLinked: Boolean(user.github_id),
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at
    } : null;
  } catch (err) {
    req.user = null;
  }

  next();
}
