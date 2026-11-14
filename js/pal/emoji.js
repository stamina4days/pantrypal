"use strict";
/* Picking an emoji for a food or a recipe. */
function foodEmoji(name, item) {
  if (item && item.leftover) return "🍱";
  const v = byKey("emoji", FOOD_EMOJI, canon(name));
  return v || AISLE_EMOJI[aisleOf(name)] || "🛒";
}
const recipeEmoji = r => NAME_EMOJI[r.name] || FAMILY_EMOJI[r.family] || TYPE_EMOJI[r.type] || "🍽️";
