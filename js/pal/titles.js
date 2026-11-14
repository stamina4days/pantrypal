"use strict";
/* Page titles. */
/* ---------- page title in the header ---------- */
const TAB_TITLES = { pantry: "My Food", recipes: "Recipes", plan: "Plan", shopping: "Shopping", stats: "Waste Less" };
function setPageTitle(name) {
  document.body.dataset.tab = name;
  $("#pageTitle").textContent = t(TAB_TITLES[name] || "My Food");
}
