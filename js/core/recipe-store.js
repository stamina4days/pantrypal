"use strict";
/* All recipes. The loader fills RECIPES from data/recipes when the app starts.
   Each built-in recipe is its own file, so adding one is just adding a file. */
const RECIPES = [];

/* "Chicken Fried Rice" -> "chicken-fried-rice" (used for file names and page addresses) */
function recipeSlug(name) {
  return String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function recipeBySlug(slug) {
  return RECIPES.find(r => (r.id || recipeSlug(r.name)) === slug) || null;
}

/* Fill in anything a recipe left out, so your own recipes work with the planner too. */
function fillRecipeDefaults(r) {
  r.id = r.id || recipeSlug(r.name);
  r.cuisine = r.cuisine || "American";
  r.keeps = r.keeps == null ? 3 : r.keeps;
  r.equip = r.equip || [];
  r.family = r.family || r.name;
  if (r.prep == null) r.prep = r.keeps >= 3 && ["Breakfast", "Lunch", "Dinner"].includes(r.type);
  return r;
}
