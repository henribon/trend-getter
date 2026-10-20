import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const IN_MEMORY = ':memory:';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL,
    status TEXT NOT NULL,
    location_id TEXT NOT NULL,
    source TEXT NOT NULL,
    strategy TEXT,
    trends TEXT NOT NULL,
    matches TEXT NOT NULL,
    warning TEXT,
    error TEXT
  );
`;

export function openDatabase(filePath) {
  if (filePath !== IN_MEMORY) {
    mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const database = new DatabaseSync(filePath);
  database.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;');
  database.exec(SCHEMA);
  return database;
}
