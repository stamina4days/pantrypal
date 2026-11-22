"use strict";
/* Play corner: the games and the kitchen radio, opened from Today. */
function openPlay() {
  renderPlay();
  Radio.render();
  if (!$("#playPage").open) $("#playPage").showModal();
}
function playPalHtml() {
  const g = hatProgress(true);
  const msg = g.next
    ? t("Win games and I win hats! {how} and I get the {hat}.", { how: t(g.next.b.desc).replace(/\.$/, ""), hat: t(g.next.h.name).toLowerCase() })
    : t("You've won all {n} of my game hats. I'm the best-dressed dollar in town!", { n: g.total });
  return palBubble(g.next ? "wink" : "proud", msg, [{ attrs: 'data-go-hats', label: tn(g.have, "1 of {b} game hats won", "{n} of {b} game hats won", { b: g.total }) }]);
}
function renderPlay() {
  const st = playStats();
  const pp = $("#plyPal");
  if (pp && typeof hatProgress === "function") pp.innerHTML = playPalHtml();
  const best = $("#plySortBest");
  if (best) best.textContent = st.sortBest ? t("Best: {n} points", { n: st.sortBest }) : t("New!");
  const w = $("#plyWordState");
  if (w) {
    const s = st.word && st.word.date === todayStr() ? st.word : null;
    w.textContent = s && s.done ? (s.won ? t("Solved today. Come back tomorrow!") : t("Today's is done. New word tomorrow.")) : t("Today's word is ready");
  }
  const tb = $("#todayPlayBtn");
  if (tb) {
    const fresh = !(st.word && st.word.date === todayStr() && st.word.done);
    tb.classList.toggle("has-new", fresh);
  }
}
function playInit() {
  $("#plySortBtn").addEventListener("click", openSort);
  $("#plyWordBtn").addEventListener("click", openWord);
  const tb = $("#todayPlayBtn");
  if (tb) tb.addEventListener("click", openPlay);
  Radio.init();
  sortInit();
  wordInit();
  appBadgeInit();
  renderPlay();
}
