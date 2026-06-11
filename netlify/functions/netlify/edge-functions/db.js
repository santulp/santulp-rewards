import { getStore } from '@netlify/blobs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export default async (request, context) => {
  if(request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS });
  }

  const store = getStore({ name: 'santulp-rewards', consistency: 'strong' });
  const { action, key, value } = await request.json();

  try {
    switch(action) {

      case 'get': {
        try {
          const data = await store.get(key, { type: 'json' });
          return new Response(JSON.stringify({ ok: true, value: data }), { headers: CORS });
        } catch(e) {
          return new Response(JSON.stringify({ ok: false, value: null }), { headers: CORS });
        }
      }

      case 'set': {
        await store.setJSON(key, value);
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      }

      case 'list': {
        const result = await store.list({ prefix: key });
        const keys = result.blobs.map(b => b.key);
        return new Response(JSON.stringify({ ok: true, keys }), { headers: CORS });
      }

      case 'getMany': {
        const results = {};
        await Promise.all(value.map(async k => {
          try {
            results[k] = await store.get(k, { type: 'json' });
          } catch(e) {
            results[k] = null;
          }
        }));
        return new Response(JSON.stringify({ ok: true, values: results }), { headers: CORS });
      }

      default:
        return new Response(JSON.stringify({ ok: false, error: 'Unknown action' }), { status: 400, headers: CORS });
    }
  } catch(err) {
    console.error('DB error:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: CORS });
  }
};

export const config = { path: '/api/db' };
