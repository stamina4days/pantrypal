/* Pantry Pal recipe database. Works fully offline.

   Ingredient format: "amount|name" or "amount|name|o" (o = optional).
   Keep names simple (eggs, spinach, cheddar cheese, broth) so they match
   what you type into My Food. Add your own recipes to MY_RECIPES at the bottom.
*/

/* Things most kitchens always have. Used by the "assume basics" setting. */
const BASICS = [
  "salt", "pepper", "water", "oil", "olive oil", "vegetable oil", "sugar", "flour",
  "baking powder", "baking soda", "cornstarch", "vinegar", "soy sauce", "cinnamon",
  "cumin", "chili powder", "paprika", "oregano", "italian seasoning", "curry powder",
  "vanilla", "red pepper flakes"
];

/* Other names people type -> the name recipes use. */
const ALIASES = {
  "black pepper": "pepper", "canola oil": "vegetable oil", "extra virgin olive oil": "olive oil",
  "brown sugar": "sugar", "white sugar": "sugar", "all purpose flour": "flour",
  "rice vinegar": "vinegar", "apple cider vinegar": "vinegar", "white vinegar": "vinegar",
  "red pepper flakes": "red pepper flakes",
  "green onion": "scallions", "spring onion": "scallions",
  "garbanzo": "chickpeas", "garbanzo beans": "chickpeas",
  "red pepper": "bell pepper", "green pepper": "bell pepper", "yellow pepper": "bell pepper",
  "orange pepper": "bell pepper", "sweet pepper": "bell pepper", "capsicum": "bell pepper",
  "courgette": "zucchini", "coriander": "cilantro", "jalapeno pepper": "jalapeno",
  "hamburger": "ground beef", "minced beef": "ground beef", "beef mince": "ground beef",
  "ground turkey": "ground beef",
  "chicken broth": "broth", "chicken stock": "broth", "vegetable broth": "broth",
  "vegetable stock": "broth", "beef broth": "broth", "beef stock": "broth",
  "stock": "broth", "bouillon": "broth",
  "heavy cream": "cream", "whipping cream": "cream", "heavy whipping cream": "cream",
  "half and half": "cream",
  "romaine": "lettuce", "iceberg": "lettuce", "mixed greens": "lettuce", "salad greens": "lettuce",
  "baguette": "bread", "sourdough": "bread", "toast": "bread",
  "almond milk": "milk", "oat milk": "milk", "soy milk": "milk",
  "diced tomatoes": "canned tomatoes", "crushed tomatoes": "canned tomatoes",
  "whole peeled tomatoes": "canned tomatoes", "canned tomato": "canned tomatoes",
  "cherry tomatoes": "tomatoes", "grape tomatoes": "tomatoes", "roma tomatoes": "tomatoes",
  "pasta sauce": "tomato sauce", "marinara": "tomato sauce", "spaghetti sauce": "tomato sauce",
  "mayo": "mayonnaise", "cheddar": "cheddar cheese", "swiss": "swiss cheese", "kielbasa": "sausage", "italian sausage": "sausage",
  "tilapia": "fish", "cod": "fish", "haddock": "fish", "white fish": "fish",
  "lime juice": "lime", "lemon juice": "lemon", "pinto beans": "black beans",
  "romaine lettuce": "lettuce", "rolled oats": "oats", "old fashioned oats": "oats",
  "frozen peas": "peas", "frozen corn": "corn", "sweet corn": "corn",
  "cottage cheese": "cottage cheese", "peanut butter": "peanut butter",
  "coconut cream": "coconut milk", "rice noodles": "rice noodles",
  "yellow squash": "zucchini", "bbq sauce": "barbecue sauce", "bbq": "barbecue sauce", "kale": "kale", "parsley": "parsley", "lacinato kale": "kale"
};

/* Specific things that can stand in for a general ingredient (and the reverse). */
const PARENTS = {
  "cheddar cheese": "cheese", "mozzarella": "cheese", "monterey jack": "cheese",
  "pepper jack": "cheese", "colby": "cheese", "swiss cheese": "cheese", "provolone": "cheese",
  "feta": "cheese", "parmesan": "cheese", "american cheese": "cheese", "mexican cheese": "cheese",
  "chicken breast": "chicken", "chicken thighs": "chicken", "rotisserie chicken": "chicken",
  "chicken tenders": "chicken", "chicken drumsticks": "chicken",
  "steak": "beef", "sirloin": "beef", "flank steak": "beef", "stew meat": "beef", "chuck roast": "beef",
  "spaghetti": "pasta", "penne": "pasta", "macaroni": "pasta", "rotini": "pasta", "fusilli": "pasta",
  "linguine": "pasta", "fettuccine": "pasta", "rigatoni": "pasta", "egg noodles": "pasta", "farfalle": "pasta",
  "strawberries": "berries", "blueberries": "berries", "raspberries": "berries", "blackberries": "berries",
  "salmon": "fish", "red lentils": "lentils", "green lentils": "lentils"
};

/* Phrases that contain a food word but aren't that food. */
const IGNORE = [
  "garlic powder", "onion powder", "garlic salt", "celery salt", "onion soup mix", "potato chips",
  "ice cream", "cream of mushroom", "cream of chicken", "apple juice", "orange juice",
  "tomato juice", "chicken soup", "tomato soup", "beef jerky", "fish sauce", "fish sticks",
  "hot sauce", "chicken nuggets", "rice cakes", "corn flakes", "apple butter",
  "egg rolls", "chocolate chips"
];

/* Ingredients that matter for diets and allergies. More specific names
   (cheddar cheese, spaghetti, chicken thighs) inherit through PARENTS.
   This is a helper, not a guarantee: always check labels for allergies. */
const ALLERGENS = {
  meat: ["chicken", "beef", "ground beef", "pork", "bacon", "ham", "sausage", "turkey", "steak", "stew meat", "broth"],
  pork: ["pork", "bacon", "ham", "sausage"],
  fish: ["fish", "salmon", "tuna", "caesar dressing"],
  shellfish: ["shrimp"],
  dairy: ["milk", "butter", "cheese", "cream", "cream cheese", "sour cream", "yogurt", "cottage cheese", "caesar dressing"],
  egg: ["egg", "mayonnaise", "caesar dressing", "egg noodles"],
  gluten: ["flour", "bread", "pasta", "tortillas", "soy sauce", "breadcrumbs", "croutons", "granola", "oats"],
  nut: ["pine nuts", "peanut butter", "granola"],
  honey: ["honey"]
};

/* ---------------- Classic recipes ---------------- */
const CLASSICS = [
{name:"Fluffy Pancakes",type:"Breakfast",time:20,ing:["1 1/2 cups|flour","1 tbsp|baking powder","1 tbsp|sugar","1/2 tsp|salt","1 1/4 cups|milk","1|egg","3 tbsp|butter"],steps:["Melt the butter and let it cool a little.","Whisk the flour, baking powder, sugar, and salt in a bowl.","In another bowl, whisk the milk, egg, and melted butter. Pour it into the dry ingredients and stir until just combined. Small lumps are fine.","Heat a lightly oiled pan over medium heat. Pour in about 1/4 cup of batter per pancake. Flip when bubbles form on top, then cook until golden, 1 to 2 minutes per side."]},
{name:"French Toast",type:"Breakfast",time:15,ing:["4 slices|bread","2|eggs","1/2 cup|milk","1/2 tsp|cinnamon","1/2 tsp|vanilla|o","1 tbsp|butter","|maple syrup|o"],steps:["Whisk the eggs, milk, cinnamon, and vanilla in a shallow dish.","Melt the butter in a skillet over medium heat.","Dip each slice of bread in the egg mixture for a few seconds per side.","Cook until golden, 2 to 3 minutes per side. Serve with syrup."]},
{name:"Banana Bread",type:"Dessert",time:70,ing:["3|bananas","1/3 cup|butter","3/4 cup|sugar","1|egg","1 tsp|vanilla","1 tsp|baking soda","1/4 tsp|salt","1 1/2 cups|flour"],steps:["Heat the oven to 350F (175C) and grease a loaf pan.","Mash the bananas in a bowl. Melt the butter and stir it in.","Mix in the sugar, egg, and vanilla, then the baking soda and salt.","Stir in the flour until just combined.","Bake for 55 to 65 minutes, until a toothpick in the center comes out clean. Cool for 10 minutes in the pan."]},
{name:"Overnight Oats",type:"Breakfast",time:5,ing:["1/2 cup|oats","1/2 cup|milk","1/4 cup|yogurt|o","1 tsp|honey|o","1/2 cup|berries|o","1/2|banana|o"],steps:["Stir the oats, milk, yogurt, and honey together in a jar.","Cover and refrigerate overnight, or at least 4 hours.","Top with fruit in the morning."]},
{name:"Scrambled Eggs on Toast",type:"Breakfast",time:10,ing:["3|eggs","1 tbsp|butter","2 slices|bread","1 tbsp|milk|o","|salt","|pepper","|cheese|o"],steps:["Whisk the eggs with the milk and a pinch of salt.","Melt the butter in a nonstick pan over medium-low heat.","Add the eggs and stir slowly with a spatula until softly set, 2 to 3 minutes. Take them off the heat while they still look a little wet.","Toast the bread and pile the eggs on top. Add cheese and pepper if you like."]},
{name:"Shakshuka",type:"Breakfast",time:30,ing:["1 can (28 oz)|canned tomatoes","4|eggs","1|onion","1|bell pepper","3 cloves|garlic","1 tsp|cumin","1 tsp|paprika","2 tbsp|olive oil","|feta|o","|bread|o"],steps:["Dice the onion and pepper and mince the garlic.","Heat the oil in a large skillet over medium heat. Cook the onion and pepper until soft, about 8 minutes. Add the garlic, cumin, and paprika for 1 minute.","Add the tomatoes, crush them with a spoon, and simmer until thickened, about 10 minutes. Season with salt.","Make 4 wells in the sauce and crack an egg into each. Cover and cook until the whites are set, 5 to 8 minutes.","Top with feta and serve with bread for dipping."]},
{name:"Grilled Cheese",type:"Lunch",time:10,ing:["2 slices|bread","2 slices|cheese","1 tbsp|butter"],steps:["Butter one side of each slice of bread.","Put one slice butter-side down in a skillet over medium-low heat. Add the cheese and the second slice, butter-side up.","Cook until golden and the cheese melts, 3 to 4 minutes per side."]},
{name:"Tomato Soup",type:"Lunch",time:35,ing:["1 can (28 oz)|canned tomatoes","1|onion","2 cloves|garlic","2 cups|broth","2 tbsp|butter","1/2 cup|cream|o","|salt"],steps:["Chop the onion and garlic.","Melt the butter in a pot over medium heat. Cook the onion until soft, about 6 minutes, then add the garlic for 30 seconds.","Add the tomatoes and broth. Simmer for 20 minutes.","Blend until smooth, then stir in the cream and season with salt."]},
{name:"Chicken Noodle Soup",type:"Dinner",time:45,ing:["1 lb|chicken","2|carrots","2 stalks|celery","1|onion","2 cups|egg noodles","8 cups|broth","1 tbsp|oil","|salt","|pepper"],steps:["Dice the carrots, celery, and onion.","Heat the oil in a large pot over medium heat and cook the vegetables until soft, about 8 minutes.","Add the broth and the whole pieces of chicken. Simmer until the chicken reaches 165F, 15 to 20 minutes.","Take out the chicken and shred it with two forks.","Add the noodles to the pot and cook until tender, following the package time. Stir the chicken back in and season."]},
{name:"Lentil Soup",type:"Dinner",time:45,ing:["1 cup|lentils","2|carrots","2 stalks|celery","1|onion","1 can (14 oz)|canned tomatoes","6 cups|broth","1 tsp|cumin","2 tbsp|olive oil","|salt"],steps:["Rinse the lentils. Dice the carrots, celery, and onion.","Heat the oil in a large pot and cook the vegetables until soft, about 8 minutes. Stir in the cumin.","Add the lentils, tomatoes, and broth. Simmer until the lentils are tender, 25 to 30 minutes.","Season with salt. Add a splash of vinegar or lemon to brighten it if you have some."]},
{name:"Easy Beef Chili",type:"Dinner",time:50,ing:["1 lb|ground beef","2 cans|kidney beans","1 can (28 oz)|canned tomatoes","1|onion","1|bell pepper","2 cloves|garlic","2 tbsp|chili powder","1 tsp|cumin","|salt","|cheese|o","|sour cream|o"],steps:["Dice the onion and pepper and mince the garlic.","Brown the beef in a large pot over medium-high heat, breaking it up. Drain extra fat.","Add the onion and pepper and cook until soft, about 6 minutes. Stir in the garlic, chili powder, and cumin for 1 minute.","Add the tomatoes and drained beans. Simmer for 25 to 30 minutes, stirring now and then.","Season with salt and top with cheese and sour cream."]},
{name:"Spaghetti Bolognese",type:"Dinner",time:50,ing:["12 oz|spaghetti","1 lb|ground beef","1|onion","1|carrot|o","2 cloves|garlic","1 can (28 oz)|canned tomatoes","1 tbsp|olive oil","|parmesan|o","|salt"],steps:["Finely chop the onion, carrot, and garlic.","Heat the oil in a large pan and cook the onion and carrot until soft, about 8 minutes. Add the garlic for 30 seconds.","Add the beef and cook, breaking it up, until browned.","Add the tomatoes and simmer for 25 minutes, stirring now and then. Season with salt.","Cook the spaghetti in salted boiling water, drain, and toss with the sauce. Top with parmesan."]},
{name:"Stovetop Mac and Cheese",type:"Dinner",time:25,ing:["8 oz|macaroni","2 tbsp|butter","2 tbsp|flour","2 cups|milk","2 cups|cheddar cheese","|salt"],steps:["Cook the macaroni in salted boiling water until just tender. Drain.","In the same pot, melt the butter over medium heat. Whisk in the flour and cook for 1 minute.","Slowly whisk in the milk and cook, stirring, until it thickens, about 5 minutes.","Take it off the heat and stir in the cheese until smooth. Add the pasta and season with salt."]},
{name:"Pasta Carbonara",type:"Dinner",time:25,ing:["12 oz|spaghetti","6 slices|bacon","3|eggs","1 cup|parmesan","|pepper"],steps:["Chop the bacon and cook it in a large skillet until crisp. Turn off the heat.","Whisk the eggs and parmesan with lots of black pepper.","Cook the spaghetti in salted boiling water. Save 1 cup of pasta water and drain.","Add the hot pasta to the skillet with the bacon. Off the heat, pour in the egg mixture and toss quickly, adding splashes of pasta water until creamy. The heat of the pasta cooks the eggs."]},
{name:"Pesto Pasta",type:"Dinner",time:20,ing:["12 oz|pasta","2 cups|basil","1/2 cup|parmesan","2 cloves|garlic","1/2 cup|olive oil","1/4 cup|pine nuts|o","|salt"],steps:["Cook the pasta in salted boiling water. Save 1/2 cup of pasta water and drain.","Blend the basil, parmesan, garlic, pine nuts, and olive oil until smooth. Season with salt.","Toss the pasta with the pesto, loosening it with pasta water as needed."]},
{name:"Chicken Fajitas",type:"Dinner",time:30,ing:["1 lb|chicken breast","2|bell peppers","1|onion","8|tortillas","2 tsp|chili powder","1 tsp|cumin","2 tbsp|oil","1|lime|o","|sour cream|o","|salsa|o"],steps:["Slice the chicken, peppers, and onion into strips. Toss the chicken with the chili powder, cumin, and a pinch of salt.","Heat 1 tablespoon of oil in a large skillet over medium-high heat. Cook the chicken until it reaches 165F, 6 to 8 minutes. Move it to a plate.","Add the remaining oil and cook the peppers and onion until tender with some char, 5 to 7 minutes.","Return the chicken, squeeze in the lime, and serve in warm tortillas with sour cream and salsa."]},
{name:"Beef Stew",type:"Dinner",time:150,ing:["2 lb|stew meat","4|potatoes","3|carrots","1|onion","4 cups|broth","2 tbsp|tomato paste","2 tbsp|flour","2 tbsp|oil","|salt","|pepper"],steps:["Toss the beef with the flour, salt, and pepper.","Heat the oil in a large pot over medium-high heat and brown the beef in batches. Set it aside.","Cook the chopped onion until soft, about 5 minutes. Stir in the tomato paste for 1 minute.","Add the broth and beef, scraping up the browned bits. Cover and simmer gently for 1 1/2 hours.","Add the chunked potatoes and carrots and simmer until tender, 30 to 40 minutes."]},
{name:"Shepherd's Pie",type:"Dinner",time:60,ing:["1 lb|ground beef","2 lb|potatoes","2|carrots","1 cup|peas","1|onion","1 cup|broth","2 tbsp|tomato paste|o","3 tbsp|butter","1/2 cup|milk","|salt"],steps:["Peel and chunk the potatoes, boil until tender, then mash with the butter, milk, and salt.","Heat the oven to 400F (200C).","Brown the beef with the diced onion and carrots. Stir in the tomato paste and broth and simmer for 10 minutes. Stir in the peas.","Spread the filling in a baking dish and top with the mashed potatoes.","Bake until golden on top, about 20 minutes."]},
{name:"Stuffed Bell Peppers",type:"Dinner",time:60,ing:["4|bell peppers","1 lb|ground beef","1 cup|rice","1 can (14 oz)|canned tomatoes","1|onion","1 cup|cheese","|salt"],steps:["Heat the oven to 375F (190C). Cut the tops off the peppers and remove the seeds.","Brown the beef with the diced onion. Drain the fat.","Stir in the cooked rice and half the tomatoes. Season with salt.","Fill the peppers, stand them in a baking dish, and pour the rest of the tomatoes around them.","Cover with foil and bake for 30 minutes. Uncover, add the cheese, and bake 10 minutes more."]},
{name:"Classic Meatballs",type:"Dinner",time:40,ing:["1 lb|ground beef","1/2 cup|breadcrumbs","1|egg","1/4 cup|parmesan","2 cloves|garlic","3 cups|tomato sauce","|salt"],steps:["Heat the oven to 400F (200C).","Mix the beef, breadcrumbs, egg, parmesan, minced garlic, and a good pinch of salt. Don't overmix.","Roll into 1 1/2 inch balls and bake on a lined sheet for 15 to 18 minutes, until cooked through (160F).","Simmer the meatballs in the tomato sauce for 10 minutes. Serve over pasta or in rolls."]},
{name:"Lemon Garlic Baked Salmon",type:"Dinner",time:20,ing:["4 fillets|salmon","1|lemon","3 cloves|garlic","2 tbsp|olive oil","|salt","|pepper"],steps:["Heat the oven to 400F (200C).","Put the salmon on a lined sheet. Mix the oil, minced garlic, lemon zest, salt, and pepper and spread it over the fish.","Bake until it flakes easily (145F), 12 to 15 minutes.","Squeeze lemon juice over the top and serve."]},
{name:"Greek Salad",type:"Side",time:15,ing:["1|cucumber","3|tomatoes","1/2|onion","1/2 cup|feta","1/3 cup|olives|o","3 tbsp|olive oil","1 tbsp|vinegar","1 tsp|oregano"],steps:["Chop the cucumber and tomatoes into chunks and thinly slice the onion.","Whisk the oil, vinegar, oregano, and a pinch of salt.","Toss the vegetables and olives with the dressing and top with feta."]},
{name:"Caprese Salad",type:"Side",time:10,ing:["3|tomatoes","8 oz|mozzarella","1 handful|basil","2 tbsp|olive oil","1 tbsp|vinegar|o","|salt"],steps:["Slice the tomatoes and mozzarella.","Layer them on a plate with the basil leaves.","Drizzle with oil and vinegar and sprinkle with salt."]},
{name:"Chicken Caesar Salad",type:"Lunch",time:25,ing:["1|lettuce","2 cups|chicken","1/2 cup|parmesan","1/2 cup|caesar dressing","1 cup|croutons|o","|lemon|o"],steps:["Use leftover cooked chicken, or season and cook a chicken breast until it reaches 165F, then slice.","Chop the lettuce and toss it with the dressing.","Top with the chicken, parmesan, and croutons. Add a squeeze of lemon."]},
{name:"BLT Sandwich",type:"Lunch",time:15,ing:["4 slices|bacon","2 slices|bread","2 leaves|lettuce","1|tomato","1 tbsp|mayonnaise"],steps:["Cook the bacon until crisp and drain on paper towels.","Toast the bread and spread it with mayonnaise.","Layer the lettuce, sliced tomato, and bacon between the slices."]},
{name:"Tuna Salad Sandwich",type:"Lunch",time:10,ing:["1 can|tuna","2 tbsp|mayonnaise","1 stalk|celery|o","1 tsp|lemon|o","2 slices|bread","|pepper"],steps:["Drain the tuna and flake it into a bowl.","Stir in the mayonnaise, finely diced celery, lemon juice, and pepper.","Spread it on the bread."]},
{name:"Egg Salad",type:"Lunch",time:20,ing:["4|eggs","3 tbsp|mayonnaise","1 tsp|mustard","|bread|o","|salt","|pepper"],steps:["Cover the eggs with water, bring to a boil, then turn off the heat, cover, and let them sit for 11 minutes.","Cool them in cold water, peel, and chop.","Mix with the mayonnaise, mustard, salt, and pepper. Serve on bread or lettuce."]},
{name:"Potato Salad",type:"Side",time:40,ing:["2 lb|potatoes","1/2 cup|mayonnaise","1 tbsp|mustard","2 stalks|celery","1/4|onion","2|eggs|o","|salt"],steps:["Cube the potatoes and boil them in salted water until just tender, 10 to 12 minutes. Drain and cool.","Hard-boil the eggs if using, then chop.","Mix the mayonnaise, mustard, diced celery, and finely diced onion.","Fold in the potatoes and eggs and season. Chill until serving."]},
{name:"Creamy Coleslaw",type:"Side",time:15,ing:["4 cups|cabbage","1|carrot","1/2 cup|mayonnaise","1 tbsp|vinegar","1 tsp|sugar","|salt"],steps:["Thinly shred the cabbage and grate the carrot.","Whisk the mayonnaise, vinegar, sugar, and a pinch of salt.","Toss everything together and chill for 20 minutes."]},
{name:"Guacamole",type:"Snack",time:10,ing:["3|avocados","1|lime","1/4|onion","1|tomato|o","|cilantro|o","|jalapeno|o","|salt"],steps:["Mash the avocados in a bowl.","Stir in the lime juice, finely diced onion, tomato, cilantro, and jalapeno.","Season with salt to taste."]},
{name:"Hummus",type:"Snack",time:10,ing:["1 can|chickpeas","1/4 cup|tahini","1|lemon","1 clove|garlic","2 tbsp|olive oil","|salt"],steps:["Drain the chickpeas, saving the liquid.","Blend the chickpeas, tahini, lemon juice, garlic, and oil until smooth, adding a few spoons of the saved liquid as needed.","Season with salt and drizzle with more oil."]},
{name:"Mashed Potatoes",type:"Side",time:30,ing:["2 lb|potatoes","4 tbsp|butter","1/2 cup|milk","|salt"],steps:["Peel and chunk the potatoes. Cover with cold salted water and boil until very tender, 15 to 20 minutes.","Drain well and mash with the butter.","Stir in warm milk until creamy and season with salt."]},
{name:"Apple Crisp",type:"Dessert",time:55,ing:["5|apples","1 cup|oats","1/2 cup|flour","1/2 cup|sugar","1 tsp|cinnamon","6 tbsp|butter"],steps:["Heat the oven to 350F (175C).","Peel and slice the apples and spread them in a baking dish.","Mix the oats, flour, sugar, and cinnamon. Rub in the cold butter until crumbly.","Scatter the topping over the apples and bake until golden and bubbling, 40 to 45 minutes."]},
{name:"Black Bean Soup",type:"Dinner",time:35,ing:["2 cans|black beans","1|onion","3 cloves|garlic","3 cups|broth","1 tsp|cumin","1 tbsp|oil","1|lime|o","|sour cream|o"],steps:["Cook the diced onion in the oil until soft, about 6 minutes. Add the garlic and cumin for 1 minute.","Add the drained beans and broth and simmer for 15 minutes.","Blend about half of the soup and stir it back in.","Finish with lime juice and top with sour cream."]},
{name:"Loaded Baked Potatoes",type:"Dinner",time:65,ing:["4|potatoes","2 tbsp|butter","1/2 cup|sour cream|o","1 cup|cheese|o","4 slices|bacon|o","2|scallions|o","|salt"],steps:["Heat the oven to 425F (220C). Scrub the potatoes, poke them with a fork, rub with oil and salt.","Bake directly on the rack until soft inside, 50 to 60 minutes.","Split them open and add butter, cheese, cooked bacon, sour cream, and scallions."]},
{name:"Cucumber Salad",type:"Side",time:15,ing:["2|cucumbers","1/4|onion","3 tbsp|vinegar","1 tsp|sugar","|salt"],steps:["Thinly slice the cucumbers and onion.","Toss with the vinegar, sugar, and a pinch of salt.","Let it sit for 10 minutes before serving."]},
{name:"Fresh Salsa",type:"Snack",time:10,ing:["4|tomatoes","1/2|onion","1|jalapeno|o","|cilantro","1|lime","|salt"],steps:["Finely dice the tomatoes, onion, and jalapeno and chop the cilantro.","Mix with the lime juice and season with salt.","Let it rest for 10 minutes for the flavors to blend."]},
{name:"Tomato Bruschetta",type:"Snack",time:15,ing:["1|bread","4|tomatoes","1 handful|basil","1 clove|garlic","2 tbsp|olive oil","|salt"],steps:["Dice the tomatoes and toss with chopped basil, olive oil, and salt.","Slice the bread and toast until crisp.","Rub each toast with the cut side of a garlic clove and spoon the tomatoes on top."]},
{name:"Rice Pudding",type:"Dessert",time:35,ing:["1 cup|rice","3 cups|milk","1/3 cup|sugar","1/2 tsp|cinnamon","1 tsp|vanilla"],steps:["Combine the cooked rice, milk, and sugar in a pot.","Simmer over medium-low heat, stirring often, until thick and creamy, 20 to 25 minutes.","Stir in the vanilla and cinnamon. Serve warm or cold."]},
{name:"Yogurt Parfait",type:"Breakfast",time:5,ing:["1 cup|yogurt","1/2 cup|berries","1/3 cup|granola","1 tsp|honey|o"],steps:["Layer the yogurt, berries, and granola in a glass.","Drizzle with honey."]}
];

/* Servings for the classic recipes (generated recipes set their own). */
const SERVES = {
  "Fluffy Pancakes": 4, "French Toast": 2, "Banana Bread": 8, "Overnight Oats": 1, "Scrambled Eggs on Toast": 1,
  "Shakshuka": 2, "Grilled Cheese": 1, "Tomato Soup": 4, "Chicken Noodle Soup": 6, "Lentil Soup": 6,
  "Easy Beef Chili": 6, "Spaghetti Bolognese": 4, "Stovetop Mac and Cheese": 4, "Pasta Carbonara": 4,
  "Pesto Pasta": 4, "Chicken Fajitas": 4, "Beef Stew": 6, "Shepherd's Pie": 6, "Stuffed Bell Peppers": 4,
  "Classic Meatballs": 4, "Lemon Garlic Baked Salmon": 4, "Greek Salad": 4, "Caprese Salad": 4,
  "Chicken Caesar Salad": 2, "BLT Sandwich": 1, "Tuna Salad Sandwich": 2, "Egg Salad": 2, "Potato Salad": 6,
  "Creamy Coleslaw": 6, "Guacamole": 4, "Hummus": 6, "Mashed Potatoes": 4, "Apple Crisp": 6,
  "Black Bean Soup": 4, "Loaded Baked Potatoes": 4, "Cucumber Salad": 4, "Fresh Salsa": 6,
  "Tomato Bruschetta": 6, "Rice Pudding": 4, "Yogurt Parfait": 1
};

/* When you're missing "need", any of "use" can stand in. */
const SUBS = [
  { need: "cream", use: ["milk"], note: "Use milk with 1 tablespoon of melted butter per cup. It'll be a little thinner.", es: "Usa leche con 1 cucharada de mantequilla derretida por taza. Quedará un poco más ligera." },
  { need: "sour cream", use: ["yogurt"], note: "Plain yogurt works the same way.", es: "El yogur natural funciona igual." },
  { need: "yogurt", use: ["sour cream"], note: "Sour cream works the same way.", es: "La crema agria funciona igual." },
  { need: "mayonnaise", use: ["yogurt"], note: "Plain yogurt works in salads and sandwiches.", es: "El yogur natural funciona en ensaladas y sándwiches." },
  { need: "breadcrumbs", use: ["bread", "oats"], note: "Crumble toasted bread, or use quick oats.", es: "Desmorona pan tostado o usa avena." },
  { need: "lemon", use: ["lime", "vinegar"], note: "Use lime juice, or a splash of vinegar for sourness.", es: "Usa jugo de limón verde o un chorrito de vinagre." },
  { need: "lime", use: ["lemon", "vinegar"], note: "Use lemon juice, or a splash of vinegar.", es: "Usa jugo de limón amarillo o un chorrito de vinagre." },
  { need: "scallions", use: ["onion"], note: "Use a little finely chopped onion.", es: "Usa un poco de cebolla picada finamente." },
  { need: "cilantro", use: ["parsley"], note: "Parsley adds the same freshness with a different flavor.", es: "El perejil da frescura, con otro sabor." },
  { need: "spinach", use: ["kale"], note: "Use kale, chopped fine and cooked a few minutes longer.", es: "Usa kale picado finamente y cocínalo unos minutos más." },
  { need: "kidney beans", use: ["black beans", "chickpeas"], note: "Any canned beans work.", es: "Cualquier frijol de lata funciona." },
  { need: "black beans", use: ["kidney beans", "chickpeas"], note: "Any canned beans work.", es: "Cualquier frijol de lata funciona." },
  { need: "tomato sauce", use: ["canned tomatoes"], note: "Simmer canned tomatoes with a little garlic for 10 minutes.", es: "Cocina tomates de lata con un poco de ajo 10 minutos." },
  { need: "canned tomatoes", use: ["tomatoes"], note: "Use about 6 chopped fresh tomatoes per large can, and simmer a little longer.", es: "Usa unos 6 tomates frescos picados por lata grande y cocina un poco más." },
  { need: "butter", use: ["oil"], note: "Oil works for cooking. Baked goods come out a little denser.", es: "El aceite funciona para cocinar. Lo horneado queda un poco más denso." },
  { need: "milk", use: ["cream"], note: "Mix cream with an equal amount of water.", es: "Mezcla crema con la misma cantidad de agua." },
  { need: "granola", use: ["oats"], note: "Toast oats in a dry pan with a little honey or sugar.", es: "Tuesta avena en una sartén seca con un poco de miel o azúcar." },
  { need: "bacon", use: ["ham"], note: "Diced ham gives a similar smoky, salty bite.", es: "El jamón en cubitos da un sabor salado parecido." },
  { need: "ham", use: ["bacon"], note: "Cook chopped bacon until crisp first.", es: "Primero cocina tocino picado hasta que esté crujiente." }
];

/* ---------------- Recipe generators ----------------
   These build real variations from tested base methods. Each one carries
   English and Spanish text. */
function pairs(list) {
  const out = [];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) out.push([list[i], list[j]]);
  return out;
}
const clean = arr => arr.filter(Boolean);
const lc = s => s.toLowerCase();
const GENERATED = [];

/* Stir-fries */
(function () {
  const P = [
    {name:"Chicken",ing:"1 lb|chicken breast",prep:"Cut the chicken into bite-size pieces.",cook:"Stir-fry the chicken until browned and cooked through, 5 to 7 minutes, then move it to a plate.",
     es:"pollo",the:"el pollo",prepEs:"Corta el pollo en trozos pequeños.",cookEs:"Saltea el pollo hasta que esté dorado y bien cocido, de 5 a 7 minutos, y pásalo a un plato."},
    {name:"Beef",ing:"1 lb|steak",prep:"Slice the steak thinly against the grain.",cook:"Sear the beef in batches until browned, 2 to 3 minutes, then move it to a plate.",
     es:"res",the:"la res",prepEs:"Corta el bistec en tiras delgadas, en contra de la fibra.",cookEs:"Dora la res por tandas, de 2 a 3 minutos, y pásala a un plato."},
    {name:"Shrimp",ing:"1 lb|shrimp",prep:"Peel and devein the shrimp if needed.",cook:"Cook the shrimp until pink, 2 to 3 minutes, then move them to a plate.",
     es:"camarones",the:"los camarones",prepEs:"Pela y desvena los camarones si hace falta.",cookEs:"Cocina los camarones hasta que estén rosados, de 2 a 3 minutos, y pásalos a un plato."},
    {name:"Tofu",ing:"14 oz|tofu",prep:"Press the tofu dry and cut it into cubes.",cook:"Fry the tofu until golden on most sides, 6 to 8 minutes, then move it to a plate.",
     es:"tofu",the:"el tofu",prepEs:"Seca bien el tofu presionándolo y córtalo en cubos.",cookEs:"Fríe el tofu hasta que esté dorado por casi todos lados, de 6 a 8 minutos, y pásalo a un plato."},
    {name:"Pork",ing:"1 lb|pork",prep:"Slice the pork thinly.",cook:"Stir-fry the pork until no pink remains, 4 to 5 minutes, then move it to a plate.",
     es:"cerdo",the:"el cerdo",prepEs:"Corta el cerdo en tiras delgadas.",cookEs:"Saltea el cerdo hasta que ya no esté rosado, de 4 a 5 minutos, y pásalo a un plato."}
  ];
  const V = [
    {name:"Broccoli",ing:"3 cups|broccoli",prep:"Cut the broccoli into small florets.",done:"crisp-tender",t:"4 to 5 minutes",
     es:"brócoli",low:"el brócoli",prepEs:"Corta el brócoli en floretes pequeños.",doneEs:"esté tierno pero crujiente",tEs:"de 4 a 5 minutos"},
    {name:"Bell Pepper",lowEn:"peppers",ing:"2|bell peppers",prep:"Slice the peppers into strips.",done:"crisp-tender",t:"3 to 4 minutes",
     es:"pimiento",low:"los pimientos",prepEs:"Corta los pimientos en tiras.",doneEs:"estén tiernos pero crujientes",tEs:"de 3 a 4 minutos"},
    {name:"Green Bean",lowEn:"green beans",ing:"3 cups|green beans",prep:"Trim the green beans and cut them in half.",done:"crisp-tender",t:"5 to 6 minutes",
     es:"ejotes",low:"los ejotes",prepEs:"Recorta los ejotes y pártelos a la mitad.",doneEs:"estén tiernos pero crujientes",tEs:"de 5 a 6 minutos"},
    {name:"Mushroom",lowEn:"mushrooms",ing:"8 oz|mushrooms",prep:"Slice the mushrooms.",done:"browned",t:"4 to 5 minutes",
     es:"champiñones",low:"los champiñones",prepEs:"Rebana los champiñones.",doneEs:"estén dorados",tEs:"de 4 a 5 minutos"},
    {name:"Snap Pea",lowEn:"snap peas",ing:"3 cups|snap peas",prep:"Trim the ends of the snap peas.",done:"bright green",t:"2 to 3 minutes",
     es:"chícharos chinos",low:"los chícharos chinos",prepEs:"Recorta las puntas de los chícharos chinos.",doneEs:"estén verde brillante",tEs:"de 2 a 3 minutos"},
    {name:"Zucchini",ing:"2|zucchini",prep:"Halve the zucchini lengthwise and slice it.",done:"just tender",t:"3 to 4 minutes",
     es:"calabacita",low:"la calabacita",prepEs:"Parte la calabacita a lo largo y rebánala.",doneEs:"esté apenas tierna",tEs:"de 3 a 4 minutos"},
    {name:"Cabbage",ing:"4 cups|cabbage",prep:"Thinly slice the cabbage.",done:"wilted at the edges",t:"3 to 4 minutes",
     es:"repollo",low:"el repollo",prepEs:"Rebana el repollo en tiras finas.",doneEs:"se marchite en las orillas",tEs:"de 3 a 4 minutos"}
  ];
  for (const p of P) for (const v of V) GENERATED.push({
    name: `${p.name} and ${v.name} Stir-Fry`, type: "Dinner", time: p.name === "Tofu" ? 30 : 25, serves: 4,
    ing: [p.ing, v.ing, "3 cloves|garlic", "1 tbsp|ginger|o", "3 tbsp|soy sauce", "1 tsp|cornstarch", "1 tbsp|honey|o", "2 tbsp|oil", "|rice|o"],
    steps: [
      `${p.prep} ${v.prep} Mince the garlic, and the ginger if using.`,
      "Stir together the soy sauce, cornstarch, 3 tablespoons of water, and the honey if using. Set it aside.",
      `Heat 1 tablespoon of oil in a large skillet or wok over high heat. ${p.cook}`,
      `Add the remaining oil and the ${v.lowEn || lc(v.name)}. Stir-fry until ${v.done}, ${v.t}. Add the garlic and ginger for the last 30 seconds.`,
      `Return the ${lc(p.name)} to the pan, stir the sauce, and pour it in. Toss for about 1 minute, until it thickens and coats everything. Serve over rice.`
    ],
    es: { name: `Salteado de ${p.es} y ${v.es}`, steps: [
      `${p.prepEs} ${v.prepEs} Pica el ajo, y el jengibre si lo usas.`,
      "Mezcla la salsa de soya, la maicena, 3 cucharadas de agua y la miel si la usas. Reserva.",
      `Calienta 1 cucharada de aceite en una sartén grande o wok a fuego alto. ${p.cookEs}`,
      `Agrega el resto del aceite y ${v.low}. Saltea hasta que ${v.doneEs}, ${v.tEs}. Añade el ajo y el jengibre durante los últimos 30 segundos.`,
      `Regresa ${p.the} a la sartén, mezcla la salsa y viértela. Revuelve por 1 minuto, hasta que espese y cubra todo. Sirve con arroz.`
    ] }
  });
})();

/* Fried rice */
(function () {
  const P = [
    {name:"Chicken",ing:"8 oz|chicken breast",prep:"Dice the chicken.",cook:"Cook the chicken until no pink remains, 5 to 6 minutes.",
     es:"pollo",prepEs:"Corta el pollo en cubitos.",cookEs:"Cocina el pollo hasta que ya no esté rosado, de 5 a 6 minutos."},
    {name:"Shrimp",ing:"8 oz|shrimp",prep:"Peel the shrimp and cut them into pieces.",cook:"Cook the shrimp until pink, 2 to 3 minutes.",
     es:"camarones",prepEs:"Pela los camarones y córtalos en trozos.",cookEs:"Cocina los camarones hasta que estén rosados, de 2 a 3 minutos."},
    {name:"Ham",ing:"1 cup|ham",prep:"Dice the ham.",cook:"Cook the ham until lightly browned, about 2 minutes.",
     es:"jamón",prepEs:"Corta el jamón en cubitos.",cookEs:"Cocina el jamón hasta que se dore un poco, unos 2 minutos."},
    {name:"Tofu",ing:"7 oz|tofu",prep:"Press the tofu dry and cut it into small cubes.",cook:"Fry the tofu until golden, 6 to 8 minutes.",
     es:"tofu",prepEs:"Seca bien el tofu y córtalo en cubitos.",cookEs:"Fríe el tofu hasta que esté dorado, de 6 a 8 minutos."},
    {name:"Bacon",ing:"4 slices|bacon",prep:"Chop the bacon.",cook:"Cook the bacon until crisp, 5 to 6 minutes, then pour off most of the fat.",
     es:"tocino",prepEs:"Pica el tocino.",cookEs:"Cocina el tocino hasta que esté crujiente, de 5 a 6 minutos, y retira casi toda la grasa."}
  ];
  const V = [
    {name:"Peas and Carrots",ing:["1/2 cup|peas","1|carrot"],prep:"Dice the carrot.",es:"chícharos y zanahoria",low:"los chícharos y la zanahoria",prepEs:"Corta la zanahoria en cubitos."},
    {name:"Broccoli",ing:["1 1/2 cups|broccoli"],prep:"Chop the broccoli into small pieces.",es:"brócoli",low:"el brócoli",prepEs:"Pica el brócoli en trozos pequeños."},
    {name:"Bell Pepper",ing:["1|bell pepper"],prep:"Dice the pepper.",es:"pimiento",low:"el pimiento",prepEs:"Corta el pimiento en cubitos."},
    {name:"Cabbage",ing:["2 cups|cabbage"],prep:"Shred the cabbage.",es:"repollo",low:"el repollo",prepEs:"Pica finamente el repollo."},
    {name:"Corn",ing:["1 cup|corn"],prep:"",es:"elote",low:"el elote",prepEs:""}
  ];
  for (const p of P) for (const v of V) GENERATED.push({
    name: `${p.name} Fried Rice with ${v.name}`, type: "Dinner", time: 25, serves: 4,
    ing: ["3 cups|rice", "2|eggs", p.ing, ...v.ing, "2 cloves|garlic", "3 tbsp|soy sauce", "2|scallions|o", "2 tbsp|oil"],
    steps: [
      "Cold leftover rice works best. If your rice is freshly cooked, spread it on a plate and chill it for 20 minutes so it doesn't turn mushy.",
      clean([p.prep, v.prep, "Mince the garlic and slice the scallions, if using."]).join(" "),
      `Heat 1 tablespoon of oil in a large skillet over medium-high heat. ${p.cook}`,
      `Add the ${lc(v.name)} and garlic and cook for 2 to 3 minutes.`,
      "Push everything to one side, add the remaining oil, and scramble the eggs in the empty space.",
      "Add the rice, breaking up any clumps, and stir-fry until hot, 3 to 4 minutes. Stir in the soy sauce and top with scallions."
    ],
    es: { name: `Arroz frito con ${p.es} y ${v.es}`, steps: [
      "El arroz frío del día anterior funciona mejor. Si está recién hecho, extiéndelo en un plato y enfríalo 20 minutos para que no quede pegajoso.",
      clean([p.prepEs, v.prepEs, "Pica el ajo y rebana las cebollitas, si las usas."]).join(" "),
      `Calienta 1 cucharada de aceite en una sartén grande a fuego medio-alto. ${p.cookEs}`,
      `Agrega ${v.low} y el ajo y cocina de 2 a 3 minutos.`,
      "Empuja todo hacia un lado, agrega el resto del aceite y revuelve los huevos en el espacio libre.",
      "Agrega el arroz, deshaciendo los grumos, y saltea hasta que esté caliente, de 3 a 4 minutos. Añade la salsa de soya y decora con cebollitas."
    ] }
  });
})();

/* Omelettes */
(function () {
  const F = [
    {name:"Spinach",ing:"1 cup|spinach",cook:"spinach until wilted, about 1 minute",es:"espinaca",low:"la espinaca",cookEs:"la espinaca hasta que se marchite, cerca de 1 minuto"},
    {name:"Mushroom",lowEn:"mushrooms",ing:"1/2 cup|mushrooms",cook:"sliced mushrooms until browned, 4 to 5 minutes",es:"champiñones",low:"los champiñones",cookEs:"los champiñones rebanados hasta que se doren, de 4 a 5 minutos"},
    {name:"Ham",ing:"1/4 cup|ham",prep:"Dice the ham.",es:"jamón",low:"el jamón",prepEs:"Corta el jamón en cubitos."},
    {name:"Pepper",lowEn:"peppers",ing:"1/4|bell pepper",cook:"diced pepper until soft, 3 to 4 minutes",es:"pimiento",low:"el pimiento",cookEs:"el pimiento picado hasta que se suavice, de 3 a 4 minutos"},
    {name:"Onion",ing:"1/4|onion",cook:"diced onion until soft, 4 to 5 minutes",es:"cebolla",low:"la cebolla",cookEs:"la cebolla picada hasta que se suavice, de 4 a 5 minutos"},
    {name:"Tomato",ing:"1 small|tomato",prep:"Dice the tomato and pat it dry.",es:"tomate",low:"el tomate",prepEs:"Corta el tomate en cubitos y sécalo con papel."},
    {name:"Bacon",ing:"2 slices|bacon",cook:"chopped bacon until crisp, 5 to 6 minutes",es:"tocino",low:"el tocino",cookEs:"el tocino picado hasta que esté crujiente, de 5 a 6 minutos"},
    {name:"Zucchini",ing:"1/4|zucchini",cook:"diced zucchini until tender, 3 to 4 minutes",es:"calabacita",low:"la calabacita",cookEs:"la calabacita picada hasta que esté tierna, de 3 a 4 minutos"},
    {name:"Cheese",ing:"1/4 cup|cheddar cheese",prep:"Shred the cheese if needed.",es:"queso",low:"el queso",prepEs:"Ralla el queso si hace falta."}
  ];
  for (const [a, b] of pairs(F)) {
    const cooks = [a, b].filter(f => f.cook);
    GENERATED.push({
      name: `${a.name} and ${b.name} Omelette`, type: "Breakfast", time: 15, serves: 1,
      ing: ["3|eggs", "1 tbsp|milk|o", "1 tbsp|butter", a.ing, b.ing, "|salt", "|pepper"],
      steps: clean([
        clean([a.prep, b.prep]).join(" "),
        cooks.length ? `Melt a little of the butter in a nonstick pan over medium heat and cook the ${cooks.map(f => f.cook).join(", then the ")}. Set the filling aside.` : "",
        "Whisk the eggs with the milk if using, a pinch of salt, and some pepper.",
        "Melt the remaining butter in the pan over medium-low heat. Pour in the eggs and cook, gently pulling the edges toward the center, until mostly set but still a little glossy on top, 2 to 3 minutes.",
        `Scatter the ${a.lowEn || lc(a.name)} and ${b.lowEn || lc(b.name)} over one half, fold the omelette over, and slide it onto a plate.`
      ]),
      es: { name: `Omelet de ${a.es} y ${b.es}`, steps: clean([
        clean([a.prepEs, b.prepEs]).join(" "),
        cooks.length ? `Derrite un poco de la mantequilla en una sartén antiadherente a fuego medio y cocina ${cooks.map(f => f.cookEs).join(", y luego ")}. Reserva el relleno.` : "",
        "Bate los huevos con la leche si la usas, una pizca de sal y un poco de pimienta.",
        "Derrite el resto de la mantequilla a fuego medio-bajo. Vierte los huevos y cocina, llevando las orillas hacia el centro con cuidado, hasta que estén casi cuajados pero todavía un poco brillantes arriba, de 2 a 3 minutos.",
        `Reparte ${a.low} y ${b.low} sobre una mitad, dobla el omelet y pásalo a un plato.`
      ]) }
    });
  }
})();

/* Pasta */
(function () {
  const V = [
    {name:"Spinach",ing:"4 cups|spinach",how:"wilt",es:"espinaca",low:"la espinaca"},
    {name:"Broccoli",ing:"3 cups|broccoli",how:"boil",prep:"Cut the broccoli into small florets.",es:"brócoli",low:"el brócoli",prepEs:"Corta el brócoli en floretes pequeños."},
    {name:"Zucchini",ing:"2|zucchini",how:"saute",prep:"Halve and slice the zucchini.",es:"calabacita",low:"la calabacita",prepEs:"Parte la calabacita a la mitad y rebánala."},
    {name:"Mushroom",lowEn:"mushrooms",ing:"8 oz|mushrooms",how:"saute",prep:"Slice the mushrooms.",es:"champiñones",low:"los champiñones",prepEs:"Rebana los champiñones."},
    {name:"Bell Pepper",lowEn:"peppers",ing:"2|bell peppers",how:"saute",prep:"Slice the peppers into thin strips.",es:"pimiento",low:"los pimientos",prepEs:"Corta los pimientos en tiras delgadas."},
    {name:"Asparagus",ing:"1 bunch|asparagus",how:"boil",prep:"Snap off the woody ends of the asparagus and cut it into 2 inch pieces.",es:"espárragos",low:"los espárragos",prepEs:"Quita la parte dura de los espárragos y córtalos en trozos de 5 cm (2 pulgadas)."}
  ];
  const S = [
    {id:"garlic",title:v=>`${v.name} Pasta with Garlic and Parmesan`,titleEs:v=>`Pasta con ${v.es}, ajo y parmesano`,
     ing:["4 cloves|garlic","1/4 cup|olive oil","1/2 cup|parmesan","|red pepper flakes|o"],
     make:"Warm the olive oil in the skillet over medium-low heat. Add the sliced garlic, and the pepper flakes if using, and cook until fragrant and barely golden, 2 to 3 minutes.",
     makeEs:"Calienta el aceite de oliva en la sartén a fuego medio-bajo. Agrega el ajo rebanado, y las hojuelas de chile si las usas, y cocina hasta que suelte aroma y apenas se dore, de 2 a 3 minutos.",
     finish:"Toss with the parmesan and splashes of pasta water until glossy.",
     finishEs:"Mezcla con el parmesano y chorritos del agua de la pasta hasta que brille."},
    {id:"tomato",title:v=>`${v.name} Pasta in Tomato Sauce`,titleEs:v=>`Pasta con ${v.es} en salsa de tomate`,
     ing:["1 can (28 oz)|canned tomatoes","1/2|onion","3 cloves|garlic","2 tbsp|olive oil","|basil|o"],
     make:"Heat the olive oil in the skillet over medium heat. Cook the diced onion until soft, about 5 minutes, then add the garlic for 30 seconds. Add the tomatoes, crush them with a spoon, and simmer for 15 minutes. Season with salt.",
     makeEs:"Calienta el aceite de oliva en la sartén a fuego medio. Cocina la cebolla picada hasta que se suavice, unos 5 minutos, y luego agrega el ajo por 30 segundos. Añade los tomates, aplástalos con una cuchara y cocina a fuego lento 15 minutos. Sazona con sal.",
     finish:"Toss, adding pasta water if the sauce is thick. Top with basil if you have it.",
     finishEs:"Mezcla, agregando agua de la pasta si la salsa está espesa. Decora con albahaca si tienes."},
    {id:"cream",title:v=>`Creamy ${v.name} Pasta`,titleEs:v=>`Pasta cremosa con ${v.es}`,
     ing:["1 cup|cream","1/2 cup|parmesan","2 cloves|garlic","2 tbsp|butter"],
     make:"Melt the butter in the skillet over medium heat. Add the minced garlic for 30 seconds, then the cream. Simmer gently until slightly thickened, 3 to 4 minutes.",
     makeEs:"Derrite la mantequilla en la sartén a fuego medio. Agrega el ajo picado por 30 segundos y luego la crema. Cocina a fuego lento hasta que espese un poco, de 3 a 4 minutos.",
     finish:"Stir in the parmesan, loosening the sauce with pasta water as needed.",
     finishEs:"Agrega el parmesano, aflojando la salsa con agua de la pasta si hace falta."}
  ];
  for (const v of V) for (const s of S) {
    const low = v.lowEn || lc(v.name), saute = v.how === "saute";
    GENERATED.push({
      name: s.title(v), type: "Dinner", time: s.id === "tomato" ? 30 : 25, serves: 4,
      ing: clean(["12 oz|pasta", v.ing, ...s.ing, saute ? "1 tbsp|oil" : "", "|salt"]),
      steps: clean([
        v.prep,
        "Bring a large pot of salted water to a boil. Cook the pasta until al dente, following the package time. Save 1 cup of the pasta water before draining." + (v.how === "boil" ? ` Add the ${low} to the pot for the last 3 minutes.` : ""),
        saute ? `Meanwhile, heat the oil in a large skillet over medium-high heat and cook the ${low} until tender and lightly browned, 4 to 6 minutes. Move them to a plate.` : "",
        (saute ? "" : "Meanwhile, use a large skillet. ") + s.make,
        `Add the drained pasta${saute ? ` and the ${low}` : ""} to the skillet.` + (v.how === "wilt" ? " Add the spinach and toss until it wilts." : "") + " " + s.finish
      ]),
      es: { name: s.titleEs(v), steps: clean([
        v.prepEs,
        "Pon a hervir una olla grande de agua con sal. Cocina la pasta al dente, según el paquete. Guarda 1 taza del agua de cocción antes de escurrir." + (v.how === "boil" ? ` Agrega ${v.low} a la olla durante los últimos 3 minutos.` : ""),
        saute ? `Mientras tanto, calienta el aceite en una sartén grande a fuego medio-alto y cocina ${v.low} hasta dorar un poco, de 4 a 6 minutos. Reserva en un plato.` : "",
        (saute ? "" : "Mientras tanto, usa una sartén grande. ") + s.makeEs,
        `Agrega la pasta escurrida${saute ? ` y ${v.low}` : ""} a la sartén.` + (v.how === "wilt" ? " Añade la espinaca y mezcla hasta que se marchite." : "") + " " + s.finishEs
      ]) }
    });
  }
})();

/* Blended soups */
(function () {
  const V = [
    {name:"Potato",ing:"4|potatoes",prep:"Peel and cube the potatoes.",t:"15 to 20 minutes",es:"papa",low:"las papas",prepEs:"Pela y corta las papas en cubos.",tEs:"de 15 a 20 minutos"},
    {name:"Carrot",ing:"6|carrots",prep:"Peel and slice the carrots.",t:"20 to 25 minutes",es:"zanahoria",low:"las zanahorias",prepEs:"Pela y rebana las zanahorias.",tEs:"de 20 a 25 minutos"},
    {name:"Broccoli",ing:"1 head|broccoli",prep:"Chop the broccoli.",t:"10 to 12 minutes",es:"brócoli",low:"el brócoli",prepEs:"Pica el brócoli.",tEs:"de 10 a 12 minutos"},
    {name:"Cauliflower",ing:"1 head|cauliflower",prep:"Chop the cauliflower.",t:"15 to 18 minutes",es:"coliflor",low:"la coliflor",prepEs:"Pica la coliflor.",tEs:"de 15 a 18 minutos"},
    {name:"Butternut Squash",ing:"1|butternut squash",prep:"Peel, seed, and cube the squash.",t:"20 to 25 minutes",es:"calabaza",low:"la calabaza",prepEs:"Pela la calabaza, quítale las semillas y córtala en cubos.",tEs:"de 20 a 25 minutos"},
    {name:"Sweet Potato",ing:"3|sweet potatoes",prep:"Peel and cube the sweet potatoes.",t:"15 to 20 minutes",es:"camote",low:"los camotes",prepEs:"Pela y corta los camotes en cubos.",tEs:"de 15 a 20 minutos"},
    {name:"Mushroom",lowEn:"mushrooms",ing:"1 lb|mushrooms",prep:"Slice the mushrooms.",t:"10 to 12 minutes",es:"champiñones",low:"los champiñones",prepEs:"Rebana los champiñones.",tEs:"de 10 a 12 minutos"},
    {name:"Pea",lowEn:"peas",ing:"4 cups|peas",prep:"",t:"5 minutes",es:"chícharos",low:"los chícharos",prepEs:"",tEs:"unos 5 minutos"}
  ];
  for (const v of V) GENERATED.push({
    name: `Creamy ${v.name} Soup`, type: "Lunch", time: 40, serves: 4,
    ing: [v.ing, "1|onion", "2 cloves|garlic", "4 cups|broth", "2 tbsp|butter", "1/2 cup|cream|o", "|salt", "|pepper"],
    steps: clean([
      clean([v.prep, "Chop the onion and garlic."]).join(" "),
      "Melt the butter in a large pot over medium heat. Cook the onion until soft, about 5 minutes, then add the garlic for 30 seconds.",
      `Add the ${v.lowEn || lc(v.name)} and broth. Bring to a boil, then simmer until very tender, ${v.t}.`,
      "Blend until smooth with an immersion blender, or carefully in batches in a regular blender with the lid vented.",
      "Stir in the cream if using, season with salt and pepper, and warm through."
    ]),
    es: { name: `Crema de ${v.es}`, steps: clean([
      clean([v.prepEs, "Pica la cebolla y el ajo."]).join(" "),
      "Derrite la mantequilla en una olla grande a fuego medio. Cocina la cebolla hasta que se suavice, unos 5 minutos, y luego agrega el ajo por 30 segundos.",
      `Agrega ${v.low} y el caldo. Deja que hierva y luego cocina a fuego lento hasta que todo esté muy suave, ${v.tEs}.`,
      "Licúa hasta que quede terso con una licuadora de inmersión, o con cuidado por tandas en una licuadora normal con la tapa entreabierta para que salga el vapor.",
      "Agrega la crema si la usas, sazona con sal y pimienta y calienta bien."
    ]) }
  });
})();

/* Quesadillas */
(function () {
  const F = [
    {name:"Chicken",ing:"1 cup|chicken",prep:"Shred or chop cooked chicken (leftovers or rotisserie work great).",es:"pollo",prepEs:"Deshebra o pica pollo cocido (las sobras o el pollo rostizado funcionan muy bien)."},
    {name:"Black Bean",ing:"1 cup|black beans",prep:"Rinse and drain the beans.",es:"frijoles negros",prepEs:"Enjuaga y escurre los frijoles."},
    {name:"Spinach",ing:"1 cup|spinach",prep:"Roughly chop the spinach.",es:"espinaca",prepEs:"Pica la espinaca."},
    {name:"Mushroom",ing:"1 cup|mushrooms",cook:"mushrooms",es:"champiñones",cookEs:"los champiñones"},
    {name:"Pepper",ing:"1|bell pepper",cook:"peppers",es:"pimiento",cookEs:"el pimiento"},
    {name:"Corn",ing:"1/2 cup|corn",prep:"",es:"elote",prepEs:""}
  ];
  for (const [a, b] of pairs(F)) {
    const cooks = [a, b].filter(f => f.cook);
    GENERATED.push({
      name: `${a.name} and ${b.name} Quesadillas`, type: "Lunch", time: 20, serves: 2,
      ing: ["4|tortillas", "1 1/2 cups|cheese", a.ing, b.ing, "1 tbsp|oil", "|salsa|o", "|sour cream|o"],
      steps: clean([
        clean([a.prep, b.prep]).join(" "),
        cooks.length ? `Slice the ${cooks.map(f => f.cook).join(" and ")} and cook in the oil over medium-high heat until soft, about 5 minutes.` : "",
        "Sprinkle cheese over half of each tortilla, add the fillings, top with a little more cheese, and fold.",
        "Cook in a dry or lightly oiled skillet over medium heat until golden and the cheese melts, 2 to 3 minutes per side.",
        "Cut into wedges and serve with salsa and sour cream."
      ]),
      es: { name: `Quesadillas de ${a.es} y ${b.es}`, steps: clean([
        clean([a.prepEs, b.prepEs]).join(" "),
        cooks.length ? `Rebana ${cooks.map(f => f.cookEs).join(" y ")} y cocina en el aceite a fuego medio-alto hasta suavizar, unos 5 minutos.` : "",
        "Espolvorea queso sobre la mitad de cada tortilla, agrega el relleno, cubre con un poco más de queso y dobla.",
        "Cocina en una sartén seca o con poco aceite a fuego medio hasta que se doren y el queso se derrita, de 2 a 3 minutos por lado.",
        "Corta en triángulos y sirve con salsa y crema agria."
      ]) }
    });
  }
})();

/* Smoothies */
(function () {
  const F = [
    {name:"Banana",ing:"1|banana",es:"plátano"}, {name:"Strawberry",ing:"1 cup|strawberries",es:"fresa"},
    {name:"Blueberry",ing:"1 cup|blueberries",es:"arándanos"}, {name:"Mango",ing:"1 cup|mango",es:"mango"},
    {name:"Peach",ing:"1 cup|peaches",es:"durazno"}, {name:"Pineapple",ing:"1 cup|pineapple",es:"piña"}
  ];
  for (const [a, b] of pairs(F)) GENERATED.push({
    name: `${a.name} ${b.name} Smoothie`, type: "Drink", time: 5, serves: 2,
    ing: [a.ing, b.ing, "1/2 cup|yogurt", "3/4 cup|milk", "1 handful|spinach|o", "1 tsp|honey|o"],
    steps: [
      "Add everything to a blender, liquids first.",
      "Blend until smooth, adding more milk if it's too thick. If all your fruit is fresh, add a few ice cubes to make it cold and thick."
    ],
    es: { name: `Licuado de ${a.es} y ${b.es}`, steps: [
      "Pon todo en la licuadora, primero los líquidos.",
      "Licúa hasta que quede terso y agrega más leche si está muy espeso. Si toda tu fruta es fresca, agrega unos cubos de hielo para que quede frío y espeso."
    ] }
  });
})();

/* Sheet-pan dinners */
(function () {
  const P = [
    {name:"Chicken Thighs",lowEn:"chicken",ing:"1 1/2 lb|chicken thighs",t:30,prep:"Pat the chicken dry.",done:"until the chicken reaches 165F inside",
     es:"Muslos de pollo",low:"el pollo",prepEs:"Seca el pollo con papel.",doneEs:"hasta que el pollo llegue a 74 °C (165 °F) por dentro"},
    {name:"Sausage",ing:"1 lb|sausage",t:25,prep:"Cut the sausage into 2 inch pieces.",done:"until the sausage is browned and reaches 160F",
     es:"Salchicha",low:"la salchicha",prepEs:"Corta la salchicha en trozos de 5 cm (2 pulgadas).",doneEs:"hasta que la salchicha se dore y llegue a 71 °C (160 °F)"},
    {name:"Salmon",ing:"4 fillets|salmon",t:12,prep:"Pat the salmon dry.",done:"until the salmon flakes easily (145F)",
     es:"Salmón",low:"el salmón",prepEs:"Seca el salmón con papel.",doneEs:"hasta que el salmón se desmenuce fácilmente (63 °C / 145 °F)"},
    {name:"Tofu",ing:"14 oz|tofu",t:25,prep:"Press the tofu dry and cut it into cubes.",done:"until the tofu is golden",
     es:"Tofu",low:"el tofu",prepEs:"Seca bien el tofu y córtalo en cubos.",doneEs:"hasta que el tofu esté dorado"},
    {name:"Crispy Chickpeas",lowEn:"chickpeas",ing:"1 can|chickpeas",t:25,prep:"Rinse the chickpeas and dry them well on a towel.",done:"until the chickpeas are crisp",
     es:"Garbanzos crujientes",low:"los garbanzos",prepEs:"Enjuaga los garbanzos y sécalos muy bien con un trapo.",doneEs:"hasta que los garbanzos estén crujientes"}
  ];
  const V = [
    {name:"Potatoes",ing:"1 1/2 lb|potatoes",t:40,prep:"Cut the potatoes into 1 inch chunks.",es:"papas",low:"las papas",prepEs:"Corta las papas en trozos de 2.5 cm (1 pulgada)."},
    {name:"Broccoli",ing:"1 head|broccoli",t:20,prep:"Cut the broccoli into florets.",es:"brócoli",low:"el brócoli",prepEs:"Corta el brócoli en floretes."},
    {name:"Carrots",ing:"1 lb|carrots",t:30,prep:"Cut the carrots into sticks.",es:"zanahorias",low:"las zanahorias",prepEs:"Corta las zanahorias en bastones."},
    {name:"Peppers",ing:"2|bell peppers",t:20,prep:"Cut the peppers into wide strips.",es:"pimientos",low:"los pimientos",prepEs:"Corta los pimientos en tiras anchas."},
    {name:"Brussels Sprouts",ing:"1 lb|brussels sprouts",t:25,prep:"Trim and halve the brussels sprouts.",es:"coles de Bruselas",low:"las coles de Bruselas",prepEs:"Recorta y parte a la mitad las coles de Bruselas."},
    {name:"Sweet Potatoes",ing:"2|sweet potatoes",t:30,prep:"Cut the sweet potatoes into 1 inch chunks.",es:"camotes",low:"los camotes",prepEs:"Corta los camotes en trozos de 2.5 cm (1 pulgada)."}
  ];
  for (const p of P) for (const v of V) {
    const pl = p.lowEn || lc(p.name), vl = lc(v.name);
    let roast, roastEs;
    if (v.t > p.t) {
      roast = `Spread the ${vl} on a large sheet pan and roast for ${v.t - p.t} minutes. Add the ${pl} to the pan and roast for ${p.t} minutes more, ${p.done} and the vegetables are tender.`;
      roastEs = `Extiende ${v.low} en una charola grande y hornea ${v.t - p.t} minutos. Agrega ${p.low} a la charola y hornea ${p.t} minutos más, ${p.doneEs} y las verduras estén tiernas.`;
    } else if (v.t < p.t) {
      roast = `Spread the ${pl} on a large sheet pan and roast for ${p.t - v.t} minutes. Add the ${vl} and roast for ${v.t} minutes more, ${p.done} and the vegetables are tender.`;
      roastEs = `Extiende ${p.low} en una charola grande y hornea ${p.t - v.t} minutos. Agrega ${v.low} y hornea ${v.t} minutos más, ${p.doneEs} y las verduras estén tiernas.`;
    } else {
      roast = `Spread everything on a large sheet pan and roast for ${p.t} minutes, ${p.done} and the vegetables are tender.`;
      roastEs = `Extiende todo en una charola grande y hornea ${p.t} minutos, ${p.doneEs} y las verduras estén tiernas.`;
    }
    GENERATED.push({
      name: `Sheet-Pan ${p.name} with ${v.name}`, type: "Dinner", time: Math.max(p.t, v.t) + 10, serves: 4,
      ing: [p.ing, v.ing, "3 tbsp|olive oil", "1 tsp|paprika", "|salt", "|pepper", "1|lemon|o"],
      steps: ["Heat the oven to 425F (220C).", `${v.prep} ${p.prep} Toss each with olive oil, paprika, salt, and pepper.`, roast, "Squeeze lemon over the top if you have one, and serve."],
      es: { name: `${p.es} al horno con ${v.es}`, steps: ["Precalienta el horno a 220 °C (425 °F).", `${v.prepEs} ${p.prepEs} Mezcla cada uno con aceite de oliva, paprika, sal y pimienta.`, roastEs, "Exprime limón encima si tienes y sirve."] }
    });
  }
})();

/* Coconut curries */
(function () {
  const P = [
    {name:"Chicken",ing:"1 lb|chicken breast",prep:"Cut the chicken into bite-size pieces.",stage:"start",sim:[12,15],es:"pollo",prepEs:"Corta el pollo en trozos pequeños."},
    {name:"Chickpea",lowEn:"chickpeas",ing:"1 can|chickpeas",prep:"Rinse and drain the chickpeas.",stage:"simmer",sim:[10,15],es:"garbanzos",low:"los garbanzos",prepEs:"Enjuaga y escurre los garbanzos."},
    {name:"Shrimp",ing:"1 lb|shrimp",prep:"Peel and devein the shrimp if needed.",stage:"end",es:"camarones",prepEs:"Pela y desvena los camarones si hace falta."},
    {name:"Tofu",ing:"14 oz|tofu",prep:"Press the tofu dry and cut it into cubes.",stage:"first",es:"tofu",prepEs:"Seca bien el tofu y córtalo en cubos."},
    {name:"Red Lentil",lowEn:"lentils",ing:"1 cup|red lentils",prep:"Rinse the lentils.",stage:"simmer",sim:[20,25],es:"lentejas rojas",low:"las lentejas",prepEs:"Enjuaga las lentejas."}
  ];
  const V = [
    {name:"Spinach",ing:"4 cups|spinach",stage:"end",es:"espinaca"},
    {name:"Potato",lowEn:"potatoes",ing:"2|potatoes",prep:"Cut the potatoes into small cubes.",stage:"simmer",sim:[15,20],es:"papa",low:"las papas",prepEs:"Corta las papas en cubos pequeños."},
    {name:"Cauliflower",ing:"1/2 head|cauliflower",prep:"Cut the cauliflower into small florets.",stage:"simmer",sim:[12,15],es:"coliflor",low:"la coliflor",prepEs:"Corta la coliflor en floretes pequeños."},
    {name:"Pepper",lowEn:"peppers",ing:"2|bell peppers",prep:"Cut the peppers into chunks.",stage:"simmer",sim:[8,10],es:"pimiento",low:"los pimientos",prepEs:"Corta los pimientos en trozos."}
  ];
  for (const p of P) for (const v of V) {
    const pl = p.lowEn || lc(p.name), vl = v.lowEn || lc(v.name);
    const simmerers = [p, v].filter(x => x.stage === "simmer");
    const sims = [p, v].filter(x => x.sim).map(x => x.sim);
    const lo = sims.length ? Math.max(...sims.map(s => s[0])) : 10;
    const hi = sims.length ? Math.max(...sims.map(s => s[1])) : 10;
    const ends = [], endsEs = [];
    if (p.stage === "first") { ends.push("Stir the tofu back in."); endsEs.push("Regresa el tofu a la olla."); }
    if (p.stage === "end") { ends.push("Add the shrimp and simmer until pink, 3 to 4 minutes."); endsEs.push("Agrega los camarones y cocina hasta que estén rosados, de 3 a 4 minutos."); }
    if (v.stage === "end") { ends.push("Stir in the spinach until it wilts, 1 to 2 minutes."); endsEs.push("Agrega la espinaca y mezcla hasta que se marchite, de 1 a 2 minutos."); }
    const lentil = p.name === "Red Lentil";
    GENERATED.push({
      name: `${p.name} and ${v.name} Curry`, type: "Dinner", time: hi + 25, serves: 4,
      ing: [p.ing, v.ing, "1|onion", "3 cloves|garlic", "1 tbsp|ginger|o", "2 tbsp|curry powder", "1 can|coconut milk", "1 can (14 oz)|canned tomatoes", "2 tbsp|oil", "|salt", "|rice|o"],
      steps: clean([
        clean(["Chop the onion and mince the garlic and ginger.", p.prep, v.prep]).join(" "),
        p.stage === "first" ? "Fry the tofu in 1 tablespoon of the oil in a large pot over medium-high heat until golden, 6 to 8 minutes. Set it aside." : "",
        `Heat ${p.stage === "first" ? "the remaining" : "the"} oil in a large pot over medium heat. Cook the onion until soft, about 5 minutes. Add the garlic, ginger, and curry powder and stir for 1 minute.`,
        p.stage === "start" ? "Add the chicken and cook until no longer pink on the outside, 4 to 5 minutes." : "",
        `Pour in the coconut milk and tomatoes${lentil ? ", plus 2 cups of water" : ""}.` +
          (simmerers.length ? ` Add the ${simmerers.map(x => x === p ? pl : vl).join(" and ")}.` : "") +
          ` Simmer, stirring now and then, for ${lo === hi ? lo : lo + " to " + hi} minutes${sims.length ? ", until everything is tender and cooked through" : " to let the flavors come together"}.`,
        ends.join(" "),
        "Season with salt and serve over rice."
      ]),
      es: { name: `Curry de ${p.es} y ${v.es}`, steps: clean([
        clean(["Pica la cebolla, el ajo y el jengibre.", p.prepEs, v.prepEs]).join(" "),
        p.stage === "first" ? "Fríe el tofu en 1 cucharada del aceite en una olla grande a fuego medio-alto hasta que se dore, de 6 a 8 minutos. Resérvalo." : "",
        `Calienta ${p.stage === "first" ? "el resto del" : "el"} aceite en una olla grande a fuego medio. Cocina la cebolla hasta que se suavice, unos 5 minutos. Agrega el ajo, el jengibre y el curry en polvo y revuelve por 1 minuto.`,
        p.stage === "start" ? "Agrega el pollo y cocina hasta que ya no esté rosado por fuera, de 4 a 5 minutos." : "",
        `Vierte la leche de coco y los tomates${lentil ? ", más 2 tazas de agua" : ""}.` +
          (simmerers.length ? ` Agrega ${simmerers.map(x => x.low).join(" y ")}.` : "") +
          ` Cocina a fuego lento, moviendo de vez en cuando, ${lo === hi ? "durante " + lo : "de " + lo + " a " + hi} minutos${sims.length ? ", hasta que todo esté suave y bien cocido" : " para que se mezclen los sabores"}.`,
        endsEs.join(" "),
        "Sazona con sal y sirve con arroz."
      ]) }
    });
  }
})();

/* Tacos */
(function () {
  const P = [
    {name:"Ground Beef",lowEn:"beef",ing:"1 lb|ground beef",cook:"Brown the beef in a skillet over medium-high heat, breaking it up, until no pink remains, 7 to 8 minutes. Drain extra fat. Add the spice mix and 1/3 cup of water and simmer until thick, about 3 minutes.",
     es:"carne molida",low:"la carne",cookEs:"Dora la carne en una sartén a fuego medio-alto, desmenuzándola, hasta que ya no esté rosada, de 7 a 8 minutos. Escurre el exceso de grasa. Agrega la mezcla de especias y 1/3 de taza de agua y cocina hasta que espese, unos 3 minutos."},
    {name:"Chicken",ing:"1 lb|chicken thighs",cook:"Rub the chicken with the spice mix and cook in a little oil over medium-high heat until it reaches 165F, 5 to 6 minutes per side. Rest for 5 minutes, then slice.",
     es:"pollo",low:"el pollo",cookEs:"Unta el pollo con la mezcla de especias y cocínalo con un poco de aceite a fuego medio-alto hasta que llegue a 74 °C (165 °F), de 5 a 6 minutos por lado. Déjalo reposar 5 minutos y rebánalo."},
    {name:"Black Bean",lowEn:"beans",ing:"2 cans|black beans",cook:"Warm the rinsed beans in a pan with a splash of water and the spice mix for 5 minutes, mashing a few.",
     es:"frijoles negros",low:"los frijoles",cookEs:"Calienta los frijoles enjuagados en una sartén con un chorrito de agua y la mezcla de especias por 5 minutos, aplastando algunos."},
    {name:"Shrimp",ing:"1 lb|shrimp",cook:"Toss the shrimp with the spice mix and cook in a little oil over medium-high heat until pink, 1 to 2 minutes per side.",
     es:"camarones",low:"los camarones",cookEs:"Mezcla los camarones con las especias y cocínalos con un poco de aceite a fuego medio-alto hasta que estén rosados, de 1 a 2 minutos por lado."},
    {name:"Fish",ing:"1 lb|fish",cook:"Season the fish with the spice mix and cook in a little oil over medium-high heat until it flakes easily, 3 to 4 minutes per side. Break it into chunks.",
     es:"pescado",low:"el pescado",cookEs:"Sazona el pescado con las especias y cocínalo con un poco de aceite a fuego medio-alto hasta que se desmenuce fácilmente, de 3 a 4 minutos por lado. Desmenúzalo en trozos."}
  ];
  for (const p of P) GENERATED.push({
    name: `${p.name} Tacos`, type: "Dinner", time: 25, serves: 4,
    ing: [p.ing, "8|tortillas", "1 tsp|chili powder", "1 tsp|cumin", "1 cup|lettuce|o", "1|tomato|o", "1/2 cup|cheese|o", "|salsa|o", "|avocado|o", "1|lime|o", "|cilantro|o", "|sour cream|o"],
    steps: [
      "Mix the chili powder, cumin, and a pinch of salt.",
      p.cook,
      "Warm the tortillas in a dry skillet, or wrap them in a damp towel and microwave for 30 seconds.",
      `Fill with the ${p.lowEn || lc(p.name)} and whatever toppings you have: lettuce, tomato, cheese, salsa, avocado, cilantro, sour cream, and a squeeze of lime.`
    ],
    es: { name: `Tacos de ${p.es}`, steps: [
      "Mezcla el chile en polvo, el comino y una pizca de sal.",
      p.cookEs,
      "Calienta las tortillas en un comal o sartén seca, o envuélvelas en un trapo húmedo y caliéntalas 30 segundos en el microondas.",
      `Rellena con ${p.low} y los toppings que tengas: lechuga, tomate, queso, salsa, aguacate, cilantro, crema agria y un chorrito de limón.`
    ] }
  });
})();

/* ---------------- Recipes added by the site owner ----------------
   Copy this pattern (serves and es are optional):
   {name:"My Recipe", type:"Dinner", time:30, serves:4,
    ing:["2 cups|rice","1|onion","|cilantro|o"],
    steps:["Step one.","Step two."]},
*/
const MY_RECIPES = [

];

const RECIPES = [...CLASSICS, ...GENERATED, ...MY_RECIPES];
RECIPES.forEach(r => { if (!r.serves) r.serves = SERVES[r.name] || 4; });
