"use strict";
/* Nutrition as market tags. */
/* ---------- nutrition as little market tags ---------- */
function nutritionHtml(r) {
  const n = nutritionOf(r);
  const box = (v, l) => `<span class="nbox"><strong>${esc(v)}</strong><span>${esc(l)}</span></span>`;
  return `<div class="nboxes">${box(Math.round(n.cal), t("calories"))}${box(Math.round(n.protein) + " g", t("protein"))}${box(Math.round(n.carbs) + " g", t("carbs"))}${box(Math.round(n.fat) + " g", t("fat"))}${box(fmtMoney(costOf(r)), t("per serving"))}</div>`
    + `<p class="muted small">${esc(n.coverage < 0.7 ? t("Rough estimate per serving.") : t("Estimate per serving."))}</p>`;
}
