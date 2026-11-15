/* Which drawing in img/food/ goes with each food, and which dish drawing in img/dishes/ goes with each recipe. */
const FOOD_STICKER = {
  egg: "egg", milk: "milk", cheese: "cheese", butter: "butter", yogurt: "yogurt", cream: "milk", "sour cream": "yogurt", "cream cheese": "butter",
  chicken: "chicken", "ground beef": "steak", beef: "steak", steak: "steak", "stew meat": "steak", pork: "steak", turkey: "chicken", "ground turkey": "steak",
  bacon: "bacon", ham: "ham", sausage: "sausage", fish: "fish", salmon: "salmon", tuna: "tuna", shrimp: "shrimp", tofu: "tofu",
  bread: "bread", tortilla: "tortilla", rice: "rice", pasta: "pasta", spaghetti: "pasta", macaroni: "pasta", "egg noodle": "noodles", noodle: "noodles",
  oat: "oats", granola: "oats", cereal: "cereal", potato: "potato", "sweet potato": "sweet-potato",
  carrot: "carrot", onion: "onion", garlic: "garlic", tomato: "tomato", "canned tomato": "can", "tomato sauce": "can", "tomato paste": "can", broth: "can", "canned": "can",
  "bell pepper": "bell-pepper", "red bell pepper": "red-pepper", broccoli: "broccoli", cauliflower: "broccoli",
  spinach: "leafy", lettuce: "leafy", kale: "leafy", cabbage: "leafy", celery: "leafy",
  cucumber: "cucumber", zucchini: "zucchini", mushroom: "mushroom", corn: "corn", pea: "peas", "green bean": "green-beans",
  avocado: "avocado", lemon: "lemon", lime: "lime", banana: "banana", apple: "apple", berry: "strawberry", strawberry: "strawberry",
  blueberry: "blueberry", raspberry: "strawberry", mango: "mango", peach: "peach", pineapple: "pineapple", grape: "grape", orange: "orange",
  cilantro: "herbs", parsley: "herbs", basil: "herbs", scallion: "herbs", herb: "herbs", jalapeno: "chili", "red pepper flakes": "chili",
  "black bean": "beans", "kidney bean": "beans", chickpea: "beans", lentil: "beans", bean: "beans", "coconut milk": "coconut",
  honey: "honey", "peanut butter": "peanut-butter", salsa: "salsa", mayonnaise: "jar", jam: "jar", oil: "oil", "olive oil": "oil",
  flour: "flour", sugar: "sugar", salt: "salt", ginger: "ginger", juice: "juice", leftover: "leftovers"
};
const AISLE_STICKER = { produce: "leafy", meat: "steak", dairy: "milk", bakery: "bread", pantry: "can", frozen: "ice", baking: "flour", other: "bag" };

const FAMILY_DISH = {
  "stir-fry": "stir-fry", "fried-rice": "fried-rice", omelette: "omelette", pasta: "pasta", "blended-soup": "soup", quesadilla: "quesadilla",
  smoothie: "smoothie", "sheet-pan": "sheet-pan", curry: "curry", tacos: "taco", "egg-muffin": "muffin", oats: "oats-jar", "burrito-bowl": "bowl",
  "soy-bowl": "noodle-bowl", "med-bowl": "salad", burrito: "burrito", "pasta-bake": "pasta", "slow-cooker": "soup", "chicken-soup": "soup", chili: "chili", stew: "soup"
};
const NAME_DISH = {
  "Fluffy Pancakes": "pancakes", "French Toast": "toast", "Banana Bread": "pie", "Overnight Oats": "oats-jar", "Scrambled Eggs on Toast": "toast",
  "Shakshuka": "omelette", "Grilled Cheese": "sandwich", "Classic Meatballs": "pasta", "Lemon Garlic Baked Salmon": "fish-plate",
  "Greek Salad": "salad", "Caprese Salad": "salad", "Chicken Caesar Salad": "salad", "BLT Sandwich": "sandwich", "Tuna Salad Sandwich": "sandwich",
  "Egg Salad": "sandwich", "Potato Salad": "potato-dish", "Creamy Coleslaw": "salad", "Guacamole": "bowl", "Hummus": "bowl",
  "Mashed Potatoes": "potato-dish", "Apple Crisp": "pie", "Loaded Baked Potatoes": "potato-dish", "Cucumber Salad": "salad", "Fresh Salsa": "bowl",
  "Tomato Bruschetta": "toast", "Rice Pudding": "pudding", "Yogurt Parfait": "pudding", "Stuffed Bell Peppers": "plate", "Shepherd's Pie": "pie",
  "Chicken Fajitas": "taco", "Stovetop Mac and Cheese": "pasta", "Slow Cooker Pulled Pork": "sandwich", "Spaghetti Bolognese": "pasta",
  "Pasta Carbonara": "pasta", "Chicken Noodle Soup": "soup", "Beef Chili": "chili"
};
const TYPE_DISH = { Breakfast: "omelette", Lunch: "sandwich", Dinner: "plate", Side: "salad", Snack: "snack", Dessert: "cake", Drink: "drink" };
