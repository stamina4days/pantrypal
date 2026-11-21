"use strict";
/* "I opened it": many foods keep for weeks sealed but only days once opened.
   Opening one moves its date up to match (never later than the date it already had). */
function openedDaysFor(name) {
  const k = canon(name) || norm(name);
  return byKey("opened", OPENED_DAYS, k) || null;
}
function canOpen(i) { return !i.opened && !i.leftover && locIndex(i.location) !== 2 && !!openedDaysFor(i.name); }
function markOpened(id) {
  const i = items.find(x => x.id === id);
  if (!i) return;
  const days = openedDaysFor(i.name) || 5;
  const snap = snapshot();
  i.opened = todayStr();
  const toFridge = ["Pantry", "Counter"].includes(i.location);
  if (toFridge) i.location = "Fridge";   // opened jars and cartons belong in the fridge
  const newExp = addDaysFrom(todayStr(), days);
  const moved = !i.expires || newExp < i.expires;
  if (moved) i.expires = newExp;
  saveItems(); renderAll();
  const msg = moved ? t("Opened! Now it's good until {date}.", { date: prettyDate(i.expires) }) : t("Opened! Its date stays the same.");
  toast(toFridge ? msg + " " + t("I moved it to the fridge.") : msg, snap);
}
