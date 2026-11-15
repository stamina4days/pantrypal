"use strict";
/* Amounts and fractions. */
/* ---------- amounts ---------- */
const fmtNum = n => String(Math.round(n * 100) / 100);
const hasAmount = i => typeof i.amount === "number" && !isNaN(i.amount);
function amountText(i) { return hasAmount(i) ? (fmtNum(i.amount) + " " + (i.unit || "")).trim() : (i.unit || ""); }
/* "3" -> 3, "1/2" -> 0.5, "1 1/2" -> 1.5, anything with a unit -> null */
function parseAmt(s) {
  s = String(s || "").trim();
  if (!/^(\d+(\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)$/.test(s)) return null;
  return s.split(/\s+/).reduce((tot, p) => tot + (p.includes("/") ? Number(p.split("/")[0]) / Number(p.split("/")[1]) : Number(p)), 0);
}
function fmtFrac(v) {
  if (v <= 0) return "0";
  const whole = Math.floor(v + 1e-9), fr = v - whole;
  const opts = [[0, ""], [0.125, "1/8"], [0.25, "1/4"], [1 / 3, "1/3"], [0.5, "1/2"], [2 / 3, "2/3"], [0.75, "3/4"], [1, ""]];
  let best = opts[0];
  for (const o of opts) if (Math.abs(fr - o[0]) < Math.abs(fr - best[0])) best = o;
  const w = whole + (best[0] === 1 ? 1 : 0);
  return w && best[1] ? `${w} ${best[1]}` : w ? String(w) : (best[1] || "1/8");
}
/* Scale the number at the start of an amount: "1 1/2 cups" x2 -> "3 cups" */
function scaleAmt(amt, f) {
  if (!amt || Math.abs(f - 1) < 1e-9) return amt;
  const m = amt.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(.*)$/);
  return m ? fmtFrac(parseAmt(m[1]) * f) + m[2] : amt;
}
