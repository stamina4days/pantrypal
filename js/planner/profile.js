"use strict";
/* Household profile and what you can make. */
/* Automatic meal planning and prep-day building.
   The planner walks through the days in order. For each meal it scores every recipe that fits
   your profile: food that expires soonest counts most, leftovers from things you'll buy that
   week count extra (so ingredients get shared), and missing items, repeats, and long weeknight
   cooking count against it. */

function profile() {
  return Object.assign({
    people: 2, appetite: 1, weeknight: 45, weekend: 90, cuisines: [], dislikes: "",
    equipment: ["oven", "microwave", "blender"], lunches: true, breakfasts: false, prepDay: 0, kids: false, weeklyBudget: 0, goal: ""
  }, settings.household || {});
}
const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000);
function equipOK(r, eq) {
  return !r.equip || r.equip.every(e => e.split("|").some(x => eq.includes(x)));
}
function dislikeKeys() {
  return String(profile().dislikes || "").split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
    .map(w => ({ key: canon(w), word: norm(w).trim() }));
}
function hasDisliked(r, dk) {
  if (!dk.length) return false;
  const nm = norm(r.name + " " + (r.es ? r.es.name : ""));
  return dk.some(d => (d.key && r.ingredients.some(g => !g.opt && related(d.key, g.key))) || (d.word && nm.includes(" " + d.word + " ")));
}
/* Can this person make this recipe at all? (diet, equipment, dislikes, thumbs down) */
function fitsProfile(r, dk) {
  if (!recipeAllowed(r, settings.diets)) return false;
  if (settings.household && !equipOK(r, profile().equipment)) return false;
  if ((settings.ratings || {})[r.name] === -1) return false;
  return !hasDisliked(r, dk || dislikeKeys());
}
/* Servings for this household. Desserts, drinks, and snacks keep their own size. */
function householdServings(r) {
  if (!settings.household || !["Breakfast", "Lunch", "Dinner", "Side"].includes(r.type)) return r.serves;
  const P = profile();
  return Math.max(1, Math.round(P.people * P.appetite));
}
