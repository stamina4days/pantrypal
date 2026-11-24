"use strict";
/* Builds a prep day from several meals: preheat once, cook shared grains once, chop everything together,
   then pack and store each meal. */
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
    tasks.push({ id: "cook-" + m.id, section: "cook", title: rName(r) + ", " + tn(m.servings, "1 serving", "{n} servings"), recipe: r.name, mealId: m.id,
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
