import db from './database.js';

export function calculateLeaderboard() {
  const participants = db.prepare('SELECT * FROM participants ORDER BY start_number ASC').all();
  const stations = db.prepare('SELECT * FROM stations').all();
  const rawScores = db.prepare('SELECT * FROM scores').all();

  const totalParticipants = participants.length;
  if (totalParticipants === 0) return [];

  // Map zur schnellen Zuordnung der Rohwerte: scoresMap[stationId][participantId] = rawValue
  const scoresMap = {};
  rawScores.forEach(score => {
    if (!scoresMap[score.station_id]) scoresMap[score.station_id] = {};
    scoresMap[score.station_id][score.participant_id] = score.raw_value;
  });

  // Teilnehmer-Objekte für Gesamtwertung vorbereiten
  const leaderboard = participants.map(p => ({
    id: p.id,
    start_number: p.start_number,
    name: p.name,
    total_points: 0,
    station_details: {}
  }));

  const participantMap = {};
  leaderboard.forEach(p => { participantMap[p.id] = p; });

  // Für jede Station Ränge und Punkte ermitteln
  stations.forEach(station => {
    const stationScores = [];

    participants.forEach(p => {
      const val = scoresMap[station.id] ? scoresMap[station.id][p.id] : null;
      if (val !== undefined && val !== null) {
        stationScores.push({ participant_id: p.id, raw_value: val });
      }
    });

    // Sortierung: Bei 'time' niedriger besser, bei 'points' höher besser
    stationScores.sort((a, b) => {
      if (station.scoring_type === 'time') {
        return a.raw_value - b.raw_value;
      } else {
        return b.raw_value - a.raw_value;
      }
    });

    // Punktevergabe: Platz 1 bekommt N Punkte, Platz 2 N-1 usw.
    stationScores.forEach((item, index) => {
      const rank = index + 1;
      const points = Math.max(1, totalParticipants - index);

      const targetParticipant = participantMap[item.participant_id];
      if (targetParticipant) {
        targetParticipant.total_points += points;
        targetParticipant.station_details[station.id] = {
          raw_value: item.raw_value,
          rank: rank,
          points: points
        };
      }
    });
  });

  // Nach Gesamtpunkten absteigend sortieren
  leaderboard.sort((a, b) => b.total_points - a.total_points);

  // Gesamtrang zuweisen
  leaderboard.forEach((item, index) => {
    item.overall_rank = index + 1;
  });

  return leaderboard;
}