/**
 * Database seed script — populates the corpus with reference melodies.
 *
 * Each entry contains simplified interval sequences that reflect
 * the actual melodic hooks of famous songs involved in plagiarism cases.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', '..', 'corpus.db');

/**
 * Corpus data: each entry has song info, a starting MIDI note,
 * and a simplified interval sequence reflecting the iconic hook.
 */
const CORPUS = [
  {
    songName: 'Got To Give It Up',
    artist: 'Marvin Gaye',
    year: 1977,
    startNote: 67, // G4
    // Funky pentatonic groove — the bass+vocal hook
    intervals: [2, 2, 1, 2, -2, -1, -2, 0, 2, 3, -1, -2, 2, 1, 2, -2, -3, 2, 0, 1],
  },
  {
    songName: 'Blurred Lines',
    artist: 'Robin Thicke',
    year: 2013,
    startNote: 67, // G4
    // Similar pentatonic groove pattern (the contested similarity)
    intervals: [2, 2, 1, 2, -2, -1, -2, 0, 2, 3, -1, -2, 0, 1, 2, -2, -1, -2, 2, 3],
  },
  {
    songName: 'Shape of You',
    artist: 'Ed Sheeran',
    year: 2017,
    startNote: 64, // E4
    // "I'm in love with the shape of you" vocal hook
    intervals: [0, -2, 2, 0, 0, -2, -1, 3, 0, 0, -2, 2, 0, 0, -2, -1, -2, 2, 0, 1],
  },
  {
    songName: 'No Scrubs',
    artist: 'TLC',
    year: 1999,
    startNote: 65, // F4
    // "No, I don't want no scrubs" melodic motif
    intervals: [0, -2, 2, 0, 0, -2, -1, 3, 0, -2, 2, 0, -2, -1, 3, -3, 0, 2, -2, 0],
  },
  {
    songName: "He's So Fine",
    artist: 'The Chiffons',
    year: 1963,
    startNote: 72, // C5
    // "Doo-lang doo-lang doo-lang" — the iconic motif
    intervals: [-2, 2, 0, -2, 0, 2, -2, 2, 0, -2, 0, 2, 5, -2, -2, -1, 0, -2, 2, 0],
  },
  {
    songName: 'My Sweet Lord',
    artist: 'George Harrison',
    year: 1970,
    startNote: 72, // C5
    // Very similar motif to "He's So Fine" (the famous case)
    intervals: [-2, 2, 0, -2, 0, 2, -2, 2, 0, -2, 0, 2, 5, -2, -1, -2, 2, 0, -2, 0],
  },
];

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

/**
 * Seeds the database.
 */
export function seedDatabase() {
  const db = new Database(DB_PATH);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  // Create table
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

  // Clear existing data
  db.exec('DELETE FROM corpus');

  // Insert each song
  const insert = db.prepare(`
    INSERT INTO corpus (song_name, artist, year, start_note, intervals, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((songs) => {
    for (const song of songs) {
      const notes = reconstructNotes(song.startNote, song.intervals);
      insert.run(
        song.songName,
        song.artist,
        song.year,
        song.startNote,
        JSON.stringify(song.intervals),
        JSON.stringify(notes)
      );
    }
  });

  insertMany(CORPUS);

  const count = db.prepare('SELECT COUNT(*) as count FROM corpus').get();
  console.log(`✓ Seeded ${count.count} songs into corpus database at ${DB_PATH}`);

  // Print summary
  const all = db.prepare('SELECT id, song_name, artist, year FROM corpus').all();
  console.log('\nCorpus contents:');
  for (const row of all) {
    console.log(`  [${row.id}] ${row.song_name} — ${row.artist} (${row.year})`);
  }

  db.close();
}

/**
 * Gets all corpus entries from the database.
 */
export function getCorpus() {
  const db = new Database(DB_PATH, { readonly: true });
  const rows = db.prepare('SELECT * FROM corpus ORDER BY id').all();
  db.close();

  return rows.map(row => ({
    id: row.id,
    songName: row.song_name,
    artist: row.artist,
    year: row.year,
    startNote: row.start_note,
    intervals: JSON.parse(row.intervals),
    notes: JSON.parse(row.notes),
  }));
}

// Run if executed directly
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  seedDatabase();
}
