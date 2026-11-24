"use strict";
/* The page title in the header, for each tab. */
const TAB_TITLES = { today: "Today", pantry: "My Food", recipes: "Recipes", plan: "Plan", shopping: "Shopping", stats: "Waste Less" };
function setPageTitle(name) {
  document.body.dataset.tab = name;
  $("#pageTitle").textContent = name === "today" && typeof greeting === "function" ? greeting() : t(TAB_TITLES[name] || "My Food");
}
