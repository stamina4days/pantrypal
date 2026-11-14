"use strict";
/* Waste Less: a bar for each of the last 8 weeks, used in time vs tossed. */
function weeklyChartHtml() {
  const today = todayStr();
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = addDaysFrom(today, -7 * i), start = addDaysFrom(end, -6);
    const h = history.filter(e => e.date >= start && e.date <= end);
    return { start, used: h.filter(e => e.outcome === "used").length, tossed: h.filter(e => e.outcome === "wasted").length };
  }).reverse();
  const max = Math.max(1, ...weeks.map(w => w.used + w.tossed));
  if (!weeks.some(w => w.used + w.tossed)) return "";
  const W = 320, H = 150, bw = 26, gap = (W - 24 - bw * 8) / 7;
  const bars = weeks.map((w, i) => {
    const x = 12 + i * (bw + gap);
    const hu = Math.round(w.used / max * 110), ht = Math.round(w.tossed / max * 110);
    const label = new Date(parseDay(w.start)).toLocaleDateString(locale(), { month: "numeric", day: "numeric" });
    return `<g><title>${esc(t("Week of {d}: {a} used, {b} tossed", { d: label, a: w.used, b: w.tossed }))}</title>
      <rect x="${x}" y="${124 - hu}" width="${bw}" height="${hu}" rx="5" class="cb-used"/>
      <rect x="${x}" y="${124 - hu - ht - (ht ? 2 : 0)}" width="${bw}" height="${ht}" rx="5" class="cb-tossed"/>
      <text x="${x + bw / 2}" y="142" text-anchor="middle" class="cb-label">${esc(label)}</text></g>`;
  }).join("");
  return `<div class="card chart-card"><h3>${esc(t("Last 8 weeks"))}</h3>
    <svg class="week-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("Food used and tossed each week for the last 8 weeks"))}">
      <path d="M8 124 H${W - 8}" class="cb-axis"/>${bars}</svg>
    <p class="legend small"><span class="key used"></span>${esc(t("Used"))} <span class="key tossed"></span>${esc(t("Tossed"))}</p></div>`;
}
