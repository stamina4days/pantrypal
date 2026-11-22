"use strict";
/* One food, up close. Opens when you tap something on My Food. */
let itemPageId = null;

function openItemPage(id) {
  if (!items.some(i => i.id === id)) return false;
  itemPageId = id;
  renderItemPage();
  $("#itemPage").showModal();
}

function palLineFor(i) {
  const d = daysLeft(i.expires);
  if (i.leftover) return ["hungry", t("Leftovers! Warm me up for lunch, or turn me into something new.")];
  if (d === null) return ["wink", t("No date on me. Add one and I'll keep an eye on it for you.")];
  if (d < 0) return ["worried", t("I'm past my date. Look, sniff, and taste a little before you toss me. Lots of food is still fine.")];
  if (d <= 1) return ["hungry", t("Cook me today or tomorrow! Or pop me in the freezer to buy some time.")];
  if (d <= 3) return ["hungry", t("I've got {n} days left. Perfect time for one of the recipes below.", { n: d })];
  if (d <= 7) return ["happy", t("Still fresh. Plan me into a meal this week.")];
  return ["proud", t("I'm good for a while. Relax!")];
}

function freshnessHtml(i) {
  const d = daysLeft(i.expires);
  if (d === null) return "";
  const start = i.bought || i.added;
  const total = start ? Math.max(1, daysBetween(start, i.expires)) : Math.max(d, 1);
  const pct = Math.max(0, Math.min(100, Math.round(d / total * 100)));
  const lab = expiryLabel(d);
  return `<div class="fresh-card ${lab.cls}">
    <div class="fresh-top"><strong>${esc(d < 0 ? lab.text : t("{n} of {m} days left", { n: d, m: total }))}</strong><span>${esc(t("Use by {date}", { date: prettyDate(i.expires) }))}</span></div>
    <div class="fresh-bar" role="img" aria-label="${esc(t("{p} percent of its time left", { p: pct }))}"><span style="width:${pct}%"></span></div>
  </div>`;
}

function shelfRowHtml(i) {
  const here = locIndex(i.location);
  const places = [["Fridge", 0], ["Pantry", 1], ["Freezer", 2]];
  return places.map(([loc, idx]) => {
    const est = estimateShelf(i.name, loc);
    const days = est && !(est.note && idx !== 2) ? est.days : null;
    const txt = days == null ? t("not ideal") : days >= 365 ? tn(Math.round(days / 365), "about 1 year", "about {n} years")
      : days >= 60 ? tn(Math.round(days / 30), "about 1 month", "about {n} months") : tn(days, "1 day", "{n} days");
    return `<div class="shelf-cell ${idx === here ? "here" : ""} ${days == null ? "nope" : ""}">
      <img src="img/places/${loc.toLowerCase()}.svg" width="44" height="44" alt="">
      <strong>${esc(t(loc))}</strong><span class="small">${esc(txt)}</span>${idx === here ? `<span class="here-tag">${esc(t("It's here"))}</span>` : ""}</div>`;
  }).join("");
}

function tipFor(name, loc) {
  const key = canon(name);
  const hit = key && STORAGE_TIPS.find(([k]) => { const c = canon(k); return c && related(c, key); });
  if (hit) return { text: LANG === "es" ? hit[3] : hit[2], place: hit[1] };
  const p = PLACE_TIPS[DEFAULT_LOCATIONS.find(l => l === loc) || "Fridge"];
  return p ? { text: LANG === "es" ? p[1] : p[0], place: null } : null;
}

function renderItemPage() {
  const i = items.find(x => x.id === itemPageId);
  if (!i) { if ($("#itemPage").open) $("#itemPage").close(); return; }
  $("#ipEmoji").innerHTML = foodArt(i.name, i, "hero-art-img");
  $("#ipName").textContent = i.name;
  $("#ipMeta").textContent = [amountText(i), locLabel(i.location), i.staple ? t("staple") : "", i.leftover ? t("leftovers") : ""].filter(Boolean).join(", ");
  $("#ipFresh").innerHTML = freshnessHtml(i);
  const [mood, line] = palLineFor(i);
  $("#ipPal").innerHTML = palBubble(mood, line);

  const frozen = locIndex(i.location) === 2;
  $("#ipActions").innerHTML = [
    `<button data-ip="edit"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/pencil.svg#i"/></svg> ${esc(t("Edit"))}</button>`,
    canOpen(i) ? `<button data-ip="open"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/jar.svg#i"/></svg> ${esc(t("I opened it"))}</button>` : "",
    hasAmount(i) ? `<button data-ip="one"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/minus.svg#i"/></svg> ${esc(t("Use one"))}</button>` : "",
    `<button data-ip="freeze"><span aria-hidden="true">${frozen ? `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/sun.svg#i"/></svg>` : `<svg class="ic" aria-hidden="true"><use href="img/icons/ui/snow.svg#i"/></svg>`}</span> ${esc(frozen ? t("Thaw it") : t("Freeze it"))}</button>`,
    `<button data-ip="list"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/cart.svg#i"/></svg> ${esc(t("Add to list"))}</button>`,
    `<button data-ip="done" class="primary"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/check.svg#i"/></svg> ${esc(t("Used it or tossed it"))}</button>`
  ].join("");

  const recs = recipesUsing(i.name, 5);
  $("#ipRecipes").innerHTML = recs.map(x => recipeMiniHtml(x.recipe,
    x.missing.length ? tn(x.missing.length, "need 1 thing", "need {n} things") : t("you have everything"))).join("")
    || `<li class="muted small">${esc(t("No recipes use this yet. Try searching Recipes for something similar."))}</li>`;
  $("#ipAllRecipes").classList.toggle("hidden", !recs.length);

  $("#ipShelf").innerHTML = shelfRowHtml(i);
  const tip = tipFor(i.name, i.location);
  $("#ipTip").innerHTML = tip ? `<div class="tip pal-tip"><strong>${esc(t("Benji's tip"))}</strong><p>${esc(tip.text)}</p><a href="#/tips" class="small">${esc(t("More storage tips"))}</a></div>` : "";
  $("#ipRemix").innerHTML = i.leftover ? remixHtml(i) : "";

  const facts = [
    [t("Bought"), i.bought ? prettyDate(i.bought) : ""],
    [t("Expires"), i.expires ? prettyDate(i.expires) : t("No date")],
    [t("Opened"), i.opened ? prettyDate(i.opened) : ""],
    [t("Where"), locLabel(i.location)],
    [t("Amount"), amountText(i)],
    [t("Last checked"), i.verified ? prettyDate(i.verified) : ""],
    [t("Barcode"), i.barcode || ""],
    [t("Notes"), i.notes || ""]
  ].filter(([, v]) => v);
  $("#ipFacts").innerHTML = facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
}

function itemPageAction(a) {
  const i = items.find(x => x.id === itemPageId);
  if (!i) return;
  if (a === "edit") openItem(i.id);
  if (a === "open") { markOpened(i.id); renderItemPage(); }
  if (a === "one") { useOne(i.id); renderItemPage(); }
  if (a === "freeze") { editingId = i.id; freezeOrThaw(); renderItemPage(); }
  if (a === "list") {
    const list = currentList() || stapleList();
    if (addToList(list, i.name, "", t("from My Food"))) { saveShopping(); toast(t("Added {name} to {list}.", { name: i.name, list: list.name })); }
    else toast(t("{name} is already on {list}.", { name: i.name, list: list.name }));
  }
  if (a === "done") askRemove(i);
}
