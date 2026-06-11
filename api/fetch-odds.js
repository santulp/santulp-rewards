const ODDS_API_KEY = '388762c002c6ee37e4b21f01a3f02712';
const SUPA_URL = 'https://ayhoefdgcrgyryrufazr.supabase.co';
const SUPA_KEY = 'sb_publishable_3JGuVqHh0bhEDX3FUMq3vQ_-F5dtw9E';

const SPORTS = [
  { key: 'soccer_argentina_primera_division', name: 'Liga Argentina', emoji: '🇦🇷' },
  { key: 'soccer_epl',                        name: 'Premier League', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { key: 'soccer_uefa_champs_league',          name: 'Champions League', emoji: '⭐' },
  { key: 'soccer_spain_la_liga',               name: 'La Liga', emoji: '🇪🇸' },
  { key: 'basketball_nba',                     name: 'NBA', emoji: '🏀' },
  { key: 'mma_mixed_martial_arts',             name: 'UFC / MMA', emoji: '🥊' },
  { key: 'boxing_boxing',                      name: 'Boxeo', emoji: '🥊' },
  { key: 'tennis_atp',                         name: 'Tennis ATP', emoji: '🎾' },
  { key: 'esports_csgo_top_tier',              name: 'CS:GO Esports', emoji: '🎮' },
];

async function fetchOddsForSport(sportKey) {
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal&dateFormat=iso&daysFrom=1`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return await res.json();
}

async function saveCacheToSupabase(sport, data) {
  await fetch(`${SUPA_URL}/rest/v1/odds_cache`, {
    method: 'POST',
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ sport, data, updated_at: new Date().toISOString() })
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const results = {};
    for (const sport of SPORTS) {
      try {
        const odds = await fetchOddsForSport(sport.key);
        results[sport.key] = { ...sport, games: odds.slice(0, 10) };
        await saveCacheToSupabase(sport.key, results[sport.key]);
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch(e) {
        results[sport.key] = { ...sport, games: [], error: e.message };
      }
    }
    res.status(200).json({ ok: true, sports: Object.keys(results).length, timestamp: new Date().toISOString() });
  } catch(err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
