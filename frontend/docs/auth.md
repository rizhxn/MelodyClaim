# MelodyClaim Authentication System — Full Implementation Prompt

## Current State

I have two authentication UI pages built in React:
1. **Login page** ("Welcome Back") — `/login`
2. **Signup page** ("Get started with Us") — `/signup`

Both pages have:
- Google OAuth button
- GitHub OAuth button  
- Email input field
- "Back to Home" navigation

**The UI exists but nothing is wired up.** Clicking any button does nothing. No backend endpoints exist yet.

---

## Target Architecture

### Tech Stack (Already in Place)
- **Backend**: Node.js + Express + better-sqlite3
- **Frontend**: React + TypeScript + Tailwind CSS
- **Auth**: JWT tokens + OAuth 2.0 (Google, GitHub)
- **Database**: SQLite (already configured at `/melodyclaim.db`)

### What Needs to Be Built

**Backend (Node.js/Express):**
1. Auth routes: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`
2. OAuth routes: `/api/auth/google`, `/api/auth/google/callback`, `/api/auth/github`, `/api/auth/github/callback`
3. JWT middleware for protecting routes
4. Password hashing with bcryptjs
5. Session/token management

**Frontend (React):**
1. Login form with email/password submission
2. Signup form with email/password/name submission  
3. OAuth button click handlers that redirect to backend OAuth routes
4. Token storage in localStorage
5. Auth context provider for app-wide auth state
6. Protected route wrapper component

**Database:**
The `users` table already exists from the seed script:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

Add columns for OAuth:
```sql
ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN github_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
```

---

## Implementation Requirements

### Part 1 — Backend Auth Routes

Create `/backend/src/routes/authRoutes.js`:

```javascript
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../database/db')

// ══════════════════════════════════════════════════════════════
// Email/Password Authentication
// ══════════════════════════════════════════════════════════════

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, displayName } = req.body

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  try {
    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert user
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, display_name, role)
      VALUES (?, ?, ?, 'user')
    `).run(email, passwordHash, displayName || email.split('@')[0])

    const userId = result.lastInsertRowid

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

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
    })

  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ error: 'Server error during signup' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

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
    })

  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Server error during login' })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // With JWT, logout is client-side (delete token from localStorage)
  // This endpoint exists for consistency and future server-side session handling
  return res.status(200).json({ success: true, message: 'Logged out' })
})

// GET /api/auth/me — verify token and return current user
router.get('/me', requireAuth, (req, res) => {
  // req.user is set by requireAuth middleware
  return res.status(200).json({
    success: true,
    user: req.user
  })
})

module.exports = router
```

### Part 2 — JWT Authentication Middleware

Create `/backend/src/middleware/auth.js`:

```javascript
const jwt = require('jsonwebtoken')
const db = require('../database/db')

/**
 * Middleware that checks for valid JWT token in Authorization header.
 * If valid, attaches user object to req.user and continues.
 * If invalid or missing, returns 401.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Fetch current user data from database
    const user = db.prepare(`
      SELECT id, email, display_name, role, avatar_url 
      FROM users 
      WHERE id = ?
    `).get(decoded.id)

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      avatarUrl: user.avatar_url
    }

    next()

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/**
 * Optional auth — doesn't block if no token, but attaches user if valid token exists
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null
    return next()
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = db.prepare('SELECT id, email, display_name, role, avatar_url FROM users WHERE id = ?').get(decoded.id)
    req.user = user ? {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      avatarUrl: user.avatar_url
    } : null
  } catch (err) {
    req.user = null
  }

  next()
}

module.exports = { requireAuth, optionalAuth }
```

### Part 3 — OAuth Setup (Google & GitHub)

Install passport dependencies:
```bash
npm install passport passport-google-oauth20 passport-github2
```

Create `/backend/src/config/passport.js`:

```javascript
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const GitHubStrategy = require('passport-github2').Strategy
const db = require('../database/db')
const jwt = require('jsonwebtoken')

// ══════════════════════════════════════════════════════════════
// Google OAuth Strategy
// ══════════════════════════════════════════════════════════════

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value
    const googleId = profile.id
    const displayName = profile.displayName
    const avatarUrl = profile.photos[0]?.value

    // Check if user exists by google_id
    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId)

    if (!user) {
      // Check if user exists by email
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)

      if (user) {
        // Link Google account to existing user
        db.prepare('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?')
          .run(googleId, avatarUrl, user.id)
      } else {
        // Create new user
        const result = db.prepare(`
          INSERT INTO users (email, google_id, display_name, avatar_url, password_hash, role)
          VALUES (?, ?, ?, ?, '', 'user')
        `).run(email, googleId, displayName, avatarUrl)
        
        user = { id: result.lastInsertRowid, email, display_name: displayName, role: 'user', avatar_url: avatarUrl }
      }
    }

    return done(null, user)

  } catch (err) {
    return done(err, null)
  }
}))

// ══════════════════════════════════════════════════════════════
// GitHub OAuth Strategy
// ══════════════════════════════════════════════════════════════

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || `${profile.username}@github.local`
    const githubId = profile.id
    const displayName = profile.displayName || profile.username
    const avatarUrl = profile.photos?.[0]?.value

    let user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(githubId)

    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)

      if (user) {
        db.prepare('UPDATE users SET github_id = ?, avatar_url = ? WHERE id = ?')
          .run(githubId, avatarUrl, user.id)
      } else {
        const result = db.prepare(`
          INSERT INTO users (email, github_id, display_name, avatar_url, password_hash, role)
          VALUES (?, ?, ?, ?, '', 'user')
        `).run(email, githubId, displayName, avatarUrl)
        
        user = { id: result.lastInsertRowid, email, display_name: displayName, role: 'user', avatar_url: avatarUrl }
      }
    }

    return done(null, user)

  } catch (err) {
    return done(err, null)
  }
}))

module.exports = passport
```

Add OAuth routes to `/backend/src/routes/authRoutes.js`:

```javascript
const passport = require('../config/passport')

// Google OAuth
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}))

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login?error=oauth_failed' }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/auth/callback?token=${token}`)
  }
)

// GitHub OAuth
router.get('/github', passport.authenticate('github', { 
  scope: ['user:email'],
  session: false 
}))

router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: 'http://localhost:5173/login?error=oauth_failed' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.redirect(`http://localhost:5173/auth/callback?token=${token}`)
  }
)
```

### Part 4 — Update Express App

In `/backend/src/app.js`, add:

```javascript
const passport = require('./config/passport')
const authRoutes = require('./routes/authRoutes')

// Add after existing middleware
app.use(passport.initialize())

// Mount auth routes
app.use('/api/auth', authRoutes)
```

### Part 5 — Environment Variables

Add to `/backend/.env`:

```bash
JWT_SECRET=melodyclaim_jwt_secret_change_in_production

# Google OAuth (get from https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# GitHub OAuth (get from https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
```

---

## Frontend Implementation

### Part 6 — Auth Context Provider

Create `/frontend/src/contexts/AuthContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  email: string
  displayName: string
  role: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => void
  loginWithGoogle: () => void
  loginWithGitHub: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch('http://localhost:3001/api/auth/me', {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        })

        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          setToken(storedToken)
        } else {
          localStorage.removeItem('token')
          setToken(null)
        }
      } catch (err) {
        console.error('Token verification failed:', err)
        localStorage.removeItem('token')
        setToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    verifyToken()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await res.json()
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const signup = async (email: string, password: string, displayName?: string) => {
    const res = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Signup failed')
    }

    const data = await res.json()
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const loginWithGoogle = () => {
    window.location.href = 'http://localhost:3001/api/auth/google'
  }

  const loginWithGitHub = () => {
    window.location.href = 'http://localhost:3001/api/auth/github'
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, loginWithGoogle, loginWithGitHub }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

### Part 7 — OAuth Callback Handler Page

Create `/frontend/src/pages/AuthCallback.tsx`:

```typescript
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      navigate('/login?error=' + error)
      return
    }

    if (token) {
      localStorage.setItem('token', token)
      // Force page reload to trigger AuthContext verification
      window.location.href = '/'
    } else {
      navigate('/login')
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white">Completing authentication...</p>
    </div>
  )
}
```

### Part 8 — Update Login Page

Modify your existing login page component:

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, loginWithGoogle, loginWithGitHub } = useAuth()
  const navigate = useNavigate()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Your existing UI container */}
      <div className="border border-gray-700 rounded-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Welcome Back</h1>
        
        <p className="text-center text-gray-400 mb-4">Continue with</p>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={loginWithGoogle}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors"
          >
            {/* Google icon */}
            <span className="text-white">Google</span>
          </button>
          
          <button
            onClick={loginWithGitHub}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors"
          >
            {/* GitHub icon */}
            <span className="text-white">GitHub</span>
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-black text-gray-400">OR</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 mb-4 bg-transparent border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 mb-4 bg-transparent border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
            required
          />

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-white text-black rounded-md font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account? <a href="/signup" className="text-purple-400 hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  )
}
```

### Part 9 — Update Signup Page

Similar structure to login, use `signup` from `useAuth()` instead.

### Part 10 — Protected Route Component

Create `/frontend/src/components/ProtectedRoute.tsx`:

```typescript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

Use it in your router:
```typescript
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

---

## OAuth Setup Instructions

### Google OAuth

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Navigate to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Authorized redirect URIs: `http://localhost:3001/api/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### GitHub OAuth

1. Go to https://github.com/settings/developers
2. New OAuth App
3. Authorization callback URL: `http://localhost:3001/api/auth/github/callback`
4. Copy Client ID and Secret to `.env`

---

## Testing Checklist

- [ ] Email signup creates user in database
- [ ] Email login returns JWT token
- [ ] Google OAuth redirects and creates/links user
- [ ] GitHub OAuth redirects and creates/links user
- [ ] JWT token stored in localStorage
- [ ] Protected routes redirect to login when not authenticated
- [ ] `/api/auth/me` returns user data with valid token
- [ ] Logout clears token and redirects

---

## Final Integration Steps

1. Install backend dependencies: `passport passport-google-oauth20 passport-github2`
2. Create all backend files listed above
3. Add auth routes to Express app
4. Update database schema (add OAuth columns)
5. Set up OAuth apps on Google/GitHub
6. Add credentials to `.env`
7. Wrap React app in `<AuthProvider>`
8. Add `/auth/callback` route
9. Update login/signup pages with hooks
10. Test full flow

This gives you complete authentication with email/password and OAuth.