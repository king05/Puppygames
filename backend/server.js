import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import db from './database.js';
import { calculateLeaderboard } from './scoring.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

app.use(cors());
app.use(express.json());

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Nicht autorisiert' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token ungültig' });
    req.user = user;
    next();
  });
}

// --- AUTH ENDPUNKTE ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(400).json({ error: 'Zugangsdaten falsch' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username: user.username, role: user.role });
});

// --- STATIONS ENDPUNKTE ---
app.get('/api/stations', (req, res) => {
  const stations = db.prepare('SELECT * FROM stations').all();
  res.json(stations);
});

app.post('/api/stations', authenticateToken, (req, res) => {
  const { name, scoring_type, unit } = req.body;
  const stmt = db.prepare('INSERT INTO stations (name, scoring_type, unit) VALUES (?, ?, ?)');
  const info = stmt.run(name, scoring_type, unit || '');
  res.json({ id: info.lastInsertRowid, name, scoring_type, unit });
});

// --- TEILNEHMER ENDPUNKTE ---
app.get('/api/participants', (req, res) => {
  const participants = db.prepare('SELECT * FROM participants ORDER BY start_number ASC').all();
  res.json(participants);
});

app.post('/api/participants', authenticateToken, (req, res) => {
  const { start_number, name } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO participants (start_number, name) VALUES (?, ?)');
    const info = stmt.run(start_number, name);
    res.json({ id: info.lastInsertRowid, start_number, name });
  } catch (err) {
    res.status(400).json({ error: 'Startnummer vergeben oder Fehler beim Erstellen' });
  }
});

// --- PUNKTE EINGABE ---
app.post('/api/scores', authenticateToken, (req, res) => {
  const { participant_id, station_id, raw_value } = req.body;

  const stmt = db.prepare(`
    INSERT INTO scores (participant_id, station_id, raw_value)
    VALUES (?, ?, ?)
    ON CONFLICT(participant_id, station_id) DO UPDATE SET
      raw_value = excluded.raw_value,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(participant_id, station_id, raw_value);

  // Beamer-Liveupdate triggern!
  const leaderboard = calculateLeaderboard();
  io.emit('leaderboard_update', leaderboard);

  res.json({ success: true });
});

// --- RANGLISTE (Für Beamer) ---
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = calculateLeaderboard();
  res.json(leaderboard);
});

// WebSocket Verbindungen
io.on('connection', (socket) => {
  console.log('Client verbunden (z. B. Beamer):', socket.id);
  socket.emit('leaderboard_update', calculateLeaderboard());
});

server.listen(PORT, () => {
  console.log(`Backend läuft auf Port ${PORT}`);
});

// --- CSV EXPORT ENDPUNKTE ---

// 1. Gesamtergebnisse & Punktestände als CSV exportieren
app.get('/api/admin/export/results.csv', authenticateToken, (req, res) => {
  const leaderboard = calculateLeaderboard();
  const stations = db.prepare('SELECT * FROM stations').all();

  // Dynamic CSV Header: Rang, Startnummer, Name, Gesamtpunkte, [Station 1 Raw], [Station 1 Pkt], ...
  let csvHeaders = ['Rang', 'Startnummer', 'Name', 'Gesamtpunkte'];
  stations.forEach(s => {
    csvHeaders.push(`Station_${s.name}_Wert`);
    csvHeaders.push(`Station_${s.name}_Punkte`);
  });

  let csvRows = [csvHeaders.join(';')];

  leaderboard.forEach(p => {
    let row = [
      p.overall_rank,
      p.start_number,
      `"${p.name.replace(/"/g, '""')}"`,
      p.total_points
    ];

    stations.forEach(s => {
      const details = p.station_details[s.id];
      if (details) {
        row.push(details.raw_value);
        row.push(details.points);
      } else {
        row.push('');
        row.push('');
      }
    });

    csvRows.push(row.join(';'));
  });

  const csvContent = '\uFEFF' + csvRows.join('\n'); // UTF-8 BOM für Excel
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="puppygames_ergebnisse.csv"');
  res.status(200).send(csvContent);
});

// 2. Teilnehmerliste als CSV-Vorlage / Backup exportieren
app.get('/api/admin/export/participants.csv', authenticateToken, (req, res) => {
  const participants = db.prepare('SELECT start_number, name FROM participants ORDER BY start_number ASC').all();
  
  let csvRows = ['Startnummer;Name'];
  participants.forEach(p => {
    csvRows.push(`${p.start_number};"${p.name.replace(/"/g, '""')}"`);
  });

  const csvContent = '\uFEFF' + csvRows.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="puppygames_teilnehmer.csv"');
  res.status(200).send(csvContent);
});

// --- CSV IMPORT ENDPUNKT ---

// Teilnehmer via CSV (Semikolon oder Komma getrennt) importieren
app.post('/api/admin/import/participants', authenticateToken, (req, res) => {
  const { csvText } = req.body;
  if (!csvText) {
    return res.status(400).json({ error: 'Kein CSV-Inhalt übergeben' });
  }

  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    return res.status(400).json({ error: 'Die CSV-Datei enthält keine Datenzeilen.' });
  }

  let importedCount = 0;
  let skippedCount = 0;

  const insertStmt = db.prepare('INSERT OR IGNORE INTO participants (start_number, name) VALUES (?, ?)');

  // Erste Zeile ist der Header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Trennzeichen ermitteln (Semikolon oder Komma)
    const delimiter = line.includes(';') ? ';' : ',';
    const parts = line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''));

    if (parts.length >= 2) {
      const startNum = parseInt(parts[0], 10);
      const name = parts[1];

      if (!isNaN(startNum) && name) {
        const info = insertStmt.run(startNum, name);
        if (info.changes > 0) {
          importedCount++;
        } else {
          skippedCount++; // Startnummer existiert bereits
        }
      }
    }
  }

  res.json({ success: true, importedCount, skippedCount });
});
