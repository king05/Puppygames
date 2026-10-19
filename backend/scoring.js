import db from './database.js';

// In backend/scoring.js

export function calculateLeaderboard() {
  const participants = db.prepare('SELECT * FROM participants').all();
  const stations = db.prepare('SELECT * FROM stations').all();
  const scores = db.prepare('SELECT * FROM scores').all();

  const totalParticipants = participants.length;
  if (totalParticipants === 0) return [];

  // Map für Teilnehmer-Punkte
  const participantMap = {};
  participants.forEach(p => {
    participantMap[p.id] = {
      id: p.id,
      start_number: p.start_number,
      name: p.name,
      total_points: 0,
      station_details: {}
    };
  });

  // Jede Station einzeln auswerten
  stations.forEach(station => {
    const stationScores = scores.filter(s => s.station_id === station.id);

    // Sortierung je nach Wertungstyp
    if (station.scoring_type === 'points') {
      // Höher ist besser
      stationScores.sort((a, b) => b.raw_value - a.raw_value);
    } else if (station.scoring_type === 'time') {
      // Niedriger ist besser
      stationScores.sort((a, b) => a.raw_value - b.raw_value);
    } else if (station.scoring_type === 'guess') {
      // Kleinstes Delta (Abweichung vom Zielwert) ist besser
      const target = station.target_value ?? 0;
      stationScores.sort((a, b) => {
        const diffA = Math.abs(a.raw_value - target);
        const diffB = Math.abs(b.raw_value - target);
        return diffA - diffB;
      });
    }

    // Punkte vergeben (Platz 1 = N Punkte, Platz 2 = N-1, etc.)
    stationScores.forEach((score, index) => {
      const rank = index + 1;
      const points = Math.max(0, totalParticipants - rank + 1);

      if (participantMap[score.participant_id]) {
        participantMap[score.participant_id].total_points += points;
        participantMap[score.participant_id].station_details[station.id] = {
          raw_value: score.raw_value,
          rank: rank,
          points: points
        };
      }
    });
  });

  // Gesamt-Rangliste sortieren
  const leaderboard = Object.values(participantMap).sort((a, b) => b.total_points - a.total_points);

  // Gesamtrang zuweisen
  leaderboard.forEach((item, index) => {
    item.overall_rank = index + 1;
  });

  return leaderboard;
}
