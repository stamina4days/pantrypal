"use strict";
/* Prep day. */
/* ---------- prep day ---------- */
let prepMeals = [];
function openPrep() {
  const today = todayStr();
  const upcoming = plan.filter(m => !m.fromId && !m.prepped && (m.cookOn || m.date) >= today && m.date <= addDaysFrom(today, 7));
  const batchDays = [...new Set(upcoming.filter(m => m.cookOn && m.cookOn !== m.date).map(m => m.cookOn))].sort();
  if (batchDays.length) {
    prepMeals = upcoming.filter(m => m.cookOn === batchDays[0]);
    renderPrepSession(t("Prep day: {day}", { day: dayName(batchDays[0]) }));
  } else renderPrepPicker(upcoming);
  renderHints();
  $("#prepDialog").showModal();
}
function renderPrepPicker(upcoming) {
  $("#prepTitle").textContent = t("Prep day");
  $("#prepBody").innerHTML = `<p class="muted small">${esc(t("Pick the meals you want to cook ahead. You'll get one combined plan: what to chop, what goes in the oven first, and how to store it all."))}</p>` +
    (upcoming.length ? upcoming.map(m => { const r = recipeByName(m.recipe); return r ? `<label class="cooked-row"><input type="checkbox" data-pm="${m.id}" ${r.prep ? "checked" : ""}> ${esc(rName(r))} <span class="muted small">(${esc(dayName(m.date))}${r.prep ? "" : ", " + t("best made fresh")})</span></label>` : ""; }).join("")
      : `<p>${esc(t("No upcoming meals in your plan. Make a plan first."))}</p>`);
  $("#prepActions").innerHTML = `<span class="spacer"></span><button id="prepClose">${esc(t("Close"))}</button>` + (upcoming.length ? `<button id="prepBuild" class="primary">${esc(t("Build prep plan"))}</button>` : "");
}
function renderPrepSession(title) {
  $("#prepTitle").textContent = title || t("Prep day");
  const tasks = buildPrepSession(prepMeals);
  const key = "prep:" + prepMeals.map(m => m.id).sort().join(",");
  const done = new Set((settings.prepProgress || {})[key] || []);
  const sec = { start: t("Get started"), prep: t("Chop and prep"), cook: t("Cook"), store: t("Pack and store") };
  const timerBtn = (min, label) => min ? `<button type="button" class="chip timer-btn" data-timer="${min}" data-label="${esc(label)}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/timer.svg#i"/></svg> ${esc(t("{n} min", { n: min }))}</button>` : "";
  let h = "", last = "";
  for (const tk of tasks) {
    if (tk.section !== last) { h += `<h3>${esc(sec[tk.section])}</h3>`; last = tk.section; }
    if (tk.section === "cook") {
      h += `<div class="card"><div class="r-head"><strong>${esc(tk.title)}</strong><button class="chip" data-cookmode="${esc(tk.recipe)}" data-meal="${tk.mealId}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/chef.svg#i"/></svg> ${esc(t("Cook mode"))}</button></div>
        ${tk.steps.map(st => `<label class="task ${done.has(st.id) ? "done" : ""}"><input type="checkbox" data-task="${st.id}" ${done.has(st.id) ? "checked" : ""}> <span>${esc(st.text)}</span></label>${timerBtn(st.minutes, tk.title)}`).join("")}</div>`;
    } else {
      h += `<label class="task ${done.has(tk.id) ? "done" : ""}"><input type="checkbox" data-task="${tk.id}" ${done.has(tk.id) ? "checked" : ""}> <span>${esc(tk.text)}${tk.sub ? ` <span class="muted small">(${esc(tk.sub)})</span>` : ""}</span></label>${timerBtn(tk.minutes, t("Rice"))}`;
    }
  }
  $("#prepBody").innerHTML = h;
  $("#prepBody").dataset.key = key;
  $("#prepActions").innerHTML = `<button id="prepClose">${esc(t("Close"))}</button><button id="prepPrint"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/printer.svg#i"/></svg> ${esc(t("Print"))}</button><span class="spacer"></span><button id="prepFinish" class="primary">${esc(t("Done: mark as prepped"))}</button>`;
}
/* Take used food out of My Food and put the cooked meals in the fridge. */
function finishPrep() {
  bump("prepped");
  const snap = snapshot();
  const res = planReservations();
  for (const m of prepMeals) {
    const r = recipeByName(m.recipe), ev = res.evs.get(m.id);
    if (!r) continue;
    if (ev) deductAllocs(ev);
    const deps = plan.filter(x => x.fromId === m.id);
    const servings = m.servings;
    const keep = Math.max(1, r.keeps || 3);
    const id = uid();
    items.push({ id, added: todayStr(), bought: todayStr(), name: t("Prepped: {name}", { name: rName(r) }), recipe: r.name, amount: servings, unit: t("servings"),
      location: "Fridge", expires: addDaysFrom(todayStr(), keep), notes: "", barcode: "", leftover: true, staple: false });
    m.prepped = id; m.cookOn = todayStr();
    deps.forEach(x => { x.leftoverItem = id; });
    cookedLog.push({ name: r.name, date: todayStr() });
  }
  saveItems(); savePlan(); saveCooked();
  $("#prepDialog").close();
  renderAll();
  toast(tn(prepMeals.length, "1 meal prepped and in the fridge.", "{n} meals prepped and in the fridge.") + stapleSuffix(), snap);
}
function deductAllocs(ev) {
  for (const h of ev.have) {
    if (!h.alloc) continue;
    for (const a of h.alloc.allocs) {
      const it = a.p.item;
      if (!it || a.g == null || !hasAmount(it)) continue;
      const per = itemGrams(it) / it.amount;
      if (!per) continue;
      it.amount = Math.max(0, it.amount - a.g / per);
      if (it.amount < 0.05) removeItem(it, "used");
    }
  }
}
/* Eat a prepped meal or planned leftovers */
function ateMeal(m) {
  const parent = m.fromId ? plan.find(x => x.id === m.fromId) : null;
  const id = m.prepped || m.leftoverItem || (parent && parent.prepped);
  const it = items.find(i => i.id === id) || items.find(i => i.leftover && i.recipe === m.recipe);
  const snap = snapshot();
  if (it) {
    it.amount = Math.max(0, (it.amount || 0) - m.servings);
    if (it.amount <= 0.05) removeItem(it, "used"); else saveItems();
  }
  plan = plan.filter(x => x.id !== m.id);
  savePlan();
  $("#recipeDialog").close();
  renderAll();
  toast(t("Enjoy!"), snap);
}
