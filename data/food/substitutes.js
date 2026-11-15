/* What can stand in when you are missing something. */
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
