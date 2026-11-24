"use strict";
/* Sets food aside for planned meals. Each food in the kitchen becomes an entry with grams left, and recipes take
   from the soonest-expiring entries first, so two meals in the plan never count the same chicken. */
function makeEntry(item) {
  const key = canon(item.name);
  const g = itemGrams(item, key);
  return { item, key, d: daysLeft(item.expires), exp: item.expires || null, remG: g == null ? NaN : g };
}
/* Take what a recipe needs from the pool, soonest-expiring first. Doesn't change the pool. */
function allocate(pool, key, needG, onDate) {
  const cands = pool.filter(p => p.key && !(p.remG <= 0) && related(p.key, key) && (!onDate || !p.exp || p.exp >= onDate))
    .sort((a, b) => (a.exp || "9999").localeCompare(b.exp || "9999"));
  if (!cands.length) return null;
  if (needG == null) return { allocs: [{ p: cands[0], g: null }], got: 1, need: null, enough: true };
  let got = 0;
  const allocs = [];
  for (const p of cands) {
    if (got >= needG) break;
    const avail = isNaN(p.remG) ? needG * 1.5 : p.remG;   // unknown amount: assume about a recipe and a half
    const take = Math.min(avail, needG - got);
    allocs.push({ p, g: take });
    got += take;
  }
  return { allocs, got, need: needG, enough: got >= needG * 0.85 };
}
function commitAlloc(a) {
  if (!a) return;
  for (const x of a.allocs) {
    if (x.g == null) continue;
    if (isNaN(x.p.remG)) x.p.remG = x.g * 0.5;   // we guessed 1.5x, so half a portion is left
    else x.p.remG -= x.g;
  }
}
