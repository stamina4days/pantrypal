/* Automatic meal planning and prep-day building.
   The planner walks through the days in order. For each meal it scores every recipe that fits
   your profile: food that expires soonest counts most, leftovers from things you'll buy that
   week count extra (so ingredients get shared), and missing items, repeats, and long weeknight
   cooking count against it. */

function profile() {
  return Object.assign({
    people: 2, appetite: 1, weeknight: 45, weekend: 90, cuisines: [], dislikes: "",
    equipment: ["oven", "microwave", "blender"], lunches: true, breakfasts: false, prepDay: 0, kids: false, weeklyBudget: 0, goal: ""
  }, settings.household || {});
}
const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000);
function equipOK(r, eq) {
  return !r.equip || r.equip.every(e => e.split("|").some(x => eq.includes(x)));
}
function dislikeKeys() {
  return String(profile().dislikes || "").split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
    .map(w => ({ key: canon(w), word: norm(w).trim() }));
}
function hasDisliked(r, dk) {
  if (!dk.length) return false;
  const nm = norm(r.name + " " + (r.es ? r.es.name : ""));
  return dk.some(d => (d.key && r.ingredients.some(g => !g.opt && related(d.key, g.key))) || (d.word && nm.includes(" " + d.word + " ")));
}
/* Can this person make this recipe at all? (diet, equipment, dislikes, thumbs down) */
function fitsProfile(r, dk) {
  if (!recipeAllowed(r, settings.diets)) return false;
  if (settings.household && !equipOK(r, profile().equipment)) return false;
  if ((settings.ratings || {})[r.name] === -1) return false;
  return !hasDisliked(r, dk || dislikeKeys());
}
/* Servings for this household. Desserts, drinks, and snacks keep their own size. */
function householdServings(r) {
  if (!settings.household || !["Breakfast", "Lunch", "Dinner", "Side"].includes(r.type)) return r.serves;
  const P = profile();
  return Math.max(1, Math.round(P.people * P.appetite));
}

/* ---------- inventory with quantities ---------- */
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

/* opts: {start, days, forced: {slotKey: recipeName}, exclude: {slotKey: [names]}} */
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
      meals.push({ id, date: D, slot: "breakfast", recipe: best.r.name, servings: best.servings, cookOn: best.cookOn });
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
    meals.push({ id, date: D, slot: "dinner", recipe: best.r.name, servings: best.servings, cookOn: best.cookOn });
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
    toBuy: buy.size,
    spent: ctx.spent,
    budget: P.weeklyBudget || 0,
    avgCal: 0, avgProtein: 0
  };
  const dins = meals.filter(m => m.slot === "dinner" && !m.fromId).map(m => nutritionOf(recipeByName(m.recipe)));
  if (dins.length) { stats.avgCal = dins.reduce((a, n) => a + n.cal, 0) / dins.length; stats.avgProtein = dins.reduce((a, n) => a + n.protein, 0) / dins.length; }
  return { meals, buy: [...buy.values()].map(b => ({ ...b, amt: sumAmts(b.amts).map(localAmt).join(" + ") })), stats, start: opts.start, days: opts.days, prepDate };
}

/* ---------- prep day ---------- */
const CHOP_KEYS = ["onion", "garlic", "bell pepper", "carrot", "celery", "broccoli", "cauliflower", "zucchini", "mushroom", "potato", "sweet potato",
  "cabbage", "scallion", "cilantro", "tomato", "cucumber", "jalapeno", "ginger", "green bean", "asparagus", "butternut squash", "brussel sprout", "kale"];

function ovenTemp(r) {
  for (const s of r.steps) { const m = s.match(/(?:oven|horno)[^.]*?(\d{3})\s*°?\s*F/i) || s.match(/(\d{3})F\s*\(\d{3}C\)/); if (m) return Number(m[1]); }
  return null;
}
/* Build an ordered task list for cooking several planned meals at once. */
function buildPrepSession(mealList) {
  const rows = mealList.map(m => { const r = recipeByName(m.recipe); return r ? { m, r, f: m.servings / r.serves } : null; }).filter(Boolean);
  const tasks = [];
  if (!rows.length) return tasks;
  const names = list => [...new Set(list)].join(", ");

  const ovens = rows.map(x => ({ x, temp: ovenTemp(x.r) })).filter(o => o.temp);
  if (ovens.length) {
    const temps = [...new Set(ovens.map(o => o.temp))].sort((a, b) => b - a);
    tasks.push({ id: "oven", section: "start", text: t("Preheat the oven to {temp}F for: {names}", { temp: temps[0], names: names(ovens.filter(o => o.temp === temps[0]).map(o => rName(o.x.r))) })
      + (temps.length > 1 ? " " + t("Then switch to {temps}F for the others.", { temps: temps.slice(1).join("F, ") }) : "") });
  }
  let riceMl = 0; const riceFor = [];
  rows.forEach(({ r, f }) => r.ingredients.forEach(g => {
    if (!g.opt && chain(g.key).includes(norm("rice"))) { const p = parseQty(g.amt); const u = p && unitOf(p.unit); if (u && u[0] === "vol") { riceMl += p.q * f * u[1]; riceFor.push(rName(r)); } }
  }));
  if (riceMl) {
    const cups = riceMl / 236.6;
    const cupTxt = n => fmtFrac(n) + " " + (n <= 1.01 ? t("cup") : t("cups"));
    tasks.push({ id: "rice", section: "start", minutes: 20, text: t("Cook rice once for: {names}. You need about {cups} cooked, from about {dry} uncooked.", { names: names(riceFor), cups: cupTxt(cups), dry: cupTxt(cups / 3) }) });
  }
  const chop = new Map();
  rows.forEach(({ r, f }) => r.ingredients.forEach(g => {
    if (g.opt) return;
    const k = CHOP_KEYS.find(c => chain(g.key).includes(norm(c)));
    if (!k) return;
    const e = chop.get(k) || { amts: [], g, r, from: [] };
    if (g.amt) e.amts.push(scaleAmt(g.amt, f));
    e.from.push(rName(r));
    chop.set(k, e);
  }));
  for (const [k, e] of chop) {
    const amt = sumAmts(e.amts).map(localAmt).join(" + ");
    const name = ingName(e.g, e.r);
    tasks.push({ id: "chop-" + k, section: "prep", text: t("Prep {what}", { what: (amt ? amt + " " : "") + name }), sub: names(e.from) });
  }

  const order = rows.slice().sort((a, b) => (ovenTemp(b.r) ? 1 : 0) - (ovenTemp(a.r) ? 1 : 0) || b.r.time - a.r.time);
  order.forEach(({ m, r, f }, i) => {
    tasks.push({ id: "cook-" + m.id, section: "cook", title: rName(r) + " · " + tn(m.servings, "1 serving", "{n} servings"), recipe: r.name, mealId: m.id,
      steps: rSteps(r).map((s, j) => ({ id: "cook-" + m.id + "-" + j, text: s, minutes: stepMinutes(s) })) });
  });
  order.forEach(({ m, r }) => {
    const cookDay = m.cookOn || m.date;
    const eatBy = addDaysFrom(cookDay, r.keeps);
    const deps = plan.filter(x => x.fromId === m.id || x.id === m.id).map(x => x.date);
    const late = deps.filter(d => d > eatBy);
    let text = t("Portion {name} into containers and label them. It keeps until {date} in the fridge.", { name: rName(r), date: prettyDate(eatBy) });
    if (late.length) text += " " + (r.freezes ? t("Freeze the portions for {days} and move them to the fridge the night before.", { days: late.map(dayName).join(", ") })
      : t("Heads up: {days} is past its fridge life, so cook that one fresh.", { days: late.map(dayName).join(", ") }));
    tasks.push({ id: "store-" + m.id, section: "store", text });
  });
  return tasks;
}
