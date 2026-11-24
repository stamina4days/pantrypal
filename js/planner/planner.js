"use strict";
/* Plan my week. runPlanner() goes day by day and picks the best recipe for each meal (see score.js),
   setting food aside as it goes so later meals don't count on food an earlier one used up.
   opts: {start, days, forced: {slotKey: recipeName}, exclude: {slotKey: [names]}} */
function runPlanner(opts) {
  const P = profile();
  const dk = dislikeKeys();
  const dates = [];
  for (let i = 0; i < opts.days; i++) dates.push(addDaysFrom(opts.start, i));
  const end = dates[dates.length - 1];
  const res = planReservations(m => m.date < opts.start || m.date > end);
  const inv = res.pool.map(p => ({ ...p }));
  const prepDate = P.prepDay == null || P.prepDay < 0 ? null : (dates.find(d => parseDay(d).getDay() === Number(P.prepDay)) || null);
  const serv = Math.max(1, Math.round(P.people * P.appetite));
  const ctx = { P, familyCount: {}, proteinCount: {}, cuisineCount: {}, lastProtein: null, spent: 0, mealsLeft: opts.days, ingUse: {},
    recent: new Set(cookedLog.filter(c => c.date >= addDaysFrom(todayStr(), -7)).map(c => c.name)) };
  const meals = [], buy = new Map(), chosenNames = new Set();
  const forced = opts.forced || {}, exclude = opts.exclude || {};

  const pick = (cands, D, slot, makeServ, cookOnFor, limit) => {
    const fk = slotKey(D, slot);
    const list = forced[fk] ? [recipeByName(forced[fk])].filter(Boolean) : cands;
    let best = null;
    for (const r of list) {
      if (!forced[fk] && (chosenNames.has(r.name) || (exclude[fk] || []).includes(r.name))) continue;
      const servings = makeServ(r);
      const cookOn = cookOnFor(r);
      if (!forced[fk] && limit && cookOn === D && r.time > limit) continue;
      const sc = scoreForPlan(r, inv, cookOn, servings / r.serves, ctx);
      if (!best || sc.score > best.sc.score) best = { r, sc, servings, cookOn };
    }
    if (!best) return null;
    best.sc.allocs.forEach(commitAlloc);
    addPurchases(buy, inv, best.sc.shorts, best.cookOn, best.r, best.servings / best.r.serves, ctx);
    chosenNames.add(best.r.name);
    best.r.ingredients.forEach(g => { if (!g.opt && !g.basic) ctx.ingUse[g.key] = (ctx.ingUse[g.key] || 0) + 1; });
    ctx.familyCount[best.r.family] = (ctx.familyCount[best.r.family] || 0) + 1;
    ctx.cuisineCount[best.r.cuisine] = (ctx.cuisineCount[best.r.cuisine] || 0) + 1;
    if (best.r.protein) { ctx.proteinCount[best.r.protein] = (ctx.proteinCount[best.r.protein] || 0) + 1; }
    return best;
  };

  // Breakfasts: one batch recipe covers several mornings
  if (P.breakfasts) {
    const bf = RECIPES.filter(r => r.type === "Breakfast" && r.prep && fitsProfile(r, dk));
    let i = 0;
    while (i < dates.length && bf.length) {
      const D = dates[i];
      const cookDay = prepDate && prepDate <= D && daysBetween(prepDate, D) <= 1 ? prepDate : D;
      let covered = 1;
      const best = pick(bf, D, "breakfast", r => { covered = Math.max(1, Math.min(r.keeps, dates.length - i)); return Math.max(1, P.people * covered); }, () => cookDay, 0);
      if (!best) break;
      covered = Math.max(1, Math.round(best.servings / Math.max(1, P.people)));
      const id = uid();
      meals.push({ id, date: D, slot: "breakfast", recipe: best.r.name, servings: best.servings, cookOn: best.cookOn, ...(best.sc.mealExtra || {}) });
      for (let k = 1; k < covered && i + k < dates.length; k++) meals.push({ id: uid(), date: dates[i + k], slot: "breakfast", recipe: best.r.name, servings: P.people, fromId: id });
      i += covered;
    }
  }

  // Dinners, with leftovers packed for the next day's lunch
  const dinners = RECIPES.filter(r => r.type === "Dinner" && fitsProfile(r, dk));
  for (let i = 0; i < dates.length; i++) {
    const D = dates[i];
    const weekend = [0, 6].includes(parseDay(D).getDay());
    const limit = weekend ? P.weekend : P.weeknight;
    const wantLunch = P.lunches && i < dates.length - 1;
    ctx.mealsLeft = dates.length - i;
    let lunchFor = false;
    const best = pick(dinners, D, "dinner",
      r => { lunchFor = wantLunch && r.keeps >= 2; return serv * (lunchFor ? 2 : 1); },
      r => (prepDate && prepDate < D && r.prep && r.keeps >= daysBetween(prepDate, D) + (wantLunch && r.keeps >= 2 ? 1 : 0)) ? prepDate : D,
      limit);
    if (!best) continue;
    lunchFor = wantLunch && best.r.keeps >= 2;
    const id = uid();
    meals.push({ id, date: D, slot: "dinner", recipe: best.r.name, servings: best.servings, cookOn: best.cookOn, ...(best.sc.mealExtra || {}) });
    if (lunchFor) meals.push({ id: uid(), date: dates[i + 1], slot: "lunch", recipe: best.r.name, servings: serv, fromId: id });
    ctx.lastProtein = best.r.protein || null;
  }

  // What did we use, and what might still go to waste?
  const usedIds = new Set(), leftIds = new Set();
  inv.forEach(p => {
    if (!p.item) return;
    const orig = res.pool.find(q => q.item === p.item);
    if (orig && (p.remG < orig.remG || (isNaN(orig.remG) && !isNaN(p.remG)))) usedIds.add(p.item.id);
  });
  res.pool.forEach(p => { if (p.exp && p.exp <= end && !usedIds.has(p.item.id)) leftIds.add(p.item.id); });
  const stats = {
    used: usedIds.size,
    expiringUsed: [...usedIds].filter(id => { const it = items.find(x => x.id === id); return it && it.expires && it.expires <= end; }).length,
    atRisk: items.filter(i => leftIds.has(i.id)).map(i => i.name),
    atRiskIds: [...leftIds],
    toBuy: buy.size,
    spent: ctx.spent,
    budget: P.weeklyBudget || 0,
    avgCal: 0, avgProtein: 0
  };
  const dins = meals.filter(m => m.slot === "dinner" && !m.fromId).map(m => nutritionOf(recipeByName(m.recipe)));
  if (dins.length) { stats.avgCal = dins.reduce((a, n) => a + n.cal, 0) / dins.length; stats.avgProtein = dins.reduce((a, n) => a + n.protein, 0) / dins.length; }
  return { meals, buy: [...buy.values()].map(b => ({ ...b, amt: sumAmts(b.amts).map(localAmt).join(" + ") })), stats, start: opts.start, days: opts.days, prepDate };
}
