"use strict";
/* Small cards shared by several pages. */

/* A compact recipe row that links to the recipe's page. */
function recipeMiniHtml(r, note) {
  return `<li><a class="recipe-mini" href="#/recipe/${esc(recipeId(r))}">
    <span class="r-emoji" aria-hidden="true">${recipeEmoji(r)}</span>
    <span class="grow"><strong>${esc(rName(r))}</strong><span class="muted small">${esc(t("{n} min", { n: r.time }))}${note ? ", " + esc(note) : ""}</span></span>
    <span class="go" aria-hidden="true">&#8250;</span></a></li>`;
}

/* A compact food row that links to the food's page. */
function foodMiniHtml(i) {
  const lab = expiryLabel(daysLeft(i.expires));
  return `<li><a class="food-mini ${lab.cls}" href="#/food/${esc(i.id)}">
    <span class="food-emoji" aria-hidden="true">${foodEmoji(i.name, i)}</span>
    <span class="grow"><strong>${esc(i.name)}</strong><span class="muted small">${esc([amountText(i), locLabel(i.location)].filter(Boolean).join(", "))}</span></span>
    <span class="badge ${lab.cls}">${esc(lab.text)}</span></a></li>`;
}

/* Best recipes that use a given food, using what you have. */
function recipesUsing(name, limit) {
  const key = canon(name);
  if (!key) return [];
  const pool = availablePool(), dk = dislikeKeys();
  return RECIPES.filter(r => r.ingredients.some(g => !g.basic && related(key, g.key)) && fitsProfile(r, dk))
    .map(r => evaluate(r, pool, settings.diets, householdServings(r) / r.serves))
    .sort((a, b) => a.missing.length - b.missing.length || b.score - a.score)
    .slice(0, limit || 5);
}
