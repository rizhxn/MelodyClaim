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

// Create and migrate the auth database. This table is shared by email/password
// auth and OAuth providers so a Google login creates a durable local account.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT DEFAULT '',
    display_name TEXT,
    role TEXT DEFAULT 'user',
    google_id TEXT UNIQUE,
    github_id TEXT UNIQUE,
    avatar_url TEXT,
    auth_provider TEXT DEFAULT 'email',
    google_email TEXT,
    google_display_name TEXT,
    github_email TEXT,
    github_display_name TEXT,
    last_login_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const columns = db.prepare('PRAGMA table_info(users)').all().map(column => column.name);
const ensureColumn = (name, definition) => {
  if (!columns.includes(name)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${name} ${definition}`);
  }
};

ensureColumn('password_hash', "TEXT DEFAULT ''");
ensureColumn('display_name', 'TEXT');
ensureColumn('role', "TEXT DEFAULT 'user'");
ensureColumn('google_id', 'TEXT');
ensureColumn('github_id', 'TEXT');
ensureColumn('avatar_url', 'TEXT');
ensureColumn('auth_provider', "TEXT DEFAULT 'email'");
ensureColumn('google_email', 'TEXT');
ensureColumn('google_display_name', 'TEXT');
ensureColumn('github_email', 'TEXT');
ensureColumn('github_display_name', 'TEXT');
ensureColumn('last_login_at', 'DATETIME');
ensureColumn('updated_at', 'DATETIME');

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id) WHERE github_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

export default db;
