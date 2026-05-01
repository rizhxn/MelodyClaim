MelodyClaim — Backend Implementation Guide
Complete MIDI Pipeline Setup
---
Before You Start
This guide builds the backend in one strict order:
Project setup → Database → MIDI Parser → Interval Encoder → Aho-Corasick → Threshold Filter → Verdict Generator → API Route
Do not skip ahead. Each step depends on the one before it. Test every step before moving to the next.
Prerequisites — install these before anything else:
Node.js v18 or above
npm
A REST client to test endpoints (Postman, Insomnia, or Thunder Client in VS Code)
---
Step 1 — Project Structure
Create this exact folder structure manually before writing any code:
```
melodyclaim/
└── backend/
    ├── src/
    │   ├── controllers/
    │   │   ├── analysisController.js
    │   │   └── corpusController.js
    │   ├── services/
    │   │   ├── midiParser.js
    │   │   ├── intervalEncoder.js
    │   │   ├── ahoCorasick.js
    │   │   ├── thresholdFilter.js
    │   │   └── verdictGenerator.js
    │   ├── routes/
    │   │   ├── analysisRoutes.js
    │   │   └── corpusRoutes.js
    │   ├── middleware/
    │   │   └── upload.js
    │   ├── database/
    │   │   ├── db.js
    │   │   └── seed.js
    │   └── app.js
    ├── corpus/
    │   └── midi/
    ├── uploads/
    │   └── temp/
    ├── .env
    ├── server.js
    └── package.json
```
---
Step 2 — Initialise the Project
```bash
cd melodyclaim/backend
npm init -y
```
Install all dependencies at once:
```bash
npm install express better-sqlite3 @tonejs/midi multer dotenv cors bcryptjs jsonwebtoken
npm install --save-dev nodemon
```
What each package does:
`express` — HTTP server and routing
`better-sqlite3` — SQLite database, synchronous API, no callback hell
`@tonejs/midi` — parses binary MIDI files into clean JavaScript objects
`multer` — handles multipart file uploads (the MIDI file coming from the frontend)
`dotenv` — loads environment variables from .env file
`cors` — allows the React frontend to talk to this backend
`bcryptjs` — hashes passwords, used for user accounts
`jsonwebtoken` — creates and verifies JWT tokens for auth
`nodemon` — restarts server automatically on file changes during development
---
Step 3 — Environment Variables
Open `.env` and add:
```
PORT=3001
JWT_SECRET=melodyclaim_secret_change_this_in_production
ADMIN_KEY=melodyclaim_admin_2025
DB_PATH=./melodyclaim.db
```
Never commit this file to GitHub. Add `.env` to your `.gitignore`.
---
Step 4 — package.json Scripts
Open `package.json` and replace the scripts section:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "seed": "node src/database/seed.js"
}
```
---
Step 5 — Database Setup
`src/database/db.js`
This file creates the database connection and exports it.
Every other file that needs the database imports from here.
```javascript
const Database = require('better-sqlite3')
const path = require('path')
require('dotenv').config()

const dbPath = path.resolve(process.env.DB_PATH || './melodyclaim.db')

const db = new Database(dbPath)

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Create all tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS corpus_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_name TEXT NOT NULL,
    artist TEXT NOT NULL,
    year INTEGER,
    midi_filename TEXT,
    note_sequence TEXT NOT NULL,
    interval_sequence TEXT NOT NULL,
    sequence_length INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    added_by TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analysis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    original_filename TEXT,
    query_intervals TEXT NOT NULL,
    verdict TEXT NOT NULL,
    matched_song_id INTEGER REFERENCES corpus_songs(id),
    match_length INTEGER,
    matched_sequence TEXT,
    query_start INTEGER,
    query_end INTEGER,
    reference_start INTEGER,
    reference_end INTEGER,
    analysed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

module.exports = db
```
---
`src/database/seed.js`
Run this once to populate the reference corpus.
These interval sequences are representative sequences for demonstration.
```javascript
const db = require('./db')

const corpus = [
  {
    song_name: 'Got To Give It Up',
    artist: 'Marvin Gaye',
    year: 1977,
    midi_filename: 'got_to_give_it_up.mid',
    note_sequence: '[67,69,71,69,67,65,67,69,67,65,64,65]',
    interval_sequence: '[2,2,-2,-2,-2,2,2,-2,-2,-1,1]',
    sequence_length: 11
  },
  {
    song_name: 'Blurred Lines',
    artist: 'Robin Thicke',
    year: 2013,
    midi_filename: 'blurred_lines.mid',
    note_sequence: '[67,69,71,69,67,65,67,69,67,65,64,65]',
    interval_sequence: '[2,2,-2,-2,-2,2,2,-2,-2,-1,1]',
    sequence_length: 11
  },
  {
    song_name: 'Shape of You',
    artist: 'Ed Sheeran',
    year: 2017,
    midi_filename: 'shape_of_you.mid',
    note_sequence: '[64,66,68,66,64,62,64,66,64,62,61,62]',
    interval_sequence: '[2,2,-2,-2,-2,2,2,-2,-2,-1,1]',
    sequence_length: 11
  },
  {
    song_name: 'No Scrubs',
    artist: 'TLC',
    year: 1999,
    midi_filename: 'no_scrubs.mid',
    note_sequence: '[64,66,68,66,64,62,64,66,64,62,61,62]',
    interval_sequence: '[2,2,-2,-2,-2,2,2,-2,-2,-1,1]',
    sequence_length: 11
  },
  {
    song_name: "He's So Fine",
    artist: 'The Chiffons',
    year: 1963,
    midi_filename: 'hes_so_fine.mid',
    note_sequence: '[60,62,64,62,60,59,60,62,64,62,60,59]',
    interval_sequence: '[2,2,-2,-2,-1,1,2,2,-2,-2,-1]',
    sequence_length: 11
  },
  {
    song_name: 'My Sweet Lord',
    artist: 'George Harrison',
    year: 1970,
    midi_filename: 'my_sweet_lord.mid',
    note_sequence: '[60,62,64,62,60,59,60,62,64,62,60,59]',
    interval_sequence: '[2,2,-2,-2,-1,1,2,2,-2,-2,-1]',
    sequence_length: 11
  },
  {
    song_name: 'Bohemian Rhapsody',
    artist: 'Queen',
    year: 1975,
    midi_filename: 'bohemian_rhapsody.mid',
    note_sequence: '[60,64,67,64,60,57,60,64,67,71,69,67]',
    interval_sequence: '[4,3,-3,-4,3,3,4,4,-2,-2,-2]',
    sequence_length: 11
  },
  {
    song_name: 'Happy Birthday',
    artist: 'Traditional',
    year: 1893,
    midi_filename: 'happy_birthday.mid',
    note_sequence: '[60,60,62,60,65,64,60,60,62,60,67,65]',
    interval_sequence: '[0,2,-2,5,-1,-4,0,2,-2,7,-2]',
    sequence_length: 11
  }
]

function seed() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM corpus_songs').get()

  if (existing.count > 0) {
    console.log(`Corpus already has ${existing.count} songs. Skipping seed.`)
    console.log('To reseed, delete melodyclaim.db and run again.')
    process.exit(0)
  }

  const insert = db.prepare(`
    INSERT INTO corpus_songs 
    (song_name, artist, year, midi_filename, note_sequence, interval_sequence, sequence_length)
    VALUES 
    (@song_name, @artist, @year, @midi_filename, @note_sequence, @interval_sequence, @sequence_length)
  `)

  const insertMany = db.transaction(songs => {
    for (const song of songs) {
      insert.run(song)
    }
  })

  insertMany(corpus)

  const result = db.prepare('SELECT COUNT(*) as count FROM corpus_songs').get()
  console.log(`✓ Seeded ${result.count} songs into corpus_songs table`)
}

seed()
```
Run this now before anything else:
```bash
npm run seed
```
Expected output:
```
✓ Seeded 8 songs into corpus_songs table
```
---
Step 6 — MIDI Parser
`src/services/midiParser.js`
This is the entry point of the entire pipeline.
It takes a raw MIDI file buffer and returns a clean array of MIDI note integers.
```javascript
const { Midi } = require('@tonejs/midi')

/**
 * Parses a MIDI file buffer and extracts the primary melodic track.
 * 
 * Strategy for identifying the melodic track:
 * 1. Filter out drum tracks (channel 9 in MIDI is always drums)
 * 2. From remaining tracks, pick the one with the most notes
 * 3. Sort notes by start time to get them in sequence
 * 4. Return the MIDI note numbers as a plain integer array
 * 
 * @param {Buffer} buffer - Raw MIDI file buffer from multer
 * @returns {{ notes: number[], trackName: string, trackIndex: number }}
 * @throws {Error} if file is invalid or has no melodic content
 */
function parseMidi(buffer) {
  let midi

  try {
    midi = new Midi(buffer)
  } catch (err) {
    throw new Error('Invalid MIDI file. Could not parse.')
  }

  if (!midi.tracks || midi.tracks.length === 0) {
    throw new Error('MIDI file contains no tracks.')
  }

  // Filter out drum tracks — MIDI channel 10 (index 9) is always percussion
  const melodicTracks = midi.tracks.filter(track => {
    const hasDrums = track.notes.some(note => note.midi === 9)
    const isDrumChannel = track.channel === 9
    return !isDrumChannel && !hasDrums && track.notes.length > 0
  })

  if (melodicTracks.length === 0) {
    throw new Error('No melodic tracks found. File may contain only drums.')
  }

  // Pick the track with the most notes as the primary melody
  const primaryTrack = melodicTracks.reduce((best, track) =>
    track.notes.length > best.notes.length ? track : best
  )

  if (primaryTrack.notes.length < 4) {
    throw new Error('Melody is too short. Minimum 4 notes required.')
  }

  // Sort notes by start time and extract MIDI note numbers
  const notes = primaryTrack.notes
    .sort((a, b) => a.ticks - b.ticks)
    .map(note => note.midi)

  return {
    notes,
    trackName: primaryTrack.name || `Track ${midi.tracks.indexOf(primaryTrack)}`,
    trackIndex: midi.tracks.indexOf(primaryTrack),
    totalNotes: notes.length
  }
}

module.exports = { parseMidi }
```
Test this in isolation before moving on.
Create a file `test_parser.js` in the backend root:
```javascript
const fs = require('fs')
const { parseMidi } = require('./src/services/midiParser')

// Use any .mid file you have for testing
// You can download free MIDI files from bitmidi.com
const buffer = fs.readFileSync('./test.mid')
const result = parseMidi(buffer)

console.log('Track name:', result.trackName)
console.log('Note count:', result.totalNotes)
console.log('First 10 notes:', result.notes.slice(0, 10))
```
Run: `node test_parser.js`
Expected output shape:
```
Track name: Piano
Note count: 47
First 10 notes: [60, 62, 64, 62, 60, 59, 57, 59, 60, 62]
```
---
Step 7 — Interval Encoder
`src/services/intervalEncoder.js`
Takes the note array from the parser and produces the interval sequence.
This is the function that makes the system key-agnostic.
```javascript
/**
 * Encodes a sequence of MIDI note numbers into an interval sequence.
 * 
 * An interval is the signed semitone difference between consecutive notes.
 * Example: [60, 64, 67, 64, 62] → [+4, +3, -3, -2]
 * 
 * This encoding is pitch-transposition-invariant:
 * The same melody in any key produces the same interval sequence.
 * 
 * Edge cases handled:
 * - Repeated notes → interval of 0 (kept, not removed)
 * - Large jumps (octave+) → preserved as large positive/negative values
 * - Arrays shorter than 2 notes → returns empty array
 * 
 * @param {number[]} notes - Array of MIDI note integers (0-127)
 * @returns {number[]} Array of signed integer intervals
 */
function encodeIntervals(notes) {
  if (!Array.isArray(notes)) {
    throw new Error('Input must be an array of note numbers')
  }

  if (notes.length < 2) {
    return []
  }

  // Validate all values are MIDI note numbers (0-127)
  const invalid = notes.find(n => typeof n !== 'number' || n < 0 || n > 127)
  if (invalid !== undefined) {
    throw new Error(`Invalid MIDI note value: ${invalid}. Must be 0-127.`)
  }

  return notes.slice(1).map((note, index) => note - notes[index])
}

/**
 * Converts an interval sequence back to a human-readable notation.
 * Used for display purposes in the frontend only.
 * Example: [4, 3, -3, -2] → ["U4", "U3", "D3", "D2"]
 * 
 * @param {number[]} intervals
 * @returns {string[]}
 */
function intervalsToDisplay(intervals) {
  return intervals.map(i => {
    if (i > 0) return `U${i}`
    if (i < 0) return `D${Math.abs(i)}`
    return 'R'
  })
}

module.exports = { encodeIntervals, intervalsToDisplay }
```
Test this immediately:
Add to your `test_parser.js`:
```javascript
const { encodeIntervals, intervalsToDisplay } = require('./src/services/intervalEncoder')

const notes = [60, 64, 67, 64, 62]
const intervals = encodeIntervals(notes)
console.log('Intervals:', intervals)
// Expected: [4, 3, -3, -2]

// Test transposition invariance
const sameInF = [65, 69, 72, 69, 67]
const intervalsF = encodeIntervals(sameInF)
console.log('Same melody in F:', intervalsF)
// Expected: [4, 3, -3, -2] — identical to above

console.log('Display format:', intervalsToDisplay(intervals))
// Expected: ['U4', 'U3', 'D3', 'D2']
```
If both interval arrays are identical, the encoder is working correctly.
---
Step 8 — Aho-Corasick Engine
`src/services/ahoCorasick.js`
This is the most complex file in the project.
Read the comments carefully — they explain what each phase does.
```javascript
/**
 * Aho-Corasick Multi-Pattern String Matching
 * 
 * Builds a finite automaton over a set of integer patterns (interval sequences)
 * and searches a text (query interval sequence) in linear time O(n + m + z)
 * where n = text length, m = total pattern length, z = number of matches.
 * 
 * Unlike searching each pattern separately (O(n * k) for k patterns),
 * this searches all patterns simultaneously in a single pass.
 */

/**
 * PHASE 1 — Build the trie (goto function)
 * 
 * A trie is a tree where each path from root to a node
 * represents a prefix of one or more patterns.
 * 
 * Each node stores:
 * - goto: map of interval value → next node index
 * - fail: failure link (computed in phase 2)
 * - output: list of pattern indices that end at this node
 * 
 * @param {number[][]} patterns - Array of interval sequences
 * @returns {{ goto: Map[], fail: number[], output: number[][] }}
 */
function buildAutomaton(patterns) {
  // Node 0 is the root
  const gotoFn = [new Map()]  // gotoFn[state][symbol] = nextState
  const fail = [0]             // fail[state] = fallback state
  const output = [[]]          // output[state] = [patternIndex, ...]

  // ── Phase 1: Build the trie ──────────────────────────────────────────────

  for (let patternIndex = 0; patternIndex < patterns.length; patternIndex++) {
    const pattern = patterns[patternIndex]
    let currentState = 0

    for (const symbol of pattern) {
      if (!gotoFn[currentState].has(symbol)) {
        // Create a new state
        gotoFn.push(new Map())
        fail.push(0)
        output.push([])
        gotoFn[currentState].set(symbol, gotoFn.length - 1)
      }
      currentState = gotoFn[currentState].get(symbol)
    }

    // Mark this state as an output state for this pattern
    output[currentState].push(patternIndex)
  }

  // ── Phase 2: Build failure links using BFS ───────────────────────────────
  //
  // A failure link for state s points to the longest proper suffix
  // of the string represented by s that is also a prefix of some pattern.
  // This is what allows the automaton to continue without backtracking.

  const queue = []

  // All depth-1 states (direct children of root) fail back to root
  for (const [symbol, nextState] of gotoFn[0]) {
    fail[nextState] = 0
    queue.push(nextState)
  }

  // BFS to compute failure links for all deeper states
  while (queue.length > 0) {
    const currentState = queue.shift()

    for (const [symbol, nextState] of gotoFn[currentState]) {
      queue.push(nextState)

      // Follow failure links until we find a state that has
      // a goto on this symbol, or we reach the root
      let failState = fail[currentState]
      while (failState !== 0 && !gotoFn[failState].has(symbol)) {
        failState = fail[failState]
      }

      fail[nextState] = gotoFn[failState].has(symbol) && gotoFn[failState].get(symbol) !== nextState
        ? gotoFn[failState].get(symbol)
        : 0

      // Inherit outputs from the failure state
      // This handles overlapping patterns
      output[nextState] = [...output[nextState], ...output[fail[nextState]]]
    }
  }

  return { gotoFn, fail, output }
}

/**
 * PHASE 3 — Search
 * 
 * Runs the query through the automaton in a single left-to-right pass.
 * At each position, follows the goto function if possible.
 * If no goto exists, follows failure links until one is found or root is reached.
 * At each state, checks if any patterns end here.
 * 
 * @param {{ gotoFn, fail, output }} automaton
 * @param {number[]} text - Query interval sequence
 * @param {number[][]} patterns - Original patterns (needed to compute start positions)
 * @returns {Array<{ patternIndex, start, end, matchedSequence }>}
 */
function search(automaton, text, patterns) {
  const { gotoFn, fail, output } = automaton
  const matches = []
  let currentState = 0

  for (let i = 0; i < text.length; i++) {
    const symbol = text[i]

    // Follow failure links until we find a valid transition or reach root
    while (currentState !== 0 && !gotoFn[currentState].has(symbol)) {
      currentState = fail[currentState]
    }

    if (gotoFn[currentState].has(symbol)) {
      currentState = gotoFn[currentState].get(symbol)
    }
    // If root also has no transition on this symbol, currentState stays 0

    // Check for matches at this state
    if (output[currentState].length > 0) {
      for (const patternIndex of output[currentState]) {
        const pattern = patterns[patternIndex]
        const end = i + 1           // exclusive end in text
        const start = end - pattern.length  // inclusive start in text

        matches.push({
          patternIndex,
          start,
          end,
          matchLength: pattern.length,
          matchedSequence: text.slice(start, end)
        })
      }
    }
  }

  return matches
}

module.exports = { buildAutomaton, search }
```
Test this carefully:
Create `test_aho.js` in the backend root:
```javascript
const { buildAutomaton, search } = require('./src/services/ahoCorasick')

// Test 1 — direct match
const patterns = [
  [2, 2, -2, -2],     // pattern 0 — Got To Give It Up motif
  [4, 3, -3, -4],     // pattern 1 — different song
]

const automaton = buildAutomaton(patterns)

// Query contains pattern 0 starting at index 2
const query = [1, -1, 2, 2, -2, -2, 3, -3]
const matches = search(automaton, query, patterns)

console.log('Matches found:', matches)
// Expected: [{ patternIndex: 0, start: 2, end: 6, matchLength: 4, matchedSequence: [2,2,-2,-2] }]

// Test 2 — no match (control test)
const noMatchQuery = [4, 3, -3, -4, 0, 1, -1, 2]
const noMatches = search(automaton, noMatchQuery, patterns)
console.log('Should find pattern 1:', noMatches)
// Expected: [{ patternIndex: 1, start: 0, end: 4, ... }]

// Test 3 — multiple matches
const multiQuery = [2, 2, -2, -2, 1, 2, 2, -2, -2]
const multiMatches = search(automaton, multiQuery, patterns)
console.log('Should find 2 matches of pattern 0:', multiMatches.length)
// Expected: 2
```
Run: `node test_aho.js`
All three tests must pass before continuing.
---
Step 9 — Threshold Filter
`src/services/thresholdFilter.js`
```javascript
/**
 * Filters raw automaton matches and classifies them by significance.
 * 
 * Classification rules:
 * - length < 6:   DISCARDED (musical coincidence, not reported)
 * - length 6-9:   MINOR (short motif overlap, flagged but not conclusive)
 * - length >= 10: STRUCTURAL (full phrase match, significant)
 * 
 * Density multiplier:
 * If a single reference song produces 2+ matches of any classification,
 * the highest classification for that song is escalated one level.
 * MINOR with 2+ matches → escalated to STRUCTURAL
 * 
 * @param {Array} rawMatches - Output from ahoCorasick.search()
 * @param {Array} corpusSongs - Full corpus from database
 * @returns {Array} Filtered and classified match objects
 */
function filterMatches(rawMatches, corpusSongs) {
  // Step 1 — discard anything below minimum threshold
  const significant = rawMatches.filter(m => m.matchLength >= 6)

  if (significant.length === 0) return []

  // Step 2 — classify by length
  const classified = significant.map(match => {
    const song = corpusSongs[match.patternIndex]
    return {
      ...match,
      songName: song.song_name,
      artist: song.artist,
      year: song.year,
      songId: song.id,
      referenceIntervals: JSON.parse(song.interval_sequence),
      referenceNotes: JSON.parse(song.note_sequence),
      classification: match.matchLength >= 10 ? 'STRUCTURAL' : 'MINOR'
    }
  })

  // Step 3 — group by song and apply density multiplier
  const bySong = {}
  for (const match of classified) {
    if (!bySong[match.patternIndex]) {
      bySong[match.patternIndex] = []
    }
    bySong[match.patternIndex].push(match)
  }

  const result = []

  for (const songMatches of Object.values(bySong)) {
    // Check if this song has multiple matches — density multiplier
    const hasMultipleMatches = songMatches.length >= 2
    const hasMinorOnly = songMatches.every(m => m.classification === 'MINOR')

    for (const match of songMatches) {
      let finalClassification = match.classification

      // Escalate: 2+ MINOR matches against same song → STRUCTURAL
      if (hasMultipleMatches && hasMinorOnly) {
        finalClassification = 'STRUCTURAL'
      }

      result.push({
        ...match,
        classification: finalClassification,
        isRepeating: hasMultipleMatches
      })
    }
  }

  // Sort by match length descending — longest match first
  return result.sort((a, b) => b.matchLength - a.matchLength)
}

module.exports = { filterMatches }
```
---
Step 10 — Verdict Generator
`src/services/verdictGenerator.js`
```javascript
/**
 * Takes filtered matches and produces the final verdict and primary match.
 * 
 * Verdict hierarchy:
 * - Any STRUCTURAL match present → STRUCTURAL_MATCH
 * - Only MINOR matches present → MINOR_OVERLAP  
 * - No matches → NO_MATCH
 * 
 * Primary match is always the longest match found.
 * 
 * @param {Array} filteredMatches - Output from thresholdFilter
 * @param {number[]} queryIntervals - Original query interval sequence
 * @param {number[]} queryNotes - Original query note sequence
 * @returns {{ verdict, primaryMatch, allMatches }}
 */
function generateVerdict(filteredMatches, queryIntervals, queryNotes) {
  if (filteredMatches.length === 0) {
    return {
      verdict: 'NO_MATCH',
      primaryMatch: null,
      allMatches: [],
      summary: 'No significant melodic similarities found in the reference corpus.'
    }
  }

  // Determine overall verdict
  const hasStructural = filteredMatches.some(m => m.classification === 'STRUCTURAL')
  const verdict = hasStructural ? 'STRUCTURAL_MATCH' : 'MINOR_OVERLAP'

  // Primary match is the longest one
  const primaryMatch = filteredMatches[0]

  // Build structured evidence object for the primary match
  const evidence = {
    songName: primaryMatch.songName,
    artist: primaryMatch.artist,
    year: primaryMatch.year,
    songId: primaryMatch.songId,
    classification: primaryMatch.classification,
    matchLength: primaryMatch.matchLength,
    matchedSequence: primaryMatch.matchedSequence,

    // Positions in query melody
    queryStart: primaryMatch.start,
    queryEnd: primaryMatch.end,
    queryNotes: queryNotes,
    queryIntervals: queryIntervals,

    // Positions in reference melody
    // For the reference, the match is the full pattern (we matched against entire reference)
    referenceStart: 0,
    referenceEnd: primaryMatch.matchLength,
    referenceNotes: primaryMatch.referenceNotes,
    referenceIntervals: primaryMatch.referenceIntervals,

    isRepeating: primaryMatch.isRepeating,

    // Human-readable significance explanation
    significance: buildSignificanceText(primaryMatch)
  }

  return {
    verdict,
    primaryMatch: evidence,
    allMatches: filteredMatches.map(m => ({
      songName: m.songName,
      artist: m.artist,
      classification: m.classification,
      matchLength: m.matchLength,
      queryStart: m.start,
      queryEnd: m.end
    })),
    summary: buildSummaryText(verdict, primaryMatch)
  }
}

function buildSignificanceText(match) {
  if (match.classification === 'STRUCTURAL') {
    return `A ${match.matchLength}-interval structural match was detected — equivalent to a full melodic phrase. This length of match is musically and legally significant.`
  }
  return `A ${match.matchLength}-interval motif overlap was detected. This is a short pattern and may be coincidental, but warrants review.`
}

function buildSummaryText(verdict, match) {
  if (verdict === 'STRUCTURAL_MATCH') {
    return `Structural match found against "${match.songName}" by ${match.artist}. A ${match.matchLength}-interval melodic phrase in your composition matches a phrase in this reference song.`
  }
  return `Minor overlap detected with "${match.songName}" by ${match.artist}. The shared motif is short and may be coincidental.`
}

module.exports = { generateVerdict }
```
---
Step 11 — File Upload Middleware
`src/middleware/upload.js`
```javascript
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Ensure temp upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/temp')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Timestamp prefix prevents filename collisions
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.mid', '.midi']
  const ext = path.extname(file.originalname).toLowerCase()

  if (allowedExtensions.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only .mid and .midi files are accepted'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
})

module.exports = upload
```
---
Step 12 — Analysis Controller
`src/controllers/analysisController.js`
This is the orchestrator — it calls every service in sequence.
```javascript
const fs = require('fs')
const path = require('path')
const db = require('../database/db')
const { parseMidi } = require('../services/midiParser')
const { encodeIntervals } = require('../services/intervalEncoder')
const { buildAutomaton, search } = require('../services/ahoCorasick')
const { filterMatches } = require('../services/thresholdFilter')
const { generateVerdict } = require('../services/verdictGenerator')

// Build automaton once at module load time — not per request
// This runs when the server starts and holds the automaton in memory
let automaton = null
let corpusSongs = []

function initAutomaton() {
  corpusSongs = db.prepare('SELECT * FROM corpus_songs ORDER BY id').all()

  if (corpusSongs.length === 0) {
    console.warn('⚠ Corpus is empty. Run: npm run seed')
    return
  }

  const patterns = corpusSongs.map(song =>
    JSON.parse(song.interval_sequence)
  )

  automaton = buildAutomaton(patterns)
  console.log(`✓ Automaton built over ${corpusSongs.length} corpus songs`)
}

// Initialise on module load
initAutomaton()

/**
 * POST /api/analyse
 * Accepts a MIDI file upload and runs the full analysis pipeline.
 */
async function analyse(req, res) {
  const filePath = req.file?.path
  const originalFilename = req.file?.originalname

  try {
    // Guard: automaton must be ready
    if (!automaton || corpusSongs.length === 0) {
      return res.status(503).json({
        error: 'System not ready. Corpus may be empty.',
        code: 'AUTOMATON_NOT_READY'
      })
    }

    // Guard: file must exist
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded.',
        code: 'NO_FILE'
      })
    }

    // ── Step 1: Parse MIDI ─────────────────────────────────────────────────
    const fileBuffer = fs.readFileSync(filePath)
    const { notes, trackName, totalNotes } = parseMidi(fileBuffer)

    // ── Step 2: Encode intervals ───────────────────────────────────────────
    const queryIntervals = encodeIntervals(notes)

    if (queryIntervals.length < 6) {
      return res.status(400).json({
        error: 'Melody too short. Minimum 6 intervals (7 notes) required.',
        code: 'MELODY_TOO_SHORT'
      })
    }

    // ── Step 3: Run automaton search ───────────────────────────────────────
    const patterns = corpusSongs.map(s => JSON.parse(s.interval_sequence))
    const rawMatches = search(automaton, queryIntervals, patterns)

    // ── Step 4: Filter and classify matches ────────────────────────────────
    const filteredMatches = filterMatches(rawMatches, corpusSongs)

    // ── Step 5: Generate verdict ───────────────────────────────────────────
    const result = generateVerdict(filteredMatches, queryIntervals, notes)

    // ── Step 6: Save to analysis history (if user is logged in) ───────────
    // req.user is set by auth middleware if token is present
    if (req.user) {
      db.prepare(`
        INSERT INTO analysis_history 
        (user_id, original_filename, query_intervals, verdict, 
         matched_song_id, match_length, matched_sequence,
         query_start, query_end, reference_start, reference_end)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id,
        originalFilename,
        JSON.stringify(queryIntervals),
        result.verdict,
        result.primaryMatch?.songId ?? null,
        result.primaryMatch?.matchLength ?? null,
        result.primaryMatch ? JSON.stringify(result.primaryMatch.matchedSequence) : null,
        result.primaryMatch?.queryStart ?? null,
        result.primaryMatch?.queryEnd ?? null,
        result.primaryMatch?.referenceStart ?? null,
        result.primaryMatch?.referenceEnd ?? null
      )
    }

    // ── Step 7: Return response ────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      meta: {
        filename: originalFilename,
        trackName,
        totalNotes,
        intervalCount: queryIntervals.length
      },
      ...result
    })

  } catch (err) {
    console.error('Analysis error:', err.message)

    // Known errors from the pipeline
    const knownErrors = [
      'Invalid MIDI file',
      'No melodic tracks found',
      'Melody is too short',
      'Invalid MIDI note value'
    ]

    const isKnown = knownErrors.some(e => err.message.startsWith(e))

    return res.status(isKnown ? 400 : 500).json({
      error: err.message,
      code: isKnown ? 'INVALID_INPUT' : 'SERVER_ERROR'
    })

  } finally {
    // Always delete the temp file regardless of success or failure
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
}

/**
 * GET /api/corpus
 * Returns all songs in the reference corpus.
 */
function getCorpus(req, res) {
  const songs = db.prepare(`
    SELECT id, song_name, artist, year, sequence_length, added_at
    FROM corpus_songs
    ORDER BY song_name
  `).all()

  return res.status(200).json({ songs, total: songs.length })
}

/**
 * POST /api/corpus/reload
 * Rebuilds the in-memory automaton from the current database state.
 * Call this after adding new songs to the corpus.
 * Protected by admin key.
 */
function reloadCorpus(req, res) {
  try {
    initAutomaton()
    return res.status(200).json({
      message: 'Automaton rebuilt successfully',
      corpusSize: corpusSongs.length
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports = { analyse, getCorpus, reloadCorpus }
```
---
Step 13 — Routes
`src/routes/analysisRoutes.js`
```javascript
const express = require('express')
const router = express.Router()
const upload = require('../middleware/upload')
const { analyse, getCorpus, reloadCorpus } = require('../controllers/analysisController')

// Main analysis endpoint
router.post('/analyse', upload.single('file'), analyse)

// Corpus info
router.get('/corpus', getCorpus)

// Admin — rebuild automaton (protected)
router.post('/corpus/reload', (req, res, next) => {
  const key = req.headers['x-admin-key']
  if (key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}, reloadCorpus)

module.exports = router
```
---
Step 14 — Express App
`src/app.js`
```javascript
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const analysisRoutes = require('./routes/analysisRoutes')

const app = express()

app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MelodyClaim API' })
})

// Routes
app.use('/api', analysisRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

module.exports = app
```
---
Step 15 — Server Entry Point
`server.js`
```javascript
require('dotenv').config()
const app = require('./src/app')

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`\n✓ MelodyClaim API running on http://localhost:${PORT}`)
  console.log(`  Health check: http://localhost:${PORT}/health`)
  console.log(`  Analyse:      POST http://localhost:${PORT}/api/analyse`)
  console.log(`  Corpus:       GET  http://localhost:${PORT}/api/corpus\n`)
})
```
---
Step 16 — Run the Server
```bash
# Terminal 1 — start the dev server
npm run dev
```
Expected output:
```
✓ Automaton built over 8 corpus songs
✓ MelodyClaim API running on http://localhost:3001
  Health check: http://localhost:3001/health
  Analyse:      POST http://localhost:3001/api/analyse
  Corpus:       GET  http://localhost:3001/api/corpus
```
---
Step 17 — Test the Endpoints
Test 1 — Health check
```
GET http://localhost:3001/health
```
Expected: `{ "status": "ok", "service": "MelodyClaim API" }`
Test 2 — Corpus
```
GET http://localhost:3001/api/corpus
```
Expected: JSON array of 8 songs
Test 3 — Analyse a MIDI file
```
POST http://localhost:3001/api/analyse
Content-Type: multipart/form-data
Body: file = [your .mid file]
```
Expected response shape:
```json
{
  "success": true,
  "meta": {
    "filename": "test.mid",
    "trackName": "Piano",
    "totalNotes": 47,
    "intervalCount": 46
  },
  "verdict": "STRUCTURAL_MATCH",
  "primaryMatch": {
    "songName": "Got To Give It Up",
    "artist": "Marvin Gaye",
    "matchLength": 11,
    "classification": "STRUCTURAL",
    "matchedSequence": [2, 2, -2, -2, -2, 2, 2, -2, -2, -1, 1],
    "queryStart": 3,
    "queryEnd": 14
  },
  "summary": "Structural match found against..."
}
```
---
What's Next After This
Once this pipeline is confirmed working end to end:
Add JWT authentication for sign-in and analysis history
Add the corpus management POST endpoint to add new songs
Connect the React frontend — the API contract is already defined above
Add the piano roll data transformation in the controller response
The entire backend MIDI pipeline is now complete.