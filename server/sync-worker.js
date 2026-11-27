/* Benji's Kitchen kitchen sync: a tiny Cloudflare Worker with a D1 database.
   Each shared kitchen is one row: an id, a version number, and the kitchen's data.
   The data arrives already locked (encrypted) with the household's kitchen code, which never leaves the phones,
   so this server can't read anyone's food, lists, or plans. It only stores and hands back the locked data.

   API (all JSON):
     GET /k/<id>                     -> 200 { v, d } or 404
     PUT /k/<id>  body { v, d }      -> 200 { v } when v matched the stored version (0 for a new kitchen)
                                        409 { v, d } when someone else saved first (the phone merges and tries again)
     GET /health                     -> 200 { ok: true } */

const ORIGINS = ["https://stamina4days.github.io", "http://localhost:8765"];
const MAX_DATA = 400000;                       // about 400 KB of locked data per kitchen
const FORGET_AFTER = 180 * 24 * 3600 * 1000;   // kitchens nobody has opened for 180 days are deleted

function cors(req) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(req, status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors(req) } });
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url);
    if (url.pathname === "/health") return json(req, 200, { ok: true });
    const m = url.pathname.match(/^\/k\/([a-f0-9]{32})$/);
    if (!m) return json(req, 404, { error: "not found" });
    const id = m[1];

    if (req.method === "GET") {
      const row = await env.DB.prepare("SELECT v, d FROM kitchens WHERE id = ?").bind(id).first();
      if (!row) return json(req, 404, { error: "no kitchen" });
      // Opening a kitchen counts as using it, so active kitchens are never forgotten
      await env.DB.prepare("UPDATE kitchens SET seen = ? WHERE id = ?").bind(Date.now(), id).run();
      return json(req, 200, { v: row.v, d: row.d });
    }

    if (req.method === "PUT") {
      let body;
      try { body = await req.json(); } catch (e) { return json(req, 400, { error: "bad json" }); }
      const v = Number(body && body.v), d = body && body.d;
      if (!Number.isInteger(v) || v < 0 || typeof d !== "string" || !d.length) return json(req, 400, { error: "bad body" });
      if (d.length > MAX_DATA) return json(req, 413, { error: "too big" });
      const now = Date.now();
      let changes = 0;
      if (v === 0) {
        const r = await env.DB.prepare("INSERT INTO kitchens (id, v, d, updated, seen) VALUES (?, 1, ?, ?, ?) ON CONFLICT(id) DO NOTHING").bind(id, d, now, now).run();
        changes = r.meta.changes;
      } else {
        const r = await env.DB.prepare("UPDATE kitchens SET v = v + 1, d = ?, updated = ?, seen = ? WHERE id = ? AND v = ?").bind(d, now, now, id, v).run();
        changes = r.meta.changes;
      }
      if (!changes) {
        // Someone else saved first: send back what's there now
        const row = await env.DB.prepare("SELECT v, d FROM kitchens WHERE id = ?").bind(id).first();
        return json(req, 409, row ? { v: row.v, d: row.d } : { v: 0, d: null });
      }
      // Now and then, tidy away kitchens nobody has opened in a long time
      if (Math.random() < 0.02) await env.DB.prepare("DELETE FROM kitchens WHERE seen < ?").bind(now - FORGET_AFTER).run();
      return json(req, 200, { v: v + 1 });
    }
    return json(req, 405, { error: "method" });
  }
};
