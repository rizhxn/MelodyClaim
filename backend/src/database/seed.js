/**
 * Database seed script - populates the corpus with reference melody signatures.
 *
 * Built-in demo motifs live in src/database/corpus/baseCorpus.js. Additional
 * references can be added without code changes through backend/corpus:
 *   - authorized-songs.json for note/interval signatures
 *   - midi-manifest.json plus MIDI files in backend/corpus/midi
 */

import fs from 'fs';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseMidi } from '../services/midiParser.js';
import { encodeIntervals } from '../services/intervalEncoder.js';
import { BASE_CORPUS } from './corpus/baseCorpus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', '..', 'corpus.db');
const CORPUS_DIR = path.join(__dirname, '..', '..', 'corpus');
const JSON_CORPUS_PATH = path.join(CORPUS_DIR, 'authorized-songs.json');
const MIDI_MANIFEST_PATH = path.join(CORPUS_DIR, 'midi-manifest.json');
const TARGET_CORPUS_COUNT = Number(process.env.CORPUS_TARGET_COUNT || 100);
const CORPUS_SCHEMA_VERSION = 1;

/**
 * Reconstruct note numbers from a starting note and interval sequence.
 */
function reconstructNotes(startNote, intervals) {
  const notes = [startNote];
  for (const interval of intervals) {
    notes.push(notes[notes.length - 1] + interval);
  }
  return notes;
}

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }
}

function normalizeNumberArray(value, fieldName, songLabel) {
  if (!Array.isArray(value)) {
    throw new Error(`${songLabel} is missing ${fieldName}[]`);
  }

  const values = value.map(Number);
  if (values.some(item => !Number.isFinite(item))) {
    throw new Error(`${songLabel} has non-numeric values in ${fieldName}[]`);
  }

  return values;
}

function normalizeSignatureEntry(entry, sourceLabel) {
  const songName = String(entry.songName || entry.title || '').trim();
  const artist = String(entry.artist || '').trim();
  const songLabel = `${songName || 'Untitled'} by ${artist || 'Unknown'} (${sourceLabel})`;

  if (!songName || !artist) {
    throw new Error(`${songLabel} must include songName and artist`);
  }

  let notes = entry.notes ? normalizeNumberArray(entry.notes, 'notes', songLabel) : null;
  let intervals = entry.intervals ? normalizeNumberArray(entry.intervals, 'intervals', songLabel) : null;
  const startNote = Number(entry.startNote ?? notes?.[0]);

  if (!intervals && notes) {
    intervals = encodeIntervals(notes);
  }

  if (!notes && intervals) {
    if (!Number.isFinite(startNote)) {
      throw new Error(`${songLabel} must include startNote when intervals are provided without notes`);
    }
    notes = reconstructNotes(startNote, intervals);
  }

  if (!notes || !intervals || intervals.length < 7) {
    throw new Error(`${songLabel} must include at least 8 notes or 7 intervals`);
  }

  return {
    songName,
    artist,
    year: Number.isFinite(Number(entry.year)) ? Number(entry.year) : null,
    startNote: Number.isFinite(startNote) ? startNote : notes[0],
    intervals,
    notes,
  };
}

function normalizeMidiEntry(entry) {
  const songName = String(entry.songName || entry.title || '').trim();
  const artist = String(entry.artist || '').trim();
  const midiFile = String(entry.midiFile || entry.file || '').trim();
  const songLabel = `${songName || 'Untitled'} by ${artist || 'Unknown'} (${midiFile || 'missing MIDI'})`;

  if (!songName || !artist || !midiFile) {
    throw new Error(`${songLabel} must include songName, artist, and midiFile`);
  }

  const midiPath = path.resolve(CORPUS_DIR, midiFile);
  const relativeMidiPath = path.relative(CORPUS_DIR, midiPath);
  const isInsideCorpusDir = relativeMidiPath && !relativeMidiPath.startsWith('..') && !path.isAbsolute(relativeMidiPath);

  if (!isInsideCorpusDir || !fs.existsSync(midiPath)) {
    throw new Error(`${songLabel} references missing MIDI file: ${midiFile}`);
  }

  const { tracks } = parseMidi(fs.readFileSync(midiPath));
  const track = [...tracks].sort((a, b) => b.notes.length - a.notes.length)[0];
  if (!track || track.notes.length < 8) {
    throw new Error(`${songLabel} did not contain a melodic track with at least 8 notes`);
  }

  return {
    songName,
    artist,
    year: Number.isFinite(Number(entry.year)) ? Number(entry.year) : null,
    startNote: track.notes[0],
    intervals: encodeIntervals(track.notes),
    notes: track.notes,
  };
}

export function loadCorpusEntries() {
  const jsonEntries = readJsonFile(JSON_CORPUS_PATH, []);
  const midiEntries = readJsonFile(MIDI_MANIFEST_PATH, []);

  if (!Array.isArray(jsonEntries)) {
    throw new Error(`${JSON_CORPUS_PATH} must contain an array`);
  }

  if (!Array.isArray(midiEntries)) {
    throw new Error(`${MIDI_MANIFEST_PATH} must contain an array`);
  }

  return [
    ...BASE_CORPUS.map(entry => normalizeSignatureEntry(entry, 'built-in corpus')),
    ...jsonEntries.map(entry => normalizeSignatureEntry(entry, 'authorized-songs.json')),
    ...midiEntries.map(normalizeMidiEntry),
  ];
}

function ensureCorpusTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS corpus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_name TEXT NOT NULL,
      artist TEXT NOT NULL,
      year INTEGER,
      start_note INTEGER NOT NULL,
      intervals TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS corpus_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function getCorpusFingerprint(corpusEntries) {
  return JSON.stringify(corpusEntries.map(entry => ({
    songName: entry.songName,
    artist: entry.artist,
    year: entry.year,
    startNote: entry.startNote,
    intervals: entry.intervals,
  })));
}

function setMeta(db, key, value) {
  db.prepare(`
    INSERT INTO corpus_meta (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `).run(key, String(value));
}

function getMeta(db, key) {
  return db.prepare('SELECT value FROM corpus_meta WHERE key = ?').get(key)?.value ?? null;
}

function hasRequiredCorpusTables(db) {
  const rows = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name IN ('corpus', 'corpus_meta')
  `).all();

  return new Set(rows.map(row => row.name)).size === 2;
}

function removeEmptyStrayAuthTable(db) {
  const usersTable = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name = 'users'
  `).get();

  if (!usersTable) return;

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.warn('corpus.db contains a non-empty users table; leaving it untouched.');
    return;
  }

  db.exec('DROP TABLE users');
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'users'");
}

/**
 * Seeds the database.
 */
export function seedDatabase() {
  const corpusEntries = loadCorpusEntries();
  const db = new Database(DB_PATH);

  try {
    db.pragma('journal_mode = WAL');
    ensureCorpusTable(db);
    removeEmptyStrayAuthTable(db);
    db.exec('DELETE FROM corpus');
    db.exec("DELETE FROM sqlite_sequence WHERE name = 'corpus'");

    const insert = db.prepare(`
      INSERT INTO corpus (song_name, artist, year, start_note, intervals, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((songs) => {
      for (const song of songs) {
        insert.run(
          song.songName,
          song.artist,
          song.year,
          song.startNote,
          JSON.stringify(song.intervals),
          JSON.stringify(song.notes)
        );
      }
    });

    insertMany(corpusEntries);
    setMeta(db, 'schemaVersion', CORPUS_SCHEMA_VERSION);
    setMeta(db, 'fingerprint', getCorpusFingerprint(corpusEntries));
    setMeta(db, 'count', corpusEntries.length);

    const count = db.prepare('SELECT COUNT(*) as count FROM corpus').get();
    console.log(`Seeded ${count.count} songs into corpus database at ${DB_PATH}`);

    if (count.count < TARGET_CORPUS_COUNT) {
      console.warn(
        `Corpus target is ${TARGET_CORPUS_COUNT}; add ${TARGET_CORPUS_COUNT - count.count} authorized songs in backend/corpus.`
      );
    }

    const all = db.prepare('SELECT id, song_name, artist, year FROM corpus').all();
    console.log('\nCorpus contents:');
    for (const row of all) {
      const year = row.year ? ` (${row.year})` : '';
      console.log(`  [${row.id}] ${row.song_name} - ${row.artist}${year}`);
    }
  } finally {
    db.close();
  }
}

export function isCorpusDatabaseCurrent() {
  if (!fs.existsSync(DB_PATH)) return false;

  const corpusEntries = loadCorpusEntries();
  const db = new Database(DB_PATH, { readonly: true });

  try {
    if (!hasRequiredCorpusTables(db)) return false;

    const count = db.prepare('SELECT COUNT(*) as count FROM corpus').get().count;
    const schemaVersion = getMeta(db, 'schemaVersion');
    const fingerprint = getMeta(db, 'fingerprint');

    return (
      count === corpusEntries.length &&
      schemaVersion === String(CORPUS_SCHEMA_VERSION) &&
      fingerprint === getCorpusFingerprint(corpusEntries)
    );
  } finally {
    db.close();
  }
}

export function checkCorpus() {
  const corpusEntries = loadCorpusEntries();
  console.log(`Corpus loader found ${corpusEntries.length} valid song signatures.`);
  if (corpusEntries.length < TARGET_CORPUS_COUNT) {
    console.log(`Add ${TARGET_CORPUS_COUNT - corpusEntries.length} more authorized songs to reach ${TARGET_CORPUS_COUNT}.`);
  }
  return corpusEntries;
}

/**
 * Gets all corpus entries from the database.
 */
export function getCorpus() {
  if (!isCorpusDatabaseCurrent()) {
    seedDatabase();
  }

  const db = new Database(DB_PATH, { readonly: true });

  try {
    const rows = db.prepare('SELECT * FROM corpus ORDER BY id').all();

    return rows.map(row => ({
      id: row.id,
      songName: row.song_name,
      artist: row.artist,
      year: row.year,
      startNote: row.start_note,
      intervals: JSON.parse(row.intervals),
      notes: JSON.parse(row.notes),
    }));
  } finally {
    db.close();
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  if (process.argv.includes('--check')) {
    checkCorpus();
  } else {
    seedDatabase();
  }
}
