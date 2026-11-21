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
  $("#alerts").innerHTML = palFoodHtml() + checkinHtml();
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

  $("#itemList").innerHTML = list.map(i => {
    const lab = expiryLabel(daysLeft(i.expires));
    const meta = [locLabel(i.location), amountText(i), i.opened ? friendlyOpened(i.opened) : friendlyBought(i.bought)]
      .filter(Boolean).map(m => `<span>${esc(m)}</span>`).join("");
    const tags = (i.staple ? `<span class="mini-tag">${esc(t("staple"))}</span>` : "") + (i.leftover ? `<span class="mini-tag">${esc(t("leftovers"))}</span>` : "");
    const minus = hasAmount(i) ? `<button class="row-btn" data-minus="${i.id}" aria-label="${esc(t("Use one {name}", { name: i.name }))}">-1</button>` : "";
    return `<li class="item ${lab.cls}" data-id="${i.id}" role="button" tabindex="0" aria-label="${esc(i.name + ", " + lab.text)}">
      ${foodArt(i.name, i, "food-emoji")}
      <div class="item-main"><strong>${esc(i.name)} ${tags}</strong><span class="meta">${meta}</span></div>
      <span class="badge ${lab.cls}">${esc(friendlyWhen(i.expires))}</span>${minus}</li>`;
  }).join("");
  $("#emptyPantry").classList.add("hidden");
  document.body.classList.toggle("few-items", items.length <= 6 && !$("#pantrySearch").value);
}

function fillDatalists() {
  const names = LANG === "es"
    ? new Set([...Object.values(ING_ES), ...items.map(i => i.name)])
    : new Set([...Object.keys(SHELF_LIFE).filter(k => k.length > 3), ...items.map(i => i.name)]);
  $("#nameSuggestions").innerHTML = [...names].sort().map(n => `<option value="${esc(n)}">`).join("");
  $("#locations").innerHTML = allLocations().map(l => `<option value="${esc(locLabel(l))}">`).join("");
  const units = LANG === "es"
    ? ["huevos", "lb", "oz", "kg", "tazas", "latas", "bolsas", "cajas", "botellas", "piezas", "rebanadas", "manojos", "galones", "paquetes", "porciones"]
    : ["eggs", "lbs", "oz", "cups", "cans", "bags", "boxes", "bottles", "pieces", "slices", "bunches", "gallons", "packs", "servings"];
  $("#units").innerHTML = units.map(u => `<option value="${u}">`).join("");
}
