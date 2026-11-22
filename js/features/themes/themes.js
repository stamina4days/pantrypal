"use strict";
/* Kitchen themes: new looks for every room, from the theme pack in Benji's shop.
   The look itself lives in css/themes/kitchen-themes.css, keyed off a class on <body>. */
const KITCHEN_THEMES = [
  { id: "", name: "Classic kitchen", swatch: ["#F1E3CC", "#C98F5A", "#E2CDB4"] },
  { id: "diner", name: "Diner", shop: "themes", swatch: ["#BFE6DC", "#D93B30", "#2A2A2A"] },
  { id: "cabin", name: "Log cabin", shop: "themes", swatch: ["#B07A45", "#5A3A20", "#8E2F25"] },
  { id: "beach", name: "Beach shack", shop: "themes", swatch: ["#56C8CE", "#F2A65A", "#EED9A8"] },
  { id: "space", name: "Space station", shop: "themes", swatch: ["#3C4858", "#9AA7B6", "#222A34"] }
];
const themeOpen = th => !th.shop || (typeof ownsItem === "function" && ownsItem(th.shop));

/* Put the chosen theme on the page, if it's yours. */
function applyKitchenTheme() {
  const th = KITCHEN_THEMES.find(x => x.id === (settings.kitchenTheme || "")) || KITCHEN_THEMES[0];
  const id = themeOpen(th) ? th.id : "";
  document.body.className = document.body.className.replace(/\btheme-\S+/g, "").trim();
  if (id) document.body.classList.add("theme-" + id);
  renderThemePick();
}

/* A mini kitchen in a theme, drawn with that theme's own colors and wall piece (the same one Benji's shop shows) */
function themeMiniHTML(id) {
  return `<span class="tp-frame" aria-hidden="true"><span class="tp-mini theme-${id || "classic"}"><span class="tp-fridge"></span><span class="tp-decor">${id === "diner" ? "EAT" : ""}</span>
    <span class="tp-benji">${palSVG("happy", 92, { pose: "wave", sprout: 1 })}</span><span class="tp-console"><i></i><b></b><span>${esc(t("Play"))}</span></span>
    <span class="tp-counter"></span><span class="tp-floor"></span></span></span>`;
}
let themePickObserver = null;
function renderThemePick() {
  const box = document.getElementById("themePick"); if (!box) return;
  const cur = settings.kitchenTheme || "";
  box.innerHTML = KITCHEN_THEMES.map(th => {
    const open = themeOpen(th), on = open && th.id === cur;
    return `<button type="button" data-theme="${th.id}" aria-pressed="${on}" class="${on ? "on" : ""} ${open ? "" : "locked"}">
      <span class="theme-pic">${themeMiniHTML(th.id)}${open ? "" : `<span class="theme-lock"><svg class="ic" aria-hidden="true"><use href="img/icons/ui/lock.svg#i"/></svg></span>`}</span>
      <span>${esc(t(th.name))}</span></button>`;
  }).join("");
  const fit = () => box.querySelectorAll(".tp-frame").forEach(f => { if (f.clientWidth) f.style.setProperty("--tp-s", (f.clientWidth / 240).toFixed(4)); });
  fit();
  if (!themePickObserver && typeof ResizeObserver === "function") { themePickObserver = new ResizeObserver(fit); themePickObserver.observe(box); }
}

function themesInit() {
  applyKitchenTheme();
  document.getElementById("themePick").addEventListener("click", e => {
    const b = e.target.closest("[data-theme]"); if (!b) return;
    const th = KITCHEN_THEMES.find(x => x.id === b.dataset.theme);
    if (!themeOpen(th)) { toast(t("Kitchen themes are in Benji's shop.")); $("#settingsDialog").close(); openShop(); return; }
    settings.kitchenTheme = th.id; saveSettings();
    applyKitchenTheme(); sfx("pop"); buzz(8);
  });
}
