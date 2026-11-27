"use strict";
/* A sample kitchen, so someone new can see what Benji's Kitchen does before typing anything in.
   Sample foods are marked, never count toward Waste Less or badges, and clear out with one tap. */
const SAMPLE_FOODS = [
  ["Spinach", "Fridge", 1, 1, "bag"], ["Chicken breast", "Fridge", 2, 2, "lb"], ["Strawberries", "Fridge", 2, 1, "lb"],
  ["Milk", "Fridge", 4, 0.5, "gallon"], ["Greek yogurt", "Fridge", 6, 2, "cups"], ["Eggs", "Fridge", 18, 10, ""],
  ["Cheddar cheese", "Fridge", 20, 8, "oz"], ["Bananas", "Counter", 3, 5, ""], ["Avocados", "Counter", 2, 2, ""],
  ["Bread", "Pantry", 5, 1, "loaf"], ["Onions", "Pantry", 30, 3, ""], ["Potatoes", "Pantry", 21, 5, "lb"],
  ["Rice", "Pantry", 365, 2, "lb"], ["Pasta", "Pantry", 365, 1, "lb"], ["Canned tomatoes", "Pantry", 540, 2, "cans"],
  ["Ground beef", "Freezer", 100, 1, "lb"], ["Frozen peas", "Freezer", 240, 1, "bag"]
];
const hasSample = () => items.some(i => i.sample);

function loadSample() {
  if (hasSample()) return;
  const bought = addDaysFrom(todayStr(), -3);
  SAMPLE_FOODS.forEach(([name, location, days, amount, unit]) => {
    items.push({ id: uid(), added: todayStr(), bought, verified: todayStr(), name, amount, unit, location,
      expires: addDaysFrom(todayStr(), days), notes: "", barcode: "", staple: false, sample: true });
  });
  saveItems();
  showTab("today");
  renderAll();
  toast(t("Here's a sample kitchen. Look around, then clear it when you're ready for your own food."));
}

function clearSample() {
  const snap = snapshot();
  items = items.filter(i => !i.sample);
  saveItems();
  renderAll();
  toast(t("Sample cleared. Your kitchen is ready for your own food."), snap);
}

/* Benji's line while the sample is in, so nobody mistakes it for their own food */
function sampleBubbleHtml() {
  return palBubble("wink", t("This is a sample kitchen. Look around, then clear it to add your own food."),
    [{ attrs: 'data-pal="clear-sample" class="primary"', label: t("Clear the sample") }]);
}
