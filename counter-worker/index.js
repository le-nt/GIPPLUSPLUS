// GIP++ counter server: Cloudflare Worker + D1. Stores one random UUID per install and a last-seen time.
// It never reads or stores IP addresses, headers or anything else from the request.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = 24 * 60 * 60 * 1000;

async function counts(env) {
  const since = Date.now() - 30 * DAY;
  const row = await env.DB.prepare('SELECT COUNT(*) AS total, COALESCE(SUM(last_seen > ?1), 0) AS active FROM installs').bind(since).first();
  return { total: row.total, active: row.active };
}
const json = (obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...extra } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    try {
      if (req.method === 'POST' && url.pathname === '/ping') {
        let body = null;
        try { body = await req.json(); } catch (e) {}
        const id = body && typeof body.id === 'string' ? body.id : '';
        if (!UUID.test(id)) return json({ error: 'bad id' }, 400);
        const now = Date.now();
        await env.DB.prepare('INSERT INTO installs (id, first_seen, last_seen) VALUES (?1, ?2, ?2) ON CONFLICT(id) DO UPDATE SET last_seen = ?2').bind(id.toLowerCase(), now).run();
        return json(await counts(env));
      }
      if (req.method === 'GET' && url.pathname === '/count') {
        return json(await counts(env), 200, { 'Cache-Control': 'public, max-age=60' });
      }
      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: 'server error' }, 500);
    }
  },
};
