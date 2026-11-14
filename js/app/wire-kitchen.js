"use strict";
/* Kitchen buttons. */
/* ---------- wiring ---------- */
function kitchenInit() {
  // Setup
  $("#obNext").addEventListener("click", obNext);
  $("#obBack").addEventListener("click", () => { obRead(); ob.step--; renderOnboarding(); });
  $("#obSkip").addEventListener("click", () => { settings.onboarded = true; saveSettings(); $("#onboardDialog").close(); });
  $("#obBody").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.lang) { settings.lang = b.dataset.lang; saveSettings(); applyLang(); renderOnboarding(); }
    if (b.dataset.people) { obRead(); ob.data.people = Math.max(1, Math.min(12, ob.data.people + Number(b.dataset.people))); renderOnboarding(); }
    if (b.dataset.cuisine) { obRead(); const c = b.dataset.cuisine; ob.data.cuisines = ob.data.cuisines.includes(c) ? ob.data.cuisines.filter(x => x !== c) : [...ob.data.cuisines, c]; renderOnboarding(); }
    if (b.id === "obAudit") { $("#onboardDialog").close(); openAudit(); }
    if (b.id === "obSkipAudit") { $("#onboardDialog").close(); toast(t("No problem. Browse recipes or make a meal plan any time.")); showTab("recipes"); }
  });
  $("#onboardDialog").addEventListener("close", () => { if (!settings.onboarded) { settings.onboarded = true; saveSettings(); } });

  // Audit
  $("#auditBody").addEventListener("click", e => { const b = e.target.closest("[data-ai]"); if (!b) return; const id = b.dataset.ai; auditSel.has(id) ? auditSel.delete(id) : auditSel.add(id); renderAudit(); });
  $("#auditAddForm").addEventListener("submit", e => { e.preventDefault(); auditExtra.push(...parseQuick($("#auditAdd").value)); $("#auditAdd").value = ""; renderAudit(); });
  $("#auditDone").addEventListener("click", finishAudit);
  $("#auditSkip").addEventListener("click", () => $("#auditDialog").close());
  ["#emptyAuditBtn", "#auditBtn"].forEach(id => $(id).addEventListener("click", () => { if ($("#settingsDialog").open) $("#settingsDialog").close(); openAudit(); }));

  // Planner
  $("#autoPlanBtn").addEventListener("click", openPlanner);
  $("#plannerDialog").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.id === "poGo") { plannerState.opts.start = $("#poStart").value; plannerState.opts.days = Number($("#poDays").value); plannerState.locks.clear(); plannerState.exclude = {}; plannerState.proposal = null; runAndShow(); }
    if (b.id === "poEdit") { $("#plannerDialog").close(); openOnboarding("edit"); }
    if (b.id === "poAgain") runAndShow();
    if (b.id === "poSave") savePlanProposal(false);
    if (b.id === "poSaveShop") savePlanProposal(true);
    if (b.dataset.lock) { const k = b.dataset.lock; plannerState.locks.has(k) ? plannerState.locks.delete(k) : plannerState.locks.add(k); renderProposal(); }
    if (b.dataset.swap) swapSlot(b.dataset.swap);
  });
  $("#closePlanner").addEventListener("click", () => $("#plannerDialog").close());

  // Prep day
  $("#prepBtn").addEventListener("click", openPrep);
  $("#prepDialog").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (b && b.id === "prepClose") $("#prepDialog").close();
    if (b && b.id === "prepBuild") {
      const ids = $$("#prepBody [data-pm]:checked").map(c => c.dataset.pm);
      prepMeals = plan.filter(m => ids.includes(m.id));
      if (prepMeals.length) renderPrepSession(); else toast(t("Pick at least one meal."));
    }
    if (b && b.id === "prepFinish") finishPrep();
    if (b && b.id === "prepPrint") printPrep();
    if (b && b.dataset.cookmode) { const r = recipeByName(b.dataset.cookmode), m = plan.find(x => x.id === b.dataset.meal); if (r) openCookMode(r, m ? m.servings / r.serves : 1, false); }
  });
  $("#prepDialog").addEventListener("change", e => {
    const c = e.target.closest("[data-task]"); if (!c) return;
    const key = $("#prepBody").dataset.key;
    const set = new Set((settings.prepProgress || {})[key] || []);
    c.checked ? set.add(c.dataset.task) : set.delete(c.dataset.task);
    settings.prepProgress = { [key]: [...set] };
    saveSettings();
    c.closest(".task").classList.toggle("done", c.checked);
  });

  // Timers (buttons anywhere)
  document.addEventListener("click", e => {
    const tb = e.target.closest("[data-timer]");
    if (tb) { e.preventDefault(); startTimer(tb.dataset.label || t("Timer"), Number(tb.dataset.timer)); }
    const tx = e.target.closest("[data-timerx]");
    if (tx) { timers = timers.filter(x => x.id !== tx.dataset.timerx); renderTimers(); }
  });

  // Cook mode
  $("#cookModeBtn").addEventListener("click", () => openCookMode(openResult.recipe, curServings / openResult.recipe.serves, true));
  $("#cookPrev").addEventListener("click", () => cookGo(-1));
  $("#cookNext").addEventListener("click", () => cookGo(1));
  $("#cookExit").addEventListener("click", closeCook);
  $("#cookDialog").addEventListener("cancel", closeCook);
  $("#cookRead").addEventListener("click", () => { settings.readAloud = !settings.readAloud; saveSettings(); renderCook(); if (settings.readAloud) speak(rSteps(cook.r)[cook.idx]); else speechSynthesis.cancel(); });
  $("#cookVoice").addEventListener("click", toggleVoice);
  $("#cookIngrBtn").addEventListener("click", () => { const el = $("#cookIngrWrap"); el.classList.toggle("hidden"); $("#cookIngrBtn").setAttribute("aria-expanded", !el.classList.contains("hidden")); });
  document.addEventListener("visibilitychange", () => { if (cook && document.visibilityState === "visible") keepAwake(true); });

  // Ratings and eating prepped meals
  $$(".rate-btn").forEach(b => b.addEventListener("click", () => rate(Number(b.dataset.rate))));
  $("#ateBtn").addEventListener("click", () => { const m = plan.find(x => x.id === openMealId); if (m) ateMeal(m); });

  // Receipts
  $("#receiptBtn").addEventListener("click", () => $("#receiptFile").click());
  $("#receiptFile").addEventListener("change", e => { if (e.target.files[0]) readReceipt(e.target.files[0]); e.target.value = ""; });
  $("#confirmReceipt").addEventListener("click", confirmReceipt);
  $("#cancelReceipt").addEventListener("click", () => $("#receiptDialog").close());

  // Check-ins
  $("#alerts").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.ciDone) { settings.lastCheckin = todayStr(); saveSettings(); renderPantry(); return; }
    if (!b.dataset.ci) return;
    const it = items.find(i => i.id === b.dataset.id); if (!it) return;
    if (b.dataset.ci === "keep") { it.verified = todayStr(); saveItems(); }
    else removeItem(it, b.dataset.ci);
    const s = stapleSuffix();
    if (s) toast(s.trim());
    renderPantry();
  });

  // Restock suggestions
  $("#shopSuggest").addEventListener("click", e => {
    const b = e.target.closest("[data-restock]"); if (!b) return;
    const it = items.find(i => i.id === b.dataset.restock), list = currentList();
    if (it && list) { addToList(list, it.name, "", t("restock")); saveShopping(); renderShopping(); }
  });

  // Settings
  $("#householdBtn").addEventListener("click", () => { $("#settingsDialog").close(); openOnboarding("edit"); });
  $("#settingsBtn").addEventListener("click", () => { $("#groupAisles").checked = settings.groupAisles !== false; $("#checkinsToggle").checked = !!settings.checkins; });
  $("#groupAisles").addEventListener("change", e => { settings.groupAisles = e.target.checked; saveSettings(); renderAll(); });
  $("#checkinsToggle").addEventListener("change", e => { settings.checkins = e.target.checked; saveSettings(); renderAll(); });
}
