const ODDS_API_KEY = '388762c002c6ee37e4b21f01a3f02712';
const SUPA_URL = 'https://ayhoefdgcrgyryrufazr.supabase.co';
const SUPA_KEY = 'sb_publishable_3JGuVqHh0bhEDX3FUMq3vQ_-F5dtw9E';

// Deportes activos en junio 2026 - Mundial + otros
const SPORTS = [
  { key: 'soccer_fifa_world_cup',              name: 'Mundial 2026', emoji: '🌍' },
  { key: 'soccer_argentina_primera_division',  name: 'Liga Argentina', emoji: '🇦🇷' },
  { key: 'soccer_brazil_campeonato',           name: 'Brasil Serie A', emoji: '🇧🇷' },
  { key: 'soccer_conmebol_copa_america',       name: 'Copa América', emoji: '🏆' },
  { key: 'basketball_nba',                     name: 'NBA', emoji: '🏀' },
  { key: 'basketball_euroleague',              name: 'Euroleague', emoji: '🏀' },
  { key: 'mma_mixed_martial_arts',             name: 'UFC / MMA', emoji: '🥊' },
  { key: 'boxing_boxing',                      name: 'Boxeo', emoji: '🥊' },
  { key: 'tennis_atp',                         name: 'Tennis ATP', emoji: '🎾' },
  { key: 'tennis_wta',                         name: 'Tennis WTA', emoji: '🎾' },
  { key: 'esports_csgo_top_tier',              name: 'CS:GO Esports', emoji: '🎮' },
  { key: 'esports_lol',                        name: 'League of Legends', emoji: '🎮' },
];

async function fetchOddsForSport(sportKey) {
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal&dateFormat=iso&daysFrom=4`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function saveCacheToSupabase(sport, data) {
  const res = await fetch(`${SUPA_URL}/rest/v1/odds_cache`, {
    method: 'POST',
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ sport, data, updated_at: new Date().toISOString() })
  });
  return res.ok;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const results = {};
    let totalGames = 0;

    for (const sport of SPORTS) {
      try {
        const odds = await fetchOddsForSport(sport.key);
        if (odds.length > 0) {
          const sportData = { ...sport, games: odds.slice(0, 8) };
          results[sport.key] = sportData;
          await saveCacheToSupabase(sport.key, sportData);
          totalGames += odds.length;
        }
        await new Promise(r => setTimeout(r, 300));
      } catch(e) {
        // Skip failed sport silently
      }
    }

    res.status(200).json({ 
      ok: true, 
      sports: Object.keys(results).length,
      totalGames,
      timestamp: new Date().toISOString() 
    });
  } catch(err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
