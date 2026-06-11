const SUPA_URL = 'https://ayhoefdgcrgyryrufazr.supabase.co';
const SUPA_KEY = 'sb_publishable_3JGuVqHh0bhEDX3FUMq3vQ_-F5dtw9E';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const response = await fetch(`${SUPA_URL}/rest/v1/odds_cache?select=sport,data,updated_at&order=sport`, {
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`
      }
    });

    const rows = await response.json();
    if (!Array.isArray(rows)) {
      return res.status(200).json({ ok: true, sports: [], cached: false });
    }

    // Check if cache is fresh (less than 2 hours old)
    const now = new Date();
    const sports = rows.map(row => {
      const updatedAt = new Date(row.updated_at);
      const ageMinutes = (now - updatedAt) / 60000;
      return { ...row.data, cached_at: row.updated_at, stale: ageMinutes > 120 };
    }).filter(s => s.games && s.games.length > 0);

    res.status(200).json({ ok: true, sports, timestamp: new Date().toISOString() });
  } catch(err) {
    res.status(500).json({ ok: false, error: err.message, sports: [] });
  }
}
