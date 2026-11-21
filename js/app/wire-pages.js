"use strict";
/* Buttons on the newer pages, and keeping open pages up to date. */

/* Called by renderAll, so anything open stays current after you change something. */
function renderPageExtras() {
  const slot = $("#installSlot"); if (slot) slot.innerHTML = installNudgeHtml();
  renderKitchenName();
  renderSpecial();
  renderPlaceTiles();
  renderCollectionStrip();
  if ($("#tab-stats").classList.contains("active")) renderStatsExtras();
  if ($("#itemPage").open) renderItemPage();
  if ($("#placePage").open) renderPlace();
  if ($("#collectionPage").open) renderCollection();
  if ($("#weekPage").open) renderWeek();
  if ($("#badgesPage").open) renderBadges();
}

function pagesInit() {
  $("#ipActions").addEventListener("click", e => { const b = e.target.closest("[data-ip]"); if (b) itemPageAction(b.dataset.ip); });
  $("#ipAllRecipes").addEventListener("click", () => {
    focusItemId = itemPageId; recipeMode = "foryou";
    setPressed("#recipeMode", $('#recipeMode [data-mode="foryou"]'));
    $("#itemPage").close();
    showTab("recipes");
  });

  $("#plAdd").addEventListener("click", () => { openItem(null, { location: placePageName }); });
  $("#plCheck").addEventListener("click", checkPlace);

  segment("#colSort", "sort", v => { collectionSort = v; collectionLimit = 30; renderCollection(); });
  $("#colMore").addEventListener("click", () => { collectionLimit += 30; renderCollection(); });

  $("#weekBtn").addEventListener("click", openWeek);
  $("#wkDays").addEventListener("click", weekClick);
  $("#wkPlan").addEventListener("click", () => { $("#weekPage").close(); openPlanner(); });

  $("#tpSearch").addEventListener("input", renderTips);
  $("#tpPlaces").addEventListener("click", e => { const b = e.target.closest("[data-tp]"); if (b) { tipsPlace = b.dataset.tp; renderTips(); } });

  $("#settingsBtn").addEventListener("click", () => {
    $("#soundsToggle").checked = settings.sounds !== false;
    $("#outfitsToggle").checked = settings.palOutfits !== false;
  });
  $("#soundsToggle").addEventListener("change", e => { settings.sounds = e.target.checked; saveSettings(); if (e.target.checked) sfx("ding"); });
  $("#outfitsToggle").addEventListener("change", e => { settings.palOutfits = e.target.checked; saveSettings(); renderAll(); });
  palLifeInit();
  talkInit();
  homeScreenInit();
  kitchenShareInit();
  $("#recipeNoteText").addEventListener("input", saveRecipeNote);
  $("#recipeFavBy").addEventListener("input", saveRecipeNote);
  $("#userNameInput").addEventListener("change", e => { settings.userName = e.target.value.trim(); saveSettings(); renderKitchenName(); renderAll(); });
  $("#bigAddBtn").addEventListener("click", () => openItem());
  $("#viewToggle").addEventListener("click", () => setView(settings.view === "full" ? "simple" : "full"));
  $("#viewSimple").addEventListener("change", e => setView(e.target.checked ? "simple" : "full"));
  $("#aboutBtn").addEventListener("click", () => { $("#settingsDialog").close(); openAbout(); });

  // Stats tab redraws its extras whenever you switch to it.
  $("#tabbtn-stats").addEventListener("click", renderStatsExtras);
  segment("#statsRange", "range", () => renderStatsExtras());
}

/* Each page takes the color of the part of the app it belongs to. */
function onScreenOpen(d) {
  document.body.dataset.screen = d.dataset.accent || "";
}

/* Runs once the opening screen slides away. */
function afterSplash() {
  importKitchenLink();
  updateStreak();
  checkNewBadges();
}
