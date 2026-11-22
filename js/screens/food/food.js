"use strict";
/* My Food. */
/* ---------- MY FOOD ---------- */
let locFilter = "All";
let editingId = null;

function allLocations() {
  const set = new Set(DEFAULT_LOCATIONS);
  items.forEach(i => i.location && set.add(i.location));
  return [...set];
}
function renderAlerts() {
  const expired = items.filter(i => { const d = daysLeft(i.expires); return d !== null && d < 0; }).length;
  const soon = items.filter(i => { const d = daysLeft(i.expires); return d !== null && d >= 0 && d <= 3; }).length;
  let html = "";
  if (soon) html += `<div class="alert urgent"><span><svg class="ic" aria-hidden="true"><use href="img/icons/ui/alarm.svg#i"/></svg> ${esc(tn(soon, "1 item expires within 3 days", "{n} items expire within 3 days"))}</span><button data-go="recipes">${esc(t("Use them"))}</button></div>`;
  if (expired) html += `<div class="alert expired"><span>${esc(tn(expired, "1 item is past its date and left out of recipe picks.", "{n} items are past their date and left out of recipe picks."))}</span><button data-toss="1">${esc(t("Toss"))}</button></div>`;
  $("#alerts").innerHTML = palTodayHtml() + checkinHtml();
}
function renderPantry() {
  renderAlerts();
  const locs = allLocations();
  if (locFilter !== "All" && !locs.includes(locFilter)) locFilter = "All";
  $("#locFilter").innerHTML = ["All", ...locs].map(l => {
    const n = l === "All" ? items.length : items.filter(i => i.location === l).length;
    return `<button class="chip ${l === locFilter ? "on" : ""}" aria-pressed="${l === locFilter}" data-loc="${esc(l)}">${esc(l === "All" ? t("All") : locLabel(l))} <small>${n}</small></button>`;
  }).join("");

  const q = norm($("#pantrySearch").value).trim();
  const list = items
    .filter(i => (locFilter === "All" || i.location === locFilter) && (!q || norm(i.name).includes(q)))
    .sort((a, b) => daySort(daysLeft(a.expires)) - daySort(daysLeft(b.expires)) || a.name.localeCompare(b.name));

  const rowHtml = i => {
    const lab = expiryLabel(daysLeft(i.expires));
    const sub = [locFilter === "All" ? locLabel(i.location) : "", amountText(i), i.opened ? friendlyOpened(i.opened) : ""].filter(Boolean).join(", ");
    const tags = (i.staple ? `<span class="mini-tag">${esc(t("staple"))}</span>` : "") + (i.leftover ? `<span class="mini-tag">${esc(t("leftovers"))}</span>` : "");
    const frozen = locIndex(i.location) === 2;
    return `<li class="item swipe-row ${lab.cls}" data-id="${i.id}">
      <button type="button" class="swipe-btn freeze" data-swipe="freeze" data-id="${i.id}" tabindex="-1">${frozen ? `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/sun.svg#i"/></svg>${esc(t("Thaw"))}` : `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/snow.svg#i"/></svg>${esc(t("Freeze"))}`}</button>
      <span class="swipe-right-btns"><button type="button" class="swipe-btn used" data-swipe="used" data-id="${i.id}" tabindex="-1"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/check.svg#i"/></svg>${esc(t("Used it"))}</button><button type="button" class="swipe-btn tossed" data-swipe="tossed" data-id="${i.id}" tabindex="-1"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/trash.svg#i"/></svg>${esc(t("Tossed"))}</button></span>
      <div class="row-face" role="button" tabindex="0" aria-label="${esc(i.name + ", " + friendlyWhen(i.expires))}">
        ${foodArt(i.name, i, "food-emoji")}
        <span class="fr-main"><strong>${esc(i.name)}</strong>${tags}<span class="fr-sub">${esc(sub)}</span></span>
        <span class="fr-when ${lab.cls}">${esc(friendlyWhen(i.expires))}</span>
      </div></li>`;
  };
  const soon = list.filter(i => { const d = daysLeft(i.expires); return d !== null && d <= 3; });
  const later = list.filter(i => !soon.includes(i));
  const group = (title, cls, rows, hint) => rows.length ? `<li class="food-group ${cls}"><div class="fg-head"><h2>${esc(title)}</h2>${hint ? `<span>${esc(hint)}</span>` : ""}</div><ul class="food-card">${rows.map(rowHtml).join("")}</ul></li>` : "";
  const hint = settings.swipeLearned ? "" : t("Swipe a food for quick actions");
  $("#itemList").innerHTML = group(t("Eat soon"), "soon", soon, hint) + group(soon.length ? t("Good for now") : t("All good"), "later", later, soon.length ? "" : hint);
  if (q && !list.length) $("#itemList").innerHTML = `<li class="muted center small">${esc(t("Nothing called that. Try another word."))}</li>`;
  $("#emptyPantry").classList.add("hidden");
  document.body.classList.toggle("few-items", items.length <= 6 && !$("#pantrySearch").value);
}

function fillDatalists() {
  const names = new Set([...Object.keys(SHELF_LIFE).filter(k => k.length > 3), ...items.map(i => i.name)]);
  $("#nameSuggestions").innerHTML = [...names].sort().map(n => `<option value="${esc(n)}">`).join("");
  $("#locations").innerHTML = allLocations().map(l => `<option value="${esc(locLabel(l))}">`).join("");
  const units = ["eggs", "lbs", "oz", "cups", "cans", "bags", "boxes", "bottles", "pieces", "slices", "bunches", "gallons", "packs", "servings"];
  $("#units").innerHTML = units.map(u => `<option value="${u}">`).join("");
}
