"use strict";
/* Starting the app. */
function init() {
  buildMatcher();
  myRecipes.forEach(addMineToRecipes);
  applyDisplay();

  // Keyboard: Enter or Space on card rows
  document.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[role=button]")) { e.preventDefault(); e.target.click(); }
  });

  $$(".tabbar button").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
  $("#langBtn").addEventListener("click", () => { settings.lang = LANG === "es" ? "en" : "es"; saveSettings(); applyLang(); });

  // My Food
  $("#alerts").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.go) showTab(b.dataset.go);
    if (b.dataset.toss) tossExpired();
  });
  $("#locFilter").addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { locFilter = b.dataset.loc; renderPantry(); } });
  $("#pantrySearch").addEventListener("input", renderPantry);
  $("#itemList").addEventListener("click", e => {
    const minus = e.target.closest("[data-minus]");
    if (minus) { e.stopPropagation(); useOne(minus.dataset.minus); return; }
    const li = e.target.closest(".item"); if (li) openItemPage(li.dataset.id);
  });
  $("#addBtn").addEventListener("click", () => openItem(null));
  $("#scanQuick").addEventListener("click", () => { openItem(null); openScanner(); });
  $("#quickAddBtn").addEventListener("click", () => { $("#quickText").value = ""; renderQuickPreview(); $("#quickDialog").showModal(); });
  $("#quickText").addEventListener("input", renderQuickPreview);
  $("#cancelQuick").addEventListener("click", () => $("#quickDialog").close());
  $("#confirmQuick").addEventListener("click", confirmQuick);

  // Item dialog
  $("#itemForm").addEventListener("submit", saveItem);
  $("#cancelItem").addEventListener("click", () => $("#itemDialog").close());
  $("#deleteItem").addEventListener("click", () => { const it = items.find(i => i.id === editingId); $("#itemDialog").close(); if (it) askRemove(it); });
  $("#itemReminder").addEventListener("click", () => { const it = items.find(i => i.id === editingId); if (it) calendarReminders([it]); });
  $("#freezeBtn").addEventListener("click", freezeOrThaw);
  $("#useThisBtn").addEventListener("click", () => {
    focusItemId = editingId; $("#itemDialog").close();
    recipeMode = "foryou"; setPressed("#recipeMode", $('#recipeMode [data-mode="foryou"]'));
    showTab("recipes");
  });
  $("#suggestExpiry").addEventListener("click", () => suggestExpiry(false));
  $("#fName").addEventListener("change", () => { if (!editingId) $("#fStaple").checked = isStaple($("#fName").value); });
  $("#readDateBtn").addEventListener("click", () => $("#dateFile").click());
  $("#dateFile").addEventListener("change", e => { if (e.target.files[0]) readDateFromPhoto(e.target.files[0]); e.target.value = ""; });
  $("#scanBtn").addEventListener("click", openScanner);

  // Scanner
  $("#closeScan").addEventListener("click", () => $("#scanDialog").close());
  $("#scanDialog").addEventListener("close", stopScanner);
  $("#manualCodeForm").addEventListener("submit", e => { e.preventDefault(); const code = $("#manualCode").value.replace(/\D/g, ""); if (code) gotCode(code); });

  // Remove dialog
  $("#removeDialog").addEventListener("click", e => { const b = e.target.closest("[data-outcome]"); if (b) finishRemove(b.dataset.outcome); });

  // Recipes
  segment("#recipeMode", "mode", m => { recipeMode = m; recipeLimit = PAGE_SIZE; renderRecipes(); });
  const rerender = () => { recipeLimit = PAGE_SIZE; renderRecipes(); };
  $("#recipeSearch").addEventListener("input", rerender);
  ["#missingFilter", "#typeFilter", "#timeFilter", "#sortSelect"].forEach(id => $(id).addEventListener("change", rerender));
  $("#moreRecipes").addEventListener("click", () => { recipeLimit += PAGE_SIZE; renderRecipes(); });
  $("#recipeList").addEventListener("click", e => { const li = e.target.closest(".recipe"); if (li) openRecipe(recipeResults[Number(li.dataset.idx)]); });
  ["#focusBanner", "#planBanner"].forEach(id => $(id).addEventListener("click", e => {
    const b = e.target.closest("[data-clear]"); if (!b) return;
    if (b.dataset.clear === "focus") focusItemId = null; else planTarget = null;
    renderRecipes();
  }));
  $("#closeRecipe").addEventListener("click", () => $("#recipeDialog").close());
  $("#favBtn").addEventListener("click", toggleFavorite);
  $("#servMinus").addEventListener("click", () => changeServings(-1));
  $("#servPlus").addEventListener("click", () => changeServings(1));
  $("#cookedBtn").addEventListener("click", showCookedPanel);
  $("#confirmCooked").addEventListener("click", confirmCooked);
  $("#leftoverChk").addEventListener("change", e => $("#leftoverRow").classList.toggle("hidden", !e.target.checked));
  $("#cookedList").addEventListener("click", e => {
    const b = e.target.closest("[data-all]"); if (!b) return;
    const inp = $(`#cookedList .used-amt[data-id="${b.dataset.all}"]`); if (inp) inp.value = inp.max;
  });
  $("#planBtn").addEventListener("click", showPlanPanel);
  $("#confirmPlan").addEventListener("click", confirmPlan);
  $("#shopBtn").addEventListener("click", shopFromRecipe);
  $("#editMineBtn").addEventListener("click", () => {
    const m = myRecipes.find(x => x.id === openResult.recipe.id); if (m) openRecipeForm("mine", m);
  });
  $("#deleteMineBtn").addEventListener("click", deleteMine);

  $("#shopListPick").addEventListener("change", e => $("#shopNewName").classList.toggle("hidden", e.target.value !== "__new"));
  $("#confirmShop").addEventListener("click", confirmPick);
  $("#cancelPick").addEventListener("click", () => $("#listPickDialog").close());

  $("#dietBtn").addEventListener("click", openDiet);
  $("#dietOptions").addEventListener("change", () => {
    settings.diets = $$("#dietOptions input:checked").map(c => c.value);
    saveSettings(); renderDietSummary(); renderAll();
  });
  $("#closeDiet").addEventListener("click", () => $("#dietDialog").close());

  $("#suggestBtn").classList.toggle("hidden", !SUGGEST_EMAIL);
  $("#suggestBtn").addEventListener("click", () => openRecipeForm("suggest"));
  $("#newRecipeBtn").addEventListener("click", () => openRecipeForm("mine"));
  $("#cancelRecipeForm").addEventListener("click", () => $("#recipeFormDialog").close());
  $("#recipeForm").addEventListener("submit", saveMyRecipe);
  $("#emailRecipe").addEventListener("click", emailSuggestion);

  // Plan
  $("#planBody").addEventListener("click", e => {
    const un = e.target.closest("[data-unplan]");
    if (un) { e.stopPropagation(); plan = plan.filter(m => m.id !== un.dataset.unplan && m.fromId !== un.dataset.unplan); savePlan(); renderPlan(); return; }
    const add = e.target.closest("[data-plan-day]");
    if (add) {
      planTarget = add.dataset.planDay;
      recipeMode = "browse"; setPressed("#recipeMode", $('#recipeMode [data-mode="browse"]'));
      showTab("recipes"); return;
    }
    const li = e.target.closest("[data-meal]");
    if (li) {
      const m = plan.find(x => x.id === li.dataset.meal), r = m && recipeByName(m.recipe);
      if (r) openRecipe(planReservations().evs.get(m.id) || evaluate(r, availablePool(), settings.diets), m.id);
    }
  });
  $("#planShopBtn").addEventListener("click", planShopping);

  // Shopping
  $("#listSelect").addEventListener("change", e => { settings.activeList = e.target.value; saveSettings(); renderShopping(); });
  $("#newListBtn").addEventListener("click", newList);
  $("#listMenuBtn").addEventListener("click", listMenu);
  $("#shareListBtn").addEventListener("click", shareList);
  $("#shopAddForm").addEventListener("submit", e => {
    e.preventDefault();
    const list = currentList(), name = $("#shopAddInput").value.trim();
    if (!list || !name) return;
    if (!addToList(list, name, "", "")) toast(t("{name} is already on the list.", { name }));
    $("#shopAddInput").value = "";
    saveShopping(); renderShopping();
  });
  $("#shopItems").addEventListener("click", e => {
    const list = currentList(); const del = e.target.closest("[data-del]");
    if (list && del) { list.items = list.items.filter(x => x.id !== del.dataset.del); saveShopping(); renderShopping(); }
  });
  $("#shopItems").addEventListener("change", e => {
    const list = currentList(), id = e.target.dataset.toggle;
    if (!list || !id) return;
    const x = list.items.find(i => i.id === id);
    if (x) { x.done = e.target.checked; if (x.done) bump("checked"); saveShopping(); renderShopping(); }
  });
  $("#moveToFood").addEventListener("click", moveCheckedToFood);
  $("#clearChecked").addEventListener("click", () => {
    const list = currentList(); if (!list) return;
    list.items = list.items.filter(x => !x.done); saveShopping(); renderShopping();
  });

  // Stats
  segment("#statsRange", "range", r => { statsRange = r; renderStats(); });

  // Settings
  $("#settingsBtn").addEventListener("click", () => {
    $("#assumeBasics").checked = settings.assumeBasics;
    $("#useSubs").checked = settings.useSubs;
    $("#remindersToggle").checked = settings.reminders;
    $("#largeText").checked = settings.largeText;
    $("#highContrast").checked = settings.highContrast;
    $("#langSelect").value = LANG;
    $("#settingsDialog").showModal();
  });
  $("#closeSettings").addEventListener("click", () => $("#settingsDialog").close());
  $("#langSelect").addEventListener("change", e => { settings.lang = e.target.value; saveSettings(); applyLang(); });
  $("#assumeBasics").addEventListener("change", e => { settings.assumeBasics = e.target.checked; saveSettings(); renderAll(); });
  $("#useSubs").addEventListener("change", e => { settings.useSubs = e.target.checked; saveSettings(); renderAll(); });
  $("#largeText").addEventListener("change", e => { settings.largeText = e.target.checked; saveSettings(); applyDisplay(); });
  $("#highContrast").addEventListener("change", e => { settings.highContrast = e.target.checked; saveSettings(); applyDisplay(); });
  $("#remindersToggle").addEventListener("change", e => setReminders(e.target.checked));
  $("#calendarAll").addEventListener("click", () => calendarReminders(items));
  $("#exportBtn").addEventListener("click", exportBackup);
  $("#importFile").addEventListener("change", e => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ""; });
  $("#clearAll").addEventListener("click", () => {
    if (!confirm(t("Delete ALL your food, lists, plan, recipes, and stats? Export a backup first if you might want them back."))) return;
    items = []; history = []; shopping = []; plan = []; cookedLog = [];
    RECIPES.filter(r => r.mine).forEach(r => RECIPES.splice(RECIPES.indexOf(r), 1));
    myRecipes = []; settings.activeList = null; settings.favorites = []; settings.staples = [];
    saveItems(); saveHistory(); saveShopping(); savePlan(); saveCooked(); saveMine(); saveSettings(); renderAll();
  });

  // Tap outside a small sheet to close it
  $$("dialog.sheet").forEach(d => d.addEventListener("click", e => { if (e.target === d) d.close(); }));

  kitchenInit();
  extrasInit();
  buddyInit();
  pagesInit();
  applyLang();
  importSharedList();
  if (!settings.onboarded && !location.hash.startsWith("#list=")) openOnboarding("first");
  window.addEventListener("hashchange", importSharedList);

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").then(syncForReminders).catch(() => {});
  }
}

