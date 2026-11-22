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
      : b ? t("{badge} badge: {a} of {b}", { badge: t(b.name), a: Math.min(b.have, b.goal), b: b.goal }) : "";
    return `<li><button type="button" class="hat-card ${on ? "on" : ""} ${open ? "" : "locked"}" data-hat="${hat.id}" ${open ? `aria-pressed="${on}"` : `aria-disabled="true"`}>
      <span class="hat-pic">${palSVG("happy", 78, { hat: hat.id, pose: "rest", sprout: 1 })}${open ? "" : `<span class="hat-lock"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/lock.svg#i"/></svg></span>`}</span>
      <strong>${esc(t(hat.name))}</strong><span class="small">${esc(how)}</span>
      ${!open && b ? `<span class="small muted">${esc(t(b.desc))}</span>` : ""}
    </button></li>`;
  };
  $("#htSeason").innerHTML = BENJI_HATS.filter(x => x.season).map(card).join("");
  $("#htEarn").innerHTML = BENJI_HATS.filter(x => !x.season).map(card).join("");
}

function hatsInit() {
  $("#hatsPage").addEventListener("click", e => {
    const b = e.target.closest("[data-hat]"); if (!b) return;
    const id = b.dataset.hat, hat = benjiHat(id);
    if (hat && !hatUnlocked(hat)) {
      const badge = BADGES.find(x => x.id === hat.unlock);
      toast(t("Earn the \"{badge}\" badge to unlock this hat.", { badge: t(badge.name) })); sfx("tick");
      return;
    }
    settings.benjiHat = id; saveSettings();
    sfx("pop"); buzz(8);
    renderHats();
    renderAll();
  });
  $("#badgesPage").addEventListener("click", e => { if (e.target.closest("[data-go-hats]")) { $("#badgesPage").close(); openHats(); } });
  $("#hatsBtn").addEventListener("click", () => { $("#settingsDialog").close(); openHats(); });
}

/* Hat a badge unlocks, for the badges page and the "new badge" moment. */
const hatForBadge = id => BENJI_HATS.find(h => h.unlock === id);
