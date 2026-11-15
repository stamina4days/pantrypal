"use strict";
/* Scoring meals for the week. */
/* ---------- the planner ---------- */
function slotKey(date, slot) { return date + "|" + slot; }

function scoreForPlan(r, inv, D, f, ctx) {
  let score = 0;
  const allocs = [], shorts = [];
  for (const g of r.ingredients) {
    if (g.opt) continue;
    if (g.basic && basicHave(g)) continue;
    const used = ctx.ingUse[g.key] || 0;
    if (used >= 2) score -= 2.5 * (used - 1);       // same main ingredient again and again gets old
    const need = ingGrams(g, f);
    const a = allocate(inv, g.key, need, D);
    if (a) {
      allocs.push(a);
      for (const x of a.allocs) {
        const dd = x.p.exp ? daysBetween(D, x.p.exp) : 30;
        const w = dd <= 0 ? 10 : dd === 1 ? 8 : dd <= 3 ? 6 : dd <= 7 ? 3 : 1;
        const frac = a.need ? Math.min(1, (x.g || 0) / a.need) : 1;
        if (x.p.virtual) score += 2 + 0.3 * w * frac;   // uses up something already being bought this week
        else score += w * frac;
        if (!x.p.virtual && x.p.exp && dd <= 2) score += 6;   // rescues food that would otherwise go bad
      }
      if (!a.enough) { shorts.push({ g, need: a.need, got: a.got }); score -= 2.5 * (1 - a.got / a.need); }
    } else {
      shorts.push({ g, need, got: 0 });
      score -= 3.5;
    }
  }
  const P = ctx.P;
  if (P.cuisines.length && P.cuisines.includes(r.cuisine)) score += 2.5;
  const rating = (settings.ratings || {})[r.name];
  if (rating === 1) score += 3;
  if (settings.favorites.includes(r.name)) score += 2;
  score -= 15 * (ctx.familyCount[r.family] || 0);
  if (r.protein && r.protein === ctx.lastProtein) score -= 5;
  if (r.protein && (ctx.proteinCount[r.protein] || 0) >= 2) score -= 3;
  if (ctx.cuisineCount[r.cuisine] >= 2) score -= 3 * (ctx.cuisineCount[r.cuisine] - 1);
  if (ctx.recent.has(r.name)) score -= 3;
  if (P.kids && r.kid) score += 2.5;
  const nut = nutritionOf(r);
  if (P.goal === "protein") score += Math.max(-4, Math.min(8, (nut.protein - 22) / 3));
  if (P.goal === "lighter") score += Math.max(-8, Math.min(4, (520 - nut.cal) / 40));
  let cost = 0;
  for (const s of shorts) { const sg = s.need == null ? (pkgGrams(s.g.key) || 100) : s.need - s.got; const pp = pricePerG(s.g.key); cost += sg * (pp == null ? 0.01 : pp); }
  if (P.weeklyBudget > 0) {
    const perMeal = (P.weeklyBudget - ctx.spent) / Math.max(1, ctx.mealsLeft);
    if (cost > perMeal) score -= (cost - perMeal) * 1.2;
  } else score -= cost * 0.15;
  score -= r.time * 0.02;
  score += Math.random() * 2;                       // a little variety, so "Try again" gives a new plan
  return { score, allocs, shorts };
}

function addPurchases(buy, inv, shorts, D, r, f, ctx) {
  for (const s of shorts) {
    const g = s.g;
    const k = g.key;
    const entry = buy.get(k) || { key: k, name: ingName(g, r), amts: [], from: [] };
    const frac = s.need ? (s.need - s.got) / s.need : 1;
    if (g.amt) entry.amts.push(shortAmount(g.amt, f, frac));
    if (!entry.from.includes(rName(r))) entry.from.push(rName(r));
    buy.set(k, entry);
    const shortG = s.need == null ? null : s.need - s.got;
    const pkg = pkgGrams(k);
    const bought = shortG == null ? (pkg || 100) : (pkg && pkg > shortG ? pkg : shortG);
    const pp = pricePerG(k);
    const cost = bought * (pp == null ? 0.01 : pp);
    if (ctx) ctx.spent += cost;
    entry.cost = (entry.cost || 0) + cost;
    const left = shortG == null ? (pkg ? pkg * 0.7 : NaN) : (pkg && pkg > shortG ? pkg - shortG : 0);
    if (left > 0 || isNaN(left)) {
      const est = estimateShelf(g.name, guessLoc(g.name));
      inv.push({ item: null, key: k, d: null, exp: addDaysFrom(D, est ? est.days : 7), remG: left, virtual: true });
    }
  }
}
