/* Recipe collections shown on the Recipes tab. Each one is a test on a recipe. */
const COLLECTIONS = [
  { id: "use-it-up", emoji: "⏰", color: "tomato", name: "Use it up", desc: "Recipes that rescue food that's about to go bad.", needsFood: true,
    test: (r, x) => x && x.have.some(h => !h.g.basic && h.d !== null && h.d >= 0 && h.d <= 3) },
  { id: "can-make", emoji: "✅", color: "leaf", name: "Make it now", desc: "You already have everything for these.", needsFood: true,
    test: (r, x) => x && !x.missing.length && !x.short.length },
  { id: "quick", emoji: "⚡", color: "lemon", name: "Ready in 20", desc: "On the table in 20 minutes or less.", test: r => r.time <= 20 && r.type !== "Drink" },
  { id: "meal-prep", emoji: "🍱", color: "plum", name: "Meal prep", desc: "Cook once, eat for days.", test: r => r.prep },
  { id: "freezer", emoji: "❄️", color: "sea", name: "Freezer friendly", desc: "Make extra and freeze it for a busy night.", test: r => r.freezes },
  { id: "kids", emoji: "🧒", color: "lemon", name: "Kid-friendly", desc: "Mild, familiar, and easy to love.", test: r => r.kid },
  { id: "budget", emoji: "💵", color: "leaf", name: "Budget bites", desc: "About $2.50 or less a serving.", test: r => costOf(r) <= 2.5 && ["Breakfast", "Lunch", "Dinner"].includes(r.type) },
  { id: "protein", emoji: "💪", color: "tomato", name: "High protein", desc: "25 grams of protein or more a serving.", test: r => nutritionOf(r).protein >= 25 },
  { id: "light", emoji: "🥗", color: "leaf", name: "Lighter meals", desc: "Lunches and dinners at 500 calories or less.", test: r => ["Lunch", "Dinner"].includes(r.type) && nutritionOf(r).cal <= 500 },
  { id: "slow-cooker", emoji: "🍲", color: "plum", name: "Set it and forget it", desc: "Slow cooker and pressure cooker meals.", test: r => r.equip.some(e => /slowcooker|pressure/.test(e)) },
  { id: "breakfast", emoji: "🍳", color: "lemon", name: "Breakfast", desc: "Good mornings start here.", test: r => r.type === "Breakfast" },
  { id: "sweet", emoji: "🍰", color: "tomato", name: "Something sweet", desc: "Desserts and treats.", test: r => r.type === "Dessert" },
  { id: "mexican", emoji: "🌮", color: "tomato", name: "Mexican", desc: "Tacos, bowls, burritos, and more.", test: r => r.cuisine === "Mexican" },
  { id: "italian", emoji: "🍝", color: "leaf", name: "Italian", desc: "Pasta night, every night.", test: r => r.cuisine === "Italian" },
  { id: "asian", emoji: "🥢", color: "sea", name: "Asian", desc: "Stir-fries, fried rice, and bowls.", test: r => r.cuisine === "Asian" },
  { id: "indian", emoji: "🍛", color: "lemon", name: "Indian", desc: "Curries full of flavor.", test: r => r.cuisine === "Indian" },
  { id: "mediterranean", emoji: "🫒", color: "plum", name: "Mediterranean", desc: "Fresh, bright, and easy.", test: r => r.cuisine === "Mediterranean" },
  { id: "american", emoji: "🍔", color: "sea", name: "American", desc: "Comfort food classics.", test: r => r.cuisine === "American" }
];
