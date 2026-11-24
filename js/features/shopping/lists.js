"use strict";
/* Small helpers for picking a shopping list and adding to it. */
function currentList() { return shopping.find(l => l.id === settings.activeList) || shopping[0] || null; }
function addToList(list, name, amt, from) {
  const existing = list.items.find(x => !x.done && norm(x.name) === norm(name));
  if (existing) {
    if (from && !existing.from.includes(from)) existing.from.push(from);
    return false;
  }
  list.items.push({ id: uid(), name, amt: amt || "", done: false, from: from ? [from] : [] });
  return true;
}
function stapleList() {
  let list = currentList();
  if (!list) { list = { id: uid(), name: t("Groceries"), items: [] }; shopping.push(list); settings.activeList = list.id; saveSettings(); }
  return list;
}
