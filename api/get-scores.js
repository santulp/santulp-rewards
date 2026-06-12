const SUPA_URL = 'https://ayhoefdgcrgyryrufazr.supabase.co';
const SUPA_KEY = 'sb_publishable_3JGuVqHh0bhEDX3FUMq3vQ_-F5dtw9E';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const response = await fetch(`${SUPA_URL}/rest/v1/live_scores?select=sport,data,updated_at`, {
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`
      }
    });

    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(200).json({ ok: true, events: {}, count: 0 });
    }

    // Construir un mapa id_evento -> info de score, para lookup rápido en el frontend
    const eventsMap = {};
    rows.forEach(row => {
      const d = row.data;
      if (!d || !d.events) return;
      d.events.forEach(ev => {
        eventsMap[ev.id] = {
          completed: ev.completed,
          commence_time: ev.commence_time,
          home_team: ev.home_team,
          away_team: ev.away_team,
          scores: ev.scores || [],
          last_update: ev.last_update,
          cached_at: row.updated_at
        };
      });
    });

    res.status(200).json({ ok: true, events: eventsMap, count: Object.keys(eventsMap).length, timestamp: new Date().toISOString() });
  } catch(err) {
    res.status(500).json({ ok: false, error: err.message, events: {} });
  }
}
