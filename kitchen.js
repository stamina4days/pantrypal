"use strict";
/* Pantry Pal kitchen features: setup, pantry audit, auto planner, prep day, cook mode,
   timers, voice, receipts, check-ins, usage learning, and ratings. Loaded after app.js. */

/* ---------- pantry audit list: [english, spanish, amount, unit] ---------- */
const AUDIT = [
  ["fridge", "Fridge", "Fridge", [
    ["Eggs", "Huevos", 12, ""], ["Milk", "Leche", 1, "gallon"], ["Butter", "Mantequilla", 1, "lb"], ["Cheddar cheese", "Queso cheddar", 8, "oz"],
    ["Mozzarella", "Queso mozzarella", 8, "oz"], ["Parmesan", "Queso parmesano", 4, "oz"], ["Yogurt", "Yogur", 32, "oz"], ["Sour cream", "Crema agria", 16, "oz"],
    ["Heavy cream", "Crema para batir", 1, "pint"], ["Bacon", "Tocino", 12, "oz"], ["Ham", "Jamón", 8, "oz"], ["Chicken breast", "Pechuga de pollo", 2, "lb"],
    ["Chicken thighs", "Muslos de pollo", 2, "lb"], ["Ground beef", "Carne molida", 1, "lb"], ["Sausage", "Salchicha", 1, "lb"], ["Tofu", "Tofu", 14, "oz"],
    ["Salsa", "Salsa", 16, "oz"], ["Mayonnaise", "Mayonesa", 30, "oz"], ["Mustard", "Mostaza", null, ""], ["Tortillas", "Tortillas", 10, ""]]],
  ["produce", "Produce", "Fridge", [
    ["Onions", "Cebollas", 3, ""], ["Garlic", "Ajo", 1, "head"], ["Potatoes", "Papas", 5, "lb"], ["Sweet potatoes", "Camotes", 3, ""], ["Carrots", "Zanahorias", 1, "lb"],
    ["Celery", "Apio", 1, "bunch"], ["Bell peppers", "Pimientos", 3, ""], ["Broccoli", "Brócoli", 1, "head"], ["Cauliflower", "Coliflor", 1, "head"],
    ["Spinach", "Espinaca", 10, "oz"], ["Lettuce", "Lechuga", 1, "head"], ["Tomatoes", "Tomates", 4, ""], ["Cucumber", "Pepino", 1, ""], ["Zucchini", "Calabacita", 2, ""],
    ["Mushrooms", "Champiñones", 8, "oz"], ["Cabbage", "Repollo", 1, "head"], ["Avocados", "Aguacates", 3, ""], ["Lemons", "Limones amarillos", 2, ""],
    ["Limes", "Limones", 3, ""], ["Bananas", "Plátanos", 6, ""], ["Apples", "Manzanas", 6, ""], ["Berries", "Moras", 16, "oz"], ["Cilantro", "Cilantro", 1, "bunch"],
    ["Scallions", "Cebollitas", 1, "bunch"], ["Jalapenos", "Jalapeños", 2, ""], ["Ginger", "Jengibre", 3, "oz"]]],
  ["freezer", "Freezer", "Freezer", [
    ["Frozen peas", "Chícharos congelados", 16, "oz"], ["Frozen corn", "Elote congelado", 16, "oz"], ["Frozen broccoli", "Brócoli congelado", 12, "oz"],
    ["Frozen spinach", "Espinaca congelada", 10, "oz"], ["Frozen berries", "Moras congeladas", 16, "oz"], ["Frozen mango", "Mango congelado", 16, "oz"],
    ["Shrimp", "Camarones", 1, "lb"], ["Salmon fillets", "Filetes de salmón", 4, ""], ["Frozen chicken breast", "Pechuga de pollo congelada", 3, "lb"],
    ["Frozen ground beef", "Carne molida congelada", 1, "lb"]]],
  ["pantry", "Pantry", "Pantry", [
    ["Rice", "Arroz", 2, "lb"], ["Pasta", "Pasta", 1, "lb"], ["Spaghetti", "Espagueti", 1, "lb"], ["Oats", "Avena", 2, "lb"], ["Bread", "Pan", 1, "loaf"],
    ["Canned tomatoes", "Tomates en lata", 2, "cans"], ["Tomato sauce", "Salsa de tomate", 24, "oz"], ["Tomato paste", "Pasta de tomate", 6, "oz"],
    ["Black beans", "Frijoles negros", 2, "cans"], ["Kidney beans", "Frijoles rojos", 2, "cans"], ["Chickpeas", "Garbanzos", 2, "cans"], ["Lentils", "Lentejas", 1, "lb"],
    ["Broth", "Caldo", 32, "oz"], ["Coconut milk", "Leche de coco", 1, "can"], ["Tuna", "Atún", 2, "cans"], ["Peanut butter", "Crema de cacahuate", 16, "oz"],
    ["Honey", "Miel", 12, "oz"], ["Granola", "Granola", 12, "oz"], ["Breadcrumbs", "Pan molido", 8, "oz"]]],
  ["basics", "Spices and basics", null, [
    ["Salt", "Sal"], ["Pepper", "Pimienta"], ["Olive oil", "Aceite de oliva"], ["Vegetable oil", "Aceite vegetal"], ["Flour", "Harina"], ["Sugar", "Azúcar"],
    ["Baking powder", "Polvo para hornear"], ["Baking soda", "Bicarbonato"], ["Soy sauce", "Salsa de soya"], ["Vinegar", "Vinagre"], ["Cornstarch", "Maicena"],
    ["Cinnamon", "Canela"], ["Cumin", "Comino"], ["Chili powder", "Chile en polvo"], ["Paprika", "Paprika"], ["Oregano", "Orégano"],
    ["Italian seasoning", "Hierbas italianas"], ["Curry powder", "Curry en polvo"], ["Vanilla", "Vainilla"], ["Red pepper flakes", "Hojuelas de chile"]]]
];
const EQUIP_LABEL = { oven: "Oven", microwave: "Microwave", blender: "Blender", slowcooker: "Slow cooker", pressure: "Pressure cooker (like an Instant Pot)", airfryer: "Air fryer" };
const weekdayName = n => new Date(2023, 0, 1 + n).toLocaleDateString(locale(), { weekday: "long" });   // Jan 1 2023 was a Sunday

/* ---------- setup (first run and editing later) ---------- */
let ob = null;
function openOnboarding(mode) {
  const P = profile();
  ob = { mode, step: mode === "first" ? 0 : 1, data: { ...P, cuisines: [...P.cuisines], equipment: [...P.equipment], diets: [...settings.diets] } };
  renderOnboarding();
  if (!$("#onboardDialog").open) $("#onboardDialog").showModal();
}
function obLast() { return ob.mode === "first" ? 4 : 3; }
function renderOnboarding() {
  const d = ob.data, body = $("#obBody");
  const check = (id, on, label) => `<label class="check"><input type="checkbox" data-ob="${id}" ${on ? "checked" : ""}> <span>${esc(label)}</span></label>`;
  const opts = (list, cur) => list.map(([v, l]) => `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${esc(l)}</option>`).join("");
  let h = `<p class="muted small">${esc(t("Step {a} of {b}", { a: ob.step + (ob.mode === "first" ? 1 : 0), b: obLast() + (ob.mode === "first" ? 1 : 0) }))}</p>`;
  if (ob.step === 0) {
    h += `<h2>${esc(t("Welcome to Pantry Pal"))}</h2>
      <p>${esc(t("It plans meals around the food you already have, so less goes to waste. Setup takes about a minute, and you can change any of it later."))}</p>
      <div class="row"><button data-lang="en" class="${LANG === "en" ? "primary" : ""}">English</button><button data-lang="es" class="${LANG === "es" ? "primary" : ""}">Español</button></div>`;
  } else if (ob.step === 1) {
    h += `<h2>${esc(t("Who are you cooking for?"))}</h2>
      <div class="servings"><span>${esc(t("People"))}</span><button type="button" class="icon-square" data-people="-1" aria-label="${esc(t("Fewer people"))}">-</button>
      <output id="obPeople">${d.people}</output><button type="button" class="icon-square" data-people="1" aria-label="${esc(t("More people"))}">+</button></div>
      <label class="plain">${esc(t("Appetites"))} <select data-ob="appetite">${opts([[0.75, t("Light eaters")], [1, t("Average")], [1.3, t("Big appetites")]], d.appetite)}</select></label>
      ${check("lunches", d.lunches, t("Make extra at dinner for the next day's lunch"))}
      ${check("breakfasts", d.breakfasts, t("Prep breakfasts for the week (like egg muffins or overnight oats)"))}
      ${check("kids", d.kids, t("Kids are eating too (favor kid-friendly meals)"))}`;
  } else if (ob.step === 2) {
    h += `<h2>${esc(t("Diet and allergies"))}</h2>
      ${Object.entries(DIETS).map(([id, x]) => check("diet:" + id, d.diets.includes(id), t(x.label))).join("")}
      <label class="plain">${esc(t("Foods you don't like, separated by commas"))} <input data-ob="dislikes" value="${esc(d.dislikes)}" placeholder="${esc(t("e.g. mushrooms, olives"))}"></label>
      <p class="muted small">${esc(t("This is a helper, not a guarantee, so always check labels if you have an allergy."))}</p>`;
  } else if (ob.step === 3) {
    h += `<h2>${esc(t("How do you like to cook?"))}</h2>
      <h3>${esc(t("Favorite cuisines (optional)"))}</h3><div class="chips wrap">${CUISINES.map(c => `<button type="button" class="chip ${d.cuisines.includes(c) ? "on" : ""}" aria-pressed="${d.cuisines.includes(c)}" data-cuisine="${c}">${esc(t(c))}</button>`).join("")}</div>
      <div class="row">
        <label class="plain">${esc(t("Weeknight cooking time"))} <select data-ob="weeknight">${opts([[20, t("{n} min", { n: 20 })], [30, t("{n} min", { n: 30 })], [45, t("{n} min", { n: 45 })], [60, t("1 hour")], [0, t("No limit")]], d.weeknight)}</select></label>
        <label class="plain">${esc(t("Weekend cooking time"))} <select data-ob="weekend">${opts([[30, t("{n} min", { n: 30 })], [60, t("1 hour")], [90, t("90 min")], [0, t("No limit")]], d.weekend)}</select></label>
      </div>
      <label class="plain">${esc(t("Meal prep day"))} <select data-ob="prepDay">${opts([[-1, t("I don't batch cook")], ...[0, 1, 2, 3, 4, 5, 6].map(n => [n, weekdayName(n)])], d.prepDay)}</select></label>
      <div class="row">
        <label class="plain">${esc(t("Weekly grocery budget"))} <input type="number" min="0" step="5" inputmode="numeric" data-ob="weeklyBudget" value="${d.weeklyBudget || ""}" placeholder="${esc(t("No limit"))}"></label>
        <label class="plain">${esc(t("Nutrition goal"))} <select data-ob="goal">${opts([["", t("No goal")], ["protein", t("High protein")], ["lighter", t("Lighter meals")]], d.goal)}</select></label>
      </div>
      <h3>${esc(t("Kitchen equipment"))}</h3>
      ${EQUIPMENT.map(e => check("equip:" + e, d.equipment.includes(e), t(EQUIP_LABEL[e]))).join("")}
      <p class="muted small">${esc(t("Everyone has a stovetop. Recipes that need something you don't have are hidden."))}</p>`;
  } else {
    h += `<h2>${esc(t("Set up your pantry?"))}</h2>
      <p>${esc(t("A quick pantry audit lets Pantry Pal plan around what you already have. Tap what's in your kitchen, which takes about two minutes."))}</p>
      <div class="stack"><button id="obAudit" class="primary">${esc(t("Start pantry audit"))}</button><button id="obSkipAudit">${esc(t("Skip for now, I'll add food later"))}</button></div>
      <p class="muted small">${esc(t("You can do this any time from My Food or Settings. Recipes, meal plans, and cook mode all work without it."))}</p>`;
  }
  body.innerHTML = h;
  $("#obBack").classList.toggle("hidden", ob.step === (ob.mode === "first" ? 0 : 1));
  $("#obNext").classList.toggle("hidden", ob.mode === "first" && ob.step === 4);
  $("#obNext").textContent = ob.step === obLast() || (ob.mode === "first" && ob.step === 3 && false) ? t("Save") : t("Next");
  $("#obSkip").classList.toggle("hidden", ob.mode !== "first" || ob.step === 4);
}
function obRead() {
  const d = ob.data;
  $$("#obBody [data-ob]").forEach(el => {
    const k = el.dataset.ob;
    if (k.startsWith("diet:")) { const id = k.slice(5); d.diets = d.diets.filter(x => x !== id); if (el.checked) d.diets.push(id); }
    else if (k.startsWith("equip:")) { const id = k.slice(6); d.equipment = d.equipment.filter(x => x !== id); if (el.checked) d.equipment.push(id); }
    else if (el.type === "checkbox") d[k] = el.checked;
    else if (["appetite", "weeknight", "weekend", "prepDay", "weeklyBudget"].includes(k)) d[k] = Number(el.value) || 0;
    else d[k] = el.value;
  });
}
function obSave() {
  const { diets, ...house } = ob.data;
  settings.household = house;
  settings.diets = diets;
  settings.onboarded = true;
  saveSettings();
  renderDietSummary();
  renderAll();
}
function obNext() {
  obRead();
  if (ob.step >= obLast()) { obSave(); $("#onboardDialog").close(); toast(t("Saved your preferences.")); return; }
  if (ob.mode === "first" && ob.step === 3) obSave();
  ob.step++;
  renderOnboarding();
}

/* ---------- pantry audit ---------- */
let auditSel = new Set(), auditExtra = [];
function openAudit() {
  auditSel = new Set(); auditExtra = [];
  const pool = basePool();
  AUDIT.forEach(([sid, , , list], si) => list.forEach((it, ii) => {
    const id = si + "-" + ii;
    if (sid === "basics") { if (!(settings.missingBasics || []).includes(canon(it[0]).trim())) auditSel.add(id); }
    else if (pool.some(p => p.key && canon(it[0]) && related(p.key, canon(it[0])))) auditSel.add(id);
  }));
  renderAudit();
  $("#auditAdd").value = "";
  $("#auditDialog").showModal();
}
function renderAudit() {
  const label = it => LANG === "es" ? it[1] : it[0];
  $("#auditBody").innerHTML = AUDIT.map(([sid, title, , list], si) => `
    <h3>${esc(t(title))}</h3>${sid === "basics" ? `<p class="muted small">${esc(t("These start out selected. Turn off anything you're out of."))}</p>` : ""}
    <div class="chips wrap">${list.map((it, ii) => { const id = si + "-" + ii, on = auditSel.has(id); return `<button type="button" class="chip ${on ? "on" : ""}" aria-pressed="${on}" data-ai="${id}">${esc(label(it))}</button>`; }).join("")}</div>`).join("");
  $("#auditExtra").innerHTML = auditExtra.map(x => `<li>${esc(x.name)} <span class="muted small">${esc(amountText(x))}</span></li>`).join("");
  const n = [...auditSel].filter(id => AUDIT[Number(id.split("-")[0])][0] !== "basics").length + auditExtra.length;
  $("#auditDone").textContent = n ? tn(n, "Add 1 item", "Add {n} items") : t("Done");
}
function finishAudit() {
  const pool = basePool();
  const snap = snapshot();
  let added = 0;
  const missing = [];
  AUDIT.forEach(([sid, , loc, list], si) => list.forEach((it, ii) => {
    const on = auditSel.has(si + "-" + ii);
    if (sid === "basics") { if (!on) missing.push(canon(it[0]).trim()); return; }
    if (!on) return;
    const key = canon(it[0]);
    if (pool.some(p => p.key && key && related(p.key, key))) return;
    const name = LANG === "es" ? it[1] : it[0];
    const est = estimateShelf(it[0], loc);
    items.push({ id: uid(), added: todayStr(), bought: todayStr(), verified: todayStr(), name, amount: it[2], unit: it[3], location: loc,
      expires: est ? addDaysFrom(todayStr(), est.days) : "", notes: "", barcode: "", staple: isStaple(name) });
    added++;
  }));
  auditExtra.forEach(x => { items.push({ id: uid(), added: todayStr(), bought: todayStr(), verified: todayStr(), notes: "", barcode: "", staple: isStaple(x.name), ...x }); added++; });
  settings.missingBasics = missing;
  settings.assumeBasics = true;
  saveItems(); saveSettings();
  $("#auditDialog").close();
  renderAll();
  toast(tn(added, "Added 1 item. Dates are estimates, so fix any that are off.", "Added {n} items. Dates are estimates, so fix any that are off."), snap);
}

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
  const timerBtn = (min, label) => min ? `<button type="button" class="chip timer-btn" data-timer="${min}" data-label="${esc(label)}">&#9201; ${esc(t("{n} min", { n: min }))}</button>` : "";
  let h = "", last = "";
  for (const tk of tasks) {
    if (tk.section !== last) { h += `<h3>${esc(sec[tk.section])}</h3>`; last = tk.section; }
    if (tk.section === "cook") {
      h += `<div class="card"><div class="r-head"><strong>${esc(tk.title)}</strong><button class="chip" data-cookmode="${esc(tk.recipe)}" data-meal="${tk.mealId}">&#128105;&#8205;&#127859; ${esc(t("Cook mode"))}</button></div>
        ${tk.steps.map(st => `<label class="task ${done.has(st.id) ? "done" : ""}"><input type="checkbox" data-task="${st.id}" ${done.has(st.id) ? "checked" : ""}> <span>${esc(st.text)}</span></label>${timerBtn(st.minutes, tk.title)}`).join("")}</div>`;
    } else {
      h += `<label class="task ${done.has(tk.id) ? "done" : ""}"><input type="checkbox" data-task="${tk.id}" ${done.has(tk.id) ? "checked" : ""}> <span>${esc(tk.text)}${tk.sub ? ` <span class="muted small">(${esc(tk.sub)})</span>` : ""}</span></label>${timerBtn(tk.minutes, t("Rice"))}`;
    }
  }
  $("#prepBody").innerHTML = h;
  $("#prepBody").dataset.key = key;
  $("#prepActions").innerHTML = `<button id="prepClose">${esc(t("Close"))}</button><button id="prepPrint">&#128424; ${esc(t("Print"))}</button><span class="spacer"></span><button id="prepFinish" class="primary">${esc(t("Done: mark as prepped"))}</button>`;
}
/* Take used food out of My Food and put the cooked meals in the fridge. */
function finishPrep() {
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

/* ---------- timers ---------- */
let timers = [], timerTick = null, audioCtx = null;
function startTimer(label, minutes) {
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch (e) {}
  timers.push({ id: uid(), label, end: Date.now() + minutes * 60000, done: false });
  if (!timerTick) timerTick = setInterval(tickTimers, 1000);
  renderTimers();
  toast(t("Timer started: {n} min", { n: minutes }));
}
function fmtLeft(ms) { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
function renderTimers() {
  const html = timers.map(tm => `<span class="timer ${tm.done ? "ring" : ""}">&#9201; ${esc(tm.label)} <strong>${tm.done ? esc(t("Done!")) : fmtLeft(tm.end - Date.now())}</strong>
    <button class="timer-x" data-timerx="${tm.id}" aria-label="${esc(t("Stop timer"))}">&times;</button></span>`).join("");
  $$(".timer-slot").forEach(el => { el.innerHTML = html; el.classList.toggle("hidden", !timers.length); });
}
function tickTimers() {
  const now = Date.now();
  timers.forEach(tm => { if (!tm.done && now >= tm.end) { tm.done = true; alarm(tm); } });
  if (!timers.length) { clearInterval(timerTick); timerTick = null; }
  renderTimers();
}
function beep() {
  if (!audioCtx) return;
  [0, 0.35, 0.7].forEach(off => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.25, audioCtx.currentTime + off); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + off + 0.3);
    o.start(audioCtx.currentTime + off); o.stop(audioCtx.currentTime + off + 0.3);
  });
}
async function alarm(tm) {
  beep();
  if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
  speak(t("Timer done: {label}", { label: tm.label }));
  toast(t("Timer done: {label}", { label: tm.label }));
  try {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      const reg = await swReady(1000);
      if (reg) reg.showNotification("Pantry Pal", { body: t("Timer done: {label}", { label: tm.label }), icon: "icon.svg", tag: "timer-" + tm.id });
    }
  } catch (e) {}
}

/* ---------- cook mode and voice ---------- */
let cook = null, wakeLock = null;
function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG === "es" ? "es-US" : "en-US";
    speechSynthesis.speak(u);
  } catch (e) {}
}
async function keepAwake(on) {
  try {
    if (on && "wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen");
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) {}
}
function openCookMode(r, f, fromRecipe) {
  cook = { r, f, idx: 0, fromRecipe, listening: false, rec: null };
  renderCook();
  renderHints();
  $("#cookDialog").showModal();
  keepAwake(true);
  if (settings.readAloud) speak(rSteps(r)[0]);
}
function renderCook() {
  const steps = rSteps(cook.r), s = steps[cook.idx];
  $("#cookTitle").textContent = rName(cook.r);
  $("#cookProgress").textContent = t("Step {a} of {b}", { a: cook.idx + 1, b: steps.length });
  $("#cookStep").textContent = s;
  const min = stepMinutes(s);
  $("#cookStepTimer").innerHTML = min ? `<button class="chip timer-btn big" data-timer="${min}" data-label="${esc(rName(cook.r))}">&#9201; ${esc(t("Start a {n} minute timer", { n: min }))}</button>` : "";
  $("#cookIngr").innerHTML = cook.r.ingredients.map(g => `<li>${esc(ingLabel(g, cook.f, cook.r))}${g.opt ? ` <span class="muted small">(${esc(t("optional"))})</span>` : ""}</li>`).join("");
  $("#cookPrev").disabled = cook.idx === 0;
  $("#cookNext").textContent = cook.idx === steps.length - 1 ? t("Finish") : t("Next");
  $("#cookRead").setAttribute("aria-pressed", !!settings.readAloud);
  $("#cookRead").classList.toggle("on", !!settings.readAloud);
  $("#cookVoice").setAttribute("aria-pressed", cook.listening);
  $("#cookVoice").classList.toggle("on", cook.listening);
}
function cookGo(delta) {
  const steps = rSteps(cook.r);
  if (delta > 0 && cook.idx === steps.length - 1) {
    const back = cook.fromRecipe;
    closeCook();
    if (back && $("#recipeDialog").open) showCookedPanel();
    return;
  }
  cook.idx = Math.max(0, Math.min(steps.length - 1, cook.idx + delta));
  renderCook();
  if (settings.readAloud) speak(steps[cook.idx]);
}
function closeCook() {
  if (cook) { cook.listening = false; try { cook.rec && cook.rec.stop(); } catch (e) {} }
  try { speechSynthesis.cancel(); } catch (e) {}
  keepAwake(false);
  if ($("#cookDialog").open) $("#cookDialog").close();
  cook = null;
}
function toggleVoice() {
  if (!cook) return;
  if (cook.listening) { cook.listening = false; try { cook.rec.stop(); } catch (e) {} renderCook(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast(t("Voice commands aren't supported in this browser. Try Chrome on Android.")); return; }
  const rec = new SR();
  rec.lang = LANG === "es" ? "es-US" : "en-US";
  rec.continuous = true;
  rec.interimResults = false;
  rec.onresult = e => voiceCommand(e.results[e.results.length - 1][0].transcript);
  rec.onend = () => { if (cook && cook.listening) { try { rec.start(); } catch (e) {} } };
  rec.onerror = e => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { if (cook) cook.listening = false; toast(t("Microphone access was blocked.")); if (cook) renderCook(); } };
  try { rec.start(); } catch (e) { toast(t("Couldn't start the microphone.")); return; }
  cook.rec = rec; cook.listening = true;
  renderCook();
  toast(t("Listening. Say \"next\", \"back\", \"repeat\", \"timer\", or \"ingredients\"."));
}
function voiceCommand(raw) {
  if (!cook) return;
  const s = norm(raw);
  if (/ (next|siguiente|sigue|adelante) /.test(s)) cookGo(1);
  else if (/ (back|previous|anterior|atra|regresa|atras) /.test(s)) cookGo(-1);
  else if (/ (repeat|again|repite|repetir|otra) /.test(s)) speak(rSteps(cook.r)[cook.idx]);
  else if (/ (timer|temporizador|cronometro|alarma) /.test(s)) { const m = stepMinutes(rSteps(cook.r)[cook.idx]); if (m) startTimer(rName(cook.r), m); else speak(t("This step doesn't have a time.")); }
  else if (/ (ingredient|ingrediente) /.test(s)) speak(cook.r.ingredients.map(g => ingLabel(g, cook.f, cook.r)).join(". "));
}

/* ---------- receipts ---------- */
async function readReceipt(file) {
  toast(t("Reading your receipt. This can take up to 30 seconds."));
  try {
    if (!window.Tesseract) await loadScript(TESSERACT_URL);
    const img = await downscale(file, 2000);
    const worker = await Tesseract.createWorker("eng");
    const { data } = await worker.recognize(img);
    await worker.terminate();
    const rows = parseReceipt(data.text);
    if (!rows.length) { toast(t("Couldn't find any items. Try a flat, well-lit photo of the whole receipt.")); return; }
    openReceiptReview(rows);
  } catch (e) { toast(t("Couldn't read the receipt. This feature needs an internet connection.")); }
}
let receiptRows = [];
function openReceiptReview(rows) {
  receiptRows = rows;
  $("#receiptBody").innerHTML = rows.map((r, i) => `<div class="receipt-row">
    <input type="checkbox" data-ri="${i}" ${r.known ? "checked" : ""} aria-label="${esc(t("Add this item"))}">
    <div class="grow"><input class="r-name" data-rn="${i}" value="${esc(r.name)}" aria-label="${esc(t("Name"))}">
    <span class="muted small">${esc(r.raw)}${r.amount ? " · " + esc(fmtNum(r.amount) + " " + (r.unit || "")) : ""}</span></div></div>`).join("");
  $("#receiptDialog").showModal();
}
function confirmReceipt() {
  const snap = snapshot();
  let n = 0;
  $$("#receiptBody [data-ri]:checked").forEach(c => {
    const i = Number(c.dataset.ri), r = receiptRows[i];
    const name = $(`#receiptBody [data-rn="${i}"]`).value.trim();
    if (!name) return;
    const loc = /\bfrozen\b|congelad/i.test(name) ? "Freezer" : guessLoc(name), est = estimateShelf(name, loc);
    if (r.price) learnPrice(name, r.amount, r.unit, r.price);
    items.push({ id: uid(), added: todayStr(), bought: todayStr(), verified: todayStr(), name, amount: r.amount, unit: r.unit || "", location: loc,
      expires: est ? addDaysFrom(todayStr(), est.days) : "", notes: "", barcode: "", staple: isStaple(name) });
    n++;
  });
  saveItems(); saveSettings();
  $("#receiptDialog").close();
  renderAll();
  toast(tn(n, "Added 1 item from your receipt.", "Added {n} items from your receipt."), snap);
}

/* ---------- check-ins, usage, ratings ---------- */
function checkinHtml() {
  if (!settings.checkins || !items.length) return "";
  const today = todayStr();
  if (!settings.lastCheckin) { settings.lastCheckin = today; saveSettings(); return ""; }
  if (daysBetween(settings.lastCheckin, today) < 3) return "";
  const cands = items.filter(i => {
    const seen = i.verified || i.bought || i.added || today, d = daysLeft(i.expires);
    return daysBetween(seen, today) >= 5 || (d !== null && d >= 0 && d <= 2);
  }).slice(0, 6);
  if (!cands.length) { settings.lastCheckin = today; saveSettings(); return ""; }
  return `<div class="card checkin"><div class="r-head"><h3>${esc(t("Quick check: still have these?"))}</h3><button class="link-btn" data-ci-done="1">${esc(t("Later"))}</button></div>
    ${cands.map(i => `<div class="ci-row"><span class="grow">${esc(i.name)}</span>
      <button class="row-btn" data-ci="keep" data-id="${i.id}">${esc(t("Still have"))}</button>
      <button class="row-btn" data-ci="used" data-id="${i.id}">${esc(t("Used up"))}</button>
      <button class="row-btn" data-ci="wasted" data-id="${i.id}">${esc(t("Tossed"))}</button></div>`).join("")}</div>`;
}
function learnUsage(item) {
  const k = (canon(item.name) || norm(item.name)).trim();
  const days = Math.max(1, daysBetween(item.bought, todayStr()));
  const u = (settings.usage || (settings.usage = {}))[k] || { n: 0, avg: 0 };
  const w = Math.min(u.n, 4);
  u.avg = (u.avg * w + days) / (w + 1);
  u.n += 1;
  settings.usage[k] = u;
  saveSettings();
}
function usageFor(item) { const u = (settings.usage || {})[(canon(item.name) || norm(item.name)).trim()]; return u && u.n ? u : null; }
function usageText(item) { const u = usageFor(item); return u ? t("You usually finish this in about {n} days.", { n: Math.max(1, Math.round(u.avg)) }) : ""; }
function restockHtml(list) {
  const soon = items.filter(i => {
    const u = usageFor(i);
    if (!u || !i.bought || i.leftover || !(i.staple || u.n >= 2)) return false;
    return addDaysFrom(i.bought, Math.round(u.avg)) <= addDaysFrom(todayStr(), 2) && !list.items.some(x => !x.done && norm(x.name) === norm(i.name));
  });
  if (!soon.length) return "";
  return `<div class="card"><h3>${esc(t("Running low soon"))}</h3><p class="muted small">${esc(t("Based on how fast you usually go through these."))}</p>
    <div class="chips wrap">${soon.map(i => `<button class="chip" data-restock="${i.id}">+ ${esc(i.name)}</button>`).join("")}</div></div>`;
}
function renderRating() {
  if (!openResult) return;
  const v = (settings.ratings || {})[openResult.recipe.name] || 0;
  $$(".rate-btn").forEach(b => { const on = Number(b.dataset.rate) === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
}
function rate(v) {
  const n = openResult.recipe.name;
  settings.ratings = settings.ratings || {};
  if (settings.ratings[n] === v) delete settings.ratings[n]; else settings.ratings[n] = v;
  saveSettings();
  renderRating();
  if (settings.ratings[n] === -1) toast(t("Got it. We won't suggest this one."));
  else if (settings.ratings[n] === 1) toast(t("Noted. You'll see this one more often."));
}

/* ---------- wiring ---------- */
function kitchenInit() {
  // Setup
  $("#obNext").addEventListener("click", obNext);
  $("#obBack").addEventListener("click", () => { obRead(); ob.step--; renderOnboarding(); });
  $("#obSkip").addEventListener("click", () => { settings.onboarded = true; saveSettings(); $("#onboardDialog").close(); });
  $("#obBody").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.lang) { settings.lang = b.dataset.lang; saveSettings(); applyLang(); renderOnboarding(); }
    if (b.dataset.people) { obRead(); ob.data.people = Math.max(1, Math.min(12, ob.data.people + Number(b.dataset.people))); renderOnboarding(); }
    if (b.dataset.cuisine) { obRead(); const c = b.dataset.cuisine; ob.data.cuisines = ob.data.cuisines.includes(c) ? ob.data.cuisines.filter(x => x !== c) : [...ob.data.cuisines, c]; renderOnboarding(); }
    if (b.id === "obAudit") { $("#onboardDialog").close(); openAudit(); }
    if (b.id === "obSkipAudit") { $("#onboardDialog").close(); toast(t("No problem. Browse recipes or make a meal plan any time.")); showTab("recipes"); }
  });
  $("#onboardDialog").addEventListener("close", () => { if (!settings.onboarded) { settings.onboarded = true; saveSettings(); } });

  // Audit
  $("#auditBody").addEventListener("click", e => { const b = e.target.closest("[data-ai]"); if (!b) return; const id = b.dataset.ai; auditSel.has(id) ? auditSel.delete(id) : auditSel.add(id); renderAudit(); });
  $("#auditAddForm").addEventListener("submit", e => { e.preventDefault(); auditExtra.push(...parseQuick($("#auditAdd").value)); $("#auditAdd").value = ""; renderAudit(); });
  $("#auditDone").addEventListener("click", finishAudit);
  $("#auditSkip").addEventListener("click", () => $("#auditDialog").close());
  ["#emptyAuditBtn", "#auditBtn"].forEach(id => $(id).addEventListener("click", () => { if ($("#settingsDialog").open) $("#settingsDialog").close(); openAudit(); }));

  // Planner
  $("#autoPlanBtn").addEventListener("click", openPlanner);
  $("#plannerDialog").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.id === "poGo") { plannerState.opts.start = $("#poStart").value; plannerState.opts.days = Number($("#poDays").value); plannerState.locks.clear(); plannerState.exclude = {}; plannerState.proposal = null; runAndShow(); }
    if (b.id === "poEdit") { $("#plannerDialog").close(); openOnboarding("edit"); }
    if (b.id === "poAgain") runAndShow();
    if (b.id === "poSave") savePlanProposal(false);
    if (b.id === "poSaveShop") savePlanProposal(true);
    if (b.dataset.lock) { const k = b.dataset.lock; plannerState.locks.has(k) ? plannerState.locks.delete(k) : plannerState.locks.add(k); renderProposal(); }
    if (b.dataset.swap) swapSlot(b.dataset.swap);
  });
  $("#closePlanner").addEventListener("click", () => $("#plannerDialog").close());

  // Prep day
  $("#prepBtn").addEventListener("click", openPrep);
  $("#prepDialog").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (b && b.id === "prepClose") $("#prepDialog").close();
    if (b && b.id === "prepBuild") {
      const ids = $$("#prepBody [data-pm]:checked").map(c => c.dataset.pm);
      prepMeals = plan.filter(m => ids.includes(m.id));
      if (prepMeals.length) renderPrepSession(); else toast(t("Pick at least one meal."));
    }
    if (b && b.id === "prepFinish") finishPrep();
    if (b && b.id === "prepPrint") printPrep();
    if (b && b.dataset.cookmode) { const r = recipeByName(b.dataset.cookmode), m = plan.find(x => x.id === b.dataset.meal); if (r) openCookMode(r, m ? m.servings / r.serves : 1, false); }
  });
  $("#prepDialog").addEventListener("change", e => {
    const c = e.target.closest("[data-task]"); if (!c) return;
    const key = $("#prepBody").dataset.key;
    const set = new Set((settings.prepProgress || {})[key] || []);
    c.checked ? set.add(c.dataset.task) : set.delete(c.dataset.task);
    settings.prepProgress = { [key]: [...set] };
    saveSettings();
    c.closest(".task").classList.toggle("done", c.checked);
  });

  // Timers (buttons anywhere)
  document.addEventListener("click", e => {
    const tb = e.target.closest("[data-timer]");
    if (tb) { e.preventDefault(); startTimer(tb.dataset.label || t("Timer"), Number(tb.dataset.timer)); }
    const tx = e.target.closest("[data-timerx]");
    if (tx) { timers = timers.filter(x => x.id !== tx.dataset.timerx); renderTimers(); }
  });

  // Cook mode
  $("#cookModeBtn").addEventListener("click", () => openCookMode(openResult.recipe, curServings / openResult.recipe.serves, true));
  $("#cookPrev").addEventListener("click", () => cookGo(-1));
  $("#cookNext").addEventListener("click", () => cookGo(1));
  $("#cookExit").addEventListener("click", closeCook);
  $("#cookDialog").addEventListener("cancel", closeCook);
  $("#cookRead").addEventListener("click", () => { settings.readAloud = !settings.readAloud; saveSettings(); renderCook(); if (settings.readAloud) speak(rSteps(cook.r)[cook.idx]); else speechSynthesis.cancel(); });
  $("#cookVoice").addEventListener("click", toggleVoice);
  $("#cookIngrBtn").addEventListener("click", () => { const el = $("#cookIngrWrap"); el.classList.toggle("hidden"); $("#cookIngrBtn").setAttribute("aria-expanded", !el.classList.contains("hidden")); });
  document.addEventListener("visibilitychange", () => { if (cook && document.visibilityState === "visible") keepAwake(true); });

  // Ratings and eating prepped meals
  $$(".rate-btn").forEach(b => b.addEventListener("click", () => rate(Number(b.dataset.rate))));
  $("#ateBtn").addEventListener("click", () => { const m = plan.find(x => x.id === openMealId); if (m) ateMeal(m); });

  // Receipts
  $("#receiptBtn").addEventListener("click", () => $("#receiptFile").click());
  $("#receiptFile").addEventListener("change", e => { if (e.target.files[0]) readReceipt(e.target.files[0]); e.target.value = ""; });
  $("#confirmReceipt").addEventListener("click", confirmReceipt);
  $("#cancelReceipt").addEventListener("click", () => $("#receiptDialog").close());

  // Check-ins
  $("#alerts").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.ciDone) { settings.lastCheckin = todayStr(); saveSettings(); renderPantry(); return; }
    if (!b.dataset.ci) return;
    const it = items.find(i => i.id === b.dataset.id); if (!it) return;
    if (b.dataset.ci === "keep") { it.verified = todayStr(); saveItems(); }
    else removeItem(it, b.dataset.ci);
    const s = stapleSuffix();
    if (s) toast(s.trim());
    renderPantry();
  });

  // Restock suggestions
  $("#shopSuggest").addEventListener("click", e => {
    const b = e.target.closest("[data-restock]"); if (!b) return;
    const it = items.find(i => i.id === b.dataset.restock), list = currentList();
    if (it && list) { addToList(list, it.name, "", t("restock")); saveShopping(); renderShopping(); }
  });

  // Settings
  $("#householdBtn").addEventListener("click", () => { $("#settingsDialog").close(); openOnboarding("edit"); });
  $("#settingsBtn").addEventListener("click", () => { $("#groupAisles").checked = settings.groupAisles !== false; $("#checkinsToggle").checked = !!settings.checkins; });
  $("#groupAisles").addEventListener("change", e => { settings.groupAisles = e.target.checked; saveSettings(); renderAll(); });
  $("#checkinsToggle").addEventListener("change", e => { settings.checkins = e.target.checked; saveSettings(); renderAll(); });
}
