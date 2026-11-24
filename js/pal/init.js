"use strict";
/* The buttons inside Benji's speech bubbles. Each one carries a data-pal action, and this one listener
   handles them all, so a new bubble only needs the right data-pal value. */
function buddyInit() {
  document.addEventListener("click", e => {
    if (e.target.closest("[data-go-hats]") && !e.target.closest("#badgesPage")) { $$("dialog[open]").forEach(d => d.close()); openHats(); return; }
    const b = e.target.closest("[data-pal]");
    if (!b) return;
    const a = b.dataset.pal;
    if (a === "audit") openAudit();
    if (a === "sample") loadSample();
    if (a === "clear-sample") clearSample();
    if (a === "plan") { showTab("plan"); openPlanner(); }
    if (a === "quick") { showTab("recipes"); $("#quickBtn").click(); }
    if (a === "use") { focusItemId = b.dataset.id; recipeMode = "foryou"; setPressed("#recipeMode", $('#recipeMode [data-mode="foryou"]')); showTab("recipes"); }
    if (a === "freeze") { editingId = b.dataset.id; freezeOrThaw(); }
  });
  setPageTitle("today");
}
