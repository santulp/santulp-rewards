const { getStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if(event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  const store = getStore({ name: 'santulp-rewards', consistency: 'strong' });
  const { action, key, value } = JSON.parse(event.body || '{}');

  try {
    switch(action) {

      case 'get': {
        try {
          const data = await store.get(key, { type: 'json' });
          return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, value: data }) };
        } catch(e) {
          return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, value: null }) };
        }
      }

      case 'set': {
        await store.setJSON(key, value);
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
      }

      case 'list': {
        const result = await store.list({ prefix: key });
        const keys = result.blobs.map(b => b.key);
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, keys }) };
      }

      case 'getMany': {
        // Get multiple keys at once
        const results = {};
        await Promise.all(value.map(async k => {
          try {
            results[k] = await store.get(k, { type: 'json' });
          } catch(e) {
            results[k] = null;
          }
        }));
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, values: results }) };
      }

      default:
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok: false, error: 'Unknown action' }) };
    }
  } catch(err) {
    console.error('DB error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
