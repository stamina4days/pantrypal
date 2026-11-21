"use strict";
/* Waste Less. */
/* ---------- WASTE LESS ---------- */
let statsRange = "30";
function renderStats() {
  const cutoff = statsRange === "all" ? "" : addDaysFrom(todayStr(), -30);
  const h = history.filter(e => !cutoff || e.date >= cutoff);
  const used = h.filter(e => e.outcome === "used"), wasted = h.filter(e => e.outcome === "wasted");
  const inTime = used.filter(e => e.d === null || e.d >= 0);
  const late = used.filter(e => e.d !== null && e.d < 0);
  const rescued = used.filter(e => e.d !== null && e.d >= 0 && e.d <= 3);
  const total = used.length + wasted.length;
  const body = $("#statsBody");
  const cooks = cookedLog.filter(c => !cutoff || c.date >= cutoff).length;
  if (!total) {
    body.innerHTML = palStatsHtml(0, 0) + `<div class="card"><h3>${esc(t("Nothing tracked yet"))}</h3>
      <p class="muted small">${esc(t("When you finish food (the -1 button, \"I made this\" on a recipe, or Remove then \"We used it\") or toss it, it shows up here. Over time you'll see how much you're saving."))}</p></div>`;
    return;
  }
  const pct = Math.round(inTime.length / total * 100);
  const w = n => (n / total * 100).toFixed(1) + "%";
  const counts = {};
  wasted.forEach(e => { const k = e.name.trim().toLowerCase(); counts[k] = (counts[k] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const tip = !wasted.length ? t("Nothing tossed. Nicely done!")
    : top[0][1] > 1 ? t("You've tossed {name} {n} times. Try buying less of it, or freezing it sooner.", { name: top[0][0], n: top[0][1] })
    : t("Check the For You recipes when the orange alert shows up. That's where most savings happen.");
  body.innerHTML = palStatsHtml(pct, total) + `
    ${savingsJarHtml(inTime, total)}
    <div class="stat-grid full-only">
      <div class="stat good"><div class="num">${inTime.length}</div><div class="small">${esc(t("Used in time"))}</div></div>
      <div class="stat good"><div class="num">${rescued.length}</div><div class="small">${esc(t("Rescued (used in its last 3 days)"))}</div></div>
      <div class="stat"><div class="num">${late.length}</div><div class="small">${esc(t("Used after the date"))}</div></div>
      <div class="stat bad"><div class="num">${wasted.length}</div><div class="small">${esc(t("Thrown out"))}</div></div>
      <div class="stat"><div class="num">${cooks}</div><div class="small">${esc(t("Meals cooked"))}</div></div>
    </div>
    ${top.length ? `<div class="card"><h3>${esc(t("Most often tossed"))}</h3><ol>${top.map(([n, c]) => `<li>${esc(n)} <span class="muted small">(${c})</span></li>`).join("")}</ol></div>` : ""}
    <div class="card"><h3>${esc(t("Tip"))}</h3><p class="small">${esc(tip)}</p></div>`;
}
