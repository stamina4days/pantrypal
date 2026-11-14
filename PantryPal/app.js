"use strict";
/* Pantry Pal: track your food, plan meals, and cook what expires first.
   All data is saved in this browser (localStorage). No server or account needed. */

const KEYS = {
  items: "pantrypal.items.v1", settings: "pantrypal.settings.v1", history: "pantrypal.history.v1",
  shopping: "pantrypal.shopping.v1", barcodes: "pantrypal.barcodes.v1", plan: "pantrypal.plan.v1",
  cooked: "pantrypal.cooked.v1", mine: "pantrypal.myrecipes.v1"
};
const DEFAULT_LOCATIONS = ["Fridge", "Freezer", "Pantry", "Counter"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Side", "Snack", "Dessert", "Drink"];
const PAGE_SIZE = 40;

/* Recipe suggestions: put your address here, split in two to slow down spam bots.
   Example: const SUGGEST_EMAIL = ["yourname", "gmail.com"].join("@");
   While it's empty, the suggestion buttons stay hidden. */
const SUGGEST_EMAIL = "";

const ZXING_URL = "https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js";       // barcode fallback (iPhone)
const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"; // reads dates from photos
const DATA_CACHE = "pantrypal-data";

/* ---------- storage ---------- */
function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch (e) { return fallback; }
}
function store(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { alert(t("Couldn't save. Your browser storage may be full or blocked.")); return false; }
}
let items = load(KEYS.items, []);
let history = load(KEYS.history, []);
let shopping = load(KEYS.shopping, []);
let barcodes = load(KEYS.barcodes, {});
let plan = load(KEYS.plan, []);
let cookedLog = load(KEYS.cooked, []);
let myRecipes = load(KEYS.mine, []);
let settings = Object.assign({
  assumeBasics: true, useSubs: true, lastLoc: "Fridge", diets: [], reminders: false, activeList: null,
  favorites: [], staples: [], lang: (navigator.language || "").toLowerCase().startsWith("es") ? "es" : "en",
  largeText: false, highContrast: false, onboarded: false, household: null, ratings: {}, usage: {},
  missingBasics: [], groupAisles: true, checkins: true, lastCheckin: null, prepProgress: {}, readAloud: false,
  prices: {}, hints: {}, kidFilter: false
}, load(KEYS.settings, {}));

/* Older versions stored amount as free text in "qty". */
items.forEach(i => {
  if (i.amount === undefined) {
    const m = String(i.qty || "").match(/^\s*(\d+(?:\.\d+)?)\s*(.*)$/);
    i.amount = m ? Number(m[1]) : null;
    i.unit = m ? m[2] : (i.qty || "");
    delete i.qty;
  }
});

function saveItems() { store(KEYS.items, items); syncForReminders(); }
const saveHistory = () => store(KEYS.history, history);
const saveShopping = () => store(KEYS.shopping, shopping);
const saveBarcodes = () => store(KEYS.barcodes, barcodes);
const saveSettings = () => store(KEYS.settings, settings);
const savePlan = () => store(KEYS.plan, plan);
const saveCooked = () => store(KEYS.cooked, cookedLog);
const saveMine = () => store(KEYS.mine, myRecipes);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- dates (local days, no timezone surprises) ---------- */
function toStr(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function parseDay(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
const todayStr = () => toStr(new Date());
function addDaysFrom(base, n) { const d = parseDay(base || todayStr()); d.setDate(d.getDate() + n); return toStr(d); }
function daysLeft(exp) {
  if (!exp) return null;
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  return Math.round((parseDay(exp) - t0) / 86400000);
}
const locale = () => LANG === "es" ? "es-US" : "en-US";
function prettyDate(s) { return s ? parseDay(s).toLocaleDateString(locale(), { month: "short", day: "numeric" }) : ""; }
function dayName(s) {
  const d = daysLeft(s);
  if (d === 0) return t("Today");
  if (d === 1) return t("Tomorrow");
  return parseDay(s).toLocaleDateString(locale(), { weekday: "long", month: "short", day: "numeric" });
}
/* A day inside a sentence: "today", "tomorrow", "on Monday, Nov 16" */
function dayRef(s) {
  const d = daysLeft(s);
  if (d === 0) return t("today");
  if (d === 1) return t("tomorrow");
  return t("on {day}", { day: parseDay(s).toLocaleDateString(locale(), { weekday: "long", month: "short", day: "numeric" }) });
}
function expiryLabel(d) {
  if (d === null) return { text: t("No date"), cls: "none" };
  if (d < 0) return { text: d === -1 ? t("Expired yesterday") : t("Expired {n} days ago", { n: -d }), cls: "expired" };
  if (d === 0) return { text: t("Today"), cls: "urgent" };
  if (d === 1) return { text: t("Tomorrow"), cls: "urgent" };
  return { text: t("{n} days", { n: d }), cls: d <= 3 ? "urgent" : d <= 7 ? "soon" : "ok" };
}
const shortLeft = d => d === null ? t("no date") : d === 0 ? t("today") : d === 1 ? t("tomorrow") : t("{n} days", { n: d });
const daySort = d => d === null ? 99999 : d;

/* ---------- amounts ---------- */
const fmtNum = n => String(Math.round(n * 100) / 100);
const hasAmount = i => typeof i.amount === "number" && !isNaN(i.amount);
function amountText(i) { return hasAmount(i) ? (fmtNum(i.amount) + " " + (i.unit || "")).trim() : (i.unit || ""); }
/* "3" -> 3, "1/2" -> 0.5, "1 1/2" -> 1.5, anything with a unit -> null */
function parseAmt(s) {
  s = String(s || "").trim();
  if (!/^(\d+(\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)$/.test(s)) return null;
  return s.split(/\s+/).reduce((tot, p) => tot + (p.includes("/") ? Number(p.split("/")[0]) / Number(p.split("/")[1]) : Number(p)), 0);
}
function fmtFrac(v) {
  if (v <= 0) return "0";
  const whole = Math.floor(v + 1e-9), fr = v - whole;
  const opts = [[0, ""], [0.125, "1/8"], [0.25, "1/4"], [1 / 3, "1/3"], [0.5, "1/2"], [2 / 3, "2/3"], [0.75, "3/4"], [1, ""]];
  let best = opts[0];
  for (const o of opts) if (Math.abs(fr - o[0]) < Math.abs(fr - best[0])) best = o;
  const w = whole + (best[0] === 1 ? 1 : 0);
  return w && best[1] ? `${w} ${best[1]}` : w ? String(w) : (best[1] || "1/8");
}
/* Scale the number at the start of an amount: "1 1/2 cups" x2 -> "3 cups" */
function scaleAmt(amt, f) {
  if (!amt || Math.abs(f - 1) < 1e-9) return amt;
  const m = amt.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(.*)$/);
  return m ? fmtFrac(parseAmt(m[1]) * f) + m[2] : amt;
}

/* ---------- name matching ---------- */
function singular(w) {
  if (w.length <= 3 || /(ss|us|is)$/.test(w)) return w;
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (/(oes|ches|shes|xes)$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}
/* Lowercase, drop accents and punctuation, singularize, and pad with spaces for whole-word matching. */
function norm(s) {
  const words = String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean).map(singular);
  return " " + words.join(" ") + " ";
}
const PHRASES = new Map();
const PARENT = new Map();
const BASIC_SET = new Set();
const canonCache = new Map();

function canon(name) {
  const n = norm(name);
  if (canonCache.has(n)) return canonCache.get(n);
  let best = "", bestLen = 0;
  for (const [p, k] of PHRASES) if (p.length > bestLen && n.includes(p)) { best = k; bestLen = p.length; }
  canonCache.set(n, best);
  return best;
}
function chain(k) {
  const out = [];
  while (k && !out.includes(k)) { out.push(k); k = PARENT.get(k); }
  return out;
}
function related(a, b) { return chain(a).includes(b) || chain(b).includes(a); }

/* ---------- diets ---------- */
const DIETS = {
  vegetarian: { label: "Vegetarian", ex: ["meat", "pork", "fish", "shellfish"], swap: { broth: "use vegetable broth" } },
  vegan: { label: "Vegan", ex: ["meat", "pork", "fish", "shellfish", "dairy", "egg", "honey"],
    swap: { broth: "use vegetable broth", milk: "use a plant milk", butter: "use oil or vegan butter",
      yogurt: "use a plant-based yogurt", cream: "use full-fat coconut milk", mayonnaise: "use vegan mayo", honey: "use maple syrup" } },
  nopork: { label: "No pork", ex: ["pork"], swap: { bacon: "use turkey bacon", sausage: "use chicken or turkey sausage", ham: "use turkey ham" } },
  glutenfree: { label: "Gluten-free", ex: ["gluten"],
    swap: { "soy sauce": "use tamari (gluten-free soy sauce)", pasta: "use gluten-free pasta", tortillas: "use corn tortillas",
      bread: "use gluten-free bread", flour: "use a 1-to-1 gluten-free flour blend", breadcrumbs: "use gluten-free breadcrumbs",
      oats: "use certified gluten-free oats" } },
  dairyfree: { label: "Dairy-free", ex: ["dairy"],
    swap: { milk: "use a plant milk", butter: "use oil or dairy-free butter", yogurt: "use a dairy-free yogurt", cream: "use full-fat coconut milk" } },
  eggfree: { label: "Egg-free", ex: ["egg"], swap: { mayonnaise: "use egg-free mayo" } },
  nutfree: { label: "Nut-free", ex: ["nut"], swap: {} },
  fishfree: { label: "No fish", ex: ["fish"], swap: {} },
  shellfishfree: { label: "No shellfish", ex: ["shellfish"], swap: {} }
};
const CARD_LABELS = ["vegan", "vegetarian", "glutenfree", "dairyfree"];
let ALLERGEN_SETS = {};

function dietCheck(g, diets) {
  let blocked = false;
  const swaps = [];
  for (const id of diets) {
    const d = DIETS[id];
    if (!d || !g.flags.some(f => d.ex.includes(f))) continue;
    const ch = chain(g.key);
    const k = Object.keys(d.swap).find(s => ch.includes(norm(s)));
    if (k) swaps.push(d.swap[k]); else blocked = true;
  }
  return { blocked, swaps: [...new Set(swaps)] };
}
const recipeAllowed = (r, diets) => !diets.length || r.ingredients.every(g => g.opt || !dietCheck(g, diets).blocked);
const strictlyFits = (r, id) => r.ingredients.every(g => g.opt || !g.flags.some(f => DIETS[id].ex.includes(f)));

/* ---------- build lookup tables from recipe data ---------- */
let SUBS_PREP = [];
const PROTEIN_GROUPS = [["seafood", ["shrimp", "salmon", "fish", "tuna"]], ["chicken", ["chicken"]], ["beef", ["ground beef", "beef", "steak", "stew meat"]],
  ["pork", ["pork", "bacon", "ham", "sausage"]], ["tofu", ["tofu"]], ["beans", ["black bean", "kidney bean", "chickpea", "lentil"]], ["eggs", ["egg"]]];
/* Basics count as on hand unless the pantry audit said otherwise. */
function basicHave(g) { return settings.assumeBasics && !(settings.missingBasics || []).includes(g.key.trim()); }

function addPhrase(name) { const n = norm(name); if (!PHRASES.has(n)) PHRASES.set(n, n); }

function prepareRecipe(r) {
  r.ingredients = r.ing.map(s => {
    const [amt, name, flag] = s.split("|");
    return { amt: (amt || "").trim(), name: (name || "").trim(), opt: flag === "o" };
  }).filter(g => g.name);
  for (const g of r.ingredients) {
    g.key = canon(g.name) || norm(g.name);
    const ch = chain(g.key);
    g.basic = ch.some(k => BASIC_SET.has(k));
    g.flags = Object.keys(ALLERGEN_SETS).filter(cat => ALLERGEN_SETS[cat].some(k => ch.includes(k)));
  }
  if (!r.mine && !r.es && typeof CLASSICS_ES !== "undefined") r.es = CLASSICS_ES[r.name];
  r.serves = r.serves || SERVES[r.name] || 4;
  const pg = PROTEIN_GROUPS.find(([, keys]) => r.ingredients.some(g => !g.opt && keys.some(k => chain(g.key).includes(norm(k)))));
  r.protein = pg ? pg[0] : "veg";
  r.labels = CARD_LABELS.filter(id => strictlyFits(r, id));
  if (r.labels.includes("vegan")) r.labels = r.labels.filter(l => l !== "vegetarian");
  r.search = [r.name, r.es ? r.es.name : "", r.type, t(r.type),
    ...r.ingredients.map(g => g.name + " " + (ING_ES[g.name.toLowerCase()] || ""))].join(" ")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function buildMatcher() {
  for (const r of RECIPES) r.ing.forEach(s => addPhrase((s.split("|")[1] || "").trim()));
  for (const b of BASICS) { addPhrase(b); BASIC_SET.add(norm(b)); }
  for (const [child, parent] of Object.entries(PARENTS)) {
    PHRASES.set(norm(child), norm(child)); addPhrase(parent); PARENT.set(norm(child), norm(parent));
  }
  for (const [alias, target] of Object.entries(ALIASES)) PHRASES.set(norm(alias), norm(target));
  for (const [es, target] of Object.entries(ES_ALIASES)) {
    PHRASES.set(norm(es), target ? (PHRASES.get(norm(target)) || norm(target)) : "");
  }
  for (const ig of IGNORE) PHRASES.set(norm(ig), "");
  SUBS.forEach(s => [s.need, ...s.use].forEach(addPhrase));
  for (const [cat, list] of Object.entries(ALLERGENS)) ALLERGEN_SETS[cat] = list.map(norm);
  SUBS_PREP = SUBS.map(s => ({ ...s, needKey: canon(s.need), useKeys: s.use.map(canon) }));
  canonCache.clear();
  RECIPES.forEach(prepareRecipe);
}

/* Your own recipes live alongside the built-in ones. */
function mineToRecipe(m) { return { ...m, mine: true }; }
function addMineToRecipes(m) {
  m.ing.forEach(s => addPhrase((s.split("|")[1] || "").trim()));
  canonCache.clear();
  const r = mineToRecipe(m);
  prepareRecipe(r);
  RECIPES.push(r);
  return r;
}
const recipeByName = n => RECIPES.find(r => r.name === n);

/* ---------- language helpers for recipes ---------- */
const rName = r => (LANG === "es" && r.es && r.es.name) || r.name;
const rSteps = r => (LANG === "es" && r.es && r.es.steps) || r.steps;
function ingName(g, r) {
  return LANG === "es" && !(r && r.mine) ? (ING_ES[g.name.toLowerCase()] || g.name) : g.name;
}
/* Returns [translatedAmount, needsDe, sizeWord] */
function amtParts(amt) {
  if (LANG !== "es" || !amt) return [amt, false, ""];
  let size = "", unit = false;
  const a = amt.replace(/[A-Za-z]+/g, w => {
    const lw = w.toLowerCase();
    if (SIZE_ES[lw]) { size = SIZE_ES[lw]; return ""; }
    if (UNIT_ES[lw]) { unit = true; return UNIT_ES[lw]; }
    return w;
  }).replace(/\s+/g, " ").trim();
  return [a, unit || /^\d+\/\d+$/.test(a), size];
}
function ingLabel(g, f, r) {
  const amt = scaleAmt(g.amt, f);
  if (LANG !== "es" || (r && r.mine)) return [amt, g.name].filter(Boolean).join(" ");
  const name = ingName(g, r);
  if (!amt) return name;
  const [a, de, size] = amtParts(amt);
  return `${a} ${de ? "de " : ""}${name}${size ? " " + size : ""}`;
}
const amtDisplay = (amt, f) => amtParts(scaleAmt(amt, f))[0];

/* ---------- shelf-life estimates (days): [fridge, pantry/counter, freezer] ---------- */
const SHELF_LIFE = {
  "milk": [7, null, 90], "egg": [28, null, null], "butter": [60, null, 270], "cheese": [21, null, 180],
  "cream cheese": [14, null, null], "yogurt": [14, null, 60], "sour cream": [14, null, null], "cream": [7, null, null],
  "chicken": [2, null, 270], "ground beef": [2, null, 120], "beef": [4, null, 180], "steak": [4, null, 180],
  "pork": [4, null, 180], "bacon": [7, null, 30], "ham": [5, null, 60], "sausage": [2, null, 60],
  "turkey": [2, null, 270], "fish": [2, null, 180], "salmon": [2, null, 180], "shrimp": [2, null, 180],
  "deli meat": [5, null, 60], "lunch meat": [5, null, 60], "tofu": [7, null, 150], "hummus": [7, null, null],
  "lettuce": [7, null, null], "spinach": [5, null, 240], "kale": [7, null, 240], "bell pepper": [10, null, 240],
  "broccoli": [5, null, 300], "cauliflower": [7, null, 300], "carrot": [21, null, 300], "celery": [14, null, null],
  "cucumber": [7, null, null], "tomato": [7, 5, null], "mushroom": [6, null, null], "zucchini": [5, null, null],
  "asparagus": [4, null, null], "green bean": [6, null, 240], "cabbage": [21, null, null], "corn": [3, null, 240],
  "onion": [30, 30, null], "garlic": [null, 90, null], "potato": [null, 30, null], "sweet potato": [null, 21, null],
  "avocado": [4, 4, null], "apple": [30, 7, null], "banana": [7, 5, 90], "berry": [5, null, 300],
  "strawberry": [5, null, 300], "blueberry": [7, null, 300], "raspberry": [3, null, 300], "grape": [10, null, 300],
  "lemon": [21, 7, null], "lime": [21, 7, null], "orange": [21, 7, null], "peach": [5, 3, 240],
  "mango": [5, 4, 240], "pineapple": [5, 2, 240], "cilantro": [7, null, null], "parsley": [7, null, null],
  "basil": [5, null, null], "bread": [7, 5, 90], "tortilla": [21, 7, 180], "juice": [7, null, null],
  "salsa": [14, null, null], "leftover": [4, null, 90], "tomato sauce": [7, 365, null], "broth": [5, 365, null],
  "black bean": [null, 730, null], "kidney bean": [null, 730, null], "chickpea": [null, 730, null], "mayonnaise": [60, null, null], "cooked rice": [4, null, 180],
  "rice": [null, 730, null], "pasta": [null, 730, null], "flour": [null, 365, null], "oat": [null, 365, null],
  "canned": [null, 730, null], "can": [null, 730, null], "cereal": [null, 180, null]
};
function shelfDirect(n) {
  let best = null, bestLen = 0;
  for (const k of Object.keys(SHELF_LIFE)) {
    const p = norm(k);
    if (p.length > bestLen && n.includes(p)) { best = k; bestLen = p.length; }
  }
  return best;
}
/* Works for English names, synonyms, and Spanish names. */
function shelfLookup(name) {
  for (const k of chain(canon(name))) { const hit = shelfDirect(k); if (hit) return hit; }
  return shelfDirect(norm(name));
}
function locIndex(loc) {
  const l = (loc || "").toLowerCase();
  if (l.includes("freez")) return 2;
  if (l.includes("fridge") || l.includes("refrig")) return 0;
  return 1;
}
function estimateShelf(name, loc) {
  const key = shelfLookup(name);
  if (!key) return null;
  const life = SHELF_LIFE[key], idx = locIndex(loc);
  if (life[idx] != null) return { days: life[idx], note: "" };
  if (idx === 2) return { days: 90, note: t("General freezer estimate.") };
  if (idx === 1 && life[0] != null) return { days: life[0], note: t("This one usually belongs in the fridge.") };
  if (idx === 0 && life[1] != null) return { days: life[1], note: t("This one keeps fine outside the fridge.") };
  return null;
}
function guessLoc(name) {
  const key = shelfLookup(name);
  return key && SHELF_LIFE[key][0] != null ? "Fridge" : "Pantry";
}
const locLabel = l => DEFAULT_LOCATIONS.includes(l) ? t(l) : l;
function locFromInput(v) {
  v = (v || "").trim();
  const hit = DEFAULT_LOCATIONS.find(l => l.toLowerCase() === v.toLowerCase() || t(l).toLowerCase() === v.toLowerCase());
  return hit || v || "Other";
}
const isStaple = name => settings.staples.includes(norm(name));

/* ---------- recipe scoring ---------- */
function urgencyWeight(d) {
  if (d === null) return 0.3;
  if (d <= 0) return 10;
  if (d === 1) return 8;
  if (d <= 3) return 6;
  if (d <= 7) return 3;
  if (d <= 14) return 1.5;
  return 0.5;
}
/* Food that recipes can use: not expired, not used up, not leftovers. */
function basePool() {
  return items
    .filter(i => !i.leftover && (!hasAmount(i) || i.amount > 0))
    .map(makeEntry)
    .filter(p => p.key && (p.d === null || p.d >= 0));
}
function bestMatch(pool, key) {
  const a = allocate(pool, key, null);
  return a ? a.allocs[0].p : null;
}
function findSub(g, pool, onDate) {
  for (const s of SUBS_PREP) {
    if (!s.needKey || !related(s.needKey, g.key)) continue;
    for (const uk of s.useKeys) {
      const a = allocate(pool, uk, null, onDate);
      if (a) return { sub: s, item: a.allocs[0].p.item, d: a.allocs[0].p.d, alloc: null };
      if (settings.assumeBasics && chain(uk).some(k => BASIC_SET.has(k)) && !(settings.missingBasics || []).includes(uk.trim())) return { sub: s, item: null, d: null };
    }
  }
  return null;
}
function evaluate(r, pool, diets, f, onDate) {
  f = f || 1;
  let urgency = 0, required = 0, haveReq = 0;
  const have = [], missing = [], subbed = [], short = [];
  for (const g of r.ingredients) {
    if (g.opt && diets.length && dietCheck(g, diets).blocked) continue;
    if (!g.opt) required++;
    const a = allocate(pool, g.key, ingGrams(g, f), onDate);
    let s;
    if (a) {
      const p0 = a.allocs[0].p;
      const enough = a.enough || g.basic;
      have.push({ g, item: p0.item, d: p0.d, alloc: a, enough });
      if (!enough && !g.opt) short.push({ g, need: a.need, got: a.got });
      if (!g.opt) haveReq += enough ? 1 : Math.max(0.3, a.got / a.need);
      if (!g.basic) { const w = urgencyWeight(p0.d); urgency += (g.opt ? w / 2 : w) * (enough ? 1 : 0.6); }
    } else if (g.basic && basicHave(g)) {
      if (!g.opt) haveReq++;
    } else if (!g.opt && settings.useSubs && (s = findSub(g, pool, onDate))) {
      subbed.push({ g, ...s });
      haveReq += 0.8;
      if (s.item) urgency += urgencyWeight(s.d) * 0.8;
    } else if (!g.opt) {
      missing.push(g);
    }
  }
  const coverage = required ? haveReq / required : 1;
  return { recipe: r, f, have, missing, subbed, short, haveReq, required, urgency,
    score: urgency * 3 + coverage * 10 - missing.length * 4 - short.length * 1.5 };
}

/* Meal plan: set aside food for planned meals, in date order. */
function planReservations(keep) {
  const pool = basePool();
  const evs = new Map();
  const meals = plan.filter(m => !m.fromId && !m.prepped && (!keep || keep(m)))
    .sort((a, b) => (a.cookOn || a.date).localeCompare(b.cookOn || b.date));
  for (const m of meals) {
    const r = recipeByName(m.recipe);
    if (!r) continue;
    const ev = evaluate(r, pool, settings.diets, m.servings / r.serves, m.cookOn || m.date);
    evs.set(m.id, ev);
    ev.have.forEach(h => commitAlloc(h.alloc));
  }
  return { pool, evs };
}
function availablePool(res) {
  return (res || planReservations()).pool.filter(p => !(p.remG <= 0));
}

/* ---------- small UI helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tn = (n, one, many, v) => t(n === 1 ? one : many, Object.assign({ n }, v || {}));

let toastTimer = null;
function toast(msg, undoSnap) {
  const el = $("#toast");
  el.innerHTML = `<span>${esc(msg)}</span>` + (undoSnap ? `<button id="undoBtn">${esc(t("Undo"))}</button>` : "");
  el.classList.add("show");
  if (undoSnap) $("#undoBtn").onclick = () => { restore(undoSnap); el.classList.remove("show"); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 6000);
}
const snapshot = () => JSON.stringify({ items, history, shopping, plan, cookedLog });
function restore(s) {
  const o = JSON.parse(s);
  ({ items, history, shopping, plan, cookedLog } = o);
  saveItems(); saveHistory(); saveShopping(); savePlan(); saveCooked(); renderAll();
}
function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}
function setPressed(groupSel, btn) {
  $$(groupSel + " button").forEach(x => { x.classList.toggle("on", x === btn); x.setAttribute("aria-pressed", x === btn); });
}
function segment(id, attr, onPick) {
  $(id).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    setPressed(id, b);
    onPick(b.dataset[attr]);
  });
}

/* ---------- shopping list helpers ---------- */
function currentList() { return shopping.find(l => l.id === settings.activeList) || shopping[0] || null; }
function addToList(list, name, amt, from) {
  const existing = list.items.find(x => !x.done && norm(x.name) === norm(name));
  if (existing) {
    if (from && !existing.from.includes(from)) existing.from.push(from);
    return false;
  }
  list.items.push({ id: uid(), name, amt: amt || "", done: false, from: from ? [from] : [] });
  return true;
}
function stapleList() {
  let list = currentList();
  if (!list) { list = { id: uid(), name: t("Groceries"), items: [] }; shopping.push(list); settings.activeList = list.id; saveSettings(); }
  return list;
}

/* ---------- removing food (feeds Waste Less and staples) ---------- */
let stapleNotes = [];
function removeItem(item, outcome) {
  items = items.filter(i => i.id !== item.id);
  if (outcome === "used" && item.bought && !item.leftover) learnUsage(item);
  if (outcome === "used") { settings.lastWin = Date.now(); saveSettings(); }
  if (outcome === "used" || outcome === "wasted") {
    if (!item.leftover) history.push({ name: item.name, date: todayStr(), outcome, d: daysLeft(item.expires) });
    saveHistory();
    if (item.staple) {
      const list = stapleList();
      if (addToList(list, item.name, "", t("restock"))) stapleNotes.push({ name: item.name, list: list.name });
      saveShopping();
    }
  }
  saveItems();
}
function stapleSuffix() {
  if (!stapleNotes.length) return "";
  const s = " " + t("Added {items} to {list}.", { items: stapleNotes.map(x => x.name).join(", "), list: stapleNotes[0].list });
  stapleNotes = [];
  return s;
}

let pendingRemove = null;
function askRemove(item) {
  pendingRemove = item;
  $("#removeTitle").textContent = t("What happened to {name}?", { name: item.name });
  $("#removeDialog").showModal();
}
function finishRemove(outcome) {
  $("#removeDialog").close();
  if (!pendingRemove || outcome === "cancel") { pendingRemove = null; return; }
  const snap = snapshot(), it = pendingRemove;
  removeItem(it, outcome === "none" ? null : outcome);
  toast((outcome === "wasted" ? t("Logged {name} as tossed.", { name: it.name }) : t("Removed {name}.", { name: it.name })) + stapleSuffix(), snap);
  pendingRemove = null;
  renderAll();
}
function useOne(id) {
  const it = items.find(i => i.id === id);
  if (!it || !hasAmount(it)) return;
  const snap = snapshot();
  it.amount = Math.max(0, it.amount - 1);
  if (it.amount <= 0.0001) { removeItem(it, "used"); toast(t("Used up {name}.", { name: it.name }) + stapleSuffix(), snap); }
  else { saveItems(); toast(t("{name}: {left} left", { name: it.name, left: amountText(it) }), snap); }
  renderAll();
}
function tossExpired() {
  const expired = items.filter(i => { const d = daysLeft(i.expires); return d !== null && d < 0; });
  if (!expired.length || !confirm(tn(expired.length, "Log 1 expired item as thrown out and remove it?", "Log {n} expired items as thrown out and remove them?"))) return;
  const snap = snapshot();
  expired.forEach(i => removeItem(i, "wasted"));
  toast(tn(expired.length, "Removed 1 expired item.", "Removed {n} expired items.") + stapleSuffix(), snap);
  renderAll();
}

/* ---------- MY FOOD ---------- */
let locFilter = "All";
let editingId = null;

function allLocations() {
  const set = new Set(DEFAULT_LOCATIONS);
  items.forEach(i => i.location && set.add(i.location));
  return [...set];
}
function renderAlerts() {
  const expired = items.filter(i => { const d = daysLeft(i.expires); return d !== null && d < 0; }).length;
  const soon = items.filter(i => { const d = daysLeft(i.expires); return d !== null && d >= 0 && d <= 3; }).length;
  let html = "";
  if (soon) html += `<div class="alert urgent"><span>&#9200; ${esc(tn(soon, "1 item expires within 3 days", "{n} items expire within 3 days"))}</span><button data-go="recipes">${esc(t("Use them"))}</button></div>`;
  if (expired) html += `<div class="alert expired"><span>${esc(tn(expired, "1 item is past its date and left out of recipe picks.", "{n} items are past their date and left out of recipe picks."))}</span><button data-toss="1">${esc(t("Toss"))}</button></div>`;
  $("#alerts").innerHTML = palFoodHtml() + checkinHtml();
}
function renderPantry() {
  renderAlerts();
  const locs = allLocations();
  if (locFilter !== "All" && !locs.includes(locFilter)) locFilter = "All";
  $("#locFilter").innerHTML = ["All", ...locs].map(l => {
    const n = l === "All" ? items.length : items.filter(i => i.location === l).length;
    return `<button class="chip ${l === locFilter ? "on" : ""}" aria-pressed="${l === locFilter}" data-loc="${esc(l)}">${esc(l === "All" ? t("All") : locLabel(l))} <small>${n}</small></button>`;
  }).join("");

  const q = norm($("#pantrySearch").value).trim();
  const list = items
    .filter(i => (locFilter === "All" || i.location === locFilter) && (!q || norm(i.name).includes(q)))
    .sort((a, b) => daySort(daysLeft(a.expires)) - daySort(daysLeft(b.expires)) || a.name.localeCompare(b.name));

  $("#itemList").innerHTML = list.map(i => {
    const lab = expiryLabel(daysLeft(i.expires));
    const meta = [locLabel(i.location), amountText(i), i.bought ? t("bought {date}", { date: prettyDate(i.bought) }) : ""]
      .filter(Boolean).map(m => `<span>${esc(m)}</span>`).join("");
    const tags = (i.staple ? `<span class="mini-tag">${esc(t("staple"))}</span>` : "") + (i.leftover ? `<span class="mini-tag">${esc(t("leftovers"))}</span>` : "");
    const minus = hasAmount(i) ? `<button class="row-btn" data-minus="${i.id}" aria-label="${esc(t("Use one {name}", { name: i.name }))}">-1</button>` : "";
    return `<li class="item ${lab.cls}" data-id="${i.id}" role="button" tabindex="0" aria-label="${esc(i.name + ", " + lab.text)}">
      <span class="food-emoji" aria-hidden="true">${foodEmoji(i.name, i)}</span>
      <div class="item-main"><strong>${esc(i.name)} ${tags}</strong><span class="meta">${meta}</span></div>
      <span class="badge ${lab.cls}">${esc(lab.text)}</span>${minus}</li>`;
  }).join("");
  $("#emptyPantry").classList.add("hidden");
}

function fillDatalists() {
  const names = LANG === "es"
    ? new Set([...Object.values(ING_ES), ...items.map(i => i.name)])
    : new Set([...Object.keys(SHELF_LIFE).filter(k => k.length > 3), ...items.map(i => i.name)]);
  $("#nameSuggestions").innerHTML = [...names].sort().map(n => `<option value="${esc(n)}">`).join("");
  $("#locations").innerHTML = allLocations().map(l => `<option value="${esc(locLabel(l))}">`).join("");
  const units = LANG === "es"
    ? ["huevos", "lb", "oz", "kg", "tazas", "latas", "bolsas", "cajas", "botellas", "piezas", "rebanadas", "manojos", "galones", "paquetes", "porciones"]
    : ["eggs", "lbs", "oz", "cups", "cans", "bags", "boxes", "bottles", "pieces", "slices", "bunches", "gallons", "packs", "servings"];
  $("#units").innerHTML = units.map(u => `<option value="${u}">`).join("");
}

function openItem(id, prefill) {
  editingId = id || null;
  const it = id ? items.find(i => i.id === id) : null;
  const src = it || prefill || {};
  $("#itemDialogTitle").textContent = it ? t("Edit item") : t("Add item");
  $("#fName").value = src.name || "";
  $("#fAmount").value = hasAmount(src) ? src.amount : "";
  $("#fUnit").value = src.unit || "";
  $("#fLoc").value = locLabel(src.location || settings.lastLoc);
  $("#fBought").value = it ? it.bought || "" : todayStr();
  $("#fExpires").value = src.expires || "";
  $("#fNotes").value = src.notes || "";
  $("#fBarcode").value = src.barcode || "";
  $("#fStaple").checked = it ? !!it.staple : isStaple(src.name || "");
  $("#suggestNote").textContent = "";
  $("#scanNote").textContent = "";
  $("#usageNote").textContent = it ? usageText(it) : "";
  $("#remixBox").innerHTML = it && it.leftover ? remixHtml(it) : "";
  $("#deleteItem").classList.toggle("hidden", !it);
  $("#itemExtras").classList.toggle("hidden", !it);
  if (it) {
    const frozen = locIndex(it.location) === 2;
    $("#freezeBtn").innerHTML = frozen ? `<span aria-hidden="true">&#127777;</span> ${esc(t("Thaw"))}` : `<span aria-hidden="true">&#10052;</span> ${esc(t("Freeze it"))}`;
    $("#itemReminder").classList.toggle("hidden", !(it.expires && daysLeft(it.expires) >= 1));
    $("#useThisBtn").classList.toggle("hidden", !!it.leftover || !canon(it.name));
  }
  fillDatalists();
  if (!$("#itemDialog").open) $("#itemDialog").showModal();
}

function suggestExpiry(quiet) {
  const name = $("#fName").value.trim();
  const note = $("#suggestNote");
  if (!name) { if (!quiet) note.textContent = t("Type a name first."); return; }
  const est = estimateShelf(name, locFromInput($("#fLoc").value));
  if (!est) { if (!quiet) note.textContent = t("No estimate for that one. Check the package date."); return; }
  $("#fExpires").value = addDaysFrom($("#fBought").value, est.days);
  note.textContent = t("About {n} days.", { n: est.days }) + (est.note ? " " + est.note : "") + " " + t("This is only an estimate, so trust the package date and your senses.");
}

function saveItem(e) {
  e.preventDefault();
  const name = $("#fName").value.trim();
  if (!name) return;
  const amtRaw = $("#fAmount").value;
  const data = {
    name,
    amount: amtRaw === "" ? null : Math.max(0, Number(amtRaw)),
    unit: $("#fUnit").value.trim(),
    location: locFromInput($("#fLoc").value),
    bought: $("#fBought").value,
    expires: $("#fExpires").value,
    notes: $("#fNotes").value.trim(),
    barcode: $("#fBarcode").value,
    staple: $("#fStaple").checked
  };
  if (editingId) Object.assign(items.find(i => i.id === editingId), data);
  else items.push(Object.assign({ id: uid(), added: todayStr() }, data));
  const key = norm(name);
  settings.staples = settings.staples.filter(s => s !== key);
  if (data.staple) settings.staples.push(key);
  if (data.barcode) { barcodes[data.barcode] = { name, unit: data.unit, location: data.location }; saveBarcodes(); }
  settings.lastLoc = data.location;
  saveItems(); saveSettings();
  $("#itemDialog").close();
  renderAll();
}

function freezeOrThaw() {
  const it = items.find(i => i.id === editingId);
  if (!it) return;
  const snap = snapshot();
  if (locIndex(it.location) === 2) {
    it.location = "Fridge";
    it.expires = addDaysFrom(todayStr(), 2);
    toast(t("Moved {name} to the fridge. Thawed food keeps about 1 to 2 days, so use it soon.", { name: it.name }), snap);
  } else {
    const est = estimateShelf(it.name, "Freezer");
    const days = est ? est.days : 90;
    it.location = "Freezer";
    it.expires = addDaysFrom(todayStr(), days);
    toast(t("Froze {name}. Good for about {n} more days.", { name: it.name, n: days }), snap);
  }
  saveItems();
  $("#itemDialog").close();
  renderAll();
}

/* ---------- quick add ---------- */
const QA_UNITS = "lbs?|pounds?|oz|ounces?|kg|kilos?|g|grams?|cups?|cans?|bags?|boxes|box|bottles?|packs?|packages?|bunch(?:es)?|heads?|loaf|loaves|dozen|gallons?|gal|liters?|litros?|ml|pieces?|slices?|cartons?|jars?|latas?|bolsas?|cajas?|botellas?|paquetes?|piezas?|docenas?|manojos?|frascos?|rebanadas?";
const QA_RE = new RegExp(`^(\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:[.,]\\d+)?)\\s*(?:(${QA_UNITS})\\.?\\s+(?:of\\s+|de\\s+)?)?(.+)$`, "i");
function parseQuick(text) {
  return text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean).map(s => {
    let amount = null, unit = "", name = s;
    const m = s.match(QA_RE);
    if (m) {
      amount = parseAmt(m[1].replace(",", ".")) ?? Number(m[1].replace(",", "."));
      unit = m[2] || "";
      name = m[3].trim();
      if (/^(dozen|docenas?)$/i.test(unit)) { amount *= 12; unit = ""; }
    }
    name = name.charAt(0).toUpperCase() + name.slice(1);
    const frozen = /\bfrozen\b|\bcongelad[oa]s?\b/i.test(name);
    const location = frozen ? "Freezer" : guessLoc(name);
    const est = estimateShelf(name, location);
    return { name, amount, unit, location, expires: est ? addDaysFrom(todayStr(), est.days) : "" };
  });
}
function renderQuickPreview() {
  const list = parseQuick($("#quickText").value);
  $("#quickPreview").innerHTML = list.map(x =>
    `<li><strong>${esc(x.name)}</strong> <span class="muted small">${esc([amountText(x), locLabel(x.location), x.expires ? t("expires {date}", { date: prettyDate(x.expires) }) : t("no date")].filter(Boolean).join(" · "))}</span></li>`).join("");
  $("#confirmQuick").textContent = list.length ? tn(list.length, "Add 1 item", "Add {n} items") : t("Add");
  $("#confirmQuick").disabled = !list.length;
}
function confirmQuick() {
  const list = parseQuick($("#quickText").value);
  if (!list.length) return;
  const snap = snapshot();
  list.forEach(x => items.push({ id: uid(), added: todayStr(), bought: todayStr(), notes: "", barcode: "", staple: isStaple(x.name), ...x }));
  saveItems();
  $("#quickDialog").close();
  renderAll();
  toast(tn(list.length, "Added 1 item with an estimated date.", "Added {n} items with estimated dates."), snap);
}

/* ---------- barcode scanner ---------- */
let scanStream = null, scanTimer = null, zxingReader = null, scanDone = false;
const scanStatus = s => { $("#scanStatus").textContent = s; };

async function openScanner() {
  scanDone = false;
  $("#manualCode").value = "";
  $("#scanDialog").showModal();
  const video = $("#scanVideo");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    scanStatus(t("The camera isn't available here (it needs https). Type the barcode number instead."));
    return;
  }
  scanStatus(t("Starting camera..."));
  try {
    let formats = [];
    if ("BarcodeDetector" in window) { try { formats = await BarcodeDetector.getSupportedFormats(); } catch (e) { formats = []; } }
    const wanted = formats.filter(f => ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"].includes(f));
    if (wanted.length) {
      const detector = new BarcodeDetector({ formats: wanted });
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = scanStream;
      await video.play();
      scanStatus(t("Point the camera at a barcode."));
      const tick = async () => {
        if (scanDone || !scanStream) return;
        try { const codes = await detector.detect(video); if (codes.length) return gotCode(codes[0].rawValue); } catch (e) {}
        scanTimer = setTimeout(tick, 250);
      };
      tick();
    } else {
      scanStatus(t("Loading scanner..."));
      if (!window.ZXing) await loadScript(ZXING_URL);
      zxingReader = new ZXing.BrowserMultiFormatReader();
      scanStatus(t("Point the camera at a barcode."));
      zxingReader.decodeFromVideoDevice(null, video, res => { if (res && !scanDone) gotCode(res.getText()); });
    }
  } catch (e) {
    scanStatus(t("Couldn't start the scanner. Allow camera access, or type the barcode number below."));
  }
}
function stopScanner() {
  scanDone = true;
  clearTimeout(scanTimer);
  if (scanStream) { scanStream.getTracks().forEach(tr => tr.stop()); scanStream = null; }
  if (zxingReader) { try { zxingReader.reset(); } catch (e) {} zxingReader = null; }
  $("#scanVideo").srcObject = null;
}
function gotCode(code) {
  stopScanner();
  if ($("#scanDialog").open) $("#scanDialog").close();
  if (navigator.vibrate) navigator.vibrate(80);
  lookupBarcode(String(code).trim());
}
async function lookupBarcode(code) {
  if (!code) return;
  $("#fBarcode").value = code;
  const note = $("#scanNote");
  const fill = (name, unit, loc) => {
    $("#fName").value = name;
    if (unit && !$("#fUnit").value) $("#fUnit").value = unit;
    if (loc) $("#fLoc").value = locLabel(loc);
    $("#fStaple").checked = isStaple(name);
    if (!$("#fExpires").value) suggestExpiry(true);
  };
  const saved = barcodes[code];
  if (saved) { fill(saved.name, saved.unit, saved.location); note.textContent = t("Found in your saved barcodes."); return; }
  note.textContent = t("Barcode {code}: looking it up...", { code });
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_es,brands,quantity`);
    const data = await res.json();
    const p = data && data.product;
    const pname = p && ((LANG === "es" && p.product_name_es) || p.product_name);
    if (data.status === 1 && pname) {
      fill(pname, "", null);
      note.textContent = t("Found: {what}. Edit the name if you like.", { what: [p.brands, pname, p.quantity].filter(Boolean).join(", ") });
    } else {
      note.textContent = t("Barcode {code} isn't in the database. Type a name and it'll be remembered next time.", { code });
    }
  } catch (e) {
    note.textContent = t("Couldn't look up {code} (are you offline?). Type a name and it'll be remembered next time.", { code });
  }
}

/* ---------- reading an expiration date from a photo ---------- */
const MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12, ENE: 1, ABR: 4, AGO: 8, DIC: 12 };
function findExpiryDate(text, today) {
  const T = " " + String(text).toUpperCase().replace(/\|/g, "1") + " ";
  const now = today ? parseDay(today) : new Date(); now.setHours(0, 0, 0, 0);
  const cands = [];
  const add = (y, m, d, idx, raw) => {
    if (y == null) {
      y = now.getFullYear();
      if (new Date(y, m - 1, d) < new Date(now.getTime() - 30 * 86400000)) y++;
    }
    if (y < 100) y += 2000;
    if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return;
    const dt = new Date(y, m - 1, d);
    if (dt.getMonth() !== m - 1) return;
    const diff = (dt - now) / 86400000;
    if (diff < -60 || diff > 365 * 5) return;
    cands.push({ date: toStr(dt), idx, raw: raw.trim() });
  };
  const mon = "(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEPT?|OCT|NOV|DEC|ENE|ABR|AGO|DIC)[A-Z]*\\.?";
  const mo = s => MONTHS[s.slice(0, 3)];
  let m;
  const re1 = /\b(20\d{2})[\/\-. ](\d{1,2})[\/\-. ](\d{1,2})\b/g;
  while ((m = re1.exec(T))) add(+m[1], +m[2], +m[3], m.index, m[0]);
  const re2 = /\b(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{4}|\d{2})\b/g;
  while ((m = re2.exec(T))) { const a = +m[1], b = +m[2]; if (a > 12) add(+m[3], b, a, m.index, m[0]); else add(+m[3], a, b, m.index, m[0]); }
  const re3 = new RegExp(`\\b${mon}\\s*(\\d{1,2})(?:[,\\s]+(20\\d{2}|\\d{2}))?\\b`, "g");
  while ((m = re3.exec(T))) add(m[3] ? +m[3] : null, mo(m[1]), +m[2], m.index, m[0]);
  const re4 = new RegExp(`\\b(\\d{1,2})\\s*${mon}\\s*(20\\d{2}|\\d{2})?\\b`, "g");
  while ((m = re4.exec(T))) add(m[3] ? +m[3] : null, mo(m[2]), +m[1], m.index, m[0]);
  const re5 = new RegExp(`\\b(20\\d{2})\\s*${mon}\\s*(\\d{1,2})\\b`, "g");
  while ((m = re5.exec(T))) add(+m[1], mo(m[2]), +m[3], m.index, m[0]);
  if (!cands.length) return null;
  const kw = /(BEST|USE BY|USE|EXP|BB|SELL|ENJOY|CONSUMIR|CADUCA|CAD|VENCE|VENC|FECHA)/g;
  const kwPos = [];
  while ((m = kw.exec(T))) kwPos.push(m.index + m[0].length);
  const near = cands.filter(c => kwPos.some(p => c.idx >= p - 2 && c.idx - p <= 30));
  const pool = near.length ? near : cands;
  return pool.sort((a, b) => b.date.localeCompare(a.date))[0];
}
async function downscale(file, max) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}
async function readDateFromPhoto(file) {
  const note = $("#suggestNote");
  note.textContent = t("Reading the date... The first time takes a little longer.");
  try {
    if (!window.Tesseract) await loadScript(TESSERACT_URL);
    const img = await downscale(file, 1600);
    const worker = await Tesseract.createWorker("eng");
    const { data } = await worker.recognize(img);
    await worker.terminate();
    const found = findExpiryDate(data.text);
    if (found) {
      $("#fExpires").value = found.date;
      note.textContent = t("Read \"{raw}\" as {date}. Please double-check it.", { raw: found.raw, date: prettyDate(found.date) });
    } else {
      note.textContent = t("Couldn't find a date. Try a close, well-lit photo of just the date, or type it in.");
    }
  } catch (e) {
    note.textContent = t("Couldn't read the photo. This feature needs an internet connection.");
  }
}

/* ---------- RECIPES ---------- */
let recipeMode = "foryou";
let recipeResults = [];
let recipeLimit = PAGE_SIZE;
let openResult = null, openMealId = null, curServings = 4;
let focusItemId = null, planTarget = null;

function renderDietSummary() {
  const d = settings.diets.filter(id => DIETS[id]).map(id => t(DIETS[id].label));
  $("#dietSummary").textContent = d.length ? d.join(", ") : t("none");
}
function recentCooked() {
  const seen = new Map();
  for (let i = cookedLog.length - 1; i >= 0; i--) if (!seen.has(cookedLog[i].name)) seen.set(cookedLog[i].name, cookedLog[i].date);
  return seen;
}

function renderRecipes() {
  const q = $("#recipeSearch").value.trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const type = $("#typeFilter").value;
  const maxTime = Number($("#timeFilter").value);
  const diets = settings.diets;
  const pool = availablePool();
  const focus = focusItemId ? items.find(i => i.id === focusItemId) : null;
  if (focusItemId && !focus) focusItemId = null;
  const focusKey = focus ? canon(focus.name) : null;
  const recent = recentCooked();

  $$(".foryou-only").forEach(e => e.classList.toggle("hidden", recipeMode !== "foryou" || !!focus));
  $$(".browse-only").forEach(e => e.classList.toggle("hidden", recipeMode !== "browse"));
  $("#focusBanner").classList.toggle("hidden", !focus);
  if (focus) $("#focusBanner").innerHTML = `<span>${esc(t("Recipes that use {name}", { name: focus.name }))}</span><button data-clear="focus" aria-label="${esc(t("Show all recipes"))}">&times;</button>`;
  $("#planBanner").classList.toggle("hidden", !planTarget);
  if (planTarget) $("#planBanner").innerHTML = `<span>${esc(t("Pick a recipe for {day}", { day: dayName(planTarget) }))}</span><button data-clear="plan" aria-label="${esc(t("Stop planning"))}">&times;</button>`;

  const dk = dislikeKeys();
  let list = RECIPES.filter(r => (!type || r.type === type) && (!maxTime || r.time <= maxTime) && (!q || r.search.includes(q))
    && (recipeMode === "foryou" ? fitsProfile(r, dk) : (recipeAllowed(r, diets) && !hasDisliked(r, dk) && (!settings.household || equipOK(r, profile().equipment)))));
  if (focusKey) list = list.filter(r => r.ingredients.some(g => related(focusKey, g.key)));
  if (settings.kidFilter) list = list.filter(r => r.kid);
  if (recipeMode === "saved") list = list.filter(r => r.mine || settings.favorites.includes(r.name) || recent.has(r.name));
  let res = list.map(r => evaluate(r, pool, diets, householdServings(r) / r.serves));

  if (recipeMode === "foryou") {
    const maxMissing = focus || !items.length ? 99 : Number($("#missingFilter").value);
    res = res.filter(x => x.missing.length <= maxMissing).sort((a, b) => b.score - a.score || a.recipe.time - b.recipe.time);
  } else if (recipeMode === "saved") {
    const rank = r => (settings.favorites.includes(r.name) || r.mine) ? 0 : 1;
    res.sort((a, b) => rank(a.recipe) - rank(b.recipe) || (recent.get(b.recipe.name) || "").localeCompare(recent.get(a.recipe.name) || "") || rName(a.recipe).localeCompare(rName(b.recipe)));
  } else {
    const byName = (a, b) => rName(a.recipe).localeCompare(rName(b.recipe), locale());
    const sorters = {
      name: byName,
      time: (a, b) => a.recipe.time - b.recipe.time || byName(a, b),
      type: (a, b) => MEAL_TYPES.indexOf(a.recipe.type) - MEAL_TYPES.indexOf(b.recipe.type) || byName(a, b),
      have: (a, b) => (b.haveReq / b.required) - (a.haveReq / a.required) || byName(a, b),
      protein: (a, b) => nutritionOf(b.recipe).protein - nutritionOf(a.recipe).protein,
      calories: (a, b) => nutritionOf(a.recipe).cal - nutritionOf(b.recipe).cal,
      cost: (a, b) => costOf(a.recipe) - costOf(b.recipe)
    };
    res.sort(sorters[$("#sortSelect").value] || byName);
  }
  recipeResults = res;

  const shown = res.slice(0, recipeLimit);
  $("#recipeCount").textContent = recipeMode !== "foryou" ? tn(res.length, "1 recipe", "{n} recipes")
    : items.length ? tn(res.length, "1 recipe. The ones using food that expires soonest come first.", "{n} recipes. The ones using food that expires soonest come first.")
    : t("Showing quick, popular picks. Add your food any time and these become personal.");

  $("#recipeList").innerHTML = shown.map((x, idx) => {
    const r = x.recipe;
    let tags = "";
    if (recipeMode === "foryou") {
      const seen = new Set();
      tags += x.have.filter(h => !h.g.basic && h.d !== null && h.d <= 3 && !seen.has(h.item.id) && seen.add(h.item.id))
        .map(h => `<span class="tag urgent">${esc(h.item.name)}: ${esc(shortLeft(h.d))}</span>`).join("");
      if (items.length) {
        tags += x.missing.length
          ? `<span class="tag miss">${esc(t("Need:"))} ${x.missing.map(g => esc(ingName(g, r))).join(", ")}</span>`
          : `<span class="tag ok">${esc(t("You have everything"))}</span>`;
        if (x.short.length) tags += `<span class="tag miss">${esc(t("Low on:"))} ${x.short.map(s => esc(ingName(s.g, r))).join(", ")}</span>`;
      } else tags += `<span class="tag">${esc(t(r.type))}</span>` + (r.prep ? `<span class="tag diet">${esc(t("Good for meal prep"))}</span>` : "");
      if (x.subbed.length) tags += `<span class="tag">${esc(tn(x.subbed.length, "1 swap", "{n} swaps"))}</span>`;
    } else {
      if (settings.favorites.includes(r.name)) tags += `<span class="tag fav-tag">&#9733; ${esc(t("Favorite"))}</span>`;
      if (r.mine) tags += `<span class="tag fav-tag">${esc(t("My recipe"))}</span>`;
      if (recent.has(r.name)) tags += `<span class="tag">${esc(t("Made {date}", { date: prettyDate(recent.get(r.name)) }))}</span>`;
      tags += `<span class="tag">${esc(t(r.type))}</span>`;
      if (r.prep) tags += `<span class="tag">${esc(t("Meal prep"))}</span>`;
      tags += r.labels.map(l => `<span class="tag diet">${esc(t(DIETS[l].label))}</span>`).join("");
      if (items.length) tags += `<span class="tag have">${esc(t("You have {a} of {b}", { a: Math.floor(x.haveReq), b: x.required }))}</span>`;
      tags += `<span class="tag">${esc(t("{n} cal", { n: Math.round(nutritionOf(r).cal) }))}</span><span class="tag">${esc(fmtMoney(costOf(r)))}</span>`;
      if (r.kid) tags += `<span class="tag">${esc(t("Kid-friendly"))}</span>`;
    }
    return `<li class="recipe" data-idx="${idx}" role="button" tabindex="0">
      <div class="r-head"><strong><span class="r-emoji" aria-hidden="true">${recipeEmoji(r)}</span>${esc(rName(r))}</strong><span class="muted small">${t("{n} min", { n: r.time })}</span></div>
      <div class="r-tags">${tags}</div></li>`;
  }).join("") || `<p class="empty">${esc(recipeMode === "saved" ? t("Nothing saved yet. Tap the star on any recipe, or add your own.") : t("No recipes match. Try loosening the filters."))}</p>`;
  $("#moreRecipes").classList.toggle("hidden", res.length <= recipeLimit);
}

function openRecipe(x, mealId) {
  openMealId = mealId || null;
  const meal = mealId ? plan.find(m => m.id === mealId) : null;
  curServings = meal ? meal.servings : householdServings(x.recipe);
  openResult = meal ? x : evaluate(x.recipe, availablePool(), settings.diets, curServings / x.recipe.serves);
  renderRecipeDetail();
  ["#cookedPanel", "#planPanel"].forEach(s => $(s).classList.add("hidden"));
  $("#recipeDialog").showModal();
  $("#recipeDialog").scrollTop = 0;
  if (planTarget && !mealId) showPlanPanel();
}

function renderRecipeDetail() {
  const x = openResult, r = x.recipe, diets = settings.diets;
  const f = curServings / r.serves;
  const haveBy = new Map(x.have.map(h => [h.g, h]));
  const subBy = new Map(x.subbed.map(s => [s.g, s]));
  const fav = settings.favorites.includes(r.name);
  $("#recipeTitle").textContent = rName(r);
  $("#favBtn").innerHTML = fav ? "&#9733;" : "&#9734;";
  $("#favBtn").setAttribute("aria-pressed", fav);
  $("#favBtn").setAttribute("aria-label", fav ? t("Remove from favorites") : t("Add to favorites"));
  const labels = r.labels.map(l => t(DIETS[l].label)).join(", ");
  $("#recipeMeta").innerHTML = [recipeEmoji(r) + " " + t(r.type), t(r.cuisine), t("about {n} minutes", { n: r.time }) + (r.wait ? " " + (LANG === "es" ? r.waitEs : r.wait) : ""), labels,
    r.prep ? t("keeps {n} days", { n: r.keeps }) : "", r.freezes ? t("freezes well") : "", r.kid ? t("Kid-friendly") : ""].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("");
  renderRating();
  $("#recipeNutr").innerHTML = nutritionHtml(r);
  $("#servCount").textContent = curServings;

  const ingHtml = r.ingredients.map(g => {
    const h = haveBy.get(g), s = subBy.get(g);
    const dc = diets.length ? dietCheck(g, diets) : { blocked: false, swaps: [] };
    const label = esc(ingLabel(g, f, r));
    const swap = dc.swaps.length ? `<span class="swap">${esc(t("Diet swap:"))} ${esc(dc.swaps.map(t).join("; "))}</span>` : "";
    if (g.opt && dc.blocked) return `<li class="blocked">${label} <span class="small">(${esc(t("leave out for your diet"))})</span></li>`;
    if (h && !h.enough) return `<li class="short">${label} <span class="muted small">(${esc(t("you have some {name}, but not enough", { name: h.item.name }))})</span>${swap}</li>`;
    if (h) return `<li class="have">${label} <span class="muted small">(${esc(h.item.name)}, ${esc(shortLeft(h.d))})</span>${swap}</li>`;
    if (g.basic && settings.assumeBasics) return `<li class="basic">${label}${swap}</li>`;
    if (s) return `<li class="subbed">${label}<span class="swap">${esc(t("Substitute:"))} ${esc(LANG === "es" ? s.sub.es : s.sub.note)}${s.item ? " (" + esc(s.item.name) + ")" : ""}</span>${swap}</li>`;
    if (g.opt) return `<li class="optional">${label} <span class="small">(${esc(t("optional"))})</span>${swap}</li>`;
    return `<li class="missing">${label}${swap}</li>`;
  }).join("");
  const scaleNote = Math.abs(f - 1) > 1e-9 ? `<p class="muted small">${esc(t("Amounts are adjusted. Cooking times may change a little for bigger or smaller batches."))}</p>` : "";
  const esNote = LANG === "es" && !r.mine ? `<p class="muted small">${esc(t("Automatic translation."))}</p>` : "";
  const airNote = r.airfry && profile().equipment.includes("airfryer") ? `<p class="tip small">${esc(LANG === "es" ? r.airfryEs : r.airfry)}</p>` : "";
  $("#recipeBody").innerHTML = `
    <h3>${esc(t("Ingredients"))}</h3><ul class="ings">${ingHtml}</ul>${scaleNote}
    <h3>${esc(t("Steps"))}</h3><ol class="steps">${rSteps(r).map(s => `<li>${esc(s)}</li>`).join("")}</ol>${airNote}${esNote}`;
  const meal = openMealId ? plan.find(m => m.id === openMealId) : null;
  const eatOnly = meal && (meal.prepped || meal.fromId);
  $("#cookedBtn").classList.toggle("hidden", !!eatOnly);
  $("#ateBtn").classList.toggle("hidden", !eatOnly);
  $("#editMineBtn").classList.toggle("hidden", !r.mine);
  $("#deleteMineBtn").classList.toggle("hidden", !r.mine);
  $("#planBtn").querySelector("[data-t]").textContent = openMealId ? t("Remove from plan") : t("Plan");
}

function changeServings(delta) {
  curServings = Math.max(1, Math.min(50, curServings + delta));
  const r = openResult.recipe;
  const pool = openMealId ? availablePool(planReservations(m => m.id !== openMealId)) : availablePool();
  openResult = evaluate(r, pool, settings.diets, curServings / r.serves);
  renderRecipeDetail();
  if (!$("#cookedPanel").classList.contains("hidden")) showCookedPanel();
}
function toggleFavorite() {
  const n = openResult.recipe.name;
  settings.favorites = settings.favorites.includes(n) ? settings.favorites.filter(x => x !== n) : [...settings.favorites, n];
  saveSettings();
  renderRecipeDetail();
  if ($("#tab-recipes").classList.contains("active")) renderRecipes();
}

/* "I made this": subtract amounts, log it, save leftovers */
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
function openListPicker(entries, title) {
  pickEntries = entries;
  $("#listPickTitle").textContent = title || t("Add to a shopping list");
  $("#shopPick").innerHTML = entries.map((e, i) =>
    `<label class="cooked-row"><input type="checkbox" data-pi="${i}" ${e.checked ? "checked" : ""}>
      ${esc([e.amt, e.name].filter(Boolean).join(" "))}${e.note ? ` <span class="muted small">(${esc(e.note)})</span>` : ""}</label>`).join("")
    || `<p class="muted small">${esc(t("Nothing to add."))}</p>`;
  const sel = $("#shopListPick");
  sel.innerHTML = shopping.map(l => `<option value="${l.id}" ${l.id === settings.activeList ? "selected" : ""}>${esc(l.name)}</option>`).join("")
    + `<option value="__new" ${shopping.length ? "" : "selected"}>${esc(t("New list..."))}</option>`;
  $("#shopNewName").classList.toggle("hidden", sel.value !== "__new");
  $("#listPickDialog").showModal();
}
function confirmPick() {
  const picks = $$("#shopPick input:checked").map(c => pickEntries[Number(c.dataset.pi)]);
  if (!picks.length) { toast(t("Pick at least one item.")); return; }
  let list;
  if ($("#shopListPick").value === "__new") {
    list = { id: uid(), name: $("#shopNewName").value.trim() || t("Shopping list"), items: [] };
    shopping.push(list);
  } else list = shopping.find(l => l.id === $("#shopListPick").value);
  let added = 0;
  picks.forEach(e => {
    const froms = e.from.length ? e.from : [""];
    if (addToList(list, e.name, e.amt, froms[0])) added++;
    froms.slice(1).forEach(fr => addToList(list, e.name, e.amt, fr));
  });
  settings.activeList = list.id;
  saveShopping(); saveSettings();
  $("#listPickDialog").close();
  toast(added ? tn(added, "Added 1 item to {list}.", "Added {n} items to {list}.", { list: list.name }) : t("Those are already on {list}.", { list: list.name }));
  renderAll();
}
function shopFromRecipe() {
  const x = openResult, r = x.recipe, diets = settings.diets, f = curServings / r.serves;
  const haveMap = new Map(x.have.map(h => [h.g, h])), subSet = new Set(x.subbed.map(s => s.g));
  const shortMap = new Map(x.short.map(s => [s.g, s]));
  const entries = r.ingredients.filter(g => !(g.opt && diets.length && dietCheck(g, diets).blocked)).map(g => {
    const isMissing = x.missing.includes(g), sh = shortMap.get(g);
    let amt = amtDisplay(g.amt, f), note = "";
    if (sh) { const fr = sh.need ? (sh.need - sh.got) / sh.need : 1; amt = LANG === "es" ? amtParts(shortAmount(g.amt, f, fr))[0] : shortAmount(g.amt, f, fr); note = t("you have some, not enough"); }
    else if (!isMissing) note = haveMap.has(g) ? t("you have it") : subSet.has(g) ? t("substitute available") : g.basic ? t("basic") : t("optional");
    return { name: ingName(g, r), amt, checked: isMissing || !!sh, note, from: [rName(r)] };
  });
  openListPicker(entries);
}

/* Diet dialog */
function openDiet() {
  $("#dietOptions").innerHTML = Object.entries(DIETS).map(([id, d]) =>
    `<label class="check"><input type="checkbox" value="${id}" ${settings.diets.includes(id) ? "checked" : ""}> ${esc(t(d.label))}</label>`).join("");
  $("#dietDialog").showModal();
}

/* ---------- your own recipes and suggestions ---------- */
const AMT_RE = /^((?:\d+\s+)?\d+(?:[\/.]\d+)?\s*(?:cups?|tazas?|tbsp|tablespoons?|cdas?|tsp|teaspoons?|cdtas?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|l|cloves?|dientes?|cans?|latas?|slices?|rebanadas?|pinch(?:es)?|pizcas?|handfuls?|bunch(?:es)?|manojos?|stalks?|heads?|sticks?|packages?|large|medium|small)?\.?)\s+(?:de\s+)?(.+)$/i;
function toIngString(line) {
  let opt = false;
  line = line.replace(/\s*\((optional|opcional)\)\s*$/i, () => { opt = true; return ""; }).trim();
  let amt = "", name = line;
  if (line.includes("|")) { [amt, name] = line.split("|").map(s => s.trim()); }
  else { const m = line.match(AMT_RE); if (m) { amt = m[1].trim(); name = m[2].trim(); } }
  return `${amt}|${name}${opt ? "|o" : ""}`;
}
let editingMine = null, formMode = "mine";
function openRecipeForm(mode, recipe) {
  formMode = mode;
  editingMine = recipe || null;
  $("#rfTitle").textContent = mode === "suggest" ? t("Suggest a recipe") : recipe ? t("Edit recipe") : t("Add a recipe");
  $("#rfIntro").textContent = mode === "suggest"
    ? t("This opens your email app with your recipe filled in. Good suggestions get reviewed and may be added for everyone.")
    : t("Your recipes are saved on this device and show up in Saved, For You, and Browse.");
  $("#sType").innerHTML = MEAL_TYPES.map(m => `<option value="${m}">${esc(t(m))}</option>`).join("");
  const r = recipe || {};
  $("#sName").value = r.name || "";
  $("#sType").value = r.type || "Dinner";
  $("#sTime").value = r.time || "";
  $("#sServes").value = r.serves || "";
  $("#sIng").value = r.ing ? r.ing.map(s => { const [a, n, o] = s.split("|"); return [a, n].filter(Boolean).join(" ") + (o ? " (" + t("optional") + ")" : ""); }).join("\n") : "";
  $("#sSteps").value = r.steps ? r.steps.join("\n") : "";
  $("#sBy").value = ""; $("#sNotes").value = "";
  $("#suggestExtra").classList.toggle("hidden", mode !== "suggest");
  $("#saveRecipe").classList.toggle("hidden", mode === "suggest");
  $("#emailRecipe").classList.toggle("hidden", !SUGGEST_EMAIL);
  $("#emailRecipe").classList.toggle("primary", mode === "suggest");
  $("#suggestError").textContent = "";
  $("#recipeFormDialog").showModal();
}
function readRecipeForm() {
  const lines = id => $(id).value.split("\n").map(s => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);
  const name = $("#sName").value.trim(), ing = lines("#sIng"), steps = lines("#sSteps");
  if (!name || ing.length < 2 || !steps.length) { $("#suggestError").textContent = t("Please add a name, at least 2 ingredients, and at least 1 step."); return null; }
  $("#suggestError").textContent = "";
  return { name, type: $("#sType").value, time: Number($("#sTime").value) || 30, serves: Number($("#sServes").value) || 4,
    ing: ing.map(toIngString), steps, rawIng: ing };
}
function saveMyRecipe(e) {
  e.preventDefault();
  const d = readRecipeForm(); if (!d) return;
  let name = d.name;
  const clash = RECIPES.find(r => r.name === name && (!editingMine || r.name !== editingMine.name));
  if (clash) name = name + " " + t("(mine)");
  const data = { id: editingMine ? editingMine.id : uid(), name, type: d.type, time: d.time, serves: d.serves, ing: d.ing, steps: d.steps };
  if (editingMine) {
    const old = editingMine.name;
    myRecipes = myRecipes.map(m => m.id === data.id ? data : m);
    const idx = RECIPES.findIndex(r => r.mine && r.id === data.id);
    if (idx >= 0) RECIPES.splice(idx, 1);
    if (old !== name) {
      settings.favorites = settings.favorites.map(f => f === old ? name : f);
      plan.forEach(m => { if (m.recipe === old) m.recipe = name; });
      cookedLog.forEach(c => { if (c.name === old) c.name = name; });
      saveSettings(); savePlan(); saveCooked();
    }
  } else myRecipes.push(data);
  saveMine();
  const r = addMineToRecipes(data);
  $("#recipeFormDialog").close();
  if ($("#recipeDialog").open) $("#recipeDialog").close();
  toast(t("Saved {name} to your recipes.", { name }));
  recipeMode = "saved"; setPressed("#recipeMode", $('#recipeMode [data-mode="saved"]'));
  showTab("recipes");
  return r;
}
function deleteMine() {
  const r = openResult.recipe;
  if (!r.mine || !confirm(t("Delete {name} from your recipes?", { name: r.name }))) return;
  myRecipes = myRecipes.filter(m => m.id !== r.id);
  const idx = RECIPES.indexOf(r); if (idx >= 0) RECIPES.splice(idx, 1);
  plan = plan.filter(m => m.recipe !== r.name);
  settings.favorites = settings.favorites.filter(f => f !== r.name);
  saveMine(); savePlan(); saveSettings();
  $("#recipeDialog").close();
  renderAll();
}
function emailSuggestion() {
  if (!SUGGEST_EMAIL) return;
  const d = readRecipeForm(); if (!d) return;
  const by = $("#sBy").value.trim(), notes = $("#sNotes").value.trim();
  const snippet = `{name:${JSON.stringify(d.name)},type:${JSON.stringify(d.type)},time:${d.time},serves:${d.serves},ing:[${d.ing.map(s => JSON.stringify(s)).join(",")}],steps:[${d.steps.map(s => JSON.stringify(s)).join(",")}]},`;
  const body = [
    "Recipe suggestion for Pantry Pal", "",
    `Name: ${d.name}`, `Meal: ${d.type}`, `Time: about ${d.time} minutes`, `Serves: ${d.serves}`, by ? `Suggested by: ${by}` : "", `Language: ${LANG}`, "",
    "Ingredients:", ...d.rawIng.map(l => "- " + l), "",
    "Steps:", ...d.steps.map((s, i) => `${i + 1}. ${s}`), "",
    notes ? `Notes: ${notes}` : "", "",
    "-----", "For MY_RECIPES in recipes.js (after review):", snippet
  ].join("\n");
  $("#recipeFormDialog").close();
  window.location.href = `mailto:${SUGGEST_EMAIL}?subject=${encodeURIComponent("Recipe suggestion: " + d.name)}&body=${encodeURIComponent(body)}`;
  toast(t("Opening your email app..."));
}

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
  for (let i = 0; i < 7; i++) {
    const d = addDaysFrom(today, i), meals = sorted(plan.filter(m => m.date === d));
    html += `<div class="day-head"><h3>${esc(dayName(d))}</h3><button class="chip" data-plan-day="${d}">+ ${esc(t("Add"))}</button></div>`;
    html += meals.length ? `<ul class="list">${meals.map(mealHtml).join("")}</ul>` : `<p class="muted small">${esc(t("Nothing planned"))}</p>`;
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

/* ---------- SHOPPING ---------- */
function renderShopping() {
  const list = currentList();
  if (list) settings.activeList = list.id;
  $("#listSelect").innerHTML = shopping.map(l =>
    `<option value="${l.id}" ${list && l.id === list.id ? "selected" : ""}>${esc(l.name)} (${l.items.filter(x => !x.done).length})</option>`).join("");
  const hasList = !!list;
  ["#listSelect", "#listMenuBtn", "#shareListBtn", "#shopAddForm"].forEach(s => $(s).classList.toggle("hidden", !hasList));
  const empty = $("#emptyShop");
  if (!hasList) {
    $("#shopItems").innerHTML = "";
    $("#shopActions").classList.add("hidden");
    $("#shopEstimate").textContent = ""; $("#shopSuggest").innerHTML = "";
    empty.innerHTML = palBubble("wink", t("No lists yet. Tap + New to start one, or add stuff straight from any recipe."), [], "pal-big");
    empty.classList.remove("hidden");
    return;
  }
  const rowHtml = x => `
    <li class="shop-item ${x.done ? "done" : ""}">
      <label><input type="checkbox" data-toggle="${x.id}" ${x.done ? "checked" : ""}>
        <span class="food-emoji" aria-hidden="true">${foodEmoji(x.name)}</span><span class="shop-name">${esc(x.name)}<span class="muted small">${[x.amt, x.from.length ? t("for {what}", { what: x.from.join(", ") }) : ""].filter(Boolean).map(esc).join(" &middot; ")}</span></span>
      </label>
      <button class="row-btn" data-del="${x.id}" aria-label="${esc(t("Remove {name}", { name: x.name }))}">&times;</button>
    </li>`;
  const open = list.items.filter(x => !x.done), done = list.items.filter(x => x.done);
  let html = "";
  if (settings.groupAisles !== false) {
    const groups = {};
    open.forEach(x => { const a = aisleOf(x.name); (groups[a] = groups[a] || []).push(x); });
    AISLE_ORDER.forEach(a => { if (groups[a]) html += `<li class="aisle-head">${esc(t(AISLE_LABEL[a]))}</li>` + groups[a].map(rowHtml).join(""); });
  } else html += open.map(rowHtml).join("");
  if (done.length) html += `<li class="aisle-head">${esc(t("In the cart"))}</li>` + done.map(rowHtml).join("");
  $("#shopItems").innerHTML = html;
  $("#shopSuggest").innerHTML = restockHtml(list);
  const est = listEstimate(list);
  $("#shopEstimate").textContent = open.length ? t("Estimated total: about {total}", { total: fmtMoney(est.total) }) + (est.unknown ? " " + tn(est.unknown, "(1 item without a price)", "({n} items without a price)") : "") : "";
  $("#shopActions").classList.toggle("hidden", !list.items.some(x => x.done));
  empty.innerHTML = palBubble("happy", t("This list is empty. Add something above or from any recipe."), [], "pal-big");
  empty.classList.toggle("hidden", list.items.length > 0);
}
function newList() {
  const name = prompt(t("Name for the new list:"), t("Groceries"));
  if (name === null) return;
  const list = { id: uid(), name: name.trim() || t("Shopping list"), items: [] };
  shopping.push(list);
  settings.activeList = list.id;
  saveShopping(); saveSettings(); renderShopping();
}
function listMenu() {
  const list = currentList(); if (!list) return;
  const name = prompt(t("Rename \"{name}\", or clear the box and tap OK to delete the list:", { name: list.name }), list.name);
  if (name === null) return;
  if (name.trim()) list.name = name.trim();
  else if (confirm(t("Delete \"{name}\" and its {n} items?", { name: list.name, n: list.items.length }))) {
    shopping = shopping.filter(l => l.id !== list.id);
    settings.activeList = shopping[0] ? shopping[0].id : null;
  }
  saveShopping(); saveSettings(); renderShopping();
}
function moveCheckedToFood() {
  const list = currentList(); if (!list) return;
  const done = list.items.filter(x => x.done);
  const snap = snapshot();
  done.forEach(x => {
    const loc = guessLoc(x.name), est = estimateShelf(x.name, loc);
    items.push({ id: uid(), added: todayStr(), name: x.name, amount: null, unit: "", location: loc,
      bought: todayStr(), expires: est ? addDaysFrom(todayStr(), est.days) : "", notes: "", barcode: "", staple: isStaple(x.name) });
  });
  list.items = list.items.filter(x => !x.done);
  saveItems(); saveShopping();
  renderAll();
  toast(tn(done.length, "Moved 1 item to My Food with an estimated date. Tap it to adjust.", "Moved {n} items to My Food with estimated dates. Tap any to adjust."), snap);
}
async function shareList() {
  const list = currentList(); if (!list) return;
  const open = list.items.filter(x => !x.done);
  const payload = { n: list.name, i: open.map(x => [x.name, x.amt]) };
  const url = location.href.split("#")[0] + "#list=" + encodeURIComponent(JSON.stringify(payload));
  const text = `${list.name}\n${open.map(x => "- " + [x.amt, x.name].filter(Boolean).join(" ")).join("\n")}\n\n${t("Open it in Pantry Pal:")} ${url}`;
  try {
    if (navigator.share) { await navigator.share({ title: list.name, text }); return; }
    await navigator.clipboard.writeText(text);
    toast(t("List copied. Paste it into a text or email."));
  } catch (e) {
    if (e && e.name === "AbortError") return;
    prompt(t("Copy this list:"), text);
  }
}
function importSharedList() {
  const h = location.hash;
  if (!h.startsWith("#list=")) return;
  try {
    const data = JSON.parse(decodeURIComponent(h.slice(6)));
    const itemsIn = Array.isArray(data.i) ? data.i : [];
    if (confirm(t("Add the shared list \"{name}\" with {n} items?", { name: data.n || t("Shopping list"), n: itemsIn.length }))) {
      const list = { id: uid(), name: String(data.n || t("Shopping list")).slice(0, 80), items: [] };
      itemsIn.forEach(([name, amt]) => { if (name) addToList(list, String(name).slice(0, 120), String(amt || "").slice(0, 60), ""); });
      shopping.push(list);
      settings.activeList = list.id;
      saveShopping(); saveSettings();
      showTab("shopping");
    }
  } catch (e) {}
  history_replace();
}
function history_replace() { try { window.history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }

/* ---------- WASTE LESS ---------- */
let statsRange = "30";
function renderStats() {
  const cutoff = statsRange === "all" ? "" : addDaysFrom(todayStr(), -30);
  const h = history.filter(e => !cutoff || e.date >= cutoff);
  const used = h.filter(e => e.outcome === "used"), wasted = h.filter(e => e.outcome === "wasted");
  const inTime = used.filter(e => e.d === null || e.d >= 0);
  const late = used.filter(e => e.d !== null && e.d < 0);
  const rescued = used.filter(e => e.d !== null && e.d >= 0 && e.d <= 3);
  const total = used.length + wasted.length;
  const body = $("#statsBody");
  const cooks = cookedLog.filter(c => !cutoff || c.date >= cutoff).length;
  if (!total) {
    body.innerHTML = palStatsHtml(0, 0) + `<div class="card"><h3>${esc(t("Nothing tracked yet"))}</h3>
      <p class="muted small">${esc(t("When you finish food (the -1 button, \"I made this\" on a recipe, or Remove then \"We used it\") or toss it, it shows up here. Over time you'll see how much you're saving."))}</p></div>`;
    return;
  }
  const pct = Math.round(inTime.length / total * 100);
  const w = n => (n / total * 100).toFixed(1) + "%";
  const counts = {};
  wasted.forEach(e => { const k = e.name.trim().toLowerCase(); counts[k] = (counts[k] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const tip = !wasted.length ? t("Nothing tossed. Nicely done!")
    : top[0][1] > 1 ? t("You've tossed {name} {n} times. Try buying less of it, or freezing it sooner.", { name: top[0][0], n: top[0][1] })
    : t("Check the For You recipes when the orange alert shows up. That's where most savings happen.");
  body.innerHTML = palStatsHtml(pct, total) + `
    <div class="stat-hero"><div class="big">${pct}%</div><div>${esc(t("of your food was used before its date"))}</div>
      <div class="bar" role="img" aria-label="${esc(t("{a} used in time, {b} used late, {c} thrown out", { a: inTime.length, b: late.length, c: wasted.length }))}"><span class="u" style="width:${w(inTime.length)}"></span><span class="l" style="width:${w(late.length)}"></span><span class="w" style="width:${w(wasted.length)}"></span></div>
    </div>
    <div class="stat-grid">
      <div class="stat good"><div class="num">${inTime.length}</div><div class="small">${esc(t("Used in time"))}</div></div>
      <div class="stat good"><div class="num">${rescued.length}</div><div class="small">${esc(t("Rescued (used in its last 3 days)"))}</div></div>
      <div class="stat"><div class="num">${late.length}</div><div class="small">${esc(t("Used after the date"))}</div></div>
      <div class="stat bad"><div class="num">${wasted.length}</div><div class="small">${esc(t("Thrown out"))}</div></div>
      <div class="stat"><div class="num">${cooks}</div><div class="small">${esc(t("Meals cooked"))}</div></div>
    </div>
    ${top.length ? `<div class="card"><h3>${esc(t("Most often tossed"))}</h3><ol>${top.map(([n, c]) => `<li>${esc(n)} <span class="muted small">(${c})</span></li>`).join("")}</ol></div>` : ""}
    <div class="card"><h3>${esc(t("Tip"))}</h3><p class="small">${esc(tip)}</p></div>`;
}

/* ---------- REMINDERS ---------- */
function icsEsc(s) { return String(s).replace(/\\/g, "\\\\").replace(/[,;]/g, m => "\\" + m).replace(/\n/g, "\\n"); }
function makeICS(list) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pantry Pal//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const i of list) {
    const day = addDaysFrom(i.expires, -1).replace(/-/g, "");
    const title = t("{name} expires tomorrow", { name: i.name });
    lines.push("BEGIN:VEVENT", `UID:${i.id}-${i.expires}@pantrypal`, `DTSTAMP:${stamp}`, `DTSTART:${day}T090000`, "DURATION:PT15M",
      `SUMMARY:${icsEsc(title)}`, `DESCRIPTION:${icsEsc(t("Use it up or freeze it. Open Pantry Pal for recipe ideas."))}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(title)}`, "TRIGGER:PT0M", "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
function calendarReminders(list) {
  const ok = list.filter(i => i.expires && daysLeft(i.expires) >= 1);
  if (!ok.length) { toast(t("No items with an expiration date at least a day away.")); return; }
  download(ok.length === 1 ? "pantry-reminder.ics" : "pantry-reminders.ics", makeICS(ok), "text/calendar");
  toast(tn(ok.length, "Calendar file ready with 1 reminder. Open it to add it to your calendar.", "Calendar file ready with {n} reminders. Open it to add them to your calendar."));
}
function syncForReminders() {
  if (!settings.reminders || !("caches" in window)) return;
  const data = { lang: LANG, items: items.map(i => ({ name: i.name, expires: i.expires })) };
  caches.open(DATA_CACHE).then(c => c.put("pantry-data.json", new Response(JSON.stringify(data)))).catch(() => {});
}
function swReady(ms) {
  if (!("serviceWorker" in navigator)) return Promise.resolve(null);
  return Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), ms))]);
}
async function setReminders(on) {
  const status = $("#reminderStatus");
  if (!on) {
    settings.reminders = false; saveSettings();
    const reg = await swReady(2000);
    try { if (reg && reg.periodicSync) await reg.periodicSync.unregister("expiry-check"); } catch (e) {}
    status.textContent = "";
    return;
  }
  if (!("Notification" in window)) {
    $("#remindersToggle").checked = false;
    status.textContent = t("This browser can't show notifications. Use the calendar option below instead.");
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") {
    $("#remindersToggle").checked = false;
    status.textContent = t("Notifications are blocked. You can allow them in your browser's site settings, or use the calendar option below.");
    return;
  }
  settings.reminders = true; saveSettings(); syncForReminders();
  const reg = await swReady(3000);
  let background = false;
  if (reg && "periodicSync" in reg) {
    try { await reg.periodicSync.register("expiry-check", { minInterval: 12 * 60 * 60 * 1000 }); background = true; } catch (e) {}
  }
  try { if (reg) await reg.showNotification("Pantry Pal", { body: t("Reminders are on."), icon: "icon.svg", tag: "test" }); } catch (e) {}
  status.textContent = background
    ? t("On. Your phone will check about once a day and let you know what expires tomorrow.")
    : t("Notifications are allowed, but this browser can't check while the app is closed. On Android, use Chrome and Add to Home screen, then turn this on again. Calendar reminders below work on every phone.");
}

/* ---------- backup ---------- */
function exportBackup() {
  download(`pantry-backup-${todayStr()}.json`, JSON.stringify({
    app: "pantrypal", version: 3, exported: new Date().toISOString(),
    items, history, shopping, barcodes, plan, cookedLog, myRecipes, settings
  }, null, 2), "application/json");
}
function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const incoming = Array.isArray(data) ? data : data.items;
      if (!Array.isArray(incoming)) throw new Error("bad file");
      if (!confirm(t("Replace everything here with this backup ({n} food items)?", { n: incoming.length }))) return;
      items = incoming.filter(i => i && typeof i.name === "string").map(i => Object.assign({ id: uid() }, i));
      if (Array.isArray(data.history)) history = data.history;
      if (Array.isArray(data.shopping)) shopping = data.shopping;
      if (data.barcodes && typeof data.barcodes === "object") barcodes = data.barcodes;
      if (Array.isArray(data.plan)) plan = data.plan;
      if (Array.isArray(data.cookedLog)) cookedLog = data.cookedLog;
      if (Array.isArray(data.myRecipes)) {
        RECIPES.filter(r => r.mine).forEach(r => RECIPES.splice(RECIPES.indexOf(r), 1));
        myRecipes = data.myRecipes.filter(m => m && m.name && Array.isArray(m.ing) && Array.isArray(m.steps));
        myRecipes.forEach(addMineToRecipes);
      }
      if (data.settings) {
        ["favorites", "staples", "diets", "missingBasics"].forEach(k => { if (Array.isArray(data.settings[k])) settings[k] = data.settings[k]; });
        ["household", "ratings", "usage"].forEach(k => { if (data.settings[k] && typeof data.settings[k] === "object") settings[k] = data.settings[k]; });
        settings.onboarded = true;
      }
      saveItems(); saveHistory(); saveShopping(); saveBarcodes(); savePlan(); saveCooked(); saveMine(); saveSettings();
      renderDietSummary(); renderAll();
      alert(t("Backup restored."));
    } catch (e) { alert(t("That file doesn't look like a Pantry Pal backup.")); }
  };
  reader.readAsText(file);
}

/* ---------- language and display ---------- */
function applyLang() {
  LANG = settings.lang === "es" ? "es" : "en";
  document.documentElement.lang = LANG;
  $$("[data-t]").forEach(el => {
    if (!el.dataset.k) el.dataset.k = el.textContent.trim();
    el.textContent = t(el.dataset.k);
  });
  $$("[data-t-ph]").forEach(el => { el.placeholder = t(el.dataset.tPh); });
  $$("[data-t-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.tAria)); });
  $("#langBtn").textContent = LANG === "es" ? "EN" : "ES";
  $("#langBtn").setAttribute("aria-label", LANG === "es" ? "Switch to English" : "Cambiar a español");
  $("#langSelect").value = LANG;
  const tf = $("#typeFilter"), cur = tf.value;
  tf.innerHTML = `<option value="">${esc(t("All meals"))}</option>` + MEAL_TYPES.filter(m => RECIPES.some(r => r.type === m)).map(m => `<option value="${m}">${esc(t(m))}</option>`).join("");
  tf.value = cur;
  RECIPES.forEach(r => { if (!r.search.includes(norm(t(r.type)).trim())) r.search += " " + t(r.type).toLowerCase(); });
  renderDietSummary();
  if (typeof setPageTitle === "function") setPageTitle(document.body.dataset.tab || "pantry");
  renderAll();
  syncForReminders();
}
function applyDisplay() {
  document.body.classList.toggle("large-text", !!settings.largeText);
  document.body.classList.toggle("high-contrast", !!settings.highContrast);
}

/* ---------- wiring ---------- */
function showTab(name) {
  if (typeof setPageTitle === "function") setPageTitle(name);
  $$(".tab").forEach(tb => tb.classList.toggle("active", tb.id === "tab-" + name));
  $$(".tabbar button").forEach(b => {
    const on = b.dataset.tab === name;
    b.classList.toggle("active", on);
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  if (name === "recipes") { recipeLimit = PAGE_SIZE; renderRecipes(); }
  if (name === "plan") renderPlan();
  if (name === "shopping") renderShopping();
  if (name === "stats") renderStats();
  window.scrollTo(0, 0);
}
function renderAll() {
  if (typeof renderHints === "function") renderHints();
  renderPantry();
  if ($("#tab-recipes").classList.contains("active")) renderRecipes();
  if ($("#tab-plan").classList.contains("active")) renderPlan();
  if ($("#tab-shopping").classList.contains("active")) renderShopping();
  if ($("#tab-stats").classList.contains("active")) renderStats();
}

function init() {
  buildMatcher();
  myRecipes.forEach(addMineToRecipes);
  applyDisplay();

  // Keyboard: Enter or Space on card rows
  document.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[role=button]")) { e.preventDefault(); e.target.click(); }
  });

  $$(".tabbar button").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
  $("#langBtn").addEventListener("click", () => { settings.lang = LANG === "es" ? "en" : "es"; saveSettings(); applyLang(); });

  // My Food
  $("#alerts").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.go) showTab(b.dataset.go);
    if (b.dataset.toss) tossExpired();
  });
  $("#locFilter").addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { locFilter = b.dataset.loc; renderPantry(); } });
  $("#pantrySearch").addEventListener("input", renderPantry);
  $("#itemList").addEventListener("click", e => {
    const minus = e.target.closest("[data-minus]");
    if (minus) { e.stopPropagation(); useOne(minus.dataset.minus); return; }
    const li = e.target.closest(".item"); if (li) openItem(li.dataset.id);
  });
  $("#addBtn").addEventListener("click", () => openItem(null));
  $("#scanQuick").addEventListener("click", () => { openItem(null); openScanner(); });
  $("#quickAddBtn").addEventListener("click", () => { $("#quickText").value = ""; renderQuickPreview(); $("#quickDialog").showModal(); });
  $("#quickText").addEventListener("input", renderQuickPreview);
  $("#cancelQuick").addEventListener("click", () => $("#quickDialog").close());
  $("#confirmQuick").addEventListener("click", confirmQuick);

  // Item dialog
  $("#itemForm").addEventListener("submit", saveItem);
  $("#cancelItem").addEventListener("click", () => $("#itemDialog").close());
  $("#deleteItem").addEventListener("click", () => { const it = items.find(i => i.id === editingId); $("#itemDialog").close(); if (it) askRemove(it); });
  $("#itemReminder").addEventListener("click", () => { const it = items.find(i => i.id === editingId); if (it) calendarReminders([it]); });
  $("#freezeBtn").addEventListener("click", freezeOrThaw);
  $("#useThisBtn").addEventListener("click", () => {
    focusItemId = editingId; $("#itemDialog").close();
    recipeMode = "foryou"; setPressed("#recipeMode", $('#recipeMode [data-mode="foryou"]'));
    showTab("recipes");
  });
  $("#suggestExpiry").addEventListener("click", () => suggestExpiry(false));
  $("#fName").addEventListener("change", () => { if (!editingId) $("#fStaple").checked = isStaple($("#fName").value); });
  $("#readDateBtn").addEventListener("click", () => $("#dateFile").click());
  $("#dateFile").addEventListener("change", e => { if (e.target.files[0]) readDateFromPhoto(e.target.files[0]); e.target.value = ""; });
  $("#scanBtn").addEventListener("click", openScanner);

  // Scanner
  $("#closeScan").addEventListener("click", () => $("#scanDialog").close());
  $("#scanDialog").addEventListener("close", stopScanner);
  $("#manualCodeForm").addEventListener("submit", e => { e.preventDefault(); const code = $("#manualCode").value.replace(/\D/g, ""); if (code) gotCode(code); });

  // Remove dialog
  $("#removeDialog").addEventListener("click", e => { const b = e.target.closest("[data-outcome]"); if (b) finishRemove(b.dataset.outcome); });

  // Recipes
  segment("#recipeMode", "mode", m => { recipeMode = m; recipeLimit = PAGE_SIZE; renderRecipes(); });
  const rerender = () => { recipeLimit = PAGE_SIZE; renderRecipes(); };
  $("#recipeSearch").addEventListener("input", rerender);
  ["#missingFilter", "#typeFilter", "#timeFilter", "#sortSelect"].forEach(id => $(id).addEventListener("change", rerender));
  $("#moreRecipes").addEventListener("click", () => { recipeLimit += PAGE_SIZE; renderRecipes(); });
  $("#recipeList").addEventListener("click", e => { const li = e.target.closest(".recipe"); if (li) openRecipe(recipeResults[Number(li.dataset.idx)]); });
  ["#focusBanner", "#planBanner"].forEach(id => $(id).addEventListener("click", e => {
    const b = e.target.closest("[data-clear]"); if (!b) return;
    if (b.dataset.clear === "focus") focusItemId = null; else planTarget = null;
    renderRecipes();
  }));
  $("#closeRecipe").addEventListener("click", () => $("#recipeDialog").close());
  $("#favBtn").addEventListener("click", toggleFavorite);
  $("#servMinus").addEventListener("click", () => changeServings(-1));
  $("#servPlus").addEventListener("click", () => changeServings(1));
  $("#cookedBtn").addEventListener("click", showCookedPanel);
  $("#confirmCooked").addEventListener("click", confirmCooked);
  $("#leftoverChk").addEventListener("change", e => $("#leftoverRow").classList.toggle("hidden", !e.target.checked));
  $("#cookedList").addEventListener("click", e => {
    const b = e.target.closest("[data-all]"); if (!b) return;
    const inp = $(`#cookedList .used-amt[data-id="${b.dataset.all}"]`); if (inp) inp.value = inp.max;
  });
  $("#planBtn").addEventListener("click", showPlanPanel);
  $("#confirmPlan").addEventListener("click", confirmPlan);
  $("#shopBtn").addEventListener("click", shopFromRecipe);
  $("#editMineBtn").addEventListener("click", () => {
    const m = myRecipes.find(x => x.id === openResult.recipe.id); if (m) openRecipeForm("mine", m);
  });
  $("#deleteMineBtn").addEventListener("click", deleteMine);

  $("#shopListPick").addEventListener("change", e => $("#shopNewName").classList.toggle("hidden", e.target.value !== "__new"));
  $("#confirmShop").addEventListener("click", confirmPick);
  $("#cancelPick").addEventListener("click", () => $("#listPickDialog").close());

  $("#dietBtn").addEventListener("click", openDiet);
  $("#dietOptions").addEventListener("change", () => {
    settings.diets = $$("#dietOptions input:checked").map(c => c.value);
    saveSettings(); renderDietSummary(); renderAll();
  });
  $("#closeDiet").addEventListener("click", () => $("#dietDialog").close());

  $("#suggestBtn").classList.toggle("hidden", !SUGGEST_EMAIL);
  $("#suggestBtn").addEventListener("click", () => openRecipeForm("suggest"));
  $("#newRecipeBtn").addEventListener("click", () => openRecipeForm("mine"));
  $("#cancelRecipeForm").addEventListener("click", () => $("#recipeFormDialog").close());
  $("#recipeForm").addEventListener("submit", saveMyRecipe);
  $("#emailRecipe").addEventListener("click", emailSuggestion);

  // Plan
  $("#planBody").addEventListener("click", e => {
    const un = e.target.closest("[data-unplan]");
    if (un) { e.stopPropagation(); plan = plan.filter(m => m.id !== un.dataset.unplan && m.fromId !== un.dataset.unplan); savePlan(); renderPlan(); return; }
    const add = e.target.closest("[data-plan-day]");
    if (add) {
      planTarget = add.dataset.planDay;
      recipeMode = "browse"; setPressed("#recipeMode", $('#recipeMode [data-mode="browse"]'));
      showTab("recipes"); return;
    }
    const li = e.target.closest("[data-meal]");
    if (li) {
      const m = plan.find(x => x.id === li.dataset.meal), r = m && recipeByName(m.recipe);
      if (r) openRecipe(planReservations().evs.get(m.id) || evaluate(r, availablePool(), settings.diets), m.id);
    }
  });
  $("#planShopBtn").addEventListener("click", planShopping);

  // Shopping
  $("#listSelect").addEventListener("change", e => { settings.activeList = e.target.value; saveSettings(); renderShopping(); });
  $("#newListBtn").addEventListener("click", newList);
  $("#listMenuBtn").addEventListener("click", listMenu);
  $("#shareListBtn").addEventListener("click", shareList);
  $("#shopAddForm").addEventListener("submit", e => {
    e.preventDefault();
    const list = currentList(), name = $("#shopAddInput").value.trim();
    if (!list || !name) return;
    if (!addToList(list, name, "", "")) toast(t("{name} is already on the list.", { name }));
    $("#shopAddInput").value = "";
    saveShopping(); renderShopping();
  });
  $("#shopItems").addEventListener("click", e => {
    const list = currentList(); const del = e.target.closest("[data-del]");
    if (list && del) { list.items = list.items.filter(x => x.id !== del.dataset.del); saveShopping(); renderShopping(); }
  });
  $("#shopItems").addEventListener("change", e => {
    const list = currentList(), id = e.target.dataset.toggle;
    if (!list || !id) return;
    const x = list.items.find(i => i.id === id);
    if (x) { x.done = e.target.checked; saveShopping(); renderShopping(); }
  });
  $("#moveToFood").addEventListener("click", moveCheckedToFood);
  $("#clearChecked").addEventListener("click", () => {
    const list = currentList(); if (!list) return;
    list.items = list.items.filter(x => !x.done); saveShopping(); renderShopping();
  });

  // Stats
  segment("#statsRange", "range", r => { statsRange = r; renderStats(); });

  // Settings
  $("#settingsBtn").addEventListener("click", () => {
    $("#assumeBasics").checked = settings.assumeBasics;
    $("#useSubs").checked = settings.useSubs;
    $("#remindersToggle").checked = settings.reminders;
    $("#largeText").checked = settings.largeText;
    $("#highContrast").checked = settings.highContrast;
    $("#langSelect").value = LANG;
    $("#settingsDialog").showModal();
  });
  $("#closeSettings").addEventListener("click", () => $("#settingsDialog").close());
  $("#langSelect").addEventListener("change", e => { settings.lang = e.target.value; saveSettings(); applyLang(); });
  $("#assumeBasics").addEventListener("change", e => { settings.assumeBasics = e.target.checked; saveSettings(); renderAll(); });
  $("#useSubs").addEventListener("change", e => { settings.useSubs = e.target.checked; saveSettings(); renderAll(); });
  $("#largeText").addEventListener("change", e => { settings.largeText = e.target.checked; saveSettings(); applyDisplay(); });
  $("#highContrast").addEventListener("change", e => { settings.highContrast = e.target.checked; saveSettings(); applyDisplay(); });
  $("#remindersToggle").addEventListener("change", e => setReminders(e.target.checked));
  $("#calendarAll").addEventListener("click", () => calendarReminders(items));
  $("#exportBtn").addEventListener("click", exportBackup);
  $("#importFile").addEventListener("change", e => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ""; });
  $("#clearAll").addEventListener("click", () => {
    if (!confirm(t("Delete ALL your food, lists, plan, recipes, and stats? Export a backup first if you might want them back."))) return;
    items = []; history = []; shopping = []; plan = []; cookedLog = [];
    RECIPES.filter(r => r.mine).forEach(r => RECIPES.splice(RECIPES.indexOf(r), 1));
    myRecipes = []; settings.activeList = null; settings.favorites = []; settings.staples = [];
    saveItems(); saveHistory(); saveShopping(); savePlan(); saveCooked(); saveMine(); saveSettings(); renderAll();
  });

  // Tap outside a dialog to close it
  $$("dialog").forEach(d => d.addEventListener("click", e => { if (e.target === d) d.close(); }));

  kitchenInit();
  extrasInit();
  buddyInit();
  applyLang();
  importSharedList();
  if (!settings.onboarded && !location.hash.startsWith("#list=")) openOnboarding("first");
  window.addEventListener("hashchange", importSharedList);

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").then(syncForReminders).catch(() => {});
  }
}

if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("DOMContentLoaded", init);
