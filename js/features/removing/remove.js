"use strict";
/* Using up and tossing food. */
/* ---------- removing food (feeds Waste Less and staples) ---------- */
let stapleNotes = [];
function removeItem(item, outcome) {
  if (typeof foodMoment === "function") foodMoment(item, outcome, daysLeft(item.expires));
  items = items.filter(i => i.id !== item.id);
  if (outcome === "used" && item.bought && !item.leftover) learnUsage(item);
  if (outcome === "used") { settings.lastWin = Date.now(); saveSettings(); }
  if (outcome === "used" || outcome === "wasted") {
    if (!item.leftover) history.push({ name: item.name, date: todayStr(), outcome, d: daysLeft(item.expires), v: foodValue(item) });
    saveHistory();
    if (item.staple) {
      const list = stapleList();
      if (addToList(list, item.name, "", t("restock"))) stapleNotes.push({ name: item.name, list: list.name });
      saveShopping();
    }
  }
  saveItems();
}
function stapleSuffix() {
  if (!stapleNotes.length) return "";
  const s = " " + t("Added {items} to {list}.", { items: stapleNotes.map(x => x.name).join(", "), list: stapleNotes[0].list });
  stapleNotes = [];
  return s;
}

let pendingRemove = null;
function askRemove(item) {
  pendingRemove = item;
  $("#removeTitle").textContent = t("What happened to {name}?", { name: item.name });
  $("#removeDialog").showModal();
}
function finishRemove(outcome) {
  $("#removeDialog").close();
  if (!pendingRemove || outcome === "cancel") { pendingRemove = null; return; }
  const snap = snapshot(), it = pendingRemove;
  removeItem(it, outcome === "none" ? null : outcome);
  toast((outcome === "wasted" ? t("Logged {name} as tossed.", { name: it.name }) : t("Removed {name}.", { name: it.name })) + stapleSuffix(), snap);
  pendingRemove = null;
  renderAll();
}
function useOne(id) {
  const it = items.find(i => i.id === id);
  if (!it || !hasAmount(it)) return;
  const snap = snapshot();
  it.amount = Math.max(0, it.amount - 1);
  if (it.amount <= 0.0001) { removeItem(it, "used"); toast(t("Used up {name}.", { name: it.name }) + stapleSuffix(), snap); }
  else { saveItems(); toast(t("{name}: {left} left", { name: it.name, left: amountText(it) }), snap); }
  renderAll();
}
function tossExpired() {
  const expired = items.filter(i => { const d = daysLeft(i.expires); return d !== null && d < 0; });
  if (!expired.length || !confirm(tn(expired.length, "Log 1 expired item as thrown out and remove it?", "Log {n} expired items as thrown out and remove them?"))) return;
  const snap = snapshot();
  expired.forEach(i => removeItem(i, "wasted"));
  toast(tn(expired.length, "Removed 1 expired item.", "Removed {n} expired items.") + stapleSuffix(), snap);
  renderAll();
}
