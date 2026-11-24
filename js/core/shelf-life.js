"use strict";
/* How long food keeps, and where it belongs. Canned, boxed, and dried versions of a food (canned tomatoes,
   chicken broth) get the long pantry time, not the fresh food's few days. */
function shelfDirect(n) {
  let best = null, bestLen = 0;
  for (const k of Object.keys(SHELF_LIFE)) {
    const p = norm(k);
    if (p.length > bestLen && n.includes(p)) { best = k; bestLen = p.length; }
  }
  return best;
}
/* Canned, boxed, and dried foods keep for months in the pantry, even when the food inside (tomatoes, chicken) wouldn't.
   Leftovers, prepped meals, and anything fresh or frozen are left alone. */
const SHELF_STABLE = /\b(canned|can of|cans of|tinned|jarred|boxed|carton of|dried|dry|instant|evaporated|condensed|powdered|uht|shelf stable|soup|broth|stock|bouillon)\b/;
const NOT_STABLE = /\b(fresh|frozen|leftovers?|prepped|homemade|cooked|opened)\b/;
function packagedKey(name) {
  const n = norm(name);
  if (!SHELF_STABLE.test(n) || NOT_STABLE.test(n)) return null;
  if (/\b(broth|stock|bouillon)\b/.test(n) && SHELF_LIFE.broth) return "broth";
  return SHELF_LIFE.canned ? "canned" : null;
}
/* Works for English names and synonyms. */
function shelfLookup(name) {
  const packed = packagedKey(name);
  if (packed) return packed;
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
/* Foods that can go in the fridge but usually live out of it. */
const ROOM_TEMP = { banana: "Counter", avocado: "Counter", tomato: "Counter", peach: "Counter", mango: "Counter",
  pineapple: "Counter", onion: "Pantry", bread: "Pantry" };
function guessLoc(name) {
  if (packagedKey(name)) return "Pantry";
  const key = shelfLookup(name);
  if (key && ROOM_TEMP[key]) return ROOM_TEMP[key];
  return key && SHELF_LIFE[key][0] != null ? "Fridge" : "Pantry";
}
const locLabel = l => DEFAULT_LOCATIONS.includes(l) ? t(l) : l;
function locFromInput(v) {
  v = (v || "").trim();
  const hit = DEFAULT_LOCATIONS.find(l => l.toLowerCase() === v.toLowerCase() || t(l).toLowerCase() === v.toLowerCase());
  return hit || v || "Other";
}
const isStaple = name => settings.staples.includes(norm(name));
/* Before version 11.17.2, canned, boxed, and dried foods got the fresh food's date (canned tomatoes got 5 days).
   This runs once per kitchen and fixes the ones still on that short guess, so they stop showing up as expired.
   settings.packagedFix marks it done. */
function fixPackagedDates() {
  if (settings.packagedFix || typeof items === "undefined") return;
  let n = 0;
  items.forEach(i => {
    const key = packagedKey(i.name || "");
    if (!key || i.leftover || !i.expires || locIndex(i.location) === 2) return;
    const from = i.bought || i.added;
    if (!from) return;
    const span = Math.round((parseDay(i.expires) - parseDay(from)) / 86400000);
    if (span > 14) return;
    i.location = "Pantry";
    i.expires = addDaysFrom(from, SHELF_LIFE[key][1]);
    n++;
  });
  settings.packagedFix = true;
  if (n) saveItems();
  saveSettings();
}
