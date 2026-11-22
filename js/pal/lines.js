"use strict";
/* What Benji says. */
/* ---------- what Benji says on My Food ---------- */
function palFoodHtml() {
  const live = items.filter(i => !i.leftover);
  const dl = i => daysLeft(i.expires);
  const expired = items.filter(i => { const d = dl(i); return d !== null && d < 0; });
  const urgent = items.filter(i => { const d = dl(i); return d !== null && d >= 0 && d <= 1; }).sort((a, b) => dl(a) - dl(b));
  const soon = items.filter(i => { const d = dl(i); return d !== null && d >= 0 && d <= 3; });
  const savedWeek = history.filter(h => h.outcome === "used" && h.date >= addDaysFrom(todayStr(), -7)).length;
  if (!items.length) return palBubble("hungry", t("I'm empty and kind of hungry. Tap + to add food, or show me what's in your kitchen!"),
    [{ attrs: 'data-pal="audit" class="primary"', label: t("Show Benji my kitchen") }]);
  if (expired.length) return palBubble("worried", tn(expired.length, "Uh oh, 1 thing is past its date. Want to clear it out?", "Uh oh, {n} things are past their date. Want to clear them out?"),
    [{ attrs: 'data-toss="1" class="primary"', label: t("Clear them out") }].concat(urgent.length ? [{ attrs: `data-pal="use" data-id="${urgent[0].id}"`, label: t("Save the {name}", { name: urgent[0].name }) }] : []));
  if (urgent.length) {
    const it = urgent[0], d = dl(it);
    return palBubble("worried", d === 0 ? t("Heads up! Your {name} needs to be eaten today. Want a recipe for it?", { name: it.name })
      : t("Heads up! Your {name} has 1 day left. Want a recipe for it?", { name: it.name }),
      [{ attrs: `data-pal="use" data-id="${it.id}" class="primary"`, label: t("Find a recipe") }, { attrs: `data-pal="freeze" data-id="${it.id}"`, label: t("Freeze it") }]);
  }
  if (settings.lastWin && Date.now() - settings.lastWin < 3 * 3600 * 1000 && savedWeek)
    return palBubble("proud", tn(savedWeek, "Look at you go! That's 1 thing saved from the trash this week.", "Look at you go! That's {n} things saved from the trash this week."), []);
  if (soon.length) return palBubble("happy", tn(soon.length, "1 thing wants to be eaten in the next few days. I've got ideas!", "{n} things want to be eaten in the next few days. I've got ideas!"),
    [{ attrs: 'data-go="recipes" class="primary"', label: t("Show me") }]);
  const day = Math.floor(Date.now() / 86400000);
  const hello = palDaily(palTimeOfDay());
  const picks = [
    () => palBubble("wink", palYou(hello), [{ attrs: 'data-pal="quick" class="primary"', label: t("What can I make?") }]),
    () => palBubble("happy", t("Everything in here is fresh and happy. Want me to plan your week?"), [{ attrs: 'data-pal="plan" class="primary"', label: t("Plan my week") }]),
    () => palBubble("happy", palYou(palDaily(palSeason())), []),
    () => palBubble("happy", tn(live.length, "I'm keeping an eye on 1 thing for you. I'll speak up if it needs eating.", "I'm keeping an eye on {n} things for you. I'll speak up if anything needs eating."), [])
  ];
  return picks[day % picks.length]();
}
function palStatsHtml(pct, total) {
  if (!total) return palBubble("hungry", t("No score yet! Cook something or finish up some food and I'll start keeping track."), []);
  if (pct >= 80) return palBubble("proud", t("You're a food-saving pro. Seriously, nice work!"), []);
  if (pct >= 50) return palBubble("happy", t("Not bad at all! Let's get that number even higher."), []);
  return palBubble("worried", t("A lot got tossed lately. I'll give you a heads up sooner, promise."), []);
}
