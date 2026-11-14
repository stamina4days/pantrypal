"use strict";
/* Language switching and the t() helper. */
/* Interface text in Spanish. English text is the key; anything missing falls back to English.
   Machine translation: have a fluent speaker review before relying on it. */
let LANG = "en";
const I18N_MISSING = new Set();

function t(s, vars) {
  let out = s;
  if (LANG === "es") {
    if (s in I18N_ES) out = I18N_ES[s];
    else I18N_MISSING.add(s);
  } else if (typeof I18N_EN !== "undefined" && s in I18N_EN) out = I18N_EN[s];
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  return out;
}
