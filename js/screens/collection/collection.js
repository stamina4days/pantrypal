"use strict";
/* A collection of recipes around one idea. */
let collectionId = null, collectionSort = "best", collectionLimit = 30;

/* Cook with what's expiring: recipes that use the food closest to its date, the most of it first.
   It opens like any collection but isn't one of the cards on Recipes. */
const RESCUE_DAYS = 4;
const RESCUE = { id: "rescue", art: "food/leafy", color: "tomato", name: "Cook with what's expiring", needsFood: true, rescue: true,
  desc: "Recipes that use up the food closest to its date, starting with the ones that save the most.",
  test: (r, x) => x && rescueUses(x).length > 0 };
function rescueUses(x) {
  const seen = new Set();
  return x.have.filter(h => !h.g.basic && h.item && h.d !== null && h.d >= 0 && h.d <= RESCUE_DAYS)
    .map(h => h.item).filter(i => !seen.has(i.id) && seen.add(i.id));
}
const rescueWeight = x => x._rw ?? (x._rw = rescueUses(x).reduce((s, i) => s + (RESCUE_DAYS + 1 - Math.max(0, daysLeft(i.expires))), 0));
/* What can I cook? The big button on Today. Recipes you can make right now with no shopping, then ones that
   need just one thing, with quick filters. Like Cook with what's expiring, it isn't one of the cards on Recipes. */
const COOK_NOW = { id: "cook-now", art: "dishes/bowl", color: "leaf", name: "What can I cook?", needsFood: true, cookNow: true,
  desc: "Recipes you can make with what's in your kitchen right now. The ones that need nothing from the store come first.",
  test: (r, x) => x && r.type !== "Drink" && x.missing.length + x.short.length <= 1 };
let cookNowFilter = "all";
const COOK_FILTERS = {
  all: () => true,
  ready: x => !x.missing.length && !x.short.length,
  quick: x => x.recipe.time <= 20,
  expiring: x => rescueUses(x).length > 0
};
const collectionDef = id => COLLECTIONS.find(x => x.id === id) || (id === "rescue" ? RESCUE : id === "cook-now" ? COOK_NOW : null);
/* How many recipes you can make with nothing from the store, for the button on Today. Worked out again only when your food changes. */
let cookNowCache = { sig: null, n: 0 };
function cookNowCount() {
  if (!items.length) return 0;
  const sig = items.map(i => i.id + ":" + (i.amount ?? "") + ":" + (i.location || "") + ":" + (i.expires || "")).join("|") + "|" + settings.diets.join(",") + "|" + !!settings.assumeBasics + "|" + !!settings.useSubs;
  if (cookNowCache.sig === sig) return cookNowCache.n;
  const n = collectionResults(COOK_NOW).filter(COOK_FILTERS.ready).length;
  cookNowCache = { sig, n };
  return n;
}

function collectionResults(c) {
  const pool = availablePool(), dk = dislikeKeys();
  return RECIPES.filter(r => recipeAllowed(r, settings.diets) && !hasDisliked(r, dk))
    .map(r => ({ r, x: evaluate(r, pool, settings.diets, householdServings(r) / r.serves) }))
    .filter(({ r, x }) => { try { return c.test(r, x); } catch (e) { return false; } })
    .map(o => o.x);
}

function openCollection(id) {
  const c = collectionDef(id);
  if (!c) return false;
  collectionId = id; collectionSort = "best"; collectionLimit = 30; cookNowFilter = "all";
  setPressed("#colFilter", $('#colFilter [data-filter="all"]'));
  setPressed("#colSort", $('#colSort [data-sort="best"]'));
  renderCollection();
  $("#collectionPage").showModal();
}

function renderCollection() {
  const c = collectionDef(collectionId);
  if (!c) return;
  const page = $("#collectionPage");
  page.dataset.color = c.color;
  $("#colEmoji").innerHTML = `<img class="hero-art-img" src="img/${c.art}.svg" alt="">`;
  $("#colName").textContent = t(c.name);
  $("#colDesc").textContent = t(c.desc);
  $("#colFilter").classList.toggle("hidden", !c.cookNow);
  let res = collectionResults(c);
  if (c.cookNow) res = res.filter(COOK_FILTERS[cookNowFilter] || COOK_FILTERS.all);
  const sorters = {
    best: c.cookNow ? (a, b) => (a.missing.length + a.short.length) - (b.missing.length + b.short.length) || rescueWeight(b) - rescueWeight(a) || b.score - a.score
      : c.rescue ? (a, b) => rescueWeight(b) - rescueWeight(a) || a.missing.length - b.missing.length || b.score - a.score
      : (a, b) => a.missing.length - b.missing.length || b.score - a.score,
    time: (a, b) => a.recipe.time - b.recipe.time,
    cost: (a, b) => costOf(a.recipe) - costOf(b.recipe)
  };
  res.sort(sorters[collectionSort]);
  $("#colCount").textContent = tn(res.length, "1 recipe", "{n} recipes");
  $("#colList").innerHTML = res.slice(0, collectionLimit).map(x => {
    const need = x.missing.length ? tn(x.missing.length, "need 1 thing", "need {n} things") : t("you have everything");
    const what = x.missing[0] ? x.missing[0].name || x.missing[0].key : x.short[0] ? (x.short[0].g.name || x.short[0].g.key) : "";
    const note = c.cookNow && collectionSort !== "cost"
      ? (x.missing.length || x.short.length ? t("just need {what}", { what: x.missing.length ? what : t("more {what}", { what }) }) : t("you have everything"))
        + (rescueUses(x).length ? ", " + t("uses your {foods}", { foods: listJoin(rescueUses(x).map(i => i.name)) }) : "")
      : c.rescue && collectionSort !== "cost" ? t("uses your {foods}", { foods: listJoin(rescueUses(x).map(i => i.name)) }) + ", " + need
      : collectionSort === "cost" ? fmtMoney(costOf(x.recipe)) + " " + t("a serving")
      : items.length ? (x.missing.length ? tn(x.missing.length, "need 1 thing", "need {n} things") : t("you have everything"))
      : t(x.recipe.type);
    return recipeMiniHtml(x.recipe, note);
  }).join("") || `<li class="empty-art"><img src="img/illustrations/no-recipes.svg" width="180" height="139" alt=""><p>${esc(c.cookNow && items.length && cookNowFilter !== "all"
      ? t("Nothing fits that right now. Try All.")
      : c.needsFood ? t("Add some food to My Food and this fills up.") : t("No recipes here fit your diet yet."))}</p>${c.cookNow && !items.length
      ? `<button type="button" class="primary" data-cooknow-add>${esc(t("Add food"))}</button>` : ""}</li>`;
  $("#colMore").classList.toggle("hidden", res.length <= collectionLimit);
}
