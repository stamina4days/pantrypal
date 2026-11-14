/* Real quantities: parse amounts, convert to grams, store sections, receipts, timers.
   All weights are typical averages, so treat results as good estimates. */

/* unit word -> [kind, size]: mass in grams, volume in ml */
const UNITS = {
  g: ["mass", 1], gram: ["mass", 1], kg: ["mass", 1000], kilo: ["mass", 1000], oz: ["mass", 28.35], ounce: ["mass", 28.35], onza: ["mass", 28.35],
  lb: ["mass", 453.6], pound: ["mass", 453.6], libra: ["mass", 453.6],
  ml: ["vol", 1], l: ["vol", 1000], liter: ["vol", 1000], litro: ["vol", 1000], tsp: ["vol", 4.93], teaspoon: ["vol", 4.93], cdta: ["vol", 4.93],
  tbsp: ["vol", 14.79], tablespoon: ["vol", 14.79], cda: ["vol", 14.79], cup: ["vol", 236.6], taza: ["vol", 236.6], pint: ["vol", 473],
  quart: ["vol", 946], gallon: ["vol", 3785], gal: ["vol", 3785], galon: ["vol", 3785],
  clove: ["count", "clove"], diente: ["count", "clove"], slice: ["count", "slice"], rebanada: ["count", "slice"], can: ["count", "can"], lata: ["count", "can"],
  head: ["count", "head"], cabeza: ["count", "head"], bunch: ["count", "bunch"], manojo: ["count", "bunch"], handful: ["count", "handful"], punado: ["count", "handful"],
  fillet: ["count", "fillet"], filete: ["count", "fillet"], stalk: ["count", "stalk"], tallo: ["count", "stalk"], leaf: ["count", "leaf"], leave: ["count", "leaf"], hoja: ["count", "leaf"],
  piece: ["each", 1], pieza: ["each", 1], each: ["each", 1], dozen: ["each", 12], docena: ["each", 12], small: ["each", 0.7], medium: ["each", 1], large: ["each", 1.3],
  bag: ["pkg", "bag"], bolsa: ["pkg", "bag"], box: ["pkg", "box"], caja: ["pkg", "box"], bottle: ["pkg", "bottle"], botella: ["pkg", "bottle"],
  pack: ["pkg", "pack"], package: ["pkg", "pack"], paquete: ["pkg", "pack"], carton: ["pkg", "carton"], jar: ["pkg", "jar"], frasco: ["pkg", "jar"],
  loaf: ["pkg", "loaf"], loave: ["pkg", "loaf"], tub: ["pkg", "tub"], container: ["pkg", "tub"], serving: ["pkg", "serving"], porcion: ["pkg", "serving"]
};
/* grams for one of an item */
const EACH_G = {
  egg: 50, onion: 150, potato: 200, "sweet potato": 200, "bell pepper": 150, carrot: 60, tomato: 125, banana: 120, apple: 180, lemon: 100, lime: 65,
  zucchini: 200, avocado: 150, cucumber: 300, jalapeno: 15, scallion: 15, garlic: 5, tortilla: 40, "chicken breast": 225, "chicken thigh": 120,
  sausage: 85, salmon: 170, fish: 170, peach: 150, mango: 200, pineapple: 900, cabbage: 900, broccoli: 500, cauliflower: 600, lettuce: 600,
  "butternut squash": 1000, bread: 30, bacon: 25, celery: 40, orange: 150, ginger: 30, "canned tomato": 400, "black bean": 425, "kidney bean": 425,
  chickpea: 425, "coconut milk": 400, tuna: 140, "tomato sauce": 425, broth: 950
};
/* grams for named count units, by ingredient (fallback in "*") */
const NAMED_G = {
  clove: { "*": 5 }, slice: { bread: 30, bacon: 25, cheese: 20, ham: 20, "*": 25 },
  can: { "canned tomato": 400, "coconut milk": 400, tuna: 140, "*": 425 },
  head: { garlic: 50, broccoli: 500, cauliflower: 600, lettuce: 600, cabbage: 900, "*": 500 },
  bunch: { asparagus: 450, cilantro: 50, parsley: 50, basil: 40, scallion: 100, celery: 450, kale: 250, spinach: 300, "*": 150 },
  handful: { "*": 30 }, fillet: { "*": 170 }, stalk: { "*": 40 }, leaf: { lettuce: 15, basil: 1, "*": 10 }
};
/* grams per ml, for cups and spoons. Rice is cooked cups measured against dry rice. */
const DENSITY = {
  flour: .53, sugar: .85, rice: .25, oat: .34, milk: 1.03, cream: 1, yogurt: 1.05, "sour cream": 1, cheese: .45, parmesan: .42, butter: .96,
  broth: 1, spinach: .13, kale: .2, broccoli: .38, pea: .6, corn: .65, cabbage: .3, mushroom: .3, "green bean": .45, "snap pea": .4, berry: .6,
  strawberry: .6, blueberry: .63, mango: .7, peach: .7, pineapple: .7, chicken: .6, ham: .6, "black bean": .72, "kidney bean": .72, chickpea: .7,
  lettuce: .2, oil: .92, "olive oil": .92, honey: 1.4, mayonnaise: .95, salsa: 1, "tomato sauce": 1.05, "canned tomato": 1, "coconut milk": 1,
  lentil: .8, "red lentil": .8, granola: .5, breadcrumb: .45, crouton: .15, "pine nut": .57, olive: .6, cilantro: .2, basil: .1, "peanut butter": 1.1,
  "barbecue sauce": 1.1, "soy sauce": 1.1, vinegar: 1, water: 1, "tomato paste": 1.1, mozzarella: .45, "cheddar cheese": .45
};
/* typical package sizes in grams (used for "bag of spinach" and for leftovers after buying) */
const PKG_G = {
  spinach: 300, kale: 250, lettuce: 300, carrot: 900, potato: 2270, onion: 1360, rice: 907, pasta: 454, penne: 454, spaghetti: 454, macaroni: 454,
  "egg noodle": 340, oat: 1190, bread: 680, tortilla: 400, cheese: 226, "cheddar cheese": 226, mozzarella: 226, parmesan: 140, yogurt: 907,
  "sour cream": 454, cream: 473, milk: 3785, butter: 454, "chicken breast": 680, "chicken thigh": 680, chicken: 680, "ground beef": 454,
  beef: 454, steak: 454, pork: 680, bacon: 340, ham: 280, sausage: 454, shrimp: 454, salmon: 454, fish: 454, tofu: 397, mushroom: 227,
  broccoli: 500, cauliflower: 600, cabbage: 900, "bell pepper": 450, tomato: 450, berry: 340, strawberry: 454, blueberry: 340, apple: 1360,
  banana: 900, lemon: 450, lime: 450, cilantro: 50, parsley: 50, basil: 20, scallion: 100, celery: 450, ginger: 100, garlic: 50, salsa: 454,
  "tomato sauce": 680, "canned tomato": 794, broth: 946, "black bean": 425, "kidney bean": 425, chickpea: 425, "coconut milk": 400,
  lentil: 454, "red lentil": 454, mayonnaise: 850, granola: 340, breadcrumb: 227, "peanut butter": 454, honey: 340, corn: 454, pea: 454,
  "green bean": 454, "snap pea": 227, asparagus: 450, zucchini: 600, cucumber: 300, avocado: 600, peach: 900, mango: 400, pineapple: 900,
  "sweet potato": 900, "butternut squash": 1000, feta: 170, "barbecue sauce": 510, "stew meat": 680, egg: 600
};

const _lk = new Map();
function _table(name, obj) {
  if (!_lk.has(name)) { const m = new Map(); for (const [k, v] of Object.entries(obj)) m.set(norm(k).trim(), v); _lk.set(name, m); }
  return _lk.get(name);
}
/* Look up a value for an ingredient key, walking up to more general names. */
function byKey(name, obj, key) {
  const m = _table(name, obj);
  for (const k of chain(key)) { const v = m.get(k.trim()); if (v != null) return v; }
  return null;
}
function unitOf(word) {
  if (!word) return null;
  const w = singular(String(word).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\.$/, ""));
  if (w === "lbs") return UNITS.lb;
  return UNITS[w] || UNITS[w.replace(/e$/, "")] || null;
}
/* "1 1/2 cups" -> {q:1.5, unit:"cups", rest:" cups", inner:null}; "1 can (28 oz)" -> inner grams 794 */
function parseQty(amt) {
  const s = String(amt || "").trim();
  const m = s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(.*)$/);
  if (!m) return null;
  const q = parseAmt(m[1]);
  let rest = m[2] || "", inner = null;
  const par = rest.match(/\((\d+(?:\.\d+)?)\s*([a-z]+)\)/i);
  if (par) {
    const u = unitOf(par[2]);
    if (u && u[0] === "mass") inner = Number(par[1]) * u[1];
    else if (u && u[0] === "vol") inner = Number(par[1]) * u[1];
    rest = rest.replace(par[0], "").trim();
  }
  const word = (rest.match(/^[A-Za-zÀ-ſ]+/) || [""])[0];
  return { q, unit: word, rest: m[2] ? " " + m[2] : "", inner };
}
function eachGrams(key, factor) { return (byKey("each", EACH_G, key) || 100) * (factor || 1); }

/* Convert an amount of an ingredient to grams. Returns null when it can't be known. */
function gramsOf(q, unitWord, key, inner) {
  if (q == null || isNaN(q)) return null;
  if (inner) return q * inner;
  const u = unitOf(unitWord);
  if (!u) return q * eachGrams(key);                       // "3 eggs", "2 onions", "12" with no unit
  const [kind, size] = u;
  if (kind === "mass") return q * size;
  if (kind === "vol") return q * size * (byKey("density", DENSITY, key) || .8);
  if (kind === "each") return q * eachGrams(key, size);
  if (kind === "count") { const t = NAMED_G[size]; return q * (byKey("named-" + size, t, key) || t["*"]); }
  if (kind === "pkg") { const p = byKey("pkg", PKG_G, key); return p ? q * p : null; }
  return null;
}
function ingGrams(g, f) {
  const p = parseQty(g.amt);
  return p ? gramsOf(p.q * (f || 1), p.unit, g.key, p.inner) : null;
}
function itemGrams(item, key) {
  if (!hasAmount(item)) return null;
  const u = unitOf(item.unit);
  if (u && u[0] === "pkg" && u[1] === "serving") return null;
  return gramsOf(item.amount, item.unit, key || canon(item.name), null);
}
const pkgGrams = key => byKey("pkg", PKG_G, key);

/* How much of a recipe amount is still needed: "1 1/2 cups" with 40% short -> "2/3 cup" */
function shortAmount(amt, f, frac) {
  const p = parseQty(amt);
  if (!p) return amt || "";
  const u = unitOf(p.unit);
  let q = p.q * (f || 1) * frac;
  if (!u || u[0] === "each" || u[0] === "count") q = Math.ceil(q - 0.05);
  return fmtFrac(Math.max(q, 0)) + p.rest;
}

/* ---------- store sections ---------- */
const AISLES = [
  ["produce", "Produce", ["onion", "garlic", "potato", "sweet potato", "carrot", "celery", "bell pepper", "broccoli", "cauliflower", "spinach", "kale", "lettuce",
    "tomato", "cucumber", "zucchini", "mushroom", "cabbage", "avocado", "lemon", "lime", "banana", "apple", "berry", "strawberry", "blueberry", "raspberry",
    "cilantro", "parsley", "basil", "scallion", "jalapeno", "ginger", "green bean", "snap pea", "asparagus", "butternut squash", "brussel sprout",
    "peach", "mango", "pineapple", "orange", "grape"]],
  ["meat", "Meat and seafood", ["chicken", "beef", "ground beef", "steak", "stew meat", "pork", "bacon", "ham", "sausage", "turkey", "fish", "salmon", "shrimp", "tuna"]],
  ["dairy", "Dairy and eggs", ["egg", "milk", "butter", "cheese", "cream", "cream cheese", "sour cream", "yogurt", "cottage cheese", "tofu", "hummus", "salsa"]],
  ["bakery", "Bakery and bread", ["bread", "tortilla", "crouton", "breadcrumb"]],
  ["pantry", "Pantry", ["rice", "pasta", "oat", "granola", "canned tomato", "tomato sauce", "tomato paste", "black bean", "kidney bean", "chickpea", "lentil",
    "broth", "coconut milk", "peanut butter", "honey", "maple syrup", "mayonnaise", "mustard", "olive", "tahini", "pine nut", "caesar dressing", "barbecue sauce", "corn", "pea"]],
  ["baking", "Spices and baking", ["salt", "pepper", "oil", "olive oil", "vegetable oil", "flour", "sugar", "baking powder", "baking soda", "cornstarch", "vinegar",
    "soy sauce", "cinnamon", "cumin", "chili powder", "paprika", "oregano", "italian seasoning", "curry powder", "vanilla", "red pepper flake"]]
];
const AISLE_ORDER = ["produce", "meat", "dairy", "bakery", "pantry", "frozen", "baking", "other"];
const AISLE_LABEL = { produce: "Produce", meat: "Meat and seafood", dairy: "Dairy and eggs", bakery: "Bakery and bread", pantry: "Pantry", frozen: "Frozen", baking: "Spices and baking", other: "Other" };
function aisleOf(name) {
  if (/\bfrozen\b|\bcongelad/i.test(name)) return "frozen";
  const keys = chain(canon(name)).map(k => k.trim());
  for (const [id, , list] of AISLES) if (keys.some(k => list.map(x => norm(x).trim()).includes(k))) return id;
  return "other";
}

/* ---------- receipts ---------- */
const RECEIPT_ABBR = {
  MLK: "milk", WHL: "whole", CHKN: "chicken", CHK: "chicken", CKN: "chicken", CHIX: "chicken", BRST: "breast", BRSTS: "breast", BNLS: "", SKNLS: "", BL: "", SL: "",
  THGH: "thighs", THGHS: "thighs", GRD: "ground", GRND: "ground", BF: "beef", TRKY: "turkey", PRK: "pork", BCN: "bacon", SAUS: "sausage", SSG: "sausage",
  SLMN: "salmon", SHRMP: "shrimp", SHRIMP: "shrimp", EGG: "eggs", EGGS: "eggs", LG: "", XL: "", DZ: "", BUTR: "butter", BTR: "butter", CHS: "cheese",
  CHSE: "cheese", CHED: "cheddar", CHEDR: "cheddar", SHRD: "shredded", MOZZ: "mozzarella", MOZ: "mozzarella", PARM: "parmesan", YOG: "yogurt", YGRT: "yogurt",
  GRK: "greek", SRCRM: "sour cream", SR: "sour", CRM: "cream", HVY: "heavy", WHP: "whipping", BRD: "bread", WHT: "white", TORT: "tortillas", TRTLA: "tortillas",
  PSTA: "pasta", SPAG: "spaghetti", BNS: "beans", BN: "beans", BLK: "black", KDNY: "kidney", TOM: "tomatoes", TOMS: "tomatoes", TMT: "tomatoes", TOMATO: "tomatoes",
  ONN: "onion", ONIONS: "onion", YEL: "", YLW: "", POT: "potatoes", POTS: "potatoes", POTATO: "potatoes", SWT: "sweet", PEPR: "pepper", PPR: "pepper", PEPPER: "pepper",
  GRN: "green", BELL: "bell", CARR: "carrots", CRRT: "carrots", CARROT: "carrots", CELRY: "celery", CEL: "celery", BROC: "broccoli", BRCLI: "broccoli",
  CAUL: "cauliflower", CAULI: "cauliflower", SPNCH: "spinach", SPIN: "spinach", LETT: "lettuce", LTTC: "lettuce", ROM: "romaine", ROMAINE: "romaine",
  MUSH: "mushrooms", MSHRM: "mushrooms", MUSHRM: "mushrooms", ZUCC: "zucchini", ZUCH: "zucchini", CUC: "cucumber", CUKE: "cucumber", AVO: "avocado", AVOC: "avocado",
  AVOCADO: "avocado", BAN: "bananas", BNNA: "bananas", BANANA: "bananas", BANANAS: "bananas", APPL: "apples", APL: "apples", STRWB: "strawberries", STRAWB: "strawberries",
  STRBRY: "strawberries", BLUEB: "blueberries", BLBRY: "blueberries", BLUBRY: "blueberries", LMN: "lemon", LIM: "lime", LIMES: "lime", GRLC: "garlic", CILNTR: "cilantro",
  CIL: "cilantro", SCALL: "scallions", GRNONION: "scallions", JAL: "jalapeno", FRZ: "frozen", FRZN: "frozen", FZ: "frozen", PB: "peanut butter", MAYO: "mayonnaise",
  BRTH: "broth", BROTH: "broth", STK: "stock", OAT: "oats", OATS: "oats", RCE: "rice", PNT: "peanut", SLSA: "salsa", TOFU: "tofu", HAM: "ham", CORN: "corn",
  PEAS: "peas", GRBNZ: "chickpeas", CHKPEA: "chickpeas", LNTL: "lentils", COCO: "coconut", GV: "", KS: "", HT: "", MM: "", SIG: "", ORG: "", ORGANIC: "",
  NAT: "", CLSC: "", FAM: "", PK: "", PKG: "", CT: "", EA: "", OZ: "", LB: "", LBS: "", GAL: "", HLF: "", ITM: "", TX: "", RTL: "", REG: ""
};
const RECEIPT_SKIP = /\b(SUB\s*TOTAL|SUBTOTAL|TOTAL|TAX|CHANGE|CASH|VISA|MASTERCARD|AMEX|DEBIT|CREDIT|BALANCE|SAVINGS|SAVED|COUPON|DISCOUNT|THANK|STORE|TEL|PHONE|MEMBER|ITEMS?\s+SOLD|AUTH|APPROVED|CARD|REWARDS|POINTS|RECEIPT|CASHIER|REGISTER|TRANS|TERMINAL|REFUND|BOTTLE DEP|BAG FEE|WWW|HTTP|SURVEY|ACCOUNT|CHIP|PIN)\b/i;
/* Turn receipt text into likely food lines: [{raw, name, amount, unit}] */
function parseReceipt(text) {
  const out = [];
  const lines = String(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (RECEIPT_SKIP.test(line)) continue;
    if (/\d{1,2}[:/]\d{2}([:/]\d{2,4})?/.test(line) && !/[A-Z]{3,}/i.test(line.replace(/\d/g, ""))) continue;
    const weight = line.match(/(\d+(?:\.\d+)?)\s*(lb|lbs|kg|oz)\b\s*@/i);
    if (weight && out.length && !/[A-Z]{3,}/.test(line.replace(/\b(LB|LBS|KG|OZ)\b/gi, ""))) {
      const last = out[out.length - 1];
      last.amount = Number(weight[1]); last.unit = weight[2].toLowerCase().replace("lbs", "lb");
      const per = line.match(/@\s*\$?(\d+\.\d{2})/);
      if (!last.price && per) last.price = Math.round(last.amount * Number(per[1]) * 100) / 100;
      continue;
    }
    let qty = null;
    const prices = line.match(/\d+\.\d{2}/g);
    const price = prices ? Number(prices[prices.length - 1]) : null;
    const qm = line.match(/^(\d{1,2})\s*(?:@|x)\s/i);
    if (qm) qty = Number(qm[1]);
    let words = line.toUpperCase()
      .replace(/\$?\d+\.\d{2}\s*[A-Z]?\b/g, " ")
      .replace(/\b\d{4,}\b/g, " ")
      .replace(/(\d+(?:\.\d+)?)\s*(LB|LBS|KG|OZ)\s*@.*$/i, " ")
      .replace(/^(\d{1,2})\s*(@|X)\s/, " ")
      .replace(/[^A-Z0-9% ]+/g, " ")
      .split(/\s+/).filter(w => w && !/^\d+%?$/.test(w) && w.length > 1);
    if (!words.length) continue;
    const expanded = words.map(w => (w in RECEIPT_ABBR ? RECEIPT_ABBR[w] : w.toLowerCase())).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (!expanded) continue;
    const key = canon(expanded);
    const known = !!key;
    const name = expanded.replace(/\b\w/g, c => c.toUpperCase());
    out.push({ raw: line, name, amount: qty, unit: "", known, price });
  }
  return out;
}

/* ---------- timers in step text ---------- */
/* "simmer 25 to 30 minutes" -> 30; "1 1/2 hours" -> 90; returns minutes or null */
function stepMinutes(text) {
  const s = String(text).toLowerCase();
  let m = s.match(/(\d+(?:\s+\d\/\d)?|\d\/\d)\s*(?:(?:to|a)\s*(\d+(?:\s+\d\/\d)?))?\s*(?:hours?|horas?)/);
  if (m) return Math.round((parseAmt(m[2] || m[1]) || 0) * 60) || null;
  if (/hora y media|1 hour and a half/.test(s)) return 90;
  m = s.match(/(\d+)\s*(?:(?:to|a)\s*(\d+))?\s*(?:minutes?|minutos?|min)\b/);
  if (m) return Number(m[2] || m[1]) || null;
  return null;
}

/* Add up amounts that share a unit: ["2 cloves","1 clove","3 cloves"] -> ["6 cloves"] */
function sumAmts(list) {
  const groups = new Map(), other = [];
  for (const a of list) {
    const p = parseQty(a);
    if (!p) { if (a && !other.includes(a)) other.push(a); continue; }
    const key = p.rest.trim().toLowerCase().replace(/\b(\w+?)(es|s)\b/g, "$1");
    const gr = groups.get(key) || { q: 0, rest: p.rest, maxQ: 0 };
    gr.q += p.q;
    if (p.q >= gr.maxQ) { gr.maxQ = p.q; if (p.q > 1 || !gr.rest) gr.rest = p.rest; }
    groups.set(key, gr);
  }
  return [...[...groups.values()].map(g => {
    let rest = g.rest;
    if (g.q > 1 && /^\s*(cup|clove|can|slice|head|bunch|handful|fillet|stalk|leaf|taza|lata|rebanada|cabeza)\b/i.test(rest) && !/s\b/i.test(rest)) rest = rest.replace(/^(\s*\w+)/, m => (/(ch|sh)$/i.test(m) ? m + "es" : m + "s"));
    return fmtFrac(g.q) + rest;
  }), ...other];
}
const localAmt = a => LANG === "es" ? amtParts(a)[0] : a;
