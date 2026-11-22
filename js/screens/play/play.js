"use strict";
/* Play corner: the games and the kitchen radio, opened from Today. */
function openPlay() {
  renderPlay();
  Radio.render();
  if (!$("#playPage").open) $("#playPage").showModal();
}
function renderPlay() {
  const st = playStats();
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
