"use strict";
/* Works out calories, protein, carbs, and fat per serving from the ingredients. The result is saved on
   the recipe (r._nutr) so it's only worked out once. */
function nutritionOf(r) {
  if (r._nutr) return r._nutr;
  let cal = 0, protein = 0, carbs = 0, fat = 0, known = 0, total = 0;
  for (const g of r.ingredients) {
    if (g.opt) continue;
    const grams = ingGrams(g, 1);
    if (grams == null) continue;
    total++;
    const n = byKey("nutr", NUTR, g.key);
    if (!n) continue;
    known++;
    cal += n[0] * grams / 100; protein += n[1] * grams / 100; carbs += n[2] * grams / 100; fat += n[3] * grams / 100;
  }
  const s = r.serves || 4;
  r._nutr = { cal: cal / s, protein: protein / s, carbs: carbs / s, fat: fat / s, coverage: total ? known / total : 1 };
  return r._nutr;
}
