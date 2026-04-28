import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the db path is correct based on where the seed script puts it. 
// Depending on root, usually the db is in the root directory or backend directory.
// Let's point to corpus.db or melodyclaim.db based on what auth.md says.
const DB_PATH = path.join(__dirname, '..', '..', 'melodyclaim.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'user',
    google_id TEXT UNIQUE,
    github_id TEXT UNIQUE,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;