/* Store sections. */
/* ---------- store sections ---------- */
const AISLES = [
  ["produce", "Produce", ["onion", "garlic", "potato", "sweet potato", "carrot", "celery", "bell pepper", "broccoli", "cauliflower", "spinach", "kale", "lettuce",
    "tomato", "cucumber", "zucchini", "mushroom", "cabbage", "avocado", "lemon", "lime", "banana", "apple", "berry", "strawberry", "blueberry", "raspberry",
    "cilantro", "parsley", "basil", "scallion", "jalapeno", "ginger", "green bean", "snap pea", "asparagus", "butternut squash", "brussel sprout",
    "peach", "mango", "pineapple", "orange", "grape"]],
  ["meat", "Meat and seafood", ["chicken", "beef", "ground beef", "steak", "stew meat", "pork", "bacon", "ham", "sausage", "turkey", "fish", "salmon", "shrimp", "tuna"]],
  ["dairy", "Dairy and eggs", ["egg", "milk", "butter", "cheese", "cream", "cream cheese", "sour cream", "yogurt", "cottage cheese", "tofu", "hummus", "salsa"]],
  ["bakery", "Bakery and bread", ["bread", "tortilla", "crouton", "breadcrumb"]],
  ["pantry", "Pantry", ["rice", "pasta", "oat", "granola", "canned tomato", "tomato sauce", "tomato paste", "black bean", "kidney bean", "chickpea", "lentil",
    "broth", "coconut milk", "peanut butter", "honey", "maple syrup", "mayonnaise", "mustard", "olive", "tahini", "pine nut", "caesar dressing", "barbecue sauce", "corn", "pea"]],
  ["baking", "Spices and baking", ["salt", "pepper", "oil", "olive oil", "vegetable oil", "flour", "sugar", "baking powder", "baking soda", "cornstarch", "vinegar",
    "soy sauce", "cinnamon", "cumin", "chili powder", "paprika", "oregano", "italian seasoning", "curry powder", "vanilla", "red pepper flake"]]
];
const AISLE_ORDER = ["produce", "meat", "dairy", "bakery", "pantry", "frozen", "baking", "other"];
const AISLE_LABEL = { produce: "Produce", meat: "Meat and seafood", dairy: "Dairy and eggs", bakery: "Bakery and bread", pantry: "Pantry", frozen: "Frozen", baking: "Spices and baking", other: "Other" };
