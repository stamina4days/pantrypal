"use strict";
/* Reading aloud and keeping the screen on. */
/* ---------- cook mode and voice ---------- */
let cook = null, wakeLock = null;
function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG === "es" ? "es-US" : "en-US";
    speechSynthesis.speak(u);
  } catch (e) {}
}
async function keepAwake(on) {
  try {
    if (on && "wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen");
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) {}
}
