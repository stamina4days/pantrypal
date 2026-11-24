"use strict";
/* What Benji says on Waste Less, based on how much food you have saved lately. */
function palStatsHtml(pct, total) {
  if (!total) return palBubble("hungry", t("No score yet! Cook something or finish up some food and I'll start keeping track."), []);
  if (pct >= 80) return palBubble("proud", t("You're a food-saving pro. Seriously, nice work!"), []);
  if (pct >= 50) return palBubble("happy", t("Not bad at all! Let's get that number even higher."), []);
  return palBubble("worried", t("A lot got tossed lately. I'll give you a heads up sooner, promise."), []);
}
