"use strict";
/* Today's special: a chalkboard on My Food with one recipe picked for today. */
function todaysSpecial() {
  const today = todayStr();
  const seed = Number(today.replace(/-/g, "")) % 97;
  // Rescue first: the food closest to its date that has a recipe
  const urgent = items.filter(i => !i.leftover && canon(i.name)).map(i => ({ i, d: daysLeft(i.expires) }))
    .filter(x => x.d !== null && x.d >= 0 && x.d <= 2).sort((a, b) => a.d - b.d);
  for (const { i } of urgent) {
    const best = recipesUsing(i.name, 3);
    if (best.length) return { title: t("Today's special"), theme: t("Rescue mission"), x: best[seed % best.length],
      why: t("Uses your {name} before it turns.", { name: i.name }) };
  }
  const theme = DAY_SPECIALS[parseDay(today).getDay()];
  const pool = availablePool(), dk = dislikeKeys();
  const list = RECIPES.filter(r => { try { return theme.test(r) && fitsProfile(r, dk); } catch (e) { return false; } })
    .map(r => evaluate(r, pool, settings.diets, householdServings(r) / r.serves))
    .sort((a, b) => a.missing.length - b.missing.length || b.score - a.score).slice(0, 6);
  if (!list.length) return null;
  return { title: t("Today's special"), theme: t(theme.name), x: list[seed % list.length], why: t(theme.why) };
}
function renderSpecial() {
  const box = $("#todaySpecial");
  if (!box) return;
  const s = todaysSpecial();
  if (!s) { box.innerHTML = ""; return; }
  const r = s.x.recipe;
  const need = items.length ? (s.x.missing.length ? tn(s.x.missing.length, "need 1 thing", "need {n} things") : t("you have everything")) : "";
  box.innerHTML = `<a class="chalkboard" href="#/recipe/${esc(recipeId(r))}">
    <span class="cb-title">${esc(s.title)}</span>
    <span class="cb-row">${recipeArt(r, "cb-art")}<span class="cb-text"><span class="cb-theme">${esc(s.theme)}</span>
      <strong class="cb-name">${esc(rName(r))}</strong><span class="cb-why">${esc(s.why)}</span>
      <span class="cb-meta">${esc([t("{n} min", { n: r.time }), need].filter(Boolean).join(", "))}</span></span></span></a>`;
}
