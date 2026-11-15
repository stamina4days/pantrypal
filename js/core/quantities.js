"use strict";
/* Converting amounts to grams. */
const _lk = new Map();
function _table(name, obj) {
  if (!_lk.has(name)) { const m = new Map(); for (const [k, v] of Object.entries(obj)) m.set(norm(k).trim(), v); _lk.set(name, m); }
  return _lk.get(name);
}
/* Look up a value for an ingredient key, walking up to more general names. */
function byKey(name, obj, key) {
  const m = _table(name, obj);
  for (const k of chain(key)) { const v = m.get(k.trim()); if (v != null) return v; }
  return null;
}
function unitOf(word) {
  if (!word) return null;
  const w = singular(String(word).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\.$/, ""));
  if (w === "lbs") return UNITS.lb;
  return UNITS[w] || UNITS[w.replace(/e$/, "")] || null;
}
/* "1 1/2 cups" -> {q:1.5, unit:"cups", rest:" cups", inner:null}; "1 can (28 oz)" -> inner grams 794 */
function parseQty(amt) {
  const s = String(amt || "").trim();
  const m = s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(.*)$/);
  if (!m) return null;
  const q = parseAmt(m[1]);
  let rest = m[2] || "", inner = null;
  const par = rest.match(/\((\d+(?:\.\d+)?)\s*([a-z]+)\)/i);
  if (par) {
    const u = unitOf(par[2]);
    if (u && u[0] === "mass") inner = Number(par[1]) * u[1];
    else if (u && u[0] === "vol") inner = Number(par[1]) * u[1];
    rest = rest.replace(par[0], "").trim();
  }
  const word = (rest.match(/^[A-Za-zÀ-ſ]+/) || [""])[0];
  return { q, unit: word, rest: m[2] ? " " + m[2] : "", inner };
}
function eachGrams(key, factor) { return (byKey("each", EACH_G, key) || 100) * (factor || 1); }

/* Convert an amount of an ingredient to grams. Returns null when it can't be known. */
function gramsOf(q, unitWord, key, inner) {
  if (q == null || isNaN(q)) return null;
  if (inner) return q * inner;
  const u = unitOf(unitWord);
  if (!u) return q * eachGrams(key);                       // "3 eggs", "2 onions", "12" with no unit
  const [kind, size] = u;
  if (kind === "mass") return q * size;
  if (kind === "vol") return q * size * (byKey("density", DENSITY, key) || .8);
  if (kind === "each") return q * eachGrams(key, size);
  if (kind === "count") { const t = NAMED_G[size]; return q * (byKey("named-" + size, t, key) || t["*"]); }
  if (kind === "pkg") { const p = byKey("pkg", PKG_G, key); return p ? q * p : null; }
  return null;
}
function ingGrams(g, f) {
  const p = parseQty(g.amt);
  return p ? gramsOf(p.q * (f || 1), p.unit, g.key, p.inner) : null;
}
function itemGrams(item, key) {
  if (!hasAmount(item)) return null;
  const u = unitOf(item.unit);
  if (u && u[0] === "pkg" && u[1] === "serving") return null;
  return gramsOf(item.amount, item.unit, key || canon(item.name), null);
}
const pkgGrams = key => byKey("pkg", PKG_G, key);

/* How much of a recipe amount is still needed: "1 1/2 cups" with 40% short -> "2/3 cup" */
function shortAmount(amt, f, frac) {
  const p = parseQty(amt);
  if (!p) return amt || "";
  const u = unitOf(p.unit);
  let q = p.q * (f || 1) * frac;
  if (!u || u[0] === "each" || u[0] === "count") q = Math.ceil(q - 0.05);
  return fmtFrac(Math.max(q, 0)) + p.rest;
}
