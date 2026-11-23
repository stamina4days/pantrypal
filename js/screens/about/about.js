"use strict";
/* About page. */
const APP_VERSION = "11.19";
function openAbout() {
  const cuisines = new Set(RECIPES.map(r => r.cuisine));
  $("#abVersion").textContent = t("Version {v}", { v: APP_VERSION });
  $("#abFacts").innerHTML = [
    [t("Recipes"), RECIPES.filter(r => !r.mine).length],
    [t("Your recipes"), RECIPES.filter(r => r.mine).length],
    [t("Cuisines"), cuisines.size],
    [t("Storage tips"), STORAGE_TIPS.length],
    [t("Badges to earn"), BADGES.filter(b => !b.shop).length],
    [t("Languages"), "English (more coming soon)"]
  ].map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(String(v))}</dd></div>`).join("");
  $("#aboutPage").showModal();
}
function openTerms() {
  if (!$("#termsPage").open) $("#termsPage").showModal();
}
