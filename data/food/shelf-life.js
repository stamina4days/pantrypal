/* How many days food keeps: [fridge, pantry or counter, freezer]. Blank means it does not belong there. */
const SHELF_LIFE = {
  "milk": [7, null, 90], "egg": [28, null, null], "butter": [60, null, 270], "cheese": [21, null, 180],
  "cream cheese": [14, null, null], "yogurt": [14, null, 60], "sour cream": [14, null, null], "cream": [7, null, null],
  "chicken": [2, null, 270], "ground beef": [2, null, 120], "beef": [4, null, 180], "steak": [4, null, 180],
  "pork": [4, null, 180], "bacon": [7, null, 30], "ham": [5, null, 60], "sausage": [2, null, 60],
  "turkey": [2, null, 270], "fish": [2, null, 180], "salmon": [2, null, 180], "shrimp": [2, null, 180],
  "deli meat": [5, null, 60], "lunch meat": [5, null, 60], "tofu": [7, null, 150], "hummus": [7, null, null],
  "lettuce": [7, null, null], "spinach": [5, null, 240], "kale": [7, null, 240], "bell pepper": [10, null, 240],
  "broccoli": [5, null, 300], "cauliflower": [7, null, 300], "carrot": [21, null, 300], "celery": [14, null, null],
  "cucumber": [7, null, null], "tomato": [7, 5, null], "mushroom": [6, null, null], "zucchini": [5, null, null],
  "asparagus": [4, null, null], "green bean": [6, null, 240], "cabbage": [21, null, null], "corn": [3, null, 240],
  "onion": [30, 30, null], "garlic": [null, 90, null], "potato": [null, 30, null], "sweet potato": [null, 21, null],
  "avocado": [4, 4, null], "apple": [30, 7, null], "banana": [7, 5, 90], "berry": [5, null, 300],
  "strawberry": [5, null, 300], "blueberry": [7, null, 300], "raspberry": [3, null, 300], "grape": [10, null, 300],
  "lemon": [21, 7, null], "lime": [21, 7, null], "orange": [21, 7, null], "peach": [5, 3, 240],
  "mango": [5, 4, 240], "pineapple": [5, 2, 240], "cilantro": [7, null, null], "parsley": [7, null, null],
  "basil": [5, null, null], "bread": [7, 5, 90], "tortilla": [21, 7, 180], "juice": [7, null, null],
  "salsa": [14, null, null], "leftover": [4, null, 90], "tomato sauce": [7, 365, null], "broth": [5, 365, null],
  "black bean": [null, 730, null], "kidney bean": [null, 730, null], "chickpea": [null, 730, null], "mayonnaise": [60, null, null], "cooked rice": [4, null, 180],
  "rice": [null, 730, null], "pasta": [null, 730, null], "flour": [null, 365, null], "oat": [null, 365, null],
  "canned": [null, 730, null], "can": [null, 730, null], "cereal": [null, 180, null]
};
