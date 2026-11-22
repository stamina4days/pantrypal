"use strict";
/* Running low: foods you're almost out of, usually run out of about now, or just finished,
   shown on the shopping list with one tap to add. "Not now" hides one for a week. */

const LOW_SNOOZE_DAYS = 7;
const lowKey = name => (canon(name) || norm(name)).trim();

function usedWhen(dateStr) {
  const ago = -daysLeft(dateStr);
  if (ago <= 0) return t("Used up today");
  if (ago === 1) return t("Used up yesterday");
  if (ago <= 6) return t("Used up {day}", { day: weekdayOf(dateStr) });
  return t("Used up last week");
}

function runningLow(list) {
  const today = todayStr();
  const snooze = settings.lowSnooze || {};
  const onList = new Set(list.items.filter(x => !x.done).map(x => lowKey(x.name)));
  const have = new Set(items.map(i => lowKey(i.name)));
  const seen = new Set(), out = [];
  const add = (name, why, item) => {
    const k = lowKey(name);
    if (!k || seen.has(k) || onList.has(k) || (snooze[k] && snooze[k] > today)) return;
    seen.add(k); out.push({ name, why, item, key: k });
  };
  const real = items.filter(i => !i.leftover && !i.recipe);

  // 1. Almost out: a quarter or less of what you had
  real.filter(i => i.full >= 2 && i.amount != null && i.amount <= i.full * 0.25)
    .forEach(i => add(i.name, t("Almost out: {left} left", { left: amountText(i) || fmtNum(i.amount) }), i));

  // 2. You usually run out about now
  real.forEach(i => {
    const u = usageFor(i);
    if (!u || !i.bought || !(i.staple || u.n >= 2)) return;
    if (addDaysFrom(i.bought, Math.round(u.avg)) <= addDaysFrom(today, 2)) add(i.name, t("You usually run out about now"), i);
  });

  // 3. Just finished something you buy often (or always keep on hand)
  const since = addDaysFrom(today, -21);
  const usedCount = {};
  history.forEach(h => { if (h.outcome === "used") { const k = lowKey(h.name); usedCount[k] = (usedCount[k] || 0) + 1; } });
  history.slice().reverse().forEach(h => {
    if (h.outcome !== "used" || h.date < since) return;
    const k = lowKey(h.name);
    if (have.has(k) || !(isStaple(h.name) || usedCount[k] >= 2)) return;
    add(h.name, usedWhen(h.date), null);
  });

  // 4. Foods you said you always keep, and don't have right now
  (settings.staples || []).forEach(s => {
    const name = s.trim();
    if (name && !have.has(lowKey(name))) add(name.charAt(0).toUpperCase() + name.slice(1), t("You always keep this on hand"), null);
  });

  return out.slice(0, 8);
}

function runningLowHtml(list) {
  const low = runningLow(list);
  if (!low.length) return "";
  return `<section class="low-card" aria-labelledby="lowTitle">
    <div class="low-head"><h3 id="lowTitle">${esc(t("Running low"))}</h3>
      ${low.length > 1 ? `<button class="text-btn" type="button" data-low-all>${esc(t("Add all {n}", { n: low.length }))}</button>` : ""}</div>
    <ul class="low-rows">${low.map(x => `<li class="low-row">
      ${foodArt(x.name, x.item, "low-art")}
      <span class="grow"><strong>${esc(x.name)}</strong><span>${esc(x.why)}</span></span>
      <button class="low-add" type="button" data-low-add="${esc(x.name)}" aria-label="${esc(t("Add {name} to the list", { name: x.name }))}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/plus.svg#i"/></svg>${esc(t("Add"))}</button>
      <button class="low-skip" type="button" data-low-skip="${esc(x.key)}" aria-label="${esc(t("Hide {name} for a week", { name: x.name }))}"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/close.svg#i"/></svg></button>
    </li>`).join("")}</ul></section>`;
}

function runningLowInit() {
  $("#shopSuggest").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const list = currentList() || stapleList();
    if (b.dataset.lowAdd) {
      addToList(list, b.dataset.lowAdd, "", t("restock"));
      saveShopping(); sfx("pop"); renderShopping();
      toast(t("Added {name} to {list}.", { name: b.dataset.lowAdd, list: list.name }));
    } else if (b.hasAttribute("data-low-all")) {
      const low = runningLow(list);
      low.forEach(x => addToList(list, x.name, "", t("restock")));
      saveShopping(); sfx("ding"); renderShopping();
      toast(tn(low.length, "Added 1 thing to {list}.", "Added {n} things to {list}.", { list: list.name }));
    } else if (b.dataset.lowSkip) {
      (settings.lowSnooze || (settings.lowSnooze = {}))[b.dataset.lowSkip] = addDaysFrom(todayStr(), LOW_SNOOZE_DAYS);
      saveSettings(); renderShopping();
    }
  });
}
