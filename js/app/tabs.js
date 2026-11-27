"use strict";
/* Switching between the five tabs, and renderAll(), which redraws every tab after the data changes. */
function showTab(name) {
  if (typeof setPageTitle === "function") setPageTitle(name);
  $$(".tab").forEach(tb => tb.classList.toggle("active", tb.id === "tab-" + name));
  $$(".tabbar button").forEach(b => {
    const on = b.dataset.tab === name || (name === "stats" && b.dataset.tab === "today");
    b.classList.toggle("active", on);
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  if (name === "recipes") { recipeLimit = PAGE_SIZE; renderRecipes(); }
  if (name === "plan") { renderPlan(); if (typeof Motion !== "undefined") Motion.planShown(); }
  if (name === "shopping") renderShopping();
  if (name === "stats") { renderStats(); if (typeof renderStatsExtras === "function") renderStatsExtras(); }
  if (name === "today") renderToday();
  window.scrollTo(0, 0);
  if (typeof Router !== "undefined") Router.tabChanged();
}
function renderAll() {
  if (typeof renderHints === "function") renderHints();
  renderPantry();
  if (typeof renderToday === "function") renderToday();
  if (typeof renderGift === "function") renderGift();
  if ($("#tab-recipes").classList.contains("active")) renderRecipes();
  if ($("#tab-plan").classList.contains("active")) renderPlan();
  if ($("#tab-shopping").classList.contains("active")) renderShopping();
  if ($("#tab-stats").classList.contains("active")) renderStats();
  if (typeof renderPageExtras === "function") renderPageExtras();
  if (typeof checkNewBadges === "function") setTimeout(checkNewBadges, 500);
}
