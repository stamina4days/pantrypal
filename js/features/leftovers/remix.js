"use strict";
/* Ideas for turning leftovers into a new meal, shown on a leftover's page. */
function remixHtml(item) {
  const r = item.recipe && recipeByName(item.recipe);
  const group = r ? (REMIX_GROUP[r.family] || (r.cuisine === "Mexican" ? "mexican" : r.cuisine === "Asian" ? "asian" : "any")) : "any";
  const ideas = REMIX[group].concat(group === "any" ? [] : REMIX.any.slice(0, 1));
  return `<div class="tip"><strong>${esc(t("Ideas for these leftovers"))}</strong><ul>${ideas.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`;
}
