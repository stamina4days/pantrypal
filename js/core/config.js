"use strict";
const SPANISH_READY = false;   // the Español button and Spanish setup choice stay hidden until this is true
/* App settings that rarely change. */
const KEYS = {
  items: "pantrypal.items.v1", settings: "pantrypal.settings.v1", history: "pantrypal.history.v1",
  shopping: "pantrypal.shopping.v1", barcodes: "pantrypal.barcodes.v1", plan: "pantrypal.plan.v1",
  cooked: "pantrypal.cooked.v1", mine: "pantrypal.myrecipes.v1"
};
const DEFAULT_LOCATIONS = ["Fridge", "Freezer", "Pantry", "Counter"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Side", "Snack", "Dessert", "Drink"];
const PAGE_SIZE = 40;

/* Recipe suggestions: put your address here, split in two to slow down spam bots.
   Example: const SUGGEST_EMAIL = ["yourname", "gmail.com"].join("@");
   While it's empty, the suggestion buttons stay hidden. */
const SUGGEST_EMAIL = "";

const ZXING_URL = "https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js";       // barcode fallback (iPhone)
const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"; // reads dates from photos
const DATA_CACHE = "pantrypal-data";
