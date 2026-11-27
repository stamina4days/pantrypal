"use strict";
/* Every page and its address. Addresses are what you see after # in the browser,
   so you can bookmark a recipe or send someone a link to it. */

const TAB_ROUTES = { today: "today", pantry: "food", recipes: "recipes", plan: "plan", shopping: "shopping", stats: "waste-less" };

/* Address shown while a page is open. */
const ROUTES = {
  itemDialog: () => editingId ? "food/edit" : "food/new",
  itemPage: () => "food/" + (itemPageId || ""),
  placePage: () => "place/" + encodeURIComponent(placePageName || "Fridge"),
  quickDialog: "food/quick-add",
  scanDialog: "food/scan",
  receiptDialog: "food/receipt",
  removeDialog: "food/used-or-tossed",
  recipeDialog: () => "recipe/" + (openResult ? recipeId(openResult.recipe) : ""),
  cookDialog: () => "cook/" + (cook ? recipeId(cook.r) : ""),
  collectionPage: () => "collection/" + (collectionId || ""),
  listPickDialog: "shopping/pick-list",
  dietDialog: "diets",
  recipeFormDialog: "recipes/my-recipe",
  settingsDialog: "settings",
  onboardDialog: "setup",
  auditDialog: "audit",
  plannerDialog: "plan/my-week",
  prepDialog: "plan/prep-day",
  weekPage: "plan/week",
  badgesPage: "badges",
  tipsPage: "tips",
  recapPage: "week-recap",
  orderDialog: "food/paste-order",
  aboutPage: "about",
  termsPage: "terms",
  shopPage: "shop",
  homeScreenPage: "home-screen",
  shareKitchenPage: "share-kitchen",
  helpDialog: "help",
  diagDialog: "phone-check",
  searchPage: "search",
  playPage: "play",
  musicDialog: "music",
  sortPage: "play/fridge-sort",
  wordPage: "play/food-word",
  hatsPage: "benji/hats",
  boothPage: "play/photo-booth"
};

const recipeId = r => r ? (r.mine ? "mine-" + r.id : (r.id || recipeSlug(r.name))) : "";

/* Cleanup to run whenever a page closes, however it was closed. */
const SCREEN_CLOSE = {
  cookDialog: () => { if (cook) closeCook(); }
};

/* Addresses you can open straight from a link or a bookmark. */
const DEEP_LINKS = [
  [/^recipe\/(.+)$/, m => {
    const r = recipeBySlug(m[1]) || RECIPES.find(x => x.mine && "mine-" + x.id === m[1]);
    if (!r) return false;
    openRecipe({ recipe: r });
  }],
  [/^cook\/(.+)$/, m => {
    const r = recipeBySlug(m[1]);
    if (!r) return false;
    openRecipe({ recipe: r });
    openCookMode(r, householdServings(r) / r.serves, true);
  }],
  [/^food\/new$/, () => openItem()],
  [/^food\/quick-add$/, () => $("#quickAddBtn").click()],
  [/^food\/([a-z0-9]+)$/, m => {
    if (!items.some(i => i.id === m[1])) return false;
    openItemPage(m[1]);
  }],
  [/^place\/(.+)$/, m => openPlace(decodeURIComponent(m[1]))],
  [/^collection\/(.+)$/, m => openCollection(m[1])],
  [/^diets$/, () => openDiet()],
  [/^settings$/, () => $("#settingsBtn").click()],
  [/^help$/, () => openHelp()],
  [/^phone-check$/, () => runDiagnostics()],
  [/^setup$/, () => openOnboarding("edit")],
  [/^audit$/, () => openAudit()],
  [/^plan\/my-week$/, () => openPlanner()],
  [/^plan\/prep-day$/, () => openPrep()],
  [/^plan\/week$/, () => openWeek()],
  [/^badges$/, () => openBadges()],
  [/^tips$/, () => openTips()],
  [/^week-recap$/, () => openRecap()],
  [/^food\/paste-order$/, () => openOrder()],
  [/^about$/, () => openAbout()],
  [/^terms$/, () => openTerms()],
  [/^shop$/, () => openShop()],
  [/^redeem\/(.+)$/, m => { openShop(); redeemCode(decodeURIComponent(m[1])); }],
  [/^home-screen$/, () => openHomeScreen()],
  [/^share-kitchen$/, () => openShareKitchen()],
  [/^search$/, () => openSearch()],
  [/^benji\/hats$/, () => openHats()],
  [/^tour$/, () => { setTimeout(startTour, 300); }],
  [/^play$/, () => openPlay()],
  [/^music$/, () => openMusic()],
  [/^play\/fridge-sort$/, () => openSort()],
  [/^play\/food-word$/, () => openWord()],
  [/^play\/photo-booth$/, () => openBooth()],
  [/^join\/(.+)$/, m => { joinFromLink(decodeURIComponent(m[1])); }]
];
