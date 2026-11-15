"use strict";
/* One shelf at a time: everything in the fridge, the freezer, the pantry, or on the counter. */
let placePageName = null;

const placeArt = loc => {
  const k = (DEFAULT_LOCATIONS.find(l => l === loc) || "").toLowerCase();
  return "img/places/" + (k || "other") + ".svg";
};

function openPlace(loc) {
  if (!loc) return false;
  placePageName = loc;
  renderPlace();
  $("#placePage").showModal();
}

function renderPlace() {
  const loc = placePageName;
  if (!loc) return;
  const here = items.filter(i => i.location === loc)
    .sort((a, b) => daySort(daysLeft(a.expires)) - daySort(daysLeft(b.expires)) || a.name.localeCompare(b.name));
  const days = here.map(i => daysLeft(i.expires));
  const expired = days.filter(d => d !== null && d < 0).length;
  const week = days.filter(d => d !== null && d >= 0 && d <= 7).length;
  $("#plArt").src = placeArt(loc);
  $("#plName").textContent = locLabel(loc);
  $("#plMeta").textContent = tn(here.length, "1 thing", "{n} things");
  $("#plStats").innerHTML = [
    `<span class="stat-chip"><strong>${here.length}</strong> ${esc(t("in here"))}</span>`,
    `<span class="stat-chip soon"><strong>${week}</strong> ${esc(t("use this week"))}</span>`,
    expired ? `<span class="stat-chip expired"><strong>${expired}</strong> ${esc(t("past date"))}</span>` : ""
  ].join("");
  const tip = PLACE_TIPS[loc];
  $("#plTip").innerHTML = tip ? `<div class="tip pal-tip"><strong>${esc(t("Pal's tip"))}</strong><p>${esc(LANG === "es" ? tip[1] : tip[0])}</p></div>` : "";
  $("#plList").innerHTML = here.map(foodMiniHtml).join("");
  $("#plEmpty").classList.toggle("hidden", here.length > 0);
  $("#plCheck").classList.toggle("hidden", !here.length);
}

/* "All still good": mark everything here as checked today. */
function checkPlace() {
  const snap = snapshot();
  items.filter(i => i.location === placePageName).forEach(i => { i.verified = todayStr(); });
  saveItems();
  toast(t("Thanks! Marked everything in {place} as checked.", { place: locLabel(placePageName) }), snap);
  renderAll();
}
