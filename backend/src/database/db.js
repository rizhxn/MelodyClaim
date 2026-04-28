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

// auth.md specifies to ensure the missing OAuth columns are added.
try {
  db.exec(`
    ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
  `);
} catch (e) {}

try {
  db.exec(`
    ALTER TABLE users ADD COLUMN github_id TEXT UNIQUE;
  `);
} catch (e) {}

try {
  db.exec(`
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  `);
} catch (e) {}

export default db;