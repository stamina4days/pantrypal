# Pantry Pal

A kitchen app that plans and preps meals around the food you already have. Works offline, in English and Spanish, with no account or server. It also works without a pantry: anyone can browse recipes, plan meals, and use cook mode.

## Getting started
A short setup runs the first time: household size and appetite, diet and allergies, foods to avoid, favorite cuisines, cooking time, meal prep day, and kitchen equipment. Then there's an optional pantry audit where you tap what you have. You can skip both and change them later in Settings.

## Features
**Plan my week (Plan tab)**
- Builds 3 to 7 days of dinners. Food that expires soonest gets used first, meals share ingredients so you buy less, and repeats are avoided.
- Packs leftovers as the next day's lunch and batches breakfasts (egg muffins, overnight oats), if you turn those on.
- Respects cooking time limits, equipment, diets, dislikes, and your thumbs up and down.
- Swap any meal, lock the ones you like, then save the plan and get a shopping list in one step.

**Prep day**
- One combined plan for cooking several meals at once: preheat once, cook rice once, chop everything together, oven dishes first, then how to pack and store each one (and what to freeze).
- Built-in timers. "Done" takes the food used out of My Food and puts the cooked meals in the fridge.

**Cook mode:** big text, one step at a time, tap-to-start timers, screen stays on, read aloud, and voice commands ("next", "back", "repeat", "timer", "ingredients"; also in Spanish).

**Smarter pantry**
- Real quantities: it knows 2 lbs of chicken covers a recipe that needs 1 lb, and tells you when you're low.
- Receipt scanning, barcode scanning, quick add, and reading dates from packages.
- Learns how fast you use things and suggests restocking before you run out.
- "Still have these?" check-ins every few days keep the list accurate.
- Shopping lists grouped by store section.

**Nutrition and budget:** calories, protein, carbs, fat, and cost per serving on every recipe. Set a weekly grocery budget and a goal (high protein or lighter meals) in setup, and the planner aims for them. Shopping lists show an estimated total, and prices update from your scanned receipts.

**Helpful extras:** leftover ideas when you open leftovers, a kid-friendly filter, a "20 minutes, use what I have" button, paste a recipe from any website into the add-recipe form, add your meal plan to your calendar, and print the plan, shopping list, or prep sheet.

**Help:** the ? button explains everything, and short tips appear the first time you open each section. Settings > Check what this phone supports shows which features work on your phone.

**Recipes:** 347 recipes, including 100 new meal-prep recipes (egg muffins, overnight oats, burrito bowls, soy-ginger and Mediterranean bowls, freezer burritos, pasta bakes, slow cooker and pressure cooker meals, soups, and chili). Each one lists how long it keeps, whether it freezes, and what equipment it needs.

## Files
- `index.html`, `styles.css`: layout and look
- `app.js`: core app (food list, recipes, shopping, stats, settings)
- `kitchen.js`: setup, pantry audit, planner screens, prep day, cook mode, timers, voice, receipts, check-ins
- `extras.js`: nutrition and prices, leftover ideas, kid-friendly, recipe pasting, calendar export, printing, help, tips, phone check
- `planner.js`: the meal planning and prep-day logic
- `units.js`: quantities and conversions, store sections, receipt reading, timers in steps
- `recipes.js`, `recipes-more.js`: recipes and recipe details. Add your own to `MY_RECIPES` in `recipes.js`.
- `recipes-es.js`, `i18n.js`: Spanish text
- `sw.js`, `manifest.json`, `icon.svg`, `icon-*.png`: offline support, home-screen install, reminders
- `TESTING.md`: a checklist for testing on a real phone

## Setup
- **Acode:** open the folder, open `index.html`, tap preview.
- **GitHub Pages:** upload every file at the top level of a public repository, then Settings > Pages > Deploy from a branch > `main` / `(root)`.

## Recipe suggestions
Set your address near the top of `app.js`: `const SUGGEST_EMAIL = ["yourname", "gmail.com"].join("@");`

## Known limits
- **Nutrition and prices are estimates** based on typical US values. Prices get more accurate as you scan receipts.
- **Quantities are estimates.** Weights for things like "1 onion" or "1 bag of spinach" are typical averages.
- **Receipt and date reading** need internet the first time and can misread text, so there's always a review step.
- **Voice commands** work best in Chrome on Android. iPhone support is limited.
- **Background notifications** only work in Chrome on Android with the app on the home screen. Calendar reminders and in-app timers work everywhere, but a timer may not sound if your phone locks the browser.
- **Spanish** was machine translated and needs review by a fluent speaker.
- **Diet and allergy labels** are a helper, not a guarantee. Always check package labels.
- **Data stays on each device.** Use Settings > Export backup to move it or keep it safe.
