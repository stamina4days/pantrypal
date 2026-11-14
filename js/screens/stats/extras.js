"use strict";
/* More on Waste Less: money saved, the chart, badges, and tips. */
function renderStatsExtras() {
  const box = $("#statsExtras");
  if (!box) return;
  const s = badgeStats();
  const list = badgeList(), got = list.filter(b => b.done);
  const next = list.filter(b => !b.done).sort((a, b) => b.have / b.goal - a.have / a.goal)[0];
  box.innerHTML = `
    ${s.saved >= 1 ? `<div class="card money-card"><span class="money-big">${esc(fmtMoney(s.saved))}</span><span>${esc(t("of food saved from the trash, roughly"))}</span></div>` : ""}
    ${weeklyChartHtml()}
    <a class="card link-card" href="#/badges">
      <span class="badge-stack" aria-hidden="true">${(got.length ? got.slice(-3) : [{ id: "locked" }]).map(b => `<img src="img/badges/${b.id}.svg" width="44" height="44" alt="">`).join("")}</span>
      <span class="grow"><strong>${esc(t("Your badges"))}</strong><span class="small muted">${esc(t("{a} of {b} earned", { a: got.length, b: list.length }))}${next ? ". " + esc(t("Next: {name}", { name: t(next.name) })) : ""}</span></span>
      <span class="go" aria-hidden="true">&#8250;</span></a>
    <a class="card link-card" href="#/tips">
      <img src="img/illustrations/tips-jar.svg" width="48" height="38" alt="">
      <span class="grow"><strong>${esc(t("Make food last"))}</strong><span class="small muted">${esc(t("Storage tips for {n} foods", { n: STORAGE_TIPS.length }))}</span></span>
      <span class="go" aria-hidden="true">&#8250;</span></a>`;
}
