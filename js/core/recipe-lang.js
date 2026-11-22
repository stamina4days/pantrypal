"use strict";
/* Recipe text helpers. */
const rName = r => r.name;
const rSteps = r => r.steps;
function ingName(g) { return g.name; }
function ingLabel(g, f) {
  return [scaleAmt(g.amt, f), g.name].filter(Boolean).join(" ");
}
const amtDisplay = (amt, f) => scaleAmt(amt, f);
