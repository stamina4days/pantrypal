"use strict";
/* Benji's hats: pick one to wear, let it change with the seasons, or go without. Locked hats show the badge that earns them. */
function openHats() {
  renderHats();
  if (!$("#hatsPage").open) $("#hatsPage").showModal();
}

function renderHats() {
  const choice = benjiHatChoice();
  const worn = choice === "season" ? palSeason() : choice;
  $("#htPreview").innerHTML = palSVG(choice === "none" ? "happy" : "proud", 150, { pose: "cheer", outfit: choice === "none" ? false : undefined, hat: choice === "none" ? undefined : worn });
  const h = benjiHat(worn);
  $("#htMeta").textContent = choice === "none" || !h ? t("No hat right now.")
    : choice === "season" ? t("Wearing the {hat}. It changes with the seasons.", { hat: t(h.name).toLowerCase() })
    : t("Wearing the {hat}.", { hat: t(h.name).toLowerCase() });
  $("#htModes").innerHTML = [["season", "Change with the seasons"], ["none", "No hat"]].map(([v, l]) =>
    `<button type="button" data-hat="${v}" aria-pressed="${choice === v}" class="${choice === v ? "on" : ""}">${esc(t(l))}</button>`).join("");
  const badges = typeof badgeList === "function" ? badgeList() : [];
  const card = hat => {
    const open = hatUnlocked(hat), on = choice === hat.id;
    const b = hat.unlock ? badges.find(x => x.id === hat.unlock) : null;
    const how = open ? (on ? t("Wearing it") : t("Tap to wear"))
      : hat.golden ? t("Golden gift {n} of 4", { n: hat.golden })
      : hat.rescue ? (ownsItem(hat.needs) ? t("{a} of {b} rescues", { a: Math.min(rescueMeter(), hat.rescue * RESCUE_STEP), b: hat.rescue * RESCUE_STEP }) : t("Get the anime pack first"))
      : hat.shop ? (STORE_ITEMS.some(x => x.id === hat.shop && x.free) ? t("Free in Benji's shop") : t("In Benji's shop")) : b ? t("{badge} badge: {a} of {b}", { badge: t(b.name), a: Math.min(b.have, b.goal), b: b.goal }) : "";
    return `<li><button type="button" class="hat-card ${on ? "on" : ""} ${open ? "" : "locked"}" data-hat="${hat.id}" ${open ? `aria-pressed="${on}"` : `aria-disabled="true"`}>
      <span class="hat-pic">${palSVG("happy", 78, { hat: hat.id, pose: "rest", sprout: 1, wear: false })}${open ? "" : `<span class="hat-lock"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/lock.svg#i"/></svg></span>`}</span>
      <strong>${esc(t(hat.name))}</strong><span class="small">${esc(how)}</span>
      ${!open && b ? `<span class="small muted">${esc(t(b.desc))}</span>` : ""}
    </button></li>`;
  };
  $("#htSeason").innerHTML = BENJI_HATS.filter(x => x.season).map(card).join("");
  $("#htEarn").innerHTML = BENJI_HATS.filter(x => !x.season && !x.game && !x.shop && !x.base).map(card).join("");
  const free = id => STORE_ITEMS.some(x => x.id === id && x.free);
  const animeOwned = ownsItem("hats-anime");
  $("#htFreeNote").textContent = animeOwned ? t("Yours to keep. Tap one to put it on. Rescue food to unlock new colors.") : t("Free in Benji's shop. Tap a hat to get the pack.");
  const colors = BENJI_HATS.filter(x => x.rescue);
  const nextC = colors.find(x => !hatUnlocked(x));
  const m = rescueMeter() % RESCUE_STEP, full = !nextC;
  $("#htMeter").innerHTML = !animeOwned ? "" : `<div class="hm-row"><strong>${esc(t("Rescue meter"))}</strong><span class="small">${esc(full ? t("Every color unlocked!") : tn(RESCUE_STEP - m, "1 more rescue unlocks the {hat}.", "{n} more rescues unlock the {hat}.", { hat: t(nextC.name).toLowerCase() }))}</span></div>
    <div class="hm-bar" role="progressbar" aria-label="${esc(t("Rescue meter"))}" aria-valuemin="0" aria-valuemax="${RESCUE_STEP}" aria-valuenow="${full ? RESCUE_STEP : m}">${Array.from({ length: RESCUE_STEP }, (_, i) => `<i class="${full || i < m ? "on" : ""}"></i>`).join("")}</div>
    <p class="muted small">${esc(t("Use food in its last 3 days to fill the meter."))}</p>`;
  $("#htColors").innerHTML = animeOwned ? colors.map(card).join("") : "";
  $("#htGold").innerHTML = BENJI_HATS.filter(x => x.golden).map(card).join("");
  $("#htFree").innerHTML = BENJI_HATS.filter(x => x.shop && free(x.shop)).map(card).join("");
  $("#htShop").innerHTML = BENJI_HATS.filter(x => x.shop && !free(x.shop)).map(card).join("");
  $("#htGame").innerHTML = BENJI_HATS.filter(x => x.game).map(card).join("");
  // Outfits: "No outfit" first, then the outfit pack
  const wearing = benjiOutfitNow();
  const ocard = o => {
    const open = !o || outfitUnlocked(o), on = o ? wearing && wearing.id === o.id : !wearing;
    const how = !open ? t("In Benji's shop") : on ? t("Wearing it") : t("Tap to wear");
    return `<li><button type="button" class="hat-card ${on ? "on" : ""} ${open ? "" : "locked"}" data-outfit="${o ? o.id : ""}" ${open ? `aria-pressed="${on}"` : `aria-disabled="true"`}>
      <span class="hat-pic">${palSVG("happy", 78, { pose: "rest", sprout: 1, outfit: false, wear: o ? o.id : false })}${open ? "" : `<span class="hat-lock"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/lock.svg#i"/></svg></span>`}</span>
      <strong>${esc(t(o ? o.name : "No outfit"))}</strong><span class="small">${esc(how)}</span></button></li>`;
  };
  $("#htOutfits").innerHTML = [null, ...BENJI_OUTFITS].map(ocard).join("");
  // Supporters can switch the golden sprout off and on
  $("#htGolden").innerHTML = isSupporter() ? `<label class="check"><input type="checkbox" id="htGoldenSwitch" ${settings.goldenSprout !== false ? "checked" : ""}> <span>${esc(t("Golden sprout, a thank-you for your tip"))}</span></label>` : "";
}

function hatsInit() {
  $("#hatsPage").addEventListener("click", e => {
    if (e.target.closest("[data-go-play]")) { $("#hatsPage").close(); openPlay(); return; }
    if (e.target.closest("[data-go-booth]")) { $("#hatsPage").close(); openBooth(); return; }
    const ob = e.target.closest("[data-outfit]");
    if (ob) {
      const o = benjiOutfitItem(ob.dataset.outfit);
      if (o && !outfitUnlocked(o)) { $("#hatsPage").close(); openShop(); return; }
      settings.benjiOutfit = o ? o.id : ""; saveSettings();
      sfx("pop"); buzz(8); renderHats(); renderAll();
      return;
    }
    const b = e.target.closest("[data-hat]"); if (!b) return;
    const id = b.dataset.hat, hat = benjiHat(id);
    if (hat && hat.shop && !hatUnlocked(hat)) { $("#hatsPage").close(); openShop(); return; }
    if (hat && hat.golden && !hatUnlocked(hat)) { toast(t("Open the daily gift on Today. Every 7th gift is a golden hat.")); sfx("tick"); return; }
    if (hat && hat.rescue && !hatUnlocked(hat)) {
      if (!ownsItem(hat.needs)) { $("#hatsPage").close(); openShop(); return; }
      toast(t("Use food in its last 3 days to fill the rescue meter and unlock the {hat}.", { hat: t(hat.name).toLowerCase() })); sfx("tick"); return;
    }
    if (hat && !hatUnlocked(hat)) {
      const badge = BADGES.find(x => x.id === hat.unlock);
      toast(hat.game ? t("Win it in the Play corner: {how}", { how: t(badge.desc) }) : t("Earn the \"{badge}\" badge to unlock this hat.", { badge: t(badge.name) })); sfx("tick");
      return;
    }
    settings.benjiHat = id;
    if (typeof noteHatWorn === "function") noteHatWorn(id);
    saveSettings();
    sfx("pop"); buzz(8);
    renderHats();
    if (typeof checkNewBadges === "function") checkNewBadges();
    renderAll();
  });
  $("#hatsPage").addEventListener("change", e => {
    if (e.target.id !== "htGoldenSwitch") return;
    settings.goldenSprout = e.target.checked; saveSettings(); renderHats(); renderAll();
  });
  $("#badgesPage").addEventListener("click", e => { if (e.target.closest("[data-go-hats]")) { $("#badgesPage").close(); openHats(); } });
  $("#hatsBtn").addEventListener("click", () => { $("#settingsDialog").close(); openHats(); });
}

/* For Benji's hat chatter: how many hats he has, and the next one to win (games first if asked). */
function hatProgress(gamesOnly) {
  const list = BENJI_HATS.filter(h => !h.season && !h.shop && !h.base && (!gamesOnly || h.game));
  const have = list.filter(hatUnlocked);
  const badges = typeof badgeList === "function" ? badgeList() : [];
  const next = list.filter(h => !hatUnlocked(h)).map(h => ({ h, b: badges.find(x => x.id === h.unlock) }))
    .filter(x => x.b).sort((a, b) => (b.b.have / b.b.goal) - (a.b.have / a.b.goal))[0] || null;
  return { have: have.length, total: list.length, next };
}
/* A line where Benji brings up his hats. */
function palHatLine() {
  const p = hatProgress(false), g = hatProgress(true);
  const opts = [];
  if (p.next) {
    opts.push(t("Psst. {how} and I get the {hat}. Just saying.", { how: t(p.next.b.desc).replace(/\.$/, ""), hat: t(p.next.h.name).toLowerCase() }));
    opts.push(t("I have {a} of {b} hats so far. Want to see them?", { a: p.have, b: p.total }));
  } else opts.push(t("You've won me every hat! Want to pick one?"));
  if (g.next) opts.push(t("Games win me hats! {how} for my {hat}.", { how: t(g.next.b.desc).replace(/\.$/, ""), hat: t(g.next.h.name).toLowerCase() }));
  opts.push(t("Did you know I have a hat closet? Tap below to dress me up."));
  return opts[Math.floor(Math.random() * opts.length)];
}

/* Hat a badge unlocks, for the badges page and the "new badge" moment. */
const hatForBadge = id => BENJI_HATS.find(h => h.unlock === id);
