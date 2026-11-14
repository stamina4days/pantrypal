"use strict";
/* Diets and allergies. */
/* ---------- diets ---------- */
const DIETS = {
  vegetarian: { label: "Vegetarian", ex: ["meat", "pork", "fish", "shellfish"], swap: { broth: "use vegetable broth" } },
  vegan: { label: "Vegan", ex: ["meat", "pork", "fish", "shellfish", "dairy", "egg", "honey"],
    swap: { broth: "use vegetable broth", milk: "use a plant milk", butter: "use oil or vegan butter",
      yogurt: "use a plant-based yogurt", cream: "use full-fat coconut milk", mayonnaise: "use vegan mayo", honey: "use maple syrup" } },
  nopork: { label: "No pork", ex: ["pork"], swap: { bacon: "use turkey bacon", sausage: "use chicken or turkey sausage", ham: "use turkey ham" } },
  glutenfree: { label: "Gluten-free", ex: ["gluten"],
    swap: { "soy sauce": "use tamari (gluten-free soy sauce)", pasta: "use gluten-free pasta", tortillas: "use corn tortillas",
      bread: "use gluten-free bread", flour: "use a 1-to-1 gluten-free flour blend", breadcrumbs: "use gluten-free breadcrumbs",
      oats: "use certified gluten-free oats" } },
  dairyfree: { label: "Dairy-free", ex: ["dairy"],
    swap: { milk: "use a plant milk", butter: "use oil or dairy-free butter", yogurt: "use a dairy-free yogurt", cream: "use full-fat coconut milk" } },
  eggfree: { label: "Egg-free", ex: ["egg"], swap: { mayonnaise: "use egg-free mayo" } },
  nutfree: { label: "Nut-free", ex: ["nut"], swap: {} },
  fishfree: { label: "No fish", ex: ["fish"], swap: {} },
  shellfishfree: { label: "No shellfish", ex: ["shellfish"], swap: {} }
};
const CARD_LABELS = ["vegan", "vegetarian", "glutenfree", "dairyfree"];
let ALLERGEN_SETS = {};

function dietCheck(g, diets) {
  let blocked = false;
  const swaps = [];
  for (const id of diets) {
    const d = DIETS[id];
    if (!d || !g.flags.some(f => d.ex.includes(f))) continue;
    const ch = chain(g.key);
    const k = Object.keys(d.swap).find(s => ch.includes(norm(s)));
    if (k) swaps.push(d.swap[k]); else blocked = true;
  }
  return { blocked, swaps: [...new Set(swaps)] };
}
const recipeAllowed = (r, diets) => !diets.length || r.ingredients.every(g => g.opt || !dietCheck(g, diets).blocked);
const strictlyFits = (r, id) => r.ingredients.every(g => g.opt || !g.flags.some(f => DIETS[id].ex.includes(f)));
