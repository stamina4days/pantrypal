"use strict";
/* Pictures for foods and recipes: hand-drawn stickers from img/food/ and img/dishes/.
   (The old emoji are kept as a last resort for anything without a drawing.) */
function foodStickerName(name, item) {
  if (item && item.leftover) return "leftovers";
  const k = canon(name);
  return byKey("sticker", FOOD_STICKER, k) || AISLE_STICKER[aisleOf(name)] || "bag";
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
function foodEmoji(name, item) {
  if (item && item.leftover) return "🍱";
  const v = byKey("emoji", FOOD_EMOJI, canon(name));
  return v || AISLE_EMOJI[aisleOf(name)] || "🛒";
}
const recipeEmoji = r => NAME_EMOJI[r.name] || FAMILY_EMOJI[r.family] || TYPE_EMOJI[r.type] || "🍽️";
