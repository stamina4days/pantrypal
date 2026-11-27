"use strict";
/* The badges page: every badge with its progress. The badges themselves are defined in data/badges.js. */
function openBadges() {
  renderBadges();
  $("#badgesPage").showModal();
}
function renderBadges() {
  const list = badgeList();
  const got = list.filter(b => b.done).length;
  $("#bgMeta").textContent = t("{a} of {b} earned", { a: got, b: list.length });
  const s = settings.streak || { n: 0, best: 0 };
  $("#bgStreak").innerHTML = palBubble(got >= list.length / 2 ? "proud" : "happy",
    s.n > 1 ? t("You've opened Benji's Kitchen {n} days in a row. Your best is {b}.", { n: s.n, b: s.best || s.n })
      : got ? t("Look at you go! Keep using food before it expires to earn more.") : t("Every badge is a little win. Use up food, cook, and plan to start collecting."));
  $("#bgGrid").innerHTML = list.map(b => {
    const pct = Math.round(b.have / b.goal * 100);
    return `<li class="badge-card ${b.done ? "earned" : "locked"}">
      <img src="img/badges/${b.done ? b.id : "locked"}.svg" width="76" height="76" alt="">
      <strong>${esc(t(b.name))}</strong>
      <span class="small">${esc(t(b.desc))}</span>
      ${hatForBadge(b.id) ? `<span class="hat-reward small">${esc(b.done ? t("Unlocked: {hat}", { hat: t(hatForBadge(b.id).name) }) : t("Unlocks: {hat}", { hat: t(hatForBadge(b.id).name) }))}</span>` : ""}
      ${b.done ? `<span class="earned-tag">${esc(t("Earned!"))}</span>`
        : `<span class="mini-meter" role="img" aria-label="${esc(t("{a} of {b}", { a: b.have, b: b.goal }))}"><span style="width:${pct}%"></span></span><span class="small muted">${esc(t("{a} of {b}", { a: b.have, b: b.goal }))}</span>`}
    </li>`;
  }).join("");
}
