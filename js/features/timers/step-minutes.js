"use strict";
/* Finds the cooking time in a recipe step so cook mode can offer a timer for it. */
/* "simmer 25 to 30 minutes" -> 30; "1 1/2 hours" -> 90; returns minutes or null */
function stepMinutes(text) {
  const s = String(text).toLowerCase();
  let m = s.match(/(\d+(?:\s+\d\/\d)?|\d\/\d)\s*(?:(?:to|a)\s*(\d+(?:\s+\d\/\d)?))?\s*(?:hours?|horas?)/);
  if (m) return Math.round((parseAmt(m[2] || m[1]) || 0) * 60) || null;
  if (/hora y media|1 hour and a half/.test(s)) return 90;
  m = s.match(/(\d+)\s*(?:(?:to|a)\s*(\d+))?\s*(?:minutes?|minutos?|min)\b/);
  if (m) return Number(m[2] || m[1]) || null;
  return null;
}
