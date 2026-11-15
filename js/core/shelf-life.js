"use strict";
/* How long food keeps. */
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
