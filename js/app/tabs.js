"use strict";
/* Switching tabs. */
/* ---------- wiring ---------- */
function showTab(name) {
  if (typeof setPageTitle === "function") setPageTitle(name);
  $$(".tab").forEach(tb => tb.classList.toggle("active", tb.id === "tab-" + name));
  $$(".tabbar button").forEach(b => {
    const on = b.dataset.tab === name;
    b.classList.toggle("active", on);
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  if (name === "recipes") { recipeLimit = PAGE_SIZE; renderRecipes(); }
  if (name === "plan") renderPlan();
  if (name === "shopping") renderShopping();
  if (name === "stats") renderStats();
  window.scrollTo(0, 0);
  if (typeof Router !== "undefined") Router.tabChanged();
}
function renderAll() {
  if (typeof renderHints === "function") renderHints();
  renderPantry();
  if ($("#tab-recipes").classList.contains("active")) renderRecipes();
  if ($("#tab-plan").classList.contains("active")) renderPlan();
  if ($("#tab-shopping").classList.contains("active")) renderShopping();
  if ($("#tab-stats").classList.contains("active")) renderStats();
  if (typeof renderPageExtras === "function") renderPageExtras();
  if (typeof checkNewBadges === "function") setTimeout(checkNewBadges, 500);
}
