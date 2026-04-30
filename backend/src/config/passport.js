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
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google account did not return an email address'), null);
    }

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
        db.prepare(`
          UPDATE users
          SET google_id = ?,
              google_email = ?,
              google_display_name = ?,
              display_name = COALESCE(NULLIF(display_name, ''), ?),
              avatar_url = COALESCE(?, avatar_url),
              auth_provider = CASE WHEN auth_provider = 'email' THEN 'email_google' ELSE auth_provider END,
              last_login_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(googleId, email, displayName, displayName, avatarUrl, user.id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      } else {
        // Create new user
        const result = db.prepare(`
          INSERT INTO users (
            email,
            google_id,
            google_email,
            google_display_name,
            display_name,
            avatar_url,
            password_hash,
            role,
            auth_provider,
            last_login_at
          )
          VALUES (?, ?, ?, ?, ?, ?, '', 'user', 'google', CURRENT_TIMESTAMP)
        `).run(email, googleId, email, displayName, displayName, avatarUrl);

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      }
    } else {
      db.prepare(`
        UPDATE users
        SET google_email = ?,
            google_display_name = ?,
            display_name = COALESCE(NULLIF(display_name, ''), ?),
            avatar_url = COALESCE(?, avatar_url),
            last_login_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(email, displayName, displayName, avatarUrl, user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
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
        db.prepare(`
          UPDATE users
          SET github_id = ?,
              github_email = ?,
              github_display_name = ?,
              display_name = COALESCE(NULLIF(display_name, ''), ?),
              avatar_url = COALESCE(?, avatar_url),
              auth_provider = CASE WHEN auth_provider = 'email' THEN 'email_github' ELSE auth_provider END,
              last_login_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(githubId, email, displayName, displayName, avatarUrl, user.id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      } else {
        const result = db.prepare(`
          INSERT INTO users (
            email,
            github_id,
            github_email,
            github_display_name,
            display_name,
            avatar_url,
            password_hash,
            role,
            auth_provider,
            last_login_at
          )
          VALUES (?, ?, ?, ?, ?, ?, '', 'user', 'github', CURRENT_TIMESTAMP)
        `).run(email, githubId, email, displayName, displayName, avatarUrl);

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      }
    } else {
      db.prepare(`
        UPDATE users
        SET github_email = ?,
            github_display_name = ?,
            display_name = COALESCE(NULLIF(display_name, ''), ?),
            avatar_url = COALESCE(?, avatar_url),
            last_login_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(email, displayName, displayName, avatarUrl, user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    }

    return done(null, user);

  } catch (err) {
    return done(err, null);
  }
}));

export default passport;
