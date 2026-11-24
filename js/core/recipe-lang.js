"use strict";
/* Every recipe name, step, and ingredient goes through these helpers rather than being read directly.
   They're thin today because the app is English only, but they're the one place a translation would plug in. */
const rName = r => r.name;
const rSteps = r => r.steps;
function ingName(g) { return g.name; }
function ingLabel(g, f) {
  return [scaleAmt(g.amt, f), g.name].filter(Boolean).join(" ");
}
const amtDisplay = (amt, f) => scaleAmt(amt, f);
