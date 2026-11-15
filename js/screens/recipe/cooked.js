"use strict";
/* I cooked this, and plan it. */
function showCookedPanel() {
  $("#planPanel").classList.add("hidden");
  const used = new Map();
  for (const h of [...openResult.have, ...openResult.subbed]) {
    if (!h.item) continue;
    if (!used.has(h.item.id)) used.set(h.item.id, { item: h.item, grams: 0, guess: null });
    const u = used.get(h.item.id);
    if (h.alloc) h.alloc.allocs.forEach(a => { if (a.p.item && a.p.item.id === h.item.id && a.g != null) u.grams += a.g; });
    if (u.guess == null && h.g) { const q = parseAmt(h.g.amt); if (q != null) u.guess = q * (curServings / openResult.recipe.serves); }
  }
  $("#cookedList").innerHTML = [...used.values()].map(({ item, grams, guess }) => {
    if (hasAmount(item)) {
      const per = itemGrams(item) / item.amount;
      let val = per && grams ? grams / per : (guess || 0);
      val = Math.min(item.amount, Math.round(val * 4) / 4);
      return `<div class="cooked-row">
        <label for="used-${item.id}" style="flex:1">${esc(item.name)} <span class="muted small">(${esc(t("have {amt}", { amt: amountText(item) }))})</span></label>
        <input id="used-${item.id}" type="number" class="used-amt" data-id="${item.id}" min="0" max="${item.amount}" step="any" value="${fmtNum(val)}" style="width:84px">
        <button type="button" class="row-btn" data-all="${item.id}">${esc(t("All"))}</button></div>`;
    }
    return `<label class="cooked-row"><input type="checkbox" class="used-all" data-id="${item.id}"> ${esc(item.name)} <span class="muted small">(${esc(t("used it up"))})</span></label>`;
  }).join("") || `<p class="muted small">${esc(t("None of your tracked food is in this recipe."))}</p>`;
  const deps = openMealId ? plan.filter(m => m.fromId === openMealId) : [];
  const depServ = deps.reduce((a, m) => a + m.servings, 0);
  $("#leftoverChk").checked = depServ > 0;
  $("#leftoverRow").classList.toggle("hidden", depServ === 0);
  $("#leftoverServ").value = depServ || Math.max(1, Math.floor(curServings / 2));
  $("#cookedPanel").classList.remove("hidden");
  $("#cookedPanel").scrollIntoView({ behavior: "smooth" });
}
function confirmCooked() {
  const hr = new Date().getHours();
  if (hr >= 22 || hr < 4) bump("lateCook");
  const snap = snapshot();
  const r = openResult.recipe;
  let changed = 0;
  $$("#cookedList .used-amt").forEach(inp => {
    const it = items.find(i => i.id === inp.dataset.id);
    const used = Number(inp.value);
    if (!it || !(used > 0)) return;
    changed++;
    it.amount = Math.max(0, it.amount - used);
    if (it.amount <= 0.0001) removeItem(it, "used");
  });
  $$("#cookedList .used-all:checked").forEach(c => {
    const it = items.find(i => i.id === c.dataset.id);
    if (it) { removeItem(it, "used"); changed++; }
  });
  let extra = "";
  if ($("#leftoverChk").checked) {
    const n = Math.max(1, Number($("#leftoverServ").value) || 1);
    const keep = Math.max(1, Math.min(r.keeps || 4, 5));
    const lid = uid();
    items.push({ id: lid, added: todayStr(), bought: todayStr(), name: t("Leftovers: {name}", { name: rName(r) }), recipe: r.name,
      amount: n, unit: t("servings"), location: "Fridge", expires: addDaysFrom(todayStr(), keep), notes: "", barcode: "", leftover: true, staple: false });
    if (openMealId) plan.forEach(m => { if (m.fromId === openMealId) m.leftoverItem = lid; });
    extra = " " + t("Leftovers saved for {n} days.", { n: keep });
  }
  cookedLog.push({ name: r.name, date: todayStr() });
  if (cookedLog.length > 300) cookedLog = cookedLog.slice(-300);
  if (openMealId) { plan = plan.filter(m => m.id !== openMealId); savePlan(); }
  saveItems(); saveCooked();
  $("#recipeDialog").close();
  toast((changed ? tn(changed, "Nice! Updated 1 item.", "Nice! Updated {n} items.") : t("Nice!")) + extra + stapleSuffix(), snap);
  renderAll();
}

/* Meal plan panel */
function showPlanPanel() {
  if (openMealId) {
    plan = plan.filter(m => m.id !== openMealId); savePlan();
    $("#recipeDialog").close(); toast(t("Removed from your plan.")); renderAll();
    return;
  }
  $("#cookedPanel").classList.add("hidden");
  const opts = [];
  for (let i = 0; i < 14; i++) { const d = addDaysFrom(todayStr(), i); opts.push(`<option value="${d}" ${d === (planTarget || todayStr()) ? "selected" : ""}>${esc(dayName(d))}</option>`); }
  if (planTarget && daysLeft(planTarget) >= 14) opts.push(`<option value="${planTarget}" selected>${esc(dayName(planTarget))}</option>`);
  $("#planDay").innerHTML = opts.join("");
  $("#planPanel").classList.remove("hidden");
  $("#planPanel").scrollIntoView({ behavior: "smooth" });
}
function confirmPlan() {
  const date = $("#planDay").value;
  plan.push({ id: uid(), date, slot: openResult.recipe.type === "Breakfast" ? "breakfast" : openResult.recipe.type === "Lunch" ? "lunch" : "dinner", recipe: openResult.recipe.name, servings: curServings });
  savePlan();
  planTarget = null;
  $("#recipeDialog").close();
  toast(t("Planned {name} for {day}.", { name: rName(openResult.recipe), day: dayName(date) }));
  renderAll();
}

/* Pick-items dialog for shopping lists (from a recipe or the plan) */
let pickEntries = [];
