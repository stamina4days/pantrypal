# Pantry Pal

A kitchen app that plans and preps meals around the food you already have. Works offline, in English and Spanish, with no account or server. It also works without a pantry: anyone can browse recipes, plan meals, and use cook mode.

## The look
A farmers market style: a striped awning across the top, price-tag food cards, fruit-sticker expiration dates, and a color for each tab. Pal, the fridge buddy, reacts to what's in your fridge and talks to you in a casual, friendly voice. Dark mode follows your phone's setting.

## How it moves
- **Opening screen.** Pal hops on a crate of produce while the app unpacks every page and recipe, with a progress bar.
- **Every button opens its own page.** Pages slide in from the right with a striped awning in the color of their tab, and a Back button up top. Your phone's back button and swipe-back work too.
- **Every page has an address,** so you can bookmark or share it. For example `#/recipe/shakshuka`, `#/cook/shakshuka`, `#/place/Fridge`, `#/collection/quick`, `#/plan/week`, `#/badges`, `#/tips`, `#/settings`.

## New in version 11.3
- **Text size:** Settings (and setup) has Regular, Large, and Extra large. The whole app grows with it, not just some words.
- **Running low:** the shopping list suggests foods you're almost out of, usually run out of about now, just finished, or always keep on hand. Tap Add, Add all, or the X to hide one for a week.
- **Cook these:** when food is close to its date, Today shows a Cook these button. It lists recipes that use up the most of that food, soonest first, and says which of your foods each one uses.

## New in version 11.2
- **Search everything:** the Search button at the top of every tab opens one box that finds your food, recipes (by name or ingredient), shopping list items, storage tips, and things the app can do, like "plan my week" or "backup." Tap any result to go straight there.
- **Nothing found?** Add what you typed to My Food or the shopping list in one tap.
- Every page has an address, so `#/search` opens search directly.

## New in version 11.1
- **Family kitchen table look:** cream paper, a red gingham cloth along the top, cards taped down with butter yellow tape, handwritten headings, and a honey wood shelf for the tabs. Today's special is a recipe card now.
- **Warm evening colors:** in dark mode the same table sits under lamplight instead of cold blue.
- **Easier to see:** buttons and boxes have clear wooden edges, and every word still meets the contrast standard.

## New in version 11
- **Today:** a new home screen that fits on one phone screen. It shows Pal's note, the three foods to use first, tonight's pick, your saved-food jar, and a big Add food button. Waste Less opens from the jar.
- **Swipe on My Food:** swipe a food left for "Used it" or "Tossed," or right to freeze it. Foods are grouped into "Eat soon" and "Good for now," with shelf buttons across the top.
- **A quicker Add food:** a sheet slides up. Type the name or tap a quick pick, tap where it goes, and tap when it goes bad (Pal's guess is already picked). Extra details are tucked away.
- **No more browser pop-ups:** new lists, renaming, deleting, and shared kitchens all use Pal sheets that slide up from the bottom.
- **Feels like an app:** opens instantly after the first visit, with no tap flashes or accidental text selection.

## New in version 10
- **Say it:** tap the microphone on My Food and say what you bought ("milk, a dozen eggs, and two pounds of chicken"). Works in Chrome on Android; the button hides itself where the phone can't do it.
- **I bought these:** check things off your shopping list, then one tap puts them all in My Food with their amounts and dates.
- **I opened it:** on a food's page. Milk, salsa, sauces, and the like switch to their shorter opened shelf life and move to the fridge.
- **Faster first load:** recipes come from one file instead of 347.
- **Home screen guide:** pictures for iPhone and Android, plus a one-tap button where the phone allows it (Settings, or Pal asks after a couple of days).
- **Share your kitchen:** Settings, then "Share your kitchen" sends a link that copies your food, lists, plan, and recipes onto another phone. No accounts, no server.
- **Readability:** every word passes the standard contrast check in day and evening colors, and keyboard focus shows a clear ring.
- **English only for now.** The Spanish files are still in the project; set `SPANISH_READY` to `true` in `js/core/config.js` to bring the language switch back.

## Made for every age
- **Simple view by default:** one big "Add food" button, large rows, and Pal. "Show me everything" at the bottom of My Food (or in Settings) brings back filters and extras. Setup asks which you prefer.
- **A word under every icon,** everyday words instead of computer words ("Save a copy," not "Export backup"), and dates like "Eat by Thursday" or "bought Saturday."
- **Easy to read:** bigger text, Undo stays up for 12 seconds, and a speaker button on Pal's bubble reads it aloud.
- **A warm kitchen look:** paper grain, a wooden shelf, masking tape labels, recipe index cards, a notepad shopping list with a magnet, and lamplight colors at night.
- **Your kitchen:** Pal uses your name and the header says whose kitchen it is. Add your own notes to any recipe on a sticky note, and mark whose favorite it is.
- **Waste Less jar:** fills with stickers of the food you saved.
- **Little helper:** steps kids can safely do get a hand mark in cook mode, and finishing earns a sticker.

## Pal's personality
- **Hand-drawn everything.** 55 icons, 68 food stickers, and 28 dish drawings replace the phone's emoji, so the app looks the same on every phone.
- **Pal is alive.** Pal blinks, bounces and says something when you tap it, dances when you rescue food, greets you differently by time of day, and dresses for the season (a switch in Settings turns outfits off).
- **Moments you can feel.** A RESCUED stamp thunks down when you save food, a price tag tears in half when something's tossed, and little sounds and buzzes go with them (Settings > Sounds and buzzes).
- **Today's special** on My Food: a chalkboard with one recipe, either rescuing something that's about to go bad or the day's theme (Taco Tuesday, Soup Sunday, and so on).
- **Pal's lines** live in `data/pal/voice-en.js` and `data/pal/voice-es.js`. Edit them to change what Pal says.
- **Custom controls:** dropdowns, search boxes, checkboxes, and Settings switches drawn to match the market look.

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
  recipes/            347 recipes, one file each, in category folders, plus index.json
    breakfast/ (84)  lunch/ (35)  drinks/ (15)  sides-and-snacks/ (10)  desserts/ (3)
    dinner-asian/ (72)  dinner-american/ (49)  dinner-italian/ (26)
    dinner-mexican/ (21)  dinner-indian/ (21)  dinner-mediterranean/ (11)
  food/               shelf life, nutrition, prices, aisles, storage tips, and more
  lang/es/, lang/en/  Spanish text and Pal's casual English
  pal/                Pal's lines in English and Spanish
  badges.js, collections.js, specials.js
img/
  pal/ places/ badges/ illustrations/ icons/ (icons/ui/ has the hand-drawn icons)
  food/               food stickers
  dishes/             dish drawings for recipes
tools/list-files.py   rebuilds offline-files.js after you add or rename files
```

## Setup
- **GitHub Pages:** upload everything, keeping the folders, to a public repository. GitHub's website takes up to 100 files per upload. Every recipe folder is under 100 files, so each one can go up in a single batch.
- **It needs a web address.** Because pages and recipes load as separate files, opening `index.html` straight from your phone's files won't work. Use your GitHub Pages link. In Acode, use its preview server.
- **After an update,** the app may show the old version once while it saves the new one in the background. Close and reopen it.

## Adding a recipe
1. Copy any file from the folder it belongs in (like `data/recipes/breakfast/`) and rename it, like `my-new-dish.json`.
2. Change the name, time, servings, ingredients (`"amount|ingredient"`, add `|o` at the end for optional), steps, and the Spanish `es` name and steps.
3. Add it to `data/recipes/index.json` with its folder, like `"breakfast/my-new-dish.json"`. A new category is just a new folder.
That's it. To open fast, the app reads `data/recipes.json`, which holds every recipe in one file, and downloads only the recipe files it doesn't find there, so new recipes show up right away. Edits to an existing recipe file are picked up by a quiet check once a day. To have them show up immediately, ask me to rebuild `data/recipes.json`.

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
