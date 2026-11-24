/* What can stand in when you're missing something: when a recipe needs "need", any of "use" will do. */
const SUBS = [
  { need: "cream", use: ["milk"], note: "Use milk with 1 tablespoon of melted butter per cup. It'll be a little thinner." },
  { need: "sour cream", use: ["yogurt"], note: "Plain yogurt works the same way." },
  { need: "yogurt", use: ["sour cream"], note: "Sour cream works the same way." },
  { need: "mayonnaise", use: ["yogurt"], note: "Plain yogurt works in salads and sandwiches." },
  { need: "breadcrumbs", use: ["bread", "oats"], note: "Crumble toasted bread, or use quick oats." },
  { need: "lemon", use: ["lime", "vinegar"], note: "Use lime juice, or a splash of vinegar for sourness." },
  { need: "lime", use: ["lemon", "vinegar"], note: "Use lemon juice, or a splash of vinegar." },
  { need: "scallions", use: ["onion"], note: "Use a little finely chopped onion." },
  { need: "cilantro", use: ["parsley"], note: "Parsley adds the same freshness with a different flavor." },
  { need: "spinach", use: ["kale"], note: "Use kale, chopped fine and cooked a few minutes longer." },
  { need: "kidney beans", use: ["black beans", "chickpeas"], note: "Any canned beans work." },
  { need: "black beans", use: ["kidney beans", "chickpeas"], note: "Any canned beans work." },
  { need: "tomato sauce", use: ["canned tomatoes"], note: "Simmer canned tomatoes with a little garlic for 10 minutes." },
  { need: "canned tomatoes", use: ["tomatoes"], note: "Use about 6 chopped fresh tomatoes per large can, and simmer a little longer." },
  { need: "butter", use: ["oil"], note: "Oil works for cooking. Baked goods come out a little denser." },
  { need: "milk", use: ["cream"], note: "Mix cream with an equal amount of water." },
  { need: "granola", use: ["oats"], note: "Toast oats in a dry pan with a little honey or sugar." },
  { need: "bacon", use: ["ham"], note: "Diced ham gives a similar smoky, salty bite." },
  { need: "ham", use: ["bacon"], note: "Cook chopped bacon until crisp first." }
];
