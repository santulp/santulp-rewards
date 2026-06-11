export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).end();

  const { away, home, sport, odds } = req.body;
  const oddsText = Array.isArray(odds) && odds.length
    ? odds.map(o => `${o.name}: ${o.price}`).join(', ')
    : 'No disponibles';

  // Use ANTHROPIC_API_KEY from Vercel env, or fallback to direct call
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if(!apiKey) {
    return res.status(200).json({ 
      ok: true, 
      analysis: generateLocalAnalysis(away, home, sport, odds)
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        messages: [{
          role: 'user',
          content: `Sos un analista deportivo experto. Analizá este partido de ${sport}: ${away} vs ${home}.
Cuotas: ${oddsText}.
Respondé en español con: 1) Favorito según cuotas 2) Recomendación de apuesta 3) Confianza: Bajo/Medio/Alto. Máx 150 palabras.`
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || generateLocalAnalysis(away, home, sport, odds);
    res.status(200).json({ ok: true, analysis: text });
  } catch(err) {
    res.status(200).json({ ok: true, analysis: generateLocalAnalysis(away, home, sport, odds) });
  }
}

// Fallback analysis when no API key is configured
function generateLocalAnalysis(away, home, sport, odds) {
  if(!Array.isArray(odds) || odds.length === 0) {
    return `**${away} vs ${home}** (${sport})\n\nNo hay cuotas disponibles para analizar este evento. Te recomendamos revisar las cuotas en Stake Argentina antes de apostar.`;
  }

  const sorted = [...odds].sort((a, b) => a.price - b.price);
  const favorite = sorted[0];
  const underdog = sorted[sorted.length - 1];
  const draw = odds.find(o => o.name === 'Draw' || o.name === 'Empate');

  const implied = (1 / favorite.price * 100).toFixed(0);

  let rec = '';
  if(favorite.price < 1.5) {
    rec = `Las cuotas indican un favorito claro (${favorite.price}). Apostar al favorito tiene bajo riesgo pero baja ganancia. **Confianza: Medio.**`;
  } else if(favorite.price < 2.0) {
    rec = `${favorite.name} es el favorito con ${implied}% de probabilidad implícita. Una apuesta razonable con buen balance riesgo/retorno. **Confianza: Medio.**`;
  } else {
    rec = `Las cuotas están equilibradas. ${favorite.name} es leve favorito (${favorite.price}). Partido abierto — considerar apuesta pequeña. **Confianza: Bajo.**`;
  }

  return `**${away} vs ${home}**\n\n🏆 **Favorito:** ${favorite.name} (${favorite.price})\n📊 **Probabilidad implícita:** ${implied}%\n${draw ? `🤝 **Empate:** ${draw.price}\n` : ''}📌 **Análisis:** ${rec}\n\n⚠️ *Apostá con responsabilidad. Esta es una estimación basada en cuotas.*`;
}
