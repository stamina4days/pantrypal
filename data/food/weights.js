/* Typical weights, densities, and package sizes. */
/* grams for one of an item */
const EACH_G = {
  egg: 50, onion: 150, potato: 200, "sweet potato": 200, "bell pepper": 150, carrot: 60, tomato: 125, banana: 120, apple: 180, lemon: 100, lime: 65,
  zucchini: 200, avocado: 150, cucumber: 300, jalapeno: 15, scallion: 15, garlic: 5, tortilla: 40, "chicken breast": 225, "chicken thigh": 120,
  sausage: 85, salmon: 170, fish: 170, peach: 150, mango: 200, pineapple: 900, cabbage: 900, broccoli: 500, cauliflower: 600, lettuce: 600,
  "butternut squash": 1000, bread: 30, bacon: 25, celery: 40, orange: 150, ginger: 30, "canned tomato": 400, "black bean": 425, "kidney bean": 425,
  chickpea: 425, "coconut milk": 400, tuna: 140, "tomato sauce": 425, broth: 950
};
/* grams for named count units, by ingredient (fallback in "*") */
const NAMED_G = {
  clove: { "*": 5 }, slice: { bread: 30, bacon: 25, cheese: 20, ham: 20, "*": 25 },
  can: { "canned tomato": 400, "coconut milk": 400, tuna: 140, "*": 425 },
  head: { garlic: 50, broccoli: 500, cauliflower: 600, lettuce: 600, cabbage: 900, "*": 500 },
  bunch: { asparagus: 450, cilantro: 50, parsley: 50, basil: 40, scallion: 100, celery: 450, kale: 250, spinach: 300, "*": 150 },
  handful: { "*": 30 }, fillet: { "*": 170 }, stalk: { "*": 40 }, leaf: { lettuce: 15, basil: 1, "*": 10 }
};
/* grams per ml, for cups and spoons. Rice is cooked cups measured against dry rice. */
const DENSITY = {
  flour: .53, sugar: .85, rice: .25, oat: .34, milk: 1.03, cream: 1, yogurt: 1.05, "sour cream": 1, cheese: .45, parmesan: .42, butter: .96,
  broth: 1, spinach: .13, kale: .2, broccoli: .38, pea: .6, corn: .65, cabbage: .3, mushroom: .3, "green bean": .45, "snap pea": .4, berry: .6,
  strawberry: .6, blueberry: .63, mango: .7, peach: .7, pineapple: .7, chicken: .6, ham: .6, "black bean": .72, "kidney bean": .72, chickpea: .7,
  lettuce: .2, oil: .92, "olive oil": .92, honey: 1.4, mayonnaise: .95, salsa: 1, "tomato sauce": 1.05, "canned tomato": 1, "coconut milk": 1,
  lentil: .8, "red lentil": .8, granola: .5, breadcrumb: .45, crouton: .15, "pine nut": .57, olive: .6, cilantro: .2, basil: .1, "peanut butter": 1.1,
  "barbecue sauce": 1.1, "soy sauce": 1.1, vinegar: 1, water: 1, "tomato paste": 1.1, mozzarella: .45, "cheddar cheese": .45
};
/* typical package sizes in grams (used for "bag of spinach" and for leftovers after buying) */
const PKG_G = {
  spinach: 300, kale: 250, lettuce: 300, carrot: 900, potato: 2270, onion: 1360, rice: 907, pasta: 454, penne: 454, spaghetti: 454, macaroni: 454,
  "egg noodle": 340, oat: 1190, bread: 680, tortilla: 400, cheese: 226, "cheddar cheese": 226, mozzarella: 226, parmesan: 140, yogurt: 907,
  "sour cream": 454, cream: 473, milk: 3785, butter: 454, "chicken breast": 680, "chicken thigh": 680, chicken: 680, "ground beef": 454,
  beef: 454, steak: 454, pork: 680, bacon: 340, ham: 280, sausage: 454, shrimp: 454, salmon: 454, fish: 454, tofu: 397, mushroom: 227,
  broccoli: 500, cauliflower: 600, cabbage: 900, "bell pepper": 450, tomato: 450, berry: 340, strawberry: 454, blueberry: 340, apple: 1360,
  banana: 900, lemon: 450, lime: 450, cilantro: 50, parsley: 50, basil: 20, scallion: 100, celery: 450, ginger: 100, garlic: 50, salsa: 454,
  "tomato sauce": 680, "canned tomato": 794, broth: 946, "black bean": 425, "kidney bean": 425, chickpea: 425, "coconut milk": 400,
  lentil: 454, "red lentil": 454, mayonnaise: 850, granola: 340, breadcrumb: 227, "peanut butter": 454, honey: 340, corn: 454, pea: 454,
  "green bean": 454, "snap pea": 227, asparagus: 450, zucchini: 600, cucumber: 300, avocado: 600, peach: 900, mango: 400, pineapple: 900,
  "sweet potato": 900, "butternut squash": 1000, feta: 170, "barbecue sauce": 510, "stew meat": 680, egg: 600
};
