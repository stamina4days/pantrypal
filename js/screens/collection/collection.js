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
const collectionDef = id => COLLECTIONS.find(x => x.id === id) || (id === "rescue" ? RESCUE : null);

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
  collectionId = id; collectionSort = "best"; collectionLimit = 30;
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
  const res = collectionResults(c);
  const sorters = {
    best: c.rescue ? (a, b) => rescueWeight(b) - rescueWeight(a) || a.missing.length - b.missing.length || b.score - a.score
      : (a, b) => a.missing.length - b.missing.length || b.score - a.score,
    time: (a, b) => a.recipe.time - b.recipe.time,
    cost: (a, b) => costOf(a.recipe) - costOf(b.recipe)
  };
  res.sort(sorters[collectionSort]);
  $("#colCount").textContent = tn(res.length, "1 recipe", "{n} recipes");
  $("#colList").innerHTML = res.slice(0, collectionLimit).map(x => {
    const need = x.missing.length ? tn(x.missing.length, "need 1 thing", "need {n} things") : t("you have everything");
    const note = c.rescue && collectionSort !== "cost" ? t("uses your {foods}", { foods: listJoin(rescueUses(x).map(i => i.name)) }) + ", " + need
      : collectionSort === "cost" ? fmtMoney(costOf(x.recipe)) + " " + t("a serving")
      : items.length ? (x.missing.length ? tn(x.missing.length, "need 1 thing", "need {n} things") : t("you have everything"))
      : t(x.recipe.type);
    return recipeMiniHtml(x.recipe, note);
  }).join("") || `<li class="empty-art"><img src="img/illustrations/no-recipes.svg" width="180" height="139" alt=""><p>${esc(c.needsFood ? t("Add some food to My Food and this fills up.") : t("No recipes here fit your diet yet."))}</p></li>`;
  $("#colMore").classList.toggle("hidden", res.length <= collectionLimit);
}
