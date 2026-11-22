"use strict";
/* Today: the home screen. Pal's note, the foods to use first, tonight's recipe,
   the saved-food jar, and one big Add food button. Built to fit one phone screen. */

function greeting() {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? t("Good morning") : h < 17 ? t("Good afternoon") : t("Good evening");
}

/* Pal's one short line for the day (at most one button). */
function palTodayHtml() {
  const dl = i => daysLeft(i.expires);
  if (!items.length) return palBubble("hungry", t("I'm empty and kind of hungry. Add what you bought, or show me what's in your kitchen!"),
    [{ attrs: 'data-pal="audit" class="primary"', label: t("Show Pal my kitchen") }]);
  const expired = items.filter(i => { const d = dl(i); return d !== null && d < 0; });
  if (expired.length) return palBubble("worried", tn(expired.length, "1 thing is past its date. Want me to clear it out?", "{n} things are past their date. Want me to clear them out?"),
    [{ attrs: 'data-toss="1" class="primary"', label: t("Clear them out") }]);
  const urgent = items.filter(i => { const d = dl(i); return d !== null && d >= 0 && d <= 1; }).sort((a, b) => dl(a) - dl(b));
  if (urgent.length) {
    const it = urgent[0];
    return palBubble("hungry", dl(it) === 0 ? t("Your {name} needs eating today. Tonight's pick can help.", { name: it.name })
      : t("Your {name} has one day left. Tonight's pick can help.", { name: it.name }), []);
  }
  const savedWeek = history.filter(h => h.outcome === "used" && h.date >= addDaysFrom(todayStr(), -7)).length;
  if (settings.lastWin && Date.now() - settings.lastWin < 3 * 3600 * 1000 && savedWeek)
    return palBubble("proud", tn(savedWeek, "Look at you go! 1 thing saved from the trash this week.", "Look at you go! {n} things saved from the trash this week."), []);
  const day = Math.floor(Date.now() / 86400000);
  const lines = [palYou(palDaily(palTimeOfDay())), palYou(palDaily(palSeason())), t("Everything in here is fresh and happy.")];
  return palBubble(day % 2 ? "wink" : "happy", lines[day % lines.length] || lines[2], []);
}

function renderToday() {
  const box = $("#todayUseFirst"); if (!box) return;
  const sortKey = i => { const d = daysLeft(i.expires); return d === null ? 99999 : d; };
  const first = items.filter(i => i.expires).slice().sort((a, b) => sortKey(a) - sortKey(b) || a.name.localeCompare(b.name)).slice(0, 3);
  $("#todayAllFood").textContent = items.length ? tn(items.length, "All 1 food", "All {n} foods") : "";
  $("#todayAllFood").classList.toggle("hidden", !items.length);
  box.closest(".today-card").classList.toggle("hidden", !first.length);
  box.innerHTML = first.map(i => {
    const lab = expiryLabel(daysLeft(i.expires));
    const sub = [locLabel(i.location), amountText(i)].filter(Boolean).join(", ");
    return `<li><a class="today-row" href="#/food/${esc(i.id)}">${foodArt(i.name, i, "today-art")}
      <span class="grow"><strong>${esc(i.name)}</strong><span>${esc(sub)}</span></span>
      <span class="when ${lab.cls}">${esc(friendlyWhen(i.expires))}</span></a></li>`;
  }).join("");

  const expiring = items.some(i => { const d = daysLeft(i.expires); return d !== null && d >= 0 && d <= RESCUE_DAYS && !i.leftover; });
  $("#todayCookBtn").classList.toggle("hidden", !expiring);
  if (expiring) $("#todayAllFood").classList.add("hidden");

  const since = addDaysFrom(todayStr(), -30);
  const saved = history.filter(h => h.outcome === "used" && h.date >= since && (h.d === null || h.d >= 0)).length;
  $("#todayJar").innerHTML = `<img src="img/illustrations/tips-jar.svg" width="34" height="34" alt="">
    <span class="grow">${esc(saved ? tn(saved, "1 food saved this month", "{n} foods saved this month") : t("Use food in time to fill your jar"))}</span>
    <span class="go">${esc(t("Your jar"))}</span>`;
}

function todayInit() {
  $("#todayAllFood").addEventListener("click", () => showTab("pantry"));
  $("#todayJar").addEventListener("click", () => showTab("stats"));
  $("#todayAddBtn").addEventListener("click", () => openItem());
  $("#todayCookBtn").addEventListener("click", () => openCollection("rescue"));
  $("#todayScanBtn").addEventListener("click", () => { openItem(null); openScanner(); });
  if (typeof talkSupported === "function" && talkSupported()) {
    $("#todayTalkBtn").classList.remove("hidden");
    $("#todayTalkBtn").addEventListener("click", startTalking);
  }
  const back = $("#statsBackBtn");
  if (back) back.addEventListener("click", () => showTab("today"));
}
