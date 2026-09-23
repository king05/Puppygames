import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './puppygames.db';
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Tabellen initialisieren
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'helper' -- 'admin' oder 'helper'
  );

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_number INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    scoring_type TEXT NOT NULL, -- 'points' (höher besser) oder 'time' (niedriger besser)
    unit TEXT DEFAULT '' -- z. B. 'Sek', 'Punkte', 'Kekse'
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    raw_value REAL NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY(station_id) REFERENCES stations(id) ON DELETE CASCADE,
    UNIQUE(participant_id, station_id)
  );
`);

// Standard-Admin anlegen (Falls noch kein User existiert)
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const defaultPasswordHash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .run('admin', defaultPasswordHash, 'admin');
  console.log('Standard-Admin angelegt: Username "admin", Passwort "admin123"');
}

export default db;