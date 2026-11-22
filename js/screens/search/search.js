"use strict";
/* Search everything from one box: your food, recipes, shopping lists, storage tips,
   and the things the app can do ("plan my week", "backup", "share"). Every result opens what you tapped. */

/* Things you can do. Words are what people might type for each one. */
const SEARCH_ACTIONS = [
  { name: "Add food", icon: "plus", words: "add new food bought groceries put in", run: () => openItem() },
  { name: "Add several foods at once", icon: "note", words: "list many quick add notepad several", run: () => { Router.go("food"); setTimeout(() => $("#quickAddBtn").click(), 50); } },
  { name: "Scan a barcode", icon: "camera", words: "scan barcode camera upc", run: () => { openItem(null); openScanner(); } },
  { name: "Read a receipt", icon: "receipt", words: "receipt photo scan store", run: () => { Router.go("food"); setTimeout(() => $("#receiptFile").click(), 50); } },
  { name: "Show Pal my kitchen", icon: "clipboard", words: "audit check kitchen pantry walk through what i have", run: () => openAudit() },
  { name: "Cook with what's expiring", icon: "chef", words: "cook expiring use up rescue going bad tonight dinner leftovers", run: () => openCollection("rescue") },
  { name: "Plan my week", icon: "sparkle", words: "plan meals week dinner automatic menu planner", run: () => openPlanner() },
  { name: "Week at a glance", icon: "week", words: "week calendar plan overview glance", run: () => openWeek() },
  { name: "Prep day", icon: "knife", words: "meal prep batch cook prep day", run: () => openPrep() },
  { name: "Add your own recipe", icon: "pencil", words: "add my recipe write own family new recipe", run: () => openRecipeForm("mine") },
  { name: "Diet and allergies", icon: "leaf", words: "diet allergy allergies vegetarian vegan gluten dairy nut halal kosher", run: () => openDiet() },
  { name: "Play", icon: "game", words: "play games fun bored", run: () => openPlay() },
  { name: "Fridge Sort", icon: "fridge", words: "game sort fridge quiz storage where", run: () => openSort() },
  { name: "Daily food word", icon: "grid", words: "word puzzle wordle game daily", run: () => openWord() },
  { name: "Kitchen radio", icon: "music", words: "radio music sounds background lofi rain relax", run: () => openPlay() },
  { name: "Shopping list", icon: "cart", words: "shopping list grocery store buy", run: () => Router.go("shopping") },
  { name: "Waste Less", icon: "jar", words: "waste less jar saved stats money tossed", run: () => Router.go("waste-less") },
  { name: "Badges", icon: "trophy", words: "badges stickers awards trophies", run: () => openBadges() },
  { name: "Make food last", icon: "bulb", words: "storage tips keep fresh longer last", run: () => openTips() },
  { name: "Settings", icon: "gear", words: "settings options backup save a copy export import restore sounds reminders", run: () => $("#settingsBtn").click() },
  { name: "People, diet, cooking time, and equipment", icon: "house", words: "setup household people family kids cooking time equipment budget goal name", run: () => openOnboarding("edit") },
  { name: "Share your kitchen", icon: "share", words: "share kitchen family partner another phone sync link", run: () => openShareKitchen() },
  { name: "Put Pal on your home screen", icon: "phone", words: "install home screen app icon", run: () => openHomeScreen() },
  { name: "How to use Pantry Pal", icon: "help", words: "help how to use guide instructions", run: () => openHelp() },
  { name: "Check what this phone supports", icon: "phone", words: "phone check diagnostics camera voice notifications", run: () => runDiagnostics() },
  { name: "About Pantry Pal", icon: "info", words: "about version", run: () => openAbout() }
];

let searchTimer = 0;

function openSearch() {
  $("#srInput").value = "";
  renderSearch();
  $("#searchPage").showModal();
  setTimeout(() => $("#srInput").focus(), 60);
}

/* Each word you type has to match the start of some word in the text. */
function searchWords(q) { return norm(q).trim().split(" ").filter(Boolean); }
function searchScore(words, title, extra) {
  const ht = norm(title), hx = norm(extra || "");
  let score = 0;
  for (const w of words) {
    if (ht.includes(" " + w + " ")) score += 6;
    else if (ht.includes(" " + w)) score += 4;
    else if (hx.includes(" " + w)) score += 1;
    else return 0;
  }
  if (ht.trim().startsWith(words[0])) score += 3;
  return score;
}
const srIcon = name => `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/${name}.svg#i"/></svg>`;
const srGroup = (title, rows, more) => rows.length
  ? `<section class="sr-group"><h3>${esc(t(title))}</h3><ul class="sr-list">${rows.join("")}</ul>${more || ""}</section>` : "";

function renderSearch() {
  const raw = $("#srInput").value.trim();
  $("#srClear").classList.toggle("hidden", !raw);
  const box = $("#srResults");
  if (!raw) { box.innerHTML = searchStartHtml(); return; }
  const words = searchWords(raw);
  if (!words.length) { box.innerHTML = ""; return; }

  // Your food
  const foods = items.map(i => ({ i, s: searchScore(words, i.name, locLabel(i.location) + " " + (i.notes || "")) }))
    .filter(x => x.s).sort((a, b) => b.s - a.s || (daysLeft(a.i.expires) ?? 999) - (daysLeft(b.i.expires) ?? 999)).slice(0, 8);
  const foodRows = foods.map(({ i }) => {
    const lab = expiryLabel(daysLeft(i.expires));
    const sub = [locLabel(i.location), amountText(i)].filter(Boolean).join(", ");
    return `<li><a class="sr-row" href="#/food/${esc(i.id)}">${foodArt(i.name, i, "sr-art")}
      <span class="grow"><strong>${esc(i.name)}</strong><span>${esc(sub)}</span></span>
      ${i.expires ? `<span class="sr-when ${lab.cls}">${esc(friendlyWhen(i.expires))}</span>` : ""}</a></li>`;
  });

  // Recipes: the name counts most, then ingredients
  const recipes = RECIPES.map(r => ({ r, s: searchScore(words, rName(r), r.search) })).filter(x => x.s)
    .sort((a, b) => b.s - a.s || a.r.time - b.r.time);
  const recipeRows = recipes.slice(0, 5).map(({ r }) => `<li><a class="sr-row" href="#/recipe/${esc(recipeId(r))}">${recipeArt(r, "sr-art")}
      <span class="grow"><strong>${esc(rName(r))}</strong><span>${esc(t("{n} min", { n: r.time }))}</span></span></a></li>`);
  const cols = COLLECTIONS.map(c => ({ c, s: searchScore(words, t(c.name), t(c.desc)) })).filter(x => x.s).slice(0, 2);
  cols.forEach(({ c }) => recipeRows.push(`<li><a class="sr-row" href="#/collection/${esc(c.id)}"><img class="sr-art" src="img/${esc(c.art)}.svg" alt="">
      <span class="grow"><strong>${esc(t(c.name))}</strong><span>${esc(t(c.desc))}</span></span></a></li>`));
  const moreRecipes = recipes.length > 5
    ? `<button class="text-btn sr-more" type="button" data-sr-recipes>${esc(t("See all {n} recipes", { n: recipes.length }))}</button>` : "";

  // Shopping lists
  const shopRows = [];
  shopping.forEach(l => l.items.forEach(x => {
    if (shopRows.length < 6 && searchScore(words, x.name)) shopRows.push(`<li><button class="sr-row" type="button" data-sr-list="${esc(l.id)}">${foodArt(x.name, null, "sr-art")}
      <span class="grow"><strong class="${x.done ? "sr-done" : ""}">${esc(x.name)}</strong><span>${esc(x.done ? t("In the cart on {list}", { list: l.name }) : t("On {list}", { list: l.name }))}</span></span></button></li>`);
  }));

  // Storage tips
  const tipRows = STORAGE_TIPS.map(tp => ({ tp, s: searchScore(words, tp[0], LANG === "es" ? tp[3] : tp[2]) })).filter(x => x.s >= 4)
    .sort((a, b) => b.s - a.s).slice(0, 2).map(({ tp }) => `<li><button class="sr-row sr-tip" type="button" data-sr-tip="${esc(tp[0])}">${foodArt(tp[0], null, "sr-art")}
      <span class="grow"><strong>${esc(tp[0].charAt(0).toUpperCase() + tp[0].slice(1))}</strong><span>${esc(LANG === "es" ? tp[3] : tp[2])}</span></span></button></li>`);

  // Things you can do
  const actRows = SEARCH_ACTIONS.map((a, k) => ({ a, k, s: searchScore(words, t(a.name), a.words) })).filter(x => x.s)
    .sort((a, b) => b.s - a.s).slice(0, 4).map(({ a, k }) => actionRow(a, k));

  const found = foodRows.length + recipeRows.length + shopRows.length + tipRows.length + actRows.length;
  const nameExact = items.some(i => norm(i.name) === norm(raw));
  const addRows = nameExact || actRows.length ? "" : `<div class="sr-add">
      <button class="secondary-btn" type="button" data-sr-add-food>${srIcon("plus")} ${esc(t("Add \"{name}\" to My Food", { name: raw }))}</button>
      <button class="secondary-btn" type="button" data-sr-add-list>${srIcon("cart")} ${esc(t("Add \"{name}\" to the shopping list", { name: raw }))}</button>
    </div>`;

  box.innerHTML = (found ? "" : palBubble("worried", t("I couldn't find \"{q}\" anywhere. Check the spelling, or add it below.", { q: raw }), []))
    + srGroup("Your food", foodRows)
    + srGroup("Things you can do", actRows)
    + srGroup("Recipes", recipeRows, moreRecipes)
    + srGroup("Shopping lists", shopRows)
    + srGroup("Make food last", tipRows)
    + addRows;
}

function actionRow(a, k) {
  return `<li><button class="sr-row" type="button" data-sr-act="${k}"><span class="sr-art sr-ic">${srIcon(a.icon)}</span>
    <span class="grow"><strong>${esc(t(a.name))}</strong></span></button></li>`;
}

/* Before you type: the foods to use first and the most common things to do. */
function searchStartHtml() {
  const soon = items.filter(i => { const d = daysLeft(i.expires); return d !== null && d <= 3; })
    .sort((a, b) => daysLeft(a.expires) - daysLeft(b.expires)).slice(0, 4);
  const chips = soon.length ? `<section class="sr-group"><h3>${esc(t("Eat these soon"))}</h3><div class="sr-chips">${soon.map(i =>
    `<button class="pick-chip" type="button" data-sr-q="${esc(i.name)}">${foodArt(i.name, i, "pick-art")}${esc(i.name)}</button>`).join("")}</div></section>` : "";
  const common = ["Add food", "Plan my week", "Shopping list", "Add your own recipe", "Make food last", "Settings"]
    .map(n => SEARCH_ACTIONS.findIndex(a => a.name === n)).filter(k => k >= 0);
  return chips + srGroup("Things you can do", common.map(k => actionRow(SEARCH_ACTIONS[k], k)))
    + `<p class="sr-hint">${esc(t("Try a food like \"chicken\", a recipe, or something to do like \"backup\"."))}</p>`;
}

function searchInit() {
  const input = $("#srInput");
  input.addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(renderSearch, 120); });
  input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); input.blur(); } });
  $("#srClear").addEventListener("click", () => { input.value = ""; renderSearch(); input.focus(); });
  $("#searchBtn").addEventListener("click", openSearch);
  $("#srResults").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const raw = input.value.trim();
    if (b.dataset.srQ) { input.value = b.dataset.srQ; renderSearch(); return; }
    if (b.dataset.srAct !== undefined) {
      const a = SEARCH_ACTIONS[Number(b.dataset.srAct)];
      if (a) a.run();
      return;
    }
    if (b.dataset.srList) {
      settings.activeList = b.dataset.srList; saveSettings();
      Router.go("shopping");
      return;
    }
    if (b.dataset.srTip) {
      openTips(); $("#tpSearch").value = b.dataset.srTip; renderTips();
      return;
    }
    if (b.hasAttribute("data-sr-recipes")) {
      recipeMode = "browse"; setPressed("#recipeMode", $('#recipeMode [data-mode="browse"]'));
      $("#recipeSearch").value = raw;
      Router.go("recipes");
      return;
    }
    if (b.hasAttribute("data-sr-add-food")) { openItem(null, { name: raw }); return; }
    if (b.hasAttribute("data-sr-add-list")) {
      const list = stapleList();
      const added = addToList(list, raw);
      saveShopping();
      toast(added ? t("Added {name} to {list}.", { name: raw, list: list.name }) : t("{name} is already on {list}.", { name: raw, list: list.name }));
      renderSearch();
    }
  });
}
