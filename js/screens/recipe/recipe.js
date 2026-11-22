"use strict";
/* A recipe. */
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
  $("#recipeEmoji").innerHTML = recipeArt(r, "hero-art-img");
  if (typeof renderRecipeNote === "function") renderRecipeNote();
  $("#favBtn").innerHTML = fav ? `<svg class="ic on" aria-hidden="true"><use href="img/icons/ui/star.svg#i"/></svg>` : `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/star.svg#i"/></svg>`;
  $("#favBtn").setAttribute("aria-pressed", fav);
  $("#favBtn").setAttribute("aria-label", fav ? t("Remove from favorites") : t("Add to favorites"));
  const labels = r.labels.map(l => t(DIETS[l].label)).join(", ");
  $("#recipeMeta").innerHTML = [t(r.type), t(r.cuisine), t("about {n} minutes", { n: r.time }) + (r.wait ? " " + r.wait : ""), labels,
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
    if (s) return `<li class="subbed">${label}<span class="swap">${esc(t("Substitute:"))} ${esc(s.sub.note)}${s.item ? " (" + esc(s.item.name) + ")" : ""}</span>${swap}</li>`;
    if (g.opt) return `<li class="optional">${label} <span class="small">(${esc(t("optional"))})</span>${swap}</li>`;
    return `<li class="missing">${label}${swap}</li>`;
  }).join("");
  const scaleNote = Math.abs(f - 1) > 1e-9 ? `<p class="muted small">${esc(t("Amounts are adjusted. Cooking times may change a little for bigger or smaller batches."))}</p>` : "";
  const airNote = r.airfry && profile().equipment.includes("airfryer") ? `<p class="tip small">${esc(r.airfry)}</p>` : "";
  $("#recipeBody").innerHTML = `
    <h3>${esc(t("Ingredients"))}</h3><ul class="ings">${ingHtml}</ul>${scaleNote}
    <h3>${esc(t("Steps"))}</h3><ol class="steps">${rSteps(r).map(s => `<li>${esc(s)}</li>`).join("")}</ol>${airNote}`;
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
