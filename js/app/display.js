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
  $("#langBtn").textContent = LANG === "es" ? "EN" : "ES";
  $("#langBtn").setAttribute("aria-label", LANG === "es" ? "Switch to English" : "Cambiar a español");
  $("#langSelect").value = LANG;
  const tf = $("#typeFilter"), cur = tf.value;
  tf.innerHTML = `<option value="">${esc(t("All meals"))}</option>` + MEAL_TYPES.filter(m => RECIPES.some(r => r.type === m)).map(m => `<option value="${m}">${esc(t(m))}</option>`).join("");
  tf.value = cur;
  RECIPES.forEach(r => { if (!r.search.includes(norm(t(r.type)).trim())) r.search += " " + t(r.type).toLowerCase(); });
  renderDietSummary();
  if (typeof setPageTitle === "function") setPageTitle(document.body.dataset.tab || "pantry");
  renderAll();
  syncForReminders();
}
function applyDisplay() {
  document.body.classList.toggle("large-text", !!settings.largeText);
  document.body.classList.toggle("high-contrast", !!settings.highContrast);
}
