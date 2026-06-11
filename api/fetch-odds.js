const ODDS_API_KEY = '388762c002c6ee37e4b21f01a3f02712';
const SUPA_URL = 'https://ayhoefdgcrgyryrufazr.supabase.co';
const SUPA_KEY = 'sb_publishable_3JGuVqHh0bhEDX3FUMq3vQ_-F5dtw9E';

const SPORTS = [
  { key: 'soccer_fifa_world_cup',             name: 'Mundial 2026', emoji: '🌍' },
  { key: 'soccer_argentina_primera_division', name: 'Liga Argentina', emoji: '🇦🇷' },
  { key: 'soccer_brazil_campeonato',          name: 'Brasil Serie A', emoji: '🇧🇷' },
  { key: 'basketball_nba',                    name: 'NBA', emoji: '🏀' },
  { key: 'mma_mixed_martial_arts',            name: 'UFC / MMA', emoji: '🥊' },
  { key: 'boxing_boxing',                     name: 'Boxeo', emoji: '🥊' },
  { key: 'tennis_atp',                        name: 'Tennis ATP', emoji: '🎾' },
  { key: 'tennis_wta',                        name: 'Tennis WTA', emoji: '🎾' },
];

async function fetchOddsForSport(sportKey) {
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal&dateFormat=iso&daysFrom=4`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const log = [];
  let totalGames = 0;

  for (const sport of SPORTS) {
    try {
      const odds = await fetchOddsForSport(sport.key);
      if (odds.length === 0) { log.push(`${sport.key}: 0 games, skipped`); continue; }

      const sportData = { ...sport, games: odds.slice(0, 8) };
      
      // Try upsert into Supabase
      const supaRes = await fetch(`${SUPA_URL}/rest/v1/odds_cache`, {
        method: 'POST',
        headers: {
          'apikey': SUPA_KEY,
          'Authorization': `Bearer ${SUPA_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({ sport: sport.key, data: sportData, updated_at: new Date().toISOString() })
      });

      const supaBody = await supaRes.text();
      log.push(`${sport.key}: ${odds.length} games, supabase status=${supaRes.status}, body=${supaBody.slice(0,100)}`);
      totalGames += odds.length;
      await new Promise(r => setTimeout(r, 300));
    } catch(e) {
      log.push(`${sport.key}: ERROR ${e.message}`);
    }
  }

  res.status(200).json({ ok: true, totalGames, log, timestamp: new Date().toISOString() });
}
