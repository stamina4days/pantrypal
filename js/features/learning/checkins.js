"use strict";
/* Asks every few days whether things are still there, and learns how fast your kitchen goes through each food.
   Running low on the shopping list uses what it learns. */
function checkinHtml() {
  if (!settings.checkins || !items.length) return "";
  const today = todayStr();
  if (!settings.lastCheckin) { settings.lastCheckin = today; saveSettings(); return ""; }
  if (daysBetween(settings.lastCheckin, today) < 3) return "";
  const cands = items.filter(i => {
    const seen = i.verified || i.bought || i.added || today, d = daysLeft(i.expires);
    return daysBetween(seen, today) >= 5 || (d !== null && d >= 0 && d <= 2);
  }).slice(0, 6);
  if (!cands.length) { settings.lastCheckin = today; saveSettings(); return ""; }
  return `<div class="card checkin"><div class="r-head"><h3>${esc(t("Quick check: still have these?"))}</h3><button class="link-btn" data-ci-done="1">${esc(t("Later"))}</button></div>
    ${cands.map(i => `<div class="ci-row"><span class="grow">${esc(i.name)}</span>
      <button class="row-btn" data-ci="keep" data-id="${i.id}">${esc(t("Still have"))}</button>
      <button class="row-btn" data-ci="used" data-id="${i.id}">${esc(t("Used up"))}</button>
      <button class="row-btn" data-ci="wasted" data-id="${i.id}">${esc(t("Tossed"))}</button></div>`).join("")}</div>`;
}
function learnUsage(item) {
  const k = (canon(item.name) || norm(item.name)).trim();
  const days = Math.max(1, daysBetween(item.bought, todayStr()));
  const u = (settings.usage || (settings.usage = {}))[k] || { n: 0, avg: 0 };
  const w = Math.min(u.n, 4);
  u.avg = (u.avg * w + days) / (w + 1);
  u.n += 1;
  settings.usage[k] = u;
  saveSettings();
}
function usageFor(item) { const u = (settings.usage || {})[(canon(item.name) || norm(item.name)).trim()]; return u && u.n ? u : null; }
function usageText(item) { const u = usageFor(item); return u ? t("You usually finish this in about {n} days.", { n: Math.max(1, Math.round(u.avg)) }) : ""; }
