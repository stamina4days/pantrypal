"use strict";
/* Today: the home screen, drawn as Benji's kitchen. The fridge holds the foods to eat first, tonight's
   recipe is on the chalkboard, the jar on the shelf fills as you save food, and Benji stands on the counter. */

function greeting() {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? t("Good morning") : h < 17 ? t("Good afternoon") : t("Good evening");
}

/* Benji's one short line for the day (at most one button). */
function palTodayHtml() {
  const dl = i => daysLeft(i.expires);
  if (!items.length) return palBubble("hungry", t("I'm empty and kind of hungry. Add what you bought, or show me what's in your kitchen!"),
    [{ attrs: 'data-pal="audit" class="primary"', label: t("Show Benji my kitchen") }]);
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
  if (typeof palHatLine === "function" && oneNudge("hats", (settings.visits || 0) >= 6 && settings.visits % 10 === 6))
    return palBubble("wink", palYou(palHatLine()), [{ attrs: 'data-go-hats class="primary"', label: t("See my hats") }]);
  const day = Math.floor(Date.now() / 86400000);
  const lines = [palYou(palDaily(palTimeOfDay())), palYou(palDaily(palSeason())), t("Everything in here is fresh and happy.")];
  return palBubble(day % 2 ? "wink" : "happy", lines[day % lines.length] || lines[2], []);
}

function renderToday() {
  const box = $("#todayUseFirst"); if (!box) return;
  // Add food sits on the kitchen floor and stays in view just above the tabs
  const bar = $(".tabbar");
  if (bar && bar.offsetHeight) document.documentElement.style.setProperty("--tabbar-h", bar.offsetHeight + "px");
  // The fridge: the three foods to eat first, as magnets with how long each one has
  const sortKey = i => { const d = daysLeft(i.expires); return d === null ? 99999 : d; };
  const first = items.filter(i => i.expires).slice().sort((a, b) => sortKey(a) - sortKey(b) || a.name.localeCompare(b.name)).slice(0, 3);
  box.innerHTML = first.map(i => {
    const d = daysLeft(i.expires), lab = expiryLabel(d);
    return `<li><a class="k-magnet" href="#/food/${esc(i.id)}" aria-label="${esc(i.name + ", " + friendlyWhen(i.expires))}">${foodArt(i.name, i, "k-mag-art")}
      <span class="k-when ${lab.cls}">${esc(d !== null && d < 0 ? t("past") : d === 1 ? t("1 day") : shortLeft(d))}</span></a></li>`;
  }).join("");
  // What can I cook? The big button, with how many recipes need nothing from the store
  const cc = $("#todayCanCookSub");
  if (cc) {
    const n = cookNowCount();
    cc.textContent = !items.length ? t("Add your food and I'll find recipes")
      : n ? tn(n, "1 recipe with nothing to buy", "{n} recipes with nothing to buy") : t("Recipes that need just one thing");
  }
  $("#todayAllFood").textContent = items.length ? tn(items.length, "All 1 food", "All {n} foods") : t("Empty! Fill me up");
  const expiring = items.some(i => { const d = daysLeft(i.expires); return d !== null && d >= 0 && d <= RESCUE_DAYS && !i.leftover; });
  $("#todayCookBtn").classList.toggle("hidden", !expiring);
  $("#todayAllFood").classList.toggle("hidden", expiring);

  // The jar on the shelf fills up with the food you saved this month
  const since = addDaysFrom(todayStr(), -30);
  const saved = history.filter(h => h.outcome === "used" && h.date >= since && (h.d === null || h.d >= 0)).length;
  const fill = Math.min(100, Math.round(saved / 20 * 100));
  const jar = $("#todayJar");
  jar.setAttribute("aria-label", saved ? tn(saved, "Your jar: 1 food saved this month", "Your jar: {n} foods saved this month") : t("Your jar is empty. Use food in time to fill it."));
  jar.innerHTML = `<span class="k-lid" aria-hidden="true"></span><span class="k-glass" aria-hidden="true"><span class="k-fill" style="height:${fill}%"></span><span class="k-count">${saved}</span></span>
    <span class="k-label">${esc(t("Your jar"))}</span>`;

  // The hat on the peg is the one Benji wears, or the hat for the season
  const ha = $("#todayHatArt");
  if (ha && typeof palOutfit === "function") {
    const o = palOutfit(), h = o.art ? o : benjiHat(palSeason());
    const art = o.art || (h && h.art ? h.art() : "");
    ha.innerHTML = `<svg viewBox="14 -66 140 110" width="70" height="55" aria-hidden="true">${art}</svg>`;
  }
  if (typeof Motion !== "undefined") { Motion.tickKitchen(); Motion.checkSprout(); requestAnimationFrame(Motion.afterToday); }
}

function todayInit() {
  $("#todayAllFood").addEventListener("click", () => (typeof Motion !== "undefined" ? Motion.fridge(() => showTab("pantry")) : showTab("pantry")));
  $("#todayJar").addEventListener("click", () => showTab("stats"));
  $("#todayAddBtn").addEventListener("click", () => openItem());
  $("#todayCookBtn").addEventListener("click", () => openCollection("rescue"));
  $("#todayCanCook").addEventListener("click", () => openCollection("cook-now"));
  $("#todayScanBtn").addEventListener("click", () => { openItem(null); openScanner(); });
  if (typeof talkSupported === "function" && talkSupported()) {
    $("#todayTalkBtn").classList.remove("hidden");
    $("#todayTalkBtn").addEventListener("click", startTalking);
  }
  const back = $("#statsBackBtn");
  if (back) back.addEventListener("click", () => showTab("today"));
}
