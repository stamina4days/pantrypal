"use strict";
/* Help putting Pantry Pal on the home screen. On Android, Chrome can do it in one tap;
   on iPhone it takes three taps in Safari, shown with pictures. */
let installPrompt = null, hsPhone = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; });
window.addEventListener("appinstalled", () => { installPrompt = null; settings.installed = true; saveSettings(); renderPageExtras(); });

function isInstalled() {
  return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true || !!settings.installed;
}
function phoneKind() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "iphone";
  if (/Android/.test(ua)) return "android";
  return "other";
}
const HS_STEPS = {
  iphone: [
    ["img/install/iphone-share.svg", "Open Pantry Pal in Safari, then tap the Share button at the bottom of the screen. It's a square with an arrow pointing up."],
    ["img/install/iphone-add.svg", "Scroll down a little and tap \"Add to Home Screen.\""],
    ["img/install/done.svg", "Tap \"Add\" in the top corner. Benji's icon shows up on your home screen."]
  ],
  android: [
    ["img/install/android-menu.svg", "In Chrome, tap the three dots in the top corner."],
    ["img/install/android-add.svg", "Tap \"Add to Home screen\" or \"Install app.\""],
    ["img/install/done.svg", "Tap \"Install\" or \"Add.\" Benji's icon shows up on your home screen."]
  ]
};
function openHomeScreen() {
  const k = phoneKind();
  hsPhone = k === "other" ? "iphone" : k;
  renderHomeScreen();
  $("#homeScreenPage").showModal();
}
function renderHomeScreen() {
  const done = isInstalled();
  $("#hsInstalled").classList.toggle("hidden", !done);
  $("#hsInstallBtn").classList.toggle("hidden", done || !installPrompt);
  $$("#hsWhich button").forEach(b => { const on = b.dataset.phone === hsPhone; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  $("#hsSteps").innerHTML = HS_STEPS[hsPhone].map(([img, text]) =>
    `<li class="install-step"><img src="${img}" width="110" height="143" alt=""><p>${esc(t(text))}</p></li>`).join("");
}
async function installNow() {
  if (!installPrompt) return;
  installPrompt.prompt();
  try { const r = await installPrompt.userChoice; if (r.outcome === "accepted") { settings.installed = true; saveSettings(); } } catch (e) {}
  installPrompt = null;
  renderHomeScreen();
}
/* A friendly nudge on My Food, once you've used the app on two different days. */
function installNudgeHtml() {
  if (isInstalled() || settings.installNudgeOff || phoneKind() === "other") return "";
  const days = (settings.streak && (settings.streak.best || settings.streak.n)) || 0;
  if (!oneNudge("install", days >= 2 || (settings.counts && settings.counts.daysUsed >= 2))) return "";
  return palBubble("wink", t("Want me on your home screen? I'll open like a real app, with my own icon."),
    [{ attrs: 'data-hs="show" class="primary"', label: t("Show me how") }, { attrs: 'data-hs="later"', label: t("Not now") }], "install-nudge");
}
function homeScreenInit() {
  segment("#hsWhich", "phone", v => { hsPhone = v; renderHomeScreen(); });
  $("#hsInstallBtn").addEventListener("click", installNow);
  $("#homeScreenBtn").addEventListener("click", () => { $("#settingsDialog").close(); openHomeScreen(); });
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-hs]");
    if (!b) return;
    if (b.dataset.hs === "show") openHomeScreen();
    else { settings.installNudgeOff = true; saveSettings(); renderPageExtras(); toast(t("No problem. It's in Settings any time.")); }
  });
}
