exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const CORS = {
    'Access-Control-Allow-Origin':  'https://santulp.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { code, code_verifier, redirect_uri } = JSON.parse(event.body);

    const res = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     '01KTT80ZR7DTAMC47CS0YSKY87',
        client_secret: 'c09d4b8b842632db91e38530666e127b1a15859b66716ad31c8c183bb812a17f',
        redirect_uri,
        code,
        code_verifier
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: data }) };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };

  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
