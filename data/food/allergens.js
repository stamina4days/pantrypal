/* Ingredients that matter for diets and allergies. */
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
