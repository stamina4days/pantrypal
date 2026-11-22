"use strict";
/* The meal plan. */
/* ---------- PLAN ---------- */
function renderPlan() {
  const { evs } = planReservations();
  const today = todayStr();
  const slotOrder = { breakfast: 0, lunch: 1, dinner: 2 };
  const slotName = m => t(m.slot === "breakfast" ? "Breakfast" : m.slot === "lunch" ? "Lunch" : "Dinner");
  const mealHtml = m => {
    const r = recipeByName(m.recipe);
    if (!r) return "";
    const parent = m.fromId ? plan.find(x => x.id === m.fromId) : null;
    const ev = evs.get(m.id);
    let status = "";
    if (m.prepped) status = `<span class="tag ok">${esc(t("Prepped and in the fridge"))}</span>`;
    else if (m.fromId) status = `<span class="tag">${esc(m.slot === "lunch" ? t("Leftovers from last night") : t("Already made"))}</span>`;
    else if (ev) status = (ev.missing.length || ev.short.length)
      ? `<span class="tag miss">${esc(t("Need:"))} ${[...ev.missing, ...ev.short.map(s => s.g)].map(g => esc(ingName(g, r))).join(", ")}</span>`
      : `<span class="tag ok">${esc(t("Ready to cook"))}</span>`;
    if (!m.fromId && !m.prepped && m.cookOn && m.cookOn !== m.date) status += `<span class="tag diet">${esc(t("Cook {day}", { day: dayRef(m.cookOn) }))}</span>`;
    return `<li class="recipe meal" data-meal="${m.id}" role="button" tabindex="0">
      <div class="r-head"><strong><span class="slot">${esc(slotName(m))}</span> ${esc(rName(r))}</strong>${m.fromId ? "" : `<button class="row-btn" data-unplan="${m.id}" aria-label="${esc(t("Remove from plan"))}">&times;</button>`}</div>
      <div class="r-tags"><span class="tag">${esc(tn(m.servings, "1 serving", "{n} servings"))}</span>${status}</div></li>`;
  };
  const sorted = list => list.slice().sort((a, b) => a.date.localeCompare(b.date) || (slotOrder[a.slot || "dinner"] - slotOrder[b.slot || "dinner"]));
  let html = "";
  const earlier = plan.filter(m => m.date < today && !m.fromId);
  if (earlier.length) html += `<h3 class="day-head">${esc(t("Earlier (not marked as made)"))}</h3><ul class="list">${sorted(earlier).map(mealHtml).join("")}</ul>`;
  // The wall calendar: this week as seven squares, each with its first meal as a sticker, today circled
  let week = "", planned = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDaysFrom(today, i), meals = sorted(plan.filter(m => m.date === d)), dt = parseDay(d);
    const r = meals.length ? recipeByName(meals[0].recipe) : null;
    if (meals.length) planned++;
    week += `<button type="button" class="cal-day${i === 0 ? " today" : ""}${meals.length ? " has" : ""}" data-cal-day="${d}" aria-label="${esc(dayName(d) + ", " + (meals.length ? meals.map(m => rName(recipeByName(m.recipe) || { name: m.recipe })).join(", ") : t("Nothing planned")))}">
      <span class="cd-name">${esc(dt.toLocaleDateString(locale(), { weekday: "short" }))}</span><span class="cd-num">${dt.getDate()}</span>${r ? recipeArt(r, "cd-art") : `<span class="cd-plus" aria-hidden="true">+</span>`}</button>`;
  }
  const wk = $("#planWeek");
  if (wk) {
    wk.innerHTML = week;
    $("#calMonth").textContent = parseDay(today).toLocaleDateString(locale(), { month: "long" });
    $("#calCount").textContent = t("{a} of 7 days planned", { a: planned });
  }
  // Each day on its own tear-off page
  for (let i = 0; i < 7; i++) {
    const d = addDaysFrom(today, i), meals = sorted(plan.filter(m => m.date === d));
    html += `<section class="pday${i === 0 ? " today" : ""}" data-day="${d}"><div class="day-head"><h3>${esc(dayName(d))}</h3><button class="chip" data-plan-day="${d}">+ ${esc(t("Add"))}</button></div>`;
    html += (meals.length ? `<ul class="list">${meals.map(mealHtml).join("")}</ul>` : `<p class="muted small">${esc(t("Nothing planned"))}</p>`) + `</section>`;
  }
  const later = plan.filter(m => m.date > addDaysFrom(today, 6));
  if (later.length) html += `<h3 class="day-head">${esc(t("Later"))}</h3><ul class="list">${sorted(later).map(m => mealHtml(m).replace("</strong>", ` <span class="muted small">${esc(dayName(m.date))}</span></strong>`)).join("")}</ul>`;
  $("#planBody").innerHTML = html;
  $("#planShopBtn").disabled = !plan.some(m => !m.fromId && !m.prepped);
  $("#prepBtn").disabled = !plan.some(m => !m.fromId && !m.prepped && (m.cookOn || m.date) >= today);
}
function planShoppingEntries() {
  const { evs } = planReservations();
  const agg = new Map();
  for (const m of plan) {
    if (m.fromId || m.prepped || (m.cookOn || m.date) < todayStr()) continue;
    const r = recipeByName(m.recipe), ev = evs.get(m.id);
    if (!r || !ev) continue;
    const f = m.servings / r.serves;
    const add = (g, amt) => {
      const key = norm(g.name);
      const e = agg.get(key) || { name: ingName(g, r), amts: [], checked: true, from: [] };
      if (amt) e.amts.push(amt);
      if (!e.from.includes(rName(r))) e.from.push(rName(r));
      agg.set(key, e);
    };
    ev.missing.forEach(g => add(g, scaleAmt(g.amt, f)));
    ev.short.forEach(s => { const fr = s.need ? (s.need - s.got) / s.need : 1; add(s.g, shortAmount(s.g.amt, f, fr)); });
  }
  return [...agg.values()].map(e => ({ ...e, amt: sumAmts(e.amts).map(localAmt).join(" + "), note: e.from.join(", ") }));
}
function planShopping() {
  const entries = planShoppingEntries();
  if (!entries.length) { toast(t("You have everything for your planned meals.")); return; }
  openListPicker(entries, t("Shopping for your plan"));
}
