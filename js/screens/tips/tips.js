"use strict";
/* Storage tips page. */
let tipsPlace = "All";
function openTips() {
  tipsPlace = "All";
  $("#tpSearch").value = "";
  renderTips();
  $("#tipsPage").showModal();
}
function renderTips() {
  const places = ["All", "Fridge", "Freezer", "Pantry", "Counter"];
  $("#tpPlaces").innerHTML = places.map(p => `<button class="chip ${p === tipsPlace ? "on" : ""}" aria-pressed="${p === tipsPlace}" data-tp="${p}">${esc(t(p))}</button>`).join("");
  const q = norm($("#tpSearch").value).trim();
  const mine = new Set(items.map(i => canon(i.name)).filter(Boolean));
  const list = STORAGE_TIPS.filter(([k, place, en, es]) => (tipsPlace === "All" || place === tipsPlace)
    && (!q || norm(k + " " + (ING_ES[k] || "") + " " + (LANG === "es" ? es : en)).includes(q)));
  const has = k => { const c = canon(k); return c && [...mine].some(m => related(m, c)); };
  list.sort((a, b) => (has(b[0]) ? 1 : 0) - (has(a[0]) ? 1 : 0));
  const placeTip = tipsPlace !== "All" && PLACE_TIPS[tipsPlace]
    ? `<div class="tip pal-tip"><strong>${esc(t(tipsPlace))}</strong><p>${esc(LANG === "es" ? PLACE_TIPS[tipsPlace][1] : PLACE_TIPS[tipsPlace][0])}</p></div>` : "";
  $("#tpList").innerHTML = placeTip + (list.map(([k, place, en, es]) => {
    const name = LANG === "es" ? (ING_ES[k] || k) : k;
    return `<div class="tip-card ${has(k) ? "mine" : ""}">
      ${foodArt(k, null, "food-emoji")}
      <div class="grow"><strong>${esc(name.charAt(0).toUpperCase() + name.slice(1))}</strong>${has(k) ? ` <span class="mini-tag">${esc(t("you have this"))}</span>` : ""}
      <p class="small">${esc(LANG === "es" ? es : en)}</p><span class="muted small">${esc(t("Best in: {place}", { place: t(place) }))}</span></div></div>`;
  }).join("") || `<p class="empty">${esc(t("No tips match that. Try another food."))}</p>`);
}
