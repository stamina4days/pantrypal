"use strict";
/* Language and display settings. */
/* ---------- language and display ---------- */
function applyLang() {
  LANG = settings.lang === "es" ? "es" : "en";
  document.documentElement.lang = LANG;
  $$("[data-t]").forEach(el => {
    if (!el.dataset.k) el.dataset.k = el.textContent.trim();
    el.textContent = t(el.dataset.k);
  });
  $$("[data-t-ph]").forEach(el => { el.placeholder = t(el.dataset.tPh); });
  $$("[data-t-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.tAria)); });
  $("#langBtn").innerHTML = `<span class="lang-code">${LANG === "es" ? "EN" : "ES"}</span><span class="btn-label">${LANG === "es" ? "English" : "Español"}</span>`;
  $("#langBtn").setAttribute("aria-label", LANG === "es" ? "Switch to English" : "Cambiar a español");
  $("#langSelect").value = LANG;
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
function applyDisplay() {
  document.body.classList.toggle("large-text", !!settings.largeText);
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
