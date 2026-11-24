"use strict";
/* Buttons that live on many pages at once (tips, feedback, the tour, and the like), handled with one click listener on the whole document. */
function extrasInit() {
  document.addEventListener("click", e => {
    const ok = e.target.closest("[data-hint-ok]");
    if (ok) { settings.hints = settings.hints || {}; settings.hints[ok.dataset.hintOk] = true; saveSettings(); renderHints(); }
    if (e.target.closest("[data-feedback]")) sendFeedback();
    if (e.target.id === "resetHints") { settings.hints = {}; saveSettings(); renderHints(); toast(t("Tips will show again.")); }
  });
  window.addEventListener("afterprint", () => { document.body.classList.remove("printing"); $("#printArea").innerHTML = ""; });
  $("#helpBtn").addEventListener("click", openHelp);
  $("#helpSettingsBtn").addEventListener("click", () => { $("#settingsDialog").close(); openHelp(); });
  $("#closeHelp").addEventListener("click", () => $("#helpDialog").close());
  $("#diagBtn").addEventListener("click", () => { $("#settingsDialog").close(); runDiagnostics(); });
  $("#closeDiag").addEventListener("click", () => $("#diagDialog").close());
  $("#planPrintBtn").addEventListener("click", printPlan);
  $("#planCalBtn").addEventListener("click", exportPlanCalendar);
  $("#kidBtn").addEventListener("click", () => { settings.kidFilter = !settings.kidFilter; saveSettings(); $("#kidBtn").classList.toggle("on", settings.kidFilter); $("#kidBtn").setAttribute("aria-pressed", settings.kidFilter); renderRecipes(); });
  $("#kidBtn").classList.toggle("on", !!settings.kidFilter); $("#kidBtn").setAttribute("aria-pressed", !!settings.kidFilter);
  $("#quickBtn").addEventListener("click", () => {
    recipeMode = "foryou"; setPressed("#recipeMode", $('#recipeMode [data-mode="foryou"]'));
    $("#timeFilter").value = "20"; $("#missingFilter").value = items.length ? "1" : "99"; focusItemId = null;
    recipeLimit = PAGE_SIZE; renderRecipes();
    toast(t("Quick picks: 20 minutes or less, missing at most 1 thing."));
  });
  $("#pasteToggle").addEventListener("click", () => { $("#pasteBox").classList.toggle("hidden"); $("#pasteText").focus(); });
  $("#pasteFill").addEventListener("click", () => {
    const r = parseRecipeText($("#pasteText").value);
    if (!r.ing.length && !r.steps.length) { $("#suggestError").textContent = t("Couldn't find ingredients or steps in that text. Try copying the whole recipe, including the Ingredients and Instructions headings."); return; }
    if (r.name) $("#sName").value = r.name;
    if (r.serves) $("#sServes").value = r.serves;
    if (r.time) $("#sTime").value = r.time;
    $("#sIng").value = r.ing.join("\n");
    $("#sSteps").value = r.steps.join("\n");
    $("#pasteBox").classList.add("hidden");
    $("#suggestError").textContent = "";
    toast(tn(r.ing.length, "Found 1 ingredient. Check everything before saving.", "Found {n} ingredients. Check everything before saving."));
  });
}
