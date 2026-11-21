"use strict";
/* Pal's buttons. */
function buddyInit() {
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-pal]");
    if (!b) return;
    const a = b.dataset.pal;
    if (a === "audit") openAudit();
    if (a === "plan") { showTab("plan"); openPlanner(); }
    if (a === "quick") { showTab("recipes"); $("#quickBtn").click(); }
    if (a === "use") { focusItemId = b.dataset.id; recipeMode = "foryou"; setPressed("#recipeMode", $('#recipeMode [data-mode="foryou"]')); showTab("recipes"); }
    if (a === "freeze") { editingId = b.dataset.id; freezeOrThaw(); }
  });
  setPageTitle("today");
}
