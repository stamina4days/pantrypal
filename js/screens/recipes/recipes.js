"use strict";
/* The Recipes tab: the recipe box, the For you, All, and Saved bookmarks, filters, and search. */
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
    if (ppHooks.recipeSorters) Object.assign(sorters, ppHooks.recipeSorters(byName));
    res.sort(sorters[$("#sortSelect").value] || byName);
  }
  recipeResults = res;

  const shown = res.slice(0, recipeLimit);
  $("#recipeCount").textContent = recipeMode !== "foryou" ? tn(res.length, "1 recipe", "{n} recipes")
    : items.length ? tn(res.length, "1 recipe. The ones using food that expires soonest come first.", "{n} recipes. The ones using food that expires soonest come first.")
    : t("Showing quick, popular picks. Add your food any time and these become personal.");

  $("#recipeList").innerHTML = shown.map((x, idx) => {
    const r = x.recipe;
    let tags = familyTagHtml(r);
    tags += hook("recipeTags", x, recipeMode);
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
      if (settings.favorites.includes(r.name)) tags += `<span class="tag fav-tag"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/star.svg#i"/></svg> ${esc(t("Favorite"))}</span>`;
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
      <div class="r-head"><strong>${recipeArt(r, "r-emoji")}${esc(rName(r))}</strong><span class="muted small">${t("{n} min", { n: r.time })}</span></div>
      <div class="r-tags">${tags}</div></li>`;
  }).join("") || `<p class="empty">${esc(recipeMode === "saved" ? t("Nothing saved yet. Tap the star on any recipe, or add your own.") : t("No recipes match. Try loosening the filters."))}</p>`;
  $("#moreRecipes").classList.toggle("hidden", res.length <= recipeLimit);
}
