"use strict";
/* Prices and costs. */
function pricePerG(key) {
  if (!key) return null;
  const learned = settings.prices || {};
  for (const k of chain(key)) { const v = learned[k.trim()]; if (v && v.perG) return v.perG; }
  const v = byKey("price", PRICE_KG, key);
  return v != null ? v / 1000 : null;
}
/* Cost of one serving */
function costOf(r) {
  let sum = 0;
  for (const g of r.ingredients) {
    if (g.opt) continue;
    const grams = ingGrams(g, 1);
    if (grams == null) continue;
    const pp = pricePerG(g.key);
    sum += grams * (pp == null ? 0.01 : pp);
  }
  return sum / (r.serves || 4);
}
const fmtMoney = v => new Intl.NumberFormat(locale(), { style: "currency", currency: "USD" }).format(v || 0);
function nutritionLine(r) {
  const n = nutritionOf(r);
  const parts = [t("{n} calories", { n: Math.round(n.cal) }), t("{n} g protein", { n: Math.round(n.protein) }), t("{n} g carbs", { n: Math.round(n.carbs) }),
    t("{n} g fat", { n: Math.round(n.fat) }), t("about {cost}", { cost: fmtMoney(costOf(r)) })];
  return t("Per serving:") + " " + parts.join(" · ") + (n.coverage < 0.7 ? " " + t("(partial estimate)") : "");
}
/* Learn real prices from receipts */
function learnPrice(name, amount, unit, price) {
  const key = canon(name);
  if (!key || !price) return;
  const grams = amount ? gramsOf(amount, unit, key, null) : pkgGrams(key);
  if (!grams) return;
  const perG = price / grams;
  const base = byKey("price", PRICE_KG, key);
  if (base && (perG > base / 1000 * 8 || perG < base / 1000 / 8)) return;   // probably a misread
  settings.prices = settings.prices || {};
  const k = key.trim(), old = settings.prices[k];
  settings.prices[k] = old ? { perG: (old.perG * Math.min(old.n, 3) + perG) / (Math.min(old.n, 3) + 1), n: old.n + 1 } : { perG, n: 1 };
}
/* Estimated cost of what's still on a shopping list */
function listEstimate(list) {
  let total = 0, unknown = 0;
  for (const x of list.items) {
    if (x.done) continue;
    const key = canon(x.name), pp = pricePerG(key);
    if (!key || pp == null) { unknown++; continue; }
    let grams = 0;
    const parts = String(x.amt || "").split("+").map(s => s.trim()).filter(Boolean);
    for (const a of parts) { const p = parseQty(a); const g = p ? gramsOf(p.q, p.unit, key, p.inner) : null; if (g) grams += g; }
    if (!grams) grams = pkgGrams(key) || 300;
    total += grams * pp;
  }
  return { total, unknown };
}
