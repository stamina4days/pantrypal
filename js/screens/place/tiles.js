"use strict";
/* Shelf tiles at the top of My Food. Each one opens that shelf's page. */
function renderPlaceTiles() {
  const box = $("#placeTiles");
  if (!box) return;
  if (!items.length) { box.innerHTML = ""; return; }
  box.innerHTML = allLocations().map(loc => {
    const here = items.filter(i => i.location === loc);
    if (!here.length && !DEFAULT_LOCATIONS.includes(loc)) return "";
    const urgent = here.filter(i => { const d = daysLeft(i.expires); return d !== null && d <= 3; }).length;
    return `<a class="place-tile ${urgent ? "has-urgent" : ""}" href="#/place/${encodeURIComponent(loc)}">
      <img src="${placeArt(loc)}" width="48" height="48" alt="">
      <span class="pt-name">${esc(locLabel(loc))}</span>
      <span class="pt-count">${esc(tn(here.length, "1 item", "{n} items"))}</span>
      ${urgent ? `<span class="pt-flag">${esc(tn(urgent, "1 soon", "{n} soon"))}</span>` : ""}</a>`;
  }).join("");
}
