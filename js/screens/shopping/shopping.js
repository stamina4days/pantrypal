"use strict";
/* Shopping lists. */
/* ---------- SHOPPING ---------- */
function renderShopping() {
  const list = currentList();
  if (list) settings.activeList = list.id;
  $("#listSelect").innerHTML = shopping.map(l =>
    `<option value="${l.id}" ${list && l.id === list.id ? "selected" : ""}>${esc(l.name)} (${l.items.filter(x => !x.done).length})</option>`).join("");
  const hasList = !!list;
  ["#listSelect", "#listMenuBtn", "#shareListBtn", "#shopAddForm"].forEach(s => $(s).classList.toggle("hidden", !hasList));
  const empty = $("#emptyShop");
  if (!hasList) {
    $("#shopItems").innerHTML = "";
    $("#shopActions").classList.add("hidden");
    $("#shopEstimate").textContent = ""; $("#shopSuggest").innerHTML = "";
    empty.innerHTML = palBubble("wink", t("No lists yet. Tap + New to start one, or add stuff straight from any recipe."), [], "pal-big");
    empty.classList.remove("hidden");
    return;
  }
  const rowHtml = x => `
    <li class="shop-item ${x.done ? "done" : ""}">
      <label><input type="checkbox" data-toggle="${x.id}" ${x.done ? "checked" : ""}>
        ${foodArt(x.name, null, "food-emoji")}<span class="shop-name">${esc(x.name)}<span class="muted small">${[x.amt, x.from.length ? t("for {what}", { what: x.from.join(", ") }) : ""].filter(Boolean).map(esc).join(" &middot; ")}</span></span>
      </label>
      <button class="row-btn" data-del="${x.id}" aria-label="${esc(t("Remove {name}", { name: x.name }))}">&times;</button>
    </li>`;
  const open = list.items.filter(x => !x.done), done = list.items.filter(x => x.done);
  let html = "";
  if (settings.groupAisles !== false) {
    const groups = {};
    open.forEach(x => { const a = aisleOf(x.name); (groups[a] = groups[a] || []).push(x); });
    AISLE_ORDER.forEach(a => { if (groups[a]) html += `<li class="aisle-head">${esc(t(AISLE_LABEL[a]))}</li>` + groups[a].map(rowHtml).join(""); });
  } else html += open.map(rowHtml).join("");
  if (done.length) html += `<li class="aisle-head">${esc(t("In the cart"))}</li>` + done.map(rowHtml).join("");
  $("#shopItems").innerHTML = html;
  $("#shopSuggest").innerHTML = restockHtml(list);
  const est = listEstimate(list);
  $("#shopEstimate").textContent = open.length ? t("Estimated total: about {total}", { total: fmtMoney(est.total) }) + (est.unknown ? " " + tn(est.unknown, "(1 item without a price)", "({n} items without a price)") : "") : "";
  const nDone = list.items.filter(x => x.done).length;
  $("#shopActions").classList.toggle("hidden", !nDone);
  $("#moveToFoodLabel").textContent = tn(nDone, "I bought this one", "I bought these {n}");
  empty.innerHTML = palBubble("happy", t("This list is empty. Add something above or from any recipe."), [], "pal-big");
  empty.classList.toggle("hidden", list.items.length > 0);
}
async function newList() {
  const name = await Ask.prompt({ title: t("Start a new list"), label: t("Name it"), value: "", chips: [t("Groceries"), t("This week's meals"), t("Party")], yes: t("Make the list") });
  if (name === null) return;
  const list = { id: uid(), name: name.trim() || t("Shopping list"), items: [] };
  shopping.push(list);
  settings.activeList = list.id;
  saveShopping(); saveSettings(); renderShopping();
}
async function listMenu() {
  const list = currentList(); if (!list) return;
  const name = await Ask.prompt({ title: t("Rename this list"), label: t("Name"), value: list.name, yes: t("Save"), extra: t("Delete this list") });
  if (name === null) return;
  if (name !== Ask.EXTRA && name) list.name = name;
  else if (name === Ask.EXTRA && await Ask.confirm({ title: t("Delete this list?"), text: t("Delete \"{name}\" and its {n} items?", { name: list.name, n: list.items.length }), yes: t("Delete"), danger: true })) {
    shopping = shopping.filter(l => l.id !== list.id);
    settings.activeList = shopping[0] ? shopping[0].id : null;
  }
  saveShopping(); saveSettings(); renderShopping();
}
function moveCheckedToFood() {
  const list = currentList(); if (!list) return;
  const done = list.items.filter(x => x.done);
  const snap = snapshot();
  done.forEach(x => {
    // "2 lb" on the list becomes the amount in My Food
    const parsed = x.amt ? parseQuick(x.amt + " " + x.name)[0] : null;
    const loc = guessLoc(x.name), est = estimateShelf(x.name, loc);
    items.push({ id: uid(), added: todayStr(), name: x.name, amount: parsed && parsed.amount != null ? parsed.amount : null,
      unit: parsed ? parsed.unit : "", location: loc,
      bought: todayStr(), expires: est ? addDaysFrom(todayStr(), est.days) : "", notes: "", barcode: "", staple: isStaple(x.name) });
  });
  if (done.length) { sfx("ding"); buzz([10, 40, 10]); }
  list.items = list.items.filter(x => !x.done);
  saveItems(); saveShopping();
  renderAll();
  toast(tn(done.length, "Put 1 thing away in My Food. Tap it to change the date.", "Put {n} things away in My Food. Tap any to change its date."), snap);
}
async function shareList() {
  const list = currentList(); if (!list) return;
  const open = list.items.filter(x => !x.done);
  const payload = { n: list.name, i: open.map(x => [x.name, x.amt]) };
  const url = location.href.split("#")[0] + "#list=" + encodeURIComponent(JSON.stringify(payload));
  const text = `${list.name}\n${open.map(x => "- " + [x.amt, x.name].filter(Boolean).join(" ")).join("\n")}\n\n${t("Open it in Pantry Pal:")} ${url}`;
  try {
    if (navigator.share) { await navigator.share({ title: list.name, text }); return; }
    await navigator.clipboard.writeText(text);
    toast(t("List copied. Paste it into a text or email."));
  } catch (e) {
    if (e && e.name === "AbortError") return;
    Ask.copy({ title: t("Copy this list:"), value: text });
  }
}
async function importSharedList() {
  const h = location.hash;
  if (!h.startsWith("#list=")) return;
  try {
    const data = JSON.parse(decodeURIComponent(h.slice(6)));
    const itemsIn = Array.isArray(data.i) ? data.i : [];
    history_replace();
    if (await Ask.confirm({ title: t("Someone sent you a list"), text: t("Add the shared list \"{name}\" with {n} items?", { name: data.n || t("Shopping list"), n: itemsIn.length }), yes: t("Add it") })) {
      const list = { id: uid(), name: String(data.n || t("Shopping list")).slice(0, 80), items: [] };
      itemsIn.forEach(([name, amt]) => { if (name) addToList(list, String(name).slice(0, 120), String(amt || "").slice(0, 60), ""); });
      shopping.push(list);
      settings.activeList = list.id;
      saveShopping(); saveSettings();
      showTab("shopping");
    }
  } catch (e) {}
  history_replace();
}
function history_replace() { try { window.history.replaceState(window.history.state, "", location.pathname + location.search + "#/shopping"); } catch (e) {} }
