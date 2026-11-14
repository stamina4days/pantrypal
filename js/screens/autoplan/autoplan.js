"use strict";
/* Plan my week. */
/* ---------- auto planner UI ---------- */
let plannerState = null;
function openPlanner() {
  const P = profile();
  plannerState = { opts: { start: addDaysFrom(todayStr(), 1), days: 7 }, proposal: null, locks: new Set(), exclude: {} };
  $("#plannerResult").innerHTML = "";
  renderPlannerOpts(P);
  $("#plannerDialog").showModal();
}
function renderPlannerOpts(P) {
  const o = plannerState.opts;
  const opt = (v, l, cur) => `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${esc(l)}</option>`;
  $("#plannerOpts").innerHTML = `
    <p class="muted small">${esc(items.length ? t("Plans around what you have, using food that expires soonest first, and shares ingredients between meals so less goes to waste.") : t("Your pantry is empty, so everything will go on the shopping list. Meals still share ingredients so you buy less."))}</p>
    <div class="row">
      <label class="plain">${esc(t("Start"))} <select id="poStart">${opt(todayStr(), t("Today"), o.start)}${opt(addDaysFrom(todayStr(), 1), t("Tomorrow"), o.start)}</select></label>
      <label class="plain">${esc(t("Days"))} <select id="poDays">${[3, 4, 5, 6, 7].map(n => opt(n, String(n), o.days)).join("")}</select></label>
    </div>
    <p class="small">${esc(t("Cooking for {n} · {lunch} · {bf}", { n: P.people, lunch: P.lunches ? t("leftovers for lunch") : t("no lunches"), bf: P.breakfasts ? t("breakfast prep") : t("no breakfast prep") }))}
      <button type="button" class="link-btn" id="poEdit">${esc(t("Change"))}</button></p>
    <button id="poGo" class="primary wide">&#10024; ${esc(t("Make my plan"))}</button>`;
  $("#plannerActions").innerHTML = "";
}
function runAndShow(extraForced) {
  const st = plannerState;
  const forced = { ...(extraForced || {}) };
  if (st.proposal) st.proposal.meals.forEach(m => { const k = slotKey(m.date, m.slot); if (!m.fromId && st.locks.has(k)) forced[k] = m.recipe; });
  st.proposal = runPlanner({ ...st.opts, forced, exclude: st.exclude });
  renderProposal();
}
function renderProposal() {
  const st = plannerState, pr = st.proposal;
  if (!pr.meals.length) {
    $("#plannerResult").innerHTML = `<p class="error">${esc(t("No recipes fit all your settings. Try a longer cooking time, fewer dislikes, or more equipment."))}</p>`;
    return;
  }
  const s = pr.stats;
  let h = `<div class="card"><p class="small">${esc(items.length ? t("Uses {a} things you have, including {b} that expire soon.", { a: s.used, b: s.expiringUsed }) : t("Built from scratch, since your pantry is empty."))}
    ${esc(tn(s.toBuy, "1 thing to buy.", "{n} things to buy."))} ${esc(t("About {cost} in groceries.", { cost: fmtMoney(s.spent) }))}</p>
    ${s.budget && s.spent > s.budget ? `<p class="small error">${esc(t("That's about {over} over your {budget} budget. Try again, or add more of what you have.", { over: fmtMoney(s.spent - s.budget), budget: fmtMoney(s.budget) }))}</p>` : ""}
    ${s.avgCal ? `<p class="small">${esc(t("Dinners average {cal} calories and {p} g protein per serving.", { cal: Math.round(s.avgCal), p: Math.round(s.avgProtein) }))}</p>` : ""}
    ${s.atRisk.length ? `<p class="small">${esc(t("Not used and expiring soon: {list}. Consider freezing them.", { list: s.atRisk.slice(0, 5).join(", ") }))}</p>` : ""}</div>`;
  const order = { breakfast: 0, lunch: 1, dinner: 2 };
  for (let i = 0; i < pr.days; i++) {
    const D = addDaysFrom(pr.start, i);
    const meals = pr.meals.filter(m => m.date === D).sort((a, b) => order[a.slot] - order[b.slot]);
    h += `<h3 class="day-head">${esc(dayName(D))}</h3><ul class="list">`;
    for (const m of meals) {
      const r = recipeByName(m.recipe), k = slotKey(m.date, m.slot), locked = st.locks.has(k);
      const slot = t(m.slot === "breakfast" ? "Breakfast" : m.slot === "lunch" ? "Lunch" : "Dinner");
      const note = m.fromId ? (m.slot === "lunch" ? t("leftovers") : t("already made")) : (m.cookOn !== m.date ? t("cook {day}", { day: dayRef(m.cookOn) }) : tn(m.servings, "1 serving", "{n} servings"));
      h += `<li class="recipe meal"><div class="r-head"><strong><span class="slot">${esc(slot)}</span> ${esc(rName(r))}</strong>
        ${m.fromId ? "" : `<span class="row-actions"><button class="row-btn ${locked ? "on" : ""}" data-lock="${k}" aria-pressed="${locked}" aria-label="${esc(t("Keep this one"))}">${locked ? "&#128274;" : "&#128275;"}</button><button class="row-btn" data-swap="${k}" aria-label="${esc(t("Swap for something else"))}">&#8644;</button></span>`}</div>
        <div class="r-tags"><span class="tag">${esc(note)}</span><span class="tag">${esc(t("{n} min", { n: r.time }))}</span></div></li>`;
    }
    h += `</ul>`;
  }
  $("#plannerResult").innerHTML = h;
  $("#plannerActions").innerHTML = `<button id="poAgain">${esc(t("Try again"))}</button><span class="spacer"></span>
    <button id="poSave">${esc(t("Save plan"))}</button><button id="poSaveShop" class="primary">${esc(t("Save and shop"))}</button>`;
  $("#plannerResult").scrollIntoView({ behavior: "smooth" });
}
function swapSlot(k) {
  const st = plannerState, pr = st.proposal;
  const cur = pr.meals.find(m => slotKey(m.date, m.slot) === k && !m.fromId);
  if (!cur) return;
  st.exclude[k] = [...(st.exclude[k] || []), cur.recipe];
  const forced = {};
  pr.meals.forEach(m => { const mk = slotKey(m.date, m.slot); if (!m.fromId && mk !== k) forced[mk] = m.recipe; });
  st.proposal = runPlanner({ ...st.opts, forced, exclude: st.exclude });
  renderProposal();
}
function savePlanProposal(thenShop) {
  const pr = plannerState.proposal;
  const end = addDaysFrom(pr.start, pr.days - 1);
  plan = plan.filter(m => m.date < pr.start || m.date > end).concat(pr.meals.map(m => ({ ...m, auto: true })));
  savePlan();
  $("#plannerDialog").close();
  showTab("plan");
  toast(t("Plan saved."));
  if (thenShop) planShopping();
}
