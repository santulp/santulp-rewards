export default async function handler(req, res) {
  if(req.method !== 'POST') return res.status(405).end();

  res.setHeader('Access-Control-Allow-Origin', 'https://santulp-rewards.vercel.app');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { code, code_verifier, redirect_uri } = req.body;

  const response = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: '01KTT80ZR7DTAMC47CS0YSKY87',
      client_secret: 'c09d4b8b842632db91e38530666e127b1a15859b66716ad31c8c183bb812a17f',
      redirect_uri,
      code,
      code_verifier
    })
  });

  const data = await response.json();
  if(!response.ok) return res.status(400).json({ error: data });
  return res.status(200).json(data);
}
