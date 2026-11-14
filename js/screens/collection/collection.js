"use strict";
/* A collection of recipes around one idea. */
let collectionId = null, collectionSort = "best", collectionLimit = 30;

function collectionResults(c) {
  const pool = availablePool(), dk = dislikeKeys();
  return RECIPES.filter(r => recipeAllowed(r, settings.diets) && !hasDisliked(r, dk))
    .map(r => ({ r, x: evaluate(r, pool, settings.diets, householdServings(r) / r.serves) }))
    .filter(({ r, x }) => { try { return c.test(r, x); } catch (e) { return false; } })
    .map(o => o.x);
}

function openCollection(id) {
  const c = COLLECTIONS.find(x => x.id === id);
  if (!c) return false;
  collectionId = id; collectionSort = "best"; collectionLimit = 30;
  setPressed("#colSort", $('#colSort [data-sort="best"]'));
  renderCollection();
  $("#collectionPage").showModal();
}

function renderCollection() {
  const c = COLLECTIONS.find(x => x.id === collectionId);
  if (!c) return;
  const page = $("#collectionPage");
  page.dataset.color = c.color;
  $("#colEmoji").textContent = c.emoji;
  $("#colName").textContent = t(c.name);
  $("#colDesc").textContent = t(c.desc);
  const res = collectionResults(c);
  const sorters = {
    best: (a, b) => a.missing.length - b.missing.length || b.score - a.score,
    time: (a, b) => a.recipe.time - b.recipe.time,
    cost: (a, b) => costOf(a.recipe) - costOf(b.recipe)
  };
  res.sort(sorters[collectionSort]);
  $("#colCount").textContent = tn(res.length, "1 recipe", "{n} recipes");
  $("#colList").innerHTML = res.slice(0, collectionLimit).map(x => {
    const note = collectionSort === "cost" ? fmtMoney(costOf(x.recipe)) + " " + t("a serving")
      : items.length ? (x.missing.length ? tn(x.missing.length, "need 1 thing", "need {n} things") : t("you have everything"))
      : t(x.recipe.type);
    return recipeMiniHtml(x.recipe, note);
  }).join("") || `<li class="empty-art"><img src="img/illustrations/no-recipes.svg" width="180" height="139" alt=""><p>${esc(c.needsFood ? t("Add some food to My Food and this fills up.") : t("No recipes here fit your diet yet."))}</p></li>`;
  $("#colMore").classList.toggle("hidden", res.length <= collectionLimit);
}
