"use strict";
/* The week at a glance. */
function openWeek() {
  renderWeek();
  $("#weekPage").showModal();
}

function renderWeek() {
  const today = todayStr();
  const { evs } = planReservations();
  const days = Array.from({ length: 7 }, (_, i) => addDaysFrom(today, i));
  const inWeek = plan.filter(m => m.date >= today && m.date <= days[6]);
  $("#wkEmpty").classList.toggle("hidden", inWeek.length > 0);
  $("#wkDays").classList.toggle("hidden", !inWeek.length);
  $("#wkTotals").classList.toggle("hidden", !inWeek.length);
  $("#wkMeta").textContent = t("{a} to {b}", { a: prettyDate(days[0]), b: prettyDate(days[6]) });
  if (!inWeek.length) return;

  let cal = 0, cost = 0, rescued = new Set(), cooks = 0, counted = 0;
  inWeek.forEach(m => {
    const r = recipeByName(m.recipe); if (!r) return;
    const n = nutritionOf(r);
    cal += n.cal * (m.servings || 1); counted += m.servings || 1;
    if (!m.fromId) { cooks++; cost += costOf(r) * (m.servings || 1); }
    const ev = evs.get(m.id);
    if (ev) ev.have.forEach(h => { if (!h.g.basic && h.d !== null && h.d <= 3) rescued.add(h.item.id); });
  });
  const people = Math.max(1, profile().people || 1);
  $("#wkTotals").innerHTML = [
    `<span class="stat-chip"><strong>${inWeek.length}</strong> ${esc(t("meals"))}</span>`,
    `<span class="stat-chip"><strong>${cooks}</strong> ${esc(t("times cooking"))}</span>`,
    `<span class="stat-chip"><strong>${esc(fmtMoney(cost))}</strong> ${esc(t("estimated cost"))}</span>`,
    `<span class="stat-chip"><strong>${Math.round(counted ? cal / counted : 0)}</strong> ${esc(t("cal a serving"))}</span>`,
    rescued.size ? `<span class="stat-chip good"><strong>${rescued.size}</strong> ${esc(t("foods rescued"))}</span>` : ""
  ].join("");

  const slots = ["breakfast", "lunch", "dinner"];
  const slotLabel = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
  $("#wkDays").innerHTML = days.map(d => {
    const meals = plan.filter(m => m.date === d);
    return `<div class="week-day ${d === today ? "today" : ""}">
      <div class="wd-head"><strong>${esc(dayName(d))}</strong><span class="muted small">${esc(prettyDate(d))}</span></div>
      <div class="wd-slots">${slots.map(s => {
        const m = meals.find(x => (x.slot || "dinner") === s);
        const r = m && recipeByName(m.recipe);
        if (!r) return `<button class="plate empty" data-wk-add="${d}" aria-label="${esc(t("Add {slot} on {day}", { slot: t(slotLabel[s]), day: dayName(d) }))}">
          <span class="plate-slot">${esc(t(slotLabel[s]))}</span><span class="plate-plus" aria-hidden="true">+</span></button>`;
        return `<button class="plate" data-wk-meal="${m.id}">
          <span class="plate-slot">${esc(t(slotLabel[s]))}</span>${recipeArt(r, "plate-emoji")}
          <span class="plate-name">${esc(rName(r))}</span>${m.fromId ? `<span class="plate-note">${esc(t("leftovers"))}</span>` : m.prepped ? `<span class="plate-note">${esc(t("prepped"))}</span>` : ""}</button>`;
      }).join("")}</div></div>`;
  }).join("");
}

function weekClick(e) {
  const add = e.target.closest("[data-wk-add]");
  if (add) {
    $("#weekPage").close();
    planTarget = add.dataset.wkAdd;
    recipeMode = "browse"; setPressed("#recipeMode", $('#recipeMode [data-mode="browse"]'));
    showTab("recipes");
    return;
  }
  const b = e.target.closest("[data-wk-meal]");
  if (b) {
    const m = plan.find(x => x.id === b.dataset.wkMeal), r = m && recipeByName(m.recipe);
    if (r) openRecipe(planReservations().evs.get(m.id) || evaluate(r, availablePool(), settings.diets), m.id);
  }
}
