"use strict";
/* Recipe text in the current language. */
/* ---------- language helpers for recipes ---------- */
const rName = r => (LANG === "es" && r.es && r.es.name) || r.name;
const rSteps = r => (LANG === "es" && r.es && r.es.steps) || r.steps;
function ingName(g, r) {
  return LANG === "es" && !(r && r.mine) ? (ING_ES[g.name.toLowerCase()] || g.name) : g.name;
}
/* Returns [translatedAmount, needsDe, sizeWord] */
function amtParts(amt) {
  if (LANG !== "es" || !amt) return [amt, false, ""];
  let size = "", unit = false;
  const a = amt.replace(/[A-Za-z]+/g, w => {
    const lw = w.toLowerCase();
    if (SIZE_ES[lw]) { size = SIZE_ES[lw]; return ""; }
    if (UNIT_ES[lw]) { unit = true; return UNIT_ES[lw]; }
    return w;
  }).replace(/\s+/g, " ").trim();
  return [a, unit || /^\d+\/\d+$/.test(a), size];
}
function ingLabel(g, f, r) {
  const amt = scaleAmt(g.amt, f);
  if (LANG !== "es" || (r && r.mine)) return [amt, g.name].filter(Boolean).join(" ");
  const name = ingName(g, r);
  if (!amt) return name;
  const [a, de, size] = amtParts(amt);
  return `${a} ${de ? "de " : ""}${name}${size ? " " + size : ""}`;
}
const amtDisplay = (amt, f) => amtParts(scaleAmt(amt, f))[0];
