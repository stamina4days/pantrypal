"use strict";
/* Setup. */
/* ---------- setup (first run and editing later) ---------- */
let ob = null;
function openOnboarding(mode) {
  const P = profile();
  ob = { mode, step: mode === "first" ? 0 : 1, data: { ...P, cuisines: [...P.cuisines], equipment: [...P.equipment], diets: [...settings.diets],
    userName: settings.userName || "", kitchenName: settings.kitchenName || "", view: settings.view || "simple" } };
  renderOnboarding();
  if (!$("#onboardDialog").open) $("#onboardDialog").showModal();
}
function obLast() { return ob.mode === "first" ? 4 : 3; }
/* First time: just two short steps, the look of the app, then the food you have right now.
   Household, diet, and cooking questions wait in Settings (People, diet, cooking time, and equipment). */
const FIRST_FOODS = ["Milk", "Eggs", "Bread", "Butter", "Cheese", "Yogurt", "Chicken breast", "Ground beef", "Rice", "Pasta",
  "Bananas", "Apples", "Spinach", "Carrots", "Onions", "Potatoes", "Tomatoes", "Lettuce"];
let obPicked = new Set();
function obStepNo() { return ob.mode === "first" ? (ob.step === 0 ? 1 : 2) : ob.step; }
function addFirstFoods() {
  let n = 0;
  obPicked.forEach(raw => {
    const name = t(raw);
    if (items.some(i => norm(i.name) === norm(name))) return;
    const loc = guessLoc(name) || "Fridge", est = estimateShelf(name, loc);
    items.push({ id: uid(), added: todayStr(), bought: todayStr(), verified: todayStr(), name, amount: null, unit: "", location: loc,
      expires: est ? addDaysFrom(todayStr(), est.days) : "", notes: "", barcode: "", staple: isStaple(name) });
    n++;
  });
  obPicked = new Set();
  if (n) { saveItems(); toast(tn(n, "Added 1 food. Tap it on My Food to change anything.", "Added {n} foods. Tap any of them on My Food to change anything.")); }
  return n;
}
function renderOnboarding() {
  const d = ob.data, body = $("#obBody");
  const check = (id, on, label) => `<label class="check"><input type="checkbox" data-ob="${id}" ${on ? "checked" : ""}> <span>${esc(label)}</span></label>`;
  const opts = (list, cur) => list.map(([v, l]) => `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${esc(l)}</option>`).join("");
  let h = `<p class="muted small">${esc(t("Step {a} of {b}", { a: obStepNo(), b: ob.mode === "first" ? 2 : 3 }))}</p>`;
  if (ob.step === 0) {
    h += palBubble("wink", t("It plans meals around the food you already have, so less goes to waste. This takes a few seconds, and you can change any of it later."), [], "pal-big")
      + `<h2 class="center">${esc(t("Welcome to Pantry Pal"))}</h2>
      <h3>${esc(t("How much do you want to see?"))}</h3>
      <div class="view-pick">
        <button type="button" data-view="simple" class="view-card ${d.view !== "full" ? "on" : ""}" aria-pressed="${d.view !== "full"}"><strong>${esc(t("Keep it simple"))}</strong><span>${esc(t("Big buttons, just the basics. Great for anyone."))}</span></button>
        <button type="button" data-view="full" class="view-card ${d.view === "full" ? "on" : ""}" aria-pressed="${d.view === "full"}"><strong>${esc(t("Show me everything"))}</strong><span>${esc(t("All the filters and extras."))}</span></button>
      </div>
      <h3 id="obTextSize">${esc(t("How big should the words be?"))}</h3>
      <div class="text-size-pick" role="group" aria-labelledby="obTextSize">${[["normal", "Regular", 1], ["large", "Large", 2], ["xl", "Extra large", 3]].map(([v, l, n]) =>
        `<button type="button" data-textsize="${v}" aria-pressed="${textSizeNow() === v}"><span class="ts-aa ts-${n}" aria-hidden="true">Aa</span><span>${esc(t(l))}</span></button>`).join("")}</div>`;
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
    h += palBubble("hungry", t("What's in your kitchen right now? Tap everything you have. I'll guess where it goes and how long it keeps."), [])
      + `<div class="first-foods">${FIRST_FOODS.map(n => { const on = obPicked.has(n);
        return `<button type="button" class="pick-chip ff-pick ${on ? "on" : ""}" aria-pressed="${on}" data-ff="${esc(n)}">${foodArt(t(n), null, "pick-art")}<span>${esc(t(n))}</span></button>`; }).join("")}</div>
      <button type="button" id="obAudit" class="link-btn ff-more">${esc(t("Got lots more? Go through the whole kitchen"))}</button>
      <p class="muted small">${esc(t("Nothing in there yet? Just tap Done. Recipes, meal plans, and cook mode all work without food."))}</p>`;
  }
  body.innerHTML = h;
  $("#obBack").classList.toggle("hidden", ob.step === (ob.mode === "first" ? 0 : 1));
  $("#obNext").textContent = ob.mode === "first" && ob.step === 4
    ? (obPicked.size ? tn(obPicked.size, "Add 1 food", "Add {n} foods") : t("Done")) : ob.step === obLast() ? t("Save") : t("Next");
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
  const { diets, userName, kitchenName, view, ...house } = ob.data;
  settings.household = house;
  settings.diets = diets;
  settings.userName = (userName || "").trim();
  settings.view = view === "full" ? "full" : "simple";
  applyDisplay();
  renderKitchenName();
  settings.onboarded = true;
  saveSettings();
  renderDietSummary();
  renderAll();
}
function obNext() {
  obRead();
  if (ob.mode === "first" && ob.step === 4) { obSave(); addFirstFoods(); renderAll(); $("#onboardDialog").close(); return; }
  if (ob.step >= obLast()) { obSave(); $("#onboardDialog").close(); toast(t("Saved your preferences.")); return; }
  ob.step = ob.mode === "first" && ob.step === 0 ? 4 : ob.step + 1;
  renderOnboarding();
}
