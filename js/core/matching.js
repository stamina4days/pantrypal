"use strict";
/* Matching food names. "Roma tomatoes" and "tomato" need to count as the same food, so canon() boils a name
   down to its plain form (singular, known phrases, aliases), and related() also accepts a parent, like chicken for chicken thighs. */
function singular(w) {
  if (w.length <= 3 || /(ss|us|is)$/.test(w)) return w;
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (/(oes|ches|shes|xes)$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}
/* Lowercase, drop accents and punctuation, singularize, and pad with spaces for whole-word matching. */
function norm(s) {
  const words = String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean).map(singular);
  return " " + words.join(" ") + " ";
}
const PHRASES = new Map();
const PARENT = new Map();
const BASIC_SET = new Set();
const canonCache = new Map();

function canon(name) {
  const n = norm(name);
  if (canonCache.has(n)) return canonCache.get(n);
  let best = "", bestLen = 0;
  for (const [p, k] of PHRASES) if (p.length > bestLen && n.includes(p)) { best = k; bestLen = p.length; }
  canonCache.set(n, best);
  return best;
}
function chain(k) {
  const out = [];
  while (k && !out.includes(k)) { out.push(k); k = PARENT.get(k); }
  return out;
}
function related(a, b) { return chain(a).includes(b) || chain(b).includes(a); }
