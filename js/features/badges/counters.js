"use strict";
/* Counting the little wins: badges, streaks, and how much food money you've saved. */

function bump(name, n) {
  settings.counts = settings.counts || {};
  settings.counts[name] = (settings.counts[name] || 0) + (n || 1);
  saveSettings();
  setTimeout(checkNewBadges, 400);
}

/* Rough dollar value of a food, for "money saved". Unknown prices count as nothing. */
function foodValue(item) {
  try {
    const key = canon(item.name);
    const g = itemGrams(item, key), p = pricePerG(key);
    const v = g && p ? g * p : 0;
    return isFinite(v) ? Math.round(v * 100) / 100 : 0;
  } catch (e) { return 0; }
}

function updateStreak() {
  const s = settings.streak || { last: null, n: 0, best: 0 };
  const today = todayStr();
  if (s.last !== today) {
    s.n = s.last === addDaysFrom(today, -1) ? s.n + 1 : 1;
    s.last = today;
    s.best = Math.max(s.best || 0, s.n);
    settings.streak = s;
    saveSettings();
  }
  return s;
}

function badgeStats() {
  const c = settings.counts || {};
  const used = history.filter(e => e.outcome === "used");
  const inTime = used.filter(e => e.d === null || e.d >= 0);
  const rescued = used.filter(e => e.d !== null && e.d >= 0 && e.d <= 3).length;
  const weekAgo = addDaysFrom(todayStr(), -7);
  const week = history.filter(e => e.date > weekAgo);
  const first = history.reduce((m, e) => !m || e.date < m ? e.date : m, null);
  const cuisines = new Set(cookedLog.map(x => { const r = recipeByName(x.name); return r && r.cuisine; }).filter(Boolean));
  c.plannedPeak = Math.max(c.plannedPeak || 0, plan.length);
  return {
    added: items.filter(i => !i.sample).length + history.length,
    audits: c.audits || 0,
    rescued,
    cooked: cookedLog.length,
    planned: c.plannedPeak,
    prepped: c.prepped || 0,
    frozen: c.frozen || 0,
    checked: c.checked || 0,
    receipts: c.receipts || 0,
    cuisines: cuisines.size,
    cleanWeek: !!first && first <= weekAgo && !week.some(e => e.outcome === "wasted") && week.filter(e => e.outcome === "used").length >= 3,
    streak: Math.max((settings.streak || {}).best || 0, (settings.streak || {}).n || 0),
    mine: myRecipes.length,
    saved: inTime.reduce((sum, e) => sum + (e.v || 0), 0),
    lateCook: c.lateCook || 0,
    helper: c.helper || 0,
    sortPlays: (settings.play || {}).sortPlays || 0,
    sortPerfect: (settings.play || {}).sortPerfect || 0,
    sortChecks: (settings.play || {}).sortChecks || 0,
    wordWins: (settings.play || {}).wordWins || 0,
    wordStreak: Math.max((settings.play || {}).wordStreakBest || 0, (settings.play || {}).wordStreak || 0)
  };
}

function badgeList() {
  const s = badgeStats();
  return BADGES.map(b => {
    const [have, goal] = b.test(s);
    return { ...b, have: Math.min(have, goal), goal, done: have >= goal };
  }).filter(b => !b.shop || b.done);
}

/* Celebrate any badge you just earned. The first check only records what you already have. */
function checkNewBadges() {
  const earned = badgeList().filter(b => b.done).map(b => b.id);
  const known = settings.badges;
  settings.badges = earned;
  if (!known) { saveSettings(); return; }
  const fresh = earned.filter(id => !known.includes(id));
  if (fresh.length) {
    saveSettings();
    const b = BADGES.find(x => x.id === fresh[0]);
    const hat = typeof hatForBadge === "function" ? hatForBadge(b.id) : null;
    const hats = fresh.map(id => typeof hatForBadge === "function" ? hatForBadge(id) : null).filter(Boolean);
    toast(fresh.length > 1
      ? (hats.length ? tn(hats.length, "{a} new badges! Benji unlocked a new hat.", "{a} new badges! Benji unlocked {n} new hats.", { a: fresh.length }) : t("{a} new badges!", { a: fresh.length }))
      : hat ? t("New badge: {name}! Benji unlocked the {hat}.", { name: t(b.name), hat: t(hat.name).toLowerCase() }) : t("New badge: {name}!", { name: t(b.name) }));
    if (typeof Motion !== "undefined") Motion.badge(b);
    confetti(); sfx("cheer"); buzz([10, 50, 10, 50, 20]);
  }
}
