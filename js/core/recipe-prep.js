"use strict";
/* Getting recipes ready to search and match. */
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
  delete r.es; delete r.waitEs; delete r.airfryEs;   // older recipe files still carry Spanish text; the app is English only
  r.serves = r.serves || SERVES[r.name] || 4;
  const pg = PROTEIN_GROUPS.find(([, keys]) => r.ingredients.some(g => !g.opt && keys.some(k => chain(g.key).includes(norm(k)))));
  r.protein = pg ? pg[0] : "veg";
  r.labels = CARD_LABELS.filter(id => strictlyFits(r, id));
  if (r.labels.includes("vegan")) r.labels = r.labels.filter(l => l !== "vegetarian");
  r.search = [r.name, r.type, t(r.type),
    ...r.ingredients.map(g => g.name)].join(" ")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function buildMatcher() {
  for (const r of RECIPES) r.ing.forEach(s => addPhrase((s.split("|")[1] || "").trim()));
  for (const b of BASICS) { addPhrase(b); BASIC_SET.add(norm(b)); }
  for (const [child, parent] of Object.entries(PARENTS)) {
    PHRASES.set(norm(child), norm(child)); addPhrase(parent); PARENT.set(norm(child), norm(parent));
  }
  for (const [alias, target] of Object.entries(ALIASES)) PHRASES.set(norm(alias), norm(target));
  for (const ig of IGNORE) PHRASES.set(norm(ig), "");
  SUBS.forEach(s => [s.need, ...s.use].forEach(addPhrase));
  for (const [cat, list] of Object.entries(ALLERGENS)) ALLERGEN_SETS[cat] = list.map(norm);
  SUBS_PREP = SUBS.map(s => ({ ...s, needKey: canon(s.need), useKeys: s.use.map(canon) }));
  canonCache.clear();
  RECIPES.forEach(prepareRecipe);
}

/* Your own recipes live alongside the built-in ones. */
function mineToRecipe(m) { return fillRecipeDefaults({ ...m, mine: true }); }
function addMineToRecipes(m) {
  m.ing.forEach(s => addPhrase((s.split("|")[1] || "").trim()));
  canonCache.clear();
  const r = mineToRecipe(m);
  prepareRecipe(r);
  RECIPES.push(r);
  return r;
}
const recipeByName = n => RECIPES.find(r => r.name === n);
