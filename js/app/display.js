"use strict";
/* Puts the right words on the page (the data-t labels) and applies the display settings: text size, simple or full view, and high contrast. */
function applyLang() {
  document.documentElement.lang = LANG;
  $$("[data-t]").forEach(el => {
    if (!el.dataset.k) el.dataset.k = el.textContent.trim();
    el.textContent = t(el.dataset.k);
  });
  $$("[data-t-ph]").forEach(el => { el.placeholder = t(el.dataset.tPh); });
  $$("[data-t-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.tAria)); });
  const tf = $("#typeFilter"), cur = tf.value;
  tf.innerHTML = `<option value="">${esc(t("All meals"))}</option>` + MEAL_TYPES.filter(m => RECIPES.some(r => r.type === m)).map(m => `<option value="${m}">${esc(t(m))}</option>`).join("");
  tf.value = cur;
  RECIPES.forEach(r => { if (!r.search.includes(norm(t(r.type)).trim())) r.search += " " + t(r.type).toLowerCase(); });
  renderDietSummary();
  if (typeof setPageTitle === "function") setPageTitle(document.body.dataset.tab || "today");
  renderAll();
  syncForReminders();
  applyDisplay();
}
/* Text size: Regular, Large, or Extra large. The whole app grows with it. */
function textSizeNow() { return settings.textSize || (settings.largeText ? "large" : "normal"); }
function setTextSize(v) {
  settings.textSize = v; settings.largeText = v !== "normal"; saveSettings(); applyDisplay();
}
function applyDisplay() {
  const ts = textSizeNow();
  ["large", "xl"].forEach(s => document.documentElement.classList.toggle("text-" + s, ts === s));
  document.body.classList.toggle("large-text", ts !== "normal");
  document.body.classList.toggle("high-contrast", !!settings.highContrast);
  document.body.classList.toggle("simple", settings.view !== "full");
  const vt = document.getElementById("viewToggle");
  if (vt) vt.textContent = settings.view === "full" ? t("Keep it simple") : t("Show me everything");
  const vs = document.getElementById("viewSimple");
  if (vs) vs.checked = settings.view !== "full";
}
function setView(v) {
  settings.view = v; saveSettings(); applyDisplay();
  toast(v === "full" ? t("Everything's showing now. Settings can make it simple again.") : t("Nice and simple. You can show everything again any time."));
}
