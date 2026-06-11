const SUPA_URL = 'https://ayhoefdgcrgyryrufazr.supabase.co';
const SUPA_KEY = 'sb_publishable_3JGuVqHh0bhEDX3FUMq3vQ_-F5dtw9E';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const response = await fetch(`${SUPA_URL}/rest/v1/odds_cache?select=sport,data,updated_at`, {
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`
      }
    });

    const rows = await response.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(200).json({ ok: true, sports: [], cached: false, debug: 'no rows' });
    }

    const sports = rows
      .map(row => {
        const d = row.data;
        if (!d) return null;
        return {
          key:        d.key        || row.sport,
          name:       d.name       || row.sport,
          emoji:      d.emoji      || '⚽',
          games:      d.games      || [],
          cached_at:  row.updated_at,
          stale:      false
        };
      })
      .filter(s => s && s.games && s.games.length > 0);

    res.status(200).json({ ok: true, sports, count: sports.length, timestamp: new Date().toISOString() });
  } catch(err) {
    res.status(500).json({ ok: false, error: err.message, sports: [] });
  }
}
