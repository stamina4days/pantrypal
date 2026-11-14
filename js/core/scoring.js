"use strict";
/* Ranking recipes by what you have. */
/* ---------- recipe scoring ---------- */
function urgencyWeight(d) {
  if (d === null) return 0.3;
  if (d <= 0) return 10;
  if (d === 1) return 8;
  if (d <= 3) return 6;
  if (d <= 7) return 3;
  if (d <= 14) return 1.5;
  return 0.5;
}
/* Food that recipes can use: not expired, not used up, not leftovers. */
function basePool() {
  return items
    .filter(i => !i.leftover && (!hasAmount(i) || i.amount > 0))
    .map(makeEntry)
    .filter(p => p.key && (p.d === null || p.d >= 0));
}
function bestMatch(pool, key) {
  const a = allocate(pool, key, null);
  return a ? a.allocs[0].p : null;
}
function findSub(g, pool, onDate) {
  for (const s of SUBS_PREP) {
    if (!s.needKey || !related(s.needKey, g.key)) continue;
    for (const uk of s.useKeys) {
      const a = allocate(pool, uk, null, onDate);
      if (a) return { sub: s, item: a.allocs[0].p.item, d: a.allocs[0].p.d, alloc: null };
      if (settings.assumeBasics && chain(uk).some(k => BASIC_SET.has(k)) && !(settings.missingBasics || []).includes(uk.trim())) return { sub: s, item: null, d: null };
    }
  }
  return null;
}
function evaluate(r, pool, diets, f, onDate) {
  f = f || 1;
  let urgency = 0, required = 0, haveReq = 0;
  const have = [], missing = [], subbed = [], short = [];
  for (const g of r.ingredients) {
    if (g.opt && diets.length && dietCheck(g, diets).blocked) continue;
    if (!g.opt) required++;
    const a = allocate(pool, g.key, ingGrams(g, f), onDate);
    let s;
    if (a) {
      const p0 = a.allocs[0].p;
      const enough = a.enough || g.basic;
      have.push({ g, item: p0.item, d: p0.d, alloc: a, enough });
      if (!enough && !g.opt) short.push({ g, need: a.need, got: a.got });
      if (!g.opt) haveReq += enough ? 1 : Math.max(0.3, a.got / a.need);
      if (!g.basic) { const w = urgencyWeight(p0.d); urgency += (g.opt ? w / 2 : w) * (enough ? 1 : 0.6); }
    } else if (g.basic && basicHave(g)) {
      if (!g.opt) haveReq++;
    } else if (!g.opt && settings.useSubs && (s = findSub(g, pool, onDate))) {
      subbed.push({ g, ...s });
      haveReq += 0.8;
      if (s.item) urgency += urgencyWeight(s.d) * 0.8;
    } else if (!g.opt) {
      missing.push(g);
    }
  }
  const coverage = required ? haveReq / required : 1;
  return { recipe: r, f, have, missing, subbed, short, haveReq, required, urgency,
    score: urgency * 3 + coverage * 10 - missing.length * 4 - short.length * 1.5 };
}

/* Meal plan: set aside food for planned meals, in date order. */
function planReservations(keep) {
  const pool = basePool();
  const evs = new Map();
  const meals = plan.filter(m => !m.fromId && !m.prepped && (!keep || keep(m)))
    .sort((a, b) => (a.cookOn || a.date).localeCompare(b.cookOn || b.date));
  for (const m of meals) {
    const r = recipeByName(m.recipe);
    if (!r) continue;
    const ev = evaluate(r, pool, settings.diets, m.servings / r.serves, m.cookOn || m.date);
    evs.set(m.id, ev);
    ev.have.forEach(h => commitAlloc(h.alloc));
  }
  return { pool, evs };
}
function availablePool(res) {
  return (res || planReservations()).pool.filter(p => !(p.remG <= 0));
}
