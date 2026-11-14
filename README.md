# Pantry Pal

A kitchen app that plans and preps meals around the food you already have. Works offline, in English and Spanish, with no account or server. It also works without a pantry: anyone can browse recipes, plan meals, and use cook mode.

## The look
A farmers market style: a striped awning across the top, price-tag food cards, fruit-sticker expiration dates, and a color for each tab. Pal, the fridge buddy, reacts to what's in your fridge and talks to you in a casual, friendly voice. Dark mode follows your phone's setting.

## How it moves
- **Opening screen.** Pal hops on a crate of produce while the app unpacks every page and recipe, with a progress bar.
- **Every button opens its own page.** Pages slide in from the right with a striped awning in the color of their tab, and a Back button up top. Your phone's back button and swipe-back work too.
- **Every page has an address,** so you can bookmark or share it. For example `#/recipe/shakshuka`, `#/cook/shakshuka`, `#/place/Fridge`, `#/collection/quick`, `#/plan/week`, `#/badges`, `#/tips`, `#/settings`.

## New pages
- **Food page:** tap anything on My Food. A freshness bar, what Pal thinks, quick buttons (use one, freeze, add to list, used or tossed), the best recipes that use it, how long it keeps in the fridge, pantry, and freezer, a storage tip, and the details.
- **Shelf pages:** the Fridge, Freezer, Pantry, and Counter tiles on My Food each open a page for that shelf, with "All still good" to mark everything checked.
- **Collections:** the cards across the top of Recipes. Use it up, Make it now, Ready in 20, Meal prep, Freezer friendly, Kid-friendly, Budget bites, High protein, Lighter meals, Set it and forget it, Breakfast, Something sweet, and six cuisines.
- **Week at a glance:** a placemat for each day with breakfast, lunch, and dinner, plus cost, calories, and how much food the plan rescues.
- **Badges:** 18 stickers to earn, like First rescue, Prep pro, Zero waste week, and Money saver. Pal celebrates new ones.
- **Make food last:** storage tips for 42 foods, with the ones you have listed first.
- **Waste Less** now shows money saved and a chart of the last 8 weeks.
- **About Pantry Pal** in Settings.

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

## How the project is organized
```
index.html            the shell: header, tabs, splash screen, and the script list
sw.js                 offline support (offline-files.js lists what it saves)
manifest.json         home screen icon and shortcuts
screens/              one HTML file per page
  tabs/               My Food, Recipes, Plan, Shopping, Waste Less
  food/ recipes/ plan/ stats/ settings/ sheets/
css/
  base/ layout/ components/ screens/ themes/
js/
  boot/               splash screen and the loader that pulls in every page and recipe
  router/             page addresses, sliding pages, and the back button
  core/               saving, dates, amounts, matching names, diets, scoring, shelf life
  ui/                 small shared pieces (cards, toasts, confetti)
  pal/                Pal's face, moods, lines, and emoji
  planner/            the automatic week planner and prep day builder
  features/           timers, voice, receipts, reminders, backup, badges, budget, and more
  screens/            the code for each page
  app/                wiring buttons and starting the app
data/
  recipes/            347 recipes, one file each, plus index.json
  food/               shelf life, nutrition, prices, aisles, storage tips, and more
  lang/es/, lang/en/  Spanish text and Pal's casual English
  badges.js, collections.js
img/
  pal/ places/ badges/ illustrations/ icons/
tools/list-files.py   rebuilds offline-files.js after you add or rename files
```

## Setup
- **GitHub Pages:** upload everything, keeping the folders, to a public repository. On github.com use **Add file > Upload files** and drag the *contents* of the `pantry-pal` folder (not the folder itself) into the box; folders upload with it. Then Settings > Pages > Deploy from a branch > `main` / `(root)`.
- **It needs a web address.** Because pages and recipes load as separate files, opening `index.html` straight from your phone's files won't work. Use your GitHub Pages link. In Acode, use its preview server.
- **After an update,** the app may show the old version once while it saves the new one in the background. Close and reopen it.

## Adding a recipe
1. Copy any file in `data/recipes/` and rename it, like `my-new-dish.json`.
2. Change the name, time, servings, ingredients (`"amount|ingredient"`, add `|o` at the end for optional), steps, and the Spanish `es` name and steps.
3. Add the file name to `data/recipes/index.json`.
That's it. The offline cache reads the index on its own.

## Recipe suggestions
Set your address near the top of `js/core/config.js`: `const SUGGEST_EMAIL = ["yourname", "gmail.com"].join("@");`

## Known limits
- **Fonts** load from Google Fonts the first time you open the app online. After that they're saved for offline use.
- **Nutrition and prices are estimates** based on typical US values. Prices get more accurate as you scan receipts.
- **Quantities are estimates.** Weights for things like "1 onion" or "1 bag of spinach" are typical averages.
- **Receipt and date reading** need internet the first time and can misread text, so there's always a review step.
- **Voice commands** work best in Chrome on Android. iPhone support is limited.
- **Background notifications** only work in Chrome on Android with the app on the home screen. Calendar reminders and in-app timers work everywhere, but a timer may not sound if your phone locks the browser.
- **Spanish** was machine translated and needs review by a fluent speaker.
- **Diet and allergy labels** are a helper, not a guarantee. Always check package labels.
- **Data stays on each device.** Use Settings > Export backup to move it or keep it safe.
