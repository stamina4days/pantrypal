/* Ideas for turning leftovers into a new meal, by the kind of dish they came from. */
const REMIX = {
  asian: ["Wrap it in a warm tortilla with a little cheese for a quick quesadilla.",
    "Toss it with cooked noodles and a splash of soy sauce.",
    "Top a bowl of it with a fried egg."],
  mexican: ["Make quesadillas or nachos with cheese.",
    "Stuff it into baked potatoes.",
    "Turn it into a bowl over rice and lettuce."],
  saucy: ["Serve it over a baked potato or rice.",
    "Thin it with broth for a quick soup.",
    "Spoon it into a tortilla for a wrap."],
  pasta: ["Bake it with extra cheese on top until crispy.",
    "Stir it into beaten eggs and bake for a pasta frittata."],
  roasted: ["Chop it up for a rice bowl or salad.",
    "Fold it into an omelette or quesadilla."],
  any: ["Fold it into a quesadilla or omelette.",
    "Serve it over rice or greens with a fried egg."]
};
const REMIX_GROUP = { "stir-fry": "asian", "fried-rice": "asian", "soy-bowl": "asian", tacos: "mexican", "burrito-bowl": "mexican", burrito: "mexican",
  quesadilla: "mexican", "Chicken Fajitas": "mexican", curry: "saucy", chili: "saucy", "chicken-soup": "saucy", "blended-soup": "saucy",
  "slow-cooker": "saucy", "Easy Beef Chili": "saucy", "Beef Stew": "saucy", pasta: "pasta", "pasta-bake": "pasta", "Spaghetti Bolognese": "pasta",
  "sheet-pan": "roasted", "med-bowl": "roasted" };
