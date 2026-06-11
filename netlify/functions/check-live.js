exports.handler = async () => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const fallback = await fetch('https://kick.com/api/v1/channels/santulp');
    const data = await fallback.json();
    const isLive = data?.livestream !== null && data?.livestream !== undefined;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ isLive }) };
  } catch (err) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ isLive: false }) };
  }
};
