"use strict";
/* Pictures for foods and recipes: hand-drawn stickers from img/food/ and img/dishes/.
   A food without its own drawing gets its store section's sticker, and failing that, a grocery bag. */
function foodStickerName(name, item) {
  if (item && item.leftover) return "leftovers";
  const k = canon(name);
  const raw = String(name || "").toLowerCase().trim().replace(/s$/, "");
  return byKey("sticker", FOOD_STICKER, k) || FOOD_STICKER[raw] || AISLE_STICKER[aisleOf(name)] || "bag";
}
function foodArt(name, item, cls) {
  return `<img class="food-art ${cls || ""}" src="img/food/${foodStickerName(name, item)}.svg" alt="" width="40" height="40" loading="lazy">`;
}
function dishName(r) {
  return NAME_DISH[r.name] || FAMILY_DISH[r.family] || TYPE_DISH[r.type] || "plate";
}
function recipeArt(r, cls) {
  return `<img class="dish-art ${cls || ""}" src="img/dishes/${dishName(r)}.svg" alt="" width="40" height="40" loading="lazy">`;
}
