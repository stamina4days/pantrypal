/* "Today's special" on My Food. When nothing needs rescuing, each day of the week has a theme.
   Index 0 is Sunday. test(r) says whether a recipe fits the theme. */
const DAY_SPECIALS = [
  { name: "Soup Sunday", why: "Make a big pot today and you've got lunches all week.", test: r => ["blended-soup", "chicken-soup", "stew", "chili", "slow-cooker"].includes(r.family) },
  { name: "Meatless Monday", why: "Give the meat a day off. Nobody will miss it.", test: r => r.protein === "veg" && ["Lunch", "Dinner"].includes(r.type) },
  { name: "Taco Tuesday", why: "It's the law. Well, it should be.", test: r => ["tacos", "burrito", "burrito-bowl", "quesadilla"].includes(r.family) || (r.cuisine === "Mexican" && r.type === "Dinner") },
  { name: "Wok Wednesday", why: "Fast, hot, and a great way to use up vegetables.", test: r => ["stir-fry", "fried-rice", "soy-bowl"].includes(r.family) },
  { name: "Throwback Thursday", why: "An old favorite, the way you remember it.", test: r => r.family === r.name && ["Lunch", "Dinner"].includes(r.type) },
  { name: "Pasta Friday", why: "End the week with a big bowl of noodles.", test: r => ["pasta", "pasta-bake"].includes(r.family) || (r.cuisine === "Italian" && r.type === "Dinner") },
  { name: "Brunch Saturday", why: "Sleep in, then make something good.", test: r => r.type === "Breakfast" && r.time >= 15 }
];
