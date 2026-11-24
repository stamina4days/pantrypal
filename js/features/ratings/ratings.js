"use strict";
/* Thumbs up and down on recipes. The planner picks thumbs-up recipes more often and skips thumbs-down ones. */
function renderRating() {
  if (!openResult) return;
  const v = (settings.ratings || {})[openResult.recipe.name] || 0;
  $$(".rate-btn").forEach(b => { const on = Number(b.dataset.rate) === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
}
function rate(v) {
  const n = openResult.recipe.name;
  settings.ratings = settings.ratings || {};
  if (settings.ratings[n] === v) delete settings.ratings[n]; else settings.ratings[n] = v;
  saveSettings();
  renderRating();
  if (settings.ratings[n] === -1) toast(t("Got it. We won't suggest this one."));
  else if (settings.ratings[n] === 1) toast(t("Noted. You'll see this one more often."));
}
