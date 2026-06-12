const ODDS_API_KEY = '388762c002c6ee37e4b21f01a3f02712';
const SUPA_URL = 'https://ayhoefdgcrgyryrufazr.supabase.co';
const SUPA_KEY = 'sb_publishable_3JGuVqHh0bhEDX3FUMq3vQ_-F5dtw9E';

// Solo Mundial 2026 para marcadores en vivo (limita el consumo de cuota)
const SPORTS = [
  { key: 'soccer_fifa_world_cup', name: 'Mundial 2026', emoji: '🌍' },
];

async function fetchScoresForSport(sportKey) {
  // daysFrom=2 trae eventos completados en las últimas 48hs + en vivo + próximos
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${ODDS_API_KEY}&daysFrom=2&dateFormat=iso`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function saveCacheToSupabase(sport, data) {
  const res = await fetch(`${SUPA_URL}/rest/v1/live_scores`, {
    method: 'POST',
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({ sport, data, updated_at: new Date().toISOString() })
  });
  return res.ok;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const log = [];
  let liveCount = 0;
  let completedCount = 0;

  for (const sport of SPORTS) {
    try {
      const events = await fetchScoresForSport(sport.key);
      if (events.length === 0) { log.push(`${sport.key}: 0 events`); continue; }

      // Solo nos importan los que están en vivo o recién completados
      const relevant = events.filter(e => e.scores && e.scores.length > 0);

      const live = relevant.filter(e => !e.completed);
      const completed = relevant.filter(e => e.completed);
      liveCount += live.length;
      completedCount += completed.length;

      if (relevant.length > 0) {
        const sportData = { ...sport, events: relevant.slice(0, 15) };
        await saveCacheToSupabase(sport.key, sportData);
        log.push(`${sport.key}: ${live.length} live, ${completed.length} completed`);
      } else {
        log.push(`${sport.key}: 0 relevant (${events.length} total)`);
      }

      await new Promise(r => setTimeout(r, 300));
    } catch(e) {
      log.push(`${sport.key}: ERROR ${e.message}`);
    }
  }

  res.status(200).json({ ok: true, liveCount, completedCount, log, timestamp: new Date().toISOString() });
}
