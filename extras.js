"use strict";
/* Nutrition, prices, leftover ideas, kid-friendly recipes, pasting recipes, calendar export,
   printing, help, tips, and a phone feature check. Loaded after kitchen.js. */

/* ---------- nutrition per 100 g: [calories, protein, carbs, fat] (typical values, raw unless noted) ---------- */
const NUTR = {
  "chicken breast": [120, 23, 0, 2.6], "chicken thigh": [177, 19, 0, 11], chicken: [165, 31, 0, 3.6], "ground beef": [215, 18.6, 0, 15],
  beef: [190, 24, 0, 10], steak: [190, 24, 0, 10], "stew meat": [160, 21, 0, 8], pork: [220, 19, 0, 16], bacon: [400, 12, 1.4, 38],
  ham: [145, 21, 1.5, 5.5], sausage: [300, 14, 2, 27], shrimp: [85, 20, 0, 0.5], salmon: [208, 20, 0, 13], fish: [90, 19, 0, 1],
  tuna: [116, 26, 0, 1], tofu: [76, 8, 1.9, 4.8], egg: [143, 12.6, 0.7, 9.5], milk: [61, 3.2, 4.8, 3.3], butter: [717, 0.9, 0.1, 81],
  cheese: [403, 25, 1.3, 33], mozzarella: [300, 22, 2.2, 22], parmesan: [431, 38, 4, 29], feta: [264, 14, 4, 21], cream: [340, 2.8, 2.8, 36],
  "sour cream": [198, 2.4, 4.6, 19], yogurt: [70, 5, 5, 3], "cream cheese": [342, 6, 4, 34], "cottage cheese": [98, 11, 3.4, 4.3],
  rice: [365, 7, 80, 0.7], pasta: [371, 13, 75, 1.5], "egg noodle": [384, 14, 71, 4.4], oat: [389, 17, 66, 7], bread: [265, 9, 49, 3.2],
  tortilla: [304, 8, 50, 8], flour: [364, 10, 76, 1], sugar: [387, 0, 100, 0], granola: [471, 10, 64, 20], breadcrumb: [395, 13, 72, 5],
  crouton: [407, 12, 74, 6], "canned tomato": [32, 1.6, 7, 0.3], "tomato sauce": [29, 1.3, 6, 0.2], "tomato paste": [82, 4.3, 19, 0.5],
  "black bean": [91, 6, 16, 0.3], "kidney bean": [84, 5.2, 15, 0.4], chickpea: [139, 7, 23, 2.6], lentil: [352, 25, 63, 1],
  broth: [5, 0.6, 0.4, 0.2], "coconut milk": [197, 2, 2.8, 21], "peanut butter": [588, 25, 20, 50], honey: [304, 0.3, 82, 0],
  "maple syrup": [260, 0, 67, 0], mayonnaise: [680, 1, 0.6, 75], mustard: [66, 4, 6, 3.3], salsa: [36, 1.5, 7, 0.2],
  "barbecue sauce": [172, 0.8, 41, 0.6], "soy sauce": [53, 8, 5, 0.6], vinegar: [18, 0, 0.6, 0], oil: [884, 0, 0, 100],
  "olive oil": [884, 0, 0, 100], "vegetable oil": [884, 0, 0, 100],
  "caesar dressing": [542, 2, 3, 58], olive: [115, 0.8, 6, 11], "pine nut": [673, 14, 13, 68], tahini: [595, 17, 21, 54], hummus: [166, 8, 14, 10],
  onion: [40, 1.1, 9, 0.1], garlic: [149, 6.4, 33, 0.5], potato: [77, 2, 17, 0.1], "sweet potato": [86, 1.6, 20, 0.1], carrot: [41, 0.9, 10, 0.2],
  celery: [16, 0.7, 3, 0.2], "bell pepper": [26, 1, 6, 0.3], broccoli: [34, 2.8, 7, 0.4], cauliflower: [25, 1.9, 5, 0.3], spinach: [23, 2.9, 3.6, 0.4],
  kale: [49, 4.3, 9, 0.9], lettuce: [15, 1.4, 2.9, 0.2], tomato: [18, 0.9, 3.9, 0.2], cucumber: [15, 0.7, 3.6, 0.1], zucchini: [17, 1.2, 3.1, 0.3],
  mushroom: [22, 3.1, 3.3, 0.3], cabbage: [25, 1.3, 6, 0.1], avocado: [160, 2, 9, 15], lemon: [29, 1.1, 9, 0.3], lime: [30, 0.7, 11, 0.2],
  banana: [89, 1.1, 23, 0.3], apple: [52, 0.3, 14, 0.2], berry: [50, 0.8, 12, 0.3], strawberry: [32, 0.7, 7.7, 0.3], blueberry: [57, 0.7, 14, 0.3],
  mango: [60, 0.8, 15, 0.4], peach: [39, 0.9, 10, 0.3], pineapple: [50, 0.5, 13, 0.1], cilantro: [23, 2, 3.7, 0.5], parsley: [36, 3, 6, 0.8],
  basil: [23, 3, 2.6, 0.6], scallion: [32, 1.8, 7, 0.2], jalapeno: [29, 0.9, 6.5, 0.4], ginger: [80, 1.8, 18, 0.8], corn: [86, 3.3, 19, 1.4],
  pea: [81, 5.4, 14, 0.4], "green bean": [31, 1.8, 7, 0.2], "snap pea": [42, 2.8, 7.6, 0.2], asparagus: [20, 2.2, 3.9, 0.1],
  "butternut squash": [45, 1, 12, 0.1], "brussel sprout": [43, 3.4, 9, 0.3], cinnamon: [247, 4, 81, 1.2], cumin: [375, 18, 44, 22],
  "chili powder": [282, 13, 50, 14], paprika: [282, 14, 54, 13], oregano: [265, 9, 69, 4], "curry powder": [325, 14, 56, 14],
  "italian seasoning": [265, 9, 69, 4], vanilla: [288, 0, 13, 0], "baking powder": [53, 0, 28, 0], cornstarch: [381, 0.3, 91, 0.1],
  "red pepper flake": [318, 12, 57, 17], salt: [0, 0, 0, 0], pepper: [251, 10, 64, 3], water: [0, 0, 0, 0], "baking soda": [0, 0, 0, 0]
};
/* ---------- typical US grocery prices, dollars per kg ---------- */
const PRICE_KG = {
  "chicken breast": 8.8, "chicken thigh": 6.6, chicken: 8.8, "ground beef": 11, beef: 18, steak: 22, "stew meat": 15, pork: 7.7, bacon: 15,
  ham: 11, sausage: 11, shrimp: 20, salmon: 22, fish: 15, tuna: 13, tofu: 6.6, egg: 6.5, milk: 1.1, butter: 11, cheese: 13, mozzarella: 11,
  parmesan: 30, feta: 20, cream: 8, "sour cream": 6, yogurt: 5, "cream cheese": 9, rice: 3.3, pasta: 4, "egg noodle": 6, oat: 4, bread: 6,
  tortilla: 7, flour: 1.5, sugar: 2, granola: 13, breadcrumb: 7, crouton: 13, "canned tomato": 3, "tomato sauce": 3.5, "tomato paste": 6,
  "black bean": 3, "kidney bean": 3, chickpea: 3, lentil: 4, broth: 3, "coconut milk": 7, "peanut butter": 8, honey: 15, "maple syrup": 25,
  mayonnaise: 6, mustard: 6, salsa: 8, "barbecue sauce": 6, "soy sauce": 7, vinegar: 2, oil: 5, "olive oil": 12, "caesar dressing": 13,
  olive: 13, "pine nut": 60, tahini: 15, onion: 3.3, garlic: 9, potato: 2, "sweet potato": 3.3, carrot: 2.6, celery: 3.5, "bell pepper": 7,
  broccoli: 5.5, cauliflower: 5, spinach: 11, kale: 9, lettuce: 5, tomato: 5.5, cucumber: 4, zucchini: 4.4, mushroom: 9, cabbage: 2.2,
  avocado: 8, lemon: 6.6, lime: 6, banana: 1.5, apple: 4.4, berry: 13, strawberry: 9, blueberry: 15, mango: 5, peach: 5, pineapple: 3,
  cilantro: 20, parsley: 20, basil: 40, scallion: 10, jalapeno: 5, ginger: 9, corn: 4, pea: 4, "green bean": 6, "snap pea": 13, asparagus: 9,
  "butternut squash": 3.3, "brussel sprout": 8, cinnamon: 30, cumin: 40, "chili powder": 30, paprika: 30, oregano: 40, "curry powder": 35,
  "italian seasoning": 40, vanilla: 200, "baking powder": 10, "baking soda": 4, cornstarch: 5, "red pepper flake": 30, salt: 1, pepper: 40, water: 0
};
function nutritionOf(r) {
  if (r._nutr) return r._nutr;
  let cal = 0, protein = 0, carbs = 0, fat = 0, known = 0, total = 0;
  for (const g of r.ingredients) {
    if (g.opt) continue;
    const grams = ingGrams(g, 1);
    if (grams == null) continue;
    total++;
    const n = byKey("nutr", NUTR, g.key);
    if (!n) continue;
    known++;
    cal += n[0] * grams / 100; protein += n[1] * grams / 100; carbs += n[2] * grams / 100; fat += n[3] * grams / 100;
  }
  const s = r.serves || 4;
  r._nutr = { cal: cal / s, protein: protein / s, carbs: carbs / s, fat: fat / s, coverage: total ? known / total : 1 };
  return r._nutr;
}
function pricePerG(key) {
  if (!key) return null;
  const learned = settings.prices || {};
  for (const k of chain(key)) { const v = learned[k.trim()]; if (v && v.perG) return v.perG; }
  const v = byKey("price", PRICE_KG, key);
  return v != null ? v / 1000 : null;
}
/* Cost of one serving */
function costOf(r) {
  let sum = 0;
  for (const g of r.ingredients) {
    if (g.opt) continue;
    const grams = ingGrams(g, 1);
    if (grams == null) continue;
    const pp = pricePerG(g.key);
    sum += grams * (pp == null ? 0.01 : pp);
  }
  return sum / (r.serves || 4);
}
const fmtMoney = v => new Intl.NumberFormat(locale(), { style: "currency", currency: "USD" }).format(v || 0);
function nutritionLine(r) {
  const n = nutritionOf(r);
  const parts = [t("{n} calories", { n: Math.round(n.cal) }), t("{n} g protein", { n: Math.round(n.protein) }), t("{n} g carbs", { n: Math.round(n.carbs) }),
    t("{n} g fat", { n: Math.round(n.fat) }), t("about {cost}", { cost: fmtMoney(costOf(r)) })];
  return t("Per serving:") + " " + parts.join(" · ") + (n.coverage < 0.7 ? " " + t("(partial estimate)") : "");
}
/* Learn real prices from receipts */
function learnPrice(name, amount, unit, price) {
  const key = canon(name);
  if (!key || !price) return;
  const grams = amount ? gramsOf(amount, unit, key, null) : pkgGrams(key);
  if (!grams) return;
  const perG = price / grams;
  const base = byKey("price", PRICE_KG, key);
  if (base && (perG > base / 1000 * 8 || perG < base / 1000 / 8)) return;   // probably a misread
  settings.prices = settings.prices || {};
  const k = key.trim(), old = settings.prices[k];
  settings.prices[k] = old ? { perG: (old.perG * Math.min(old.n, 3) + perG) / (Math.min(old.n, 3) + 1), n: old.n + 1 } : { perG, n: 1 };
}
/* Estimated cost of what's still on a shopping list */
function listEstimate(list) {
  let total = 0, unknown = 0;
  for (const x of list.items) {
    if (x.done) continue;
    const key = canon(x.name), pp = pricePerG(key);
    if (!key || pp == null) { unknown++; continue; }
    let grams = 0;
    const parts = String(x.amt || "").split("+").map(s => s.trim()).filter(Boolean);
    for (const a of parts) { const p = parseQty(a); const g = p ? gramsOf(p.q, p.unit, key, p.inner) : null; if (g) grams += g; }
    if (!grams) grams = pkgGrams(key) || 300;
    total += grams * pp;
  }
  return { total, unknown };
}

/* ---------- kid-friendly ---------- */
const KID_FAMILIES = ["omelette", "egg-muffin", "oats", "smoothie", "quesadilla", "tacos", "burrito", "burrito-bowl", "pasta", "pasta-bake", "fried-rice", "chicken-soup", "sheet-pan"];
const KID_NAMES = ["Fluffy Pancakes", "French Toast", "Banana Bread", "Overnight Oats", "Scrambled Eggs on Toast", "Grilled Cheese", "Chicken Noodle Soup",
  "Spaghetti Bolognese", "Stovetop Mac and Cheese", "Classic Meatballs", "Chicken Fajitas", "Mashed Potatoes", "Apple Crisp", "Rice Pudding",
  "Yogurt Parfait", "Loaded Baked Potatoes", "BLT Sandwich", "Tuna Salad Sandwich", "Slow Cooker Salsa Chicken", "Slow Cooker Pulled Pork"];
RECIPES.forEach(r => {
  const spicy = r.ing.some(s => /\|(jalapeno|red pepper flakes|curry powder)$/.test(s));
  r.kid = (KID_FAMILIES.includes(r.family) || KID_NAMES.includes(r.name)) && !spicy;
});

/* ---------- leftover ideas ---------- */
const REMIX = {
  asian: [["Wrap it in a warm tortilla with a little cheese for a quick quesadilla.", "Envuélvelo en una tortilla caliente con un poco de queso para una quesadilla rápida."],
    ["Toss it with cooked noodles and a splash of soy sauce.", "Mézclalo con fideos cocidos y un chorrito de salsa de soya."],
    ["Top a bowl of it with a fried egg.", "Sírvelo en un tazón con un huevo frito encima."]],
  mexican: [["Make quesadillas or nachos with cheese.", "Haz quesadillas o nachos con queso."],
    ["Stuff it into baked potatoes.", "Rellena papas al horno con esto."],
    ["Turn it into a bowl over rice and lettuce.", "Sírvelo en un tazón sobre arroz y lechuga."]],
  saucy: [["Serve it over a baked potato or rice.", "Sírvelo sobre una papa al horno o arroz."],
    ["Thin it with broth for a quick soup.", "Agrégale caldo para una sopa rápida."],
    ["Spoon it into a tortilla for a wrap.", "Ponlo en una tortilla para hacer un taco o wrap."]],
  pasta: [["Bake it with extra cheese on top until crispy.", "Hornéala con más queso encima hasta que se dore."],
    ["Stir it into beaten eggs and bake for a pasta frittata.", "Mézclala con huevos batidos y hornéala como frittata."]],
  roasted: [["Chop it up for a rice bowl or salad.", "Pícalo para un bowl de arroz o una ensalada."],
    ["Fold it into an omelette or quesadilla.", "Ponlo en un omelet o una quesadilla."]],
  any: [["Fold it into a quesadilla or omelette.", "Ponlo en una quesadilla o un omelet."],
    ["Serve it over rice or greens with a fried egg.", "Sírvelo sobre arroz o lechuga con un huevo frito."]]
};
const REMIX_GROUP = { "stir-fry": "asian", "fried-rice": "asian", "soy-bowl": "asian", tacos: "mexican", "burrito-bowl": "mexican", burrito: "mexican",
  quesadilla: "mexican", "Chicken Fajitas": "mexican", curry: "saucy", chili: "saucy", "chicken-soup": "saucy", "blended-soup": "saucy",
  "slow-cooker": "saucy", "Easy Beef Chili": "saucy", "Beef Stew": "saucy", pasta: "pasta", "pasta-bake": "pasta", "Spaghetti Bolognese": "pasta",
  "sheet-pan": "roasted", "med-bowl": "roasted" };
function remixHtml(item) {
  const r = item.recipe && recipeByName(item.recipe);
  const group = r ? (REMIX_GROUP[r.family] || (r.cuisine === "Mexican" ? "mexican" : r.cuisine === "Asian" ? "asian" : "any")) : "any";
  const ideas = REMIX[group].concat(group === "any" ? [] : REMIX.any.slice(0, 1));
  return `<div class="tip"><strong>${esc(t("Ideas for these leftovers"))}</strong><ul>${ideas.map(i => `<li>${esc(LANG === "es" ? i[1] : i[0])}</li>`).join("")}</ul></div>`;
}

/* ---------- paste a recipe from a website ---------- */
function parseDur(s) {
  let min = 0;
  const h = String(s).match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?|horas?)\b/i);
  const m = String(s).match(/(\d+)\s*(?:m|min|mins|minutes?|minutos?)\b/i);
  if (h) min += Number(h[1]) * 60;
  if (m) min += Number(m[1]);
  return min || null;
}
function parseRecipeText(text) {
  const lines = String(text).split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const ingHead = /^(ingredients?|ingredientes)\b\s*:?\s*$/i;
  const stepHead = /^(instructions?|directions?|method|preparation|steps?|how to make( it)?|preparaci[oó]n|instrucciones|pasos|modo de preparaci[oó]n|elaboraci[oó]n)\b\s*:?\s*$/i;
  const stopHead = /^(notes?|nutrition( facts| information)?|tips|recipe notes|notas|nutrici[oó]n|consejos)\b\s*:?\s*$/i;
  let name = "", serves = null, prep = 0, cook = 0, total = null, mode = null;
  const ing = [], steps = [];
  for (const l of lines) {
    const sv = l.match(/\b(serves|servings|yield|makes|porciones|rinde|raciones)\b\s*:?\s*(\d+)/i);
    if (sv && l.length < 40) { serves = Number(sv[2]); continue; }
    const tm = l.match(/\b(prep|cook|total|preparaci[oó]n|cocci[oó]n)\b\s*(time|tiempo)?\s*:?\s*(.*)$/i);
    if (tm && l.length < 50 && parseDur(tm[3])) {
      const d = parseDur(tm[3]);
      if (/total/i.test(tm[1])) total = d; else if (/prep|prepar/i.test(tm[1])) prep = d; else cook = d;
      continue;
    }
    if (ingHead.test(l)) { mode = "ing"; continue; }
    if (stepHead.test(l)) { mode = "steps"; continue; }
    if (stopHead.test(l)) { mode = "stop"; continue; }
    if (mode === "ing") { const s = l.replace(/^[-*•▢☐○]\s*/, ""); if (s && !/^for the /i.test(s)) ing.push(s); }
    else if (mode === "steps") { const s = l.replace(/^(step\s*\d+\s*[:.)-]?|paso\s*\d+\s*[:.)-]?|\d+\s*[.)])\s*/i, ""); if (s.length > 2) steps.push(s); }
    else if (!mode && !name && l.length < 90 && !/^(by|jump to|print|pin|save)\b/i.test(l)) name = l;
  }
  if (!ing.length) {
    lines.forEach(l => {
      if (l === name) return;
      if (/^(\d|¼|½|¾|[-*•])/.test(l) && l.length < 80 && !/[.!?]$/.test(l)) ing.push(l.replace(/^[-*•]\s*/, ""));
      else if (l.length > 30) steps.push(l.replace(/^(\d+\s*[.)])\s*/, ""));
    });
  }
  const fix = s => s.replace(/½/g, "1/2").replace(/¼/g, "1/4").replace(/¾/g, "3/4").replace(/⅓/g, "1/3").replace(/⅔/g, "2/3").replace(/(\d)(1\/\d)/, "$1 $2");
  return { name, serves, time: total || (prep + cook) || null, ing: ing.map(fix), steps };
}

/* ---------- meal plan to calendar ---------- */
function planICS() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pantry Pal//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  const slotTime = { breakfast: ["080000", "PT30M"], lunch: ["123000", "PT30M"], dinner: ["183000", "PT1H"] };
  const today = todayStr();
  let n = 0;
  for (const m of plan) {
    if (m.date < today) continue;
    const r = recipeByName(m.recipe); if (!r) continue;
    const slot = m.slot || "dinner", [time, dur] = slotTime[slot];
    const label = t(slot === "breakfast" ? "Breakfast" : slot === "lunch" ? "Lunch" : "Dinner");
    const desc = m.fromId ? t("Leftovers from last night") : m.prepped ? t("Prepped and in the fridge") : t("Open Pantry Pal for the recipe and cook mode.");
    lines.push("BEGIN:VEVENT", `UID:${m.id}@pantrypal-plan`, `DTSTAMP:${stamp}`, `DTSTART:${m.date.replace(/-/g, "")}T${time}`, `DURATION:${dur}`,
      `SUMMARY:${icsEsc(label + ": " + rName(r))}`, `DESCRIPTION:${icsEsc(desc)}`, "END:VEVENT");
    n++;
  }
  const prepDays = {};
  plan.forEach(m => { if (!m.fromId && !m.prepped && m.cookOn && m.cookOn !== m.date && m.cookOn >= today) (prepDays[m.cookOn] = prepDays[m.cookOn] || []).push(m); });
  for (const [d, list] of Object.entries(prepDays)) {
    const names = list.map(m => { const r = recipeByName(m.recipe); return r ? rName(r) : m.recipe; }).join(", ");
    lines.push("BEGIN:VEVENT", `UID:prep-${d}@pantrypal-plan`, `DTSTAMP:${stamp}`, `DTSTART:${d.replace(/-/g, "")}T100000`, "DURATION:PT2H",
      `SUMMARY:${icsEsc(t("Prep day") + ": " + names)}`, `DESCRIPTION:${icsEsc(t("Open Prep day in Pantry Pal for the combined plan."))}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(t("Prep day"))}`, "TRIGGER:-PT1H", "END:VALARM", "END:VEVENT");
    n++;
  }
  lines.push("END:VCALENDAR");
  return { text: lines.join("\r\n"), n };
}
function exportPlanCalendar() {
  const { text, n } = planICS();
  if (!n) { toast(t("Your plan is empty. Make a plan first.")); return; }
  download("pantry-meal-plan.ics", text, "text/calendar");
  toast(tn(n, "Calendar file ready with 1 event. Open it to add it to your calendar.", "Calendar file ready with {n} events. Open it to add them to your calendar."));
}

/* ---------- printing ---------- */
function printSheet(title, html) {
  $$("dialog[open]").forEach(d => d.close());
  $("#printArea").innerHTML = `<h1>${esc(title)}</h1>` + html + `<p class="print-foot">Pantry Pal · ${esc(prettyDate(todayStr()))}</p>`;
  document.body.classList.add("printing");
  setTimeout(() => window.print(), 60);
}
function printPlan() {
  const today = todayStr();
  const days = [];
  for (let i = 0; i < 7; i++) days.push(addDaysFrom(today, i));
  const cell = (d, slot) => plan.filter(m => m.date === d && (m.slot || "dinner") === slot).map(m => {
    const r = recipeByName(m.recipe); if (!r) return "";
    return esc(rName(r)) + (m.fromId ? ` <em>(${esc(t("leftovers"))})</em>` : m.cookOn && m.cookOn !== m.date && !m.prepped ? ` <em>(${esc(t("prep day"))})</em>` : "");
  }).join("<br>");
  let html = `<table class="print-table"><thead><tr><th>${esc(t("Day"))}</th><th>${esc(t("Breakfast"))}</th><th>${esc(t("Lunch"))}</th><th>${esc(t("Dinner"))}</th></tr></thead><tbody>`;
  html += days.map(d => `<tr><td><strong>${esc(dayName(d))}</strong></td><td>${cell(d, "breakfast")}</td><td>${cell(d, "lunch")}</td><td>${cell(d, "dinner")}</td></tr>`).join("");
  html += `</tbody></table>`;
  const shop = planShoppingEntries();
  if (shop.length) {
    const groups = {};
    shop.forEach(e => { const a = aisleOf(e.name); (groups[a] = groups[a] || []).push(e); });
    html += `<h2>${esc(t("Shopping list"))}</h2><div class="print-cols">` + AISLE_ORDER.filter(a => groups[a]).map(a =>
      `<div><h3>${esc(t(AISLE_LABEL[a]))}</h3><ul class="print-check">${groups[a].map(e => `<li>${esc([e.amt, e.name].filter(Boolean).join(" "))}</li>`).join("")}</ul></div>`).join("") + `</div>`;
  }
  printSheet(t("Meal plan"), html);
}
function printPrep() {
  const tasks = buildPrepSession(prepMeals);
  const sec = { start: t("Get started"), prep: t("Chop and prep"), cook: t("Cook"), store: t("Pack and store") };
  let html = "", last = "";
  for (const tk of tasks) {
    if (tk.section !== last) { if (last) html += "</ul>"; html += `<h2>${esc(sec[tk.section])}</h2><ul class="print-check">`; last = tk.section; }
    if (tk.section === "cook") html += `<li><strong>${esc(tk.title)}</strong><ol>${tk.steps.map(s => `<li>${esc(s.text)}</li>`).join("")}</ol></li>`;
    else html += `<li>${esc(tk.text)}${tk.sub ? ` <em>(${esc(tk.sub)})</em>` : ""}</li>`;
  }
  if (last) html += "</ul>";
  printSheet($("#prepTitle").textContent || t("Prep day"), html);
}

/* ---------- help and one-time tips ---------- */
const HELP = [
  ["Getting started", ["Add the food you have with +, the notepad (several at once), the receipt button, or the barcode camera. Or run a pantry audit from Settings.",
    "Then use Recipes for ideas, or Plan my week to have meals planned for you. Everything works even if you never add food."]],
  ["My Food", ["Items are sorted by what expires first. Orange means 3 days or less, red means it's past the date.",
    "Tap an item to edit it, freeze it, set a reminder, or find recipes that use it. The -1 button uses one up.",
    "Every few days the app asks if you still have things, which keeps your list accurate."]],
  ["Recipes", ["For you ranks recipes by what you have and what's expiring. Browse all lists every recipe, and Saved keeps favorites, your own recipes, and ones you've made.",
    "In a recipe, change servings with + and -, see nutrition and cost, tap Cook mode for step-by-step cooking, and use the thumbs to teach the app your taste."]],
  ["Plan my week", ["Plan my week builds your meals around your food, your schedule, and your budget. Lock meals you like and swap the rest, then Save and shop.",
    "If you set a prep day, Prep day gives you one combined cooking plan and moves the finished meals into My Food."]],
  ["Shopping", ["Lists are grouped by store section. Check things off, then Move checked to My Food. Share a list by text with the share button."]],
  ["Install it like an app", ["Android (Chrome): open the menu and tap Add to Home screen or Install app.",
    "iPhone (Safari): tap the Share button, then Add to Home Screen."]],
  ["Your data", ["Everything stays on this phone, in this browser. Use Settings, then Export backup to keep a copy or move to a new phone."]]
];
const HINTS = {
  food: "Tap any item to edit it, freeze it, or find recipes that use it. The -1 button uses one up.",
  recipes: "For you ranks recipes by what's expiring. Browse all has every recipe, and Saved keeps your favorites. Tap a recipe for servings, nutrition, and cook mode.",
  plan: "Tap Plan my week and Pantry Pal builds your meals. Swap or lock any meal, then get your shopping list in one tap.",
  shopping: "Check items off as you shop, then tap Move checked to My Food. The list is grouped by store section.",
  prep: "Check things off as you go and tap a time to start a timer. When you're done, your meals move into My Food as prepped containers.",
  cook: "Tap Next to move through the steps. Turn on Voice commands to say \"next\" or \"timer\" with messy hands."
};
function renderHints() {
  settings.hints = settings.hints || {};
  $$(".hint-slot").forEach(el => {
    const id = el.dataset.hint;
    el.innerHTML = !settings.hints[id] && HINTS[id]
      ? `<div class="hint"><span>&#128161; ${esc(t(HINTS[id]))}</span><button class="link-btn" data-hint-ok="${id}">${esc(t("Got it"))}</button></div>` : "";
  });
}
function openHelp() {
  $("#helpBody").innerHTML = HELP.map(([title, paras]) => `<h3>${esc(t(title))}</h3>${paras.map(p => `<p>${esc(t(p))}</p>`).join("")}`).join("")
    + `<p><button class="link-btn" id="resetHints">${esc(t("Show the tips again"))}</button></p>`;
  $("#helpDialog").showModal();
}

/* ---------- what this phone supports ---------- */
async function runDiagnostics() {
  const rows = [];
  const add = (label, ok, note) => rows.push({ label, ok, note });
  const reg = await swReady(1500);
  add("Works offline", !!(reg && navigator.serviceWorker.controller), location.protocol.startsWith("http") ? t("Reload the page once if this says no.") : t("Needs the Acode preview or a real website, not a file."));
  add("Camera", !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext, t("Needs https or the Acode preview."));
  add("Built-in barcode scanner", "BarcodeDetector" in window, t("If not, a backup scanner loads from the internet."));
  add("Reading receipts and dates from photos", navigator.onLine, t("Needs internet."));
  add("Voice commands", !!(window.SpeechRecognition || window.webkitSpeechRecognition), t("Works best in Chrome on Android."));
  add("Read aloud", "speechSynthesis" in window, "");
  add("Keep screen on in cook mode", "wakeLock" in navigator, "");
  add("Notifications", "Notification" in window && Notification.permission === "granted", "Notification" in window ? t("Turn on in Settings, under Reminders.") : t("Not available in this browser."));
  add("Background reminders", !!(reg && "periodicSync" in reg), t("Chrome on Android, installed to the home screen."));
  add("Share button", !!navigator.share, t("If not, lists are copied instead."));
  add("Vibration for timers", "vibrate" in navigator, "");
  add("Installed as an app", matchMedia("(display-mode: standalone)").matches || navigator.standalone === true, t("See Help for how to install."));
  let storage = "";
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); storage = t("Using {a} MB of {b} MB available.", { a: (e.usage / 1048576).toFixed(1), b: Math.round(e.quota / 1048576) }); } } catch (e) {}
  $("#diagBody").innerHTML = `<ul class="diag">${rows.map(r => `<li class="${r.ok ? "ok" : "no"}"><span class="mark" aria-hidden="true">${r.ok ? "&#10003;" : "&#10007;"}</span>
    <span><strong>${esc(t(r.label))}</strong> <span class="sr">${esc(r.ok ? t("Yes") : t("No"))}</span>${r.note && !r.ok ? `<br><span class="muted small">${esc(r.note)}</span>` : ""}</span></li>`).join("")}</ul>
    ${storage ? `<p class="muted small">${esc(storage)}</p>` : ""}<p class="muted small">${esc(navigator.userAgent)}</p>`;
  $("#diagDialog").showModal();
}

/* ---------- wiring ---------- */
function extrasInit() {
  document.addEventListener("click", e => {
    const ok = e.target.closest("[data-hint-ok]");
    if (ok) { settings.hints = settings.hints || {}; settings.hints[ok.dataset.hintOk] = true; saveSettings(); renderHints(); }
    if (e.target.id === "resetHints") { settings.hints = {}; saveSettings(); renderHints(); toast(t("Tips will show again.")); }
  });
  window.addEventListener("afterprint", () => { document.body.classList.remove("printing"); $("#printArea").innerHTML = ""; });
  $("#helpBtn").addEventListener("click", openHelp);
  $("#helpSettingsBtn").addEventListener("click", () => { $("#settingsDialog").close(); openHelp(); });
  $("#closeHelp").addEventListener("click", () => $("#helpDialog").close());
  $("#diagBtn").addEventListener("click", () => { $("#settingsDialog").close(); runDiagnostics(); });
  $("#closeDiag").addEventListener("click", () => $("#diagDialog").close());
  $("#planPrintBtn").addEventListener("click", printPlan);
  $("#planCalBtn").addEventListener("click", exportPlanCalendar);
  $("#kidBtn").addEventListener("click", () => { settings.kidFilter = !settings.kidFilter; saveSettings(); $("#kidBtn").classList.toggle("on", settings.kidFilter); $("#kidBtn").setAttribute("aria-pressed", settings.kidFilter); renderRecipes(); });
  $("#kidBtn").classList.toggle("on", !!settings.kidFilter); $("#kidBtn").setAttribute("aria-pressed", !!settings.kidFilter);
  $("#quickBtn").addEventListener("click", () => {
    recipeMode = "foryou"; setPressed("#recipeMode", $('#recipeMode [data-mode="foryou"]'));
    $("#timeFilter").value = "20"; $("#missingFilter").value = items.length ? "1" : "99"; focusItemId = null;
    recipeLimit = PAGE_SIZE; renderRecipes();
    toast(t("Quick picks: 20 minutes or less, missing at most 1 thing."));
  });
  $("#pasteToggle").addEventListener("click", () => { $("#pasteBox").classList.toggle("hidden"); $("#pasteText").focus(); });
  $("#pasteFill").addEventListener("click", () => {
    const r = parseRecipeText($("#pasteText").value);
    if (!r.ing.length && !r.steps.length) { $("#suggestError").textContent = t("Couldn't find ingredients or steps in that text. Try copying the whole recipe, including the Ingredients and Instructions headings."); return; }
    if (r.name) $("#sName").value = r.name;
    if (r.serves) $("#sServes").value = r.serves;
    if (r.time) $("#sTime").value = r.time;
    $("#sIng").value = r.ing.join("\n");
    $("#sSteps").value = r.steps.join("\n");
    $("#pasteBox").classList.add("hidden");
    $("#suggestError").textContent = "";
    toast(tn(r.ing.length, "Found 1 ingredient. Check everything before saving.", "Found {n} ingredients. Check everything before saving."));
  });
}
