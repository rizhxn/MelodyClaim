import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import db from '../database/db.js';
import jwt from 'jsonwebtoken';

// ══════════════════════════════════════════════════════════════
// Google OAuth Strategy
// ══════════════════════════════════════════════════════════════

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const googleId = profile.id;
    const displayName = profile.displayName;
    const avatarUrl = profile.photos[0]?.value;

    // Check if user exists by google_id
    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

    if (!user) {
      // Check if user exists by email
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      if (user) {
        // Link Google account to existing user
        db.prepare('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?')
          .run(googleId, avatarUrl, user.id);
      } else {
        // Create new user
        const result = db.prepare(`
          INSERT INTO users (email, google_id, display_name, avatar_url, password_hash, role)
          VALUES (?, ?, ?, ?, '', 'user')
        `).run(email, googleId, displayName, avatarUrl);

        user = { id: result.lastInsertRowid, email, display_name: displayName, role: 'user', avatar_url: avatarUrl };
      }
    }

    return done(null, user);

  } catch (err) {
    return done(err, null);
  }
}));

// ══════════════════════════════════════════════════════════════
// GitHub OAuth Strategy
// ══════════════════════════════════════════════════════════════

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID || 'dummy_id',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy_secret',
  callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
    const githubId = profile.id;
    const displayName = profile.displayName || profile.username;
    const avatarUrl = profile.photos?.[0]?.value;

    let user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(githubId);

    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      if (user) {
        db.prepare('UPDATE users SET github_id = ?, avatar_url = ? WHERE id = ?')
          .run(githubId, avatarUrl, user.id);
      } else {
        const result = db.prepare(`
          INSERT INTO users (email, github_id, display_name, avatar_url, password_hash, role)
          VALUES (?, ?, ?, ?, '', 'user')
        `).run(email, githubId, displayName, avatarUrl);

        user = { id: result.lastInsertRowid, email, display_name: displayName, role: 'user', avatar_url: avatarUrl };
      }
    }

    return done(null, user);

  } catch (err) {
    return done(err, null);
  }
}));

export default passport;
