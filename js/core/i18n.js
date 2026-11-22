"use strict";
/* Language switching and the t() helper. */
/* English only for now. English text is the key. data/lang/en holds the casual and plain-word
   versions. A new language can plug in here later. */
const LANG = "en";

function t(s, vars) {
  let out = s;
  if (typeof I18N_EN !== "undefined" && s in I18N_EN) out = I18N_EN[s];
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  return out;
}
