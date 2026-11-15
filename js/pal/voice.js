"use strict";
/* Picking what Pal says from data/pal/voice-en.js and voice-es.js. */
function palLines(key) {
  const es = LANG === "es" && typeof PAL_VOICE_ES !== "undefined" ? PAL_VOICE_ES[key] : null;
  return es || PAL_VOICE_EN[key] || [];
}
function palPick(key, vars) {
  const list = palLines(key);
  if (!list.length) return "";
  let s = list[Math.floor(Math.random() * list.length)];
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
  return s;
}
/* Same line all day for a given key, so Pal doesn't change its mind every time you switch tabs. */
function palDaily(key) {
  const list = palLines(key);
  if (!list.length) return "";
  const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  return list[day % list.length];
}
function palTimeOfDay() {
  const h = new Date().getHours();
  return h >= 5 && h < 11 ? "morning" : h < 17 ? "afternoon" : h < 22 ? "evening" : "night";
}
