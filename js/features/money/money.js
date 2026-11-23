"use strict";
/* Money at risk.
   The app thinks about food waste in dollars, the way Benji does. Three pieces work together:
   1. itemValue(item): what a food is worth, from your own receipt prices when it knows them, typical prices otherwise.
   2. spoilChance(item, onDate): the chance a food goes bad before it gets used. It starts from how many days are
      left, then leans on this kitchen's own history: foods you've tossed before count as riskier.
   3. sureness(item): how sure Benji is that the food is still there, in the amount on file. It fades a little
      every day since someone last saw it, faster for foods that don't keep long.
   Recipes, the week planner, Today, and Fridge Sort all rank and talk about food with these numbers. */

/* Days left -> chance it goes to waste if nobody plans around it. Points in between are blended. */
const RISK_CURVE = [[0, 0.9], [1, 0.75], [2, 0.6], [3, 0.45], [5, 0.3], [7, 0.18], [14, 0.06], [30, 0.02]];
function riskCurve(d) {
  if (d <= RISK_CURVE[0][0]) return RISK_CURVE[0][1];
  for (let i = 1; i < RISK_CURVE.length; i++) {
    const [d1, p1] = RISK_CURVE[i];
    if (d <= d1) { const [d0, p0] = RISK_CURVE[i - 1]; return p0 + (p1 - p0) * (d - d0) / (d1 - d0); }
  }
  return 0.01;
}

/* How often this kitchen has thrown out a food, from 0 (never) to 1 (every time). Cached until history changes. */
let tossCache = { n: -1, map: new Map() };
function tossRate(key) {
  if (!key) return 0;
  if (tossCache.n !== history.length) {
    const m = new Map();
    for (const h of history) {
      const k = canon(h.name || "");
      if (!k) continue;
      const e = m.get(k) || { used: 0, wasted: 0 };
      if (h.outcome === "wasted") e.wasted++; else if (h.outcome === "used") e.used++;
      m.set(k, e);
    }
    tossCache = { n: history.length, map: m };
  }
  const e = tossCache.map.get(key);
  if (!e || e.used + e.wasted < 2) return 0;
  return e.wasted / (e.used + e.wasted);
}

function spoilChance(item, onDate) {
  if (!item || !item.expires) return 0.08;
  const d = onDate ? daysBetween(onDate, item.expires) : daysLeft(item.expires);
  if (d < 0) return 1;
  const p = riskCurve(d) * (1 + 0.8 * tossRate(canon(item.name)));
  return Math.min(0.99, p);
}

/* Dollars. Known amount and price: exact. Known price only: one typical package. Neither: a small default. */
function itemValue(item) {
  if (!item) return 0;
  const v = typeof foodValue === "function" ? foodValue(item) : 0;
  if (v > 0) return v;
  const key = canon(item.name), pp = pricePerG(key), g = pkgGrams(key);
  if (pp && g) return Math.round(pp * g * 100) / 100;
  return 1.5;
}
const moneyAtRisk = (item, onDate) => itemValue(item) * spoilChance(item, onDate);

/* The share of a food that a recipe allocation takes. Unknown amounts count as most of it. */
function allocShare(x) {
  if (!x || !x.p || !x.p.item) return 0;
  if (x.g == null) return 0.6;
  const total = itemGrams(x.p.item, x.p.key);
  return total ? Math.min(1, x.g / total) : 0.6;
}

/* Dollars a recipe would keep out of the trash: for each food it uses,
   the share it takes x what that food is worth x the chance it would otherwise spoil. */
function rescueOf(allocList, onDate) {
  let dollars = 0;
  const foods = new Map();
  for (const a of allocList) {
    if (!a) continue;
    for (const x of a.allocs) {
      const it = x.p && x.p.item;
      if (!it || x.p.virtual) continue;
      const d = itemValue(it) * allocShare(x) * spoilChance(it, onDate);
      dollars += d;
      foods.set(it.id, { item: it, dollars: (foods.get(it.id) || { dollars: 0 }).dollars + d });
    }
  }
  return { dollars, foods: [...foods.values()].sort((a, b) => b.dollars - a.dollars) };
}
const rescueOfEval = (ev, onDate) => rescueOf(ev.have.filter(h => !h.g.basic).map(h => h.alloc), onDate);

/* Everything in the kitchen likely to be wasted in the next `days` days, biggest dollars first. */
function kitchenRisk(days) {
  const list = items.filter(i => !i.leftover && i.expires).map(i => ({ item: i, d: daysLeft(i.expires) }))
    .filter(x => x.d !== null && x.d >= 0 && x.d <= (days || 7))
    .map(x => ({ ...x, dollars: moneyAtRisk(x.item) })).sort((a, b) => b.dollars - a.dollars);
  return { total: list.reduce((s, x) => s + x.dollars, 0), list };
}

/* How sure Benji is that a food is still there as recorded (1 = just checked). */
function sureness(item) {
  const seen = item.verified || item.bought || item.added;
  if (!seen) return 0.5;
  const age = Math.max(0, daysBetween(seen, todayStr()));
  const est = estimateShelf(item.name, item.location);
  const keeps = est ? est.days : 14;
  const tau = Math.max(3, Math.min(45, keeps * 0.5));
  return Math.exp(-age / tau);
}
/* The whole kitchen, weighted by what each food is worth, as a percent. */
function kitchenSureness() {
  const list = items.filter(i => !i.leftover);
  if (!list.length) return 100;
  let w = 0, s = 0;
  for (const i of list) { const v = Math.max(0.5, itemValue(i)); w += v; s += v * sureness(i); }
  return Math.round(s / w * 100);
}
/* Which real foods to ask about first: the ones Benji is least sure of, with the most money riding on them. */
function checkPriority(item) { return (1 - sureness(item)) * (1 + 2 * moneyAtRisk(item) + 0.3 * itemValue(item)); }

/* ---------- Plugging it into the app ----------
   Everything below hooks the engine into the shared app code without changing it: it wraps a few
   functions and fills the hook spots (ppHooks in js/ui/helpers.js). Without this file, the app runs as before. */
(function installMoney() {
  // Recipes: every evaluation carries the dollars it would rescue, and ranking counts them.
  const baseEvaluate = evaluate;
  evaluate = function (r, pool, diets, f, onDate) {
    const ev = baseEvaluate(r, pool, diets, f, onDate);
    ev.rescue = rescueOfEval(ev, onDate);
    ev.score += ev.rescue.dollars * 4;
    return ev;
  };
  ppHooks.recipeTags = (x, mode) => x.rescue && x.rescue.dollars >= 0.5 && mode !== "saved"
    ? `<span class="tag saves">${esc(t("Saves about {money}", { money: fmtMoney(x.rescue.dollars) }))}</span>` : "";
  ppHooks.recipeSorters = byName => ({ saves: (a, b) => b.rescue.dollars - a.rescue.dollars || byName(a, b) });
  const baseRenderRecipes = renderRecipes;
  renderRecipes = function () {
    const sel = document.getElementById("sortSelect");
    if (sel && !sel.querySelector('option[value="saves"]')) sel.insertAdjacentHTML("beforeend", `<option value="saves">${esc(t("Saves the most food money"))}</option>`);
    baseRenderRecipes();
    const c = document.getElementById("recipeCount");
    if (c && recipeMode === "foryou" && items.length && !focusItemId)
      c.textContent = tn(recipeResults.length, "1 recipe. The ones that save the most food money come first.", "{n} recipes. The ones that save the most food money come first.");
  };

  // Today's special: of the rescue recipes, pick the one that saves the most money.
  const baseSpecial = todaysSpecial;
  todaysSpecial = function () {
    const s = baseSpecial();
    if (!s || s.theme !== t("Rescue mission")) return s;
    const urgent = items.filter(i => !i.leftover && canon(i.name)).map(i => ({ i, d: daysLeft(i.expires) }))
      .filter(x => x.d !== null && x.d >= 0 && x.d <= 2).sort((a, b) => a.d - b.d);
    for (const { i } of urgent) {
      const best = recipesUsing(i.name, 4).sort((a, b) => b.rescue.dollars - a.rescue.dollars);
      if (!best.length) continue;
      const x = best[0], money = x.rescue.dollars;
      return { ...s, x, why: money >= 0.5 ? t("Saves about {money} of food, starting with your {name}.", { money: fmtMoney(money), name: i.name }) : s.why };
    }
    return s;
  };
  ppHooks.specialMeta = s => s.x.rescue && s.x.rescue.dollars >= 0.5 ? t("saves about {money}", { money: fmtMoney(s.x.rescue.dollars) }) : "";

  // Today: how much food money could go to waste this week.
  const baseRenderToday = renderToday;
  renderToday = function () {
    baseRenderToday();
    const room = document.querySelector("#tab-today .kitchen");
    if (!room) return;
    let rk = document.getElementById("todayRisk");
    if (!rk) { room.insertAdjacentHTML("afterbegin", `<button type="button" id="todayRisk" class="today-risk hidden" data-explain="risk"></button>`); rk = document.getElementById("todayRisk"); }
    const risk = kitchenRisk(7);
    rk.classList.toggle("hidden", risk.total < 1);
    rk.innerHTML = risk.total >= 1 ? `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/jar.svg#i"/></svg> ${esc(t("{money} of food could go to waste this week", { money: fmtMoney(risk.total) }))} <svg class="ic risk-how" aria-hidden="true"><use href="img/icons/ui/help.svg#i"/></svg><span class="sr-only">${esc(t("How is this worked out?"))}</span>` : "";
  };

  // Week planner: score each meal by the dollars it rescues on the day it's cooked, then report the total
  // and what's still at risk.
  const baseScoreForPlan = scoreForPlan;
  scoreForPlan = function (r, inv, D, f, ctx) {
    const sc = baseScoreForPlan(r, inv, D, f, ctx);
    const rescue = rescueOf(sc.allocs, D);
    sc.score += rescue.dollars * 3;
    sc.mealExtra = rescue.dollars >= 0.25 ? { rescue: Math.round(rescue.dollars * 100) / 100, rescueFoods: rescue.foods.slice(0, 3).map(x => x.item.name) } : {};
    return sc;
  };
  const baseRunPlanner = runPlanner;
  runPlanner = function (opts) {
    const pr = baseRunPlanner(opts);
    pr.stats.rescued = pr.meals.reduce((s, m) => s + (m.rescue || 0), 0);
    pr.stats.atRiskItems = items.filter(i => (pr.stats.atRiskIds || []).includes(i.id))
      .map(i => ({ id: i.id, name: i.name, dollars: moneyAtRisk(i), frozen: locIndex(i.location) === 2 })).sort((a, b) => b.dollars - a.dollars);
    return pr;
  };
  ppHooks.mealTags = m => m.rescue ? `<span class="tag saves">${esc(t("Rescues {money}: {foods}", { money: fmtMoney(m.rescue), foods: m.rescueFoods.join(", ") }))}</span>` : "";
  ppHooks.planReport = s => {
    if (!items.length) return "";
    const left = (s.atRiskItems || []).filter(x => !x.frozen);
    const lost = left.reduce((a, x) => a + x.dollars, 0);
    return `<div class="card rescue-card">
      <h3>${esc(t("Money saved"))}</h3>
      <p class="rescue-total">${esc(s.rescued >= 0.5 ? t("Rescues about {money} of food", { money: fmtMoney(s.rescued) }) : t("Nothing needs rescuing this week"))}</p>
      ${left.length ? `<p class="small">${esc(t("Still at risk: about {money}. Freeze these now and they'll keep.", { money: fmtMoney(lost) }))}</p>
        <ul class="at-risk-list">${left.slice(0, 6).map(x => `<li><span class="grow">${esc(x.name)} <span class="muted small">${esc(fmtMoney(x.dollars))}</span></span>
          <button type="button" data-freeze-risk="${esc(x.id)}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/snow.svg#i"/></svg> ${esc(t("Freeze"))}</button></li>`).join("")}</ul>` : ""}
    </div>`;
  };
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-freeze-risk]");
    if (!b) return;
    e.stopPropagation();
    editingId = b.dataset.freezeRisk; freezeOrThaw();
    const x = ((plannerState.proposal || {}).stats || {}).atRiskItems;
    const hit = x && x.find(i => i.id === b.dataset.freezeRisk);
    if (hit) hit.frozen = true;
    renderProposal(true);
  }, true);

  // Fridge Sort: ask about the foods Benji is least sure of, with the most money riding on them.
  sortRealCards = function () {
    return items.filter(i => !i.leftover && !i.recipe && sureness(i) < 0.8)
      .map(i => ({ i, pr: checkPriority(i) })).sort((a, b) => b.pr - a.pr)
      .slice(0, SORT_REAL_MAX).map(x => ({ real: true, item: x.i }));
  };
  const baseOpenSort = openSort;
  openSort = function () { const s0 = kitchenSureness(); baseOpenSort(); if (sortRound) sortRound.sure0 = s0; };
  ppHooks.realAnswers = it => hasAmount(it) ? `<button type="button" data-real="half"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/jar.svg#i"/></svg>${esc(t("About half"))}</button>
    <button type="button" data-real="low"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/minus.svg#i"/></svg>${esc(t("Almost gone"))}</button>` : "";
  ppHooks.realAnswer = (a, it) => {
    if (a !== "half" && a !== "low") return false;
    const left = it.amount * (a === "half" ? 0.5 : 0.2);
    it.amount = Math.max(0.25, Math.round(left * 4) / 4);
    it.verified = todayStr();
    return true;
  };
  ppHooks.realAnswerText = a => a === "half" ? t("Got it. Benji marked it about half left.") : a === "low" ? t("Got it. Benji marked it almost gone.") : "";
  ppHooks.sortEnd = r => {
    if (!items.length) return "";
    const p = kitchenSureness();
    return `<p class="sort-sure">${esc(r.checks && r.sure0 != null && p > r.sure0 ? t("Benji is now {p}% sure what's in your kitchen, up from {q}%.", { p, q: r.sure0 }) : t("Benji is {p}% sure what's in your kitchen.", { p }))}</p>`;
  };
  const baseRenderPlay = renderPlay;
  renderPlay = function () {
    baseRenderPlay();
    const best = document.getElementById("plySortBest");
    if (!best) return;
    let sure = document.getElementById("plySure");
    if (!sure) { best.insertAdjacentHTML("afterend", `<span id="plySure" class="sure-meter hidden"></span>`); sure = document.getElementById("plySure"); }
    const p = kitchenSureness();
    sure.classList.toggle("hidden", !items.length);
    sure.innerHTML = items.length ? `<span class="bar" aria-hidden="true"><span style="width:${p}%"></span></span><span>${esc(t("Benji is {p}% sure what's in your kitchen", { p }))}</span>` : "";
  };
})();
