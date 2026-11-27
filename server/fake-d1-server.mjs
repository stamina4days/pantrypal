// For testing on a computer: runs the Worker with a pretend D1 database kept in memory.
// node server/fake-d1-server.mjs 8790
import http from "node:http";
import worker from "./sync-worker.js";
const rows = new Map();
const DB = {
  prepare(sql) {
    let args = [];
    const st = {
      bind(...a) { args = a; return st; },
      async first() {
        if (sql.startsWith("SELECT")) { const r = rows.get(args[0]); return r ? { v: r.v, d: r.d } : null; }
      },
      async run() {
        let changes = 0;
        if (sql.startsWith("INSERT")) { const [id, d, u, s] = args; if (!rows.has(id)) { rows.set(id, { v: 1, d, updated: u, seen: s }); changes = 1; } }
        else if (sql.startsWith("UPDATE kitchens SET v")) { const [d, u, s, id, v] = args; const r = rows.get(id); if (r && r.v === v) { r.v++; r.d = d; r.updated = u; r.seen = s; changes = 1; } }
        else if (sql.startsWith("UPDATE kitchens SET seen")) { const r = rows.get(args[1]); if (r) { r.seen = args[0]; changes = 1; } }
        else if (sql.startsWith("DELETE")) { for (const [id, r] of rows) if (r.seen < args[0]) { rows.delete(id); changes++; } }
        return { meta: { changes } };
      }
    };
    return st;
  }
};
const port = Number(process.argv[2] || 8790);
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const r = await worker.fetch(new Request("http://localhost:" + port + req.url, { method: req.method, headers: req.headers, body: ["GET", "HEAD", "OPTIONS"].includes(req.method) ? undefined : body }), { DB });
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(port, () => console.log("fake sync server on", port));
