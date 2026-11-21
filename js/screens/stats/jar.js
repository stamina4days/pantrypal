"use strict";
/* Waste Less as a jar that fills with the food you saved, instead of a percentage. */
function savingsJarHtml(saved, total) {
  const n = saved.length, show = saved.slice(-15);
  const per = 3, size = 46, x0 = 32, yBottom = 236;
  const stickers = show.map((e, i) => {
    const row = Math.floor(i / per), col = i % per;
    const x = x0 + col * 44 + (row % 2 ? 16 : 0);
    const y = yBottom - (row + 1) * 38;
    const rot = ((i * 37) % 30) - 15;
    return `<image href="img/food/${foodStickerName(e.name)}.svg" x="${Math.min(x, 124)}" y="${y}" width="${size}" height="${size}" transform="rotate(${rot} ${Math.min(x, 124) + 23} ${y + 23})"/>`;
  }).join("");
  const pct = total ? Math.round(n / total * 100) : 0;
  const mood = pct >= 80 ? t("Your jar is filling up fast!") : pct >= 50 ? t("Good saving! Keep filling the jar.") : n ? t("Every food in the jar is one that didn't go to waste.") : t("Use food before its date and it lands in your jar.");
  return `<div class="jar-card">
    <svg class="jar" viewBox="0 0 200 250" role="img" aria-label="${esc(tn(n, "1 food saved", "{n} foods saved"))}">
      <defs><clipPath id="jarIn"><path d="M36 58h128c8 0 12 6 12 14v146c0 12-8 20-20 20H44c-12 0-20-8-20-20V72c0-8 4-14 12-14z"/></clipPath></defs>
      <path d="M36 58h128c8 0 12 6 12 14v146c0 12-8 20-20 20H44c-12 0-20-8-20-20V72c0-8 4-14 12-14z" class="jar-glass"/>
      <g clip-path="url(#jarIn)">${stickers}</g>
      <path d="M36 58h128c8 0 12 6 12 14v146c0 12-8 20-20 20H44c-12 0-20-8-20-20V72c0-8 4-14 12-14z" class="jar-edge"/>
      <path d="M40 90c-4 30-4 80 0 120" class="jar-shine"/>
      <rect x="30" y="34" width="140" height="26" rx="8" class="jar-lid"/>
      <rect x="46" y="86" width="108" height="34" rx="6" class="jar-label"/>
      <text x="100" y="110" text-anchor="middle" class="jar-label-text"${t("Saved").length > 7 ? ' textLength="92" lengthAdjust="spacingAndGlyphs"' : ""}>${esc(t("Saved"))}</text>
    </svg>
    <p class="jar-count">${esc(tn(n, "1 food saved", "{n} foods saved"))}</p>
    <p class="jar-say">${esc(mood)}</p>
    <p class="muted small full-only">${esc(t("{p}% of your food was eaten in time", { p: pct }))}</p>
  </div>`;
}
