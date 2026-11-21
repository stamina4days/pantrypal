/* Badges you earn for wasting less and cooking more.
   test(s) gets a summary of your history and returns [progress, goal]. */
const BADGES = [
  { id: "first-food", name: "Stocked up", desc: "Add your first food.", test: s => [s.added, 1] },
  { id: "audit-done", name: "Shelf check", desc: "Finish a pantry audit.", test: s => [s.audits, 1] },
  { id: "first-rescue", name: "First rescue", desc: "Use something in its last 3 days.", test: s => [s.rescued, 1] },
  { id: "rescue-10", name: "Rescue squad", desc: "Rescue 10 foods before they go bad.", test: s => [s.rescued, 10] },
  { id: "first-cook", name: "First dish", desc: "Cook a recipe and tap \"I made this\".", test: s => [s.cooked, 1] },
  { id: "cook-10", name: "Home cook", desc: "Cook 10 meals.", test: s => [s.cooked, 10] },
  { id: "cook-50", name: "Kitchen hero", desc: "Cook 50 meals.", test: s => [s.cooked, 50] },
  { id: "planner", name: "Week planner", desc: "Plan 5 meals ahead.", test: s => [s.planned, 5] },
  { id: "prep-pro", name: "Prep pro", desc: "Finish a prep day.", test: s => [s.prepped, 1] },
  { id: "freezer-friend", name: "Freezer friend", desc: "Freeze 3 things to save them.", test: s => [s.frozen, 3] },
  { id: "list-maker", name: "List maker", desc: "Check off 20 things on your shopping lists.", test: s => [s.checked, 20] },
  { id: "receipt-reader", name: "Receipt reader", desc: "Add food by scanning a receipt.", test: s => [s.receipts, 1] },
  { id: "world-kitchen", name: "World kitchen", desc: "Cook recipes from 4 different cuisines.", test: s => [s.cuisines, 4] },
  { id: "zero-waste-week", name: "Zero waste week", desc: "Go 7 days in a row without tossing food, while using at least 3 things.", test: s => [s.cleanWeek ? 1 : 0, 1] },
  { id: "streak-7", name: "On a roll", desc: "Open Pantry Pal 7 days in a row.", test: s => [s.streak, 7] },
  { id: "my-recipe", name: "Recipe writer", desc: "Add a recipe of your own.", test: s => [s.mine, 1] },
  { id: "saver", name: "Money saver", desc: "Save about $50 of food from the trash.", test: s => [Math.floor(s.saved), 50] },
  { id: "little-helper", name: "Little helper", desc: "Cook a recipe with a kid's help.", test: s => [s.helper, 1] },
  { id: "night-owl", name: "Midnight snack", desc: "Cook something after 10 pm.", test: s => [s.lateCook, 1] }
];
