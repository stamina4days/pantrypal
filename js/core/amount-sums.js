"use strict";
/* Adding amounts together. */
/* Add up amounts that share a unit: ["2 cloves","1 clove","3 cloves"] -> ["6 cloves"] */
function sumAmts(list) {
  const groups = new Map(), other = [];
  for (const a of list) {
    const p = parseQty(a);
    if (!p) { if (a && !other.includes(a)) other.push(a); continue; }
    const key = p.rest.trim().toLowerCase().replace(/\b(\w+?)(es|s)\b/g, "$1");
    const gr = groups.get(key) || { q: 0, rest: p.rest, maxQ: 0 };
    gr.q += p.q;
    if (p.q >= gr.maxQ) { gr.maxQ = p.q; if (p.q > 1 || !gr.rest) gr.rest = p.rest; }
    groups.set(key, gr);
  }
  return [...[...groups.values()].map(g => {
    let rest = g.rest;
    if (g.q > 1 && /^\s*(cup|clove|can|slice|head|bunch|handful|fillet|stalk|leaf|taza|lata|rebanada|cabeza)\b/i.test(rest) && !/s\b/i.test(rest)) rest = rest.replace(/^(\s*\w+)/, m => (/(ch|sh)$/i.test(m) ? m + "es" : m + "s"));
    return fmtFrac(g.q) + rest;
  }), ...other];
}
const localAmt = a => LANG === "es" ? amtParts(a)[0] : a;
