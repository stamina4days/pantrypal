/* Meal-prep recipes and recipe details (cuisine, how long it keeps, equipment).
   Loaded after recipes.js. Each recipe carries English and Spanish text. */

/* [cuisine, days it keeps cooked in the fridge (0 = eat fresh), freezes?, equipment] */
const CLASSIC_META = {
  "Fluffy Pancakes": ["American", 3, true, []], "French Toast": ["American", 1, false, []], "Banana Bread": ["American", 4, true, ["oven"]],
  "Overnight Oats": ["American", 4, false, []], "Scrambled Eggs on Toast": ["American", 0, false, []], "Shakshuka": ["Mediterranean", 0, false, []],
  "Grilled Cheese": ["American", 0, false, []], "Tomato Soup": ["American", 4, true, ["blender"]], "Chicken Noodle Soup": ["American", 4, true, []],
  "Lentil Soup": ["Mediterranean", 5, true, []], "Easy Beef Chili": ["American", 5, true, []], "Spaghetti Bolognese": ["Italian", 4, true, []],
  "Stovetop Mac and Cheese": ["American", 3, false, []], "Pasta Carbonara": ["Italian", 0, false, []], "Pesto Pasta": ["Italian", 3, false, ["blender"]],
  "Chicken Fajitas": ["Mexican", 3, false, []], "Beef Stew": ["American", 4, true, []], "Shepherd's Pie": ["American", 4, true, ["oven"]],
  "Stuffed Bell Peppers": ["American", 4, true, ["oven"]], "Classic Meatballs": ["Italian", 4, true, ["oven"]],
  "Lemon Garlic Baked Salmon": ["Mediterranean", 2, false, ["oven"]], "Greek Salad": ["Mediterranean", 1, false, []],
  "Caprese Salad": ["Italian", 0, false, []], "Chicken Caesar Salad": ["American", 1, false, []], "BLT Sandwich": ["American", 0, false, []],
  "Tuna Salad Sandwich": ["American", 3, false, []], "Egg Salad": ["American", 3, false, []], "Potato Salad": ["American", 4, false, []],
  "Creamy Coleslaw": ["American", 3, false, []], "Guacamole": ["Mexican", 1, false, []], "Hummus": ["Mediterranean", 5, true, ["blender"]],
  "Mashed Potatoes": ["American", 4, true, []], "Apple Crisp": ["American", 4, true, ["oven"]], "Black Bean Soup": ["Mexican", 5, true, ["blender"]],
  "Loaded Baked Potatoes": ["American", 3, false, ["oven"]], "Cucumber Salad": ["Mediterranean", 2, false, []], "Fresh Salsa": ["Mexican", 3, false, []],
  "Tomato Bruschetta": ["Italian", 0, false, []], "Rice Pudding": ["American", 4, false, []], "Yogurt Parfait": ["American", 0, false, []]
};
/* Rules for the earlier generated recipes: [pattern, family, cuisine, keeps, freezes, equipment] */
const GEN_META = [
  [/^Creamy .* Soup$/, "blended-soup", "American", 4, true, ["blender"]],
  [/Stir-Fry$/, "stir-fry", "Asian", 3, false, []],
  [/Fried Rice/, "fried-rice", "Asian", 3, false, []],
  [/Omelette$/, "omelette", "American", 0, false, []],
  [/Pasta/, "pasta", "Italian", 3, false, []],
  [/Quesadillas$/, "quesadilla", "Mexican", 1, false, []],
  [/Smoothie$/, "smoothie", "American", 0, false, ["blender"]],
  [/^Sheet-Pan/, "sheet-pan", "American", 3, false, ["oven"]],
  [/Curry$/, "curry", "Indian", 4, true, []],
  [/Tacos$/, "tacos", "Mexican", 3, false, []]
];
/* Classics that are close cousins of generated recipes, so the planner doesn't repeat them */
const CLASSIC_FAMILY = { "Spaghetti Bolognese": "pasta", "Pasta Carbonara": "pasta", "Pesto Pasta": "pasta", "Stovetop Mac and Cheese": "pasta",
  "Easy Beef Chili": "chili", "Chicken Fajitas": "tacos", "Tomato Soup": "blended-soup", "Black Bean Soup": "blended-soup",
  "Chicken Noodle Soup": "chicken-soup", "Beef Stew": "stew", "Slow Cooker Beef Stew": "stew" };
const CUISINES = ["American", "Mexican", "Italian", "Asian", "Indian", "Mediterranean"];
const EQUIPMENT = ["oven", "microwave", "blender", "slowcooker", "pressure", "airfryer"];

const MORE = [];
const _clean = a => a.filter(Boolean);
function _pairs(list) { const o = []; for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) o.push([list[i], list[j]]); return o; }

/* Egg muffins: bake once, breakfast all week */
(function () {
  const F = [
    {n:"Spinach",low:"spinach",ing:"2 cups|spinach",cook:"spinach until wilted, about 2 minutes",es:"espinaca",lowEs:"la espinaca",cookEs:"la espinaca hasta que se marchite, unos 2 minutos"},
    {n:"Mushroom",low:"mushrooms",ing:"1 1/2 cups|mushrooms",cook:"sliced mushrooms until browned, 5 to 6 minutes",es:"champiñones",lowEs:"los champiñones",cookEs:"los champiñones rebanados hasta que se doren, de 5 a 6 minutos"},
    {n:"Ham",low:"ham",ing:"1 cup|ham",prep:"Dice the ham.",es:"jamón",lowEs:"el jamón",prepEs:"Corta el jamón en cubitos."},
    {n:"Pepper",low:"peppers",ing:"1|bell pepper",cook:"diced pepper until soft, 4 to 5 minutes",es:"pimiento",lowEs:"el pimiento",cookEs:"el pimiento picado hasta que se suavice, de 4 a 5 minutos"},
    {n:"Onion",low:"onion",ing:"1/2|onion",cook:"diced onion until soft, about 5 minutes",es:"cebolla",lowEs:"la cebolla",cookEs:"la cebolla picada hasta que se suavice, unos 5 minutos"},
    {n:"Tomato",low:"tomato",ing:"1|tomato",prep:"Dice the tomato and pat it dry.",es:"tomate",lowEs:"el tomate",prepEs:"Corta el tomate en cubitos y sécalo con papel."},
    {n:"Bacon",low:"bacon",ing:"6 slices|bacon",cook:"chopped bacon until crisp, 6 to 8 minutes",es:"tocino",lowEs:"el tocino",cookEs:"el tocino picado hasta que esté crujiente, de 6 a 8 minutos"},
    {n:"Zucchini",low:"zucchini",ing:"1|zucchini",cook:"diced zucchini until tender, 4 to 5 minutes",es:"calabacita",lowEs:"la calabacita",cookEs:"la calabacita picada hasta que esté tierna, de 4 a 5 minutos"},
    {n:"Cheese",low:"cheese",ing:"1 cup|cheddar cheese",prep:"Shred the cheese if needed.",es:"queso",lowEs:"el queso",prepEs:"Ralla el queso si hace falta."}
  ];
  for (const [a, b] of _pairs(F)) {
    const cooks = [a, b].filter(f => f.cook);
    MORE.push({
      name: `${a.n} and ${b.n} Egg Muffins`, type: "Breakfast", time: 35, serves: 6, family: "egg-muffin",
      cuisine: "American", keeps: 4, freezes: true, equip: ["oven"],
      ing: ["10|eggs", "1/4 cup|milk", a.ing, b.ing, "1 tbsp|oil", "|salt", "|pepper"],
      steps: _clean([
        "Heat the oven to 350F (175C) and grease a 12-cup muffin pan well.",
        _clean([a.prep, b.prep]).join(" "),
        cooks.length ? `Heat the oil in a skillet over medium heat and cook the ${cooks.map(f => f.cook).join(", then the ")}. Let the filling cool a little.` : "",
        `Divide the ${a.low} and ${b.low} among the muffin cups.`,
        "Whisk the eggs, milk, a pinch of salt, and some pepper. Pour it over the filling until each cup is about three-quarters full.",
        "Bake for 20 to 25 minutes, until the centers are set.",
        "Cool for 5 minutes, then loosen them with a knife. They keep 4 days in the fridge or 2 months in the freezer. Reheat for 30 to 45 seconds in the microwave."
      ]),
      es: { name: `Muffins de huevo con ${a.es} y ${b.es}`, steps: _clean([
        "Precalienta el horno a 175 °C (350 °F) y engrasa bien un molde para 12 muffins.",
        _clean([a.prepEs, b.prepEs]).join(" "),
        cooks.length ? `Calienta el aceite en una sartén a fuego medio y cocina ${cooks.map(f => f.cookEs).join(", y luego ")}. Deja que el relleno se enfríe un poco.` : "",
        `Reparte ${a.lowEs} y ${b.lowEs} en los moldes.`,
        "Bate los huevos, la leche, una pizca de sal y un poco de pimienta. Viértelo sobre el relleno hasta llenar cada molde a tres cuartos.",
        "Hornea de 20 a 25 minutos, hasta que el centro esté cuajado.",
        "Deja enfriar 5 minutos y despégalos con un cuchillo. Duran 4 días en el refrigerador o 2 meses en el congelador. Recaliéntalos de 30 a 45 segundos en el microondas."
      ]) }
    });
  }
})();

/* Overnight oats for the week */
(function () {
  const V = [
    {n:"Banana Peanut Butter",ing:["2|bananas","1/4 cup|peanut butter"],mix:"Slice the bananas and stir them in with the peanut butter, or swirl the peanut butter on top.",es:"plátano y crema de cacahuate",mixEs:"Rebana los plátanos e incorpóralos con la crema de cacahuate, o ponla encima en remolino."},
    {n:"Berry",ing:["2 cups|berries"],mix:"Fold in the berries, or keep them separate and add them in the morning.",es:"moras",mixEs:"Incorpora las moras, o guárdalas aparte y agrégalas en la mañana."},
    {n:"Apple Cinnamon",ing:["2|apples","1 tsp|cinnamon"],mix:"Chop the apples and stir them in with the cinnamon.",es:"manzana y canela",mixEs:"Pica las manzanas e incorpóralas con la canela."},
    {n:"Peach",ing:["2 cups|peaches"],mix:"Chop the peaches and fold them in.",es:"durazno",mixEs:"Pica los duraznos e incorpóralos."},
    {n:"Mango",ing:["2 cups|mango"],mix:"Chop the mango and fold it in.",es:"mango",mixEs:"Pica el mango e incorpóralo."},
    {n:"Strawberry",ing:["2 cups|strawberries"],mix:"Slice the strawberries and fold them in.",es:"fresa",mixEs:"Rebana las fresas e incorpóralas."}
  ];
  for (const v of V) MORE.push({
    name: `${v.n} Overnight Oats`, type: "Breakfast", time: 10, serves: 4, family: "oats", cuisine: "American", keeps: 4, freezes: false, equip: [],
    ing: ["2 cups|oats", "2 cups|milk", "1 cup|yogurt", "2 tbsp|honey|o", ...v.ing],
    steps: ["Stir together the oats, milk, yogurt, and honey if using.", v.mix,
      "Divide among 4 jars or containers, cover, and refrigerate overnight. They keep up to 4 days.",
      "Stir before eating, and add a splash of milk if it's too thick."],
    es: { name: `Avena remojada de ${v.es}`, steps: ["Mezcla la avena, la leche, el yogur y la miel si la usas.", v.mixEs,
      "Reparte en 4 frascos o recipientes, tapa y refrigera toda la noche. Duran hasta 4 días.",
      "Revuelve antes de comer y agrega un chorrito de leche si está muy espesa."] }
  });
})();

/* Burrito bowls */
(function () {
  const P = [
    {n:"Chicken",ing:"1 1/2 lb|chicken breast",cook:"Rub the chicken with the spice mix and cook in a little oil over medium-high heat until it reaches 165F, 6 to 7 minutes per side. Rest for 5 minutes, then slice.",
     es:"pollo",cookEs:"Unta el pollo con la mezcla de especias y cocínalo con un poco de aceite a fuego medio-alto hasta que llegue a 74 °C (165 °F), de 6 a 7 minutos por lado. Déjalo reposar 5 minutos y rebánalo."},
    {n:"Beef",ing:"1 lb|ground beef",cook:"Brown the beef with the spice mix, breaking it up, until no pink remains, 7 to 8 minutes. Drain extra fat.",
     es:"carne molida",cookEs:"Dora la carne con la mezcla de especias, desmenuzándola, hasta que ya no esté rosada, de 7 a 8 minutos. Escurre el exceso de grasa."},
    {n:"Black Bean",ing:"2 cans|black beans",cook:"Warm the rinsed beans with the spice mix and a splash of water for 5 minutes.",
     es:"frijoles negros",cookEs:"Calienta los frijoles enjuagados con la mezcla de especias y un chorrito de agua por 5 minutos."},
    {n:"Shrimp",ing:"1 lb|shrimp",cook:"Toss the shrimp with the spice mix and cook in a little oil over medium-high heat until pink, 1 to 2 minutes per side.",
     es:"camarones",cookEs:"Mezcla los camarones con las especias y cocínalos con un poco de aceite a fuego medio-alto hasta que estén rosados, de 1 a 2 minutos por lado."}
  ];
  const V = [
    {n:"Peppers",ing:["2|bell peppers","1|onion"],cook:"Slice the peppers and onion and cook them in a little oil over medium-high heat until soft with some char, 8 to 10 minutes.",
     es:"pimientos",cookEs:"Rebana los pimientos y la cebolla y cocínalos con un poco de aceite a fuego medio-alto hasta que se suavicen y se tuesten un poco, de 8 a 10 minutos."},
    {n:"Corn",ing:["2 cups|corn"],cook:"Cook the corn in a dry skillet over high heat until lightly charred, 4 to 5 minutes.",
     es:"elote",cookEs:"Cocina el elote en una sartén seca a fuego alto hasta que se tueste un poco, de 4 a 5 minutos."},
    {n:"Roasted Sweet Potatoes",oven:true,ing:["2|sweet potatoes"],cook:"Cut the sweet potatoes into 3/4 inch cubes, toss with oil and salt, and roast at 425F (220C) until tender, 25 to 30 minutes.",
     es:"camote asado",cookEs:"Corta los camotes en cubos de 2 cm (3/4 de pulgada), mézclalos con aceite y sal y ásalos en el horno a 220 °C (425 °F) hasta que estén suaves, de 25 a 30 minutos."}
  ];
  for (const p of P) for (const v of V) MORE.push({
    name: `${p.n} Burrito Bowls with ${v.n}`, type: "Dinner", time: v.oven ? 45 : 35, serves: 4, family: "burrito-bowl",
    cuisine: "Mexican", keeps: p.n === "Shrimp" ? 3 : 4, freezes: false, equip: v.oven ? ["oven"] : [],
    ing: ["4 cups|rice", p.ing, ...v.ing, "2 tsp|chili powder", "1 tsp|cumin", "2 tbsp|oil", "1 cup|salsa", "1|lime", "1 cup|cheese|o", "2 cups|lettuce|o", "|avocado|o", "|sour cream|o"],
    steps: _clean([
      v.oven ? v.cook : "",
      "Cook the rice, or warm 4 cups of leftover rice. Squeeze in half the lime and stir.",
      "Mix the chili powder, cumin, and a pinch of salt.",
      p.cook,
      v.oven ? "" : v.cook,
      "Divide the rice among bowls or containers and top with the protein, vegetables, and salsa. Add cheese, lettuce, avocado, and sour cream when serving.",
      "For meal prep, pack wet toppings separately. The bowls keep 4 days in the fridge."
    ]),
    es: { name: `Bowls de burrito con ${p.es} y ${v.es}`, steps: _clean([
      v.oven ? v.cookEs : "",
      "Cocina el arroz, o calienta 4 tazas de arroz que te haya sobrado. Exprime la mitad del limón y revuelve.",
      "Mezcla el chile en polvo, el comino y una pizca de sal.",
      p.cookEs,
      v.oven ? "" : v.cookEs,
      "Reparte el arroz en tazones o recipientes y agrega la proteína, las verduras y la salsa. Pon el queso, la lechuga, el aguacate y la crema agria al servir.",
      "Si los preparas con anticipación, guarda aparte lo más jugoso. Los bowls duran 4 días en el refrigerador."
    ]) }
  });
})();

/* Soy-ginger rice bowls */
(function () {
  const P = [
    {n:"Chicken",ing:"1 1/2 lb|chicken thighs",cook:"Cut the chicken into bite-size pieces and cook in the oil over medium-high heat until browned and cooked through, 7 to 8 minutes.",
     es:"pollo",cookEs:"Corta el pollo en trozos pequeños y cocínalo en el aceite a fuego medio-alto hasta que se dore y esté bien cocido, de 7 a 8 minutos."},
    {n:"Tofu",ing:"14 oz|tofu",cook:"Press the tofu dry, cut it into cubes, and fry in the oil until golden, 8 to 10 minutes.",
     es:"tofu",cookEs:"Seca bien el tofu, córtalo en cubos y fríelo en el aceite hasta que se dore, de 8 a 10 minutos."},
    {n:"Shrimp",ing:"1 lb|shrimp",cook:"Cook the shrimp in the oil over medium-high heat until pink, 2 to 3 minutes.",
     es:"camarones",cookEs:"Cocina los camarones en el aceite a fuego medio-alto hasta que estén rosados, de 2 a 3 minutos."},
    {n:"Beef",ing:"1 lb|steak",cook:"Slice the steak thinly and sear it in batches in the oil over high heat, 2 to 3 minutes per batch.",
     es:"res",cookEs:"Corta el bistec en tiras delgadas y dóralo por tandas en el aceite a fuego alto, de 2 a 3 minutos por tanda."}
  ];
  const V = [
    {n:"Broccoli",ing:["4 cups|broccoli"],cook:"Add the broccoli florets and a splash of water, cover, and cook until crisp-tender, 4 to 5 minutes.",
     es:"brócoli",cookEs:"Agrega los floretes de brócoli y un chorrito de agua, tapa y cocina hasta que estén tiernos pero crujientes, de 4 a 5 minutos."},
    {n:"Carrots",ing:["3|carrots"],cook:"Add the carrots, cut into thin coins, and cook until just tender, 4 to 5 minutes.",
     es:"zanahoria",cookEs:"Agrega las zanahorias en rodajas delgadas y cocina hasta que estén apenas suaves, de 4 a 5 minutos."},
    {n:"Cabbage",ing:["4 cups|cabbage"],cook:"Add the shredded cabbage and cook until wilted at the edges, about 3 minutes.",
     es:"repollo",cookEs:"Agrega el repollo rallado y cocina hasta que se marchite en las orillas, unos 3 minutos."}
  ];
  for (const p of P) for (const v of V) MORE.push({
    name: `Soy-Ginger ${p.n} Bowls with ${v.n}`, type: "Dinner", time: 30, serves: 4, family: "soy-bowl",
    cuisine: "Asian", keeps: p.n === "Shrimp" ? 3 : 4, freezes: false, equip: [],
    ing: ["4 cups|rice", p.ing, ...v.ing, "1/3 cup|soy sauce", "2 tbsp|honey", "1 tbsp|vinegar", "1 tbsp|ginger", "3 cloves|garlic", "1 tsp|cornstarch", "2 tbsp|oil", "2|scallions|o"],
    steps: [
      "Cook the rice, or warm 4 cups of leftover rice.",
      "Whisk the soy sauce, honey, vinegar, cornstarch, grated ginger, minced garlic, and 1/4 cup of water.",
      `Heat the oil in a large skillet. ${p.cook}`,
      v.cook,
      "Pour in the sauce and simmer, stirring, until thick and glossy, 1 to 2 minutes.",
      "Spoon over the rice and top with sliced scallions. Keeps 4 days in the fridge."
    ],
    es: { name: `Bowls de ${p.es} con ${v.es} en salsa de soya y jengibre`, steps: [
      "Cocina el arroz, o calienta 4 tazas de arroz que te haya sobrado.",
      "Bate la salsa de soya, la miel, el vinagre, la maicena, el jengibre rallado, el ajo picado y 1/4 de taza de agua.",
      `Calienta el aceite en una sartén grande. ${p.cookEs}`,
      v.cookEs,
      "Vierte la salsa y cocina, moviendo, hasta que espese y brille, de 1 a 2 minutos.",
      "Sirve sobre el arroz y decora con cebollitas rebanadas. Dura 4 días en el refrigerador."
    ] }
  });
})();

/* Mediterranean bowls */
(function () {
  const P = [
    {n:"Chicken",ing:"1 1/2 lb|chicken thighs",cook:"Season the chicken with oregano, salt, and pepper and cook in a little olive oil over medium-high heat until it reaches 165F, 5 to 6 minutes per side. Slice.",
     es:"pollo",cookEs:"Sazona el pollo con orégano, sal y pimienta y cocínalo con un poco de aceite de oliva a fuego medio-alto hasta que llegue a 74 °C (165 °F), de 5 a 6 minutos por lado. Rebánalo."},
    {n:"Chickpea",oven:true,ing:"2 cans|chickpeas",cook:"Rinse and dry the chickpeas, toss with olive oil, oregano, and salt, and roast at 425F (220C) until crisp, about 25 minutes.",
     es:"garbanzos",cookEs:"Enjuaga y seca los garbanzos, mézclalos con aceite de oliva, orégano y sal y hornéalos a 220 °C (425 °F) hasta que estén crujientes, unos 25 minutos."},
    {n:"Salmon",oven:true,ing:"4 fillets|salmon",cook:"Rub the salmon with olive oil, oregano, salt, and pepper and roast at 425F (220C) until it flakes easily (145F), 12 to 15 minutes.",
     es:"salmón",cookEs:"Unta el salmón con aceite de oliva, orégano, sal y pimienta y hornéalo a 220 °C (425 °F) hasta que se desmenuce fácilmente (63 °C / 145 °F), de 12 a 15 minutos."}
  ];
  const V = [
    {n:"Cucumber Salad",ing:["1|cucumber","2|tomatoes"],cook:"Chop the cucumber and tomatoes and toss with a little olive oil, lemon juice, and salt.",
     es:"ensalada de pepino",cookEs:"Pica el pepino y los tomates y mézclalos con un poco de aceite de oliva, jugo de limón y sal."},
    {n:"Roasted Zucchini",oven:true,ing:["2|zucchini"],cook:"Cut the zucchini into half-moons, toss with olive oil and salt, and roast at 425F (220C) until browned, about 20 minutes.",
     es:"calabacita asada",cookEs:"Corta la calabacita en medias lunas, mézclala con aceite de oliva y sal y ásala a 220 °C (425 °F) hasta que se dore, unos 20 minutos."},
    {n:"Roasted Peppers",oven:true,ing:["2|bell peppers"],cook:"Cut the peppers into strips, toss with olive oil and salt, and roast at 425F (220C) until soft, about 20 minutes.",
     es:"pimientos asados",cookEs:"Corta los pimientos en tiras, mézclalos con aceite de oliva y sal y ásalos a 220 °C (425 °F) hasta que se suavicen, unos 20 minutos."}
  ];
  for (const p of P) for (const v of V) {
    const oven = p.oven || v.oven;
    MORE.push({
      name: `Mediterranean ${p.n} Bowls with ${v.n}`, type: "Dinner", time: oven ? 40 : 30, serves: 4, family: "med-bowl",
      cuisine: "Mediterranean", keeps: p.n === "Salmon" ? 2 : 4, freezes: false, equip: oven ? ["oven"] : [],
      ing: ["4 cups|rice", p.ing, ...v.ing, "1 cup|yogurt", "1 clove|garlic", "1|lemon", "3 tbsp|olive oil", "2 tsp|oregano", "|feta|o"],
      steps: _clean([
        oven ? "Heat the oven to 425F (220C)." : "",
        "Cook the rice, or warm 4 cups of leftover rice.",
        "Stir the yogurt with the grated garlic, half the lemon juice, and a pinch of salt.",
        p.cook,
        v.cook,
        "Divide the rice among bowls, add the protein and vegetables, and top with the yogurt sauce and feta. Pack the sauce separately for meal prep."
      ]),
      es: { name: `Bowls mediterráneos de ${p.es} con ${v.es}`, steps: _clean([
        oven ? "Precalienta el horno a 220 °C (425 °F)." : "",
        "Cocina el arroz, o calienta 4 tazas de arroz que te haya sobrado.",
        "Mezcla el yogur con el ajo rallado, la mitad del jugo de limón y una pizca de sal.",
        p.cookEs,
        v.cookEs,
        "Reparte el arroz en tazones, agrega la proteína y las verduras, y pon encima la salsa de yogur y el queso feta. Si los preparas con anticipación, guarda la salsa aparte."
      ]) }
    });
  }
})();

/* Freezer burritos */
(function () {
  const P = [
    {n:"Chicken",ing:"1 1/2 lb|chicken breast",cook:"Cook the chicken with the spice mix in a little oil until it reaches 165F, 6 to 7 minutes per side, then chop it.",
     es:"pollo",cookEs:"Cocina el pollo con la mezcla de especias y un poco de aceite hasta que llegue a 74 °C (165 °F), de 6 a 7 minutos por lado, y luego pícalo."},
    {n:"Black Bean",ing:"2 cans|black beans",cook:"Warm the rinsed beans with the spice mix, mashing about half of them.",
     es:"frijoles negros",cookEs:"Calienta los frijoles enjuagados con la mezcla de especias y aplasta más o menos la mitad."},
    {n:"Beef",ing:"1 lb|ground beef",cook:"Brown the beef with the spice mix until no pink remains, 7 to 8 minutes. Drain extra fat.",
     es:"carne molida",cookEs:"Dora la carne con la mezcla de especias hasta que ya no esté rosada, de 7 a 8 minutos. Escurre el exceso de grasa."}
  ];
  const V = [
    {n:"Pepper",ing:["1|bell pepper","1|onion"],cook:"Dice the pepper and onion and cook in a little oil until soft, 6 to 8 minutes.",es:"pimiento",cookEs:"Pica el pimiento y la cebolla y cocínalos con un poco de aceite hasta que se suavicen, de 6 a 8 minutos."},
    {n:"Corn",ing:["1 1/2 cups|corn"],cook:"Warm the corn in the pan for 3 to 4 minutes.",es:"elote",cookEs:"Calienta el elote en la sartén de 3 a 4 minutos."}
  ];
  for (const p of P) for (const v of V) MORE.push({
    name: `Freezer ${p.n} and ${v.n} Burritos`, type: "Lunch", time: 45, serves: 8, family: "burrito",
    cuisine: "Mexican", keeps: 4, freezes: true, equip: [],
    ing: ["8|tortillas", "2 cups|rice", p.ing, ...v.ing, "1 1/2 cups|cheese", "1 cup|salsa", "2 tsp|chili powder", "1 tsp|cumin", "1 tbsp|oil"],
    steps: [
      "Cook the rice, or use 2 cups of leftover rice. Mix the chili powder, cumin, and a pinch of salt.",
      p.cook,
      v.cook,
      "Stir the rice, protein, vegetables, and salsa together and let the filling cool for 10 minutes.",
      "Warm the tortillas so they bend. Add filling and cheese to each, fold in the sides, and roll tightly.",
      "Wrap each burrito in foil or plastic wrap and freeze for up to 3 months.",
      "To reheat, unwrap, wrap in a damp paper towel, and microwave for 2 to 3 minutes, turning halfway, until hot in the middle (165F)."
    ],
    es: { name: `Burritos para congelar de ${p.es} y ${v.es}`, steps: [
      "Cocina el arroz, o usa 2 tazas de arroz que te haya sobrado. Mezcla el chile en polvo, el comino y una pizca de sal.",
      p.cookEs,
      v.cookEs,
      "Mezcla el arroz, la proteína, las verduras y la salsa, y deja enfriar el relleno 10 minutos.",
      "Calienta las tortillas para que se doblen. Pon relleno y queso en cada una, dobla los lados y enrolla bien apretado.",
      "Envuelve cada burrito en papel aluminio o plástico y congélalo hasta por 3 meses.",
      "Para recalentar, quita la envoltura, envuélvelo en una toalla de papel húmeda y caliéntalo en el microondas de 2 a 3 minutos, volteándolo a la mitad, hasta que esté caliente en el centro (74 °C / 165 °F)."
    ] }
  });
})();

/* Pasta bakes */
(function () {
  const V = [
    {n:"Baked Ziti with Sausage",es:"Pasta horneada con salchicha",ing:["1 lb|sausage","1|onion"],cook:"Brown the sausage with the diced onion, breaking it up, until cooked through, 8 to 10 minutes.",cookEs:"Dora la salchicha con la cebolla picada, desmenuzándola, hasta que esté bien cocida, de 8 a 10 minutos."},
    {n:"Baked Ziti with Ground Beef",es:"Pasta horneada con carne molida",ing:["1 lb|ground beef","1|onion"],cook:"Brown the beef with the diced onion, breaking it up, until no pink remains, 8 to 10 minutes. Drain extra fat.",cookEs:"Dora la carne con la cebolla picada, desmenuzándola, hasta que ya no esté rosada, de 8 a 10 minutos. Escurre el exceso de grasa."},
    {n:"Chicken and Spinach Pasta Bake",es:"Pasta horneada con pollo y espinaca",ing:["2 cups|chicken","4 cups|spinach"],cook:"Warm the chopped cooked chicken in a little oil, then stir in the spinach until it wilts.",cookEs:"Calienta el pollo cocido picado con un poco de aceite y luego agrega la espinaca hasta que se marchite."},
    {n:"Veggie Pasta Bake",es:"Pasta horneada con verduras",ing:["2|zucchini","1|bell pepper","1|onion"],cook:"Dice the zucchini, pepper, and onion and cook in a little oil until soft, 8 to 10 minutes.",cookEs:"Pica la calabacita, el pimiento y la cebolla y cocínalos con un poco de aceite hasta que se suavicen, de 8 a 10 minutos."}
  ];
  for (const v of V) MORE.push({
    name: v.n, type: "Dinner", time: 55, serves: 6, family: "pasta-bake", cuisine: "Italian", keeps: 4, freezes: true, equip: ["oven"],
    ing: ["1 lb|penne", ...v.ing, "3 cloves|garlic", "3 cups|tomato sauce", "2 cups|mozzarella", "1/2 cup|parmesan", "1 tbsp|oil", "|salt"],
    steps: [
      "Heat the oven to 375F (190C).",
      "Cook the pasta in salted boiling water for 2 minutes less than the package says, then drain.",
      v.cook,
      "Add the minced garlic for 30 seconds, then stir in the tomato sauce.",
      "Mix the pasta with the sauce and half the mozzarella. Spread it in a 9x13 inch baking dish and top with the rest of the mozzarella and the parmesan.",
      "Bake until bubbling and golden, 20 to 25 minutes. Rest for 10 minutes before serving.",
      "To freeze, cover the unbaked dish tightly for up to 3 months. Thaw overnight in the fridge, then bake about 10 minutes longer."
    ],
    es: { name: v.es, steps: [
      "Precalienta el horno a 190 °C (375 °F).",
      "Cocina la pasta en agua hirviendo con sal 2 minutos menos de lo que dice el paquete y escúrrela.",
      v.cookEs,
      "Agrega el ajo picado por 30 segundos y luego la salsa de tomate.",
      "Mezcla la pasta con la salsa y la mitad del queso mozzarella. Extiéndela en un refractario de 23 x 33 cm (9 x 13 pulgadas) y cubre con el resto del mozzarella y el parmesano.",
      "Hornea hasta que burbujee y se dore, de 20 a 25 minutos. Deja reposar 10 minutos antes de servir.",
      "Para congelar, tapa bien el refractario sin hornear hasta por 3 meses. Descongela en el refrigerador toda la noche y hornea unos 10 minutos más."
    ] }
  });
})();

/* Slow cooker or pressure cooker */
MORE.push(
{name:"Slow Cooker Salsa Chicken",type:"Dinner",time:15,serves:6,family:"slow-cooker",cuisine:"Mexican",keeps:4,freezes:true,equip:["slowcooker|pressure"],
 wait:"plus 2 to 5 hours of hands-off cooking",waitEs:"más 2 a 5 horas de cocción sin atender",
 ing:["2 lb|chicken breast","2 cups|salsa","1 tsp|cumin","1 tsp|chili powder","|tortillas|o","|rice|o"],
 steps:["Put the chicken in the slow cooker, sprinkle with the cumin, chili powder, and a pinch of salt, and pour the salsa over it.","Cook on low for 4 to 5 hours or high for 2 to 3 hours, until the chicken reaches 165F.","Shred the chicken with two forks and stir it into the sauce.","Serve in tortillas or over rice. Pressure cooker: add 1/2 cup of water, cook on high pressure for 12 minutes, and let the pressure release naturally for 10 minutes."],
 es:{name:"Pollo con salsa en olla de cocción lenta",steps:["Pon el pollo en la olla de cocción lenta, espolvorea el comino, el chile en polvo y una pizca de sal, y vierte la salsa encima.","Cocina en bajo de 4 a 5 horas o en alto de 2 a 3 horas, hasta que el pollo llegue a 74 °C (165 °F).","Deshebra el pollo con dos tenedores y mézclalo con la salsa.","Sirve en tortillas o con arroz. Olla de presión: agrega 1/2 taza de agua, cocina a presión alta 12 minutos y deja que la presión baje sola 10 minutos."]}},
{name:"Slow Cooker Pulled Pork",type:"Dinner",time:20,serves:8,family:"slow-cooker",cuisine:"American",keeps:4,freezes:true,equip:["slowcooker|pressure"],
 wait:"plus 5 to 10 hours of hands-off cooking",waitEs:"más 5 a 10 horas de cocción sin atender",
 ing:["3 lb|pork","1 cup|barbecue sauce","1|onion","2 tsp|paprika","1 tsp|chili powder","|bread|o"],
 steps:["Rub the pork with the paprika, chili powder, and a good pinch of salt. Slice the onion into the slow cooker and set the pork on top.","Cook on low for 8 to 10 hours or high for 5 to 6 hours, until the pork falls apart.","Shred the pork, discard extra fat, and stir in the barbecue sauce.","Serve on buns or bread. Pressure cooker: cut the pork into 4 pieces, add 1 cup of water, cook on high pressure for 60 minutes, and let the pressure release naturally for 15 minutes."],
 es:{name:"Cerdo deshebrado en olla de cocción lenta",steps:["Unta el cerdo con la paprika, el chile en polvo y una buena pizca de sal. Rebana la cebolla dentro de la olla y pon el cerdo encima.","Cocina en bajo de 8 a 10 horas o en alto de 5 a 6 horas, hasta que el cerdo se deshaga.","Deshebra el cerdo, quita el exceso de grasa y mézclalo con la salsa barbecue.","Sirve en pan. Olla de presión: corta el cerdo en 4 trozos, agrega 1 taza de agua, cocina a presión alta 60 minutos y deja que la presión baje sola 15 minutos."]}},
{name:"Slow Cooker Chicken Tortilla Soup",type:"Dinner",time:15,serves:6,family:"slow-cooker",cuisine:"Mexican",keeps:4,freezes:true,equip:["slowcooker|pressure"],
 wait:"plus 3 to 7 hours of hands-off cooking",waitEs:"más 3 a 7 horas de cocción sin atender",
 ing:["1 1/2 lb|chicken breast","1 can|black beans","1 cup|corn","1 can (14 oz)|canned tomatoes","4 cups|broth","1|onion","2 cloves|garlic","2 tsp|cumin","1 tsp|chili powder","1|lime","|tortillas|o","|avocado|o","|cheese|o"],
 steps:["Put everything except the lime and toppings into the slow cooker, with the onion diced, the garlic minced, and the beans rinsed.","Cook on low for 6 to 7 hours or high for 3 to 4 hours.","Shred the chicken in the pot and stir in the lime juice. Season with salt.","Top with crisp tortilla strips, avocado, and cheese. Pressure cooker: cook on high pressure for 10 minutes and let the pressure release naturally for 10 minutes."],
 es:{name:"Sopa de tortilla con pollo en olla de cocción lenta",steps:["Pon todo menos el limón y los toppings en la olla, con la cebolla picada, el ajo picado y los frijoles enjuagados.","Cocina en bajo de 6 a 7 horas o en alto de 3 a 4 horas.","Deshebra el pollo en la olla y agrega el jugo de limón. Sazona con sal.","Sirve con tiras de tortilla tostada, aguacate y queso. Olla de presión: cocina a presión alta 10 minutos y deja que la presión baje sola 10 minutos."]}},
{name:"Slow Cooker Red Lentil Curry",type:"Dinner",time:15,serves:6,family:"slow-cooker",cuisine:"Indian",keeps:5,freezes:true,equip:["slowcooker|pressure"],
 wait:"plus 3 to 8 hours of hands-off cooking",waitEs:"más 3 a 8 horas de cocción sin atender",
 ing:["1 1/2 cups|red lentils","1 can|coconut milk","1 can (14 oz)|canned tomatoes","3 cups|broth","1|onion","3 cloves|garlic","1 tbsp|ginger","2 tbsp|curry powder","3 cups|spinach|o","|rice|o"],
 steps:["Rinse the lentils. Put them in the slow cooker with the coconut milk, tomatoes, broth, diced onion, minced garlic, grated ginger, and curry powder.","Cook on low for 6 to 8 hours or high for 3 to 4 hours, until the lentils are soft.","Stir in the spinach until it wilts and season with salt.","Serve over rice. Pressure cooker: cook on high pressure for 8 minutes and let the pressure release naturally for 10 minutes."],
 es:{name:"Curry de lentejas rojas en olla de cocción lenta",steps:["Enjuaga las lentejas. Ponlas en la olla con la leche de coco, los tomates, el caldo, la cebolla picada, el ajo picado, el jengibre rallado y el curry en polvo.","Cocina en bajo de 6 a 8 horas o en alto de 3 a 4 horas, hasta que las lentejas estén suaves.","Agrega la espinaca hasta que se marchite y sazona con sal.","Sirve con arroz. Olla de presión: cocina a presión alta 8 minutos y deja que la presión baje sola 10 minutos."]}},
{name:"Slow Cooker Beef Chili",type:"Dinner",time:25,serves:8,family:"slow-cooker",cuisine:"American",keeps:5,freezes:true,equip:["slowcooker|pressure"],
 wait:"plus 3 to 8 hours of hands-off cooking",waitEs:"más 3 a 8 horas de cocción sin atender",
 ing:["2 lb|ground beef","2 cans|kidney beans","1 can (28 oz)|canned tomatoes","1|onion","1|bell pepper","3 cloves|garlic","3 tbsp|chili powder","2 tsp|cumin","|cheese|o","|sour cream|o"],
 steps:["Brown the beef in a skillet, breaking it up, and drain the fat.","Put the beef in the slow cooker with the drained beans, tomatoes, diced onion and pepper, minced garlic, chili powder, and cumin.","Cook on low for 6 to 8 hours or high for 3 to 4 hours. Season with salt.","Top with cheese and sour cream. Pressure cooker: brown the beef using the saute setting, add everything else, cook on high pressure for 10 minutes, and let the pressure release naturally for 10 minutes."],
 es:{name:"Chili de carne en olla de cocción lenta",steps:["Dora la carne en una sartén, desmenuzándola, y escurre la grasa.","Pon la carne en la olla con los frijoles escurridos, los tomates, la cebolla y el pimiento picados, el ajo picado, el chile en polvo y el comino.","Cocina en bajo de 6 a 8 horas o en alto de 3 a 4 horas. Sazona con sal.","Sirve con queso y crema agria. Olla de presión: dora la carne con la función para saltear, agrega todo lo demás, cocina a presión alta 10 minutos y deja que la presión baje sola 10 minutos."]}},
{name:"Slow Cooker Beef Stew",type:"Dinner",time:25,serves:6,family:"slow-cooker",cuisine:"American",keeps:4,freezes:true,equip:["slowcooker|pressure"],
 wait:"plus 8 to 9 hours of hands-off cooking",waitEs:"más 8 a 9 horas de cocción sin atender",
 ing:["2 lb|stew meat","4|potatoes","3|carrots","1|onion","3 cups|broth","2 tbsp|tomato paste","2 tbsp|flour","|salt","|pepper"],
 steps:["Toss the beef with the flour, salt, and pepper.","Put the beef, chunked potatoes and carrots, and chopped onion in the slow cooker. Whisk the broth with the tomato paste and pour it over.","Cook on low for 8 to 9 hours, until the beef is tender.","Season and serve. Pressure cooker: cook on high pressure for 35 minutes and let the pressure release naturally for 15 minutes."],
 es:{name:"Estofado de res en olla de cocción lenta",steps:["Mezcla la carne con la harina, la sal y la pimienta.","Pon la carne, las papas y zanahorias en trozos y la cebolla picada en la olla. Bate el caldo con la pasta de tomate y viértelo encima.","Cocina en bajo de 8 a 9 horas, hasta que la carne esté suave.","Sazona y sirve. Olla de presión: cocina a presión alta 35 minutos y deja que la presión baje sola 15 minutos."]}}
);

/* Chicken and vegetable soups */
(function () {
  const V = [
    {n:"Potato",ing:"3|potatoes",t:"15 minutes",tEs:"15 minutos",prep:"cubed potatoes",prepEs:"las papas en cubos",es:"papa"},
    {n:"Spinach",ing:"4 cups|spinach",t:"2 minutes",tEs:"2 minutos",prep:"spinach",prepEs:"la espinaca",es:"espinaca"},
    {n:"Zucchini",ing:"2|zucchini",t:"8 minutes",tEs:"8 minutos",prep:"diced zucchini",prepEs:"la calabacita picada",es:"calabacita"},
    {n:"Corn",ing:"2 cups|corn",t:"8 minutes",tEs:"8 minutos",prep:"corn",prepEs:"el elote",es:"elote"},
    {n:"Green Bean",ing:"2 cups|green beans",t:"10 minutes",tEs:"10 minutos",prep:"chopped green beans",prepEs:"los ejotes picados",es:"ejotes"},
    {n:"Kale",ing:"4 cups|kale",t:"5 minutes",tEs:"5 minutos",prep:"chopped kale",prepEs:"el kale picado",es:"kale"}
  ];
  for (const v of V) MORE.push({
    name: `Chicken and ${v.n} Soup`, type: "Dinner", time: 45, serves: 6, family: "chicken-soup", cuisine: "American", keeps: 4, freezes: true, equip: [],
    ing: ["1 lb|chicken breast", v.ing, "1|onion", "2|carrots", "2 stalks|celery", "2 cloves|garlic", "6 cups|broth", "1 tsp|italian seasoning", "1 tbsp|oil", "|salt", "|pepper"],
    steps: [
      "Dice the onion, carrots, and celery, and mince the garlic.",
      "Heat the oil in a large pot over medium heat. Cook the onion, carrots, and celery until soft, 6 to 8 minutes. Add the garlic and Italian seasoning for 30 seconds.",
      "Add the broth and the whole chicken. Simmer until the chicken reaches 165F, 15 to 18 minutes.",
      "Take out the chicken and shred it.",
      `Add the ${v.prep} and simmer for ${v.t}.`,
      "Return the chicken, season with salt and pepper, and serve. Keeps 4 days in the fridge or 3 months frozen."
    ],
    es: { name: `Sopa de pollo con ${v.es}`, steps: [
      "Pica la cebolla, las zanahorias y el apio en cubitos, y pica finamente el ajo.",
      "Calienta el aceite en una olla grande a fuego medio. Cocina la cebolla, las zanahorias y el apio hasta que se suavicen, de 6 a 8 minutos. Agrega el ajo y las hierbas italianas por 30 segundos.",
      "Agrega el caldo y el pollo entero. Cocina a fuego lento hasta que el pollo llegue a 74 °C (165 °F), de 15 a 18 minutos.",
      "Saca el pollo y deshébralo.",
      `Agrega ${v.prepEs} y cocina a fuego lento ${v.tEs}.`,
      "Regresa el pollo, sazona con sal y pimienta y sirve. Dura 4 días en el refrigerador o 3 meses congelada."
    ] }
  });
})();

/* More chili */
MORE.push(
{name:"Vegetarian Black Bean Chili",type:"Dinner",time:45,serves:6,family:"chili",cuisine:"American",keeps:5,freezes:true,equip:[],
 ing:["3 cans|black beans","1 can (28 oz)|canned tomatoes","1 cup|corn","1|onion","1|bell pepper","3 cloves|garlic","2 tbsp|chili powder","2 tsp|cumin","1 tbsp|oil","|cheese|o","|sour cream|o"],
 steps:["Dice the onion and pepper and mince the garlic.","Cook the onion and pepper in the oil in a large pot until soft, about 8 minutes. Add the garlic, chili powder, and cumin for 1 minute.","Add the rinsed beans, tomatoes, and corn. Simmer for 25 minutes, stirring now and then.","Mash some of the beans to thicken it, season with salt, and top with cheese and sour cream."],
 es:{name:"Chili vegetariano de frijol negro",steps:["Pica la cebolla y el pimiento, y pica finamente el ajo.","Cocina la cebolla y el pimiento en el aceite en una olla grande hasta que se suavicen, unos 8 minutos. Agrega el ajo, el chile en polvo y el comino por 1 minuto.","Agrega los frijoles enjuagados, los tomates y el elote. Cocina a fuego lento 25 minutos, moviendo de vez en cuando.","Aplasta algunos frijoles para espesar, sazona con sal y sirve con queso y crema agria."]}},
{name:"Chicken Chili",type:"Dinner",time:45,serves:6,family:"chili",cuisine:"American",keeps:4,freezes:true,equip:[],
 ing:["1 1/2 lb|chicken breast","2 cans|kidney beans","1 can (14 oz)|canned tomatoes","1 cup|corn","1|onion","3 cloves|garlic","3 cups|broth","2 tbsp|chili powder","2 tsp|cumin","1 tbsp|oil","|cheese|o"],
 steps:["Dice the onion and mince the garlic. Cook the onion in the oil in a large pot until soft, about 6 minutes. Add the garlic, chili powder, and cumin for 1 minute.","Add the broth, tomatoes, rinsed beans, corn, and the whole chicken. Simmer until the chicken reaches 165F, 18 to 20 minutes.","Take out the chicken, shred it, and return it to the pot. Simmer 5 more minutes and season with salt.","Top with cheese."],
 es:{name:"Chili de pollo",steps:["Pica la cebolla y el ajo. Cocina la cebolla en el aceite en una olla grande hasta que se suavice, unos 6 minutos. Agrega el ajo, el chile en polvo y el comino por 1 minuto.","Agrega el caldo, los tomates, los frijoles enjuagados, el elote y el pollo entero. Cocina a fuego lento hasta que el pollo llegue a 74 °C (165 °F), de 18 a 20 minutos.","Saca el pollo, deshébralo y regrésalo a la olla. Cocina 5 minutos más y sazona con sal.","Sirve con queso."]}},
{name:"Turkey Chili",type:"Dinner",time:45,serves:6,family:"chili",cuisine:"American",keeps:5,freezes:true,equip:[],
 ing:["1 lb|ground turkey","1 can|kidney beans","1 can|black beans","1 can (28 oz)|canned tomatoes","1|onion","1|bell pepper","3 cloves|garlic","2 tbsp|chili powder","2 tsp|cumin","1 tbsp|oil","|sour cream|o"],
 steps:["Dice the onion and pepper and mince the garlic.","Brown the turkey in the oil in a large pot, breaking it up, until no pink remains, 6 to 8 minutes. Add the onion and pepper and cook until soft, about 6 minutes.","Stir in the garlic, chili powder, and cumin for 1 minute, then add the rinsed beans and tomatoes.","Simmer for 25 minutes, season with salt, and top with sour cream."],
 es:{name:"Chili de pavo",steps:["Pica la cebolla y el pimiento, y pica finamente el ajo.","Dora el pavo en el aceite en una olla grande, desmenuzándolo, hasta que ya no esté rosado, de 6 a 8 minutos. Agrega la cebolla y el pimiento y cocina hasta que se suavicen, unos 6 minutos.","Agrega el ajo, el chile en polvo y el comino por 1 minuto, y luego los frijoles enjuagados y los tomates.","Cocina a fuego lento 25 minutos, sazona con sal y sirve con crema agria."]}}
);

/* Add the new recipes and fill in details for every recipe */
MORE.forEach(r => RECIPES.push(r));
const AIRFRY_EN = "Air fryer option: cook in batches at 400F (200C) for about two-thirds of the oven time, shaking halfway.";
const AIRFRY_ES = "Opción en freidora de aire: cocina por tandas a 200 °C (400 °F) más o menos dos tercios del tiempo del horno, sacudiendo a la mitad.";
RECIPES.forEach(r => {
  if (!r.serves) r.serves = (typeof SERVES !== "undefined" && SERVES[r.name]) || 4;
  if (!r.cuisine) {
    const m = CLASSIC_META[r.name];
    if (m) { r.cuisine = m[0]; r.keeps = m[1]; r.freezes = m[2]; r.equip = m[3]; r.family = CLASSIC_FAMILY[r.name] || r.name; }
    else {
      const rule = GEN_META.find(x => x[0].test(r.name));
      if (rule) { [, r.family, r.cuisine, r.keeps, r.freezes, r.equip] = rule; }
    }
  }
  r.cuisine = r.cuisine || "American";
  r.keeps = r.keeps == null ? 3 : r.keeps;
  r.equip = r.equip || [];
  r.family = r.family || r.name;
  r.prep = r.keeps >= 3 && ["Breakfast", "Lunch", "Dinner"].includes(r.type);
  if (r.family === "sheet-pan" || r.name === "Loaded Baked Potatoes") { r.airfry = AIRFRY_EN; r.airfryEs = AIRFRY_ES; }
});
